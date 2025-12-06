import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Download, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { bookingService, apartmentService, availabilityService, type Booking, type Apartment } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { generateInvitationCode } from '../../lib/guestAuth';
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());
  const [timelineDays, setTimelineDays] = useState(30);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    checkedOut: 0,
    cancelled: 0,
  });
  const [guestInviteSuccess, setGuestInviteSuccess] = useState<string | null>(null);
  const [guestInviteError, setGuestInviteError] = useState<string | null>(null);

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
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      console.log('AdminBookingsPage - Fetching data...');

      const [bookingsData, apartmentsData] = await Promise.all([
        bookingService.getAll(),
        apartmentService.getAll()
      ]);

      console.log('AdminBookingsPage - Fetched', bookingsData.length, 'bookings');
      setBookings(bookingsData);
      setApartments(apartmentsData);
    } catch (error: any) {
      console.error('AdminBookingsPage - Error fetching data:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      setFetchError(`Failed to load bookings: ${errorMessage}`);
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

  const handleCreateGuestInvitation = async (booking: Booking) => {
    try {
      setGuestInviteError(null);
      setGuestInviteSuccess(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGuestInviteError('You must be logged in');
        return;
      }

      // Check if guest_email is available
      if (!booking.guest_email) {
        setGuestInviteError('Cannot create invitation: booking has no guest email');
        return;
      }

      // Generate invitation code
      const code = generateInvitationCode();

      // Use booking dates for access period
      const startDate = new Date(booking.check_in_date);
      const endDate = new Date(booking.check_out_date);

      // Invitation expires 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const { error: insertError } = await supabase.from('guest_invitations').insert({
        invitation_code: code,
        email: booking.guest_email,
        full_name: booking.guest_name,
        user_type: 'overnight',
        booking_id: booking.id,
        access_start_date: startDate.toISOString(),
        access_end_date: endDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      });

      if (insertError) {
        console.error('Error creating guest invitation:', insertError);
        setGuestInviteError(`Failed to create invitation: ${insertError.message}`);
        return;
      }

      // Success!
      setGuestInviteSuccess(`Guest invitation created successfully for ${booking.guest_name}`);
      setSelectedBooking(null);

      // Clear success message after 5 seconds
      setTimeout(() => setGuestInviteSuccess(null), 5000);
    } catch (error) {
      console.error('Unexpected error creating guest invitation:', error);
      setGuestInviteError('An unexpected error occurred');
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
        {/* Success/Error Messages */}
        {guestInviteSuccess && (
          <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200 flex items-center">
            <Check className="h-5 w-5 mr-2" />
            {guestInviteSuccess}
          </div>
        )}
        {guestInviteError && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {guestInviteError}
          </div>
        )}
        {fetchError && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            <strong>Error:</strong> {fetchError}
            <div className="mt-2 text-sm text-red-300">
              Check the browser console for more details.
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Bookings Management</h1>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentView('timeline')}
                className={`px-3 py-1 rounded-l-md ${
                  currentView === 'timeline' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-1 ${
                  currentView === 'calendar' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-3 py-1 rounded-r-md ${
                  currentView === 'list' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                List
              </button>
            </div>
            
            <button
              onClick={exportBookings}
              className="btn bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
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
          <div className="bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-600">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-300 font-semibold">Total Bookings</div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-600">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-300 font-semibold">Confirmed</div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-600">
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            <div className="text-sm text-gray-300 font-semibold">Checked In</div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-600">
            <div className="text-2xl font-bold text-gray-600">{stats.checkedOut}</div>
            <div className="text-sm text-gray-300 font-semibold">Checked Out</div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-600">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-300 font-semibold">Cancelled</div>
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
            onCreateGuestInvitation={handleCreateGuestInvitation}
            getApartmentTitle={getApartmentTitle}
            formatDate={formatDate}
          />
        )}
      </div>
    </>
  );

};

export default AdminBookingsPage;