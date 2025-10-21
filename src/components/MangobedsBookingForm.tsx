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

      // Add CSS to force the iframe to be wider
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        #mangobeds-booking-container iframe {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, [scriptStatus, formId]);

  return (
    <div className={`relative ${className}`}>
      {scriptStatus === 'loading' && (
        <div className="flex items-center justify-center bg-transparent py-20">
          <div className="text-center text-[#C5C5B5]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5C5B5] mx-auto mb-4"></div>
            <p className="font-medium">Loading booking system...</p>
            <p className="text-sm text-[#C5C5B5]/60 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}

      {scriptStatus === 'error' && (
        <div className="flex items-center justify-center bg-transparent py-20">
          <div className="text-center text-[#C5C5B5] max-w-md mx-auto p-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#C5C5B5] mb-2">Booking System Unavailable</h3>
            <p className="text-[#C5C5B5]/80 mb-4">Unable to load the booking system. Please try opening it in a new tab or contact us directly.</p>
            <div className="space-y-3">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </a>
              <div className="text-sm text-[#C5C5B5]/60">
                <p>You can also contact us directly:</p>
                <a
                  href="mailto:hello@stayatbond.com?subject=Booking Inquiry"
                  className="text-[#C5C5B5] hover:text-white font-medium"
                >
                  hello@stayatbond.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full" id="mangobeds-booking-container"></div>
    </div>
  );
};

export default MangobedsBookingForm;
