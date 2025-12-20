import React from 'react';
import { X, Mail } from 'lucide-react';
import { type CoworkingBooking } from '../../lib/supabase';

interface Props {
  booking: CoworkingBooking;
  sendingEmail: boolean;
  onUpdate: (updates: Partial<CoworkingBooking>) => void;
  onSave: () => void;
  onCancel: () => void;
  onSendEmail: () => void;
}

const CoworkingBookingEditModal: React.FC<Props> = ({
  booking,
  sendingEmail,
  onUpdate,
  onSave,
  onCancel,
  onSendEmail,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold">Edit Booking</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Guest Name</label>
              <input
                type="text"
                className="input"
                value={booking.customer_name}
                onChange={(e) => onUpdate({ customer_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                className="input"
                value={booking.customer_email}
                onChange={(e) => onUpdate({ customer_email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                className="input"
                value={booking.customer_phone || ''}
                onChange={(e) => onUpdate({ customer_phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Booking Status</label>
              <select
                className="input"
                value={booking.booking_status}
                onChange={(e) => onUpdate({ booking_status: e.target.value as any })}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Payment Status</label>
              <select
                className="input"
                value={booking.payment_status}
                onChange={(e) => onUpdate({ payment_status: e.target.value as any })}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Access Code (Door Code)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input font-mono flex-1"
                  value={booking.access_code || ''}
                  onChange={(e) => onUpdate({ access_code: e.target.value })}
                  placeholder="Enter door code (e.g., 1234#)"
                />
                {booking.access_code && (
                  <button
                    type="button"
                    onClick={onSendEmail}
                    disabled={sendingEmail}
                    className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Send access code email to customer"
                  >
                    <Mail className="w-4 h-4 inline mr-1" />
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {booking.access_code_email_sent_at
                  ? `Email sent on ${new Date(booking.access_code_email_sent_at).toLocaleString()}`
                  : 'Customer will receive this code via email after you click "Send Email"'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Special Notes</label>
              <textarea
                className="input"
                rows={3}
                value={booking.special_notes || ''}
                onChange={(e) => onUpdate({ special_notes: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onCancel} className="btn bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600">
              Cancel
            </button>
            <button onClick={onSave} className="btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoworkingBookingEditModal;
