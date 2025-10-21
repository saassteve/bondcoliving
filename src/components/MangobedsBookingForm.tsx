import React, { useEffect, useRef } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { useExternalScript } from '../hooks/useExternalScript';

interface MangobedsBookingFormProps {
  formId?: string;
  className?: string;
}

const MangobedsBookingForm: React.FC<MangobedsBookingFormProps> = ({
  formId = 'cmeud47d50005uqf7idelfqhq',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptStatus = useExternalScript('https://mangobeds.com/js/widget/booking-form.js', {
    async: true,
    attributes: {
      'data-form-id': formId
    }
  });

  const bookingUrl = `https://www.mangobeds.com/booking-forms/${formId}`;

  useEffect(() => {
    if (scriptStatus === 'ready' && containerRef.current) {
      const existingScript = containerRef.current.querySelector('script[data-form-id]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-form-id', formId);
        script.src = 'https://mangobeds.com/js/widget/booking-form.js';
        containerRef.current.appendChild(script);
      }
    }
  }, [scriptStatus, formId]);

  return (
    <div className={`relative min-h-[600px] bg-white rounded-2xl overflow-hidden ${className}`}>
      {scriptStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="font-medium">Loading booking system...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}

      {scriptStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center text-gray-600 max-w-md mx-auto p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking System Unavailable</h3>
            <p className="text-gray-600 mb-4">Unable to load the booking system. Please try opening it in a new tab or contact us directly.</p>
            <div className="space-y-3">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </a>
              <div className="text-sm text-gray-500">
                <p>You can also contact us directly:</p>
                <a
                  href="mailto:hello@stayatbond.com?subject=Booking Inquiry"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  hello@stayatbond.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full min-h-[600px]" id="mangobeds-booking-container"></div>
    </div>
  );
};

export default MangobedsBookingForm;
