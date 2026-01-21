import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { storageService, type ImageFolder } from '../../lib/services';

interface ImageUploaderProps {
  folder: ImageFolder;
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  label?: string;
  hint?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  folder,
  currentImageUrl,
  onUploadComplete,
  onRemove,
  className = '',
  label = 'Upload Image',
  hint = 'JPG, PNG, WebP or GIF (max 5MB)',
  aspectRatio = 'video'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentImageUrl;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [folder]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const result = await storageService.uploadImage(file, folder);

      // Validate the resulting URL
      const validation = storageService.validateImageUrl(result.url);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image URL');
      }

      onUploadComplete(result.url);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentImageUrl) return;

    // Only attempt to delete from storage if it's a Supabase storage URL
    if (storageService.isSupabaseUrl(currentImageUrl)) {
      const path = storageService.getPathFromUrl(currentImageUrl);
      if (path) {
        try {
          await storageService.deleteImage(path);
        } catch (err) {
          console.warn('Failed to delete image from storage:', err);
        }
      }
    }

    onRemove?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    auto: ''
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div
        onClick={!displayUrl ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed transition-all overflow-hidden
          ${aspectClasses[aspectRatio]}
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'}
          ${!displayUrl ? 'cursor-pointer hover:border-gray-500 hover:bg-gray-700/50' : ''}
          ${error ? 'border-red-500' : ''}
        `}
      >
        {displayUrl ? (
          <div className="relative w-full h-full min-h-[160px]">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <span className="text-sm text-white">Uploading...</span>
                </div>
              </div>
            )}

            {!isUploading && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all group">
                <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={handleClick}
                    className="px-3 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Replace
                  </button>
                  {onRemove && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-3" />
                <span className="text-sm text-gray-400">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <span className="text-sm text-gray-300 font-medium mb-1">
                  Drop image here or click to upload
                </span>
                <span className="text-xs text-gray-500">{hint}</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;
