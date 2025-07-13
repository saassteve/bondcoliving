import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calendar, ChevronLeft, ChevronRight, User, Plus, X, Check, Edit, Trash } from 'lucide-react';

// Mock coworking bookings data
const initialBookings = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@example.com',
    passType: 'Day Pass',
    date: '2025-03-20',
    status: 'confirmed',
  },
  {
    id: 2,
    name: 'Maria Garcia',
    email: 'maria@example.com',
    passType: 'Weekly Pass',
    date: '2025-03-21',
    endDate: '2025-03-28',
    status: 'confirmed',
  },
  {
    id: 3,
    name: 'David Kim',
    email: 'david@example.com',
    passType: 'Monthly Pass',
    date: '2025-04-01',
    endDate: '2025-04-30',
    status: 'pending',
  },
  {
    id: 4,
    name: 'Sophie Chen',
    email: 'sophie@example.com',
    passType: 'Day Pass',
    date: '2025-03-25',
    status: 'cancelled',
  },
  {
    id: 5,
    name: 'James Wilson',
    email: 'james@example.com',
    passType: 'Weekly Pass',
    date: '2025-03-27',
    endDate: '2025-04-03',
    status: 'confirmed',
  },
];

const AdminCoworkingPage: React.FC = () => {
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState('all');
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    id: Date.now(),
    name: '',
    email: '',
    passType: 'Day Pass',
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'confirmed',
  });
  
  const handleEdit = (booking: any) => {
    setEditingBooking({ ...booking });
  };
  
  const handleSaveEdit = () => {
    setBookings(bookings.map(booking => booking.id === editingBooking.id ? editingBooking : booking));
    setEditingBooking(null);
  };
  
  const handleCancelEdit = () => {
    setEditingBooking(null);
  };
  
  const handleAddBooking = () => {
    setIsAddingBooking(true);
  };
  
  const handleSaveNewBooking = () => {
    if (newBooking.name && newBooking.email && newBooking.date) {
      // Set endDate based on passType
      let endDate = '';
      if (newBooking.passType === 'Weekly Pass') {
        const date = new Date(newBooking.date);
        date.setDate(date.getDate() + 7);
        endDate = date.toISOString().split('T')[0];
      } else if (newBooking.passType === 'Monthly Pass') {
        const date = new Date(newBooking.date);
        date.setMonth(date.getMonth() + 1);
        endDate = date.toISOString().split('T')[0];
      }
      
      setBookings([...bookings, { 
        ...newBooking, 
        id: Date.now(),
        endDate: endDate || null
      }]);
      
      setIsAddingBooking(false);
      setNewBooking({
        id: Date.now(),
        name: '',
        email: '',
        passType: 'Day Pass',
        date: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'confirmed',
      });
    }
  };
  
  const handleCancelAdd = () => {
    setIsAddingBooking(false);
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      setBookings(bookings.filter(booking => booking.id !== id));
    }
  };
  
  const handleChangePassType = (value: string, isNewBooking = false) => {
    if (isNewBooking) {
      let endDate = '';
      if (value === 'Weekly Pass') {
        const date = new Date(newBooking.date);
        date.setDate(date.getDate() + 7);
        endDate = date.toISOString().split('T')[0];
      } else if (value === 'Monthly Pass') {
        const date = new Date(newBooking.date);
        date.setMonth(date.getMonth() + 1);
        endDate = date.toISOString().split('T')[0];
      }
      
      setNewBooking({ 
        ...newBooking, 
        passType: value,
        endDate: endDate
      });
    } else {
      // For editing booking
      let endDate = editingBooking.endDate;
      if (value === 'Weekly Pass') {
        const date = new Date(editingBooking.date);
        date.setDate(date.getDate() + 7);
        endDate = date.toISOString().split('T')[0];
      } else if (value === 'Monthly Pass') {
        const date = new Date(editingBooking.date);
        date.setMonth(date.getMonth() + 1);
        endDate = date.toISOString().split('T')[0];
      } else {
        endDate = null;
      }
      
      setEditingBooking({ 
        ...editingBooking, 
        passType: value,
        endDate: endDate
      });
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
    switch(status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filter);
  
  // Functions for calendar view
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
      const bookingDate = new Date(booking.date);
      const bookingYear = bookingDate.getFullYear();
      const bookingMonth = bookingDate.getMonth();
      
      // Check if booking is in current month
      if (bookingYear === year && bookingMonth === month) {
        return true;
      }
      
      // For weekly and monthly passes, check if they span into this month
      if (booking.endDate) {
        const endDate = new Date(booking.endDate);
        if (endDate.getFullYear() === year && endDate.getMonth() === month) {
          return true;
        }
        
        // Check if booking spans across this month
        if (bookingDate <= new Date(year, month, 1) && endDate >= new Date(year, month + 1, 0)) {
          return true;
        }
      }
      
      return false;
    });
    
    // Add empty cells for days of the week before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-200"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Find bookings for this day
      const dayBookings = monthBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        
        // For day passes, just check if the date matches
        if (booking.passType === 'Day Pass') {
          return bookingDate.getDate() === day && 
                 bookingDate.getMonth() === month && 
                 bookingDate.getFullYear() === year;
        }
        
        // For weekly and monthly passes, check if this day falls within the booking period
        if (booking.endDate) {
          const endDate = new Date(booking.endDate);
          return date >= bookingDate && date <= endDate;
        }
        
        return false;
      });
      
      days.push(
        <div key={day} className="h-24 bg-white border border-gray-200 p-2 overflow-y-auto">
          <div className="font-medium text-sm mb-1">{day}</div>
          {dayBookings.length > 0 ? (
            <div className="space-y-1">
              {dayBookings.map(booking => (
                <div 
                  key={booking.id} 
                  className={`text-xs p-1 rounded truncate ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}
                  title={`${booking.name} - ${booking.passType}`}
                >
                  {booking.name}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <>
      <Helmet>
        <title>Coworking - Bond Admin</title>
      </Helmet>
      
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Coworking Bookings</h1>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentView('list')}
                className={`px-3 py-1 rounded-l-md ${
                  currentView === 'list' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-1 rounded-r-md ${
                  currentView === 'calendar' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Calendar
              </button>
            </div>
            
            <button onClick={handleAddBooking} className="btn-primary">
              <Plus className="w-4 h-4 mr-1" />
              Add Booking
            </button>
          </div>
        </div>
        
        {currentView === 'list' ? (
          <>
            <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-600">Filter by status:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === 'all' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
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
            
            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pass Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date(s)
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
                    {isAddingBooking && (
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="Guest Name"
                            className="input text-sm"
                            value={newBooking.name}
                            onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            className="input text-sm mt-1"
                            value={newBooking.email}
                            onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            className="input text-sm"
                            value={newBooking.passType}
                            onChange={(e) => handleChangePassType(e.target.value, true)}
                          >
                            <option value="Day Pass">Day Pass</option>
                            <option value="Weekly Pass">Weekly Pass</option>
                            <option value="Monthly Pass">Monthly Pass</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="date"
                            className="input text-sm"
                            value={newBooking.date}
                            onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                          />
                          {(newBooking.passType === 'Weekly Pass' || newBooking.passType === 'Monthly Pass') && newBooking.endDate && (
                            <div className="text-sm text-gray-500 mt-1">
                              to {formatDate(newBooking.endDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            className="input text-sm"
                            value={newBooking.status}
                            onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value })}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={handleSaveNewBooking}
                            className="text-green-600 hover:text-green-800 mr-3"
                          >
                            <Check className="w-4 h-4 inline-block" />
                          </button>
                          <button
                            onClick={handleCancelAdd}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4 inline-block" />
                          </button>
                        </td>
                      </tr>
                    )}
                    
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                          <div className="text-sm text-gray-500">{booking.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.passType}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                          {booking.endDate && (
                            <div className="text-sm text-gray-500">
                              to {formatDate(booking.endDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
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
                    ))}
                    
                    {filteredBookings.length === 0 && !isAddingBooking && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
          <>
            {/* Calendar View */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
          </>
        )}
      </div>
      
      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Edit Booking</h2>
                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editingBooking.name}
                    onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={editingBooking.email}
                    onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pass Type
                  </label>
                  <select
                    className="input"
                    value={editingBooking.passType}
                    onChange={(e) => handleChangePassType(e.target.value)}
                  >
                    <option value="Day Pass">Day Pass</option>
                    <option value="Weekly Pass">Weekly Pass</option>
                    <option value="Monthly Pass">Monthly Pass</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={editingBooking.date}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                  />
                </div>
                
                {editingBooking.endDate && (editingBooking.passType === 'Weekly Pass' || editingBooking.passType === 'Monthly Pass') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <div className="text-gray-700">
                      {formatDate(editingBooking.endDate)}
                      <span className="text-sm text-gray-500 ml-2">
                        (Automatically calculated based on pass type)
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="input"
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value })}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary"
                >
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