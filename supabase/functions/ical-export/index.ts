import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ApartmentAvailability {
  id: string;
  apartment_id: string;
  date: string;
  status: 'available' | 'booked' | 'blocked';
  booking_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Apartment {
  id: string;
  title: string;
  description: string;
  price: number;
  size: string;
  capacity: string;
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function formatICalDateOnly(dateString: string): string {
  return dateString.replace(/-/g, '');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const apartmentId = url.pathname.split('/').pop()?.replace('.ics', '');
    
    if (!apartmentId) {
      return new Response('Apartment ID is required', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 1. Fetch apartment details
    const { data: apartment, error: apartmentError } = await supabaseClient
      .from('apartments')
      .select('id, title, description, price, size, capacity')
      .eq('id', apartmentId)
      .single();

    if (apartmentError || !apartment) {
      return new Response('Apartment not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // 2. Fetch availability data for the next 2 years
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 2);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data: availabilityData, error: availabilityError } = await supabaseClient
      .from('apartment_availability')
      .select('*')
      .eq('apartment_id', apartmentId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .neq('status', 'available')
      .order('date', { ascending: true });

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
      return new Response('Error fetching availability data', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // 3. Generate iCal content
    const now = new Date();
    const timestamp = formatICalDate(now);
    
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bond Coliving//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICalText(apartment.title)} - Bond Coliving`,
      `X-WR-CALDESC:Availability calendar for ${escapeICalText(apartment.title)} at Bond Coliving`,
      `X-WR-TIMEZONE:Atlantic/Madeira`,
      `REFRESH-INTERVAL;VALUE=DURATION:PT1H`,
      `X-PUBLISHED-TTL:PT1H`
    ].join('\r\n') + '\r\n';

    // 4. Add events for each non-available date
    for (const entry of availabilityData || []) {
      const eventDate = new Date(entry.date);
      const nextDay = new Date(eventDate);
      nextDay.setDate(eventDate.getDate() + 1);

      const uid = `bond-${entry.apartment_id}-${entry.date}@stayatbond.com`;
      const summary = entry.status === 'booked' 
        ? `${escapeICalText(apartment.title)} - BOOKED`
        : `${escapeICalText(apartment.title)} - BLOCKED`;
      
      let description = `Status: ${entry.status.toUpperCase()}`;
      if (entry.notes) {
        description += `\\nNotes: ${escapeICalText(entry.notes)}`;
      }
      if (entry.booking_reference) {
        description += `\\nReference: ${escapeICalText(entry.booking_reference)}`;
      }
      description += `\\nApartment: ${escapeICalText(apartment.title)}`;
      description += `\\nPrice: €${apartment.price}/month`;
      description += `\\nSize: ${escapeICalText(apartment.size)}`;
      description += `\\nCapacity: ${escapeICalText(apartment.capacity)}`;

      icalContent += [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${formatICalDateOnly(entry.date)}`,
        `DTEND;VALUE=DATE:${formatICalDateOnly(nextDay.toISOString().split('T')[0])}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `STATUS:${entry.status === 'booked' ? 'CONFIRMED' : 'TENTATIVE'}`,
        `TRANSP:OPAQUE`,
        `CATEGORIES:${entry.status.toUpperCase()}`,
        `X-BOND-APARTMENT-ID:${apartment.id}`,
        `X-BOND-STATUS:${entry.status}`,
        'END:VEVENT'
      ].join('\r\n') + '\r\n';
    }

    icalContent += 'END:VCALENDAR\r\n';

    // 5. Return iCal content with proper headers
    return new Response(icalContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${apartment.title.replace(/[^a-zA-Z0-9]/g, '-')}-availability.ics"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Last-Modified': now.toUTCString(),
      },
    });

  } catch (error) {
    console.error('iCal export error:', error);
    return new Response(`Error generating iCal feed: ${error.message}`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});