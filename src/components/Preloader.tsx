import React, { useEffect, useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

const phrases = [
  "Connecting to Funchal...",
  "Preparing your space...",
  "Curating community...",
  "Checking ocean view...",
  "Welcome to Bond."
];

// 1. Define critical assets here to ensure they are loaded before the curtain lifts
const CRITICAL_IMAGES = [
  "https://ucarecdn.com/958a4400-0486-4ba2-8e75-484d692d7df9/foundersbond.png", // Hero Image
  "https://ucarecdn.com/8a70b6b2-1930-403f-b333-8234cda9ac93/BondTextOnly.png"  // Logo
];

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Use refs to track state inside intervals without dependencies
  const progressRef = useRef(0);
  const imagesLoadedRef = useRef(false);

  useEffect(() => {
    // 2. Preload Images Logic
    let loadedCount = 0;
    
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === CRITICAL_IMAGES.length) {
        setImagesLoaded(true);
        imagesLoadedRef.current = true;
      }
    };

    CRITICAL_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = checkAllLoaded;
      img.onerror = checkAllLoaded; // Proceed even if one fails (fallback)
    });

    // Fallback: If images take too long (e.g. 5s), force proceed
    const safetyTimer = setTimeout(() => {
      if (!imagesLoadedRef.current) {
        setImagesLoaded(true);
        imagesLoadedRef.current = true;
      }
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    // Cycle through phrases
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 450);

    // 3. Smart Progress Logic
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const current = oldProgress;
        let next = current;

        // Phase 1: Fast load up to 30%
        if (current < 30) {
          next = current + Math.random() * 2 + 1; 
        } 
        // Phase 2: Moderate load up to 85%
        else if (current < 85) {
          next = current + Math.random() * 0.5;
        } 
        // Phase 3: The Wait - STALL at 85% until images are real-loaded
        else if (current >= 85 && current < 99 && !imagesLoadedRef.current) {
           // Increment extremely slowly or stop to wait for images
           next = current + (Math.random() < 0.1 ? 0.1 : 0); 
        }
        // Phase 4: Completion - If images loaded, zip to 100%
        else if (imagesLoadedRef.current) {
          next = current + 2; // Fast finish
        }

        // Clamp to 100
        if (next >= 100) {
          next = 100;
          clearInterval(timer);
          clearInterval(phraseInterval);
        }
        
        progressRef.current = next;
        return next;
      });
    }, 20); // Run faster tick for smoother animation

    return () => {
      clearInterval(timer);
      clearInterval(phraseInterval);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(onComplete, 800); 
      }, 200);
    }
  }, [progress, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1E1F1E] text-[#C5C5B5] transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* Large Counter */}
      <div className="relative">
        <div className="text-[15vw] md:text-[12rem] font-bold leading-none tracking-tighter opacity-90 tabular-nums">
          {Math.floor(progress)}
          <span className="text-[4vw] md:text-[4rem] absolute top-2 -right-6 md:-right-12 opacity-50">%</span>
        </div>
      </div>

      {/* Dynamic Text & Logo */}
      <div className="absolute bottom-12 left-0 w-full px-8 md:px-12 flex justify-between items-end">
        
        {/* Left: Dynamic Phrase */}
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
             <div className={`w-2 h-2 bg-[#C5C5B5] rounded-full ${progress < 100 ? 'animate-ping' : ''}`} />
             <span className="text-sm uppercase tracking-widest font-medium opacity-80 w-64 truncate">
               {progress === 100 ? "Ready" : phrases[phraseIndex]}
             </span>
           </div>
        </div>

        {/* Right: Brand Signature */}
        <div className="hidden md:flex items-center gap-2 opacity-50">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Est. 2025</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <div 
          className="h-full bg-[#C5C5B5] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] pointer-events-none"></div>
    </div>
  );
};

export default Preloader;