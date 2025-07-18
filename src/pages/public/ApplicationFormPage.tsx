import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, Phone, User, Home, MessageSquare, Search, ArrowRight, CheckCircle } from 'lucide-react';
import { applicationService, apartmentService, type Apartment } from '../../lib/supabase';

const ApplicationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    arrival_date: '',
    departure_date: '',
    apartment_preference: '',
    about: '',
    heard_from: '',
  });
  const [dateError, setDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const totalSteps = 3;
  
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const data = await apartmentService.getAll();
        setApartments(data);
      } catch (err) {
        console.error('Error fetching apartments:', err);
      }
    };

    fetchApartments();
  }, []);

  useEffect(() => {
    if (formData.arrival_date && formData.departure_date) {
      const arrivalDate = new Date(formData.arrival_date);
      const departureDate = new Date(formData.departure_date);
      const diffTime = Math.abs(departureDate.getTime() - arrivalDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        setDateError('Minimum stay is 1 month');
      } else {
        setDateError('');
      }
    }
  }, [formData.arrival_date, formData.departure_date]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.heard_from.trim()) newErrors.heard_from = 'Please tell us how you heard about us';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        break;
      case 2:
        if (!formData.arrival_date) newErrors.arrival_date = 'Arrival date is required';
        if (!formData.departure_date) newErrors.departure_date = 'Departure date is required';
        if (dateError) newErrors.departure_date = dateError;
        break;
      case 3:
        if (!formData.about.trim()) newErrors.about = 'Please tell us about yourself';
        if (formData.about.trim().length < 50) {
          newErrors.about = 'Please provide at least 50 characters';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep) || dateError || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Ensure we're using the correct data format for the database
      const applicationData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || null,
        arrival_date: formData.arrival_date,
        departure_date: formData.departure_date,
        apartment_preference: formData.apartment_preference?.trim() || null,
        about: formData.about.trim(),
        heard_from: formData.heard_from?.trim() || null
      };
      
      await applicationService.create(applicationData);
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting application:', error);
      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes('row-level security')) {
          alert('There was a permission error submitting your application. Please try refreshing the page and submitting again.');
        } else {
          alert(`There was an error submitting your application: ${error.message}. Please try again.`);
        }
      } else {
        alert('There was an error submitting your application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum departure date (1 month from arrival)
  const getMinDepartureDate = () => {
    if (!formData.arrival_date) return '';
    const arrivalDate = new Date(formData.arrival_date);
    const minDepartureDate = new Date(arrivalDate);
    minDepartureDate.setMonth(arrivalDate.getMonth() + 1);
    return minDepartureDate.toISOString().split('T')[0];
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
            step <= currentStep 
              ? 'bg-[#C5C5B5] border-[#C5C5B5] text-[#1E1F1E]' 
              : 'border-[#C5C5B5]/30 text-[#C5C5B5]/30'
          }`}>
            {step < currentStep ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <span className="font-semibold">{step}</span>
            )}
          </div>
          {step < totalSteps && (
            <div className={`w-16 h-0.5 mx-4 transition-all ${
              step < currentStep ? 'bg-[#C5C5B5]' : 'bg-[#C5C5B5]/30'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
            Let's get to know you
          </span>
        </h2>
        <p className="text-[#C5C5B5]/80">Tell us a bit about yourself to get started</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <label htmlFor="name" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/40 group-focus-within:text-[#C5C5B5] transition-colors" />
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 bg-[#1E1F1E]/50 border-2 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all ${
                errors.name ? 'border-red-500' : 'border-[#C5C5B5]/20'
              }`}
              placeholder="Your full name"
            />
          </div>
          {errors.name && <p className="mt-2 text-red-400 text-sm">{errors.name}</p>}
        </div>
        
        <div className="relative group">
          <label htmlFor="email" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/40 group-focus-within:text-[#C5C5B5] transition-colors" />
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 bg-[#1E1F1E]/50 border-2 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all ${
                errors.email ? 'border-red-500' : 'border-[#C5C5B5]/20'
              }`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="mt-2 text-red-400 text-sm">{errors.email}</p>}
        </div>
        
        <div className="relative group">
          <label htmlFor="phone" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/40 group-focus-within:text-[#C5C5B5] transition-colors" />
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 bg-[#1E1F1E]/50 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>
        
        <div className="relative group">
          <label htmlFor="heard_from" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            How did you hear about us? *
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/40 group-focus-within:text-[#C5C5B5] transition-colors" />
            <select
              id="heard_from"
              name="heard_from"
              value={formData.heard_from}
              onChange={handleChange}
              required
              className="w-full pl-12 pr-4 py-4 bg-[#1E1F1E]/50 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all appearance-none"
            >
              <option value="">Please select *</option>
              <option value="google">Google Search</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter/X</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="friend">Friend or Family</option>
              <option value="colleague">Work Colleague</option>
              <option value="nomad-community">Digital Nomad Community</option>
              <option value="blog">Blog or Article</option>
              <option value="podcast">Podcast</option>
              <option value="newsletter">Newsletter</option>
              <option value="airbnb">Airbnb or Similar Platform</option>
              <option value="booking">Booking.com or Travel Site</option>
              <option value="nomad-list">Nomad List</option>
              <option value="reddit">Reddit</option>
              <option value="facebook-group">Facebook Group</option>
              <option value="slack-community">Slack Community</option>
              <option value="discord">Discord</option>
              <option value="coworking-space">Another Coworking Space</option>
              <option value="event">Event or Conference</option>
              <option value="referral">Referral Program</option>
              <option value="press">Press or Media</option>
              <option value="other">Other</option>
            </select>
          </div>
          {errors.heard_from && <p className="mt-2 text-red-400 text-sm">{errors.heard_from}</p>}
        </div>
      </div>
      
      {/* Apartment Selection */}
      {apartments.length > 0 && (
        <div className="mt-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4 text-[#C5C5B5]">Choose Your Space</h3>
            <p className="text-[#C5C5B5]/80">Select your preferred apartment (you can change this later)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* No Preference Option */}
            <div 
              onClick={() => setFormData(prev => ({ ...prev, apartment_preference: '' }))}
              className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                formData.apartment_preference === '' 
                  ? 'border-[#C5C5B5] bg-[#C5C5B5]/10' 
                  : 'border-[#C5C5B5]/20 hover:border-[#C5C5B5]/40'
              }`}
            >
              <div className="aspect-video bg-gradient-to-br from-[#C5C5B5]/20 to-[#C5C5B5]/5 flex items-center justify-center">
                <div className="text-center">
                  <Home className="w-12 h-12 text-[#C5C5B5]/60 mx-auto mb-2" />
                  <p className="text-[#C5C5B5]/60 text-sm">Any Available</p>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#C5C5B5] mb-2">No Preference</h4>
                <p className="text-[#C5C5B5]/60 text-sm mb-3">We'll match you with the best available option</p>
                <div className="text-lg font-bold text-[#C5C5B5]">Best Match</div>
              </div>
              {formData.apartment_preference === '' && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#C5C5B5] rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#1E1F1E] rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Apartment Options */}
            {apartments.map((apartment) => (
              <div 
                key={apartment.id}
                onClick={() => setFormData(prev => ({ ...prev, apartment_preference: apartment.title }))}
                className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                  formData.apartment_preference === apartment.title 
                    ? 'border-[#C5C5B5] bg-[#C5C5B5]/10' 
                    : 'border-[#C5C5B5]/20 hover:border-[#C5C5B5]/40'
                }`}
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={apartment.image_url} 
                    alt={apartment.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-[#C5C5B5] mb-2">{apartment.title}</h4>
                  <p className="text-[#C5C5B5]/60 text-sm mb-3 line-clamp-2">{apartment.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-[#C5C5B5]">€{apartment.price.toLocaleString()}</div>
                    <div className="text-[#C5C5B5]/60 text-sm">per month</div>
                  </div>
                  {apartment.available_from && (
                    <div className="mt-2 text-xs text-[#C5C5B5]/50">
                      Available from {new Date(apartment.available_from).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  )}
                </div>
                {formData.apartment_preference === apartment.title && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-[#C5C5B5] rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#1E1F1E] rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
            Plan your stay
          </span>
        </h2>
        <p className="text-[#C5C5B5]/80">When would you like to join our community?</p>
        <div className="mt-4 p-4 bg-[#C5C5B5]/10 rounded-xl">
          <p className="text-[#C5C5B5]/60 text-sm">Minimum stay is 1 month</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <label htmlFor="arrival_date" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            Planned Arrival *
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/40 group-focus-within:text-[#C5C5B5] transition-colors" />
            <input
              type="date"
              id="arrival_date"
              name="arrival_date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={formData.arrival_date}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 bg-[#1E1F1E]/50 border-2 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all ${
                errors.arrival_date ? 'border-red-500' : 'border-[#C5C5B5]/20'
              }`}
            />
          </div>
          {errors.arrival_date && <p className="mt-2 text-red-400 text-sm">{errors.arrival_date}</p>}
        </div>
        
        <div className="relative group">
          <label htmlFor="departure_date" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            Planned Departure *
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/40 group-focus-within:text-[#C5C5B5] transition-colors" />
            <input
              type="date"
              id="departure_date"
              name="departure_date"
              required
              min={getMinDepartureDate()}
              value={formData.departure_date}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 bg-[#1E1F1E]/50 border-2 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all ${
                errors.departure_date || dateError ? 'border-red-500' : 'border-[#C5C5B5]/20'
              }`}
            />
          </div>
          {(errors.departure_date || dateError) && (
            <p className="mt-2 text-red-400 text-sm">{errors.departure_date || dateError}</p>
          )}
        </div>
        
        <div className="md:col-span-2 relative group">
          <label htmlFor="apartment_preference" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            Apartment Preference (Optional - you can change this from step 1)
          </label>
          <div className="relative">
            <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/40 group-focus-within:text-[#C5C5B5] transition-colors" />
            <select
              id="apartment_preference"
              name="apartment_preference"
              value={formData.apartment_preference}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 bg-[#1E1F1E]/50 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all appearance-none"
            >
              <option value="">No preference</option>
              {apartments.map((apartment) => (
                <option key={apartment.id} value={apartment.title}>
                  {apartment.title} - €{apartment.price.toLocaleString()}/month
                  {apartment.available_from && ` (Available from ${new Date(apartment.available_from).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
            Tell us about yourself
          </span>
        </h2>
        <p className="text-[#C5C5B5]/80">Help us understand what you're looking for</p>
      </div>
      
      <div className="relative group">
        <label htmlFor="about" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
          About You *
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-[#C5C5B5]/40 group-focus-within:text-[#C5C5B5] transition-colors" />
          <textarea
            id="about"
            name="about"
            rows={6}
            required
            value={formData.about}
            onChange={handleChange}
            placeholder="What do you do? What are your interests? What are you looking for in a coliving space? Tell us what makes you excited about joining Bond..."
            className={`w-full pl-12 pr-4 py-4 bg-[#1E1F1E]/50 border-2 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all resize-none ${
              errors.about ? 'border-red-500' : 'border-[#C5C5B5]/20'
            }`}
          ></textarea>
        </div>
        <div className="flex justify-between items-center mt-2">
          {errors.about && <p className="text-red-400 text-sm">{errors.about}</p>}
          <p className="text-[#C5C5B5]/40 text-sm ml-auto">
            {formData.about.length}/500 characters
          </p>
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      <Helmet>
        <title>Apply for Digital Nomad Coliving in Central Funchal, Madeira | Bond Application</title>
        <meta name="description" content="Apply for premium digital nomad coliving in central Funchal, Madeira. Private apartments with enterprise-grade WiFi, coworking space, all amenities included. Monthly stays from €1,600." />
        <meta name="keywords" content="apply digital nomad Funchal, join coliving Madeira central, Bond application form, digital nomad accommodation booking Funchal, remote work housing Madeira, nomad visa application Portugal" />
        <link rel="canonical" href="https://stayatbond.com/apply" />
        <meta name="robots" content="noindex" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Apply for Digital Nomad Coliving in Central Funchal, Madeira | Bond Application" />
        <meta property="og:description" content="Apply for premium digital nomad coliving in central Funchal. Private apartments, enterprise-grade WiFi, coworking space, all amenities included." />
        <meta property="og:url" content="https://stayatbond.com/apply" />
        <meta property="og:image" content="https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
      </Helmet>
      
      <section className="relative py-32">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>
        <div className="container relative z-20">
          <div className="max-w-xl">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium mb-4">
                Join Our Community
              </p>
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  Apply to Bond
                </span>
              </h1>
            </div>
            <p className="text-xl text-[#C5C5B5]">
              Ready to be part of something different? We'll get back to you within 48 hours.
            </p>
          </div>
        </div>
      </section>
      
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {renderStepIndicator()}
            
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="bg-[#1E1F1E]/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </div>
              
              <div className="flex justify-between items-center pt-8">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-8 py-4 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-medium uppercase tracking-wide"
                  >
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-medium uppercase tracking-wide flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    Next Step
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={!!dateError || isSubmitting}
                    className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-medium uppercase tracking-wide flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E1F1E]"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
            
            <div className="text-center mt-12">
              <p className="text-[#C5C5B5]/60 text-sm">
                We'll review your application and get back to you within 48 hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ApplicationFormPage;