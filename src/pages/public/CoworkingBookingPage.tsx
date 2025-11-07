import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, User, Mail, Phone, CreditCard, Check, AlertCircle } from 'lucide-react';
import { coworkingPassService, type CoworkingPass } from '../../lib/supabase';

const CoworkingBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [passes, setPasses] = useState<CoworkingPass[]>([]);
  const [selectedPassId, setSelectedPassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMinimumDate = () => {
    const tomorrow = getTomorrowDate();

    if (!selectedPass) return tomorrow;

    if (selectedPass.is_date_restricted && selectedPass.available_from) {
      const availableFrom = selectedPass.available_from;
      return availableFrom > tomorrow ? availableFrom : tomorrow;
    }

    return tomorrow;
  };

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    startDate: getTomorrowDate(),
    specialNotes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchPasses();
    const passSlug = searchParams.get('pass');
    if (passSlug) {
      loadPassBySlug(passSlug);
    }
  }, []);

  const fetchPasses = async () => {
    try {
      const data = await coworkingPassService.getActive();
      setPasses(data);
      if (data.length > 0 && !selectedPassId) {
        setSelectedPassId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching passes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPassBySlug = async (slug: string) => {
    try {
      const pass = await coworkingPassService.getBySlug(slug);
      if (pass) {
        setSelectedPassId(pass.id);
      }
    } catch (error) {
      console.error('Error loading pass:', error);
    }
  };

  const selectedPass = passes.find((p) => p.id === selectedPassId);

  useEffect(() => {
    if (selectedPass) {
      const minDate = getMinimumDate();
      if (formData.startDate < minDate) {
        setFormData(prev => ({ ...prev, startDate: minDate }));
      }
    }
  }, [selectedPassId, selectedPass]);

  const checkAvailability = async (passId: string, startDate: string) => {
    try {
      setIsCheckingAvailability(true);
      const availability = await coworkingPassService.checkAvailability(passId, startDate);

      if (!availability.available) {
        let message = 'This pass is not available for the selected date.';

        if (availability.reason === 'at_capacity') {
          message = 'This pass is fully booked for the selected date. Please choose a different date.';
          if (availability.next_available_date) {
            message += ` Next available: ${new Date(availability.next_available_date).toLocaleDateString()}.`;
          }
        } else if (availability.reason === 'no_longer_available') {
          message = 'This pass is no longer available for booking.';
        } else if (availability.reason === 'outside_schedule') {
          message = 'The selected date is outside the available schedule for this pass.';
          if (availability.next_available_date) {
            message += ` Next available: ${new Date(availability.next_available_date).toLocaleDateString()}.`;
          }
        }
        setAvailabilityMessage(message);
        return false;
      }

      setAvailabilityMessage('');
      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityMessage('Unable to check availability. Please try again.');
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAvailabilityMessage('');

    const newErrors: Record<string, string> = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Name is required';
    if (!formData.customerEmail.trim()) newErrors.customerEmail = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) newErrors.customerEmail = 'Invalid email';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!selectedPassId) newErrors.pass = 'Please select a pass';

    // Validate start date meets minimum requirements
    const selectedDate = new Date(formData.startDate);
    const minDate = new Date(getMinimumDate());
    selectedDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);

    if (selectedDate < minDate) {
      if (selectedPass?.is_date_restricted && selectedPass?.available_from) {
        newErrors.startDate = `This pass is available from ${new Date(selectedPass.available_from).toLocaleDateString()}`;
      } else {
        newErrors.startDate = 'Bookings must start at least 1 day in advance';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isAvailable = await checkAvailability(selectedPassId, formData.startDate);
    if (!isAvailable) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-coworking-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            passId: selectedPassId,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone || undefined,
            startDate: formData.startDate,
            specialNotes: formData.specialNotes || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create booking. Please try again.',
      });
      setSubmitting(false);
    }
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
        <title>Book Coworking Pass - Bond Coworking</title>
      </Helmet>

      <div className="min-h-screen bg-[#1E1F1E] py-24">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#C5C5B5] mb-4">Book Your Coworking Pass</h1>
            <p className="text-[#C5C5B5]/70">
              Select your pass and provide your details to complete your booking
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10">
              <h2 className="text-2xl font-bold text-[#C5C5B5] mb-6">Select Pass</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passes.map((pass) => (
                  <div
                    key={pass.id}
                    onClick={() => setSelectedPassId(pass.id)}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
                      selectedPassId === pass.id
                        ? 'border-[#C5C5B5] bg-[#C5C5B5]/10'
                        : 'border-[#C5C5B5]/20 hover:border-[#C5C5B5]/40'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#C5C5B5]">{pass.name}</h3>
                        <p className="text-sm text-[#C5C5B5]/60">{pass.description}</p>
                      </div>
                      {selectedPassId === pass.id && (
                        <Check className="w-6 h-6 text-[#C5C5B5]" />
                      )}
                    </div>
                    <div className="text-3xl font-bold text-[#C5C5B5] mb-4">€{pass.price}</div>
                    <ul className="space-y-2">
                      {pass.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="text-sm text-[#C5C5B5]/80 flex items-start">
                          <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {errors.pass && <p className="mt-2 text-sm text-red-400">{errors.pass}</p>}
            </div>

            <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10">
              <h2 className="text-2xl font-bold text-[#C5C5B5] mb-6">Your Details</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className={`w-full px-4 py-3 bg-[#1E1F1E] border ${
                      errors.customerName ? 'border-red-400' : 'border-[#C5C5B5]/20'
                    } rounded-lg text-[#C5C5B5] focus:border-[#C5C5B5] focus:outline-none`}
                    placeholder="John Doe"
                  />
                  {errors.customerName && <p className="mt-1 text-sm text-red-400">{errors.customerName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className={`w-full px-4 py-3 bg-[#1E1F1E] border ${
                        errors.customerEmail ? 'border-red-400' : 'border-[#C5C5B5]/20'
                      } rounded-lg text-[#C5C5B5] focus:border-[#C5C5B5] focus:outline-none`}
                      placeholder="john@example.com"
                    />
                    {errors.customerEmail && <p className="mt-1 text-sm text-red-400">{errors.customerEmail}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-lg text-[#C5C5B5] focus:border-[#C5C5B5] focus:outline-none"
                      placeholder="+351 123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={getMinimumDate()}
                    className={`w-full px-4 py-3 bg-[#1E1F1E] border ${
                      errors.startDate ? 'border-red-400' : 'border-[#C5C5B5]/20'
                    } rounded-lg text-[#C5C5B5] focus:border-[#C5C5B5] focus:outline-none transition-all hover:border-[#C5C5B5]/40 cursor-pointer`}
                    placeholder="Select a date"
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-red-400">{errors.startDate}</p>}
                  {selectedPass && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-[#C5C5B5]/60">
                        Your pass will be valid for {selectedPass.duration_days} days
                      </p>
                      {selectedPass.is_date_restricted && selectedPass.available_from && (
                        <p className="text-sm text-blue-400">
                          Available from {new Date(selectedPass.available_from).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                    Special Notes (Optional)
                  </label>
                  <textarea
                    value={formData.specialNotes}
                    onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-lg text-[#C5C5B5] focus:border-[#C5C5B5] focus:outline-none"
                    placeholder="Any special requests or information..."
                  />
                </div>
              </div>
            </div>

            {availabilityMessage && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-300">{availabilityMessage}</p>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{errors.general}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/coworking')}
                className="px-8 py-4 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {submitting ? 'Processing...' : `Proceed to Payment - €${selectedPass?.price || 0}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CoworkingBookingPage;
