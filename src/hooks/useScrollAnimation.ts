import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.05, // Reduced threshold for earlier triggering
    rootMargin = '0px', // Removed negative margin to trigger sooner
    triggerOnce = true
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if element is already in viewport on mount
    const rect = element.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isInViewport) {
      setIsVisible(true);
      if (triggerOnce) return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, isVisible };
};

export const useStaggeredAnimation = (itemCount: number, delay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: '0px' // Removed negative margin
  });
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (isVisible && !hasTriggered && itemCount > 0) {
      setHasTriggered(true);
      const timeouts: NodeJS.Timeout[] = [];
      
      for (let i = 0; i < itemCount; i++) {
        const timeout = setTimeout(() => {
          setVisibleItems(prev => [...prev, i]);
        }, i * delay);
        timeouts.push(timeout);
      }

      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
  }, [isVisible, itemCount, delay, hasTriggered]);

  return { elementRef, visibleItems };
};