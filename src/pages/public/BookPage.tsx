import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Home, User, CreditCard, Check } from 'lucide-react';
import DateSelectionStep from '../../components/booking/DateSelectionStep';
import ApartmentSelectionStep from '../../components/booking/ApartmentSelectionStep';
import GuestInfoStep from '../../components/booking/GuestInfoStep';
import { apartmentBookingService, type Apartment, type BookingSettings } from '../../lib/supabase';

type BookingStep = 'dates' | 'apartments' | 'guest-info' | 'checkout';

interface BookingData {
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
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
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
    loadBookingSettings();
  }, []);

  const loadBookingSettings = async () => {
    try {
      const settings = await apartmentBookingService.getBookingSettings();
      setBookingSettings(settings);
    } catch (error) {
      console.error('Error loading booking settings:', error);
    }
  };

  const handleStepComplete = (step: BookingStep, data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));

    const steps: BookingStep[] = ['dates', 'apartments', 'guest-info', 'checkout'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
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
    { id: 'dates' as BookingStep, label: 'Dates', icon: Calendar },
    { id: 'apartments' as BookingStep, label: 'Apartments', icon: Home },
    { id: 'guest-info' as BookingStep, label: 'Guest Info', icon: User },
    { id: 'checkout' as BookingStep, label: 'Payment', icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  if (!bookingSettings) {
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
        <meta name="description" content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Direct booking with real-time availability." />
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
            <h1 className="text-3xl md:text-4xl font-bold text-[#C5C5B5] mb-2">Book Your Stay</h1>
            <p className="text-[#C5C5B5]/60 mb-8">
              Minimum {bookingSettings.minimum_stay_days} days stay required
            </p>

            <div className="mb-12">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center">
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
                          className={`text-sm font-medium ${
                            isCurrent ? 'text-[#C5C5B5]' : isCompleted ? 'text-[#C5C5B5]/60' : 'text-[#C5C5B5]/40'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="flex-1 h-px bg-[#C5C5B5]/20 mx-4 mb-8" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 md:p-8 border border-[#C5C5B5]/10">
                  {currentStep === 'dates' && (
                    <DateSelectionStep
                      minimumStayDays={bookingSettings.minimum_stay_days}
                      enableSplitStays={bookingSettings.enable_split_stays}
                      maxSplitSegments={bookingSettings.max_split_segments}
                      initialCheckIn={bookingData.checkInDate || ''}
                      initialCheckOut={bookingData.checkOutDate || ''}
                      onComplete={(checkInDate, checkOutDate) => {
                        handleStepComplete('dates', { checkInDate, checkOutDate });
                      }}
                    />
                  )}

                  {currentStep === 'apartments' && bookingData.checkInDate && bookingData.checkOutDate && (
                    <ApartmentSelectionStep
                      checkInDate={bookingData.checkInDate}
                      checkOutDate={bookingData.checkOutDate}
                      enableSplitStays={bookingSettings.enable_split_stays}
                      maxSplitSegments={bookingSettings.max_split_segments}
                      initialSelection={bookingData.selectedSegments}
                      onComplete={(selectedSegments) => {
                        handleStepComplete('apartments', { selectedSegments });
                      }}
                      onBack={() => goToStep('dates')}
                    />
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
                      onBack={() => goToStep('apartments')}
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
                              const segments = bookingData.selectedSegments.map(seg => ({
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

                  {bookingData.selectedSegments.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-[#C5C5B5]/10">
                      <h4 className="text-sm font-bold text-[#C5C5B5] mb-3">
                        {bookingData.selectedSegments.length > 1 ? 'Split Stay' : 'Your Apartment'}
                      </h4>
                      {bookingData.selectedSegments.map((segment, index) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <div className="text-sm font-medium text-[#C5C5B5]">{segment.apartment.title}</div>
                          <div className="text-xs text-[#C5C5B5]/60">
                            {new Date(segment.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                            {new Date(segment.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-sm text-[#C5C5B5]/80">{formatCurrency(segment.price)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {bookingData.guestCount > 0 && (
                    <div className="mb-4 pb-4 border-b border-[#C5C5B5]/10">
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
                        <span className="text-2xl font-bold text-[#C5C5B5]">{formatCurrency(calculateTotal())}</span>
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
