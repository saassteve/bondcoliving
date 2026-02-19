import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, Mail, Calendar, MapPin, Users } from 'lucide-react';
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
  apartment: {
    title: string;
    building: {
      name: string;
      address: string;
    } | null;
  } | null;
}

export default function ApartmentBookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    let stopped = false;
    let pollInterval: ReturnType<typeof setInterval>;

    const startPolling = () => {
      loadBooking();

      pollInterval = setInterval(() => {
        if (stopped) return;
        setPollCount((prev) => prev + 1);
        loadBooking();
      }, 3000);

      const stopTimeout = setTimeout(() => {
        clearInterval(pollInterval);
        stopped = true;
        setLoading(false);
      }, 60000);

      return stopTimeout;
    };

    const stopTimeout = startPolling();

    return () => {
      stopped = true;
      clearInterval(pollInterval);
      clearTimeout(stopTimeout);
    };
  }, [bookingId]);

  async function loadBooking() {
    if (!bookingId) return;

    try {
      const { data, error: bookingError } = await supabase
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
          apartment:apartment_id(
            title,
            building:building_id(
              name,
              address
            )
          )
        `)
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError) throw bookingError;

      if (!data) {
        throw new Error('Booking not found');
      }

      setBooking(data);

      if (data.payment_status === 'paid') {
        setLoading(false);
      }
    } catch {
      setError('Failed to load booking details');
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  const isPaymentConfirmed = booking.payment_status === 'paid';
  const isPaymentPending = booking.payment_status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {isPaymentConfirmed ? (
            <div className="bg-green-50 border-b border-green-200 p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Booking Confirmed!
              </h1>
              <p className="text-gray-600">
                Your payment has been processed successfully
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border-b border-yellow-200 p-6 text-center">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Processing Payment...
              </h1>
              <p className="text-gray-600">
                Please wait while we confirm your payment
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This usually takes just a few seconds
              </p>
            </div>
          )}

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Booking Details
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">
                      Booking Reference
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {booking.booking_reference}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
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
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Dates</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Guests</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.guest_count} {booking.guest_count === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      €{booking.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isPaymentConfirmed ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Confirmation Email Sent
                      </h3>
                      <p className="text-sm text-gray-600">
                        We've sent a confirmation email to{' '}
                        <span className="font-medium">{booking.guest_email}</span> with
                        all your booking details and check-in instructions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    What's Next?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>
                        Check your email for detailed check-in instructions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>
                        You'll receive your door access code 24 hours before check-in
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>
                        Our team will be in touch if we need any additional information
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link
                    to="/"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Return to Homepage
                  </Link>
                  <Link
                    to="/book/lookup"
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    View My Booking
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Payment Processing
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your payment is being processed. This page will automatically
                    update once your payment is confirmed.
                  </p>
                  <p className="text-xs text-gray-500">
                    If this takes more than a few minutes, please contact us with your
                    booking reference: <strong>{booking.booking_reference}</strong>
                  </p>
                </div>

                <div className="text-center">
                  <Link
                    to="/"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Return to Homepage
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isPaymentConfirmed && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <a
                href="mailto:hello@stayatbond.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
