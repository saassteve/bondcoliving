import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Home,
  User,
  CreditCard,
  Check,
  Clock,
  CalendarDays,
} from 'lucide-react';
import DateSelectionStep from '../../components/booking/DateSelectionStep';
import ApartmentSelectionStep from '../../components/booking/ApartmentSelectionStep';
import GuestInfoStep from '../../components/booking/GuestInfoStep';
import { apartmentBookingService, type Apartment, type BookingSettings } from '../../lib/supabase';
import AnimatedSection from '../../components/AnimatedSection';

type StayType = 'short_term' | 'long_term' | null;
type BookingStep = 'stay-type' | 'dates' | 'unit' | 'guest-info' | 'checkout';

interface BookingData {
  stayType: StayType;
  checkInDate: string | null;
  checkOutDate: string | null;
  selectedSegments: Array<{
    apartment: Apartment;
    checkIn: string;
    checkOut: string;
    price: number;
  }>;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  specialInstructions: string;
}

const BookPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('stay-type');
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData>({
    stayType: null,
    checkInDate: null,
    checkOutDate: null,
    selectedSegments: [],
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCount: 1,
    specialInstructions: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settings = await apartmentBookingService.getBookingSettings();
      setBookingSettings(settings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStayTypeSelect = (type: StayType) => {
    setBookingData((prev) => ({ ...prev, stayType: type }));
    setCurrentStep('dates');
  };

  const handleStepComplete = (step: BookingStep, data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));

    const stepOrder: BookingStep[] = ['stay-type', 'unit', 'dates', 'guest-info', 'checkout'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToStep = (step: BookingStep) => {
    setCurrentStep(step);
  };

  const calculateTotal = () => {
    return bookingData.selectedSegments.reduce((sum, seg) => sum + seg.price, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const steps = [
    { id: 'stay-type' as BookingStep, label: 'Stay Type', icon: Clock },
    { id: 'dates' as BookingStep, label: 'Dates', icon: Calendar },
    { id: 'unit' as BookingStep, label: 'Apartment', icon: Home },
    { id: 'guest-info' as BookingStep, label: 'Guest Info', icon: User },
    { id: 'checkout' as BookingStep, label: 'Payment', icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  if (loading || !bookingSettings) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex items-center justify-center">
        <div className="text-[#C5C5B5] animate-pulse">Loading booking system...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Book Your Stay - Bond Coliving Funchal, Madeira</title>
        <meta
          name="description"
          content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Direct booking with real-time availability."
        />
      </Helmet>

      <div className="min-h-screen bg-[#1E1F1E] py-8">
        <div className="container">
          <Link
            to="/"
            className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="max-w-6xl mx-auto">
            <AnimatedSection animation="fadeInUp">
              <h1 className="text-3xl md:text-4xl font-bold text-[#C5C5B5] mb-2">Book Your Stay</h1>
              <p className="text-[#C5C5B5]/60 mb-8">
                {bookingData.stayType === 'short_term'
                  ? 'Short stays from 2 nights'
                  : bookingData.stayType === 'long_term'
                  ? `Minimum ${bookingSettings.minimum_stay_days} days stay`
                  : 'Choose your stay type to get started'}
              </p>
            </AnimatedSection>

            <div className="mb-12">
              <div className="flex items-center justify-between overflow-x-auto pb-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center min-w-[80px]">
                        <button
                          onClick={() => isCompleted && goToStep(step.id)}
                          disabled={!isCompleted}
                          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                            isCompleted
                              ? 'bg-[#C5C5B5] text-[#1E1F1E] cursor-pointer hover:bg-white'
                              : isCurrent
                              ? 'bg-[#C5C5B5]/20 text-[#C5C5B5] ring-2 ring-[#C5C5B5]'
                              : 'bg-[#C5C5B5]/10 text-[#C5C5B5]/40'
                          }`}
                        >
                          {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </button>
                        <span
                          className={`text-xs font-medium whitespace-nowrap ${
                            isCurrent ? 'text-[#C5C5B5]' : isCompleted ? 'text-[#C5C5B5]/60' : 'text-[#C5C5B5]/40'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="flex-1 h-px bg-[#C5C5B5]/20 mx-2 mb-8 min-w-[20px]" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 md:p-8 border border-[#C5C5B5]/10">
                  {currentStep === 'stay-type' && (
                    <div>
                      <h2 className="text-2xl font-bold text-[#C5C5B5] mb-2">
                        What type of stay are you looking for?
                      </h2>
                      <p className="text-[#C5C5B5]/60 mb-8">
                        Choose the option that best fits your needs.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                          onClick={() => handleStayTypeSelect('short_term')}
                          className="group relative p-6 bg-[#C5C5B5]/5 rounded-xl border-2 border-transparent hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
                        >
                          <div className="absolute top-4 right-4">
                            <Clock className="w-8 h-8 text-blue-400/50 group-hover:text-blue-400 transition-colors" />
                          </div>
                          <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                            <Clock className="w-7 h-7 text-blue-300" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Short Stays</h3>
                          <p className="text-[#C5C5B5]/60 text-sm mb-4">
                            Perfect for digital nomads passing through or testing the waters.
                          </p>
                          <ul className="space-y-2 text-sm text-[#C5C5B5]/70">
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-blue-400" />
                              From 2 nights
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-blue-400" />
                              Flexible dates
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-blue-400" />
                              All amenities included
                            </li>
                          </ul>
                          <div className="mt-4 pt-4 border-t border-[#C5C5B5]/10 flex items-center justify-between">
                            <span className="text-[#C5C5B5]/40 text-sm">Bond - Pretas</span>
                            <span className="text-amber-400 text-xs">Coming Soon</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleStayTypeSelect('long_term')}
                          className="group relative p-6 bg-[#C5C5B5]/5 rounded-xl border-2 border-transparent hover:border-green-500/50 hover:bg-green-500/5 transition-all text-left"
                        >
                          <div className="absolute top-4 right-4">
                            <CalendarDays className="w-8 h-8 text-green-400/50 group-hover:text-green-400 transition-colors" />
                          </div>
                          <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                            <CalendarDays className="w-7 h-7 text-green-300" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Monthly Stays</h3>
                          <p className="text-[#C5C5B5]/60 text-sm mb-4">
                            Settle in and become part of the community. Best value.
                          </p>
                          <ul className="space-y-2 text-sm text-[#C5C5B5]/70">
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-400" />
                              Minimum 1 month
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-400" />
                              Better monthly rates
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-400" />
                              Full community access
                            </li>
                          </ul>
                          <div className="mt-4 pt-4 border-t border-[#C5C5B5]/10 flex items-center justify-between">
                            <span className="text-[#C5C5B5]/40 text-sm">
                              Bond - Carreira &amp; Sao Joao
                            </span>
                            <span className="text-green-400 text-xs">Available Now</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 'unit' && bookingData.checkInDate && bookingData.checkOutDate && (
                    <ApartmentSelectionStep
                      checkInDate={bookingData.checkInDate}
                      checkOutDate={bookingData.checkOutDate}
                      enableSplitStays={true}
                      maxSplitSegments={3}
                      initialSelection={bookingData.selectedSegments}
                      onComplete={(segments) => {
                        setSelectedApartment(segments[0]?.apartment || null);
                        handleStepComplete('unit', {
                          selectedSegments: segments,
                        });
                      }}
                      onBack={() => goToStep('dates')}
                    />
                  )}

                  {currentStep === 'dates' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-[#C5C5B5] mb-1">Select Your Dates</h2>
                          <p className="text-[#C5C5B5]/60 text-sm">
                            {bookingData.stayType === 'short_term' ? 'Short stay' : 'Monthly stay'}
                          </p>
                        </div>
                        <button
                          onClick={() => goToStep('stay-type')}
                          className="text-[#C5C5B5]/60 hover:text-[#C5C5B5] text-sm flex items-center gap-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Change stay type
                        </button>
                      </div>
                      <DateSelectionStep
                        minimumStayDays={bookingSettings.minimum_stay_days}
                        enableSplitStays={false}
                        maxSplitSegments={1}
                        initialCheckIn={bookingData.checkInDate || ''}
                        initialCheckOut={bookingData.checkOutDate || ''}
                        onComplete={(checkInDate, checkOutDate) => {
                          handleStepComplete('dates', {
                            checkInDate,
                            checkOutDate,
                          });
                        }}
                      />
                    </div>
                  )}

                  {currentStep === 'guest-info' && (
                    <GuestInfoStep
                      initialData={{
                        guestName: bookingData.guestName,
                        guestEmail: bookingData.guestEmail,
                        guestPhone: bookingData.guestPhone,
                        guestCount: bookingData.guestCount,
                        specialInstructions: bookingData.specialInstructions,
                      }}
                      onComplete={(guestInfo) => {
                        handleStepComplete('guest-info', guestInfo);
                      }}
                      onBack={() => goToStep('dates')}
                    />
                  )}

                  {currentStep === 'checkout' && (
                    <div>
                      <h2 className="text-2xl font-bold text-[#C5C5B5] mb-6">Review & Pay</h2>
                      <p className="text-[#C5C5B5]/80 mb-6">
                        You'll be redirected to Stripe to complete your payment securely.
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => goToStep('guest-info')}
                          className="px-6 py-3 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-lg hover:bg-[#C5C5B5]/20 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={async () => {
                            setIsProcessing(true);
                            try {
                              const segments = bookingData.selectedSegments.map((seg) => ({
                                apartment_id: seg.apartment.id,
                                check_in_date: seg.checkIn,
                                check_out_date: seg.checkOut,
                                segment_price: seg.price,
                              }));

                              const { url } = await apartmentBookingService.createCheckoutSession({
                                guestName: bookingData.guestName,
                                guestEmail: bookingData.guestEmail,
                                guestPhone: bookingData.guestPhone,
                                guestCount: bookingData.guestCount,
                                specialInstructions: bookingData.specialInstructions,
                                segments,
                              });

                              window.location.href = url;
                            } catch (error) {
                              console.error('Error creating checkout:', error);
                              alert('Failed to create checkout session. Please try again.');
                              setIsProcessing(false);
                            }
                          }}
                          disabled={isProcessing}
                          className="flex-1 px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50"
                        >
                          {isProcessing ? 'Processing...' : 'Continue to Payment'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10 sticky top-24">
                  <h3 className="text-xl font-bold text-[#C5C5B5] mb-4">Booking Summary</h3>

                  {bookingData.stayType && (
                    <div className="mb-4 pb-4 border-b border-[#C5C5B5]/10">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#C5C5B5]/60">Stay Type</span>
                        <span className="text-[#C5C5B5] font-medium">
                          {bookingData.stayType === 'short_term' ? 'Short Stay' : 'Monthly Stay'}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedApartment && (
                    <div className="mb-4 pb-4 border-b border-[#C5C5B5]/10">
                      <div className="aspect-[16/10] rounded-lg overflow-hidden mb-3">
                        <img
                          src={selectedApartment.image_url}
                          alt={selectedApartment.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-bold text-[#C5C5B5]">{selectedApartment.title}</h4>
                      <p className="text-sm text-[#C5C5B5]/60">
                        {selectedApartment.size} &middot; {selectedApartment.capacity}
                      </p>
                    </div>
                  )}

                  {bookingData.checkInDate && bookingData.checkOutDate && (
                    <div className="mb-4 pb-4 border-b border-[#C5C5B5]/10">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#C5C5B5]/60">Check-in</span>
                        <span className="text-[#C5C5B5]">
                          {new Date(bookingData.checkInDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#C5C5B5]/60">Check-out</span>
                        <span className="text-[#C5C5B5]">
                          {new Date(bookingData.checkOutDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {bookingData.guestCount > 0 && bookingData.guestName && (
                    <div className="mb-4 pb-4 border-b border-[#C5C5B5]/10">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#C5C5B5]/60">Guest</span>
                        <span className="text-[#C5C5B5]">{bookingData.guestName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#C5C5B5]/60">Guests</span>
                        <span className="text-[#C5C5B5]">{bookingData.guestCount}</span>
                      </div>
                    </div>
                  )}

                  {bookingData.selectedSegments.length > 0 && (
                    <div className="pt-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-lg font-bold text-[#C5C5B5]">Total</span>
                        <span className="text-2xl font-bold text-[#C5C5B5]">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                      <p className="text-xs text-[#C5C5B5]/60">All utilities and fees included</p>
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

export default BookPage;
