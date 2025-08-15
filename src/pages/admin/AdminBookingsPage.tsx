import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, Filter, Download, Mail, Phone, Eye } from 'lucide-react';
import { bookingService, apartmentService, type Booking, type Apartment } from '../../lib/supabase';
import BookingForm from '../../components/admin/BookingForm';

const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarBookings, setCalendarBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<Record<string, any[]>>({});
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'timeline'>('timeline');
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
    fetchData();
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, currentView]);

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

  const fetchCalendarData = async () => {
    if (currentView !== 'calendar') return;
    
    try {
      const { bookings: monthBookings, availability: monthAvailability } = await bookingService.getBookingsWithAvailability(
        currentMonth.getFullYear(),
        currentMonth.getMonth()
      );
      setCalendarBookings(monthBookings);
      setAvailability(monthAvailability);
    } catch (error) {
      console.error('Error fetching month bookings:', error);
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
      await fetchCalendarData();
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
      await fetchCalendarData();
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

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBadgeClass = (status: string) => {
    switch(status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'checked_in':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const filteredBookings = (filter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filter))
    .sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());

  // Calendar rendering functions
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 bg-gray-50 border border-gray-200"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isToday = dateString === todayString;
      const isPast = date < today && !isToday;
      
      // Find bookings for this day
      const dayBookings = calendarBookings.filter(booking => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        return date >= checkIn && date < checkOut;
      });
      
      // Find availability blocks for this day (from apartment calendars)
      const dayAvailabilityBlocks = Object.entries(availability).flatMap(([apartmentId, aptAvailability]) => {
        const apartment = apartments.find(apt => apt.id === apartmentId);
        const dayAvailability = aptAvailability.find((avail: any) => avail.date === dateString);
        
        if (dayAvailability && dayAvailability.status !== 'available') {
          return [{
            id: `availability-${dayAvailability.id}`,
            apartment_id: apartmentId,
            apartment_title: apartment?.title || 'Unknown',
            status: dayAvailability.status,
            notes: dayAvailability.notes,
            booking_reference: dayAvailability.booking_reference,
            type: 'availability'
          }];
        }
        return [];
      });
      
      // Combine bookings and availability blocks
      const allDayItems = [
        ...dayBookings.map(booking => ({
          ...booking,
          type: 'booking',
          apartment_title: getApartmentTitle(booking.apartment_id)
        })),
        ...dayAvailabilityBlocks
      ];
      
      days.push(
        <div key={day} className={`h-28 border border-gray-200 p-2 overflow-y-auto relative ${
          isToday ? 'bg-blue-50 border-blue-300' : 
          isPast ? 'bg-gray-50' : 'bg-white'
        }`}>
          <div className={`font-semibold text-sm mb-2 ${
            isToday ? 'text-blue-700' : 
            isPast ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {day}
            {isToday && <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>}
          </div>
          {allDayItems.length > 0 ? (
            <div className="space-y-1">
              {allDayItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    if (item.type === 'booking') {
                      setSelectedBooking(item as Booking);
                    }
                  }}
                  className={`text-xs p-1.5 rounded-md truncate border transition-all ${item.type === 'booking' ? 'cursor-pointer hover:shadow-sm hover:scale-105' : ''} ${
                    item.type === 'booking' ? (
                      item.status === 'confirmed' ? 'bg-blue-100 text-blue-900 border-blue-200' :
                      item.status === 'checked_in' ? 'bg-green-100 text-green-900 border-green-200' :
                      item.status === 'checked_out' ? 'bg-gray-100 text-gray-900 border-gray-200' :
                      'bg-red-100 text-red-900 border-red-200'
                    ) : (
                      item.status === 'booked' ? 'bg-orange-100 text-orange-900 border-orange-200' :
                      'bg-yellow-100 text-yellow-900 border-yellow-200'
                    )
                  }`}
                  title={
                    item.type === 'booking' 
                      ? `${(item as any).guest_name} - ${item.apartment_title}` 
                      : `${item.status.toUpperCase()} - ${item.apartment_title}${item.notes ? ` (${item.notes})` : ''}`
                  }
                >
                  <div className="font-medium">
                    {item.type === 'booking' ? (item as any).guest_name : item.status.toUpperCase()}
                  </div>
                  <div className="text-xs opacity-75 truncate">
                    {item.apartment_title}
                  </div>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

        {/* Calendar Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-gray-900 font-medium">Confirmed Booking</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-gray-900 font-medium">Checked In</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-gray-900 font-medium">Checked Out</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-gray-900 font-medium">Cancelled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
              <span className="text-gray-900 font-medium">Blocked (Apartment Calendar)</span>
            </div>
          </div>
        </div>
        {currentView === 'timeline' ? (
          /* Timeline View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <button onClick={previousMonth} className="p-1 rounded hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Timeline Header - Days of Month */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                <div className="w-48 p-3 border-r border-gray-200 text-sm font-medium text-gray-700">
                  Apartments
                </div>
                <div className="flex-1 overflow-x-auto">
                  <div className="flex min-w-max">
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
                      const day = i + 1;
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <div 
                          key={day} 
                          className={`w-12 p-2 text-center text-xs font-medium border-r border-gray-200 ${
                            isToday ? 'bg-blue-100 text-blue-800' : 'text-gray-600'
                          }`}
                        >
                          <div className="font-semibold">{day}</div>
                          <div className="text-xs opacity-75">
                            {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timeline Body - Apartments and Bookings */}
            <div className="max-h-96 overflow-y-auto">
              {apartments.map((apartment) => {
                const apartmentBookings = calendarBookings.filter(booking => booking.apartment_id === apartment.id);
                
                return (
                  <div key={apartment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex">
                      <div className="w-48 p-4 border-r border-gray-200">
                        <div className="text-sm font-medium text-gray-900 truncate" title={apartment.title}>
                          {apartment.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          €{apartment.price}/month
                        </div>
                      </div>
                      <div className="flex-1 relative overflow-x-auto">
                        <div className="flex min-w-max relative h-16">
                          {/* Day columns */}
                          {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
                            const day = i + 1;
                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const isToday = date.toDateString() === new Date().toDateString();
                            
                            return (
                              <div 
                                key={day} 
                                className={`w-12 border-r border-gray-200 h-full ${
                                  isToday ? 'bg-blue-50' : ''
                                }`}
                              />
                            );
                          })}
                          
                          {/* Booking bars */}
                          {apartmentBookings.map((booking) => {
                            const checkIn = new Date(booking.check_in_date);
                            const checkOut = new Date(booking.check_out_date);
                            const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                            const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                            
                            // Calculate position and width
                            const startDay = Math.max(1, checkIn.getDate());
                            const endDay = Math.min(monthEnd.getDate(), checkOut.getDate());
                            
                            // Only show if booking overlaps with current month
                            if (checkOut < monthStart || checkIn > monthEnd) return null;
                            
                            const left = (startDay - 1) * 48; // 48px per day (w-12)
                            const width = (endDay - startDay + 1) * 48;
                            
                            const getBookingColor = (status: string) => {
                              switch (status) {
                                case 'confirmed':
                                  return 'bg-blue-500 hover:bg-blue-600';
                                case 'checked_in':
                                  return 'bg-green-500 hover:bg-green-600';
                                case 'checked_out':
                                  return 'bg-gray-500 hover:bg-gray-600';
                                case 'cancelled':
                                  return 'bg-red-500 hover:bg-red-600';
                                default:
                                  return 'bg-blue-500 hover:bg-blue-600';
                              }
                            };
                            
                            return (
                              <div
                                key={booking.id}
                                onClick={() => setSelectedBooking(booking)}
                                className={`absolute top-2 h-12 rounded-md cursor-pointer transition-all ${getBookingColor(booking.status)} text-white text-xs font-medium flex items-center px-2 shadow-sm hover:shadow-md hover:scale-105 z-10`}
                                style={{
                                  left: `${left}px`,
                                  width: `${Math.max(width, 48)}px` // Minimum width of one day
                                }}
                                title={`${booking.guest_name} - ${formatDate(booking.check_in_date)} to ${formatDate(booking.check_out_date)}`}
                              >
                                <div className="truncate">
                                  <div className="font-medium">{booking.guest_name}</div>
                                  {width > 96 && ( // Only show dates if bar is wide enough
                                    <div className="text-xs opacity-90">
                                      {checkIn.getDate()}/{checkIn.getMonth() + 1} - {checkOut.getDate()}/{checkOut.getMonth() + 1}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {apartments.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No apartments configured</p>
                </div>
              )}
            </div>
            
            {/* Timeline Legend */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Checked In</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span>Checked Out</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Cancelled</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
        ) : currentView === 'calendar' ? (
          /* Calendar View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <button onClick={previousMonth} className="p-1 rounded hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
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
        ) : (
          /* List View */
          <>
            <div className="bg-white rounded-lg shadow-sm mb-6 p-4 border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-600">Filter by status:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'all' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('confirmed')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'confirmed' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    Confirmed
                  </button>
                  <button
                    onClick={() => setFilter('checked_in')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'checked_in' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Checked In
                  </button>
                  <button
                    onClick={() => setFilter('checked_out')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'checked_out' 
                        ? 'bg-gray-600 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Checked Out
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

            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Apartment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.guest_name}</div>
                          <div className="text-sm text-gray-700">
                            {booking.guest_email && (
                              <div className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {booking.guest_email}
                              </div>
                            )}
                            {booking.guest_phone && (
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {booking.guest_phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getApartmentTitle(booking.apartment_id)}</div>
                          <div className="text-sm text-gray-700">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(booking.check_in_date)}</div>
                          <div className="text-sm text-gray-700">to {formatDate(booking.check_out_date)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">{booking.booking_source}</div>
                          {booking.booking_reference && (
                            <div className="text-sm text-gray-700">{booking.booking_reference}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(booking.status)}`}>
                            {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.replace('_', ' ').slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="text-indigo-600 hover:text-indigo-800 mr-3"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 inline-block" />
                          </button>
                          <button
                            onClick={() => handleEdit(booking)}
                            className="text-indigo-600 hover:text-indigo-800 mr-3"
                            title="Edit booking"
                          >
                            <Edit className="w-4 h-4 inline-block" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete booking"
                          >
                            <Trash2 className="w-4 h-4 inline-block" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold">Booking Details</h2>
                  <button onClick={() => setSelectedBooking(null)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Guest</h3>
                      <p className="font-medium">{selectedBooking.guest_name}</p>
                      {selectedBooking.guest_email && <p className="text-sm text-gray-600">{selectedBooking.guest_email}</p>}
                      {selectedBooking.guest_phone && <p className="text-sm text-gray-600">{selectedBooking.guest_phone}</p>}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Apartment</h3>
                      <p className="font-medium">{getApartmentTitle(selectedBooking.apartment_id)}</p>
                      <p className="text-sm text-gray-600">{selectedBooking.guest_count} guest{selectedBooking.guest_count > 1 ? 's' : ''}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Check-in</h3>
                      <p className="font-medium">{formatDate(selectedBooking.check_in_date)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Check-out</h3>
                      <p className="font-medium">{formatDate(selectedBooking.check_out_date)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Source</h3>
                      <p className="font-medium capitalize">{selectedBooking.booking_source}</p>
                      {selectedBooking.booking_reference && (
                        <p className="text-sm text-gray-600">Ref: {selectedBooking.booking_reference}</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClass(selectedBooking.status)}`}>
                        {selectedBooking.status.replace('_', ' ').charAt(0).toUpperCase() + selectedBooking.status.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {selectedBooking.door_code && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Door Code</h3>
                      <p className="font-mono text-lg">{selectedBooking.door_code}</p>
                    </div>
                  )}
                  
                  {selectedBooking.total_amount && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                      <p className="font-medium">€{selectedBooking.total_amount}</p>
                    </div>
                  )}
                  
                  {selectedBooking.special_instructions && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Special Instructions</h3>
                      <p className="text-gray-700">{selectedBooking.special_instructions}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => handleEdit(selectedBooking)}
                    className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedBooking.id)}
                    className="btn bg-red-600 text-white hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
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