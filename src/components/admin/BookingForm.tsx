import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Mail, Phone, Home, CreditCard, Key, MessageSquare } from 'lucide-react';
import { apartmentService, type Apartment, type Booking } from '../../lib/supabase';

interface BookingFormProps {
  booking?: Booking | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({
  booking,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [formData, setFormData] = useState({
    apartment_id: booking?.apartment_id || '',
    guest_name: booking?.guest_name || '',
    guest_email: booking?.guest_email || '',
    guest_phone: booking?.guest_phone || '',
    check_in_date: booking?.check_in_date || '',
    check_out_date: booking?.check_out_date || '',
    booking_source: booking?.booking_source || 'direct' as const,
    booking_reference: booking?.booking_reference || '',
    door_code: booking?.door_code || '',
    special_instructions: booking?.special_instructions || '',
    guest_count: booking?.guest_count?.toString() || '1',
    total_amount: booking?.total_amount?.toString() || '',
    status: booking?.status || 'confirmed' as const
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const data = await apartmentService.getAll();
      setApartments(data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form data
    const newErrors: Record<string, string> = {};
    if (!formData.apartment_id) newErrors.apartment_id = 'Apartment is required';
    if (!formData.guest_name.trim()) newErrors.guest_name = 'Guest name is required';
    if (!formData.check_in_date) newErrors.check_in_date = 'Check-in date is required';
    if (!formData.check_out_date) newErrors.check_out_date = 'Check-out date is required';
    if (!formData.guest_count || parseInt(formData.guest_count) <= 0) {
      newErrors.guest_count = 'Guest count must be at least 1';
    }
    
    // Validate email format if provided
    if (formData.guest_email && !/\S+@\S+\.\S+/.test(formData.guest_email)) {
      newErrors.guest_email = 'Please enter a valid email';
    }
    
    // Validate dates
    if (formData.check_in_date && formData.check_out_date) {
      const checkIn = new Date(formData.check_in_date);
      const checkOut = new Date(formData.check_out_date);
      if (checkOut <= checkIn) {
        newErrors.check_out_date = 'Check-out date must be after check-in date';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
      guest_email: formData.guest_email || null,
      guest_phone: formData.guest_phone || null,
      booking_reference: formData.booking_reference || null,
      door_code: formData.door_code || null,
      special_instructions: formData.special_instructions || null,
      guest_count: parseInt(formData.guest_count),
      total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ general: 'Failed to save booking. Please try again.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectedApartment = apartments.find(apt => apt.id === formData.apartment_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {booking ? 'Edit Booking' : 'Add New Booking'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Apartment Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Home className="w-4 h-4 inline-block mr-1" />
              Apartment *
            </label>
            <select
              name="apartment_id"
              value={formData.apartment_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 ${
                errors.apartment_id ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select an apartment</option>
              {apartments.map((apartment) => (
                <option key={apartment.id} value={apartment.id}>
                  {apartment.title} - €{apartment.price}/month
                </option>
              ))}
            </select>
            {errors.apartment_id && <p className="mt-1 text-sm text-red-600">{errors.apartment_id}</p>}
          </div>

          {/* Guest Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline-block mr-1" />
                Guest Name *
              </label>
              <input
                type="text"
                name="guest_name"
                value={formData.guest_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 ${
                  errors.guest_name ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.guest_name && <p className="mt-1 text-sm text-red-600">{errors.guest_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline-block mr-1" />
                Guest Email
              </label>
              <input
                type="email"
                name="guest_email"
                value={formData.guest_email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 ${
                  errors.guest_email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.guest_email && <p className="mt-1 text-sm text-red-600">{errors.guest_email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline-block mr-1" />
                Guest Phone
              </label>
              <input
                type="tel"
                name="guest_phone"
                value={formData.guest_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guest Count *
              </label>
              <input
                type="number"
                name="guest_count"
                value={formData.guest_count}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 ${
                  errors.guest_count ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.guest_count && <p className="mt-1 text-sm text-red-600">{errors.guest_count}</p>}
            </div>
          </div>

          {/* Booking Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline-block mr-1" />
                Check-in Date *
              </label>
              <input
                type="date"
                name="check_in_date"
                value={formData.check_in_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 ${
                  errors.check_in_date ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.check_in_date && <p className="mt-1 text-sm text-red-600">{errors.check_in_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline-block mr-1" />
                Check-out Date *
              </label>
              <input
                type="date"
                name="check_out_date"
                value={formData.check_out_date}
                onChange={handleChange}
                min={formData.check_in_date}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 ${
                  errors.check_out_date ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.check_out_date && <p className="mt-1 text-sm text-red-600">{errors.check_out_date}</p>}
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Source
              </label>
              <select
                name="booking_source"
                value={formData.booking_source}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              >
                <option value="direct">Direct</option>
                <option value="airbnb">Airbnb</option>
                <option value="booking.com">Booking.com</option>
                <option value="vrbo">VRBO</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Reference
              </label>
              <input
                type="text"
                name="booking_reference"
                value={formData.booking_reference}
                onChange={handleChange}
                placeholder="e.g., AB123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Key className="w-4 h-4 inline-block mr-1" />
                Door Code
              </label>
              <input
                type="text"
                name="door_code"
                value={formData.door_code}
                onChange={handleChange}
                placeholder="e.g., 1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CreditCard className="w-4 h-4 inline-block mr-1" />
                Total Amount (€)
              </label>
              <input
                type="number"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            >
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare className="w-4 h-4 inline-block mr-1" />
              Special Instructions
            </label>
            <textarea
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleChange}
              rows={3}
              placeholder="Any special requests or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Selected Apartment Info */}
          {selectedApartment && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Selected Apartment</h4>
              <div className="text-sm text-gray-600">
                <p><strong>{selectedApartment.title}</strong></p>
                <p>€{selectedApartment.price}/month • {selectedApartment.size} • {selectedApartment.capacity}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : booking ? 'Update' : 'Create'} Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;