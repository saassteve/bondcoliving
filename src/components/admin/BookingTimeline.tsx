import React from 'react';
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

  const timelineDates = getTimelineDates();
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const apartmentColumnWidth = 200; // Fixed width for apartment names
  const dayWidth = 48; // Width per day
  const totalTimelineWidth = apartmentColumnWidth + (timelineDays * dayWidth);

  return (
    <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-600">
      {/* Timeline Controls */}
      <div className="p-4 border-b border-slate-600 bg-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Navigation and Date Range */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center">
              <button
                onClick={onPreviousPeriod}
                className="p-2 rounded hover:bg-slate-700 transition-colors text-gray-300 hover:text-white"
                title="Previous period"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={onNextPeriod}
                className="p-2 rounded hover:bg-slate-700 transition-colors text-gray-300 hover:text-white"
                title="Next period"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <span className="text-sm font-semibold text-white">
              {timelineStartDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })} - {new Date(timelineStartDate.getTime() + (timelineDays - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={onGoToToday}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Today
            </button>
            <button
              onClick={onGoToNextBooking}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              Next Booking
            </button>
            <select
              value={timelineDays}
              onChange={(e) => onTimelineDaysChange(parseInt(e.target.value))}
              className="px-2 py-1.5 text-sm bg-slate-700 text-white border border-slate-600 rounded"
            >
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Single Unified Timeline Container */}
      <div className="overflow-auto max-h-[600px]">
        <div style={{ width: `${totalTimelineWidth}px`, minWidth: `${totalTimelineWidth}px` }}>
          
          {/* Timeline Header */}
          <div className="sticky top-0 z-20 bg-slate-800 border-b border-slate-600">
            <div className="flex">
              {/* Apartment Column Header - Sticky both vertically and horizontally */}
              <div
                className="sticky left-0 z-30 bg-slate-800 border-r border-slate-600 p-3 text-sm font-semibold text-white flex items-center"
                style={{ width: `${apartmentColumnWidth}px`, minWidth: `${apartmentColumnWidth}px` }}
              >
                Apartments
              </div>

              {/* Date Headers */}
              <div className="flex">
                {timelineDates.map((date, index) => {
                  const isToday = date.toDateString() === today.toDateString();
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <div
                      key={index}
                      className={`border-r border-slate-600 p-2 text-center text-xs font-medium ${
                        isToday ? 'bg-blue-900/50 text-blue-200' :
                        isWeekend ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-200'
                      }`}
                      style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
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
          
          {/* Timeline Body */}
          {apartments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No apartments available</p>
            </div>
          ) : (
            apartments.map((apartment) => {
              // Get bookings for this apartment, handling both regular and split bookings
              const apartmentBookings: any[] = [];

              bookings.forEach(booking => {
                if (booking.is_split_stay && booking.segments && booking.segments.length > 0) {
                  // For split bookings, show segments for this apartment
                  booking.segments.forEach((segment: any) => {
                    if (segment.apartment_id === apartment.id) {
                      apartmentBookings.push({
                        ...booking,
                        id: `segment-${segment.id}`,
                        check_in_date: segment.check_in_date,
                        check_out_date: segment.check_out_date,
                        is_segment: true,
                        parent_booking_id: booking.id,
                        segment_data: segment
                      });
                    }
                  });
                } else {
                  // For regular bookings, show if it's for this apartment
                  if (booking.apartment_id === apartment.id) {
                    apartmentBookings.push(booking);
                  }
                }
              });

              return (
                <div key={apartment.id} className="border-b border-slate-700">
                  <div className="flex">
                    {/* Apartment Name Column - Sticky horizontally */}
                    <div
                      className="sticky left-0 z-30 border-r border-slate-600 p-4 bg-slate-800 flex flex-col justify-center hover:bg-slate-700 transition-colors"
                      style={{ width: `${apartmentColumnWidth}px`, minWidth: `${apartmentColumnWidth}px` }}
                    >
                      <div className="text-sm font-semibold text-white truncate" title={apartment.title}>
                        {apartment.title}
                      </div>
                      <div className="text-xs text-gray-300 font-medium">
                        €{apartment.price}/month
                      </div>
                    </div>

                    {/* Timeline Track */}
                    <div className="relative bg-slate-900" style={{ height: '64px' }}>
                      {/* Day Grid Background */}
                      <div className="absolute inset-0 flex">
                        {timelineDates.map((date, index) => {
                          const dateString = date.toISOString().split('T')[0];
                          const isToday = dateString === todayString;
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                          return (
                            <div
                              key={index}
                              className={`border-r border-slate-600 ${
                                isToday ? 'bg-blue-900/30' :
                                isWeekend ? 'bg-slate-700' : 'bg-slate-800'
                              }`}
                              style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                            />
                          );
                        })}
                      </div>

                      {/* Booking Bars */}
                      {apartmentBookings.map((booking) => {
                        const position = calculateBookingPosition(booking, timelineDates);
                        if (!position) return null;

                        const { left, width } = position;
                        
                        // For segments, find the parent booking to pass to onBookingClick
                        const clickHandler = () => {
                          if (booking.is_segment) {
                            const parentBooking = bookings.find(b => b.id === booking.parent_booking_id);
                            if (parentBooking) {
                              onBookingClick(parentBooking);
                            }
                          } else {
                            onBookingClick(booking);
                          }
                        };

                        return (
                          <div
                            key={booking.id}
                            onClick={clickHandler}
                            className={`absolute top-2 h-12 rounded-md cursor-pointer transition-all ${getBookingColor(booking.status)} text-xs font-medium flex items-center px-2 shadow-sm hover:shadow-md hover:scale-105 z-20 border-2`}
                            style={{
                              left: `${left}px`,
                              width: `${Math.max(width, 48)}px`
                            }}
                            title={`${booking.guest_name} - ${formatDate(booking.check_in_date)} to ${formatDate(booking.check_out_date)} (${booking.status})${booking.is_segment ? ' - Split Stay' : ''}`}
                          >
                            <div className="truncate w-full flex items-center justify-between">
                              <div className="truncate flex-1">
                                <div className="font-medium truncate flex items-center gap-1">
                                  {booking.guest_name}
                                  {booking.is_segment && <span className="opacity-60">🔗</span>}
                                </div>
                                {width > 120 && (
                                  <div className="text-xs opacity-90 truncate">
                                    {booking.check_in_date.split('-')[2]}/{booking.check_in_date.split('-')[1]} - {booking.check_out_date.split('-')[2]}/{booking.check_out_date.split('-')[1]}
                                  </div>
                                )}
                              </div>
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
                          const leftPosition = todayIndex * dayWidth + (dayWidth / 2); // Center of the day
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
            })
          )}
        </div>
      </div>
      
      {/* Timeline Legend */}
      <div className="p-4 border-t border-slate-600 bg-slate-800">
        <div className="flex flex-wrap gap-4 text-xs text-slate-300">
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