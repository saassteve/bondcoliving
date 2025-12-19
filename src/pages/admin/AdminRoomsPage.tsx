import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Images, Settings, Calendar } from 'lucide-react';
import { supabase, ApartmentService, apartmentService } from '../../lib/supabase';
import ApartmentForm from '../../components/admin/ApartmentForm';
import ImageManager from '../../components/admin/ImageManager';
import FeatureManager from '../../components/admin/FeatureManager';
import CalendarManager from '../../components/admin/CalendarManager';

interface Apartment {
  id: string;
  title: string;
  description: string;
  price: number;
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

interface ApartmentFeature {
  id: string;
  apartment_id: string;
  icon: string;
  label: string;
  sort_order: number;
}

const AdminRoomsPage: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [features, setFeatures] = useState<ApartmentFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [showImageManager, setShowImageManager] = useState<string | null>(null);
  const [showFeatureManager, setShowFeatureManager] = useState<string | null>(null);
  const [showCalendarManager, setShowCalendarManager] = useState<{ id: string; title: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchApartments(), fetchFeatures()]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load apartments data');
    } finally {
      setLoading(false);
    }
  };

  const fetchApartments = async () => {
    try {
      const data = await apartmentService.getAll();
      setApartments(data);
      
      // If we're editing an apartment that no longer exists, reset the form
      if (editingApartment && !data.find(apt => apt.id === editingApartment.id)) {
        console.warn('Editing apartment no longer exists, resetting form');
        resetForm();
      }
    } catch (error) {
      console.error('Error fetching apartments:', error);
      throw error;
    }
  };

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('apartment_features')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching features:', error);
      throw error;
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const apartmentData = {
        ...formData,
        sort_order: editingApartment?.sort_order ?? apartments.length,
      };

      if (editingApartment) {
        // Update existing apartment
        const updatedApartment = await apartmentService.update(editingApartment.id, apartmentData);
        
        // Update local state immediately
        setApartments(prev => prev.map(apt => 
          apt.id === editingApartment.id ? updatedApartment : apt
        ));
      } else {
        // Create new apartment
        const newApartment = await apartmentService.create(apartmentData);

        // Add the main image to apartment_images table
        if (formData.image_url) {
          await supabase
            .from('apartment_images')
            .insert({
              apartment_id: newApartment.id,
              image_url: formData.image_url,
              is_featured: true,
              sort_order: 0
            });
        }
        
        // Add to local state immediately
        setApartments(prev => [...prev, newApartment]);
      }

      resetForm();
      
      // Show success message
      const action = editingApartment ? 'updated' : 'created';
      alert(`Apartment ${action} successfully!`);
    } catch (error) {
      console.error('Error saving apartment:', error);
      const action = editingApartment ? 'update' : 'create';
      
      // Handle specific error cases
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid apartment ID'))) {
        alert(`Apartment not found. It may have been deleted by another user. Refreshing the list...`);
        await fetchData();
        resetForm();
      } else {
        alert(`Failed to ${action} apartment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this apartment? This will also delete all associated images and features.')) return;

    try {
      await apartmentService.delete(id);
      await fetchApartments();
    } catch (error) {
      console.error('Error deleting apartment:', error);
      alert('Failed to delete apartment');
    }
  };

  const resetForm = () => {
    setEditingApartment(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApartmentFeatures = (apartmentId: string) => {
    return features.filter(feature => feature.apartment_id === apartmentId);
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Manage Apartments - Bond Admin</title>
        </Helmet>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading apartments...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Manage Apartments - Bond Admin</title>
        </Helmet>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Manage Apartments</h1>
              <p className="text-gray-300">Add, edit, and organize your apartment listings</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Apartment
            </button>
          </div>
          
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-300 font-medium">Error Loading Data</h3>
                <p className="text-red-400 mt-1">{error}</p>
                <button
                  onClick={fetchData}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Apartments - Bond Admin</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Apartments</h1>
            <p className="text-gray-300">Add, edit, and organize your apartment listings</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Apartment
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          {apartments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No apartments yet</h3>
              <p className="text-gray-300 mb-4">Get started by adding your first apartment listing.</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Apartment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                      Apartment
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-600">
                  {apartments.map((apartment) => {
                    const apartmentFeatures = getApartmentFeatures(apartment.id);

                    return (
                      <tr key={apartment.id} className="hover:bg-gray-700 border-b border-gray-600">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16">
                              <img
                                className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover"
                                src={apartment.image_url}
                                alt={apartment.title}
                              />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <div className="text-sm font-medium text-white">
                                {apartment.title}
                              </div>
                              <div className="text-sm text-gray-300 line-clamp-1 sm:line-clamp-2 max-w-[150px] sm:max-w-none">
                                {apartment.description}
                              </div>
                              <div className="sm:hidden text-xs text-gray-400 mt-1">
                                €{apartment.price.toLocaleString()}/mo
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4">
                          <div className="text-sm text-white">
                            <div>€{apartment.price.toLocaleString()}/month</div>
                            <div className="text-gray-300">{apartment.size} • {apartment.capacity}</div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(apartment.status)}`}>
                            {apartment.status}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4">
                          <div className="text-sm text-white">
                            {apartment.available_from && (
                              <div className="font-medium">From: {new Date(apartment.available_from).toLocaleDateString()}</div>
                            )}
                            {apartment.available_until && (
                              <div className="text-gray-300">Until: {new Date(apartment.available_until).toLocaleDateString()}</div>
                            )}
                            {!apartment.available_until && apartment.available_from && (
                              <div className="text-gray-300">Ongoing</div>
                            )}
                          </div>
                        </td>
                        <td className="hidden xl:table-cell px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {apartmentFeatures.slice(0, 3).map((feature) => (
                              <span
                                key={feature.id}
                                className="inline-flex items-center px-2 py-1 text-xs bg-blue-900/50 text-blue-300 rounded"
                              >
                                {feature.icon} {feature.label}
                              </span>
                            ))}
                            {apartmentFeatures.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{apartmentFeatures.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => setShowImageManager(apartment.id)}
                              className="text-purple-400 hover:text-purple-300 p-2 font-medium rounded-lg hover:bg-gray-600 transition-colors"
                              title="Manage images"
                            >
                              <Images className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowFeatureManager(apartment.id)}
                              className="hidden sm:block text-blue-400 hover:text-blue-300 p-2 font-medium rounded-lg hover:bg-gray-600 transition-colors"
                              title="Manage features"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowCalendarManager({ id: apartment.id, title: apartment.title })}
                              className="hidden sm:block text-green-400 hover:text-green-300 p-2 font-medium rounded-lg hover:bg-gray-600 transition-colors"
                              title="Manage calendar"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(apartment)}
                              className="text-indigo-400 hover:text-indigo-300 p-2 font-medium rounded-lg hover:bg-gray-600 transition-colors"
                              title="Edit apartment"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(apartment.id)}
                              className="text-red-400 hover:text-red-300 p-2 font-medium rounded-lg hover:bg-gray-600 transition-colors"
                              title="Delete apartment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        {showForm && (
          <ApartmentForm
            apartment={editingApartment}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isSubmitting={isSubmitting}
          />
        )}

        {showImageManager && (
          <ImageManager
            apartmentId={showImageManager}
            onClose={() => setShowImageManager(null)}
          />
        )}

        {showFeatureManager && (
          <FeatureManager
            apartmentId={showFeatureManager}
            onClose={() => setShowFeatureManager(null)}
          />
        )}

        {showCalendarManager && (
          <CalendarManager
            apartmentId={showCalendarManager.id}
            apartmentTitle={showCalendarManager.title}
            onClose={() => setShowCalendarManager(null)}
          />
        )}
      </div>
    </>
  );
};

export default AdminRoomsPage;