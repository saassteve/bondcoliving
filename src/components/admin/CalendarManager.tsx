import React, { useState, useEffect } from 'react';
import { X, Calendar, ExternalLink, Info } from 'lucide-react';
import { availabilityService, type ApartmentAvailability } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface CalendarManagerProps {
  apartmentId: string;
  apartmentTitle: string;
  onClose: () => void;
}

const CalendarManager: React.FC<CalendarManagerProps> = ({ apartmentId, apartmentTitle, onClose }) => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<ApartmentAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'available' | 'booked' | 'blocked'>('blocked');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [apartmentId, currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

      const availabilityData = await availabilityService.getCalendar(apartmentId, startDate, endDate);
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleBulkUpdate = async () => {
    if (selectedDates.length === 0) return;

    try {
      await availabilityService.setBulkAvailability(apartmentId, selectedDates, bulkStatus);
      setSelectedDates([]);
      await fetchData();
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability');
    }
  };

  const handleManageIcal = () => {
    onClose();
    navigate('/admin/ical');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-900/50 text-green-300 border-green-200';
      case 'booked':
        return 'bg-red-900/50 text-red-300 border-red-200';
      case 'blocked':
        return 'bg-gray-700 text-gray-300 border-gray-600';
      default:
        return 'bg-gray-50 text-gray-300 border-gray-600';
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAvailability = availability.find(a => a.date === date);
      const status = dayAvailability?.status || 'available';
      const isSelected = selectedDates.includes(date);
      const todayString = new Date().toISOString().split('T')[0];
      const isPast = date < todayString;

      days.push(
        <div
          key={date}
          onClick={() => !isPast && handleDateClick(date)}
          className={`h-12 border rounded cursor-pointer flex items-center justify-center text-sm font-medium transition-all ${
            isPast
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
              : isSelected
                ? 'bg-blue-500 text-white border-blue-500'
                : `${getStatusColor(status)} hover:scale-105`
          }`}
          title={`${date}: ${status}${dayAvailability?.booking_reference ? ` - ${dayAvailability.booking_reference}` : ''}${dayAvailability?.notes ? ` (${dayAvailability.notes})` : ''}`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDates([]);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDates([]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Calendar Management</h2>
            <p className="text-gray-300">{apartmentTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Calendar */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <button onClick={previousMonth} className="p-2 hover:bg-gray-700 rounded text-white">
                ←
              </button>
              <h3 className="text-lg font-semibold text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-700 rounded text-white">
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-300">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-900/50 border border-green-200 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-900/50 border border-red-200 rounded"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-700 border border-gray-600 rounded"></div>
                <span>Blocked</span>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDates.length > 0 && (
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <h4 className="font-medium mb-2 text-white">{selectedDates.length} dates selected</h4>
              <div className="flex items-center gap-2">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as any)}
                  className="px-3 py-1 border border-gray-600 rounded text-sm bg-gray-700 text-white"
                >
                  <option value="available">Set Available</option>
                  <option value="booked">Set Booked</option>
                  <option value="blocked">Set Blocked</option>
                </select>
                <button
                  onClick={handleBulkUpdate}
                  className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  onClick={() => setSelectedDates([])}
                  className="px-4 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-2">Quick Actions:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Click dates to select them for bulk updates</li>
                  <li>• Use this calendar for manual availability management</li>
                  <li>• For iCal feed management, use the dedicated iCal page</li>
                </ul>
                <button
                  onClick={handleManageIcal}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Manage iCal Feeds
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarManager;
