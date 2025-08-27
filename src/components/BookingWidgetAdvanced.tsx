import React, { useState } from 'react';
import { RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

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

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Unable to load booking system. Please try opening it in a new tab or contact us directly.');
  };

  const bookingUrl = `https://www.mangobeds.com/booking-forms/${formId}`;

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
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </a>
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

      {/* Mangobeds Booking Form iframe */}
      <iframe
        src={bookingUrl}
        className="w-full h-full min-h-[600px] border-0"
        title="Bond Coliving Booking Form"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="payment; geolocation"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
      />
    </div>
  );
};

export default BookingWidgetAdvanced;