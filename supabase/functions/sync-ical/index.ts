import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ICalEvent {
  summary: string;
  dtstart: string;
  dtend: string;
  uid: string;
}

function parseICalDate(dateStr: string): string {
  // Remove any whitespace
  dateStr = dateStr.trim();

  // Extract year, month, day from the date string (format: YYYYMMDD or YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));

  // Validate the parsed values
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid iCal date format: ${dateStr}`);
  }

  // Always return date-only format in YYYY-MM-DD
  // This ensures consistency regardless of timezone or time component
  const dateOnly = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return dateOnly;
}

function parseICalFeed(icalData: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icalData.split(/\r?\n/);

  let currentEvent: Partial<ICalEvent> | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    while (i + 1 < lines.length && lines[i + 1].startsWith(' ')) {
      i++;
      line += lines[i].trim();
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.dtstart && currentEvent.dtend && currentEvent.uid) {
        events.push(currentEvent as ICalEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith('DTSTART')) {
        const valueMatch = line.match(/[:;]VALUE=DATE:(\d{8})/);
        const dateMatch = line.match(/DTSTART:(\d{8}T?\d*Z?/);
        if (valueMatch) {
          currentEvent.dtstart = valueMatch[1];
        } else if (dateMatch) {
          currentEvent.dtstart = dateMatch[1];
        }
      } else if (line.startsWith('DTEND')) {
        const valueMatch = line.match(/[:;]VALUE=DATE:(\d{8})/);
        const dateMatch = line.match(/DTEND:(\d{8}T?\d*Z?/);
        if (valueMatch) {
          currentEvent.dtend = valueMatch[1];
        } else if (dateMatch) {
          currentEvent.dtend = dateMatch[1];
        }
      } else if (line.startsWith('UID:')) {
        currentEvent.uid = line.substring(4);
      }
    }
  }

  return events;
}

function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];

  // Parse dates as YYYY-MM-DD strings to avoid timezone issues
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

  // Create Date objects at UTC midnight to prevent timezone shifts
  const current = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));

  // Generate dates up to but not including the end date (iCal standard)
  while (current < end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);

    // Increment by one day in UTC
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { feedId, apartmentId } = await req.json();

    if (!feedId && !apartmentId) {
      return new Response(
        JSON.stringify({ error: "Either feedId or apartmentId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let feedsToSync = [];

    if (feedId) {
      const feedResponse = await fetch(
        `${supabaseUrl}/rest/v1/apartment_ical_feeds?id=eq.${feedId}&is_active=eq.true`,
        {
          headers: {
            Authorization: authHeader,
            apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
          },
        }
      );
      feedsToSync = await feedResponse.json();
    } else if (apartmentId) {
      const feedsResponse = await fetch(
        `${supabaseUrl}/rest/v1/apartment_ical_feeds?apartment_id=eq.${apartmentId}&is_active=eq.true`,
        {
          headers: {
            Authorization: authHeader,
            apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
          },
        }
      );
      feedsToSync = await feedsResponse.json();
    }

    if (!feedsToSync || feedsToSync.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active feeds found to sync" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = [];

    for (const feed of feedsToSync) {
      try {
        // Clear existing dates from this feed before syncing new ones
        // This prevents stale blocked dates from persisting
        const deleteResponse = await fetch(
          `${supabaseUrl}/rest/v1/apartment_availability?apartment_id=eq.${feed.apartment_id}&booking_reference=eq.${encodeURIComponent(feed.feed_name)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
            },
          }
        );

        if (!deleteResponse.ok) {
          console.warn(`Warning: Failed to clear old dates for feed ${feed.feed_name}`);
        }

        const icalResponse = await fetch(feed.ical_url);
        if (!icalResponse.ok) {
          results.push({
            feedId: feed.id,
            feedName: feed.feed_name,
            success: false,
            error: `Failed to fetch iCal feed: ${icalResponse.status}`,
          });
          continue;
        }

        const icalData = await icalResponse.text();
        const events = parseICalFeed(icalData);

        // Filter events to only include future dates (within the next 24 months)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 24);

        const bookedDates: string[] = [];
        let eventsSkipped = 0;

        for (const event of events) {
          try {
            const startDate = parseICalDate(event.dtstart);
            const endDate = parseICalDate(event.dtend);

            // Skip events that have already ended
            const eventEndDate = new Date(endDate);
            if (eventEndDate < today) {
              eventsSkipped++;
              continue;
            }

            // Skip events that are too far in the future
            const eventStartDate = new Date(startDate);
            if (eventStartDate > maxDate) {
              eventsSkipped++;
              continue;
            }

            const dates = generateDateRange(startDate, endDate);
            bookedDates.push(...dates);
          } catch (error) {
            console.warn(`Skipping invalid event in feed ${feed.feed_name}: ${error.message}`);
            eventsSkipped++;
          }
        }

        const uniqueDates = [...new Set(bookedDates)];

        if (uniqueDates.length > 0) {
          const availabilityRecords = uniqueDates.map((date) => ({
            apartment_id: feed.apartment_id,
            date,
            status: "booked",
            booking_reference: feed.feed_name,
            notes: `Synced from ${feed.feed_name}`,
          }));

          const batchSize = 100;
          for (let i = 0; i < availabilityRecords.length; i += batchSize) {
            const batch = availabilityRecords.slice(i, i + batchSize);

            await fetch(
              `${supabaseUrl}/rest/v1/apartment_availability`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${supabaseServiceKey}`,
                  apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
                  "Content-Type": "application/json",
                  Prefer: "resolution=merge-duplicates",
                },
                body: JSON.stringify(batch),
              }
            );
          }
        }

        await fetch(
          `${supabaseUrl}/rest/v1/apartment_ical_feeds?id=eq.${feed.id}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              last_sync: new Date().toISOString(),
            }),
          }
        );

        results.push({
          feedId: feed.id,
          feedName: feed.feed_name,
          success: true,
          eventsProcessed: events.length,
          eventsSkipped: eventsSkipped,
          datesBooked: uniqueDates.length,
        });
      } catch (error) {
        results.push({
          feedId: feed.id,
          feedName: feed.feed_name,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Sync completed",
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in sync-ical function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});