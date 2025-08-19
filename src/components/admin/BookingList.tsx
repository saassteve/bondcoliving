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
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'checked_in':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = (filter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filter))
    .sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-700 font-medium">Total Bookings</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          <div className="text-sm text-gray-700 font-medium">Confirmed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
          <div className="text-sm text-gray-700 font-medium">Checked In</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{stats.checkedOut}</div>
          <div className="text-sm text-gray-700 font-medium">Checked Out</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-gray-700 font-medium">Cancelled</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-gray-600">Filter by status:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFilterChange('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'all' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onFilterChange('confirmed')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'confirmed' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => onFilterChange('checked_in')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'checked_in' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                Checked In
              </button>
              <button
                onClick={() => onFilterChange('checked_out')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'checked_out' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Checked Out
              </button>
              <button
                onClick={() => onFilterChange('cancelled')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'cancelled' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
          
          <button
            onClick={onExport}
            className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.guest_name}</div>
                    <div className="text-sm text-gray-700">
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
                    <div className="text-sm text-gray-900">{getApartmentTitle(booking.apartment_id)}</div>
                    <div className="text-sm text-gray-700">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(booking.check_in_date)}</div>
                    <div className="text-sm text-gray-700">to {formatDate(booking.check_out_date)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{booking.booking_source}</div>
                    {booking.booking_reference && (
                      <div className="text-sm text-gray-700">{booking.booking_reference}</div>
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