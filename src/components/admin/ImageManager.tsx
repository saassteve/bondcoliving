import React, { useState, useEffect } from 'react';
import { Plus, X, Star, StarOff, Trash2, GripVertical } from 'lucide-react';
import { apartmentService, type ApartmentImage } from '../../lib/supabase';

interface ImageManagerProps {
  apartmentId: string;
  onClose: () => void;
}

const ImageManager: React.FC<ImageManagerProps> = ({ apartmentId, onClose }) => {
  const [images, setImages] = useState<ApartmentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchImages();
  }, [apartmentId]);

  const fetchImages = async () => {
    try {
      const data = await apartmentService.getImages(apartmentId);
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    setIsAdding(true);
    try {
      await apartmentService.addImage({
        apartment_id: apartmentId,
        image_url: newImageUrl.trim(),
        is_featured: images.length === 0, // First image is featured by default
        sort_order: images.length
      });
      
      setNewImageUrl('');
      await fetchImages();
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Failed to add image');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSetFeatured = async (imageId: string) => {
    try {
      await apartmentService.setFeaturedImage(apartmentId, imageId);
      
      // Also update the main apartment image_url to match the featured image
      const featuredImage = images.find(img => img.id === imageId);
      if (featuredImage) {
        await apartmentService.update(apartmentId, {
          image_url: featuredImage.image_url
        });
      }
      
      await fetchImages();
    } catch (error) {
      console.error('Error setting featured image:', error);
      alert('Failed to set featured image');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await apartmentService.deleteImage(imageId);
      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Manage Images</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add new image form */}
        <form onSubmit={handleAddImage} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add New Image
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Enter image URL..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

        {/* Images grid */}
        {images.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
            <p className="text-gray-600">Add your first image using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-lg overflow-hidden border-2 ${
                  image.is_featured ? 'border-yellow-400' : 'border-gray-200'
                }`}
              >
                <div className="aspect-video">
                  <img
                    src={image.image_url}
                    alt="Apartment"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Featured badge */}
                {image.is_featured && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!image.is_featured && (
                    <button
                      onClick={() => handleSetFeatured(image.id)}
                      className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition-colors"
                      title="Set as featured"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort handle */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white bg-opacity-80 p-1 rounded cursor-move">
                    <GripVertical className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageManager;