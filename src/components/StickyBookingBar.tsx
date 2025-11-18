import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Search } from 'lucide-react';
import BookingBar from './BookingBar';

const StickyBookingBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when user scrolls past the hero section (approx 80vh)
      const heroHeight = window.innerHeight * 0.8;
      const scrollPosition = window.scrollY;
      
      setIsVisible(scrollPosition > heroHeight);
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

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  // Don't show booking bar on application page or specific room pages
  if (location.pathname === '/apply' || location.pathname.startsWith('/room/')) {
    return null;
  }

  return (
    <>
      {/* DESKTOP: Floating Glass Island 
        Positioned just below the top nav (top-24)
      */}
      <div 
        className={`hidden lg:block fixed top-28 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#1E1F1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 ring-1 ring-black/5">
          <BookingBar isSticky={true} />
        </div>
      </div>
      
      {/* MOBILE: Floating Trigger Button
        Appears at the bottom right or top. Kept at top to not interfere with content interaction.
      */}
      <div 
        className={`lg:hidden fixed top-24 left-4 right-4 z-30 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={openModal}
          className="w-full bg-[#1E1F1E]/90 backdrop-blur-xl border border-white/10 text-white p-3 px-4 rounded-2xl shadow-2xl flex items-center justify-between group active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C5C5B5] flex items-center justify-center text-[#1E1F1E] shadow-lg">
              <Search className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-white">Find your space</span>
              <span className="block text-xs text-white/50">Check dates & availability</span>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-bold text-[#C5C5B5] uppercase tracking-wider group-hover:bg-[#C5C5B5] group-hover:text-[#1E1F1E] transition-colors">
            Search
          </div>
        </button>
      </div>

      {/* MOBILE DRAWER: Bottom Sheet 
        Slides up from bottom for better mobile ergonomics
      */}
      <div 
        className={`fixed inset-0 z-[60] lg:hidden transition-all duration-300 ${
          isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
          onClick={closeModal}
        />
        
        {/* Drawer Content */}
        <div 
          className={`absolute inset-x-0 bottom-0 bg-[#1E1F1E] border-t border-white/10 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isModalOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Handle bar for visual affordance */}
          <div className="w-full flex justify-center pt-3 pb-1" onClick={closeModal}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Find Your Place</h2>
            <button
              onClick={closeModal}
              className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 pb-10">
            <BookingBar onSearch={closeModal} />
          </div>
        </div>
      </div>
    </>
  );
};

export default StickyBookingBar;