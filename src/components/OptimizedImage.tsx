import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  draggable?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  draggable = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
  };

  const getOptimizedUrl = (url: string): string => {
    if (!url) return '';

    if (url.includes('supabase')) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('width', width?.toString() || '800');
      urlObj.searchParams.set('quality', '80');
      return urlObj.toString();
    }

    if (url.includes('pexels.com')) {
      return url
        .replace('?auto=compress', '?auto=compress&fm=webp')
        .replace(/&w=\d+/, `&w=${width || 1200}`)
        .replace(/&h=\d+/, `&h=${height || 800}`);
    }

    return url;
  };

  const optimizedSrc = getOptimizedUrl(src);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden w-full h-full ${className}`}
    >
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent animate-shimmer" />
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white/50">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        isInView && (
          <img
            src={optimizedSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            draggable={draggable}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            style={{
              objectFit,
              objectPosition,
              width: '100%',
              height: '100%',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
            className={isLoaded ? 'loaded' : ''}
          />
        )
      )}
    </div>
  );
};

export default OptimizedImage;
