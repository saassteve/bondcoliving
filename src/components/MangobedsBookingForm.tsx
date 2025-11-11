import React, { useEffect, useRef } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface MangobedsBookingFormProps {
  formId?: string;
  className?: string;
  minHeightPx?: number; // default 900
}

const MangobedsBookingForm: React.FC<MangobedsBookingFormProps> = ({
  formId = 'cmeud47d50005uqf7idelfqhq',
  className = '',
  minHeightPx = 900
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const bookingUrl = `https://www.mangobeds.com/booking-forms/${formId}`;

  useEffect(() => {
    if (!containerRef.current) return;

    // 1) Clean container and inject ONE script instance
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mangobeds.com/js/widget/booking-form.js';
    script.setAttribute('data-form-id', formId);
    containerRef.current.appendChild(script);

    // 2) Add override styles so the embed can expand
    const styleEl = document.createElement('style');
    styleEl.id = 'mangobeds-embed-overrides';
    styleEl.textContent = `
      #mangobeds-booking-container,
      #mangobeds-booking-container > * {
        display: block !important;
        width: 100% !important;
        overflow: visible !important;
      }
      #mangobeds-booking-container iframe {
        width: 100% !important;
        min-height: ${minHeightPx}px !important;
        border: 0 !important;
        display: block !important;
      }
    `;
    document.head.appendChild(styleEl);

    // 3) Find the injected iframe and keep a ref to it
    const findIframe = () => {
      if (!containerRef.current) return;
      const iframe = containerRef.current.querySelector('iframe[src*="mangobeds"]') as HTMLIFrameElement | null;
      if (iframe) {
        iframeRef.current = iframe;
        // Ensure it never renders at 0 height
        if (!iframe.style.height) iframe.style.height = `${minHeightPx}px`;
      } else {
        // Try again on the next frame until the script inserts it
        requestAnimationFrame(findIframe);
      }
    };
    findIframe();

    // 4) Listen for postMessage height events from the provider (defensive parsing)
    const onMessage = (e: MessageEvent) => {
      const origin = (e.origin || '').toLowerCase();
      if (!origin.includes('mangobeds.com')) return;

      let incomingHeight: number | null = null;

      if (typeof e.data === 'number') {
        incomingHeight = e.data;
      } else if (typeof e.data === 'string') {
        const m = e.data.match(/(?:height|resize)[:= ]+(\d{2,5})/i);
        if (m) incomingHeight = Number(m[1]);
      } else if (e.data && typeof e.data === 'object') {
        // Common patterns: { height: 1234 }, { h: 1234 }, { type: 'resize', height: 1234 }
        if (typeof e.data.height === 'number') incomingHeight = e.data.height;
        else if (typeof (e.data as any).h === 'number') incomingHeight = (e.data as any).h;
        else if ((e.data as any).type && /resize/i.test((e.data as any).type) && typeof (e.data as any).value === 'number') {
          incomingHeight = (e.data as any).value;
        }
      }

      if (incomingHeight && iframeRef.current) {
        const clamped = Math.max(incomingHeight, minHeightPx);
        iframeRef.current.style.height = `${clamped}px`;
      }
    };
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
      styleEl.remove();
      if (containerRef.current) containerRef.current.innerHTML = '';
      iframeRef.current = null;
    };
  }, [formId, minHeightPx]);

  // Simple loading and error fallbacks are optional here. Keep if you want.
  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        id="mangobeds-booking-container"
        className="w-full overflow-visible"
        aria-live="polite"
      />
      {/* Fallback “open in new tab” helper if the JS failed for any reason */}
      <noscript>
        <div className="mt-6 text-center">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open booking in a new tab
          </a>
        </div>
      </noscript>
    </div>
  );
};

export default MangobedsBookingForm;