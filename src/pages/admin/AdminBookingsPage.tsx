import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus } from 'lucide-react';
import { bookingService, apartmentService, type Booking, type Apartment } from '../../lib/supabase';
import BookingForm from '../../components/admin/BookingForm';
import BookingTimeline from '../../components/admin/BookingTimeline';
import BookingCalendar from '../../components/admin/BookingCalendar';
import BookingList from '../../components/admin/BookingList';
import BookingDetailsModal from '../../components/admin/BookingDetailsModal';

const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'timeline'>('timeline');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    checkedOut: 0,
    cancelled: 0,
  });

  useEffect(() => {
    initializeTimelineView();
  }, []);

  // Update stats whenever bookings change
  useEffect(() => {
    updateStats();
  }, [bookings]);
  const updateStats = () => {
    setStats({
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      checkedIn: bookings.filter(b => b.status === 'checked_in').length,
      checkedOut: bookings.filter(b => b.status === 'checked_out').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    });
  };

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

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (editingBooking) {
        await bookingService.update(editingBooking.id, formData);
      } else {
        await bookingService.create(formData);
      }
      
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking? This will also update apartment availability.')) return;

    try {
      await bookingService.delete(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const resetForm = () => {
    setEditingBooking(null);
    setShowForm(false);
    setSelectedBooking(null);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const getApartmentTitle = (apartmentId: string) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    return apartment?.title || 'Unknown Apartment';
  };

  const exportBookings = () => {
    const csvContent = [
      ['Guest Name', 'Email', 'Phone', 'Apartment', 'Check-in', 'Check-out', 'Source', 'Reference', 'Status', 'Amount'],
      ...filteredBookings.map(booking => [
        booking.guest_name,
        booking.guest_email || '',
        booking.guest_phone || '',
        getApartmentTitle(booking.apartment_id),
        booking.check_in_date,
        booking.check_out_date,
        booking.booking_source,
        booking.booking_reference || '',
        booking.status,
        booking.total_amount || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bond-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  return (
    <>
      <Helmet>
        <title>Bookings - Bond Admin</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Bookings Management</h1>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentView('timeline')}
                className={`px-3 py-1 rounded-l-md ${
                  currentView === 'timeline' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-1 ${
                  currentView === 'calendar' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-3 py-1 rounded-r-md ${
                  currentView === 'list' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                List
              </button>
            </div>
            
            <button
              onClick={exportBookings}
              className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
            
            <button
              onClick={() => setShowForm(true)}
              className="btn bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Booking
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-700 font-medium">Total Bookings</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-700 font-medium">Confirmed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            <div className="text-sm text-gray-700 font-medium">Checked In</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.checkedOut}</div>
            <div className="text-sm text-gray-700 font-medium">Checked Out</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-700 font-medium">Cancelled</div>
          </div>
        </div>

        {currentView === 'timeline' ? (
          /* Timeline View - Improved */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {/* Timeline Controls */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-2">
                <button onClick={previousTimelinePeriod} className="p-2 rounded hover:bg-gray-200 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextTimelinePeriod} className="p-2 rounded hover:bg-gray-200 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  {timelineStartDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })} - {new Date(timelineStartDate.getTime() + (timelineDays - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Today
                </button>
                <button 
                  onClick={goToNextBooking}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Next Booking
                </button>
                <select
                  value={timelineDays}
                  onChange={(e) => setTimelineDays(parseInt(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>
            
            {/* Timeline Header - Dates */}
            <div className="border-b border-gray-200 bg-gray-50 overflow-hidden">
              <div className="flex">
                <div className="w-48 p-3 border-r border-gray-200 text-sm font-medium text-gray-700 bg-white sticky left-0 z-20">
                  Apartments
                </div>
                <div className="flex-1 overflow-x-auto" id="timeline-header">
                  <div className="flex min-w-max" style={{ minWidth: `${timelineDays * 48}px` }}>
                    {getTimelineDates().map((date, index) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      
                      return (
                        <div 
                          key={index} 
                          className={`w-12 p-2 text-center text-xs font-medium border-r border-gray-200 ${
                            isToday ? 'bg-blue-100 text-blue-800' : 
                            isWeekend ? 'bg-gray-100 text-gray-600' : 'text-gray-600'
                          }`}
                        >
                          <div className="font-semibold">{date.getDate()}</div>
                          <div className="text-xs opacity-75">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          {index === 0 || date.getDate() === 1 ? (
                            <div className="text-xs opacity-60 mt-1">
                              {date.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timeline Body - Apartments and Bookings */}
            <div className="max-h-96 overflow-y-auto" id="timeline-body">
              <div className="overflow-x-auto">

        {/* Render appropriate view */}
        {currentView === 'timeline' ? (
          <BookingTimeline
            bookings={bookings}
            apartments={apartments}
            onBookingClick={setSelectedBooking}
            getApartmentTitle={getApartmentTitle}
            formatDate={formatDate}
          />
        ) : currentView === 'calendar' ? (
          <BookingCalendar
            apartments={apartments}
            onBookingClick={setSelectedBooking}
            getApartmentTitle={getApartmentTitle}
            formatDate={formatDate}
          />
        ) : (
          <BookingList
            bookings={bookings}
            filter={filter}
            onFilterChange={setFilter}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={setSelectedBooking}
            onExport={exportBookings}
            getApartmentTitle={getApartmentTitle}
            formatDate={formatDate}
            stats={stats}
          />
        )}

        {/* Booking Form Modal */}
        {showForm && (
          <BookingForm
            booking={editingBooking}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Booking Details Modal */}
        {selectedBooking && !showForm && (
          <BookingDetailsModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getApartmentTitle={getApartmentTitle}
            formatDate={formatDate}
          />
        )}
      </div>
    </>
  );

};

export default AdminBookingsPage;