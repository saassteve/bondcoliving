import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type CoworkingBooking } from '../../lib/supabase';
import { getStatusBadgeClass } from '../../lib/statusUtils';

interface Props {
  bookings: CoworkingBooking[];
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const CoworkingCalendar: React.FC<Props> = ({
  bookings,
  currentMonth,
  onPreviousMonth,
  onNextMonth,
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    return (bookingDate >= monthStart && bookingDate <= monthEnd) ||
      (endDate >= monthStart && endDate <= monthEnd) ||
      (bookingDate <= monthStart && endDate >= monthEnd);
  });

  const renderDays = () => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-900 border border-slate-700"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      const dayBookings = monthBookings.filter(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        return date >= bookingStart && date <= bookingEnd;
      });

      days.push(
        <div key={day} className="h-24 bg-slate-800 border border-slate-700 p-2 overflow-y-auto">
          <div className="font-medium text-sm mb-1 text-slate-100">{day}</div>
          {dayBookings.length > 0 && (
            <div className="space-y-1">
              {dayBookings.map(booking => (
                <div
                  key={booking.id}
                  className={`text-xs p-1 rounded truncate ${getStatusBadgeClass(booking.booking_status)}`}
                  title={`${booking.customer_name} - ${booking.pass?.name}`}
                >
                  {booking.customer_name}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <button onClick={onPreviousMonth} className="p-1 rounded hover:bg-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={onNextMonth} className="p-1 rounded hover:bg-gray-600">
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

      <div className="grid grid-cols-7 auto-rows-auto">{renderDays()}</div>
    </div>
  );
};

export default CoworkingCalendar;
