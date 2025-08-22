import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend: string;
  status?: string;
}

// Simple iCal parser for VEVENT blocks
function parseICalEvents(icalText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icalText.split('\n').map(line => line.trim());
  
  let currentEvent: Partial<ICalEvent> = {};
  let inEvent = false;
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT' && inEvent) {
      if (currentEvent.uid && currentEvent.dtstart && currentEvent.dtend) {
        events.push(currentEvent as ICalEvent);
      }
      inEvent = false;
    } else if (inEvent) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      switch (key) {
        case 'UID':
          currentEvent.uid = value;
          break;
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'DTSTART':
        case 'DTSTART;VALUE=DATE':
          currentEvent.dtstart = value;
          break;
        case 'DTEND':
        case 'DTEND;VALUE=DATE':
          currentEvent.dtend = value;
          break;
        case 'STATUS':
          currentEvent.status = value;
          break;
      }
    }
  }
  
  return events;
}

function parseICalDate(dateStr: string): Date {
  // Handle different iCal date formats
  if (dateStr.length === 8) {
    // YYYYMMDD format
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  } else if (dateStr.includes('T')) {
    // ISO format with time
    return new Date(dateStr);
  } else {
    // Try to parse as-is
    return new Date(dateStr);
  }
}

function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  // iCal end dates are exclusive, so we go up to but not including the end date
  while (current < endDate) {
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
    
    if (!feedId || !apartmentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required parameters: feedId and apartmentId' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch iCal feed details
    const { data: feed, error: feedError } = await supabaseClient
      .from('apartment_ical_feeds')
      .select('*')
      .eq('id', feedId)
      .eq('is_active', true)
      .single();

    if (feedError || !feed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'iCal feed not found or inactive' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Fetch iCal content from external URL
    console.log(`Fetching iCal from: ${feed.ical_url}`);
    const icalResponse = await fetch(feed.ical_url, {
      headers: {
        'User-Agent': 'Bond-Coliving-Calendar-Sync/1.0'
      }
    });

    if (!icalResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to fetch iCal data: ${icalResponse.status} ${icalResponse.statusText}` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const icalText = await icalResponse.text();
    console.log(`Fetched iCal content length: ${icalText.length}`);

    // 3. Parse iCal content
    const events = parseICalEvents(icalText);
    console.log(`Parsed ${events.length} events from iCal`);

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No events found in iCal feed' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Process events and create availability records
    const availabilityRecords = [];
    let processedEvents = 0;

    for (const event of events) {
      try {
        const startDate = parseICalDate(event.dtstart);
        const endDate = parseICalDate(event.dtend);
        
        // Generate date range for this event
        const dates = generateDateRange(startDate, endDate);
        
        for (const date of dates) {
          availabilityRecords.push({
            apartment_id: apartmentId,
            date: date,
            status: 'booked',
            booking_reference: event.uid,
            notes: `${feed.feed_name}: ${event.summary || 'Booking'}`
          });
        }
        
        processedEvents++;
      } catch (dateError) {
        console.error(`Error processing event ${event.uid}:`, dateError);
        // Continue processing other events
      }
    }

    console.log(`Created ${availabilityRecords.length} availability records from ${processedEvents} events`);

    // 5. Bulk upsert availability records
    if (availabilityRecords.length > 0) {
      const { error: upsertError } = await supabaseClient
        .from('apartment_availability')
        .upsert(availabilityRecords, { 
          onConflict: 'apartment_id,date',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('Error upserting availability:', upsertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Failed to update availability: ${upsertError.message}` 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 6. Update last_sync timestamp
    const { error: updateError } = await supabaseClient
      .from('apartment_ical_feeds')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', feedId);

    if (updateError) {
      console.error('Error updating last_sync:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${processedEvents} events (${availabilityRecords.length} date records updated)`,
        stats: {
          eventsProcessed: processedEvents,
          datesUpdated: availabilityRecords.length,
          feedName: feed.feed_name
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `An unexpected error occurred: ${error.message}` 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});