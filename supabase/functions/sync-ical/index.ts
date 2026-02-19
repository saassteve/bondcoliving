import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

interface ICalEvent {
  uid: string;
  summary?: string;
  status?: string;
  sequence?: number;
  dtstart: { raw: string; isDate: boolean; tzid?: string };
  dtend: { raw: string; isDate: boolean; tzid?: string };
}

interface Feed {
  id: string;
  feed_name: string;
  ical_url: string;
  apartment_id: string;
  is_active: boolean;
  timezone?: string | null;
}

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

function parseProp(line: string): { name: string; params: Record<string, string>; value: string } | null {
  const m = line.match(/^([A-Z-]+)(;[^:]+)?:([\s\S]*)$/);
  if (!m) return null;

  const name = m[1];
  const paramsStr = m[2] || "";
  const value = m[3].trim();

  const params: Record<string, string> = {};
  if (paramsStr) {
    for (const seg of paramsStr.split(";")) {
      if (!seg) continue;
      const [k, v] = seg.split("=");
      if (k && v) params[k.toUpperCase()] = v;
    }
  }
  return { name, params, value };
}

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

    if (name === "UID") {
      current.uid = value;
    } else if (name === "SUMMARY") {
      current.summary = value;
    } else if (name === "STATUS") {
      current.status = value.toUpperCase();
    } else if (name === "SEQUENCE") {
      current.sequence = parseInt(value) || 0;
    } else if (name === "DTSTART") {
      const isDate = params["VALUE"] === "DATE" || /^\d{8}$/.test(value);
      current.dtstart = { raw: value, isDate, tzid: params["TZID"] };
    } else if (name === "DTEND") {
      const isDate = params["VALUE"] === "DATE" || /^\d{8}$/.test(value);
      current.dtend = { raw: value, isDate, tzid: params["TZID"] };
    }
  }

  return events;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { feedId, apartmentId } = await req.json();

    if (!feedId && !apartmentId) {
      return errorResponse("Either feedId or apartmentId is required", "MISSING_PARAMS", 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing authorization header", "UNAUTHORIZED", 401);
    }

    const serviceHeaders = {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    };

    let feedsToSync: Feed[] = [];

    if (feedId) {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/apartment_ical_feeds?id=eq.${feedId}&is_active=eq.true&select=*`,
        { headers: { Authorization: authHeader, apikey: anonKey } }
      );
      feedsToSync = await r.json();
    } else {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/apartment_ical_feeds?apartment_id=eq.${apartmentId}&is_active=eq.true&select=*`,
        { headers: { Authorization: authHeader, apikey: anonKey } }
      );
      feedsToSync = await r.json();
    }

    if (!feedsToSync?.length) {
      return jsonResponse({ message: "No active feeds found to sync", results: [] }, 200);
    }

    const results: Record<string, unknown>[] = [];

    for (const feed of feedsToSync) {
      const tz = feed.timezone || "Atlantic/Madeira";

      try {
        const icalResponse = await fetch(feed.ical_url, {
          headers: { "Cache-Control": "no-cache", "User-Agent": "Bond-Coliving-iCal-Sync/1.0" },
        });

        if (!icalResponse.ok) {
          results.push({
            feedId: feed.id,
            feedName: feed.feed_name,
            success: false,
            error: `Fetch failed: ${icalResponse.status} ${icalResponse.statusText}`,
          });
          continue;
        }

        const icalData = await icalResponse.text();

        if (!icalData || !icalData.includes("BEGIN:VCALENDAR")) {
          results.push({
            feedId: feed.id,
            feedName: feed.feed_name,
            success: false,
            error: "Response is not a valid iCal feed (missing BEGIN:VCALENDAR)",
          });
          continue;
        }

        const events = parseICalFeed(icalData);

        await fetch(
          `${supabaseUrl}/rest/v1/apartment_ical_events?apartment_id=eq.${feed.apartment_id}&feed_name=eq.${encodeURIComponent(feed.feed_name)}`,
          { method: "DELETE", headers: serviceHeaders }
        );

        if (events.length > 0) {
          const rows = events.map((ev) => ({
            apartment_id: feed.apartment_id,
            feed_name: feed.feed_name,
            uid: ev.uid,
            summary: ev.summary || null,
            status: ev.status || null,
            sequence: ev.sequence || null,
            dtstart_raw: ev.dtstart.raw,
            dtstart_is_date: ev.dtstart.isDate,
            dtstart_tzid: ev.dtstart.tzid || null,
            dtend_raw: ev.dtend.raw,
            dtend_is_date: ev.dtend.isDate,
            dtend_tzid: ev.dtend.tzid || null,
          }));

          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const ins = await fetch(`${supabaseUrl}/rest/v1/apartment_ical_events`, {
              method: "POST",
              headers: { ...serviceHeaders, Prefer: "resolution=merge-duplicates" },
              body: JSON.stringify(batch),
            });

            if (!ins.ok) {
              const txt = await ins.text();
              throw new Error(`Insert raw events failed: ${ins.status} ${txt}`);
            }
          }
        }

        const rpcResponse = await fetch(
          `${supabaseUrl}/rest/v1/rpc/sync_availability_from_ical`,
          {
            method: "POST",
            headers: serviceHeaders,
            body: JSON.stringify({
              p_apartment_id: feed.apartment_id,
              p_feed_name: feed.feed_name,
              p_property_tz: tz,
            }),
          }
        );

        if (!rpcResponse.ok) {
          const txt = await rpcResponse.text();
          throw new Error(`RPC sync_availability_from_ical failed: ${rpcResponse.status} ${txt}`);
        }

        const rpcResult = await rpcResponse.json();
        const syncStats = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;

        await fetch(`${supabaseUrl}/rest/v1/apartment_ical_feeds?id=eq.${feed.id}`, {
          method: "PATCH",
          headers: serviceHeaders,
          body: JSON.stringify({ last_sync: new Date().toISOString() }),
        });

        results.push({
          feedId: feed.id,
          feedName: feed.feed_name,
          success: true,
          eventsParsed: events.length,
          datesSynced: syncStats?.dates_synced || 0,
          dateRangeStart: syncStats?.date_range_start || null,
          dateRangeEnd: syncStats?.date_range_end || null,
          timezoneUsed: tz,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({
          feedId: feed.id,
          feedName: feed.feed_name,
          success: false,
          error: message,
        });
      }
    }

    return jsonResponse({ message: "Sync completed", results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in sync-ical function:", message);
    return errorResponse(message || "Internal server error", "INTERNAL_ERROR", 500);
  }
});
