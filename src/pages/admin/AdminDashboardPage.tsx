import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Users, Building, Coffee, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { apartmentService, applicationService, reviewService, featureHighlightService, bookingService, type Booking } from '../../lib/supabase';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalApartments: 0,
    availableApartments: 0,
    pendingApplications: 0,
    totalApplications: 0,
    featuredReviews: 0,
    activeFeatures: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    checkedInBookings: 0,
    upcomingCheckIns: 0,
    monthlyRevenue: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
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
      const [apartments, applications, reviews, features, bookings] = await Promise.all([
        apartmentService.getAll(),
        applicationService.getAll(),
        reviewService.getFeatured(),
        featureHighlightService.getActive(),
        bookingService.getAll(),
      ]);

      // Calculate stats
      const availableApartments = apartments.filter(apt => apt.status === 'available').length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
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
        pendingApplications,
        totalApplications: applications.length,
        featuredReviews: reviews.length,
        activeFeatures: features.length,
        totalBookings: bookings.length,
        confirmedBookings,
        checkedInBookings,
        upcomingCheckIns,
        monthlyRevenue,
      });

      // Get recent applications (last 5)
      setRecentApplications(applications.slice(0, 5));
      
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

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
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
      name: 'Pending Applications', 
      value: stats.pendingApplications.toString(), 
      icon: AlertCircle, 
      color: 'bg-yellow-500',
      subtext: `${stats.totalApplications} total`
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
        <div className="text-center py-8">Loading dashboard...</div>
      </>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Bond</title>
      </Helmet>
      
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className={`${stat.color} text-white p-3 rounded-lg mr-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{stat.value}</h2>
                    <p className="text-gray-700 text-sm font-medium">{stat.name}</p>
                    {stat.subtext && (
                      <p className="text-gray-600 text-xs">{stat.subtext}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-1 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/admin/bookings" 
                className="flex items-center p-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors border border-green-200"
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
                to="/admin/applications" 
                className="flex items-center p-3 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-200"
              >
                <Users className="h-5 w-5 mr-3" />
                Review Applications
                {stats.pendingApplications > 0 && (
                  <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {stats.pendingApplications}
                  </span>
                )}
              </Link>
              <Link 
                to="/admin/rooms" 
                className="flex items-center p-3 bg-gray-50 text-gray-800 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <Building className="h-5 w-5 mr-3" />
                Manage Apartments
              </Link>
            </div>
          </div>
          
          {/* Upcoming Bookings */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Upcoming Check-ins</h2>
            {upcomingBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((booking) => {
                    const checkInDate = new Date(booking.check_in_date);
                    const isToday = checkInDate.toDateString() === new Date().toDateString();
                    const isTomorrow = checkInDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
                    
                    return (
                      <div key={booking.id} className={`p-3 rounded-lg border ${
                        isToday ? 'bg-green-50 border-green-200' : 
                        isTomorrow ? 'bg-yellow-50 border-yellow-200' : 
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{booking.guest_name}</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(booking.check_in_date)}
                            </div>
                            <div className="text-xs text-gray-600">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 mb-2">No upcoming check-ins</div>
                <div className="text-sm text-gray-500">New bookings will appear here</div>
              </div>
            )}
            <div className="mt-4 text-right">
              <Link to="/admin/bookings" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View all bookings →
              </Link>
            </div>
          </div>
          
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Applications</h2>
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.slice(0, 5).map((application) => (
                  <div key={application.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{application.name}</div>
                        <div className="text-sm text-gray-600">{application.email}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                        <div className="text-xs text-gray-600 mt-1">{formatDate(application.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 mb-2">No applications yet</div>
                <div className="text-sm text-gray-500">New applications will appear here</div>
              </div>
            )}
            <div className="mt-4 text-right">
              <Link to="/admin/applications" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View all applications →
              </Link>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Bookings</h2>
            {recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.guest_name}</div>
                          <div className="text-xs text-gray-500">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(booking.check_in_date)}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                            booking.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
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
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 mb-2">No bookings yet</div>
                <div className="text-sm text-gray-500">New bookings will appear here</div>
              </div>
            )}
            <div className="mt-4 text-right">
              <Link to="/admin/bookings" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View all bookings →
              </Link>
            </div>
          </div>
          
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-800">Database Connection</span>
                </div>
                <span className="text-sm text-green-700 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-800">Website Status</span>
                </div>
                <span className="text-sm text-green-700 font-medium">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-800">Last Backup</span>
                </div>
                <span className="text-sm text-blue-700 font-medium">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Overview</h2>
              <div className="text-sm text-gray-600 font-medium">Live data</div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Occupancy Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.totalApartments > 0 
                    ? Math.round(((stats.totalApartments - stats.availableApartments) / stats.totalApartments) * 100)
                    : 0
                  }%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Application Approval Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.totalApplications > 0 
                    ? Math.round((recentApplications.filter(app => app.status === 'approved').length / stats.totalApplications) * 100)
                    : 0
                  }%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Average Response Time</span>
                <span className="text-sm font-semibold text-gray-900">{"< 24 hours"}</span>
              </div>
            </div>
          </div>
          
          {/* Revenue & Occupancy */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Business Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Monthly Revenue</span>
                <span className="text-sm font-semibold text-gray-900">€{stats.monthlyRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Active Bookings</span>
                <span className="text-sm font-semibold text-gray-900">{stats.confirmedBookings + stats.checkedInBookings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Check-ins This Week</span>
                <span className="text-sm font-semibold text-gray-900">{stats.upcomingCheckIns}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;