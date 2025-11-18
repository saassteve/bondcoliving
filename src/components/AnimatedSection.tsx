import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'fadeIn' | 'scaleIn';
  delay?: number;
  duration?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 600,
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.05,
    rootMargin: '50px'
  });

  const getAnimationClasses = () => {
    const baseClasses = `transition-all ease-out`;
    
    if (!isVisible) {
      switch (animation) {
        case 'fadeInUp':
          return `${baseClasses} opacity-0 translate-y-6`;
        case 'fadeInLeft':
          return `${baseClasses} opacity-0 -translate-x-6`;
        case 'fadeInRight':
          return `${baseClasses} opacity-0 translate-x-6`;
        case 'scaleIn':
          return `${baseClasses} opacity-0 scale-95`;
        case 'fadeIn':
        default:
          return `${baseClasses} opacity-0`;
      }
    }
    
    return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;