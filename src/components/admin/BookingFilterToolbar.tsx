import React from 'react';
import { Search, X, Calendar, Filter } from 'lucide-react';
import { type Apartment } from '../../lib/supabase';

export interface BookingFilters {
  search: string;
  status: string;
  apartmentId: string;
  source: string;
  dateFrom: string;
  dateTo: string;
  preset: string;
}

export const defaultFilters: BookingFilters = {
  search: '',
  status: 'all',
  apartmentId: 'all',
  source: 'all',
  dateFrom: '',
  dateTo: '',
  preset: '',
};

interface BookingFilterToolbarProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
  apartments: Apartment[];
  totalCount: number;
  filteredCount: number;
}

const statusOptions = [
  { value: 'all', label: 'All Statuses', color: 'bg-slate-700 text-slate-300 hover:bg-slate-600' },
  { value: 'pending_payment', label: 'Pending Payment', activeColor: 'bg-yellow-600 text-white', color: 'bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50' },
  { value: 'confirmed', label: 'Confirmed', activeColor: 'bg-blue-600 text-white', color: 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' },
  { value: 'checked_in', label: 'Checked In', activeColor: 'bg-green-600 text-white', color: 'bg-green-900/30 text-green-300 hover:bg-green-900/50' },
  { value: 'checked_out', label: 'Checked Out', activeColor: 'bg-gray-600 text-white', color: 'bg-gray-600/50 text-gray-300 hover:bg-gray-600/70' },
  { value: 'cancelled', label: 'Cancelled', activeColor: 'bg-red-600 text-white', color: 'bg-red-900/30 text-red-300 hover:bg-red-900/50' },
];

const sourceOptions = [
  { value: 'all', label: 'All Sources' },
  { value: 'direct', label: 'Direct' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking.com', label: 'Booking.com' },
  { value: 'vrbo', label: 'VRBO' },
  { value: 'other', label: 'Other' },
];

const BookingFilterToolbar: React.FC<BookingFilterToolbarProps> = ({
  filters,
  onFiltersChange,
  apartments,
  totalCount,
  filteredCount,
}) => {
  const update = (patch: Partial<BookingFilters>) => {
    onFiltersChange({ ...filters, ...patch, preset: patch.preset ?? '' });
  };

  const activeFilterCount = [
    filters.search !== '',
    filters.status !== 'all',
    filters.apartmentId !== 'all',
    filters.source !== 'all',
    filters.dateFrom !== '',
    filters.dateTo !== '',
  ].filter(Boolean).length;

  const clearAll = () => onFiltersChange({ ...defaultFilters });

  const applyPreset = (preset: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const next30 = new Date(today);
    next30.setDate(today.getDate() + 30);

    switch (preset) {
      case 'arriving_today':
        onFiltersChange({ ...defaultFilters, dateFrom: todayStr, dateTo: todayStr, preset });
        break;
      case 'currently_staying':
        onFiltersChange({ ...defaultFilters, status: 'checked_in', preset });
        break;
      case 'this_week':
        onFiltersChange({ ...defaultFilters, dateFrom: todayStr, dateTo: endOfWeekStr, preset });
        break;
      case 'this_month':
        onFiltersChange({ ...defaultFilters, dateFrom: startOfMonth.toISOString().split('T')[0], dateTo: endOfMonth.toISOString().split('T')[0], preset });
        break;
      case 'next_30':
        onFiltersChange({ ...defaultFilters, dateFrom: todayStr, dateTo: next30.toISOString().split('T')[0], preset });
        break;
      case 'past':
        onFiltersChange({ ...defaultFilters, dateTo: todayStr, status: 'checked_out', preset });
        break;
    }
  };

  const presets = [
    { key: 'arriving_today', label: 'Arriving Today' },
    { key: 'currently_staying', label: 'Currently Staying' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'next_30', label: 'Next 30 Days' },
    { key: 'past', label: 'Past Bookings' },
  ];

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search guest name, email, phone, or reference..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={filters.apartmentId}
          onChange={(e) => update({ apartmentId: e.target.value })}
          className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Apartments</option>
          {apartments.map((apt) => (
            <option key={apt.id} value={apt.id}>{apt.title}</option>
          ))}
        </select>

        <select
          value={filters.source}
          onChange={(e) => update({ source: e.target.value })}
          className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {sourceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => update({ dateFrom: e.target.value })}
              className="pl-8 pr-2 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-[150px]"
              placeholder="From"
            />
          </div>
          <span className="text-slate-500 text-sm">to</span>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => update({ dateTo: e.target.value })}
              className="pl-8 pr-2 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-[150px]"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update({ status: opt.value })}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.status === opt.value
                ? (opt.activeColor || 'bg-blue-600 text-white')
                : opt.color
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                filters.preset === p.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>{filteredCount} of {totalCount}</span>
              </div>
              <button
                onClick={clearAll}
                className="px-2.5 py-1 text-xs rounded-md bg-red-900/30 text-red-300 hover:bg-red-900/50 transition-colors"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFilterToolbar;
