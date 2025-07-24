import React, { useState, useEffect } from 'react';
import BookingBar from './BookingBar';

const StickyBookingBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Get the hero section height (approximately viewport height)
      const heroHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      
      // Show sticky bar when user scrolls past the hero section
      setIsVisible(scrollPosition > heroHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-[#1E1F1E]/95 backdrop-blur-sm border-b border-[#C5C5B5]/20 shadow-lg">
      <div className="container py-2">
        <BookingBar isSticky={true} />
      </div>
    </div>
  );
};

export default StickyBookingBar;