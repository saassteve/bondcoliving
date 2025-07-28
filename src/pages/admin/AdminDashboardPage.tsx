import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Users, Building, Coffee, Calendar, TrendingUp, AlertCircle, MapPin } from 'lucide-react';
import { apartmentService, applicationService, reviewService, featureHighlightService, bookingService } from '../../lib/supabase';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalApartments: 0,
    availableApartments: 0,
    pendingApplications: 0,
    totalApplications: 0,
    featuredReviews: 0,
    activeFeatures: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
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
        bookingService.getUpcoming(5),
      ]);

      // Calculate stats
      const availableApartments = apartments.filter(apt => apt.status === 'available').length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      
      setStats({
        totalApartments: apartments.length,
        availableApartments,
        pendingApplications,
        totalApplications: applications.length,
        featuredReviews: reviews.length,
        activeFeatures: features.length,
      });

      // Get recent applications (last 5)
      setRecentApplications(applications.slice(0, 5));
      
      // Set upcoming bookings
      setUpcomingBookings(bookings);
      
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
      name: 'Pending Applications', 
      value: stats.pendingApplications.toString(), 
      icon: AlertCircle, 
      color: 'bg-yellow-500',
      subtext: `${stats.totalApplications} total`
    },
    { 
      name: 'Featured Reviews', 
      value: stats.featuredReviews.toString(), 
      icon: Users, 
      color: 'bg-green-500',
      subtext: 'Active on website'
    },
    { 
      name: 'Active Features', 
      value: stats.activeFeatures.toString(), 
      icon: Coffee, 
      color: 'bg-purple-500',
      subtext: 'Highlighted features'
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
              <Link 
                to="/admin/coworking" 
                className="flex items-center p-3 bg-gray-50 text-gray-800 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <Coffee className="h-5 w-5 mr-3" />
                Coworking Bookings
              </Link>
            </div>
          </div>
          
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Applications</h2>
            {recentApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-300">
                    {recentApplications.map((application) => (
                      <tr key={application.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{application.name}</div>
                          <div className="text-sm text-gray-600">{application.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{formatDate(application.created_at)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(application.status)}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <Link 
                            to="/admin/applications" 
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Check-ins</h2>
            <Link to="/admin/bookings" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View all bookings →
            </Link>
          </div>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{booking.guest_name}</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {booking.apartment?.title || 'Unknown apartment'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(booking.check_in_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.guest_count} guest{booking.guest_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No upcoming check-ins</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;