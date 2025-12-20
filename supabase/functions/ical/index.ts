import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    const token = lastPart.endsWith(".ics") ? lastPart.slice(0, -4) : url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token - use /ical/{token}.ics format", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const exportResp = await fetch(
      `${supabaseUrl}/rest/v1/apartment_ical_exports?export_token=eq.${token}&is_active=eq.true&select=apartment_id`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: anonKey } }
    );

    const exports = await exportResp.json();
    if (!exports || exports.length === 0) {
      return new Response("Invalid or inactive export token", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const apartmentId = exports[0].apartment_id;

    const bookingsResp = await fetch(
      `${supabaseUrl}/rest/v1/bookings?apartment_id=eq.${apartmentId}&status=in.(confirmed,checked_in)&select=*`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: anonKey } }
    );
    const bookings = await bookingsResp.json();

    const availResp = await fetch(
      `${supabaseUrl}/rest/v1/apartment_availability?apartment_id=eq.${apartmentId}&status=in.(booked,blocked)&select=*`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: anonKey } }
    );
    const availability = await availResp.json();

    const ical = generateICalendar(bookings, availability, apartmentId);

    return new Response(ical, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="bond-apartment-${apartmentId}.ics"`,
      },
    });
  } catch (error: any) {
    console.error("Error in ical export:", error);
    return new Response(error.message || "Internal server error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});

function generateICalendar(bookings: any[], availability: any[], apartmentId: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let events = "";

  for (const booking of bookings) {
    const uid = `booking-${booking.id}@bond-coliving.com`;
    const dtstart = booking.check_in_date.replace(/-/g, "");
    const dtend = booking.check_out_date.replace(/-/g, "");
    const summary = booking.guest_name ? `Booked - ${booking.guest_name}` : "Booked";
    const description = `Booking Reference: ${booking.booking_reference || "N/A"}\\nSource: ${booking.booking_source}`;

    events += `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${timestamp}\r\nDTSTART;VALUE=DATE:${dtstart}\r\nDTEND;VALUE=DATE:${dtend}\r\nSUMMARY:${summary}\r\nDESCRIPTION:${description}\r\nSTATUS:CONFIRMED\r\nTRANSP:OPAQUE\r\nEND:VEVENT\r\n`;
  }

  const blockedDates = availability
    .filter((a: any) => a.status === "booked" || a.status === "blocked")
    .map((a: any) => a.date)
    .sort();

  const ranges: { start: string; end: string }[] = [];
  let currentStart = "";
  let currentEnd = "";

  for (let i = 0; i < blockedDates.length; i++) {
    const date = blockedDates[i];
    if (!currentStart) {
      currentStart = date;
      currentEnd = date;
    } else {
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
  }

  if (currentStart) {
    ranges.push({ start: currentStart, end: addDays(currentEnd, 1) });
  }

  for (const range of ranges) {
    const uid = `blocked-${range.start}-${range.end}@bond-coliving.com`;
    const dtstart = range.start.replace(/-/g, "");
    const dtend = range.end.replace(/-/g, "");

    events += `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${timestamp}\r\nDTSTART;VALUE=DATE:${dtstart}\r\nDTEND;VALUE=DATE:${dtend}\r\nSUMMARY:Blocked\r\nDESCRIPTION:Manually blocked dates\r\nSTATUS:CONFIRMED\r\nTRANSP:OPAQUE\r\nEND:VEVENT\r\n`;
  }

  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Bond Coliving//Apartment Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Bond Apartment ${apartmentId}\r\nX-WR-TIMEZONE:Europe/London\r\n${events}END:VCALENDAR\r\n`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}