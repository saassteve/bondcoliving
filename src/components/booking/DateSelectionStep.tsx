import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateSelectionStepProps {
  minimumStayDays: number;
  enableSplitStays: boolean;
  maxSplitSegments: number;
  initialCheckIn: string;
  initialCheckOut: string;
  onComplete: (checkInDate: string, checkOutDate: string) => void;
}

const DateSelectionStep: React.FC<DateSelectionStepProps> = ({
  minimumStayDays,
  initialCheckIn,
  initialCheckOut,
  onComplete,
}) => {
  const [checkInDate, setCheckInDate] = useState<Date | null>(
    initialCheckIn ? new Date(initialCheckIn) : null
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(
    initialCheckOut ? new Date(initialCheckOut) : null
  );
  const [error, setError] = useState<string | null>(null);

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  const calculateDaysDifference = (start: Date, end: Date) => {
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCheckInChange = (date: Date | null) => {
    setCheckInDate(date);
    setError(null);

    if (date && checkOutDate) {
      const days = calculateDaysDifference(date, checkOutDate);
      if (days < minimumStayDays) {
        const newCheckOut = new Date(date);
        newCheckOut.setDate(newCheckOut.getDate() + minimumStayDays);
        setCheckOutDate(newCheckOut);
      }
    } else if (date && !checkOutDate) {
      const newCheckOut = new Date(date);
      newCheckOut.setDate(newCheckOut.getDate() + minimumStayDays);
      setCheckOutDate(newCheckOut);
    }
  };

  const handleCheckOutChange = (date: Date | null) => {
    if (!checkInDate) {
      setError('Please select a check-in date first');
      return;
    }

    if (date) {
      const days = calculateDaysDifference(checkInDate, date);
      if (days < minimumStayDays) {
        setError(`Minimum stay is ${minimumStayDays} days`);
        return;
      }
    }

    setCheckOutDate(date);
    setError(null);
  };

  const handleContinue = () => {
    if (!checkInDate || !checkOutDate) {
      setError('Please select both check-in and check-out dates');
      return;
    }

    const days = calculateDaysDifference(checkInDate, checkOutDate);
    if (days < minimumStayDays) {
      setError(`Minimum stay is ${minimumStayDays} days`);
      return;
    }

    onComplete(
      checkInDate.toISOString().split('T')[0],
      checkOutDate.toISOString().split('T')[0]
    );
  };

  const stayDuration = checkInDate && checkOutDate
    ? calculateDaysDifference(checkInDate, checkOutDate)
    : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#C5C5B5] mb-2">Select Your Dates</h2>
      <p className="text-[#C5C5B5]/60 mb-6">
        Choose your check-in and check-out dates. Minimum stay is {minimumStayDays} days.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
            <Calendar className="w-4 h-4 inline-block mr-2" />
            Check-in Date
          </label>
          <DatePicker
            selected={checkInDate}
            onChange={handleCheckInChange}
            minDate={minDate}
            dateFormat="MMMM d, yyyy"
            className="w-full px-4 py-3 bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-lg text-[#C5C5B5] focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent"
            placeholderText="Select check-in date"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
            <Calendar className="w-4 h-4 inline-block mr-2" />
            Check-out Date
          </label>
          <DatePicker
            selected={checkOutDate}
            onChange={handleCheckOutChange}
            minDate={checkInDate || minDate}
            dateFormat="MMMM d, yyyy"
            className="w-full px-4 py-3 bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-lg text-[#C5C5B5] focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent"
            placeholderText="Select check-out date"
            disabled={!checkInDate}
          />
        </div>
      </div>

      {stayDuration > 0 && (
        <div className="mb-6 p-4 bg-[#C5C5B5]/10 rounded-lg border border-[#C5C5B5]/20">
          <div className="flex items-center justify-between">
            <span className="text-[#C5C5B5]/80">Stay Duration</span>
            <span className="text-[#C5C5B5] font-medium">
              {stayDuration} day{stayDuration !== 1 ? 's' : ''} ({Math.floor(stayDuration / 30)} month
              {Math.floor(stayDuration / 30) !== 1 ? 's' : ''}, {stayDuration % 30} day
              {stayDuration % 30 !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!checkInDate || !checkOutDate || !!error}
          className="px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default DateSelectionStep;
