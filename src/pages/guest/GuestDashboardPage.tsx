import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getCurrentGuestUser, type GuestUser } from '../../lib/guestAuth';
import { supabase } from '../../lib/supabase';
import { Calendar, MessageSquare, Users, Bell, Wrench, Clock, Key, Home } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  image_url: string | null;
}

interface Booking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  door_code: string | null;
  special_instructions: string | null;
  apartments: {
    title: string;
  };
}

export default function GuestDashboardPage() {
  const { guestUser } = useOutletContext<{ guestUser: GuestUser | null }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guestUser) {
      loadDashboardData();
    }
  }, [guestUser]);

  const loadDashboardData = async () => {
    const promises: Promise<any>[] = [
      supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('community_events')
        .select('*')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3),
    ];

    if (guestUser?.user_type === 'overnight' && guestUser?.booking_id) {
      promises.push(
        supabase
          .from('bookings')
          .select(`
            *,
            apartments (
              title
            )
          `)
          .eq('id', guestUser.booking_id)
          .maybeSingle()
      );
    }

    const results = await Promise.all(promises);
    const [announcementsData, eventsData, bookingData] = results;

    if (announcementsData.data) setAnnouncements(announcementsData.data);
    if (eventsData.data) setUpcomingEvents(eventsData.data);
    if (bookingData?.data) setBooking(bookingData.data);

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const quickActions = [
    {
      name: 'Browse Community',
      href: '/guest/community',
      icon: Users,
      color: 'bg-blue-500',
      show: true,
    },
    {
      name: 'View Events',
      href: '/guest/events',
      icon: Calendar,
      color: 'bg-green-500',
      show: true,
    },
    {
      name: 'Messages',
      href: '/guest/messages',
      icon: MessageSquare,
      color: 'bg-purple-500',
      show: true,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      name: 'Request Service',
      href: '/guest/services',
      icon: Wrench,
      color: 'bg-orange-500',
      show: guestUser?.user_type === 'overnight',
    },
    {
      name: 'Extend Stay',
      href: '/guest/extend-stay',
      icon: Clock,
      color: 'bg-teal-500',
      show: guestUser?.user_type === 'overnight',
    },
  ].filter(action => action.show);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const accessEndDate = guestUser ? new Date(guestUser.access_end_date) : null;
  const daysRemaining = accessEndDate
    ? Math.ceil((accessEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {guestUser?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          {guestUser?.user_type === 'overnight'
            ? `You have ${daysRemaining} days remaining in your stay`
            : 'Enjoy access to the Bond community'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              to={action.href}
              className="relative bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{action.name}</h3>
              {action.badge && (
                <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {action.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-blue-600" />
                Announcements
              </h2>
              <Link to="/guest/announcements" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>

            {announcements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No announcements at this time</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                          {announcement.is_pinned && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{announcement.content}</p>
                        <p className="text-xs text-gray-500 mt-2">{formatDate(announcement.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Upcoming Events
              </h2>
              <Link to="/guest/events" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming events</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/guest/events/${event.id}`}
                    className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition border border-gray-200"
                  >
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">{formatEventDate(event.event_date)}</p>
                      <p className="text-sm text-gray-500">{event.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* My Stay Section - Only for overnight guests with booking */}
          {guestUser?.user_type === 'overnight' && booking && (
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-semibold mb-4 flex items-center">
                <Home className="h-5 w-5 mr-2" />
                My Stay
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-100 mb-1">Apartment</p>
                  <p className="font-semibold">{booking.apartments.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-green-100 mb-1">Check-in</p>
                    <p className="font-semibold">{new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-100 mb-1">Check-out</p>
                    <p className="font-semibold">{new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>

                {booking.door_code && (
                  <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center mb-2">
                      <Key className="h-4 w-4 mr-2 text-green-100" />
                      <p className="text-sm text-green-100">Door Code</p>
                    </div>
                    <p className="font-mono font-bold text-2xl tracking-widest">{booking.door_code}</p>
                  </div>
                )}

                {booking.special_instructions && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-green-100 mb-1">Special Instructions</p>
                    <p className="text-sm">{booking.special_instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Access Info */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="font-semibold mb-2">Your Access</h3>
            <p className="text-sm text-blue-100 mb-4">
              {guestUser?.user_type === 'overnight' ? 'Overnight Guest' : 'Coworking Member'}
            </p>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-100 mb-1">Access until</p>
              <p className="font-bold text-lg">{accessEndDate?.toLocaleDateString()}</p>
              {guestUser?.user_type === 'overnight' && daysRemaining < 7 && (
                <Link
                  to="/guest/extend-stay"
                  className="mt-3 block w-full bg-white text-blue-600 text-center py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
                >
                  Extend Your Stay
                </Link>
              )}
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Community</h3>
            <div className="space-y-3">
              <Link to="/guest/community" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">View Members</span>
                </div>
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link to="/guest/messages" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">Messages</span>
                </div>
                {unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
