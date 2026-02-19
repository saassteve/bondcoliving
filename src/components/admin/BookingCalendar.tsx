import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { bookingService, type Booking, type Apartment } from '../../lib/supabase';
import { getDaysInMonth, getFirstDayOfMonth, navigateToPreviousMonth, navigateToNextMonth, formatDateString, getTodayString } from '../../lib/calendarUtils';

interface BookingCalendarProps {
  apartments: Apartment[];
  onBookingClick: (booking: Booking) => void;
  getApartmentTitle: (apartmentId: string) => string;
  formatDate: (dateString: string) => string;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  apartments,
  onBookingClick,
  getApartmentTitle,
  formatDate
}) => {
  const [calendarBookings, setCalendarBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<Record<string, any[]>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const { bookings: monthBookings, availability: monthAvailability } = await bookingService.getBookingsWithAvailability(
        currentMonth.getFullYear(),
        currentMonth.getMonth()
      );
      setCalendarBookings(monthBookings);
      setAvailability(monthAvailability);
    } catch (error) {
      console.error('Error fetching month bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => setCurrentMonth(navigateToPreviousMonth(currentMonth));
  const nextMonth = () => setCurrentMonth(navigateToNextMonth(currentMonth));

  const statusBadgeClass = (status: string) => {
    switch(status) {
      case 'confirmed':
        return 'bg-blue-900/50 text-blue-200 border-blue-400';
      case 'checked_in':
        return 'bg-green-900/50 text-green-200 border-green-400';
      case 'checked_out':
        return 'bg-gray-700 text-gray-200 border-gray-500';
      case 'cancelled':
        return 'bg-red-900/50 text-red-200 border-red-400';
      default:
        return 'bg-gray-700 text-gray-200 border-gray-500';
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
      days.push(<div key={`empty-${i}`} className="h-28 bg-slate-900 border border-slate-700"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(year, month, day);
      const isToday = dateString === todayString;
      const isPast = dateString < todayString;

      // Find bookings for this day - handle both regular and split bookings
      const dayBookings: any[] = [];

      calendarBookings.forEach(booking => {
        if (booking.is_split_stay && booking.segments && booking.segments.length > 0) {
          // For split bookings, show each segment
          booking.segments.forEach((segment: any) => {
            if (dateString >= segment.check_in_date && dateString < segment.check_out_date) {
              dayBookings.push({
                ...segment,
                id: `segment-${segment.id}`,
                parent_booking_id: booking.id,
                guest_name: booking.guest_name,
                status: booking.status,
                is_segment: true,
                apartment_title: segment.apartment?.title || 'Unknown'
              });
            }
          });
        } else {
          // For regular bookings, show the booking itself
          if (dateString >= booking.check_in_date && dateString < booking.check_out_date) {
            dayBookings.push(booking);
          }
        }
      });
      
      // Find availability blocks for this day
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
          apartment_title: booking.is_segment ? booking.apartment_title : getApartmentTitle(booking.apartment_id)
        })),
        ...dayAvailabilityBlocks
      ];
      
      days.push(
        <div key={day} className={`h-28 border border-slate-700 p-2 overflow-y-auto relative ${
          isToday ? 'bg-blue-900/30 border-blue-500' :
          isPast ? 'bg-slate-900/50' : 'bg-slate-800'
        }`}>
          <div className={`font-semibold text-sm mb-2 ${
            isToday ? 'text-blue-400' :
            isPast ? 'text-slate-500' : 'text-slate-100'
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
                      // For segments, we need to fetch the parent booking
                      if (item.is_segment) {
                        // Find the parent booking from calendarBookings
                        const parentBooking = calendarBookings.find(b => b.id === item.parent_booking_id);
                        if (parentBooking) {
                          onBookingClick(parentBooking);
                        }
                      } else {
                        onBookingClick(item as Booking);
                      }
                    }
                  }}
                  className={`text-xs p-1.5 rounded-md truncate border transition-all ${item.type === 'booking' ? 'cursor-pointer hover:shadow-sm hover:scale-105' : ''} ${
                    item.type === 'booking' ? statusBadgeClass(item.status) : (
                      item.status === 'booked' ? 'bg-orange-900/50 text-orange-200 border-orange-400' :
                      'bg-yellow-900/50 text-yellow-200 border-yellow-400'
                    )
                  }`}
                  title={
                    item.type === 'booking'
                      ? `${(item as any).guest_name} - ${item.apartment_title}${item.is_segment ? ' (Split Stay)' : ''}`
                      : `${item.status.toUpperCase()} - ${item.apartment_title}${item.notes ? ` (${item.notes})` : ''}`
                  }
                >
                  <div className="font-medium flex items-center justify-between">
                    <span className="truncate">{item.type === 'booking' ? (item as any).guest_name : item.status.toUpperCase()}</span>
                    {item.is_segment && <span className="text-[10px] opacity-60 ml-1">🔗</span>}
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

  return (
    <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <button onClick={previousMonth} className="p-1 rounded hover:bg-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-700">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center py-2 border-b border-slate-700 bg-slate-800 text-xs font-medium text-slate-300">
        <div>Sunday</div>
        <div>Monday</div>
        <div>Tuesday</div>
        <div>Wednesday</div>
        <div>Thursday</div>
        <div>Friday</div>
        <div>Saturday</div>
      </div>
      
      <div className="grid grid-cols-7 auto-rows-auto">
        {loading ? (
          <div className="col-span-7 p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-slate-300">Loading calendar...</p>
          </div>
        ) : (
          renderCalendar()
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;