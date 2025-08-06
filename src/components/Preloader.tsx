import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => {
            onComplete();
          }, 300); // Small delay for smooth transition
          return 100;
        }
        return prev + Math.random() * 15 + 5; // Random increment between 5-20
      });
    }, 100);

    // Ensure minimum loading time of 1.5 seconds
    const minLoadTime = setTimeout(() => {
      if (progress < 100) {
        setProgress(100);
      }
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(minLoadTime);
    };
  }, [onComplete, progress]);

  return (
    <div className={`fixed inset-0 z-50 bg-[#1E1F1E] flex items-center justify-center transition-opacity duration-300 ${
      isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="https://ucarecdn.com/8a70b6b2-1930-403f-b333-8234cda9ac93/BondTextOnly.png" 
            alt="Bond" 
            className="h-16 w-auto mx-auto animate-pulse"
          />
        </div>
        
        {/* Loading bar */}
        <div className="w-64 h-1 bg-[#C5C5B5]/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#C5C5B5] to-white rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        {/* Loading text */}
        <p className="mt-6 text-[#C5C5B5]/60 text-sm uppercase tracking-wide">
          Loading your space...
        </p>
      </div>
    </div>
  );
};

export default Preloader;