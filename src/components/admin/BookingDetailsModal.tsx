import React from 'react';
import { X, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { type Booking } from '../../lib/supabase';

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  getApartmentTitle: (apartmentId: string) => string;
  formatDate: (dateString: string) => string;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
  onEdit,
  onDelete,
  getApartmentTitle,
  formatDate
}) => {
  const statusBadgeClass = (status: string) => {
    switch(status) {
      case 'confirmed':
        return 'bg-blue-900/50 text-blue-300';
      case 'checked_in':
        return 'bg-green-900/50 text-green-300';
      case 'checked_out':
        return 'bg-gray-700 text-gray-800';
      case 'cancelled':
        return 'bg-red-900/50 text-red-300';
      default:
        return 'bg-gray-700 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold">Booking Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Guest</h3>
                <p className="font-medium">{booking.guest_name}</p>
                {booking.guest_email && (
                  <div className="flex items-center text-sm text-gray-300 mt-1">
                    <Mail className="w-3 h-3 mr-1" />
                    <a href={`mailto:${booking.guest_email}`} className="hover:text-blue-600">
                      {booking.guest_email}
                    </a>
                  </div>
                )}
                {booking.guest_phone && (
                  <div className="flex items-center text-sm text-gray-300 mt-1">
                    <Phone className="w-3 h-3 mr-1" />
                    <a href={`tel:${booking.guest_phone}`} className="hover:text-blue-600">
                      {booking.guest_phone}
                    </a>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Apartment</h3>
                <p className="font-medium">{getApartmentTitle(booking.apartment_id)}</p>
                <p className="text-sm text-gray-300">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Check-in</h3>
                <p className="font-medium">{formatDate(booking.check_in_date)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Check-out</h3>
                <p className="font-medium">{formatDate(booking.check_out_date)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Source</h3>
                <p className="font-medium capitalize">{booking.booking_source}</p>
                {booking.booking_reference && (
                  <p className="text-sm text-gray-300">Ref: {booking.booking_reference}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClass(booking.status)}`}>
                  {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.replace('_', ' ').slice(1)}
                </span>
              </div>
            </div>
            
            {booking.door_code && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Door Code</h3>
                <p className="font-mono text-lg bg-gray-700 px-3 py-2 rounded-lg inline-block">{booking.door_code}</p>
              </div>
            )}
            
            {booking.total_amount && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="font-medium text-lg">€{booking.total_amount.toLocaleString()}</p>
              </div>
            )}
            
            {booking.special_instructions && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Special Instructions</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-300">{booking.special_instructions}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-600">
            <button
              onClick={() => onEdit(booking)}
              className="btn bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={() => onDelete(booking.id)}
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;