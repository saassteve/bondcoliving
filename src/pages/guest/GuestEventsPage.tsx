import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { type GuestUser } from '../../lib/guestAuth';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string | null;
  location: string;
  max_attendees: number | null;
  image_url: string | null;
  rsvp_count?: number;
  user_rsvp?: {
    status: string;
  } | null;
}

export default function GuestEventsPage() {
  const { guestUser } = useOutletContext<{ guestUser: GuestUser | null }>();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (guestUser) {
      loadEvents();
    }
  }, [guestUser]);

  const loadEvents = async () => {
    const now = new Date().toISOString();

    const [upcomingData, pastData] = await Promise.all([
      supabase
        .from('community_events')
        .select(`
          *,
          rsvp_count:event_rsvps(count),
          user_rsvp:event_rsvps!left(status)
        `)
        .eq('is_published', true)
        .gte('event_date', now)
        .order('event_date', { ascending: true }),
      supabase
        .from('community_events')
        .select(`
          *,
          rsvp_count:event_rsvps(count)
        `)
        .eq('is_published', true)
        .lt('event_date', now)
        .order('event_date', { ascending: false })
        .limit(10),
    ]);

    if (upcomingData.data) setUpcomingEvents(upcomingData.data as any);
    if (pastData.data) setPastEvents(pastData.data as any);

    setLoading(false);
  };

  const handleRSVP = async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!guestUser) return;

    const { error } = await supabase.from('event_rsvps').upsert({
      event_id: eventId,
      guest_user_id: guestUser.id,
      status,
    });

    if (!error) {
      loadEvents();
    }
  };

  const formatEventDate = (dateString: string, endDateString: string | null) => {
    const start = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };

    if (endDateString) {
      const end = new Date(endDateString);
      const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `${start.toLocaleDateString('en-US', options)} - ${endTime}`;
    }

    return start.toLocaleDateString('en-US', options);
  };

  const EventCard = ({ event }: { event: Event }) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 flex-1">{event.title}</h3>
          {event.user_rsvp && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              event.user_rsvp.status === 'going'
                ? 'bg-green-100 text-green-800'
                : event.user_rsvp.status === 'maybe'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {event.user_rsvp.status === 'going' ? 'Going' : event.user_rsvp.status === 'maybe' ? 'Maybe' : 'Not Going'}
            </span>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <Clock className="h-4 w-4 mr-2" />
            {formatEventDate(event.event_date, event.end_date)}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          {event.rsvp_count !== undefined && (
            <div className="flex items-center text-gray-600 text-sm">
              <Users className="h-4 w-4 mr-2" />
              {event.rsvp_count} {event.rsvp_count === 1 ? 'person' : 'people'} attending
              {event.max_attendees && ` (${event.max_attendees} max)`}
            </div>
          )}
        </div>

        <p className="text-gray-700 mb-6 line-clamp-3">{event.description}</p>

        {activeTab === 'upcoming' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleRSVP(event.id, 'going')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                event.user_rsvp?.status === 'going'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              Going
            </button>
            <button
              onClick={() => handleRSVP(event.id, 'maybe')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                event.user_rsvp?.status === 'maybe'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700'
              }`}
            >
              Maybe
            </button>
            <button
              onClick={() => handleRSVP(event.id, 'not_going')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                event.user_rsvp?.status === 'not_going'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Can't Go
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const events = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Calendar className="h-8 w-8 mr-3 text-green-600" />
          Community Events
        </h1>
        <p className="text-gray-600">Join us for events, activities, and gatherings</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'upcoming'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'past'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Past Events ({pastEvents.length})
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </h3>
          <p className="text-gray-600">
            {activeTab === 'upcoming'
              ? 'Check back soon for new events!'
              : 'Past events will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
