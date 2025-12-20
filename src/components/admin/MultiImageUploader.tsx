import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle, GripVertical } from 'lucide-react';
import { storageService, type ImageFolder } from '../../lib/services';

interface MultiImageUploaderProps {
  folder: ImageFolder;
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
  label?: string;
  hint?: string;
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  folder,
  images,
  onImagesChange,
  maxImages = 20,
  className = '',
  label = 'Gallery Images',
  hint = 'JPG, PNG, WebP or GIF (max 5MB each)'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes('text/plain')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [folder, images, maxImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFiles(Array.from(files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setError(`Maximum of ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const newUrls: string[] = [];
    let completed = 0;

    for (const file of filesToUpload) {
      try {
        const result = await storageService.uploadImage(file, folder);
        newUrls.push(result.url);
        completed++;
        setUploadProgress(Math.round((completed / filesToUpload.length) * 100));
      } catch (err) {
        console.error('Failed to upload image:', err);
      }
    }

    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls]);
    }

    if (newUrls.length < filesToUpload.length) {
      setError(`${filesToUpload.length - newUrls.length} image(s) failed to upload`);
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const url = images[index];
    const path = storageService.getPathFromUrl(url);

    if (path) {
      try {
        await storageService.deleteImage(path);
      } catch (err) {
        console.error('Failed to delete image from storage:', err);
      }
    }

    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label} ({images.length}/{maxImages})
        </label>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={handleImageDragOver}
              onDrop={(e) => handleImageDrop(e, index)}
              className={`
                relative aspect-video rounded-lg overflow-hidden border-2 border-gray-600
                cursor-move group transition-all
                ${draggedIndex === index ? 'opacity-50 scale-95' : 'hover:border-gray-500'}
              `}
            >
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />

              <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-1 bg-white/90 rounded">
                    <GripVertical className="w-3 h-3 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-lg border-2 border-dashed transition-all cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'}
            ${error ? 'border-red-500' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center py-6 px-4">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                <span className="text-sm text-gray-400">Uploading... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-300 font-medium mb-1">
                  Drop images or click to upload
                </span>
                <span className="text-xs text-gray-500">{hint}</span>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {images.length > 1 && (
        <p className="mt-2 text-xs text-gray-500">
          Drag images to reorder. First image will be the main image.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MultiImageUploader;
