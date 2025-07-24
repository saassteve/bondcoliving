import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging for environment variables
console.log('Supabase initialization:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Apartment {
  id: string
  slug?: string
  title: string
  description: string
  price: number
  size: string
  capacity: string
  image_url: string
  status?: 'available' | 'occupied' | 'maintenance'
  sort_order?: number
  available_from?: string
  available_until?: string
  created_at?: string
  updated_at?: string
}

export interface ApartmentFeature {
  id: string
  apartment_id?: string
  icon: string
  label: string
  sort_order?: number
}

export interface ApartmentImage {
  id: string
  apartment_id: string
  image_url: string
  is_featured?: boolean
  sort_order?: number
  created_at?: string
}

export interface Review {
  id: string
  text: string
  author: string
  rating?: number
  is_featured?: boolean
  sort_order?: number
  created_at?: string
}

export interface FeatureHighlight {
  id: string
  icon: string
  title: string
  description: string
  sort_order?: number
  is_active?: boolean
  created_at?: string
}

export interface Application {
  id: string
  name: string
  email: string
  phone?: string
  arrival_date: string
  departure_date: string
  apartment_preference?: string
  about: string
  heard_from?: string
  status?: 'pending' | 'approved' | 'declined'
  created_at?: string
  updated_at?: string
}

export interface SiteSetting {
  id: string
  key: string
  value: any
  updated_at?: string
}

export interface AdminUser {
  id: string
  email: string
  password_hash: string
  role?: 'admin' | 'super_admin'
  is_active?: boolean
  created_at?: string
  last_login?: string
}

export interface ApartmentAvailability {
  id: string
  apartment_id: string
  date: string
  status: 'available' | 'booked' | 'blocked'
  booking_reference?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ApartmentICalFeed {
  id: string
  apartment_id: string
  feed_name: string
  ical_url: string
  last_sync?: string
  is_active?: boolean
  created_at?: string
}

// Service Classes
export class ApartmentService {
  // Generate URL-friendly slug from apartment title
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  // Find apartment by slug
  static async getBySlug(slug: string): Promise<Apartment | null> {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .ilike('title', `%${slug.replace(/-/g, ' ')}%`)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  static async getAll(): Promise<Apartment[]> {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    
    // Add slugs to apartments and check availability
    const apartmentsWithSlugs = await Promise.all((data || []).map(async (apartment) => {
      // Check if apartment is actually available based on calendar
      let actualStatus = apartment.status;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const isAvailable = await availabilityService.checkAvailability(apartment.id, today, today);
        
        // If calendar shows it's not available, override status
        if (!isAvailable && apartment.status === 'available') {
          actualStatus = 'occupied';
        }
      } catch (error) {
        console.warn('Could not check availability for apartment:', apartment.id);
      }
      
      return {
        ...apartment,
        status: actualStatus,
        slug: this.generateSlug(apartment.title)
      };
    }));
    
    return apartmentsWithSlugs;
  }

  static async getById(id: string): Promise<Apartment | null> {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  static async create(apartment: Omit<Apartment, 'id' | 'created_at' | 'updated_at'>): Promise<Apartment> {
    const { data, error } = await supabase
      .from('apartments')
      .insert(apartment)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, apartment: Partial<Apartment>): Promise<Apartment> {
    // First check if the apartment exists
    const existingApartment = await this.getById(id);
    if (!existingApartment) {
      throw new Error(`Apartment with ID ${id} not found`);
    }
    
    // Add updated_at timestamp
    const updateData = {
      ...apartment,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('apartments')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()
    
    if (error) {
      console.error('Error updating apartment:', error);
      if (error.code === 'PGRST116') {
        throw new Error(`Apartment with ID ${id} not found`);
      }
      throw new Error(`Failed to update apartment: ${error.message}`);
    }
    
    if (!data) {
      throw new Error(`Apartment with ID ${id} not found`);
    }
    
    // If image_url was updated, also update the featured image in apartment_images
    if (apartment.image_url) {
      try {
        const { data: featuredImage } = await supabase
          .from('apartment_images')
          .select('id')
          .eq('apartment_id', id)
          .eq('is_featured', true)
          .single();
          
        if (featuredImage) {
          await supabase
            .from('apartment_images')
            .update({ image_url: apartment.image_url })
            .eq('id', featuredImage.id);
        }
      } catch (imageError) {
        console.warn('Could not update featured image:', imageError);
      }
    }
    
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('apartments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async getFeatures(apartmentId: string): Promise<ApartmentFeature[]> {
    const { data, error } = await supabase
      .from('apartment_features')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async addFeature(feature: Omit<ApartmentFeature, 'id'>): Promise<ApartmentFeature> {
    const { data, error } = await supabase
      .from('apartment_features')
      .insert(feature)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteFeature(id: string): Promise<void> {
    console.log('Attempting to delete feature with ID:', id);
    const { error } = await supabase
      .from('apartment_features')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting feature:', error);
      throw error;
    }
    console.log('Feature deleted successfully');
  }

  static async getImages(apartmentId: string): Promise<ApartmentImage[]> {
    const { data, error } = await supabase
      .from('apartment_images')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async addImage(image: Omit<ApartmentImage, 'id' | 'created_at'>): Promise<ApartmentImage> {
    const { data, error } = await supabase
      .from('apartment_images')
      .insert(image)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateImage(id: string, image: Partial<ApartmentImage>): Promise<ApartmentImage> {
    const { data, error } = await supabase
      .from('apartment_images')
      .update(image)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteImage(id: string): Promise<void> {
    const { error } = await supabase
      .from('apartment_images')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async setFeaturedImage(apartmentId: string, imageId: string): Promise<void> {
    // First, unset all featured images for this apartment
    await supabase
      .from('apartment_images')
      .update({ is_featured: false })
      .eq('apartment_id', apartmentId)

    // Then set the new featured image
    const { error } = await supabase
      .from('apartment_images')
      .update({ is_featured: true })
      .eq('id', imageId)
    
    if (error) throw error
  }
}

export class ApplicationService {
  static async create(application: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Application> {
    console.log('Creating application with data:', application);
    
    // Log current session info
    const { data: session } = await supabase.auth.getSession();
    console.log('Current session when creating application:', {
      user: session.session?.user?.id || 'anonymous',
      role: session.session?.user?.role || 'anon'
    });
    
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single()
    
    if (error) {
      console.error('Detailed Supabase error creating application:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
    }
    
    console.log('Application created successfully:', data);
    return data
  }

  static async getAll(): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async updateStatus(id: string, status: Application['status']): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export class ReviewService {
  static async getFeatured(): Promise<Review[]> {
    console.log('ReviewService.getFeatured() called');
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error in ReviewService.getFeatured():', error);
      throw error;
    }
    console.log('ReviewService.getFeatured() result:', data);
    return data || []
  }

  static async getAll(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async create(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, review: Partial<Review>): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update(review)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export class FeatureHighlightService {
  static async getActive(): Promise<FeatureHighlight[]> {
    console.log('FeatureHighlightService.getActive() called');
    const { data, error } = await supabase
      .from('feature_highlights')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error in FeatureHighlightService.getActive():', error);
      throw error;
    }
    console.log('FeatureHighlightService.getActive() result:', data);
    return data || []
  }

  static async getAll(): Promise<FeatureHighlight[]> {
    const { data, error } = await supabase
      .from('feature_highlights')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async create(highlight: Omit<FeatureHighlight, 'id' | 'created_at'>): Promise<FeatureHighlight> {
    const { data, error } = await supabase
      .from('feature_highlights')
      .insert(highlight)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, highlight: Partial<FeatureHighlight>): Promise<FeatureHighlight> {
    const { data, error } = await supabase
      .from('feature_highlights')
      .update(highlight)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('feature_highlights')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export class SiteSettingService {
  static async get(key: string): Promise<any> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single()
    
    if (error) throw error
    return data?.value
  }

  static async set(key: string, value: any): Promise<SiteSetting> {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key, value })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getAll(): Promise<SiteSetting[]> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
    
    if (error) throw error
    return data || []
  }
}

// Convenience exports
export const apartmentService = ApartmentService
export const applicationService = ApplicationService
export const reviewService = ReviewService
export const featureHighlightService = FeatureHighlightService
export const siteSettingService = SiteSettingService