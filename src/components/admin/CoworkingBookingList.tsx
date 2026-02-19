import React, { useState } from 'react';
import { Edit, Trash } from 'lucide-react';
import { type CoworkingBooking } from '../../lib/supabase';
import { getStatusBadgeClass, formatDate } from '../../lib/statusUtils';
import Pagination from './Pagination';

const PAGE_SIZE = 25;

interface Props {
  bookings: CoworkingBooking[];
  filter: string;
  onFilterChange: (filter: string) => void;
  onEdit: (booking: CoworkingBooking) => void;
  onDelete: (id: string) => void;
}

const CoworkingBookingList: React.FC<Props> = ({
  bookings,
  filter,
  onFilterChange,
  onEdit,
  onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(booking => booking.booking_status === filter || booking.payment_status === filter);

  const totalFiltered = filteredBookings.length;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleFilterChange = (newFilter: string) => {
    onFilterChange(newFilter);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="bg-slate-800 rounded-lg shadow-sm mb-6 p-4 border border-slate-700">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-slate-300">Filter by status:</div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: `All (${bookings.length})`, className: 'bg-indigo-600 text-white' },
              { value: 'confirmed', label: 'Confirmed', className: 'bg-green-600 text-white hover:bg-green-700' },
              { value: 'pending', label: 'Pending', className: 'bg-yellow-600 text-white hover:bg-yellow-700' },
              { value: 'paid', label: 'Paid', className: 'bg-green-600 text-white hover:bg-green-700' },
              { value: 'cancelled', label: 'Cancelled', className: 'bg-red-600 text-white hover:bg-red-700' },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleFilterChange(btn.value)}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === btn.value
                    ? btn.className
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Pass Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date(s)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-700">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-100">{booking.booking_reference}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-100">{booking.customer_name}</div>
                      <div className="text-sm text-slate-400">{booking.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-100">{booking.pass?.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-100">{formatDate(booking.start_date)}</div>
                      <div className="text-sm text-slate-400">to {formatDate(booking.end_date)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-100">{parseFloat(booking.total_amount as any).toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.booking_status)}`}>
                        {booking.booking_status}
                      </span>
                      <br />
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.payment_status)} mt-1`}>
                        {booking.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => onEdit(booking)} className="text-indigo-400 hover:text-indigo-300 mr-3">
                        <Edit className="w-4 h-4 inline-block" />
                      </button>
                      <button onClick={() => onDelete(booking.id)} className="text-red-400 hover:text-red-300">
                        <Trash className="w-4 h-4 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={totalFiltered}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
};

export default CoworkingBookingList;
