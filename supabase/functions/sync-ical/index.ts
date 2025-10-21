import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ICalEvent = {
  uid: string;
  summary?: string;
  status?: string; // e.g. CANCELLED
  dtstart: { raw: string; params: Record<string, string> };
  dtend: { raw: string; params: Record<string, string> };
};

type Feed = {
  id: string;
  feed_name: string;
  ical_url: string;
  apartment_id: string;
  is_active: boolean;
  // optional: timezone column on your feed or apartment. Default to Europe/London if not present.
  timezone?: string | null;
};

const DEFAULT_TZ = "Europe/London";

/**
 * Unfold ICS content (RFC5545 3.1) by joining lines that start with space or tab.
 */
function unfoldICS(text: string): string[] {
  const raw = text.split(/\r?\n/);
  const lines: string[] = [];
  for (const line of raw) {
    if (/^[ \t]/.test(line) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

/**
 * Parse a property line into { name, params, value }.
 * Example: "DTSTART;TZID=Europe/London:20250329T150000"
 */
function parseProp(line: string): { name: string; params: Record<string, string>; value: string } | null {
  const m = line.match(/^([A-Z-]+)(;[^:]+)?:([\s\S]*)$/);
  if (!m) return null;
  const name = m[1];
  const paramsStr = m[2] || "";
  const value = m[3].trim();

  const params: Record<string, string> = {};
  if (paramsStr) {
    // paramsStr looks like ";KEY=VAL;KEY2=VAL2"
    for (const seg of paramsStr.split(";")) {
      if (!seg) continue;
      const [k, v] = seg.split("=");
      if (k && v) params[k.toUpperCase()] = v;
    }
  }
  return { name, params, value };
}

/**
 * Format a Date instant in a timezone to "YYYY-MM-DD" using Intl.
 */
function formatDateInTZ(d: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  // en-CA yields "YYYY-MM-DD"
  return fmt.format(d);
}

/**
 * Convert an ICS date or datetime value to a local calendar date string "YYYY-MM-DD".
 * Rules:
 * - VALUE=DATE => just the YYYYMMDD value.
 * - Datetime ending with Z => interpret as UTC instant and convert to target timezone date.
 * - Datetime with TZID => the calendar day is the literal day in that TZ, so return its Y-M-D.
 * - Datetime with no TZID and no Z (floating) => treat as defaultTz local time and return its Y-M-D.
 */
function icsValueToLocalDate(value: string, params: Record<string, string>, defaultTz: string): string {
  // All-day date
  const dateOnly = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return `${y}-${m}-${d}`;
  }

  // Datetime, maybe with seconds
  const dt = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!dt) {
    // Fallback: try to take first 8 as date
    const maybe = value.slice(0, 8);
    if (/^\d{8}$/.test(maybe)) {
      return `${maybe.slice(0, 4)}-${maybe.slice(4, 6)}-${maybe.slice(6, 8)}`;
    }
    throw new Error(`Unrecognised ICS date value: ${value}`);
  }

  const [, y, m, d, hh, mm, ss, z] = dt;
  const tzid = params["TZID"];
  const yN = Number(y), mN = Number(m) - 1, dN = Number(d);
  const hhN = Number(hh), mmN = Number(mm), ssN = Number(ss);

  if (z === "Z") {
    // UTC instant -> convert to target timezone date
    const asUtc = new Date(Date.UTC(yN, mN, dN, hhN, mmN, ssN));
    return formatDateInTZ(asUtc, tzid || defaultTz);
  }

  // No Z. If TZID present, the calendar date is as written in that TZ.
  // We only need the day bucket, so return Y-M-D from the literal value.
  // If there is no TZID (floating), treat it as defaultTz local time. Day bucket is still Y-M-D.
  return `${y}-${m}-${d}`;
}

/**
 * Parse ICS into events with raw values and params we can normalise later.
 */
function parseICalFeed(icalData: string): ICalEvent[] {
  const lines = unfoldICS(icalData);
  const events: ICalEvent[] = [];
  let current: Partial<ICalEvent> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current?.uid && current?.dtstart && current?.dtend) {
        events.push(current as ICalEvent);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const prop = parseProp(line);
    if (!prop) continue;

    const { name, params, value } = prop;
    if (name === "UID") current.uid = value;
    else if (name === "SUMMARY") current.summary = value;
    else if (name === "STATUS") current.status = value.toUpperCase();
    else if (name === "DTSTART") current.dtstart = { raw: value, params };
    else if (name === "DTEND") current.dtend = { raw: value, params };
    // We intentionally ignore RRULE/EXDATE for Airbnb-style booking feeds
  }

  return events;
}

/**
 * Generate ISO date strings for each blocked night.
 * For all-day events: DTEND exclusive. For timed events: same rule once the start/end have been mapped to local day buckets.
 */
function generateDateRangeExclusive(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  // We iterate using UTC so increment is stable, but we are iterating ISO days already.
  let y = Number(startISO.slice(0, 4));
  let m = Number(startISO.slice(5, 7));
  let d = Number(startISO.slice(8, 10));
  const endY = Number(endISO.slice(0, 4));
  const endM = Number(endISO.slice(5, 7));
  const endD = Number(endISO.slice(8, 10));
  const end = Date.UTC(endY, endM - 1, endD);

  let cur = Date.UTC(y, m - 1, d);
  while (cur < end) {
    const cd = new Date(cur);
    const iso = `${cd.getUTCFullYear()}-${String(cd.getUTCMonth() + 1).padStart(2, "0")}-${String(cd.getUTCDate()).padStart(2, "0")}`;
    out.push(iso);
    // next day
    cur = Date.UTC(cd.getUTCFullYear(), cd.getUTCMonth(), cd.getUTCDate() + 1);
  }
  return out;
}

/**
 * Return today's date in a timezone as "YYYY-MM-DD".
 */
function todayInTZ(tz: string): string {
  const now = new Date();
  return formatDateInTZ(now, tz);
}

/**
 * Add months to a "YYYY-MM-DD" date in a timezone and return "YYYY-MM-DD".
 * We do it by constructing a Date at local midnight in the tz and using Intl formatting.
 */
function addMonthsInTZ(iso: string, months: number, tz: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  // construct UTC midnight of that day, then render in tz, then adjust month while preserving day
  const base = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const parts = formatDateInTZ(base, tz).split("-").map(Number); // normalised day in tz
  const dt = new Date(Date.UTC(parts[0], (parts[1] - 1) + months, parts[2], 0, 0, 0));
  return formatDateInTZ(dt, tz);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { feedId, apartmentId } = await req.json();

    if (!feedId && !apartmentId) {
      return new Response(JSON.stringify({ error: "Either feedId or apartmentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let feedsToSync: Feed[] = [];

    if (feedId) {
      const r = await fetch(`${supabaseUrl}/rest/v1/apartment_ical_feeds?id=eq.${feedId}&is_active=eq.true`, {
        headers: { Authorization: authHeader, apikey: anonKey },
      });
      feedsToSync = await r.json();
    } else {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/apartment_ical_feeds?apartment_id=eq.${apartmentId}&is_active=eq.true`,
        { headers: { Authorization: authHeader, apikey: anonKey } }
      );
      feedsToSync = await r.json();
    }

    if (!feedsToSync?.length) {
      return new Response(JSON.stringify({ message: "No active feeds found to sync" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const feed of feedsToSync) {
      const tz = feed.timezone || DEFAULT_TZ;

      try {
        // Remove existing rows for this feed
        await fetch(
          `${supabaseUrl}/rest/v1/apartment_availability?apartment_id=eq.${feed.apartment_id}&booking_reference=eq.${encodeURIComponent(
            feed.feed_name
          )}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: anonKey },
          }
        );

        // Fetch ICS with basic safety
        const icalResponse = await fetch(feed.ical_url, { headers: { "Cache-Control": "no-cache" } });
        if (!icalResponse.ok) {
          results.push({ feedId: feed.id, feedName: feed.feed_name, success: false, error: `Fetch failed: ${icalResponse.status}` });
          continue;
        }
        const icalData = await icalResponse.text();
        if (!icalData || icalData.length < 50) {
          results.push({ feedId: feed.id, feedName: feed.feed_name, success: false, error: "ICS body suspiciously small" });
          continue;
        }

        const events = parseICalFeed(icalData);

        // Compute time window in strings in the same tz
        const today = todayInTZ(tz);
        const maxDate = addMonthsInTZ(today, 24, tz);

        const bookedDates: string[] = [];
        let eventsProcessed = 0;
        let eventsSkipped = 0;

        for (const ev of events) {
          try {
            if ((ev.status || "") === "CANCELLED") {
              eventsSkipped++;
              continue;
            }

            const startISO = icsValueToLocalDate(ev.dtstart.raw, ev.dtstart.params, tz);
            const endISO = icsValueToLocalDate(ev.dtend.raw, ev.dtend.params, tz);

            // Skip events that ended before today
            if (endISO < today) {
              eventsSkipped++;
              continue;
            }
            // Skip events that start after maxDate
            if (startISO > maxDate) {
              eventsSkipped++;
              continue;
            }

            // Generate nights. DTEND is exclusive for all-day and our normalised buckets.
            const days = generateDateRangeExclusive(startISO, endISO);
            bookedDates.push(...days);
            eventsProcessed++;
          } catch (e) {
            console.warn(`Skipping event ${ev.uid}: ${(e as Error).message}`);
            eventsSkipped++;
          }
        }

        const uniqueDates = [...new Set(bookedDates)];

        if (uniqueDates.length) {
          const rows = uniqueDates.map((date) => ({
            apartment_id: feed.apartment_id,
            date,
            status: "booked",
            booking_reference: feed.feed_name,
            notes: `Synced from ${feed.feed_name}`,
          }));

          // Batch insert
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const ins = await fetch(`${supabaseUrl}/rest/v1/apartment_availability`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${supabaseServiceKey}`,
                apikey: anonKey,
                "Content-Type": "application/json",
                Prefer: "resolution=merge-duplicates",
              },
              body: JSON.stringify(batch),
            });
            if (!ins.ok) {
              const txt = await ins.text();
              throw new Error(`Insert failed: ${ins.status} ${txt}`);
            }
          }
        }

        // Stamp last_sync
        await fetch(`${supabaseUrl}/rest/v1/apartment_ical_feeds?id=eq.${feed.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ last_sync: new Date().toISOString() }),
        });

        results.push({
          feedId: feed.id,
          feedName: feed.feed_name,
          success: true,
          eventsParsed: events.length,
          eventsProcessed,
          eventsSkipped,
          datesBooked: uniqueDates.length,
          timezoneUsed: tz,
        });
      } catch (error: any) {
        results.push({ feedId: feed.id, feedName: feed.feed_name, success: false, error: error.message || String(error) });
      }
    }

    return new Response(JSON.stringify({ message: "Sync completed", results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in sync-ical function:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});