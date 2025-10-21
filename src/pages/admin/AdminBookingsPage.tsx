import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { bookingService, apartmentService, availabilityService, type Booking, type Apartment } from '../../lib/supabase';
import BookingForm from '../../components/admin/BookingForm';
import BookingTimeline from '../../components/admin/BookingTimeline';
import BookingCalendar from '../../components/admin/BookingCalendar';
import BookingList from '../../components/admin/BookingList';
import BookingDetailsModal from '../../components/admin/BookingDetailsModal';

const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockouts, setBlockouts] = useState<any[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'timeline'>('timeline');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());
  const [timelineDays, setTimelineDays] = useState(30);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    checkedOut: 0,
    cancelled: 0,
    icalBlockouts: 0,
  });

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  useEffect(() => {
    initializeTimelineView();
  }, []);

  // Update stats whenever bookings or blockouts change
  useEffect(() => {
    updateStats();
  }, [bookings, blockouts]);

  const initializeTimelineView = async () => {
    await fetchData();
  };

  const updateStats = () => {
    setStats({
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      checkedIn: bookings.filter(b => b.status === 'checked_in').length,
      checkedOut: bookings.filter(b => b.status === 'checked_out').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      icalBlockouts: blockouts.length,
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, apartmentsData, blockoutsData] = await Promise.all([
        bookingService.getAll(),
        apartmentService.getAll(),
        availabilityService.getBlockoutRanges()
      ]);

      setBookings(bookingsData);
      setApartments(apartmentsData);
      setBlockouts(blockoutsData);
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

  const getTimelineDates = () => {
    const dates = [];
    for (let i = 0; i < timelineDays; i++) {
      const date = new Date(timelineStartDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const previousTimelinePeriod = () => {
    const newDate = new Date(timelineStartDate);
    newDate.setDate(newDate.getDate() - timelineDays);
    setTimelineStartDate(newDate);
  };

  const nextTimelinePeriod = () => {
    const newDate = new Date(timelineStartDate);
    newDate.setDate(newDate.getDate() + timelineDays);
    setTimelineStartDate(newDate);
  };

  const goToToday = () => {
    setTimelineStartDate(new Date());
  };

  const goToNextBooking = () => {
    const today = new Date();
    const upcomingBookings = bookings.filter(booking => 
      new Date(booking.check_in_date) >= today
    ).sort((a, b) => 
      new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()
    );
    
    if (upcomingBookings.length > 0) {
      setTimelineStartDate(new Date(upcomingBookings[0].check_in_date));
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
          <BookingTimeline
            bookings={bookings}
            apartments={apartments}
            onBookingClick={setSelectedBooking}
            getApartmentTitle={getApartmentTitle}
            formatDate={formatDate}
            timelineStartDate={timelineStartDate}
            timelineDays={timelineDays}
            onTimelineStartDateChange={setTimelineStartDate}
            onTimelineDaysChange={setTimelineDays}
            onGoToToday={goToToday}
            onGoToNextBooking={goToNextBooking}
            onPreviousPeriod={previousTimelinePeriod}
            onNextPeriod={nextTimelinePeriod}
          />
        ) : null}

        {/* Render appropriate view */}
        {currentView === 'timeline' ? null : currentView === 'calendar' ? (
          <BookingCalendar
            apartments={apartments}
            onBookingClick={setSelectedBooking}
            getApartmentTitle={getApartmentTitle}
            formatDate={formatDate}
          />
        ) : (
          <BookingList
            bookings={bookings}
            blockouts={blockouts}
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