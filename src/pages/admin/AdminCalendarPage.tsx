import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Key, 
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  guestStayService, 
  apartmentService, 
  type CalendarEvent, 
  type UpcomingStay, 
  type GuestStay,
  type Apartment 
} from '../../lib/supabase';

const AdminCalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [upcomingStays, setUpcomingStays] = useState<UpcomingStay[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestStay | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestStay | null>(null);
  const [view, setView] = useState<'calendar' | 'upcoming'>('calendar');

  const [newGuest, setNewGuest] = useState({
    apartment_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    booking_platform: 'direct',
    booking_reference: '',
    door_code: '',
    special_instructions: '',
    guest_count: 1,
    total_amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const [calendarData, upcomingData, apartmentsData] = await Promise.all([
        guestStayService.getCalendarWithGuests(startDate, endDate),
        guestStayService.getUpcoming(30),
        apartmentService.getAll()
      ]);
      
      setCalendarEvents(calendarData);
      setUpcomingStays(upcomingData);
      setApartments(apartmentsData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    try {
      if (!newGuest.guest_name || !newGuest.apartment_id || !newGuest.check_in_date || !newGuest.check_out_date) {
        alert('Please fill in all required fields');
        return;
      }

      await guestStayService.create({
        ...newGuest,
        total_amount: newGuest.total_amount ? parseFloat(newGuest.total_amount) : undefined
      });

      setShowAddGuest(false);
      setNewGuest({
        apartment_id: '',
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        check_in_date: '',
        check_out_date: '',
        booking_platform: 'direct',
        booking_reference: '',
        door_code: '',
        special_instructions: '',
        guest_count: 1,
        total_amount: '',
        notes: ''
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error adding guest:', error);
      alert('Failed to add guest stay');
    }
  };

  const handleUpdateGuest = async () => {
    if (!editingGuest) return;

    try {
      await guestStayService.update(editingGuest.id, {
        guest_name: editingGuest.guest_name,
        guest_email: editingGuest.guest_email,
        guest_phone: editingGuest.guest_phone,
        door_code: editingGuest.door_code,
        special_instructions: editingGuest.special_instructions,
        guest_count: editingGuest.guest_count,
        total_amount: editingGuest.total_amount,
        status: editingGuest.status,
        notes: editingGuest.notes
      });

      setEditingGuest(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating guest:', error);
      alert('Failed to update guest stay');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!window.confirm('Are you sure you want to delete this guest stay? This will also clear the calendar availability.')) {
      return;
    }

    try {
      await guestStayService.delete(guestId);
      setSelectedGuest(null);
      setEditingGuest(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('Failed to delete guest stay');
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getGuestStatusColor = (status: string) => {
    switch (status) {
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

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = calendarEvents.filter(event => event.date === date);
      const isToday = date === today;
      
      days.push(
        <div
          key={date}
          className={`h-24 border border-gray-200 p-1 overflow-y-auto ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <div className={`font-medium text-sm mb-1 ${isToday ? 'text-blue-800' : 'text-gray-900'}`}>
            {day}
            {isToday && <span className="ml-1 text-xs">(Today)</span>}
          </div>
          
          {dayEvents.map((event, index) => (
            <div
              key={index}
              className={`text-xs p-1 mb-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(event.status)}`}
              onClick={() => {
                if (event.guest_name) {
                  // Find and show guest details
                  const guestStay = upcomingStays.find(stay => 
                    stay.guest_name === event.guest_name && 
                    stay.apartment_id === event.apartment_id
                  );
                  if (guestStay) {
                    setSelectedGuest(guestStay as any);
                  }
                }
              }}
              title={`${event.apartment_title} - ${event.status}${event.guest_name ? ` - ${event.guest_name}` : ''}`}
            >
              <div className="truncate font-medium">{event.apartment_title}</div>
              {event.guest_name && (
                <div className="truncate">
                  {event.is_checkin && '→ '}
                  {event.is_checkout && '← '}
                  {event.guest_name}
                </div>
              )}
              {event.door_code && (
                <div className="truncate text-xs opacity-75">
                  🔑 {event.door_code}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return days;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Calendar & Guests - Bond Admin</title>
        </Helmet>
        <div className="text-center py-8">Loading calendar...</div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Calendar & Guests - Bond Admin</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar & Guest Management</h1>
            <p className="text-gray-600">Manage bookings, guest stays, and availability</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'calendar' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2 inline" />
                Calendar
              </button>
              <button
                onClick={() => setView('upcoming')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'upcoming' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4 mr-2 inline" />
                Upcoming
              </button>
            </div>
            
            <button
              onClick={() => setShowAddGuest(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Guest Stay
            </button>
          </div>
        </div>

        {view === 'calendar' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
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
            
            <div className="grid grid-cols-7">
              {renderCalendar()}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Upcoming Stays (Next 30 Days)</h2>
            </div>
            
            {upcomingStays.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming stays</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {upcomingStays.map((stay) => (
                  <div key={stay.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{stay.guest_name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGuestStatusColor(stay.status)}`}>
                            {stay.status.replace('_', ' ')}
                          </span>
                          {stay.days_until_checkin === 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                              Checking in today
                            </span>
                          )}
                          {stay.days_until_checkin === 1 && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Checking in tomorrow
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {stay.apartment_title}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(stay.check_in_date)} - {formatDate(stay.check_out_date)}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            {stay.guest_count} guest{stay.guest_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {(stay.guest_email || stay.guest_phone || stay.door_code) && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {stay.guest_email && (
                              <div className="flex items-center text-gray-600">
                                <Mail className="w-4 h-4 mr-2" />
                                <a href={`mailto:${stay.guest_email}`} className="hover:text-indigo-600">
                                  {stay.guest_email}
                                </a>
                              </div>
                            )}
                            {stay.guest_phone && (
                              <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                <a href={`tel:${stay.guest_phone}`} className="hover:text-indigo-600">
                                  {stay.guest_phone}
                                </a>
                              </div>
                            )}
                            {stay.door_code && (
                              <div className="flex items-center text-gray-600">
                                <Key className="w-4 h-4 mr-2" />
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                  {stay.door_code}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {stay.booking_platform && stay.booking_platform !== 'direct' && (
                          <div className="mt-2 text-sm text-gray-500">
                            Booked via {stay.booking_platform}
                            {stay.booking_reference && ` (${stay.booking_reference})`}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setSelectedGuest(stay as any)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingGuest(stay as any)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg"
                          title="Edit guest"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(stay.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                          title="Delete stay"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Guest Modal */}
        {showAddGuest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add Guest Stay</h2>
                <button onClick={() => setShowAddGuest(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apartment *</label>
                  <select
                    value={newGuest.apartment_id}
                    onChange={(e) => setNewGuest({ ...newGuest, apartment_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select apartment</option>
                    {apartments.map((apt) => (
                      <option key={apt.id} value={apt.id}>{apt.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name *</label>
                  <input
                    type="text"
                    value={newGuest.guest_name}
                    onChange={(e) => setNewGuest({ ...newGuest, guest_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newGuest.guest_email}
                    onChange={(e) => setNewGuest({ ...newGuest, guest_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newGuest.guest_phone}
                    onChange={(e) => setNewGuest({ ...newGuest, guest_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date *</label>
                  <input
                    type="date"
                    value={newGuest.check_in_date}
                    onChange={(e) => setNewGuest({ ...newGuest, check_in_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date *</label>
                  <input
                    type="date"
                    value={newGuest.check_out_date}
                    onChange={(e) => setNewGuest({ ...newGuest, check_out_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Platform</label>
                  <select
                    value={newGuest.booking_platform}
                    onChange={(e) => setNewGuest({ ...newGuest, booking_platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="direct">Direct Booking</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="booking.com">Booking.com</option>
                    <option value="vrbo">VRBO</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference</label>
                  <input
                    type="text"
                    value={newGuest.booking_reference}
                    onChange={(e) => setNewGuest({ ...newGuest, booking_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Door Code</label>
                  <input
                    type="text"
                    value={newGuest.door_code}
                    onChange={(e) => setNewGuest({ ...newGuest, door_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 1234"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    value={newGuest.guest_count}
                    onChange={(e) => setNewGuest({ ...newGuest, guest_count: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newGuest.total_amount}
                    onChange={(e) => setNewGuest({ ...newGuest, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={newGuest.special_instructions}
                  onChange={(e) => setNewGuest({ ...newGuest, special_instructions: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any special instructions for the guest..."
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddGuest(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGuest}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Guest Stay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Guest Modal */}
        {editingGuest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Edit Guest Stay</h2>
                <button onClick={() => setEditingGuest(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                  <input
                    type="text"
                    value={editingGuest.guest_name}
                    onChange={(e) => setEditingGuest({ ...editingGuest, guest_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingGuest.guest_email || ''}
                    onChange={(e) => setEditingGuest({ ...editingGuest, guest_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingGuest.guest_phone || ''}
                    onChange={(e) => setEditingGuest({ ...editingGuest, guest_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Door Code</label>
                  <input
                    type="text"
                    value={editingGuest.door_code || ''}
                    onChange={(e) => setEditingGuest({ ...editingGuest, door_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    value={editingGuest.guest_count || 1}
                    onChange={(e) => setEditingGuest({ ...editingGuest, guest_count: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingGuest.status || 'confirmed'}
                    onChange={(e) => setEditingGuest({ ...editingGuest, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingGuest.total_amount || ''}
                    onChange={(e) => setEditingGuest({ ...editingGuest, total_amount: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={editingGuest.special_instructions || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, special_instructions: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editingGuest.notes || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingGuest(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGuest}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Guest
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guest Details Modal */}
        {selectedGuest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Guest Details</h2>
                <button onClick={() => setSelectedGuest(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{selectedGuest.guest_name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGuestStatusColor(selectedGuest.status || 'confirmed')}`}>
                    {(selectedGuest.status || 'confirmed').replace('_', ' ')}
                  </span>
                </div>
                
                {selectedGuest.guest_email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${selectedGuest.guest_email}`} className="text-indigo-600 hover:text-indigo-800">
                      {selectedGuest.guest_email}
                    </a>
                  </div>
                )}
                
                {selectedGuest.guest_phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`tel:${selectedGuest.guest_phone}`} className="text-indigo-600 hover:text-indigo-800">
                      {selectedGuest.guest_phone}
                    </a>
                  </div>
                )}
                
                {selectedGuest.door_code && (
                  <div className="flex items-center">
                    <Key className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{selectedGuest.door_code}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{formatDate(selectedGuest.check_in_date)} - {formatDate(selectedGuest.check_out_date)}</span>
                </div>
                
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{selectedGuest.guest_count} guest{selectedGuest.guest_count !== 1 ? 's' : ''}</span>
                </div>
                
                {selectedGuest.special_instructions && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Special Instructions</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedGuest.special_instructions}</p>
                  </div>
                )}
                
                {selectedGuest.notes && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Notes</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedGuest.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingGuest(selectedGuest);
                    setSelectedGuest(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Edit Guest
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminCalendarPage;