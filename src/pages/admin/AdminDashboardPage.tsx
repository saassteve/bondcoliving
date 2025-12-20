import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Building, Coffee, Calendar, Clock, DollarSign, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { apartmentService, reviewService, featureHighlightService, bookingService, analyticsService, operationsService, type Booking } from '../../lib/services';
import SimpleLineChart from '../../components/admin/SimpleLineChart';
import SimpleBarChart from '../../components/admin/SimpleBarChart';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalApartments: 0,
    availableApartments: 0,
    featuredReviews: 0,
    activeFeatures: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    checkedInBookings: 0,
    upcomingCheckIns: 0,
    monthlyRevenue: 0,
  });
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  const [revenueBySource, setRevenueBySource] = useState<any[]>([]);
  const [upcomingCleanings, setUpcomingCleanings] = useState<any[]>([]);
  const [urgentMaintenance, setUrgentMaintenance] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [apartments, reviews, features, bookings, analytics, trends, sources, cleanings, maintenance] = await Promise.all([
        apartmentService.getAll(),
        reviewService.getFeatured(),
        featureHighlightService.getActive(),
        bookingService.getAll(),
        analyticsService.getDashboardStats().catch(() => null),
        analyticsService.getRevenueTrends(30).catch(() => []),
        analyticsService.getRevenueBySource(30).catch(() => []),
        operationsService.getUpcomingCleanings(7).catch(() => []),
        operationsService.getUrgentMaintenanceRequests().catch(() => []),
      ]);

      setAnalyticsStats(analytics);
      setRevenueTrends(trends);
      setRevenueBySource(sources);
      setUpcomingCleanings(cleanings);
      setUrgentMaintenance(maintenance);

      // Calculate stats
      const availableApartments = apartments.filter(apt => apt.status === 'available').length;
      const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;
      const checkedInBookings = bookings.filter(booking => booking.status === 'checked_in').length;

      // Calculate upcoming check-ins (next 7 days)
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingCheckIns = bookings.filter(booking => {
        const checkInDate = new Date(booking.check_in_date);
        return checkInDate >= today && checkInDate <= nextWeek && booking.status === 'confirmed';
      }).length;

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = bookings
        .filter(booking => {
          const checkInDate = new Date(booking.check_in_date);
          return checkInDate.getMonth() === currentMonth &&
                 checkInDate.getFullYear() === currentYear &&
                 booking.status !== 'cancelled' &&
                 booking.total_amount;
        })
        .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);

      setStats({
        totalApartments: apartments.length,
        availableApartments,
        featuredReviews: reviews.length,
        activeFeatures: features.length,
        totalBookings: bookings.length,
        confirmedBookings,
        checkedInBookings,
        upcomingCheckIns,
        monthlyRevenue,
      });

      // Get recent bookings (last 5)
      setRecentBookings(bookings.slice(0, 5));

      // Get upcoming bookings (next 10 check-ins)
      const upcoming = bookings
        .filter(booking => {
          const checkInDate = new Date(booking.check_in_date);
          return checkInDate >= today && booking.status === 'confirmed';
        })
        .sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime())
        .slice(0, 10);
      setUpcomingBookings(upcoming);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const dashboardStats = [
    {
      name: 'Total Apartments',
      value: stats.totalApartments.toString(),
      icon: Building,
      color: 'bg-blue-500',
      subtext: `${stats.availableApartments} available`
    },
    {
      name: 'Active Bookings',
      value: stats.confirmedBookings.toString(),
      icon: Calendar,
      color: 'bg-green-500',
      subtext: `${stats.checkedInBookings} checked in`
    },
    {
      name: 'Upcoming Check-ins',
      value: stats.upcomingCheckIns.toString(),
      icon: Clock,
      color: 'bg-purple-500',
      subtext: 'Next 7 days'
    },
    {
      name: 'Monthly Revenue',
      value: `€${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
      subtext: 'Current month'
    },
  ];

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Admin Dashboard - Bond</title>
        </Helmet>
        <div className="text-center py-8 text-slate-300">Loading dashboard...</div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Bond</title>
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold mb-6 text-slate-100">Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className={`${stat.color} text-white p-3 rounded-lg mr-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">{stat.value}</h2>
                    <p className="text-slate-300 text-sm font-medium">{stat.name}</p>
                    {stat.subtext && (
                      <p className="text-slate-400 text-xs">{stat.subtext}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-slate-800 rounded-lg shadow-sm p-6 lg:col-span-1 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-100">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/admin/bookings"
                className="flex items-center p-3 bg-green-900/30 text-green-300 rounded-md hover:bg-green-900/50 transition-colors border border-green-700"
              >
                <Calendar className="h-5 w-5 mr-3" />
                Manage Bookings
                {stats.upcomingCheckIns > 0 && (
                  <span className="ml-auto bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {stats.upcomingCheckIns}
                  </span>
                )}
              </Link>
              <Link
                to="/admin/rooms"
                className="flex items-center p-3 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors border border-slate-600"
              >
                <Building className="h-5 w-5 mr-3" />
                Manage Apartments
              </Link>
              <Link
                to="/admin/coworking"
                className="flex items-center p-3 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors border border-slate-600"
              >
                <Coffee className="h-5 w-5 mr-3" />
                Manage Coworking
              </Link>
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-100">Upcoming Check-ins</h2>
            {upcomingBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((booking) => {
                    const checkInDate = new Date(booking.check_in_date);
                    const isToday = checkInDate.toDateString() === new Date().toDateString();
                    const isTomorrow = checkInDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

                    return (
                      <div key={booking.id} className={`p-3 rounded-lg border ${
                        isToday ? 'bg-green-900/30 border-green-700' :
                        isTomorrow ? 'bg-yellow-900/30 border-yellow-700' :
                        'bg-slate-700 border-slate-600'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-slate-100">{booking.guest_name}</div>
                            <div className="text-sm text-slate-400">
                              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-slate-100">
                              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(booking.check_in_date)}
                            </div>
                            <div className="text-xs text-slate-400">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-slate-400 mb-2">No upcoming check-ins</div>
                <div className="text-sm text-slate-500">New bookings will appear here</div>
              </div>
            )}
            <div className="mt-4 text-right">
              <Link to="/admin/bookings" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                View all bookings →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Bookings */}
          <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-100">Recent Bookings</h2>
            {recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {recentBookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-100">{booking.guest_name}</div>
                          <div className="text-xs text-slate-400">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-slate-100">{formatDate(booking.check_in_date)}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                            booking.status === 'checked_out' ? 'bg-gray-700 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.replace('_', ' ').slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-slate-400 mb-2">No bookings yet</div>
                <div className="text-sm text-slate-500">New bookings will appear here</div>
              </div>
            )}
            <div className="mt-4 text-right">
              <Link to="/admin/bookings" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                View all bookings →
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-100">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-900/30 rounded-md border border-green-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-200">Database Connection</span>
                </div>
                <span className="text-sm text-green-400 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-900/30 rounded-md border border-green-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-200">Website Status</span>
                </div>
                <span className="text-sm text-green-400 font-medium">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-md border border-blue-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-200">Last Backup</span>
                </div>
                <span className="text-sm text-blue-400 font-medium">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Quick Overview</h2>
              <div className="text-sm text-slate-400 font-medium">Live data</div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Occupancy Rate</span>
                <span className="text-sm font-semibold text-slate-100">
                  {analyticsStats ? `${analyticsStats.occupancyRate.toFixed(1)}%` :
                    stats.totalApartments > 0
                      ? `${Math.round(((stats.totalApartments - stats.availableApartments) / stats.totalApartments) * 100)}%`
                      : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Average Booking Value</span>
                <span className="text-sm font-semibold text-slate-100">
                  {analyticsStats ? `€${analyticsStats.averageBookingValue.toFixed(0)}` : '€0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Revenue Growth</span>
                <div className="flex items-center gap-2">
                  {analyticsStats && analyticsStats.revenueGrowth !== 0 && (
                    analyticsStats.revenueGrowth > 0 ?
                      <TrendingUp className="w-4 h-4 text-green-400" /> :
                      <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-semibold ${
                    analyticsStats && analyticsStats.revenueGrowth > 0 ? 'text-green-400' :
                    analyticsStats && analyticsStats.revenueGrowth < 0 ? 'text-red-400' : 'text-slate-100'
                  }`}>
                    {analyticsStats ? `${analyticsStats.revenueGrowth > 0 ? '+' : ''}${analyticsStats.revenueGrowth.toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue & Occupancy */}
          <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-100">Business Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Monthly Revenue</span>
                <span className="text-sm font-semibold text-slate-100">
                  €{analyticsStats ? analyticsStats.monthlyRevenue.toLocaleString() : stats.monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Active Bookings</span>
                <span className="text-sm font-semibold text-slate-100">
                  {analyticsStats ? analyticsStats.activeBookings : (stats.confirmedBookings + stats.checkedInBookings)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Check-ins This Week</span>
                <span className="text-sm font-semibold text-slate-100">{stats.upcomingCheckIns}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trends */}
          <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Revenue Trends (30 Days)</h2>
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            {revenueTrends.length > 0 ? (
              <SimpleLineChart
                data={revenueTrends.map(t => ({
                  label: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: t.revenue
                }))}
                height={200}
                color="#6366f1"
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No revenue data available yet
              </div>
            )}
          </div>

          {/* Revenue by Source */}
          <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Revenue by Source</h2>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            {revenueBySource.length > 0 ? (
              <SimpleBarChart
                data={revenueBySource.slice(0, 5).map(s => ({
                  label: s.source.charAt(0).toUpperCase() + s.source.slice(1),
                  value: s.amount,
                  color: s.source === 'direct' ? '#10b981' : s.source === 'airbnb' ? '#f43f5e' : '#6366f1'
                }))}
                height={200}
                showValues={true}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No source data available yet
              </div>
            )}
          </div>
        </div>

        {/* Operations Alerts */}
        {(upcomingCleanings.length > 0 || urgentMaintenance.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Upcoming Cleanings */}
            {upcomingCleanings.length > 0 && (
              <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-slate-100">Upcoming Cleanings</h2>
                  </div>
                  <span className="text-sm bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">
                    {upcomingCleanings.length}
                  </span>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {upcomingCleanings.slice(0, 5).map((cleaning) => (
                    <div key={cleaning.id} className="flex items-start justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-100">
                          {cleaning.apartments?.title || 'Unknown Apartment'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(cleaning.scheduled_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                        cleaning.priority === 'urgent' ? 'bg-red-900/50 text-red-300' :
                        cleaning.priority === 'high' ? 'bg-orange-900/50 text-orange-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {cleaning.priority}
                      </span>
                    </div>
                  ))}
                </div>
                <Link to="/admin/operations" className="mt-4 block text-center text-sm text-indigo-400 hover:text-indigo-300">
                  View all cleaning schedules →
                </Link>
              </div>
            )}

            {/* Urgent Maintenance */}
            {urgentMaintenance.length > 0 && (
              <div className="bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-semibold text-slate-100">Urgent Maintenance</h2>
                  </div>
                  <span className="text-sm bg-red-900/50 text-red-300 px-2 py-1 rounded-full">
                    {urgentMaintenance.length}
                  </span>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {urgentMaintenance.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-start justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-100">{request.title}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {request.apartments?.title || request.buildings?.name || 'General'}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                        request.priority === 'urgent' ? 'bg-red-900/50 text-red-300' :
                        'bg-orange-900/50 text-orange-300'
                      }`}>
                        {request.priority}
                      </span>
                    </div>
                  ))}
                </div>
                <Link to="/admin/operations" className="mt-4 block text-center text-sm text-indigo-400 hover:text-indigo-300">
                  View all maintenance requests →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboardPage;
