import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { availabilityService, type ApartmentAvailability } from '../lib/supabase';
import { getDaysInMonth, getFirstDayOfMonth, navigateToPreviousMonth, navigateToNextMonth, formatDateString, getTodayString, getMonthStartDate, getMonthEndDate } from '../lib/calendarUtils';

interface CalendarAvailabilityProps {
  apartmentId: string;
  apartmentTitle: string;
}

const CalendarAvailability: React.FC<CalendarAvailabilityProps> = ({ 
  apartmentId, 
  apartmentTitle 
}) => {
  const [availability, setAvailability] = useState<ApartmentAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, [apartmentId, currentMonth]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = getMonthStartDate(currentMonth);
      const endDate = getMonthEndDate(currentMonth);
      
      const data = await availabilityService.getCalendar(apartmentId, startDate, endDate);
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Unable to load availability calendar');
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => setCurrentMonth(navigateToPreviousMonth(currentMonth));
  const nextMonth = () => setCurrentMonth(navigateToNextMonth(currentMonth));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'blocked':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-green-50 text-green-700 border-green-100'; // Default to available
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'booked':
        return 'Booked';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Available';
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);
    const todayString = getTodayString();
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDateString(year, month, day);
      const dayAvailability = availability.find(a => a.date === date);
      const status = dayAvailability?.status || 'available';
      const isPast = date < todayString;
      const isToday = date === todayString;
      
      days.push(
        <div
          key={date}
          className={`h-10 border rounded text-sm font-medium flex items-center justify-center transition-all relative ${
            isPast 
              ? 'bg-gray-50 text-gray-400 border-gray-200' 
              : getStatusColor(status)
          } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
          title={`${day} ${currentMonth.toLocaleDateString('en-US', { month: 'long' })} - ${getStatusText(status)}${dayAvailability?.notes ? ` (${dayAvailability.notes})` : ''}`}
        >
          {day}
          {isToday && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      );
    }
    
    return days;
  };

  if (error) {
    return (
      <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10">
        <div className="flex items-center text-red-400 mb-2">
          <Calendar className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-bold">Availability Calendar</h3>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-[#C5C5B5] mr-2" />
          <h3 className="text-lg font-bold text-[#C5C5B5]">Availability Calendar</h3>
        </div>
        <div className="flex items-center text-[#C5C5B5]/60 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          Live updates
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C5C5B5]"></div>
          <span className="ml-2 text-[#C5C5B5]/60">Loading calendar...</span>
        </div>
      ) : (
        <>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={previousMonth} 
              className="p-2 hover:bg-[#C5C5B5]/10 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-[#C5C5B5]" />
            </button>
            <h4 className="text-lg font-semibold text-[#C5C5B5]">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h4>
            <button 
              onClick={nextMonth} 
              className="p-2 hover:bg-[#C5C5B5]/10 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-[#C5C5B5]" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-[#C5C5B5]/60">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {renderCalendar()}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-[#C5C5B5]/60">Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-[#C5C5B5]/60">Booked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-[#C5C5B5]/60">Blocked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded ring-1 ring-blue-400"></div>
              <span className="text-[#C5C5B5]/60">Today</span>
            </div>
          </div>

          {/* Minimum Stay Notice */}
          <div className="mt-4 p-3 bg-[#C5C5B5]/10 rounded-lg border border-[#C5C5B5]/20">
            <p className="text-[#C5C5B5]/80 text-sm">
              <strong>Minimum stay:</strong> 1 month. Contact us for availability and booking.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarAvailability;