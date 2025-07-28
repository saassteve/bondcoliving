import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Calendar, Users, MapPin, Phone, Mail, Key, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { bookingService, apartmentService, type Booking, type Apartment } from '../../lib/supabase';

const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'current' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    apartment_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    booking_source: 'direct',
    booking_reference: '',
    door_code: '',
    special_instructions: '',
    guest_count: 1,
    total_amount: '',
    status: 'confirmed' as const
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, apartmentsData] = await Promise.all([
        bookingService.getAll(),
        apartmentService.getAll()
      ]);
      setBookings(bookingsData);
      setApartments(apartmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      apartment_id: '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in_date: '',
      check_out_date: '',
      booking_source: 'direct',
      booking_reference: '',
      door_code: '',
      special_instructions: '',
      guest_count: 1,
      total_amount: '',
      status: 'confirmed'
    });
    setEditingBooking(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const bookingData = {
        ...formData,
        guest_count: parseInt(formData.guest_count.toString()),
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null
      };

      if (editingBooking) {
        await bookingService.update(editingBooking.id, bookingData);
      } else {
        await bookingService.create(bookingData);
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (booking: Booking) => {
    setFormData({
      apartment_id: booking.apartment_id,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email || '',
      guest_phone: booking.guest_phone || '',
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      booking_source: booking.booking_source,
      booking_reference: booking.booking_reference || '',
      door_code: booking.door_code || '',
      special_instructions: booking.special_instructions || '',
      guest_count: booking.guest_count,
      total_amount: booking.total_amount?.toString() || '',
      status: booking.status
    });
    setEditingBooking(booking);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking? This will also update the apartment availability.')) return;

    try {
      await bookingService.delete(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const getFilteredBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    let filtered = bookings;

    // Apply status filter
    switch (filter) {
      case 'upcoming':
        filtered = bookings.filter(b => b.check_in_date > today);
        break;
      case 'current':
        filtered = bookings.filter(b => b.check_in_date <= today && b.check_out_date >= today);
        break;
      case 'past':
        filtered = bookings.filter(b => b.check_out_date < today);
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthBookings = bookings.filter(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      
      return (checkIn <= monthEnd && checkOut >= monthStart);
    });

    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-200"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      const dayBookings = monthBookings.filter(booking => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        return date >= checkIn && date < checkOut;
      });

      days.push(
        <div key={day} className="h-24 bg-white border border-gray-200 p-1 overflow-y-auto">
          <div className="font-medium text-sm mb-1">{day}</div>
          {dayBookings.map(booking => (
            <div
              key={booking.id}
              onClick={() => setSelectedBooking(booking)}
              className="text-xs p-1 mb-1 rounded cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200 truncate"
              title={`${booking.guest_name} - ${apartments.find(a => a.id === booking.apartment_id)?.title}`}
            >
              {booking.guest_name}
            </div>
          ))}
        </div>
      );
    }
    
    return days;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Bookings - Bond Admin</title>
        </Helmet>
        <div className="text-center py-8">Loading bookings...</div>
      </>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <>
      <Helmet>
        <title>Bookings - Bond Admin</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings & Calendar</h1>
            <p className="text-gray-600">Manage guest bookings and apartment availability</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Calendar
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Booking
            </button>
          </div>
        </div>

        {view === 'list' ? (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Bookings</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="current">Current Stays</option>
                    <option value="past">Past</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by guest name, email, or booking reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Apartment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => {
                      const apartment = apartments.find(a => a.id === booking.apartment_id);
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{booking.guest_name}</div>
                              <div className="text-sm text-gray-600">{booking.guest_email}</div>
                              <div className="text-xs text-gray-500">{booking.guest_count} guest{booking.guest_count !== 1 ? 's' : ''}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {apartment?.title || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div>{formatDate(booking.check_in_date)}</div>
                              <div className="text-gray-600">to {formatDate(booking.check_out_date)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{booking.booking_source}</div>
                            {booking.booking_reference && (
                              <div className="text-xs text-gray-500">{booking.booking_reference}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className="text-indigo-600 hover:text-indigo-800 p-1"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(booking)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit booking"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(booking.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete booking"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Calendar View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 text-center py-2 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-700">
              <div>Sunday</div>
              <div>Monday</div>
              <div>Tuesday</div>
              <div>Wednesday</div>
              <div>Thursday</div>
              <div>Friday</div>
              <div>Saturday</div>
            </div>
            
            <div className="grid grid-cols-7 auto-rows-auto">
              {renderCalendar()}
            </div>
          </div>
        )}

        {/* Booking Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingBooking ? 'Edit Booking' : 'Add New Booking'}
                </h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apartment *
                    </label>
                    <select
                      value={formData.apartment_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, apartment_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select apartment</option>
                      {apartments.map(apt => (
                        <option key={apt.id} value={apt.id}>{apt.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guest Name *
                    </label>
                    <input
                      type="text"
                      value={formData.guest_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.guest_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, guest_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.guest_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, guest_phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      value={formData.check_in_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      value={formData.check_out_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_out_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Booking Source
                    </label>
                    <select
                      value={formData.booking_source}
                      onChange={(e) => setFormData(prev => ({ ...prev, booking_source: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="direct">Direct</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="booking.com">Booking.com</option>
                      <option value="vrbo">VRBO</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Booking Reference
                    </label>
                    <input
                      type="text"
                      value={formData.booking_reference}
                      onChange={(e) => setFormData(prev => ({ ...prev, booking_reference: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Platform booking ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guest Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.guest_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, guest_count: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Door Code
                    </label>
                    <input
                      type="text"
                      value={formData.door_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, door_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="checked_in">Checked In</option>
                      <option value="checked_out">Checked Out</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    value={formData.special_instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Any special notes or instructions for this booking..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingBooking ? 'Update' : 'Create'} Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Guest Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium">{selectedBooking.guest_name}</span>
                      </div>
                      {selectedBooking.guest_email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{selectedBooking.guest_email}</span>
                        </div>
                      )}
                      {selectedBooking.guest_phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{selectedBooking.guest_phone}</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        {selectedBooking.guest_count} guest{selectedBooking.guest_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Booking Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{apartments.find(a => a.id === selectedBooking.apartment_id)?.title}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{formatDate(selectedBooking.check_in_date)} - {formatDate(selectedBooking.check_out_date)}</span>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedBooking.door_code && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Key className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Door Code</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-blue-900">
                      {selectedBooking.door_code}
                    </div>
                  </div>
                )}

                {selectedBooking.special_instructions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Special Instructions</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700">{selectedBooking.special_instructions}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Booking Source:</span>
                    <span className="ml-2 font-medium">{selectedBooking.booking_source}</span>
                  </div>
                  {selectedBooking.booking_reference && (
                    <div>
                      <span className="text-gray-500">Reference:</span>
                      <span className="ml-2 font-medium">{selectedBooking.booking_reference}</span>
                    </div>
                  )}
                  {selectedBooking.total_amount && (
                    <div>
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="ml-2 font-medium">€{selectedBooking.total_amount}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleEdit(selectedBooking);
                      setSelectedBooking(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminBookingsPage;