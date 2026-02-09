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
  booking_reference: string;
  check_in_date: string;
  check_out_date: string;
  door_code: string | null;
  special_instructions: string | null;
  apartment: {
    title: string;
  } | null;
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
            apartment:apartment_id (
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
      color: 'bg-[#C5C5B5]/20',
      hoverColor: 'hover:bg-[#C5C5B5]/30',
      show: true,
    },
    {
      name: 'View Events',
      href: '/guest/events',
      icon: Calendar,
      color: 'bg-[#C5C5B5]/20',
      hoverColor: 'hover:bg-[#C5C5B5]/30',
      show: true,
    },
    {
      name: 'Messages',
      href: '/guest/messages',
      icon: MessageSquare,
      color: 'bg-[#C5C5B5]/20',
      hoverColor: 'hover:bg-[#C5C5B5]/30',
      show: true,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      name: 'Request Service',
      href: '/guest/services',
      icon: Wrench,
      color: 'bg-[#C5C5B5]/20',
      hoverColor: 'hover:bg-[#C5C5B5]/30',
      show: guestUser?.user_type === 'overnight',
    },
    {
      name: 'Extend Stay',
      href: '/guest/extend-stay',
      icon: Clock,
      color: 'bg-[#C5C5B5]/20',
      hoverColor: 'hover:bg-[#C5C5B5]/30',
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
    <div className="min-h-screen bg-[#1E1F1E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {guestUser?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-[#C5C5B5]/80">
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
                className={`relative ${action.color} ${action.hoverColor} border border-[#C5C5B5]/20 rounded-2xl p-6 transition-all duration-300 group hover:scale-105`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#C5C5B5]/30 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Icon className="h-6 w-6 text-[#C5C5B5]" />
                </div>
                <h3 className="font-semibold text-white text-sm">{action.name}</h3>
                {action.badge && (
                  <span className="absolute top-4 right-4 bg-[#C5C5B5] text-[#1E1F1E] text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
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
            <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-[#C5C5B5]" />
                  Announcements
                </h2>
                <Link to="/guest/announcements" className="text-sm text-[#C5C5B5] hover:text-white font-medium transition-colors">
                  View all
                </Link>
              </div>

              {announcements.length === 0 ? (
                <p className="text-[#C5C5B5]/60 text-center py-8">No announcements at this time</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="border-l-4 border-[#C5C5B5] bg-[#C5C5B5]/10 p-4 rounded-r-2xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{announcement.title}</h3>
                            {announcement.is_pinned && (
                              <span className="px-2 py-0.5 bg-[#C5C5B5]/30 text-[#C5C5B5] text-xs font-medium rounded uppercase tracking-wide">
                                Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#C5C5B5]/80 line-clamp-2">{announcement.content}</p>
                          <p className="text-xs text-[#C5C5B5]/50 mt-2">{formatDate(announcement.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-[#C5C5B5]" />
                  Upcoming Events
                </h2>
                <Link to="/guest/events" className="text-sm text-[#C5C5B5] hover:text-white font-medium transition-colors">
                  View all
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <p className="text-[#C5C5B5]/60 text-center py-8">No upcoming events</p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/guest/events/${event.id}`}
                      className="flex gap-4 p-4 rounded-2xl hover:bg-[#C5C5B5]/10 transition-all duration-300 border border-[#C5C5B5]/20 hover:border-[#C5C5B5]/30"
                    >
                      {event.image_url && (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                        <p className="text-sm text-[#C5C5B5]/80 mb-1">{formatEventDate(event.event_date)}</p>
                        <p className="text-sm text-[#C5C5B5]/60">{event.location}</p>
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
              <div className="bg-gradient-to-br from-[#C5C5B5] to-[#C5C5B5]/80 rounded-2xl shadow-xl p-6 text-[#1E1F1E]">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  My Stay
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#1E1F1E]/70 mb-1">Apartment</p>
                    <p className="font-semibold">{booking.apartment?.title || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-[#1E1F1E]/70 mb-1">Booking Reference</p>
                    <p className="font-mono font-semibold">{booking.booking_reference}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-[#1E1F1E]/70 mb-1">Check-in</p>
                      <p className="font-semibold">{new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#1E1F1E]/70 mb-1">Check-out</p>
                      <p className="font-semibold">{new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>

                  {booking.door_code && (
                    <div className="bg-[#1E1F1E]/20 rounded-xl p-3 backdrop-blur-sm">
                      <div className="flex items-center mb-2">
                        <Key className="h-4 w-4 mr-2 text-[#1E1F1E]/70" />
                        <p className="text-sm text-[#1E1F1E]/70">Door Code</p>
                      </div>
                      <p className="font-mono font-bold text-2xl tracking-widest">{booking.door_code}</p>
                    </div>
                  )}

                  {booking.special_instructions && (
                    <div className="bg-[#1E1F1E]/10 rounded-xl p-3">
                      <p className="text-sm text-[#1E1F1E]/70 mb-1">Special Instructions</p>
                      <p className="text-sm">{booking.special_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Access Info */}
            <div className="bg-gradient-to-br from-[#C5C5B5]/30 to-[#C5C5B5]/20 border border-[#C5C5B5]/30 rounded-2xl shadow-xl p-6 backdrop-blur-sm">
              <h3 className="font-semibold mb-2 text-white">Your Access</h3>
              <p className="text-sm text-[#C5C5B5]/80 mb-4">
                {guestUser?.user_type === 'overnight' ? 'Overnight Guest' : 'Coworking Member'}
              </p>
              <div className="bg-[#1E1F1E]/40 rounded-xl p-3 backdrop-blur-sm border border-[#C5C5B5]/20">
                <p className="text-xs text-[#C5C5B5]/70 mb-1">Access until</p>
                <p className="font-bold text-lg text-white">{accessEndDate?.toLocaleDateString()}</p>
                {guestUser?.user_type === 'overnight' && daysRemaining < 7 && (
                  <Link
                    to="/guest/extend-stay"
                    className="mt-3 block w-full bg-[#C5C5B5] text-[#1E1F1E] text-center py-2 rounded-full text-sm font-semibold hover:bg-white transition-all duration-300 hover:scale-105"
                  >
                    Extend Your Stay
                  </Link>
                )}
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-white mb-4">Community</h3>
              <div className="space-y-3">
                <Link to="/guest/community" className="flex items-center justify-between p-3 rounded-xl hover:bg-[#C5C5B5]/10 transition-all duration-300 border border-[#C5C5B5]/10">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-[#C5C5B5] mr-3" />
                    <span className="text-sm text-[#C5C5B5]">View Members</span>
                  </div>
                  <svg className="h-5 w-5 text-[#C5C5B5]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/guest/messages" className="flex items-center justify-between p-3 rounded-xl hover:bg-[#C5C5B5]/10 transition-all duration-300 border border-[#C5C5B5]/10">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-[#C5C5B5] mr-3" />
                    <span className="text-sm text-[#C5C5B5]">Messages</span>
                  </div>
                  {unreadMessages > 0 && (
                    <span className="bg-[#C5C5B5] text-[#1E1F1E] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
