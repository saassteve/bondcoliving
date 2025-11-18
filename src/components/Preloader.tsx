// components/Preloader.tsx
import React, { useEffect, useState } from 'react';
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

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setDimension({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    // Cycle through phrases
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 450);

    // Progress Logic
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          clearInterval(phraseInterval);
          return 100;
        }
        
        // Logarithmic random increment: slows down as it gets closer to 100
        const diff = 100 - oldProgress;
        const inc = Math.random() * (diff / 5) + 1;
        
        return Math.min(oldProgress + inc, 100);
      });
    }, 100);

    return () => {
      clearInterval(timer);
      clearInterval(phraseInterval);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      // Start exit animation sequence
      setTimeout(() => {
        setIsExiting(true);
        // Notify parent after animation finishes
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
             <div className="w-2 h-2 bg-[#C5C5B5] rounded-full animate-ping" />
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

      {/* Progress Bar (Minimal bottom line) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <div 
          className="h-full bg-[#C5C5B5] transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] pointer-events-none"></div>
    </div>
  );
};

export default Preloader;