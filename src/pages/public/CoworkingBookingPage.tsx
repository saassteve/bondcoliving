import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, User, Mail, Phone, CreditCard, Check, 
  AlertCircle, ArrowLeft, ShieldCheck, Wifi, Coffee 
} from 'lucide-react';
import { coworkingPassService, type CoworkingPass } from '../../lib/supabase';
import AnimatedSection from '../../components/AnimatedSection';

const CoworkingBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [passes, setPasses] = useState<CoworkingPass[]>([]);
  const [selectedPassId, setSelectedPassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isBefore2PM = () => {
    const now = new Date();
    const hours = now.getHours();
    return hours < 14; // Before 2pm (14:00)
  };

  const getMinimumDate = () => {
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();

    // Allow same-day booking if before 2pm
    const earliestDate = isBefore2PM() ? today : tomorrow;

    if (!selectedPass) return earliestDate;
    if (selectedPass.is_date_restricted && selectedPass.available_from) {
      const availableFrom = selectedPass.available_from;
      return availableFrom > earliestDate ? availableFrom : earliestDate;
    }
    return earliestDate;
  };

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    startDate: '',
    specialNotes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    try {
      const data = await coworkingPassService.getActive();
      setPasses(data);
      
      // Handle pre-selection from URL
      const passSlug = searchParams.get('pass');
      if (passSlug) {
        const preselected = data.find(p => p.slug === passSlug);
        if (preselected) setSelectedPassId(preselected.id);
        else if (data.length > 0) setSelectedPassId(data[0].id);
      } else if (data.length > 0) {
        setSelectedPassId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching passes:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPass = passes.find((p) => p.id === selectedPassId);

  useEffect(() => {
    if (selectedPass) {
      const minDate = getMinimumDate();
      if (!formData.startDate || formData.startDate < minDate) {
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
          message = 'Fully booked for this date. Please choose another.';
          if (availability.next_available_date) {
            message += ` Next available: ${new Date(availability.next_available_date).toLocaleDateString()}.`;
          }
        } else if (availability.reason === 'no_longer_available') {
          message = 'This pass is no longer available.';
        } else if (availability.reason === 'outside_schedule') {
          message = 'Date outside available schedule.';
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

    const selectedDate = new Date(formData.startDate);
    const minDate = new Date(getMinimumDate());
    selectedDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);

    if (selectedDate < minDate) {
      if (selectedPass?.is_date_restricted && selectedPass?.available_from) {
        newErrors.startDate = `Available from ${new Date(selectedPass.available_from).toLocaleDateString()}`;
      } else {
        newErrors.startDate = isBefore2PM()
          ? 'Invalid date selected'
          : 'Same-day bookings only available before 2pm. Please select tomorrow or later.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      const contactSection = document.getElementById('contact-details');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      return;
    }

    const isAvailable = await checkAvailability(selectedPassId, formData.startDate);
    if (!isAvailable) return;

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
      if (url) window.location.href = url;
      else throw new Error('No checkout URL returned');
      
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
        <div className="text-[#C5C5B5] animate-pulse text-xl font-medium">Loading passes...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Secure Checkout - Bond Coworking</title>
      </Helmet>

      <div className="min-h-screen bg-[#1E1F1E] pb-24 pt-28 md:pt-32 px-4">
        {/* Header */}
        <div className="container max-w-6xl mb-12">
          <button 
            onClick={() => navigate('/coworking')} 
            className="flex items-center text-white/50 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to passes
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Secure Your Spot</h1>
          <p className="text-white/60 text-lg">Complete your booking to access Funchal's premium workspace.</p>
        </div>

        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN: FORM */}
            <div className="lg:col-span-7 space-y-12">
              <form id="booking-form" onSubmit={handleSubmit} className="space-y-12">
                
                {/* Section 1: Pass Selection */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[#C5C5B5] text-[#1E1F1E] flex items-center justify-center font-bold text-sm">1</div>
                    <h2 className="text-2xl font-bold text-white">Choose your plan</h2>
                  </div>
                  
                  <div className="grid gap-4">
                    {passes.map((pass) => (
                      <div
                        key={pass.id}
                        onClick={() => setSelectedPassId(pass.id)}
                        className={`relative cursor-pointer p-6 rounded-2xl border transition-all duration-300 group ${
                          selectedPassId === pass.id
                            ? 'bg-[#C5C5B5]/10 border-[#C5C5B5]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className={`text-lg font-bold mb-1 ${selectedPassId === pass.id ? 'text-[#C5C5B5]' : 'text-white'}`}>
                              {pass.name}
                            </h3>
                            <p className="text-white/60 text-sm max-w-[80%]">{pass.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="block text-2xl font-bold text-white">€{pass.price}</span>
                            {selectedPassId === pass.id && (
                              <div className="absolute top-6 right-6 w-6 h-6 bg-[#C5C5B5] rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-[#1E1F1E]" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.pass && <p className="mt-2 text-sm text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors.pass}</p>}
                </section>

                {/* Section 2: Start Date */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[#C5C5B5] text-[#1E1F1E] flex items-center justify-center font-bold text-sm">2</div>
                    <h2 className="text-2xl font-bold text-white">When do you start?</h2>
                  </div>

                  <div className="bg-gradient-to-br from-[#C5C5B5]/10 to-[#C5C5B5]/5 p-8 rounded-3xl border-2 border-[#C5C5B5]/30">
                    <label className="block text-lg font-bold text-white mb-3">Select your start date</label>
                    <p className="text-white/60 text-sm mb-4">
                      {isBefore2PM()
                        ? 'Same-day booking available! Book before 2pm to start today.'
                        : 'Same-day booking ends at 2pm. Select tomorrow or later.'}
                    </p>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#C5C5B5] pointer-events-none z-10" />
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        min={getMinimumDate()}
                        className="w-full pl-16 pr-24 py-5 bg-[#1E1F1E] border-2 border-[#C5C5B5]/50 rounded-2xl text-white text-lg font-medium focus:border-[#C5C5B5] focus:outline-none transition-colors [color-scheme:dark] hover:border-[#C5C5B5]/70 cursor-pointer"
                      />
                      {formData.startDate === getTodayDate() && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#C5C5B5] text-[#1E1F1E] rounded-full text-xs font-bold pointer-events-none z-10">
                          Today
                        </div>
                      )}
                    </div>
                    {errors.startDate && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <p className="text-sm text-red-300 font-medium">{errors.startDate}</p>
                      </div>
                    )}

                    {/* Availability Message */}
                    {availabilityMessage && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-200">{availabilityMessage}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Section 3: Contact Details */}
                <section id="contact-details">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[#C5C5B5] text-[#1E1F1E] flex items-center justify-center font-bold text-sm">3</div>
                    <h2 className="text-2xl font-bold text-white">Your details</h2>
                  </div>

                  <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-[#C5C5B5] mb-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                          type="text"
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-[#1E1F1E] border border-white/10 rounded-xl text-white focus:border-[#C5C5B5] focus:outline-none transition-colors"
                          placeholder="Jane Doe"
                        />
                      </div>
                      {errors.customerName && <p className="mt-1 text-sm text-red-400">{errors.customerName}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-[#C5C5B5] mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <input
                            type="email"
                            value={formData.customerEmail}
                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-[#1E1F1E] border border-white/10 rounded-xl text-white focus:border-[#C5C5B5] focus:outline-none transition-colors"
                            placeholder="jane@example.com"
                          />
                        </div>
                        {errors.customerEmail && <p className="mt-1 text-sm text-red-400">{errors.customerEmail}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-[#C5C5B5] mb-2">Phone (Optional)</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <input
                            type="tel"
                            value={formData.customerPhone}
                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-[#1E1F1E] border border-white/10 rounded-xl text-white focus:border-[#C5C5B5] focus:outline-none transition-colors"
                            placeholder="+351..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-[#C5C5B5] mb-2">Special Request (Optional)</label>
                      <textarea
                        value={formData.specialNotes}
                        onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-4 bg-[#1E1F1E] border border-white/10 rounded-xl text-white focus:border-[#C5C5B5] focus:outline-none transition-colors resize-none"
                        placeholder="Dietary restrictions, arrival time..."
                      />
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* RIGHT COLUMN: SUMMARY */}
            <div className="lg:col-span-5">
              <div className="sticky top-32">
                <div className="bg-[#C5C5B5] rounded-3xl p-8 text-[#1E1F1E] shadow-2xl">
                  <h3 className="text-2xl font-bold mb-6">Order Summary</h3>
                  
                  <div className="space-y-6 mb-8">
                    {/* Selected Plan */}
                    <div className="flex justify-between items-start pb-6 border-b border-[#1E1F1E]/10">
                      <div>
                        <p className="font-bold text-lg">{selectedPass?.name || 'Select a plan'}</p>
                        <p className="text-[#1E1F1E]/60 text-sm">
                          {selectedPass?.duration_days === 1 ? '1 Day Access' : `${selectedPass?.duration_days} Days Access`}
                        </p>
                      </div>
                      <span className="font-bold text-xl">
                        {selectedPass ? `€${selectedPass.price}` : '—'}
                      </span>
                    </div>

                    {/* Features Recap */}
                    {selectedPass && (
                      <div className="space-y-3">
                        <p className="font-bold text-sm uppercase tracking-wider opacity-60">Includes</p>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-sm">
                            <Wifi className="w-4 h-4 opacity-60" /> 1Gbps Fiber Internet
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Coffee className="w-4 h-4 opacity-60" /> Specialty Coffee & Tea
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <ShieldCheck className="w-4 h-4 opacity-60" /> 8am-8pm Daily Access
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-end mb-8">
                    <span className="text-lg font-medium opacity-60">Total due now</span>
                    <span className="text-4xl font-bold">{selectedPass ? `€${selectedPass.price}` : '€0'}</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedPassId}
                    className="w-full py-4 bg-[#1E1F1E] text-white rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl"
                  >
                    {submitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        Proceed to Payment <CreditCard className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  
                  <p className="text-center text-xs opacity-50 mt-4">
                    Secure payment powered by Stripe. No account required.
                  </p>
                  
                  {errors.general && (
                    <div className="mt-4 p-3 bg-red-500/10 rounded-lg text-red-600 text-sm text-center">
                      {errors.general}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default CoworkingBookingPage;