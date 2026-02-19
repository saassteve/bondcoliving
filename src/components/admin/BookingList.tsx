import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Mail, Phone, Eye, ArrowUp, ArrowDown, Link2 } from 'lucide-react';
import { type Booking, type Apartment } from '../../lib/supabase';
import Pagination from './Pagination';
import BookingFilterToolbar, { type BookingFilters, defaultFilters } from './BookingFilterToolbar';

interface BookingListProps {
  bookings: Booking[];
  apartments: Apartment[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onView: (booking: Booking) => void;
  getApartmentTitle: (apartmentId: string) => string;
  formatDate: (dateString: string) => string;
}

type SortField = 'guest_name' | 'apartment' | 'check_in_date' | 'source' | 'status' | 'total_amount' | 'nights' | 'created_at';
type SortDir = 'asc' | 'desc';

const statusPriority: Record<string, number> = {
  pending_payment: 1,
  checked_in: 2,
  confirmed: 3,
  checked_out: 4,
  cancelled: 5,
};

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '-';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function calcNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  apartments,
  onEdit,
  onDelete,
  onView,
  getApartmentTitle,
  formatDate,
}) => {
  const [filters, setFilters] = useState<BookingFilters>(defaultFilters);
  const [sortField, setSortField] = useState<SortField>('check_in_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('bookingListPageSize');
    return saved ? parseInt(saved) : 25;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: BookingFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    localStorage.setItem('bookingListPageSize', String(size));
    setCurrentPage(1);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (filters.status !== 'all' && b.status !== filters.status) return false;

      if (filters.apartmentId !== 'all' && b.apartment_id !== filters.apartmentId) return false;

      if (filters.source !== 'all' && b.booking_source !== filters.source) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          b.guest_name.toLowerCase().includes(q) ||
          (b.guest_email?.toLowerCase().includes(q)) ||
          (b.guest_phone?.toLowerCase().includes(q)) ||
          (b.booking_reference?.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (filters.dateFrom || filters.dateTo) {
        const checkIn = b.check_in_date;
        const checkOut = b.check_out_date;
        if (filters.dateFrom && checkOut < filters.dateFrom) return false;
        if (filters.dateTo && checkIn > filters.dateTo) return false;
      }

      return true;
    });
  }, [bookings, filters]);

  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings];
    const dir = sortDir === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortField) {
        case 'guest_name':
          return dir * a.guest_name.localeCompare(b.guest_name);
        case 'apartment':
          return dir * getApartmentTitle(a.apartment_id).localeCompare(getApartmentTitle(b.apartment_id));
        case 'check_in_date':
          return dir * (new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());
        case 'source':
          return dir * a.booking_source.localeCompare(b.booking_source);
        case 'status': {
          const aPri = statusPriority[a.status] || 99;
          const bPri = statusPriority[b.status] || 99;
          return dir * (aPri - bPri);
        }
        case 'total_amount':
          return dir * ((a.total_amount || 0) - (b.total_amount || 0));
        case 'nights': {
          const aNights = calcNights(a.check_in_date, a.check_out_date);
          const bNights = calcNights(b.check_in_date, b.check_out_date);
          return dir * (aNights - bNights);
        }
        case 'created_at':
          return dir * (new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredBookings, sortField, sortDir, getApartmentTitle]);

  const totalFiltered = sortedBookings.length;
  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending_payment: 'bg-yellow-900/50 text-yellow-300',
      confirmed: 'bg-blue-900/50 text-blue-300',
      checked_in: 'bg-green-900/50 text-green-300',
      checked_out: 'bg-gray-700 text-gray-300',
      cancelled: 'bg-red-900/50 text-red-300',
    };
    return classes[status] || 'bg-gray-700 text-gray-300';
  };

  const paymentBadge = (status?: string) => {
    const classes: Record<string, string> = {
      paid: 'bg-green-900/50 text-green-300',
      pending: 'bg-yellow-900/50 text-yellow-300',
      failed: 'bg-red-900/50 text-red-300',
      refunded: 'bg-cyan-900/50 text-cyan-300',
    };
    return classes[status || ''] || 'bg-gray-700/50 text-gray-400';
  };

  const formatStatus = (s: string) =>
    s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const SortHeader: React.FC<{ field: SortField; label: string; className?: string }> = ({ field, label, className = '' }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none ${className}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
        ) : (
          <div className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      <BookingFilterToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        apartments={apartments}
        totalCount={bookings.length}
        filteredCount={totalFiltered}
      />

      <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <SortHeader field="guest_name" label="Guest" />
                <SortHeader field="apartment" label="Apartment" />
                <SortHeader field="check_in_date" label="Dates" />
                <SortHeader field="nights" label="Nights" />
                <SortHeader field="source" label="Source" />
                <SortHeader field="status" label="Status" />
                <SortHeader field="total_amount" label="Amount" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                <SortHeader field="created_at" label="Created" />
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-700/50">
              {paginatedBookings.map((booking) => {
                const nights = calcNights(booking.check_in_date, booking.check_out_date);
                return (
                  <tr key={booking.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white">{booking.guest_name}</span>
                        {booking.is_split_stay && (
                          <Link2 className="w-3.5 h-3.5 text-blue-400" title="Split stay" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400 space-y-0.5 mt-0.5">
                        {booking.guest_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[180px]">{booking.guest_email}</span>
                          </div>
                        )}
                        {booking.guest_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.guest_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-white">{getApartmentTitle(booking.apartment_id)}</div>
                      <div className="text-xs text-gray-400">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-white">{formatDate(booking.check_in_date)}</div>
                      <div className="text-xs text-gray-400">to {formatDate(booking.check_out_date)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-white">{nights}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-white capitalize">{booking.booking_source}</div>
                      {booking.booking_reference && (
                        <div className="text-xs text-gray-400 font-mono truncate max-w-[100px]">{booking.booking_reference}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(booking.status)}`}>
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {booking.total_amount ? (
                        <span className="text-sm font-medium text-white">
                          {new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }).format(booking.total_amount)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentBadge(booking.payment_status)}`}>
                        {booking.payment_status ? formatStatus(booking.payment_status) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-400" title={booking.created_at || ''}>
                        {formatRelativeTime(booking.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(booking)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(booking)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Edit booking"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(booking.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                          title="Delete booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedBookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    No bookings match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={totalFiltered}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingList;
