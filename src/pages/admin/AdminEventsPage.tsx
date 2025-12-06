import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Plus, Edit2, Trash2, Eye, EyeOff, Users, MapPin } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string | null;
  location: string;
  max_attendees: number | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface EventWithRSVPs extends Event {
  rsvp_count?: number;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventWithRSVPs[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    location: '',
    max_attendees: '',
    image_url: '',
    is_published: true,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);

    const { data: eventsData } = await supabase
      .from('community_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (eventsData) {
      const eventsWithCounts = await Promise.all(
        eventsData.map(async (event) => {
          const { count } = await supabase
            .from('event_rsvps')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'going');

          return {
            ...event,
            rsvp_count: count || 0,
          };
        })
      );

      setEvents(eventsWithCounts);
    }

    setLoading(false);
  };

  const loadRSVPs = async (eventId: string) => {
    const { data } = await supabase
      .from('event_rsvps')
      .select(`
        *,
        guest_users (
          full_name,
          email,
          user_type
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (data) setRsvps(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      title: formData.title,
      description: formData.description,
      event_date: formData.event_date,
      end_date: formData.end_date || null,
      location: formData.location,
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
      image_url: formData.image_url || null,
      is_published: formData.is_published,
    };

    if (editingId) {
      const { error } = await supabase
        .from('community_events')
        .update(payload)
        .eq('id', editingId);

      if (!error) {
        resetForm();
        loadEvents();
      }
    } else {
      const { error } = await supabase
        .from('community_events')
        .insert({
          ...payload,
          created_by: user.id,
        });

      if (!error) {
        resetForm();
        loadEvents();
      }
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date.slice(0, 16),
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      location: event.location,
      max_attendees: event.max_attendees?.toString() || '',
      image_url: event.image_url || '',
      is_published: event.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? All RSVPs will also be deleted.')) return;

    const { error } = await supabase
      .from('community_events')
      .delete()
      .eq('id', id);

    if (!error) loadEvents();
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('community_events')
      .update({ is_published: !currentStatus })
      .eq('id', id);

    if (!error) loadEvents();
  };

  const viewRSVPs = async (eventId: string) => {
    setSelectedEventId(eventId);
    await loadRSVPs(eventId);
    setShowRSVPModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      end_date: '',
      location: '',
      max_attendees: '',
      image_url: '',
      is_published: true,
    });
    setEditingId(null);
    setShowModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community Events</h1>
          <p className="text-gray-300">Organize events and activities for guests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Event
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-700">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
          <p className="text-gray-300 mb-6">Create your first community event to engage with guests</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-gray-800 rounded-xl shadow-sm overflow-hidden border-2 ${
                isUpcoming(event.event_date) ? 'border-green-700' : 'border-gray-700'
              }`}
            >
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isUpcoming(event.event_date)
                      ? 'bg-green-900/50 text-green-300 border border-green-700'
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                  }`}>
                    {isUpcoming(event.event_date) ? 'Upcoming' : 'Past'}
                  </span>
                  {!event.is_published && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-700/50 text-gray-300 border border-gray-600">
                      Draft
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                <p className="text-gray-300 mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(event.event_date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Users className="h-4 w-4 mr-2" />
                    {event.rsvp_count || 0}
                    {event.max_attendees && ` / ${event.max_attendees}`} attending
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewRSVPs(event.id)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition"
                  >
                    View RSVPs
                  </button>
                  <button
                    onClick={() => togglePublished(event.id, event.is_published)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                    title={event.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {event.is_published ? (
                      <Eye className="h-5 w-5 text-green-500" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                  >
                    <Edit2 className="h-5 w-5 text-indigo-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                  >
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? 'Edit Event' : 'New Event'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Weekly Yoga Session"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Event details and what to expect..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Rooftop Terrace"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Attendees (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="mr-2 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-300">Publish event</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {editingId ? 'Update' : 'Create'} Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRSVPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Event RSVPs</h2>
              <button
                onClick={() => setShowRSVPModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ×
              </button>
            </div>

            {rsvps.length === 0 ? (
              <p className="text-center text-gray-300 py-8">No RSVPs yet</p>
            ) : (
              <div className="space-y-3">
                {rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {rsvp.guest_users?.full_name || 'Unknown Guest'}
                      </p>
                      <p className="text-sm text-gray-300">
                        {rsvp.guest_users?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rsvp.guest_users?.user_type === 'overnight'
                          ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                          : 'bg-green-900/50 text-green-300 border border-green-700'
                      }`}>
                        {rsvp.guest_users?.user_type}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rsvp.status === 'going'
                          ? 'bg-green-900/50 text-green-300 border border-green-700'
                          : rsvp.status === 'maybe'
                          ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                      }`}>
                        {rsvp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
