import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, Calendar, MapPin, Users, Mail, Phone, Home, ArrowRight, Loader } from 'lucide-react';
import { apartmentBookingService, type Booking, type ApartmentBookingSegment } from '../../lib/supabase';

const BookingSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const bookingData = await apartmentBookingService.getBookingWithSegments(bookingId!);

      if (!bookingData) {
        setError('Booking not found');
      } else {
        setBooking(bookingData);
      }
    } catch (err) {
      console.error('Error loading booking:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex flex-col items-center justify-center">
        <Helmet>
          <title>Loading Booking - Bond Coliving</title>
        </Helmet>
        <Loader className="w-8 h-8 text-[#C5C5B5] animate-spin mb-4" />
        <p className="text-[#C5C5B5]/80">Loading your booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex flex-col items-center justify-center px-4">
        <Helmet>
          <title>Booking Error - Bond Coliving</title>
        </Helmet>
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#C5C5B5] mb-4">Unable to Load Booking</h1>
          <p className="text-[#C5C5B5]/60 mb-8">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition-colors font-bold"
          >
            Return to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Booking Confirmed - Bond Coliving</title>
        <meta name="description" content="Your booking at Bond Coliving has been confirmed. We look forward to welcoming you!" />
      </Helmet>

      <div className="min-h-screen bg-[#1E1F1E] py-12">
        <div className="container max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#C5C5B5] mb-2">Booking Confirmed!</h1>
            <p className="text-[#C5C5B5]/60 text-lg">
              Your payment has been processed successfully
            </p>
          </div>

          <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 md:p-8 border border-[#C5C5B5]/10 mb-6">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#C5C5B5]/10">
              <div>
                <p className="text-sm text-[#C5C5B5]/60 mb-1">Booking Reference</p>
                <p className="text-2xl font-bold text-[#C5C5B5]">{booking.booking_reference}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#C5C5B5]/60 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-[#C5C5B5]">
                  {formatCurrency(booking.total_amount || 0)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-[#C5C5B5] mr-3 mt-1" />
                <div>
                  <p className="text-sm text-[#C5C5B5]/60">Check-in</p>
                  <p className="text-[#C5C5B5] font-medium">{formatDate(booking.check_in_date)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-[#C5C5B5] mr-3 mt-1" />
                <div>
                  <p className="text-sm text-[#C5C5B5]/60">Check-out</p>
                  <p className="text-[#C5C5B5] font-medium">{formatDate(booking.check_out_date)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Users className="w-5 h-5 text-[#C5C5B5] mr-3 mt-1" />
                <div>
                  <p className="text-sm text-[#C5C5B5]/60">Guests</p>
                  <p className="text-[#C5C5B5] font-medium">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {booking.is_split_stay && booking.segments && booking.segments.length > 0 ? (
            <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 md:p-8 border border-[#C5C5B5]/10 mb-6">
              <h2 className="text-xl font-bold text-[#C5C5B5] mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2" />
                Your Split-Stay Journey
              </h2>
              <p className="text-[#C5C5B5]/60 text-sm mb-4">
                You'll be moving between apartments during your stay. All transitions are coordinated for you.
              </p>
              <div className="space-y-4">
                {booking.segments.map((segment, index) => (
                  <div key={segment.id} className="p-4 bg-[#1E1F1E] rounded-lg border border-[#C5C5B5]/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm text-[#C5C5B5]/60">Stay {index + 1}</p>
                        <p className="text-lg font-bold text-[#C5C5B5]">{segment.apartment?.title}</p>
                      </div>
                      <p className="text-[#C5C5B5] font-medium">{formatCurrency(segment.segment_price)}</p>
                    </div>
                    <div className="flex items-center text-sm text-[#C5C5B5]/60">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(segment.check_in_date)} - {formatDate(segment.check_out_date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 md:p-8 border border-[#C5C5B5]/10 mb-6">
              <h2 className="text-xl font-bold text-[#C5C5B5] mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2" />
                Your Apartment
              </h2>
              {booking.apartment && (
                <div className="p-4 bg-[#1E1F1E] rounded-lg border border-[#C5C5B5]/10">
                  <p className="text-lg font-bold text-[#C5C5B5] mb-2">{booking.apartment.title}</p>
                  <div className="flex items-center text-sm text-[#C5C5B5]/60">
                    <MapPin className="w-4 h-4 mr-2" />
                    Central Funchal, Madeira
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 md:p-8 border border-[#C5C5B5]/10 mb-6">
            <h2 className="text-xl font-bold text-[#C5C5B5] mb-4">Guest Information</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-[#C5C5B5] mr-3" />
                <div>
                  <p className="text-sm text-[#C5C5B5]/60">Name</p>
                  <p className="text-[#C5C5B5]">{booking.guest_name}</p>
                </div>
              </div>
              {booking.guest_email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-[#C5C5B5] mr-3" />
                  <div>
                    <p className="text-sm text-[#C5C5B5]/60">Email</p>
                    <p className="text-[#C5C5B5]">{booking.guest_email}</p>
                  </div>
                </div>
              )}
              {booking.guest_phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-[#C5C5B5] mr-3" />
                  <div>
                    <p className="text-sm text-[#C5C5B5]/60">Phone</p>
                    <p className="text-[#C5C5B5]">{booking.guest_phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20 mb-6">
            <h3 className="text-lg font-bold text-blue-400 mb-2">What's Next?</h3>
            <ul className="space-y-2 text-blue-400/80 text-sm">
              <li>• A confirmation email has been sent to {booking.guest_email}</li>
              <li>• You'll receive check-in instructions 48 hours before your arrival</li>
              <li>• Door code and access details will be provided via email</li>
              <li>• Our team is available 24/7 for any questions</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/"
              className="flex-1 text-center px-6 py-3 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-lg hover:bg-[#C5C5B5]/20 transition-colors font-medium"
            >
              Return to Home
            </Link>
            <a
              href={`mailto:hello@stayatbond.com?subject=Booking ${booking.booking_reference}`}
              className="flex-1 text-center px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition-colors font-bold"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingSuccessPage;
