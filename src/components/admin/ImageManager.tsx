import React, { useState, useEffect, useRef } from 'react';
import { X, Star, Trash2, GripVertical, Save, Upload, Loader2 } from 'lucide-react';
import { apartmentService, storageService, type ApartmentImage } from '../../lib/supabase';

interface ImageManagerProps {
  apartmentId: string;
  onClose: () => void;
}

const ImageManager: React.FC<ImageManagerProps> = ({ apartmentId, onClose }) => {
  const [images, setImages] = useState<ApartmentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleUploadFiles(Array.from(files));
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      await handleUploadFiles(files);
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    let completed = 0;
    const totalFiles = files.length;

    for (const file of files) {
      try {
        const result = await storageService.uploadImage(file, 'apartments');

        await apartmentService.addImage({
          apartment_id: apartmentId,
          image_url: result.url,
          is_featured: images.length === 0 && completed === 0,
          sort_order: images.length + completed
        });

        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    await fetchImages();
    setIsUploading(false);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove the dragged item
    newImages.splice(draggedIndex, 1);
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    // Update sort_order for all images
    const updatedImages = newImages.map((image, index) => ({
      ...image,
      sort_order: index
    }));
    
    setImages(updatedImages);
    setHasChanges(true);
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      // Update sort order for all images
      await Promise.all(
        images.map((image, index) =>
          apartmentService.updateImage(image.id, { sort_order: index })
        )
      );
      
      setHasChanges(false);
      await fetchImages(); // Refresh to confirm changes
    } catch (error) {
      console.error('Error saving image order:', error);
      alert('Failed to save image order');
    } finally {
      setIsSaving(false);
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

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const path = storageService.getPathFromUrl(imageUrl);
      if (path) {
        await storageService.deleteImage(path);
      }

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
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Manage Images</h2>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Order'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
          onDrop={handleFileDrop}
          className={`
            mb-6 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all
            ${isDraggingFile ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'}
          `}
        >
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-3" />
                <span className="text-sm text-gray-300">Uploading... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <span className="text-sm text-gray-300 font-medium mb-1">
                  Drop images here or click to upload
                </span>
                <span className="text-xs text-gray-500">JPG, PNG, WebP or GIF (max 5MB each)</span>
              </>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Images grid */}
        {images.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No images yet</h3>
            <p className="text-gray-300">Add your first image using the form above.</p>
          </div>
        ) : (
          <>
            {hasChanges && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-blue-700">
                    <GripVertical className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Image order has been changed</span>
                  </div>
                  <button
                    onClick={handleSaveOrder}
                    disabled={isSaving}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-300">
                <strong>Tip:</strong> Drag and drop images to reorder them. The first image will be used as the featured image on the website.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative group rounded-lg overflow-hidden border-2 cursor-move transition-all ${
                    image.is_featured ? 'border-yellow-400' : 'border-gray-600'
                  } ${draggedIndex === index ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
                >
                  <div className="aspect-video">
                    <img
                      src={image.image_url}
                      alt="Apartment"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                  
                  {/* Order indicator */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                    #{index + 1}
                  </div>
                  
                  {/* Featured badge */}
                  {image.is_featured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
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
                      onClick={() => handleDeleteImage(image.id, image.image_url)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drag handle */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white bg-opacity-90 p-1 rounded cursor-move">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {images.length > 0 && (
              <span>Drag and drop to reorder • First image is featured</span>
            )}
          </div>
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

export default ImageManager;