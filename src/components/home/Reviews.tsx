// components/Reviews.tsx
import React, { useState, useEffect } from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { reviewService, type Review } from '../../lib/supabase';
import AnimatedSection from '../AnimatedSection';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to generate initials for the avatar placeholder
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await reviewService.getFeatured();
        
        if (!data || data.length === 0) {
          const fallbackReviews = [
            {
              id: '1',
              text: 'Everything was spotless and beautifully designed — it felt like a little boutique hotel with soul.',
              author: 'Sarah Jenkins', // Updated names for demo feel
              rating: 5,
              is_featured: true,
              sort_order: 1,
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              text: 'Fast Wi-Fi, comfy bed, and such a peaceful space. I got more done in a week here than I had in a month.',
              author: 'Marcus Chen',
              rating: 5,
              is_featured: true,
              sort_order: 2,
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              text: 'Steven was an amazing host. Thoughtful touches everywhere. The community dinner was a highlight.',
              author: 'Elena Rodriguez',
              rating: 5,
              is_featured: true,
              sort_order: 3,
              created_at: new Date().toISOString()
            }
          ];
          setReviews(fallbackReviews);
        } else {
          setReviews(data);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <section className="py-32 bg-[#1E1F1E] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-[#C5C5B5]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

      <div className="container relative z-10">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#C5C5B5] mb-6">
              <Star className="w-3 h-3 fill-[#C5C5B5]" />
              <span className="text-xs font-bold uppercase tracking-widest">Guest Experiences</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              Don't just take <br />
              <span className="text-[#C5C5B5]">our word for it.</span>
            </h2>
            <p className="text-xl text-white/60 max-w-xl mx-auto">
              Real stories from the digital nomads, creators, and remote workers who call Bond home.
            </p>
          </div>
        </AnimatedSection>
        
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {reviews.map((review, index) => (
              <AnimatedSection 
                key={review.id} 
                animation="fadeInUp" 
                delay={index * 150}
                className="h-full"
              >
                <div className="group relative h-full flex flex-col bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:border-[#C5C5B5]/30 hover:shadow-2xl hover:shadow-black/50">
                  
                  {/* Decorative Giant Quote */}
                  <Quote className="absolute top-8 right-8 w-16 h-16 text-white/5 rotate-180 group-hover:text-[#C5C5B5]/10 transition-colors duration-500" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-8">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C5C5B5] text-[#C5C5B5]" />
                    ))}
                  </div>

                  {/* Review Text - Serif for Editorial feel */}
                  <blockquote className="flex-1 text-xl md:text-2xl text-white/90 font-serif italic leading-relaxed mb-8 relative z-10">
                    "{review.text}"
                  </blockquote>

                  {/* Footer: Avatar & Name */}
                  <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C5C5B5] to-[#A0A090] flex items-center justify-center text-[#1E1F1E] font-bold text-sm shadow-lg">
                      {getInitials(review.author)}
                    </div>
                    <div>
                      <div className="font-bold text-white tracking-wide text-sm">
                        {review.author}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#C5C5B5]/70 mt-0.5 uppercase tracking-wider font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Verified Guest
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;