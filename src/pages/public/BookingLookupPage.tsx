import { useState } from 'react';
import { Search, AlertCircle, Calendar, MapPin, Users, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BookingDetails {
  id: string;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  apartment: {
    title: string;
    building: {
      name: string;
      address: string;
    } | null;
  } | null;
}

export default function BookingLookupPage() {
  const [bookingReference, setBookingReference] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBooking(null);

    if (!bookingReference.trim() || !email.trim()) {
      setError('Please enter both booking reference and email');
      return;
    }

    setLoading(true);

    try {
      const { data, error: searchError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          guest_name,
          guest_email,
          check_in_date,
          check_out_date,
          guest_count,
          total_amount,
          status,
          payment_status,
          created_at,
          apartment:apartment_id(
            title,
            building:building_id(
              name,
              address
            )
          )
        `)
        .eq('booking_reference', bookingReference.trim())
        .eq('guest_email', email.trim().toLowerCase())
        .maybeSingle();

      if (searchError || !data) {
        setError('Booking not found. Please check your booking reference and email address.');
        return;
      }

      setBooking(data);
    } catch {
      setError('An error occurred while searching for your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Confirmed
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Pending Payment
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  }

  function getPaymentStatusBadge(paymentStatus: string) {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {paymentStatus}
          </span>
        );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Look Up Your Booking
          </h1>
          <p className="text-gray-600">
            Enter your booking reference and email to view your booking details
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="bookingReference"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Booking Reference
              </label>
              <input
                id="bookingReference"
                type="text"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
                placeholder="e.g., BK-ABC123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find My Booking
                </>
              )}
            </button>
          </form>
        </div>

        {booking && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-200 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Booking Found
                  </h2>
                  <p className="text-gray-600">
                    Reference: <span className="font-mono font-semibold">{booking.booking_reference}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getStatusBadge(booking.status)}
                  {getPaymentStatusBadge(booking.payment_status)}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.apartment?.title || 'N/A'}
                    </p>
                    {booking.apartment?.building && (
                      <>
                        <p className="text-sm text-gray-600">
                          {booking.apartment.building.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.apartment.building.address}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Dates</p>
                    <p className="text-base font-semibold text-gray-900">
                      Check-in:{' '}
                      {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      Check-out:{' '}
                      {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Guests</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.guest_count} {booking.guest_count === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      €{booking.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {booking.payment_status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Payment Required
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your booking is awaiting payment confirmation. If you've recently
                    completed payment, please allow a few minutes for processing.
                  </p>
                </div>
              )}

              {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Booking Confirmed
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your booking is confirmed! Check your email for detailed check-in
                    instructions and important information about your stay.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
