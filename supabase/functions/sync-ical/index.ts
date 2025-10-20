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
  if (dateStr.includes('T')) {
    const date = new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8)),
      parseInt(dateStr.substring(9, 11)),
      parseInt(dateStr.substring(11, 13)),
      parseInt(dateStr.substring(13, 15))
    );
    return date.toISOString().split('T')[0];
  } else {
    const date = new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8))
    );
    return date.toISOString().split('T')[0];
  }
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
        const dateMatch = line.match(/DTSTART:(\d{8}T?\d*Z?)/);
        if (valueMatch) {
          currentEvent.dtstart = valueMatch[1];
        } else if (dateMatch) {
          currentEvent.dtstart = dateMatch[1];
        }
      } else if (line.startsWith('DTEND')) {
        const valueMatch = line.match(/[:;]VALUE=DATE:(\d{8})/);
        const dateMatch = line.match(/DTEND:(\d{8}T?\d*Z?)/);
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
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
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

        const bookedDates: string[] = [];
        for (const event of events) {
          const startDate = parseICalDate(event.dtstart);
          const endDate = parseICalDate(event.dtend);
          const dates = generateDateRange(startDate, endDate);
          bookedDates.push(...dates);
        }

        const uniqueDates = [...new Set(bookedDates)];

        if (uniqueDates.length > 0) {
          const availabilityRecords = uniqueDates.map((date) => ({
            apartment_id: feed.apartment_id,
            date,
            status: "booked",
            booking_reference: feed.feed_name,
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