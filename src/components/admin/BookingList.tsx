import React from 'react';
import { Edit, Trash2, Mail, Phone, Eye, Filter, Download } from 'lucide-react';
import { type Booking } from '../../lib/supabase';

interface BookingListProps {
  bookings: Booking[];
  filter: string;
  onFilterChange: (filter: string) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onView: (booking: Booking) => void;
  onExport: () => void;
  getApartmentTitle: (apartmentId: string) => string;
  formatDate: (dateString: string) => string;
  stats: {
    total: number;
    pendingPayment: number;
    confirmed: number;
    checkedIn: number;
    checkedOut: number;
    cancelled: number;
  };
}

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  filter,
  onFilterChange,
  onEdit,
  onDelete,
  onView,
  onExport,
  getApartmentTitle,
  formatDate,
  stats
}) => {
  const statusBadgeClass = (status: string) => {
    switch(status) {
      case 'pending_payment':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'confirmed':
        return 'bg-blue-900/50 text-blue-300';
      case 'checked_in':
        return 'bg-green-900/50 text-green-300';
      case 'checked_out':
        return 'bg-gray-700 text-gray-300';
      case 'cancelled':
        return 'bg-red-900/50 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const paymentBadgeClass = (paymentStatus: string) => {
    switch(paymentStatus) {
      case 'paid':
        return 'bg-green-900/50 text-green-300';
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'failed':
        return 'bg-red-900/50 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const filteredBookings = (filter === 'all'
    ? bookings
    : bookings.filter(booking => booking.status === filter))
    .sort((a, b) => {
      // Primary sort: Check-in date (earliest first)
      const dateComparison = new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime();
      if (dateComparison !== 0) return dateComparison;

      // Secondary sort: Status priority (checked_in > confirmed > checked_out > cancelled)
      const statusPriority = { 'checked_in': 1, 'confirmed': 2, 'checked_out': 3, 'cancelled': 4 };
      const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 5;
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 5;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Tertiary sort: Guest name alphabetically
      return a.guest_name.localeCompare(b.guest_name);
    });

  return (
    <>

      {/* Filter Bar */}
      <div className="bg-slate-800 rounded-lg shadow-sm mb-6 p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-slate-300">Filter by status:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFilterChange('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onFilterChange('pending_payment')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'pending_payment'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-700'
                }`}
              >
                Pending Payment
              </button>
              <button
                onClick={() => onFilterChange('confirmed')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'confirmed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-900/50 text-blue-300 hover:bg-blue-200'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => onFilterChange('checked_in')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'checked_in' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-900/50 text-green-300 hover:bg-green-200'
                }`}
              >
                Checked In
              </button>
              <button
                onClick={() => onFilterChange('checked_out')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'checked_out' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-700 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Checked Out
              </button>
              <button
                onClick={() => onFilterChange('cancelled')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'cancelled'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-900/50 text-red-300 hover:bg-red-200'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
          
          <button
            onClick={onExport}
            className="btn bg-slate-700 border border-slate-700 text-slate-300 hover:bg-slate-600"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apartment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-700">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{booking.guest_name}</div>
                    <div className="text-sm text-gray-300">
                      {booking.guest_email && (
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {booking.guest_email}
                        </div>
                      )}
                      {booking.guest_phone && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {booking.guest_phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-white">{getApartmentTitle(booking.apartment_id)}</div>
                    <div className="text-sm text-gray-300">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-white">{formatDate(booking.check_in_date)}</div>
                    <div className="text-sm text-gray-300">to {formatDate(booking.check_out_date)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-white capitalize">{booking.booking_source}</div>
                    {booking.booking_reference && (
                      <div className="text-sm text-gray-300">{booking.booking_reference}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(booking.status)}`}>
                      {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onView(booking)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                      title="View details"
                    >
                      <Eye className="w-4 h-4 inline-block" />
                    </button>
                    <button
                      onClick={() => onEdit(booking)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                      title="Edit booking"
                    >
                      <Edit className="w-4 h-4 inline-block" />
                    </button>
                    <button
                      onClick={() => onDelete(booking.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete booking"
                    >
                      <Trash2 className="w-4 h-4 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default BookingList;