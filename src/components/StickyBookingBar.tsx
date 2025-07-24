import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import BookingBar from './BookingBar';

const StickyBookingBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // Get the hero section height (approximately viewport height)
      const heroHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      
      // Show sticky bar when user scrolls past the hero section
      setIsVisible(scrollPosition > heroHeight - 100);
    };

    const handleOpenBookingModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('openBookingModal', handleOpenBookingModal);
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('openBookingModal', handleOpenBookingModal);
    };
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Don't show booking bar on application page
  if (location.pathname === '/apply') {
    return null;
  }

  // Don't show anything if not visible
  if (!isVisible) return null;

  return (
    <>
      {/* Desktop: Show full booking bar */}
      <div className="hidden lg:block fixed top-20 left-0 right-0 z-40 bg-[#1E1F1E]/95 backdrop-blur-sm border-b border-[#C5C5B5]/20 shadow-lg">
        <div className="container py-2">
          <BookingBar isSticky={true} />
        </div>
      </div>
      
      {/* Mobile/Tablet: Show "Find your place" button */}
      <div className="lg:hidden fixed top-20 left-0 right-0 z-40 bg-[#1E1F1E]/95 backdrop-blur-sm border-b border-[#C5C5B5]/20 shadow-lg">
        <div className="container py-3">
          <button
            onClick={openModal}
            className="w-full bg-[#C5C5B5]/10 hover:bg-[#C5C5B5]/20 text-[#C5C5B5] px-6 py-4 rounded-2xl transition-all duration-300 border border-[#C5C5B5]/20 hover:border-[#C5C5B5]/40 text-left"
          >
            <span className="text-lg font-medium">Find your place</span>
            <span className="block text-sm text-[#C5C5B5]/60 mt-1">Search available apartments</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-[#1E1F1E] rounded-3xl border border-[#C5C5B5]/20 shadow-2xl max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#C5C5B5]/20">
              <h2 className="text-2xl font-bold text-[#C5C5B5]">Find Your Place</h2>
              <button
                onClick={closeModal}
                className="p-2 text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <BookingBar onSearch={closeModal} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StickyBookingBar;