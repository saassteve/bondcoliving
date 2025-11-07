import React, { useState, useEffect } from 'react';
import { Plus, Trash, Edit, X, Check, Image as ImageIcon, MoveUp, MoveDown } from 'lucide-react';
import { coworkingImageService, type CoworkingImage } from '../../lib/supabase';

const CoworkingImageManager: React.FC = () => {
  const [images, setImages] = useState<CoworkingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<CoworkingImage | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newImage, setNewImage] = useState({
    image_url: '',
    caption: '',
    alt_text: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await coworkingImageService.getAll();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
      alert('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const maxSortOrder = images.length > 0
        ? Math.max(...images.map(img => img.sort_order))
        : -1;

      await coworkingImageService.create({
        ...newImage,
        sort_order: maxSortOrder + 1
      });

      setNewImage({
        image_url: '',
        caption: '',
        alt_text: '',
        is_active: true,
        sort_order: 0
      });
      setIsAdding(false);
      await fetchImages();
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Failed to add image');
    }
  };

  const handleEdit = (image: CoworkingImage) => {
    setEditingImage({ ...image });
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      await coworkingImageService.update(editingImage.id, {
        image_url: editingImage.image_url,
        caption: editingImage.caption,
        alt_text: editingImage.alt_text,
        is_active: editingImage.is_active
      });
      setEditingImage(null);
      await fetchImages();
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Failed to update image');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await coworkingImageService.delete(id);
      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newImages = [...images];
    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];

    try {
      await coworkingImageService.reorder(newImages.map(img => img.id));
      await fetchImages();
    } catch (error) {
      console.error('Error reordering images:', error);
      alert('Failed to reorder images');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === images.length - 1) return;

    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];

    try {
      await coworkingImageService.reorder(newImages.map(img => img.id));
      await fetchImages();
    } catch (error) {
      console.error('Error reordering images:', error);
      alert('Failed to reorder images');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading images...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">Coworking Space Images</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Image
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Add New Image</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Image URL (use UploadCare or external URL)
            </label>
            <input
              type="text"
              value={newImage.image_url}
              onChange={(e) => setNewImage({ ...newImage, image_url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://ucarecdn.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alt Text (required for accessibility)
            </label>
            <input
              type="text"
              value={newImage.alt_text}
              onChange={(e) => setNewImage({ ...newImage, alt_text: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description of the image"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Caption (optional)
            </label>
            <input
              type="text"
              value={newImage.caption}
              onChange={(e) => setNewImage({ ...newImage, caption: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional caption"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is-active"
              checked={newImage.is_active}
              onChange={(e) => setNewImage({ ...newImage, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is-active" className="ml-2 text-sm text-gray-300">
              Active (display on website)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newImage.image_url || !newImage.alt_text}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewImage({
                  image_url: '',
                  caption: '',
                  alt_text: '',
                  is_active: true,
                  sort_order: 0
                });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image, index) => (
          <div key={image.id} className="bg-gray-800 rounded-lg overflow-hidden">
            {editingImage?.id === image.id ? (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={editingImage.image_url}
                    onChange={(e) => setEditingImage({ ...editingImage, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={editingImage.alt_text}
                    onChange={(e) => setEditingImage({ ...editingImage, alt_text: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Caption
                  </label>
                  <input
                    type="text"
                    value={editingImage.caption || ''}
                    onChange={(e) => setEditingImage({ ...editingImage, caption: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`edit-active-${image.id}`}
                    checked={editingImage.is_active}
                    onChange={(e) => setEditingImage({ ...editingImage, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`edit-active-${image.id}`} className="ml-2 text-sm text-gray-300">
                    Active
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingImage(null)}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="aspect-video bg-gray-700 flex items-center justify-center">
                  {image.image_url ? (
                    <img
                      src={image.image_url}
                      alt={image.alt_text}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-500" />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {image.caption && (
                        <p className="text-sm font-medium text-gray-200 mb-1">{image.caption}</p>
                      )}
                      <p className="text-xs text-gray-400">{image.alt_text}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      image.is_active
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {image.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === images.length - 1}
                        className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(image)}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {images.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-400">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No images yet. Add your first coworking space image!</p>
        </div>
      )}
    </div>
  );
};

export default CoworkingImageManager;
