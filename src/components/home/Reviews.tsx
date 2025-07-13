import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { reviewService, type Review } from '../../lib/supabase';
import AnimatedSection from '../AnimatedSection';
import { useStaggeredAnimation } from '../../hooks/useScrollAnimation';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize staggered animation after reviews are loaded
  const { elementRef: reviewsRef, visibleItems } = useStaggeredAnimation(
    reviews.length || 3, 
    200
  );

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        console.log('Fetching reviews...');
        const data = await reviewService.getFeatured();
        console.log('Reviews data:', data);
        
        // If no data from database, use fallback data
        if (!data || data.length === 0) {
          console.log('No data from database, using fallback reviews');
          const fallbackReviews = [
            {
              id: 'fallback-1',
              text: 'Everything was spotless and beautifully designed — it felt like a boutique hotel with soul.',
              author: 'Short-Term Rental Guest',
              rating: 5,
              is_featured: true,
              sort_order: 1,
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-2',
              text: 'Fast Wi-Fi, comfy bed, and such a peaceful space. I got more done in a week here than I had in a month.',
              author: 'Short-Term Rental Guest',
              rating: 5,
              is_featured: true,
              sort_order: 2,
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-3',
              text: 'Steven was an amazing host. Thoughtful touches everywhere.',
              author: 'Short-Term Rental Guest',
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
        // Use fallback data on error
        console.log('Error occurred, using fallback reviews');
        const fallbackReviews = [
          {
            id: 'fallback-1',
            text: 'Everything was spotless and beautifully designed — it felt like a boutique hotel with soul.',
            author: 'Short-Term Rental Guest',
            rating: 5,
            is_featured: true,
            sort_order: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 'fallback-2',
            text: 'Fast Wi-Fi, comfy bed, and such a peaceful space. I got more done in a week here than I had in a month.',
            author: 'Short-Term Rental Guest',
            rating: 5,
            is_featured: true,
            sort_order: 2,
            created_at: new Date().toISOString()
          },
          {
            id: 'fallback-3',
            text: 'Steven was an amazing host. Thoughtful touches everywhere.',
            author: 'Short-Term Rental Guest',
            rating: 5,
            is_featured: true,
            sort_order: 3,
            created_at: new Date().toISOString()
          }
        ];
        setReviews(fallbackReviews);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  console.log('Reviews render - loading:', loading, 'reviews:', reviews.length, 'error:', error);

  return (
    <section className="py-24 bg-[#1E1F1E]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium mb-4">
                Guest Experiences
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  What Our Guests Say
                </span>
              </h2>
            </div>
            <p className="text-xl text-[#C5C5B5]/80">
              Real experiences from people who've made our spaces their home.
            </p>
            {loading && (
              <p className="text-sm text-[#C5C5B5]/60 mt-4">Loading reviews...</p>
            )}
          </div>
        </AnimatedSection>
        
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {reviews.map((review, index) => (
              <div 
                key={review.id} 
                className="bg-[#C5C5B5]/5 backdrop-blur-sm rounded-2xl p-8 border border-[#C5C5B5]/10 transition-all duration-300 hover:transform hover:-translate-y-1 hover:bg-[#C5C5B5]/10 hover:border-[#C5C5B5]/20"
              >
                <div className="flex text-[#C5C5B5] mb-6 justify-center md:justify-start">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg md:text-xl leading-relaxed mb-6 text-[#C5C5B5] italic">
                  "{review.text}"
                </blockquote>
                <footer className="text-center md:text-left">
                  <cite className="text-sm text-[#C5C5B5]/50 not-italic font-medium">
                    — {review.author}
                  </cite>
                </footer>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;