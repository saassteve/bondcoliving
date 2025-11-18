// components/FeatureHighlights.tsx
import React, { useState, useEffect } from 'react';
import { featureHighlightService, type FeatureHighlight } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import AnimatedSection from '../AnimatedSection';

const FeatureHighlights: React.FC = () => {
  const [highlights, setHighlights] = useState<FeatureHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const data = await featureHighlightService.getActive();
        
        if (!data || data.length === 0) {
          // Fallback data
          const fallbackHighlights = [
            { id: '1', icon: 'Home', title: 'Self-contained apartments', description: 'Your private sanctuary with everything you need, thoughtfully designed for comfort and productivity.', sort_order: 1, is_active: true, created_at: '' },
            { id: '2', icon: 'Wifi', title: 'Utilities & fast Wi-Fi', description: 'All bills included with enterprise-grade internet perfect for remote work.', sort_order: 2, is_active: true, created_at: '' },
            { id: '3', icon: 'Sparkles', title: 'Bi-Weekly cleaning', description: 'Fresh linens, spotless spaces, and restocked essentials delivered to you.', sort_order: 3, is_active: true, created_at: '' },
            { id: '4', icon: 'Coffee', title: 'Indoor coworking', description: 'A dedicated workspace designed for focus, equipped with everything you need.', sort_order: 4, is_active: true, created_at: '' },
            { id: '5', icon: 'MapPin', title: 'Central Funchal', description: 'Prime location with cafes, restaurants, and the ocean just steps away.', sort_order: 5, is_active: true, created_at: '' },
            { id: '6', icon: 'Calendar', title: 'Flexible stays', description: 'From one month to one year - stay as long as your journey requires.', sort_order: 6, is_active: true, created_at: '' }
          ];
          setHighlights(fallbackHighlights);
        } else {
          setHighlights(data);
        }
      } catch (err) {
        console.error('Error fetching feature highlights:', err);
        // Keep existing fallback logic if needed, or handle error UI
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  return (
    <section className="py-24 bg-[#1E1F1E] relative overflow-hidden">
      {/* Ambient Glow (optional visual flair) */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#C5C5B5]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container relative z-10">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-6">
              <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.2em] text-[#C5C5B5]/80 font-medium mb-4 backdrop-blur-sm">
                Thoughtfully Designed
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                All Essentials Included
              </h2>
            </div>
            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Focus on what matters. We handle the rest.
            </p>
          </div>
        </AnimatedSection>

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {highlights.map((highlight, index) => {
              const Icon = getIconComponent(highlight.icon);
              return (
                <AnimatedSection 
                  key={highlight.id} 
                  animation="fadeInUp" 
                  delay={index * 100}
                  className="h-full"
                >
                  <div className="group h-full p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#C5C5B5]/30 transition-all duration-500 backdrop-blur-sm">
                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-[#C5C5B5]/10 text-[#C5C5B5] group-hover:bg-[#C5C5B5] group-hover:text-[#1E1F1E] transition-colors duration-500">
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#C5C5B5] transition-colors duration-300">
                      {highlight.title}
                    </h3>
                    
                    <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                      {highlight.description}
                    </p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeatureHighlights;