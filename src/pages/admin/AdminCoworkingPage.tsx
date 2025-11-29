import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Check, Edit, Trash, DollarSign, Users, Settings, Image, Mail } from 'lucide-react';
import { coworkingBookingService, coworkingPassService, type CoworkingBooking, type CoworkingPass } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import PassAvailabilityManager from '../../components/admin/PassAvailabilityManager';
import CoworkingImageManager from '../../components/admin/CoworkingImageManager';

const AdminCoworkingPage: React.FC = () => {
  const [bookings, setBookings] = useState<CoworkingBooking[]>([]);
  const [passes, setPasses] = useState<CoworkingPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'stats' | 'passes' | 'images'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingBooking, setEditingBooking] = useState<CoworkingBooking | null>(null);
  const [managingPass, setManagingPass] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, passesData, revenueData] = await Promise.all([
        coworkingBookingService.getAll(),
        coworkingPassService.getAll(),
        coworkingBookingService.getRevenue(),
      ]);
      setBookings(bookingsData);
      setPasses(passesData);
      setRevenue(revenueData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking: CoworkingBooking) => {
    setEditingBooking({ ...booking });
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    try {
      await coworkingBookingService.update(editingBooking.id, {
        customer_name: editingBooking.customer_name,
        customer_email: editingBooking.customer_email,
        customer_phone: editingBooking.customer_phone,
        start_date: editingBooking.start_date,
        booking_status: editingBooking.booking_status,
        payment_status: editingBooking.payment_status,
        access_code: editingBooking.access_code,
        special_notes: editingBooking.special_notes,
      });
      await fetchData();
      setEditingBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
  };

  const handleSendAccessCodeEmail = async (bookingId: string) => {
    if (!window.confirm('Send access code email to customer?')) return;

    try {
      setSendingEmail(bookingId);

      const { data, error } = await supabase.functions.invoke('send-coworking-email', {
        body: {
          emailType: 'access_code',
          bookingId: bookingId,
          resendEmail: true
        }
      });

      if (error) {
        console.error('Edge function error:', error);

        let errorMessage = 'Failed to send access code email.';

        if (error.message) {
          errorMessage += '\n\nError: ' + error.message;
        }

        if (error.context?.error) {
          errorMessage += '\n\nDetails: ' + error.context.error;
        }

        alert(errorMessage);
        return;
      }

      if (data?.error) {
        console.error('Email function returned error:', data);
        alert('Failed to send access code email.\n\nError: ' + (data.error || 'Unknown error'));
        return;
      }

      alert('Access code email sent successfully!\n\nThe customer will receive their access code shortly.');
      await fetchData();
    } catch (error) {
      console.error('Error sending access code email:', error);

      let errorMessage = 'Failed to send access code email.';

      if (error instanceof Error) {
        errorMessage += '\n\nError: ' + error.message;
      }

      errorMessage += '\n\nPlease check:\n- Resend API key is configured\n- Service role key is in vault\n- Booking has an access code';

      alert(errorMessage);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      await coworkingBookingService.delete(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const previousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return newDate;
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return newDate;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(booking => booking.booking_status === filter || booking.payment_status === filter);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];
    const monthBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      return (bookingDate >= monthStart && bookingDate <= monthEnd) ||
        (endDate >= monthStart && endDate <= monthEnd) ||
        (bookingDate <= monthStart && endDate >= monthEnd);
    });

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-900 border border-slate-700"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];

      const dayBookings = monthBookings.filter(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        return date >= bookingStart && date <= bookingEnd;
      });

      days.push(
        <div key={day} className="h-24 bg-slate-800 border border-slate-700 p-2 overflow-y-auto">
          <div className="font-medium text-sm mb-1 text-slate-100">{day}</div>
          {dayBookings.length > 0 ? (
            <div className="space-y-1">
              {dayBookings.map(booking => (
                <div
                  key={booking.id}
                  className={`text-xs p-1 rounded truncate ${statusBadgeClass(booking.booking_status)}`}
                  title={`${booking.customer_name} - ${booking.pass?.name}`}
                >
                  {booking.customer_name}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Coworking - Bond Admin</title>
      </Helmet>

      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Coworking Management</h1>

          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentView('list')}
                className={`px-3 py-1 rounded-l-md ${
                  currentView === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-200'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-1 ${
                  currentView === 'calendar'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-200'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setCurrentView('stats')}
                className={`px-3 py-1 ${
                  currentView === 'stats'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-200'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setCurrentView('passes')}
                className={`px-3 py-1 ${
                  currentView === 'passes'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Passes
              </button>
              <button
                onClick={() => setCurrentView('images')}
                className={`px-3 py-1 rounded-r-md ${
                  currentView === 'images'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-200'
                }`}
              >
                <Image className="w-4 h-4 inline mr-1" />
                Images
              </button>
            </div>
          </div>
        </div>

        {currentView === 'stats' && revenue && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">€{revenue.total.toFixed(2)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Bookings</p>
                  <p className="text-3xl font-bold text-white">{revenue.count}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Passes</p>
                  <p className="text-3xl font-bold text-white">{passes.filter(p => p.is_active).length}</p>
                </div>
                <Calendar className="w-12 h-12 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {currentView === 'list' ? (
          <>
            <div className="bg-slate-800 rounded-lg shadow-sm mb-6 p-4 border border-slate-700">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-slate-300">Filter by status:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    All ({bookings.length})
                  </button>
                  <button
                    onClick={() => setFilter('confirmed')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'confirmed'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Confirmed
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('paid')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'paid'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    onClick={() => setFilter('cancelled')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Pass Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Date(s)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900 divide-y divide-slate-700">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-mono text-slate-100">{booking.booking_reference}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-100">{booking.customer_name}</div>
                            <div className="text-sm text-slate-400">{booking.customer_email}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-slate-100">{booking.pass?.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-slate-100">{formatDate(booking.start_date)}</div>
                            <div className="text-sm text-slate-400">to {formatDate(booking.end_date)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-slate-100">€{parseFloat(booking.total_amount as any).toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(
                                booking.booking_status
                              )}`}
                            >
                              {booking.booking_status}
                            </span>
                            <br />
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(
                                booking.payment_status
                              )} mt-1`}
                            >
                              {booking.payment_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(booking)}
                              className="text-primary-600 hover:text-primary-800 mr-3"
                            >
                              <Edit className="w-4 h-4 inline-block" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash className="w-4 h-4 inline-block" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : currentView === 'calendar' ? (
          <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <button onClick={previousMonth} className="p-1 rounded hover:bg-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>

              <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-700">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center py-2 border-b border-slate-700 bg-slate-800 text-xs font-medium text-slate-300">
              <div>Sunday</div>
              <div>Monday</div>
              <div>Tuesday</div>
              <div>Wednesday</div>
              <div>Thursday</div>
              <div>Friday</div>
              <div>Saturday</div>
            </div>

            <div className="grid grid-cols-7 auto-rows-auto">{renderCalendar()}</div>
          </div>
        ) : currentView === 'passes' ? (
          <div className="space-y-6">
            {managingPass ? (
              <PassAvailabilityManager
                passId={managingPass}
                onClose={() => setManagingPass(null)}
              />
            ) : (
              <div className="bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-600">
                  <h2 className="text-lg font-semibold text-[#C5C5B5]">Manage Passes</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Configure capacity and availability for each pass type
                  </p>
                </div>
                <div className="divide-y divide-gray-600">
                  {passes.map((pass) => {
                    const capacityPercentage = pass.max_capacity
                      ? Math.round((pass.current_capacity / pass.max_capacity) * 100)
                      : 0;

                    return (
                      <div key={pass.id} className="p-6 hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-[#C5C5B5]">{pass.name}</h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  pass.is_active
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-gray-600 text-gray-400'
                                }`}
                              >
                                {pass.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{pass.description}</p>

                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-gray-400">Price:</span>
                                <span className="ml-2 font-bold text-[#C5C5B5]">€{pass.price}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Duration:</span>
                                <span className="ml-2 font-bold text-[#C5C5B5]">
                                  {pass.duration_days} days
                                </span>
                              </div>
                            </div>

                            {pass.is_capacity_limited && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-400">
                                    Capacity: {pass.current_capacity} / {pass.max_capacity || 0}
                                  </span>
                                  <span className="text-sm font-bold text-[#C5C5B5]">
                                    {capacityPercentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      capacityPercentage >= 90
                                        ? 'bg-red-500'
                                        : capacityPercentage >= 70
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {pass.is_date_restricted && (
                              <div className="mt-3 flex items-center gap-4 text-sm">
                                {pass.available_from && (
                                  <span className="text-gray-400">
                                    From: <span className="text-[#C5C5B5]">{new Date(pass.available_from).toLocaleDateString()}</span>
                                  </span>
                                )}
                                {pass.available_until && (
                                  <span className="text-gray-400">
                                    Until: <span className="text-[#C5C5B5]">{new Date(pass.available_until).toLocaleDateString()}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setManagingPass(pass.id)}
                            className="btn-primary"
                          >
                            <Settings className="w-4 h-4 inline mr-2" />
                            Manage
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : currentView === 'images' ? (
          <CoworkingImageManager />
        ) : null}
      </div>

      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Edit Booking</h2>
                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Guest Name</label>
                  <input
                    type="text"
                    className="input"
                    value={editingBooking.customer_name}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, customer_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={editingBooking.customer_email}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, customer_email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={editingBooking.customer_phone || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, customer_phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Booking Status</label>
                  <select
                    className="input"
                    value={editingBooking.booking_status}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        booking_status: e.target.value as any,
                      })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Payment Status</label>
                  <select
                    className="input"
                    value={editingBooking.payment_status}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, payment_status: e.target.value as any })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Access Code (Door Code)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input font-mono flex-1"
                      value={editingBooking.access_code || ''}
                      onChange={(e) =>
                        setEditingBooking({ ...editingBooking, access_code: e.target.value })
                      }
                      placeholder="Enter door code (e.g., 1234#)"
                    />
                    {editingBooking.access_code && (
                      <button
                        type="button"
                        onClick={() => handleSendAccessCodeEmail(editingBooking.id)}
                        disabled={sendingEmail === editingBooking.id}
                        className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title="Send access code email to customer"
                      >
                        <Mail className="w-4 h-4 inline mr-1" />
                        {sendingEmail === editingBooking.id ? 'Sending...' : 'Send Email'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {editingBooking.access_code_email_sent_at
                      ? `Email sent on ${new Date(editingBooking.access_code_email_sent_at).toLocaleString()}`
                      : 'Customer will receive this code via email after you click "Send Email"'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Special Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={editingBooking.special_notes || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, special_notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={handleCancelEdit} className="btn bg-white border border-gray-600 text-gray-300 hover:bg-gray-700">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCoworkingPage;
