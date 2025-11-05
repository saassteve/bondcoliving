import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Mail, ArrowRight } from 'lucide-react';
import { coworkingBookingService, type CoworkingBooking } from '../../lib/supabase';

const CoworkingBookingSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<CoworkingBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookingId = searchParams.get('booking_id');
    if (bookingId) {
      fetchBooking(bookingId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchBooking = async (bookingId: string) => {
    try {
      const data = await coworkingBookingService.getById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex items-center justify-center">
        <div className="text-[#C5C5B5]">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Booking Confirmed - Bond Coworking</title>
      </Helmet>

      <div className="min-h-screen bg-[#1E1F1E] py-24">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#C5C5B5] mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-xl text-[#C5C5B5]/70">
              Thank you for booking with Bond Coworking
            </p>
          </div>

          {booking ? (
            <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-sm text-[#C5C5B5]/60 mb-1">Booking Reference</div>
                  <div className="text-2xl font-bold text-[#C5C5B5] font-mono">
                    {booking.booking_reference}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#C5C5B5]/60 mb-1">Pass Type</div>
                  <div className="text-2xl font-bold text-[#C5C5B5]">{booking.pass?.name}</div>
                </div>
              </div>

              <div className="border-t border-[#C5C5B5]/10 pt-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center text-[#C5C5B5]/60 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      Start Date
                    </div>
                    <div className="text-lg text-[#C5C5B5]">
                      {formatDate(booking.start_date)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-[#C5C5B5]/60 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      End Date
                    </div>
                    <div className="text-lg text-[#C5C5B5]">{formatDate(booking.end_date)}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#C5C5B5]/10 pt-6">
                <div className="flex items-center text-[#C5C5B5]/60 mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  Confirmation Email
                </div>
                <p className="text-[#C5C5B5]">
                  A confirmation email has been sent to{' '}
                  <span className="font-semibold">{booking.customer_email}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10 mb-8 text-center">
              <p className="text-[#C5C5B5]">Your booking has been confirmed!</p>
              <p className="text-[#C5C5B5]/70 mt-2">
                Check your email for confirmation and booking details.
              </p>
            </div>
          )}

          <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10 mb-8">
            <h2 className="text-2xl font-bold text-[#C5C5B5] mb-4">What Happens Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-[#C5C5B5]/20 rounded-full flex items-center justify-center text-[#C5C5B5] font-bold mr-4">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#C5C5B5] mb-1">
                    Check Your Email
                  </h3>
                  <p className="text-[#C5C5B5]/70">
                    You'll receive a confirmation email with your booking details and reference
                    number.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-[#C5C5B5]/20 rounded-full flex items-center justify-center text-[#C5C5B5] font-bold mr-4">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#C5C5B5] mb-1">
                    Receive Your Access Code
                  </h3>
                  <p className="text-[#C5C5B5]/70 mb-2">
                    Our team will send you an access code via email before your start date.
                  </p>
                  <Link
                    to="/coworking/booking/lookup"
                    className="text-[#C5C5B5] hover:text-white underline text-sm"
                  >
                    You can also look up your booking anytime to view your access code
                  </Link>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-[#C5C5B5]/20 rounded-full flex items-center justify-center text-[#C5C5B5] font-bold mr-4">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#C5C5B5] mb-1">Start Coworking</h3>
                  <p className="text-[#C5C5B5]/70">
                    Use your access code to enter the coworking space and start working!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10 mb-8 text-center">
            <h3 className="text-xl font-bold text-[#C5C5B5] mb-2">Need Help?</h3>
            <p className="text-[#C5C5B5]/70 mb-4">
              If you have any questions about your booking, feel free to reach out to us.
            </p>
            <a
              href="mailto:hello@stayatbond.com"
              className="inline-flex items-center px-6 py-3 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-semibold"
            >
              <Mail className="w-4 h-4 mr-2" />
              hello@stayatbond.com
            </a>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold"
            >
              Back to Home
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoworkingBookingSuccessPage;
