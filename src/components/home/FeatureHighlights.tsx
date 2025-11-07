import React, { useState, useEffect } from 'react';
import { featureHighlightService, type FeatureHighlight } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import AnimatedSection from '../AnimatedSection';

const FeatureHighlights: React.FC = () => {
  const [highlights, setHighlights] = useState<FeatureHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        console.log('Fetching feature highlights...');
        const data = await featureHighlightService.getActive();
        console.log('Feature highlights data:', data);
        
        // If no data from database, use fallback data
        if (!data || data.length === 0) {
          console.log('No data from database, using fallback highlights');
          const fallbackHighlights = [
            {
              id: 'fallback-1',
              icon: 'Home',
              title: 'Self-contained apartments',
              description: 'Your private sanctuary with everything you need, thoughtfully designed for comfort and productivity.',
              sort_order: 1,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-2',
              icon: 'Wifi',
              title: 'Utilities & fast Wi-Fi',
              description: 'All bills included with enterprise-grade internet perfect for remote work.',
              sort_order: 2,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-3',
              icon: 'Heart',
              title: 'Bi-Weekly cleaning',
              description: 'Fresh linens, spotless spaces, and restocked essentials delivered to you.',
              sort_order: 3,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-4',
              icon: 'Coffee',
              title: 'Indoor coworking',
              description: 'A dedicated workspace designed for focus, equipped with everything you need.',
              sort_order: 4,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-5',
              icon: 'Map',
              title: 'Central Funchal',
              description: 'Prime location with cafes, restaurants, and the ocean just steps away.',
              sort_order: 5,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-6',
              icon: 'Calendar',
              title: 'Flexible stays',
              description: 'From one month to one year - stay as long as your journey requires.',
              sort_order: 6,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];
          setHighlights(fallbackHighlights);
        } else {
          setHighlights(data);
        }
      } catch (err) {
        console.error('Error fetching feature highlights:', err);
        // Use fallback data on error
        console.log('Error occurred, using fallback highlights');
        const fallbackHighlights = [
          {
            id: 'fallback-1',
            icon: 'Home',
            title: 'Self-contained apartments',
            description: 'Your private sanctuary with everything you need, thoughtfully designed for comfort and productivity.',
            sort_order: 1,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'fallback-2',
            icon: 'Wifi',
            title: 'Utilities & fast Wi-Fi',
            description: 'All bills included with enterprise-grade internet perfect for remote work.',
            sort_order: 2,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'fallback-3',
            icon: 'Heart',
            title: 'Weekly cleaning',
            description: 'Fresh linens, spotless spaces, and restocked essentials delivered weekly.',
            sort_order: 3,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'fallback-4',
            icon: 'Coffee',
            title: 'Indoor coworking',
            description: 'A dedicated workspace designed for focus, equipped with everything you need.',
            sort_order: 4,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'fallback-5',
            icon: 'Map',
            title: 'Central Funchal',
            description: 'Prime location with cafes, restaurants, and the ocean just steps away.',
            sort_order: 5,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'fallback-6',
            icon: 'Calendar',
            title: 'Flexible stays',
            description: 'From one month to one year - stay as long as your journey requires.',
            sort_order: 6,
            is_active: true,
            created_at: new Date().toISOString()
          }
        ];
        setHighlights(fallbackHighlights);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  console.log('FeatureHighlights render - loading:', loading, 'highlights:', highlights.length, 'error:', error);

  return (
    <section className="py-16 bg-[#C5C5B5]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-4">
                Thoughtfully Designed
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/70 to-[#1E1F1E] bg-clip-text text-transparent">
                  All Essentials Included
                </span>
              </h2>
            </div>
            <p className="text-lg text-[#1E1F1E]/80">
              Focus on what matters. We handle the rest.
            </p>
            {loading && (
              <p className="text-sm text-[#1E1F1E]/60 mt-4">Loading features...</p>
            )}
          </div>
        </AnimatedSection>

        {!loading && (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {highlights.map((highlight, index) => {
                const Icon = getIconComponent(highlight.icon);
                return (
                  <AnimatedSection 
                    key={highlight.id}
                    animation="fadeInUp"
                    delay={index * 150}
                    className="bg-[#1E1F1E] p-6 rounded-2xl border border-[#1E1F1E]/20 hover:border-[#C5C5B5]/20 transition-all duration-300 hover:transform hover:-translate-y-1"
                  >
                    <div className="mb-4">
                      <div className="w-10 h-10 bg-[#C5C5B5]/10 rounded-xl flex items-center justify-center mb-3">
                        <Icon className="h-5 w-5 text-[#C5C5B5]" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-[#C5C5B5]">{highlight.title}</h3>
                    <p className="text-[#C5C5B5]/80 leading-relaxed">{highlight.description}</p>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeatureHighlights;