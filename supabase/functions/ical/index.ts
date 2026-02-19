import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    const token = lastPart.endsWith(".ics")
      ? lastPart.slice(0, -4)
      : url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token - use /ical/{token}.ics format", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const headers = { Authorization: `Bearer ${serviceKey}`, apikey: anonKey };

    const exportResp = await fetch(
      `${supabaseUrl}/rest/v1/apartment_ical_exports?export_token=eq.${token}&is_active=eq.true&select=apartment_id`,
      { headers }
    );
    const exports = await exportResp.json();

    if (!exports || exports.length === 0) {
      return new Response("Invalid or inactive export token", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const apartmentId = exports[0].apartment_id;

    const [bookingsResp, availResp, aptResp] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/bookings?apartment_id=eq.${apartmentId}&status=in.(confirmed,checked_in)&select=id,check_in_date,check_out_date,guest_name,booking_reference,booking_source`,
        { headers }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/apartment_availability?apartment_id=eq.${apartmentId}&status=in.(booked,blocked)&select=date,status,booking_reference,notes`,
        { headers }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/apartments?id=eq.${apartmentId}&select=title`,
        { headers }
      ),
    ]);

    const bookings = await bookingsResp.json();
    const availability = await availResp.json();
    const apartments = await aptResp.json();
    const aptName = apartments?.[0]?.title || `Apartment ${apartmentId.slice(0, 8)}`;

    const ical = generateICalendar(bookings || [], availability || [], aptName);

    return new Response(ical, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="bond-${encodeURIComponent(aptName)}.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in ical export:", message);
    return new Response(message || "Internal server error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});

function generateICalendar(
  bookings: Record<string, string | null>[],
  availability: Record<string, string | null>[],
  calName: string
): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let events = "";

  const bookingIds = new Set<string>();
  for (const booking of bookings) {
    bookingIds.add(booking.id as string);
    const uid = `booking-${booking.id}@bond-coliving.com`;
    const dtstart = (booking.check_in_date as string).replace(/-/g, "");
    const dtend = (booking.check_out_date as string).replace(/-/g, "");
    const summary = booking.guest_name ? `Booked - ${booking.guest_name}` : "Booked";
    const desc = `Ref: ${booking.booking_reference || "N/A"}`;

    events +=
      `BEGIN:VEVENT\r\n` +
      `UID:${uid}\r\n` +
      `DTSTAMP:${timestamp}\r\n` +
      `DTSTART;VALUE=DATE:${dtstart}\r\n` +
      `DTEND;VALUE=DATE:${dtend}\r\n` +
      `SUMMARY:${summary}\r\n` +
      `DESCRIPTION:${desc}\r\n` +
      `STATUS:CONFIRMED\r\n` +
      `TRANSP:OPAQUE\r\n` +
      `END:VEVENT\r\n`;
  }

  const blockedDates = (availability as Record<string, string | null>[])
    .filter((a) => {
      const status = a.status;
      return status === "booked" || status === "blocked";
    })
    .map((a) => a.date as string)
    .sort();

  if (blockedDates.length > 0) {
    const ranges: { start: string; end: string }[] = [];
    let currentStart = blockedDates[0];
    let currentEnd = blockedDates[0];

    for (let i = 1; i < blockedDates.length; i++) {
      const date = blockedDates[i];
      const prevDate = new Date(currentEnd);
      const currDate = new Date(date);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentEnd = date;
      } else {
        ranges.push({ start: currentStart, end: addDays(currentEnd, 1) });
        currentStart = date;
        currentEnd = date;
      }
    }
    ranges.push({ start: currentStart, end: addDays(currentEnd, 1) });

    for (const range of ranges) {
      const uid = `blocked-${range.start}-${range.end}@bond-coliving.com`;
      const dtstart = range.start.replace(/-/g, "");
      const dtend = range.end.replace(/-/g, "");

      events +=
        `BEGIN:VEVENT\r\n` +
        `UID:${uid}\r\n` +
        `DTSTAMP:${timestamp}\r\n` +
        `DTSTART;VALUE=DATE:${dtstart}\r\n` +
        `DTEND;VALUE=DATE:${dtend}\r\n` +
        `SUMMARY:Not Available\r\n` +
        `DESCRIPTION:Blocked on Bond\r\n` +
        `STATUS:CONFIRMED\r\n` +
        `TRANSP:OPAQUE\r\n` +
        `END:VEVENT\r\n`;
    }
  }

  return (
    `BEGIN:VCALENDAR\r\n` +
    `VERSION:2.0\r\n` +
    `PRODID:-//Bond Coliving//Apartment Calendar//EN\r\n` +
    `CALSCALE:GREGORIAN\r\n` +
    `METHOD:PUBLISH\r\n` +
    `X-WR-CALNAME:${calName}\r\n` +
    `X-WR-TIMEZONE:Atlantic/Madeira\r\n` +
    `${events}` +
    `END:VCALENDAR\r\n`
  );
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}
