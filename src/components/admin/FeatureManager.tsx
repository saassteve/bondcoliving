import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, GripVertical } from 'lucide-react';
import { apartmentService, type ApartmentFeature } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import { availableIcons } from '../../lib/iconUtils';

interface FeatureManagerProps {
  apartmentId: string;
  onClose: () => void;
}

const FeatureManager: React.FC<FeatureManagerProps> = ({ apartmentId, onClose }) => {
  const [features, setFeatures] = useState<ApartmentFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFeature, setNewFeature] = useState({
    icon: 'Users',
    label: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, [apartmentId]);

  const fetchFeatures = async () => {
    try {
      const data = await apartmentService.getFeatures(apartmentId);
      setFeatures(data);
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeature.label.trim()) return;

    setIsAdding(true);
    try {
      await apartmentService.addFeature({
        apartment_id: apartmentId,
        icon: newFeature.icon,
        label: newFeature.label.trim(),
        sort_order: features.length
      });
      
      setNewFeature({ icon: 'Users', label: '' });
      await fetchFeatures();
    } catch (error) {
      console.error('Error adding feature:', error);
      alert('Failed to add feature');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) return;

    try {
      await apartmentService.deleteFeature(featureId);
      await fetchFeatures();
    } catch (error) {
      console.error('Error deleting feature:', error);
      alert('Failed to delete feature');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Manage Features</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add new feature form */}
        <form onSubmit={handleAddFeature} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Add New Feature
          </label>
          <div className="flex gap-2">
            <select
              value={newFeature.icon}
              onChange={(e) => setNewFeature({ ...newFeature, icon: e.target.value })}
              className="px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[120px]"
            >
              {availableIcons.sort().map((icon) => {
                return (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                );
              })}
            </select>
            <input
              type="text"
              value={newFeature.label}
              onChange={(e) => setNewFeature({ ...newFeature, label: e.target.value })}
              placeholder="e.g., Air conditioning, Ocean view..."
              className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Features list */}
        {features.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No features yet</h3>
            <p className="text-gray-300">Add features like air conditioning, ocean views, or premium amenities.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {features.map((feature) => {
              const IconComponent = getIconComponent(feature.icon);
              return (
                <div
                  key={feature.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-600 rounded-lg hover:bg-gray-700 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-gray-300" />
                      <span className="font-medium">{feature.label}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteFeature(feature.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 p-1"
                    title="Delete feature"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureManager;