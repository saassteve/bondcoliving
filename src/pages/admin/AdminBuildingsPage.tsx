import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, MapPin, Building2 } from 'lucide-react';
import { buildingService } from '../../lib/services';
import type { Building } from '../../lib/services/types';

const AdminBuildingsPage: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    address: '',
    description: '',
    has_on_site_coworking: false,
    check_in_instructions: '',
    latitude: '',
    longitude: '',
    image_url: '',
    sort_order: 0
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const data = await buildingService.getAll();
      setBuildings(data);
    } catch (err) {
      console.error('Error fetching buildings:', err);
      setError('Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (building: Building) => {
    setEditingBuilding(building);
    setFormData({
      slug: building.slug,
      name: building.name,
      address: building.address,
      description: building.description || '',
      has_on_site_coworking: building.has_on_site_coworking,
      check_in_instructions: building.check_in_instructions || '',
      latitude: building.latitude?.toString() || '',
      longitude: building.longitude?.toString() || '',
      image_url: building.image_url || '',
      sort_order: building.sort_order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this building? Apartments in this building will need to be reassigned.')) {
      return;
    }

    try {
      await buildingService.delete(id);
      setBuildings(prev => prev.filter(b => b.id !== id));
      alert('Building deleted successfully');
    } catch (err) {
      console.error('Error deleting building:', err);
      alert('Failed to delete building. Make sure no apartments are assigned to it.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const buildingData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      if (editingBuilding) {
        const updated = await buildingService.update(editingBuilding.id, buildingData);
        setBuildings(prev => prev.map(b => b.id === editingBuilding.id ? updated : b));
        alert('Building updated successfully');
      } else {
        const newBuilding = await buildingService.create(buildingData);
        setBuildings(prev => [...prev, newBuilding]);
        alert('Building created successfully');
      }

      resetForm();
    } catch (err) {
      console.error('Error saving building:', err);
      alert('Failed to save building');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBuilding(null);
    setFormData({
      slug: '',
      name: '',
      address: '',
      description: '',
      has_on_site_coworking: false,
      check_in_instructions: '',
      latitude: '',
      longitude: '',
      image_url: '',
      sort_order: 0
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading buildings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Buildings - Bond Admin</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Buildings Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Building
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => (
            <div key={building.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">{building.name}</h3>
                </div>
                {building.has_on_site_coworking && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Coworking
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{building.address}</span>
                </div>
                {building.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{building.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(building)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(building.id)}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {buildings.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No buildings found. Add your first building to get started.</p>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingBuilding ? 'Edit Building' : 'Add New Building'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Building Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="carreira, sao_joao, pretas"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has_coworking"
                    checked={formData.has_on_site_coworking}
                    onChange={(e) => setFormData({ ...formData, has_on_site_coworking: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="has_coworking" className="text-sm font-medium text-gray-700">
                    Has On-site Coworking Space
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Instructions
                  </label>
                  <textarea
                    value={formData.check_in_instructions}
                    onChange={(e) => setFormData({ ...formData, check_in_instructions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter building-specific check-in details"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="32.6500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="-16.9083"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingBuilding ? 'Update' : 'Create'} Building
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminBuildingsPage;
