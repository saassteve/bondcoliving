import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Mail, Phone, Home, CreditCard, Key, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { apartmentService, type Apartment, type Booking } from '../../lib/supabase';

interface BookingSegment {
  id: string;
  apartment_id: string;
  check_in_date: string;
  check_out_date: string;
  segment_price: string;
  notes: string;
}

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
  const [isSplitBooking, setIsSplitBooking] = useState(booking?.is_split_stay || false);
  const [segments, setSegments] = useState<BookingSegment[]>([{
    id: crypto.randomUUID(),
    apartment_id: booking?.apartment_id || '',
    check_in_date: booking?.check_in_date || '',
    check_out_date: booking?.check_out_date || '',
    segment_price: booking?.total_amount?.toString() || '',
    notes: ''
  }]);
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

  useEffect(() => {
    if (booking?.is_split_stay && booking.segments && booking.segments.length > 0) {
      setSegments(
        booking.segments.map((seg: any) => ({
          id: seg.id || crypto.randomUUID(),
          apartment_id: seg.apartment_id,
          check_in_date: seg.check_in_date,
          check_out_date: seg.check_out_date,
          segment_price: seg.segment_price?.toString() || '',
          notes: seg.notes || ''
        }))
      );
    }
  }, [booking]);

  const fetchApartments = async () => {
    try {
      const data = await apartmentService.getAll();
      setApartments(data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  };

  const addSegment = () => {
    const lastSegment = segments[segments.length - 1];
    setSegments([...segments, {
      id: crypto.randomUUID(),
      apartment_id: '',
      check_in_date: lastSegment?.check_out_date || '',
      check_out_date: '',
      segment_price: '',
      notes: ''
    }]);
  };

  const removeSegment = (id: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter(seg => seg.id !== id));
    }
  };

  const updateSegment = (id: string, field: keyof BookingSegment, value: string) => {
    setSegments(segments.map(seg =>
      seg.id === id ? { ...seg, [field]: value } : seg
    ));
  };

  const calculateTotalAmount = () => {
    return segments.reduce((sum, seg) => {
      const price = parseFloat(seg.segment_price) || 0;
      return sum + price;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const newErrors: Record<string, string> = {};
    if (!formData.guest_name.trim()) newErrors.guest_name = 'Guest name is required';
    if (!formData.guest_count || parseInt(formData.guest_count) <= 0) {
      newErrors.guest_count = 'Guest count must be at least 1';
    }

    // Validate email format if provided
    if (formData.guest_email && !/\S+@\S+\.\S+/.test(formData.guest_email)) {
      newErrors.guest_email = 'Please enter a valid email';
    }

    if (isSplitBooking) {
      // Validate segments
      segments.forEach((segment, index) => {
        if (!segment.apartment_id) {
          newErrors[`segment_${index}_apartment`] = `Segment ${index + 1}: Apartment is required`;
        }
        if (!segment.check_in_date) {
          newErrors[`segment_${index}_checkin`] = `Segment ${index + 1}: Check-in date is required`;
        }
        if (!segment.check_out_date) {
          newErrors[`segment_${index}_checkout`] = `Segment ${index + 1}: Check-out date is required`;
        }
        if (segment.check_in_date && segment.check_out_date) {
          const checkIn = new Date(segment.check_in_date);
          const checkOut = new Date(segment.check_out_date);
          if (checkOut <= checkIn) {
            newErrors[`segment_${index}_checkout`] = `Segment ${index + 1}: Check-out must be after check-in`;
          }
        }
        if (!segment.segment_price || parseFloat(segment.segment_price) <= 0) {
          newErrors[`segment_${index}_price`] = `Segment ${index + 1}: Price is required`;
        }
      });
    } else {
      // Validate single booking
      if (!formData.apartment_id) newErrors.apartment_id = 'Apartment is required';
      if (!formData.check_in_date) newErrors.check_in_date = 'Check-in date is required';
      if (!formData.check_out_date) newErrors.check_out_date = 'Check-out date is required';

      if (formData.check_in_date && formData.check_out_date) {
        const checkIn = new Date(formData.check_in_date);
        const checkOut = new Date(formData.check_out_date);
        if (checkOut <= checkIn) {
          newErrors.check_out_date = 'Check-out date must be after check-in date';
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let submitData: any;

    if (isSplitBooking) {
      // Prepare split booking data
      submitData = {
        isSplitBooking: true,
        guestInfo: {
          guest_name: formData.guest_name,
          guest_email: formData.guest_email || null,
          guest_phone: formData.guest_phone || null,
          guest_count: parseInt(formData.guest_count),
          special_instructions: formData.special_instructions || null,
        },
        segments: segments.map(seg => ({
          apartment_id: seg.apartment_id,
          check_in_date: seg.check_in_date,
          check_out_date: seg.check_out_date,
          segment_price: parseFloat(seg.segment_price),
          notes: seg.notes || null
        })),
        booking_source: formData.booking_source,
        booking_reference: formData.booking_reference || null,
        door_code: formData.door_code || null,
        status: formData.status
      };
    } else {
      // Prepare regular booking data
      submitData = {
        isSplitBooking: false,
        ...formData,
        guest_email: formData.guest_email || null,
        guest_phone: formData.guest_phone || null,
        booking_reference: formData.booking_reference || null,
        door_code: formData.door_code || null,
        special_instructions: formData.special_instructions || null,
        guest_count: parseInt(formData.guest_count),
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null
      };
    }

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
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {booking ? 'Edit Booking' : 'Add New Booking'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-300"
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
          {/* Split Booking Toggle */}
          <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSplitBooking}
                onChange={(e) => setIsSplitBooking(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-600 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-300">
                Split Booking (Guest will stay in multiple apartments)
              </span>
            </label>
            {booking && (
              <p className="mt-2 text-xs text-gray-400">
                Toggle to convert between split and regular booking
              </p>
            )}
          </div>

          {/* Guest Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <User className="w-4 h-4 inline-block mr-1" />
                Guest Name *
              </label>
              <input
                type="text"
                name="guest_name"
                value={formData.guest_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                  errors.guest_name ? 'border-red-300' : 'border-gray-600'
                }`}
                required
              />
              {errors.guest_name && <p className="mt-1 text-sm text-red-600">{errors.guest_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <Mail className="w-4 h-4 inline-block mr-1" />
                Guest Email
              </label>
              <input
                type="email"
                name="guest_email"
                value={formData.guest_email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                  errors.guest_email ? 'border-red-300' : 'border-gray-600'
                }`}
              />
              {errors.guest_email && <p className="mt-1 text-sm text-red-600">{errors.guest_email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <Phone className="w-4 h-4 inline-block mr-1" />
                Guest Phone
              </label>
              <input
                type="tel"
                name="guest_phone"
                value={formData.guest_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Guest Count *
              </label>
              <input
                type="number"
                name="guest_count"
                value={formData.guest_count}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                  errors.guest_count ? 'border-red-300' : 'border-gray-600'
                }`}
                required
              />
              {errors.guest_count && <p className="mt-1 text-sm text-red-600">{errors.guest_count}</p>}
            </div>
          </div>

          {/* Booking Segments or Single Booking */}
          {isSplitBooking ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Booking Segments</h3>
                <button
                  type="button"
                  onClick={addSegment}
                  className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Segment
                </button>
              </div>

              {segments.map((segment, index) => (
                <div key={segment.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">Segment {index + 1}</h4>
                    {segments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSegment(segment.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        <Home className="w-4 h-4 inline-block mr-1" />
                        Apartment *
                      </label>
                      <select
                        value={segment.apartment_id}
                        onChange={(e) => updateSegment(segment.id, 'apartment_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                          errors[`segment_${index}_apartment`] ? 'border-red-300' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select an apartment</option>
                        {apartments.map((apartment) => (
                          <option key={apartment.id} value={apartment.id}>
                            {apartment.title} - €{apartment.price}/month
                          </option>
                        ))}
                      </select>
                      {errors[`segment_${index}_apartment`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`segment_${index}_apartment`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        <Calendar className="w-4 h-4 inline-block mr-1" />
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        value={segment.check_in_date}
                        onChange={(e) => updateSegment(segment.id, 'check_in_date', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                          errors[`segment_${index}_checkin`] ? 'border-red-300' : 'border-gray-600'
                        }`}
                      />
                      {errors[`segment_${index}_checkin`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`segment_${index}_checkin`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        <Calendar className="w-4 h-4 inline-block mr-1" />
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        value={segment.check_out_date}
                        onChange={(e) => updateSegment(segment.id, 'check_out_date', e.target.value)}
                        min={segment.check_in_date}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                          errors[`segment_${index}_checkout`] ? 'border-red-300' : 'border-gray-600'
                        }`}
                      />
                      {errors[`segment_${index}_checkout`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`segment_${index}_checkout`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        <CreditCard className="w-4 h-4 inline-block mr-1" />
                        Price (€) *
                      </label>
                      <input
                        type="number"
                        value={segment.segment_price}
                        onChange={(e) => updateSegment(segment.id, 'segment_price', e.target.value)}
                        step="0.01"
                        min="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                          errors[`segment_${index}_price`] ? 'border-red-300' : 'border-gray-600'
                        }`}
                      />
                      {errors[`segment_${index}_price`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`segment_${index}_price`]}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Segment Notes
                      </label>
                      <input
                        type="text"
                        value={segment.notes}
                        onChange={(e) => updateSegment(segment.id, 'notes', e.target.value)}
                        placeholder="Optional notes for this segment..."
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="text-sm text-gray-300">
                  <strong>Total Amount:</strong> €{calculateTotalAmount().toFixed(2)}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Single Apartment Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <Home className="w-4 h-4 inline-block mr-1" />
                  Apartment *
                </label>
                <select
                  name="apartment_id"
                  value={formData.apartment_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                    errors.apartment_id ? 'border-red-300' : 'border-gray-600'
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

              {/* Single Booking Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    name="check_in_date"
                    value={formData.check_in_date}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                      errors.check_in_date ? 'border-red-300' : 'border-gray-600'
                    }`}
                    required
                  />
                  {errors.check_in_date && <p className="mt-1 text-sm text-red-600">{errors.check_in_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    name="check_out_date"
                    value={formData.check_out_date}
                    onChange={handleChange}
                    min={formData.check_in_date}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white ${
                      errors.check_out_date ? 'border-red-300' : 'border-gray-600'
                    }`}
                    required
                  />
                  {errors.check_out_date && <p className="mt-1 text-sm text-red-600">{errors.check_out_date}</p>}
                </div>
              </div>
            </>
          )}

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Booking Source
              </label>
              <select
                name="booking_source"
                value={formData.booking_source}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              >
                <option value="direct">Direct</option>
                <option value="airbnb">Airbnb</option>
                <option value="booking.com">Booking.com</option>
                <option value="vrbo">VRBO</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Booking Reference
              </label>
              <input
                type="text"
                name="booking_reference"
                value={formData.booking_reference}
                onChange={handleChange}
                placeholder="e.g., AB123456789"
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              />
            </div>

            {!isSplitBooking && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <Key className="w-4 h-4 inline-block mr-1" />
                  Door Code
                </label>
                <input
                  type="text"
                  name="door_code"
                  value={formData.door_code}
                  onChange={handleChange}
                  placeholder="e.g., 1234"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                />
              </div>
            )}

            {!isSplitBooking && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
            >
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <MessageSquare className="w-4 h-4 inline-block mr-1" />
              Special Instructions
            </label>
            <textarea
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleChange}
              rows={3}
              placeholder="Any special requests or notes..."
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
            />
          </div>

          {/* Selected Apartment Info */}
          {selectedApartment && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-white mb-2">Selected Apartment</h4>
              <div className="text-sm text-gray-300">
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
              className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
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