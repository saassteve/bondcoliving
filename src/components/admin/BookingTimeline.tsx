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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        return 'bg-blue-500 hover:bg-blue-600 border-blue-600';
      case 'checked_in':
        return 'bg-green-500 hover:bg-green-600 border-green-600';
      case 'checked_out':
        return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600 border-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600 border-blue-600';
    }
  };

  // Sync scroll between header and body
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const header = container.querySelector('#timeline-header') as HTMLElement;
    const body = container.querySelector('#timeline-body') as HTMLElement;
    
    if (!header || !body) return;
    
    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      return () => {
        target.scrollLeft = source.scrollLeft;
      };
    };
    
    const headerScrollHandler = syncScroll(header, body);
    const bodyScrollHandler = syncScroll(body, header);
    
    header.addEventListener('scroll', headerScrollHandler);
    body.addEventListener('scroll', bodyScrollHandler);
    
    return () => {
      header.removeEventListener('scroll', headerScrollHandler);
      body.removeEventListener('scroll', bodyScrollHandler);
    };
  }, [timelineStartDate, timelineDays]);

  const renderApartmentRows = () => {
    const timelineDates = getTimelineDates();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    return apartments.map((apartment) => {
      const apartmentBookings = bookings.filter(booking => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const timelineStart = timelineDates[0];
        const timelineEnd = timelineDates[timelineDates.length - 1];
        
        return booking.apartment_id === apartment.id && 
               checkOut > timelineStart && 
               checkIn <= timelineEnd;
      });
      
      return (
        <div key={apartment.id} className="border-b border-gray-100 hover:bg-gray-50">
          <div className="flex">
            <div className="w-48 p-4 border-r border-gray-200 bg-white sticky left-0 z-10">
              <div className="text-sm font-medium text-gray-900 truncate" title={apartment.title}>
                {apartment.title}
              </div>
              <div className="text-xs text-gray-500">
                €{apartment.price}/month
              </div>
            </div>
            <div className="flex-1 relative h-16">
              <div className="flex relative h-full" style={{ width: `${timelineDays * 48}px` }}>
                {timelineDates.map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const isToday = dateString === todayString;
                  
                  return (
                    <div 
                      key={dateString} 
                      className={`w-12 border-r border-gray-200 h-full ${
                        isToday ? 'bg-blue-50' : ''
                      }`}
                    />
                  );
                })}
                
                {apartmentBookings.map((booking) => {
                  const checkIn = new Date(booking.check_in_date);
                  const checkOut = new Date(booking.check_out_date);
                  
                  let startDay = 0;
                  let endDay = timelineDays - 1;
                  
                  for (let i = 0; i < timelineDates.length; i++) {
                    if (timelineDates[i] >= checkIn) {
                      startDay = i;
                      break;
                    }
                  }
                  
                  for (let i = timelineDates.length - 1; i >= 0; i--) {
                    const dayBefore = new Date(checkOut);
                    dayBefore.setDate(dayBefore.getDate() - 1);
                    if (timelineDates[i] <= dayBefore) {
                      endDay = i;
                      break;
                    }
                  }
                  
                  if (endDay < startDay) endDay = startDay;
                  
                  const left = startDay * 48;
                  const width = (endDay - startDay + 1) * 48;
                  
                  return (
                    <div
                      key={booking.id}
                      onClick={() => onBookingClick(booking)}
                      className={`absolute top-2 h-12 rounded-md cursor-pointer transition-all ${getBookingColor(booking.status)} text-white text-xs font-medium flex items-center px-2 shadow-sm hover:shadow-md hover:scale-105 z-20 border-2`}
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
                            {formatDate(booking.check_in_date).split(',')[0]} - {formatDate(booking.check_out_date).split(',')[0]}
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
    });
  };

  return (
    <div ref={scrollContainerRef} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
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
      <div className="border-b border-gray-200 bg-gray-50 overflow-hidden">
        <div className="flex">
          <div className="w-48 p-3 border-r border-gray-200 text-sm font-medium text-gray-700 bg-white sticky left-0 z-20">
            Apartments
          </div>
          <div className="flex-1 overflow-x-auto scrollbar-hide" id="timeline-header">
            <div className="flex" style={{ width: `${timelineDays * 48}px` }}>
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
      <div className="max-h-96 overflow-y-auto">
        <div className="overflow-x-auto scrollbar-hide" id="timeline-body">
          {renderApartmentRows()}
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
            <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded ring-1 ring-blue-400"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingTimeline;