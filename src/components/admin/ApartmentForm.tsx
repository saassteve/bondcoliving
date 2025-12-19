import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { buildingService } from '../../lib/services';
import type { Building } from '../../lib/services/types';

interface Apartment {
  id: string;
  title: string;
  description: string;
  price: number;
  building_id?: string;
  accommodation_type?: 'short_term' | 'long_term';
  nightly_price?: number;
  minimum_stay_nights?: number;
  minimum_stay_months?: number;
  size: string;
  capacity: string;
  image_url: string;
  status: 'available' | 'occupied' | 'maintenance';
  sort_order: number;
  available_from?: string;
  available_until?: string;
  created_at: string;
  updated_at: string;
}

interface ApartmentFormProps {
  apartment?: Apartment | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ApartmentForm: React.FC<ApartmentFormProps> = ({
  apartment,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [formData, setFormData] = useState({
    title: apartment?.title || '',
    description: apartment?.description || '',
    price: apartment?.price?.toString() || '',
    building_id: apartment?.building_id || '',
    accommodation_type: apartment?.accommodation_type || 'long_term' as const,
    nightly_price: apartment?.nightly_price?.toString() || '',
    minimum_stay_nights: apartment?.minimum_stay_nights?.toString() || '2',
    minimum_stay_months: apartment?.minimum_stay_months?.toString() || '1',
    size: apartment?.size || '',
    capacity: apartment?.capacity || '',
    image_url: apartment?.image_url || '',
    status: apartment?.status || 'available' as const,
    available_from: apartment?.available_from || new Date().toISOString().split('T')[0],
    available_until: apartment?.available_until || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsData = await buildingService.getAll();
        setBuildings(buildingsData);
        if (!apartment && buildingsData.length > 0 && !formData.building_id) {
          setFormData(prev => ({ ...prev, building_id: buildingsData[0].id }));
        }
      } catch (error) {
        console.error('Error loading buildings:', error);
      }
    };
    loadBuildings();
  }, [apartment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.building_id) newErrors.building_id = 'Building is required';

    if (formData.accommodation_type === 'long_term') {
      if (!formData.price || parseInt(formData.price) <= 0) {
        newErrors.price = 'Valid monthly price is required';
      }
      if (!formData.minimum_stay_months || parseInt(formData.minimum_stay_months) < 1) {
        newErrors.minimum_stay_months = 'Minimum stay months must be at least 1';
      }
    } else {
      if (!formData.nightly_price || parseInt(formData.nightly_price) <= 0) {
        newErrors.nightly_price = 'Valid nightly price is required';
      }
      if (!formData.minimum_stay_nights || parseInt(formData.minimum_stay_nights) < 1) {
        newErrors.minimum_stay_nights = 'Minimum stay nights must be at least 1';
      }
    }

    if (!formData.size.trim()) newErrors.size = 'Size is required';
    if (!formData.capacity.trim()) newErrors.capacity = 'Capacity is required';
    if (!formData.image_url.trim()) newErrors.image_url = 'Image URL is required';

    // Validate availability dates
    if (!formData.available_from) newErrors.available_from = 'Available from date is required';
    if (formData.available_until && formData.available_from &&
        new Date(formData.available_until) <= new Date(formData.available_from)) {
      newErrors.available_until = 'Available until date must be after available from date';
    }

    // Validate image URL format
    try {
      new URL(formData.image_url);
    } catch {
      newErrors.image_url = 'Please enter a valid URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
      price: formData.accommodation_type === 'long_term' ? parseInt(formData.price) : 0,
      nightly_price: formData.accommodation_type === 'short_term' ? parseInt(formData.nightly_price) : null,
      minimum_stay_nights: parseInt(formData.minimum_stay_nights),
      minimum_stay_months: parseInt(formData.minimum_stay_months),
      available_until: formData.available_until || null
    };

    try {
      await onSubmit(submitData);
      if (!apartment) {
        setFormData({
          title: '',
          description: '',
          price: '',
          building_id: buildings.length > 0 ? buildings[0].id : '',
          accommodation_type: 'long_term' as const,
          nightly_price: '',
          minimum_stay_nights: '2',
          minimum_stay_months: '1',
          size: '',
          capacity: '',
          image_url: '',
          status: 'available' as const,
          available_from: new Date().toISOString().split('T')[0],
          available_until: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ general: 'Failed to save apartment. Please try again.' });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {apartment ? 'Edit Apartment' : 'Add New Apartment'}
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-600'
              }`}
              required
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-600'
              }`}
              required
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Building Location *
              </label>
              <select
                name="building_id"
                value={formData.building_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.building_id ? 'border-red-300' : 'border-gray-600'
                }`}
                required
              >
                <option value="">Select a building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
              {errors.building_id && <p className="mt-1 text-sm text-red-600">{errors.building_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Accommodation Type *
              </label>
              <select
                name="accommodation_type"
                value={formData.accommodation_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="long_term">Long-term (Monthly)</option>
                <option value="short_term">Short-term (Nightly)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formData.accommodation_type === 'long_term' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Monthly Price (€) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.price ? 'border-red-300' : 'border-gray-600'
                    }`}
                    min="1"
                    required
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Minimum Stay (Months) *
                  </label>
                  <input
                    type="number"
                    name="minimum_stay_months"
                    value={formData.minimum_stay_months}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.minimum_stay_months ? 'border-red-300' : 'border-gray-600'
                    }`}
                    min="1"
                    required
                  />
                  {errors.minimum_stay_months && <p className="mt-1 text-sm text-red-600">{errors.minimum_stay_months}</p>}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nightly Price (€) *
                  </label>
                  <input
                    type="number"
                    name="nightly_price"
                    value={formData.nightly_price}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.nightly_price ? 'border-red-300' : 'border-gray-600'
                    }`}
                    min="1"
                    required
                  />
                  {errors.nightly_price && <p className="mt-1 text-sm text-red-600">{errors.nightly_price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Minimum Stay (Nights) *
                  </label>
                  <input
                    type="number"
                    name="minimum_stay_nights"
                    value={formData.minimum_stay_nights}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.minimum_stay_nights ? 'border-red-300' : 'border-gray-600'
                    }`}
                    min="1"
                    required
                  />
                  {errors.minimum_stay_nights && <p className="mt-1 text-sm text-red-600">{errors.minimum_stay_nights}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Size
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="e.g., 25m²"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.size ? 'border-red-300' : 'border-gray-600'
                }`}
                required
              />
              {errors.size && <p className="mt-1 text-sm text-red-600">{errors.size}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Capacity
              </label>
              <input
                type="text"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="e.g., 1-2 people"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.capacity ? 'border-red-300' : 'border-gray-600'
                }`}
                required
              />
              {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Main Image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.image_url ? 'border-red-300' : 'border-gray-600'
              }`}
              required
            />
            {errors.image_url && <p className="mt-1 text-sm text-red-600">{errors.image_url}</p>}
            <p className="text-sm text-gray-500 mt-1">
              This will be used as the default image. You can add more images after creating the apartment.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Available From *
              </label>
              <input
                type="date"
                name="available_from"
                value={formData.available_from}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.available_from ? 'border-red-300' : 'border-gray-600'
                }`}
                required
              />
              {errors.available_from && <p className="mt-1 text-sm text-red-600">{errors.available_from}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Available Until
              </label>
              <input
                type="date"
                name="available_until"
                value={formData.available_until}
                onChange={handleChange}
                min={formData.available_from}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.available_until ? 'border-red-300' : 'border-gray-600'
                }`}
              />
              {errors.available_until && <p className="mt-1 text-sm text-red-600">{errors.available_until}</p>}
              <p className="text-sm text-gray-500 mt-1">
                Leave empty for indefinite availability
              </p>
            </div>
          </div>
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
              {isSubmitting ? 'Saving...' : apartment ? 'Update' : 'Create'} Apartment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApartmentForm;