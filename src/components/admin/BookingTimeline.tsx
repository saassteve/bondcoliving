import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { type Booking, type Apartment } from '../../lib/supabase';

interface BookingTimelineProps {
  bookings: Booking[];
  apartments: Apartment[];
  onBookingClick: (booking: Booking) => void;
  getApartmentTitle: (apartmentId: string) => string;
  formatDate: (dateString: string) => string;
  timelineStartDate: Date;
  timelineDays: number;
  onTimelineStartDateChange: (date: Date) => void;
  onTimelineDaysChange: (days: number) => void;
  onGoToToday: () => void;
  onGoToNextBooking: () => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

const BookingTimeline: React.FC<BookingTimelineProps> = ({
  bookings,
  apartments,
  onBookingClick,
  getApartmentTitle,
  formatDate,
  timelineStartDate,
  timelineDays,
  onTimelineStartDateChange,
  onTimelineDaysChange,
  onGoToToday,
  onGoToNextBooking,
  onPreviousPeriod,
  onNextPeriod
}) => {
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const getTimelineDates = () => {
    const dates = [];
    for (let i = 0; i < timelineDays; i++) {
      const date = new Date(timelineStartDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getBookingColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white';
      case 'checked_in':
        return 'bg-green-500 hover:bg-green-600 border-green-600 text-white';
      case 'checked_out':
        return 'bg-gray-500 hover:bg-gray-600 border-gray-600 text-white';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600 border-red-600 text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white';
    }
  };

  const calculateBookingPosition = (booking: Booking, timelineDates: Date[]) => {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const timelineStart = timelineDates[0];
    const timelineEnd = timelineDates[timelineDates.length - 1];
    
    // Set all dates to midnight for accurate day comparison
    const checkInMidnight = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const checkOutMidnight = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());
    const timelineStartMidnight = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), timelineStart.getDate());
    
    // Calculate start position (in days from timeline start)
    const startDiff = Math.floor((checkInMidnight.getTime() - timelineStartMidnight.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate end position (in days from timeline start) - checkout is exclusive
    const endDiff = Math.floor((checkOutMidnight.getTime() - timelineStartMidnight.getTime()) / (1000 * 60 * 60 * 24));
    
    // Skip if booking is completely outside the timeline
    if (endDiff <= 0 || startDiff >= timelineDays) {
      return null;
    }
    
    const startDay = Math.max(0, startDiff);
    const endDay = Math.min(timelineDays, Math.max(startDay + 1, endDiff));
    
    const left = startDay * 48; // 48px per day
    const width = (endDay - startDay) * 48;
    
    return { left, width, startDay, endDay };
  };

  const renderApartmentRows = () => {
    const timelineDates = getTimelineDates();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const totalWidth = timelineDays * 48;
    
    return apartments.map((apartment) => {
      const apartmentBookings = bookings.filter(booking => booking.apartment_id === apartment.id);
      
      return (
        <div key={apartment.id} className="border-b border-gray-100 hover:bg-gray-50">
          <div className="flex">
            {/* Apartment Name - Fixed Left Column */}
            <div className="w-48 p-4 border-r border-gray-200 bg-white sticky left-0 z-30 flex-shrink-0">
              <div className="text-sm font-medium text-gray-900 truncate" title={apartment.title}>
                {apartment.title}
              </div>
              <div className="text-xs text-gray-500">
                €{apartment.price}/month
              </div>
            </div>
            
            {/* Timeline Track - Scrollable Content */}
            <div className="relative h-16 bg-gray-50" style={{ width: `${totalWidth}px` }}>
              {/* Day Grid Background */}
              <div className="absolute inset-0 flex">
                {timelineDates.map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const isToday = dateString === todayString;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  
                  return (
                    <div 
                      key={index} 
                      className={`w-12 h-full border-r border-gray-200 ${
                        isToday ? 'bg-blue-100' : 
                        isWeekend ? 'bg-gray-100' : 'bg-white'
                      }`}
                    />
                  );
                })}
              </div>
              
              {/* Booking Bars */}
              {apartmentBookings.map((booking) => {
                const position = calculateBookingPosition(booking, timelineDates);
                if (!position) return null;
                
                const { left, width } = position;
                
                return (
                  <div
                    key={booking.id}
                    onClick={() => onBookingClick(booking)}
                    className={`absolute top-2 h-12 rounded-md cursor-pointer transition-all ${getBookingColor(booking.status)} text-xs font-medium flex items-center px-2 shadow-sm hover:shadow-md hover:scale-105 z-20 border-2`}
                    style={{
                      left: `${left}px`,
                      width: `${Math.max(width, 48)}px`
                    }}
                    title={`${booking.guest_name} - ${formatDate(booking.check_in_date)} to ${formatDate(booking.check_out_date)} (${booking.status})`}
                  >
                    <div className="truncate w-full">
                      <div className="font-medium truncate">{booking.guest_name}</div>
                      {width > 120 && (
                        <div className="text-xs opacity-90 truncate">
                          {booking.check_in_date.split('-')[2]}/{booking.check_in_date.split('-')[1]} - {booking.check_out_date.split('-')[2]}/{booking.check_out_date.split('-')[1]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Today Indicator Line */}
              {(() => {
                const todayIndex = timelineDates.findIndex(date => 
                  date.toISOString().split('T')[0] === todayString
                );
                
                if (todayIndex >= 0) {
                  const leftPosition = todayIndex * 48 + 24; // Center of the day
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none"
                      style={{ left: `${leftPosition}px` }}
                    />
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Timeline Controls */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-2">
          <button 
            onClick={onPreviousPeriod} 
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Previous period"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={onNextPeriod} 
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Next period"
          >
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
            onClick={onGoToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Today
          </button>
          <button 
            onClick={onGoToNextBooking}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Next Booking
          </button>
          <select
            value={timelineDays}
            onChange={(e) => onTimelineDaysChange(parseInt(e.target.value))}
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
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {/* Fixed apartment column header */}
          <div className="w-48 p-3 border-r border-gray-200 text-sm font-medium text-gray-700 bg-white sticky left-0 z-30 flex-shrink-0">
            Apartments
          </div>
          
          {/* Scrollable dates header */}
          <div className="overflow-x-auto" style={{ width: `${timelineDays * 48}px` }}>
            <div className="flex" style={{ width: `${timelineDays * 48}px` }}>
              {getTimelineDates().map((date, index) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <div 
                    key={index} 
                    className={`w-12 p-2 text-center text-xs font-medium border-r border-gray-200 flex-shrink-0 ${
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
      <div 
        ref={timelineContainerRef}
        className="max-h-96 overflow-auto"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}
      >
        <div className="min-w-full">
          {apartments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No apartments available</p>
            </div>
          ) : (
            renderApartmentRows()
          )}
        </div>
      </div>
      
      {/* Timeline Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded border border-blue-600"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded border border-green-600"></div>
            <span>Checked In</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-500 rounded border border-gray-600"></div>
            <span>Checked Out</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded border border-red-600"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-3 bg-red-500"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingTimeline;