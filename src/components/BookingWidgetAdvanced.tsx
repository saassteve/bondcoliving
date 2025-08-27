import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface BookingWidgetAdvancedProps {
  formId?: string;
  className?: string;
}

const BookingWidgetAdvanced: React.FC<BookingWidgetAdvancedProps> = ({ 
  formId = 'cmeud47d50005uqf7idelfqhq',
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadScript = () => {
    setLoading(true);
    setError(null);

    // Clean up any existing script
    if (scriptRef.current) {
      document.body.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Create new script element
    const script = document.createElement('script');
    script.src = 'https://www.mangobeds.com/booking-widget.js';
    script.async = true;
    script.defer = true;

    // Set up event listeners
    script.onload = () => {
      console.log('Mangobeds script loaded successfully');
      
      // Give the script time to initialize
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        
        // Check if the widget was actually rendered
        if (widgetRef.current && widgetRef.current.children.length === 0) {
          console.warn('Widget container is empty after script load');
          setError('Booking widget failed to initialize');
        }
      }, 2000); // Wait 2 seconds for widget to render
    };

    script.onerror = (e) => {
      console.error('Failed to load Mangobeds script:', e);
      setLoading(false);
      setError('Failed to load booking system');
    };

    // Add script to document
    document.body.appendChild(script);
    scriptRef.current = script;

    // Fallback timeout in case onload never fires
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Script loading timeout');
        setLoading(false);
        setError('Booking system is taking too long to load');
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(fallbackTimeout);
    };
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadScript();
  };

  useEffect(() => {
    // Initial load
    const cleanup = loadScript();

    // Cleanup function
    return () => {
      if (cleanup) cleanup();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        try {
          document.body.removeChild(scriptRef.current);
        } catch (e) {
          console.warn('Script already removed:', e);
        }
      }
    };
  }, [retryCount]); // Re-run when retry count changes

  return (
    <div className={`relative min-h-[600px] bg-white rounded-2xl overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="font-medium">Loading booking system...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center text-gray-600 max-w-md mx-auto p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking System Unavailable</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              <div className="text-sm text-gray-500">
                <p>You can also contact us directly:</p>
                <a 
                  href="mailto:hello@stayatbond.com?subject=Booking Inquiry"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  hello@stayatbond.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mangobeds Widget Container */}
      <div 
        ref={widgetRef}
        id="mangobeds-booking-widget"
        data-form-id={formId}
        className="w-full h-full min-h-[600px]"
      />
    </div>
  );
};

export default BookingWidgetAdvanced;