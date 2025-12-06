import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PromotionBannerData {
  id: string;
  message: string;
  background_color: string;
  text_color: string;
  link_url: string | null;
  link_text: string | null;
}

const PromotionBanner: React.FC = () => {
  const [banners, setBanners] = useState<PromotionBannerData[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBanners();
    loadDismissedBanners();
  }, []);

  const loadDismissedBanners = () => {
    const dismissed = localStorage.getItem('dismissedBanners');
    if (dismissed) {
      try {
        const parsed = JSON.parse(dismissed);
        setDismissedBanners(new Set(parsed));
      } catch (e) {
        console.error('Error loading dismissed banners:', e);
      }
    }
  };

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_banners')
        .select('id, message, background_color, text_color, link_url, link_text')
        .eq('is_active', true)
        .or('start_date.is.null,start_date.lte.' + new Date().toISOString())
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching promotion banners:', error);
    }
  };

  const dismissBanner = (bannerId: string) => {
    const newDismissed = new Set(dismissedBanners);
    newDismissed.add(bannerId);
    setDismissedBanners(newDismissed);

    localStorage.setItem('dismissedBanners', JSON.stringify(Array.from(newDismissed)));
  };

  const activeBanners = banners.filter((banner) => !dismissedBanners.has(banner.id));

  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <div className="promotion-banners">
      {activeBanners.map((banner) => (
        <div
          key={banner.id}
          className="relative py-3 px-4 text-center"
          style={{
            backgroundColor: banner.background_color,
            color: banner.text_color,
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            <p className="text-sm font-medium flex-1">
              {banner.message}
              {banner.link_url && banner.link_text && (
                <>
                  {' '}
                  <a
                    href={banner.link_url}
                    className="font-semibold underline hover:opacity-80 transition-opacity"
                    style={{ color: banner.text_color }}
                  >
                    {banner.link_text} →
                  </a>
                </>
              )}
            </p>
            <button
              onClick={() => dismissBanner(banner.id)}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PromotionBanner;
