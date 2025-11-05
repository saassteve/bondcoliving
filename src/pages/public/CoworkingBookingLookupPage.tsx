import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Calendar, Mail, Key, Clock, CheckCircle, Send } from 'lucide-react';
import { coworkingBookingService, type CoworkingBooking, supabase } from '../../lib/supabase';

const CoworkingBookingLookupPage: React.FC = () => {
  const [bookingReference, setBookingReference] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<CoworkingBooking | null>(null);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBooking(null);
    setLoading(true);

    try {
      const foundBooking = await coworkingBookingService.getByReference(bookingReference.trim().toUpperCase());

      if (!foundBooking) {
        setError('Booking not found. Please check your reference number and try again.');
        return;
      }

      if (foundBooking.customer_email.toLowerCase() !== email.trim().toLowerCase()) {
        setError('Email does not match the booking. Please verify your email address.');
        return;
      }

      setBooking(foundBooking);
    } catch (err) {
      console.error('Error looking up booking:', err);
      setError('Failed to look up booking. Please try again.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'completed':
        return 'text-blue-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleResendEmail = async () => {
    if (!booking) return;

    setResending(true);
    setResendSuccess(false);
    setError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-coworking-email`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          resendEmail: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend email');
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      console.error('Error resending email:', err);
      setError('Failed to resend email. Please try again or contact support.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Lookup Your Booking - Bond Coworking</title>
        <meta name="description" content="Look up your coworking booking to view your access code and booking details." />
      </Helmet>

      <div className="min-h-screen bg-[#1E1F1E] py-24">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#C5C5B5] mb-4">
              Lookup Your Booking
            </h1>
            <p className="text-xl text-[#C5C5B5]/70">
              Enter your booking reference and email to view your details
            </p>
          </div>

          <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10 mb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                  Booking Reference *
                </label>
                <input
                  type="text"
                  value={bookingReference}
                  onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
                  placeholder="CW-20251105-1234"
                  className="w-full px-4 py-3 bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-lg text-[#C5C5B5] focus:border-[#C5C5B5] focus:outline-none font-mono"
                  required
                />
                <p className="text-xs text-[#C5C5B5]/60 mt-1">
                  Found in your confirmation email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-lg text-[#C5C5B5] focus:border-[#C5C5B5] focus:outline-none"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5 mr-2" />
                {loading ? 'Searching...' : 'Find My Booking'}
              </button>
            </form>
          </div>

          {booking && (
            <div className="space-y-6">
              <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#C5C5B5]/10">
                  <div>
                    <div className="text-sm text-[#C5C5B5]/60 mb-1">Booking Reference</div>
                    <div className="text-2xl font-bold text-[#C5C5B5] font-mono">
                      {booking.booking_reference}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#C5C5B5]/60 mb-1">Status</div>
                    <div className={`text-lg font-bold capitalize ${getStatusColor(booking.booking_status)}`}>
                      {booking.booking_status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-[#C5C5B5]/60 mb-1">Pass Type</div>
                    <div className="text-xl font-semibold text-[#C5C5B5]">
                      {booking.pass?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C5C5B5]/60 mb-1">Amount Paid</div>
                    <div className="text-xl font-semibold text-[#C5C5B5]">
                      €{parseFloat(booking.total_amount as any).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-[#C5C5B5]/60 mr-3 mt-1" />
                    <div>
                      <div className="text-sm text-[#C5C5B5]/60 mb-1">Start Date</div>
                      <div className="text-lg text-[#C5C5B5]">{formatDate(booking.start_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-[#C5C5B5]/60 mr-3 mt-1" />
                    <div>
                      <div className="text-sm text-[#C5C5B5]/60 mb-1">End Date</div>
                      <div className="text-lg text-[#C5C5B5]">{formatDate(booking.end_date)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-[#C5C5B5]/60 mr-3 mt-1" />
                  <div>
                    <div className="text-sm text-[#C5C5B5]/60 mb-1">Email</div>
                    <div className="text-lg text-[#C5C5B5]">{booking.customer_email}</div>
                  </div>
                </div>
              </div>

              {booking.access_code ? (
                <div className="bg-[#C5C5B5] rounded-2xl p-8 border-2 border-[#C5C5B5]">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-[#1E1F1E] rounded-full flex items-center justify-center mr-4">
                      <Key className="w-6 h-6 text-[#C5C5B5]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#1E1F1E] mb-2">
                        Your Access Code
                      </h3>
                      <p className="text-[#1E1F1E]/70 mb-4">
                        Use this code to access the coworking space
                      </p>
                      <div className="bg-[#1E1F1E] rounded-xl p-6 text-center">
                        <div className="text-4xl md:text-5xl font-bold text-[#C5C5B5] font-mono tracking-wider">
                          {booking.access_code}
                        </div>
                      </div>

                      {resendSuccess ? (
                        <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                          <p className="text-sm text-[#1E1F1E] font-medium">
                            Access code email resent successfully! Check your inbox.
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={handleResendEmail}
                          disabled={resending}
                          className="mt-4 w-full px-4 py-3 bg-[#1E1F1E]/10 hover:bg-[#1E1F1E]/20 text-[#1E1F1E] rounded-lg transition-all font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {resending ? 'Sending...' : 'Resend Access Code Email'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-[#1E1F1E]/10 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-[#1E1F1E] mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[#1E1F1E]">
                        <strong>Note:</strong> This code is valid from your start date to your end date.
                        Please keep it secure and do not share it with others.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-8">
                  <div className="flex items-start">
                    <Clock className="w-6 h-6 text-yellow-500 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-[#C5C5B5] mb-2">
                        Access Code Pending
                      </h3>
                      <p className="text-[#C5C5B5]/70">
                        Your access code will be sent to your email before your start date.
                        Please check back here or check your email closer to your booking date.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {booking.special_notes && (
                <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10">
                  <h3 className="text-lg font-bold text-[#C5C5B5] mb-2">Special Notes</h3>
                  <p className="text-[#C5C5B5]/80">{booking.special_notes}</p>
                </div>
              )}

              <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10 text-center">
                <h3 className="text-lg font-bold text-[#C5C5B5] mb-2">Need Help?</h3>
                <p className="text-[#C5C5B5]/70 mb-4">
                  If you have any questions about your booking, please contact us.
                </p>
                <a
                  href="mailto:hello@stayatbond.com"
                  className="inline-flex items-center px-6 py-3 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-semibold"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  hello@stayatbond.com
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CoworkingBookingLookupPage;
