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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  }
})

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
    
    // No authentication required for application submission
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating application:', error);
      throw new Error(`Failed to submit application: ${error.message}`);
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

export class AvailabilityService {
  static async getCalendar(apartmentId: string, startDate: string, endDate: string): Promise<ApartmentAvailability[]> {
    const { data, error } = await supabase
      .from('apartment_availability')
      .select('*')
      .eq('apartment_id', apartmentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async setBulkAvailability(apartmentId: string, dates: string[], status: 'available' | 'booked' | 'blocked'): Promise<void> {
    const records = dates.map(date => ({
      apartment_id: apartmentId,
      date,
      status
    }))

    const { error } = await supabase
      .from('apartment_availability')
      .upsert(records, { onConflict: 'apartment_id,date' })
    
    if (error) throw error
  }

  static async checkAvailability(apartmentId: string, startDate: string, endDate: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('apartment_availability')
      .select('status')
      .eq('apartment_id', apartmentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['booked', 'blocked'])

    if (error) throw error

    const unavailableDates = data || []
    return unavailableDates.length === 0
  }

  static async getNextAvailableDate(apartmentId: string): Promise<string | null> {
    const { data, error } = await supabase
      .rpc('get_next_available_date_for_apartment', {
        p_apartment_id: apartmentId,
        p_months_ahead: 6
      })

    if (error) {
      console.error('Error getting next available date:', error)
      return null
    }

    return data
  }

  static async getAvailableApartments(startDate: string, endDate: string): Promise<string[]> {
    const { data: apartments, error: apartmentsError } = await supabase
      .from('apartments')
      .select('id')
      .eq('status', 'available')

    if (apartmentsError) throw apartmentsError

    const apartmentIds = apartments?.map(apt => apt.id) || []

    if (apartmentIds.length === 0) return []

    const availableApartmentIds: string[] = []

    for (const apartmentId of apartmentIds) {
      const isAvailable = await AvailabilityService.checkAvailability(apartmentId, startDate, endDate)
      if (isAvailable) {
        availableApartmentIds.push(apartmentId)
      }
    }

    return availableApartmentIds
  }

  static async getBookedDatesCount(apartmentId: string, startDate: string, endDate: string): Promise<number> {
    const { data, error } = await supabase
      .from('apartment_availability')
      .select('date', { count: 'exact' })
      .eq('apartment_id', apartmentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('status', 'booked')

    if (error) throw error

    return data?.length || 0
  }

  static async getBlockoutRanges(): Promise<Array<{
    id: string
    apartment_id: string
    check_in_date: string
    check_out_date: string
    source: string
    status: string
    notes?: string
  }>> {
    const { data, error } = await supabase
      .from('apartment_availability')
      .select('*')
      .in('status', ['booked', 'blocked'])
      .order('date', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) return []

    const ranges: Array<{
      id: string
      apartment_id: string
      check_in_date: string
      check_out_date: string
      source: string
      status: string
      notes?: string
    }> = []

    const groupedByApartment = data.reduce((acc, item) => {
      if (!acc[item.apartment_id]) {
        acc[item.apartment_id] = []
      }
      acc[item.apartment_id].push(item)
      return acc
    }, {} as Record<string, ApartmentAvailability[]>)

    for (const [apartmentId, blocks] of Object.entries(groupedByApartment)) {
      let currentRange: ApartmentAvailability[] = []

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const prevBlock = blocks[i - 1]

        if (!prevBlock ||
            new Date(block.date).getTime() - new Date(prevBlock.date).getTime() > 86400000 ||
            block.booking_reference !== prevBlock.booking_reference) {
          if (currentRange.length > 0) {
            ranges.push({
              id: `blockout-${currentRange[0].id}`,
              apartment_id: apartmentId,
              check_in_date: currentRange[0].date,
              check_out_date: currentRange[currentRange.length - 1].date,
              source: currentRange[0].booking_reference || 'Manual Block',
              status: currentRange[0].status,
              notes: currentRange[0].notes
            })
          }
          currentRange = [block]
        } else {
          currentRange.push(block)
        }
      }

      if (currentRange.length > 0) {
        ranges.push({
          id: `blockout-${currentRange[0].id}`,
          apartment_id: apartmentId,
          check_in_date: currentRange[0].date,
          check_out_date: currentRange[currentRange.length - 1].date,
          source: currentRange[0].booking_reference || 'Manual Block',
          status: currentRange[0].status,
          notes: currentRange[0].notes
        })
      }
    }

    return ranges
  }
}

export class ICalService {
  static async getFeeds(apartmentId: string): Promise<ApartmentICalFeed[]> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .select('*')
      .eq('apartment_id', apartmentId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async addFeed(feed: Omit<ApartmentICalFeed, 'id' | 'created_at'>): Promise<ApartmentICalFeed> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .insert(feed)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteFeed(feedId: string): Promise<{ success: boolean; message: string; availability_deleted?: number; events_deleted?: number }> {
    const { data, error } = await supabase
      .rpc('delete_ical_feed_cascade', { p_feed_id: feedId })

    if (error) {
      console.error('Error deleting feed:', error)
      throw error
    }

    return data || { success: false, message: 'Unknown error' }
  }

  static async syncFeed(feedId: string): Promise<{ success: boolean; message: string; results?: any[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-ical`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to sync iCal feed')
      }

      const result = await response.json()
      return {
        success: true,
        message: result.message || 'Sync completed successfully',
        results: result.results
      }
    } catch (error) {
      console.error('Error syncing iCal feed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync iCal feed'
      }
    }
  }

  static async syncAllFeeds(apartmentId: string): Promise<{ success: boolean; message: string; results?: any[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-ical`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apartmentId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to sync iCal feeds')
      }

      const result = await response.json()
      return {
        success: true,
        message: result.message || 'Sync completed successfully',
        results: result.results
      }
    } catch (error) {
      console.error('Error syncing iCal feeds:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync iCal feeds'
      }
    }
  }

  static async getAllFeeds(): Promise<ApartmentICalFeed[]> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async updateFeed(feedId: string, feed: Partial<ApartmentICalFeed>): Promise<ApartmentICalFeed> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .update(feed)
      .eq('id', feedId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async cleanupOrphanedAvailability(apartmentId?: string): Promise<{ success: boolean; deleted_count: number; orphaned_feeds: string[]; message: string }> {
    const { data, error } = await supabase
      .rpc('cleanup_orphaned_availability', {
        p_apartment_id: apartmentId || null
      })

    if (error) {
      console.error('Error cleaning up orphaned availability:', error)
      throw error
    }

    return data || { success: false, deleted_count: 0, orphaned_feeds: [], message: 'Unknown error' }
  }
}

// Export availability and ical services after class definitions
export const availabilityService = AvailabilityService
export const icalService = ICalService

export interface Booking {
  id: string
  apartment_id: string
  guest_name: string
  guest_email?: string
  guest_phone?: string
  check_in_date: string
  check_out_date: string
  booking_source: 'direct' | 'airbnb' | 'booking.com' | 'vrbo' | 'other'
  booking_reference?: string
  door_code?: string
  special_instructions?: string
  guest_count: number
  total_amount?: number
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  is_split_stay?: boolean
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  apartment?: {
    title: string
  }
  segments?: ApartmentBookingSegment[]
}

export interface ApartmentBookingSegment {
  id: string
  parent_booking_id: string
  apartment_id: string
  segment_order: number
  check_in_date: string
  check_out_date: string
  segment_price: number
  notes?: string
  created_at?: string
  updated_at?: string
  apartment?: Apartment
}

export interface ApartmentPayment {
  id: string
  booking_id: string
  stripe_payment_intent_id?: string
  stripe_checkout_session_id?: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'
  payment_method?: string
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface BookingSettings {
  minimum_stay_days: number
  enable_split_stays: boolean
  max_split_segments: number
  require_payment_immediately: boolean
  allow_same_day_checkout_checkin: boolean
  currency: string
}

export class BookingService {
  static async getAll(): Promise<Booking[]> {
    console.log('BookingService.getAll() - Starting fetch...');

    // Check auth status
    const { data: { session } } = await supabase.auth.getSession();
    console.log('BookingService.getAll() - Session:', session ? 'Authenticated' : 'Not authenticated');
    console.log('BookingService.getAll() - User ID:', session?.user?.id);

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        apartment:apartments(title)
      `)
      .order('check_in_date', { ascending: false })

    if (error) {
      console.error('BookingService.getAll() - Error fetching bookings:', error);
      console.error('BookingService.getAll() - Error code:', error.code);
      console.error('BookingService.getAll() - Error message:', error.message);
      console.error('BookingService.getAll() - Error details:', error.details);
      throw error;
    }

    console.log('BookingService.getAll() - Success! Fetched', data?.length || 0, 'bookings');
    return data || []
  }

  static async getById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  static async getByApartment(apartmentId: string, startDate?: string, endDate?: string): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('check_in_date', { ascending: true })
    
    if (startDate) {
      query = query.gte('check_out_date', startDate)
    }
    if (endDate) {
      query = query.lte('check_in_date', endDate)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async create(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()
    
    if (error) throw error
    
    // Update apartment availability for the booking period
    if (booking.status === 'confirmed' || booking.status === 'checked_in') {
      await this.updateAvailabilityForBooking(data.id, booking.apartment_id, booking.check_in_date, booking.check_out_date, 'booked')
    }
    
    return data
  }

  static async update(id: string, booking: Partial<Booking>): Promise<Booking> {
    // Get the existing booking to compare dates and status
    const existingBooking = await this.getById(id)
    if (!existingBooking) {
      throw new Error(`Booking with ID ${id} not found`)
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .update(booking)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Handle availability updates if dates or status changed
    const datesChanged = booking.check_in_date !== undefined || booking.check_out_date !== undefined
    const statusChanged = booking.status !== undefined && booking.status !== existingBooking.status
    
    if (datesChanged || statusChanged) {
      // Clear old availability if dates changed or status changed to cancelled
      if (datesChanged || booking.status === 'cancelled') {
        await this.updateAvailabilityForBooking(
          id, 
          existingBooking.apartment_id, 
          existingBooking.check_in_date, 
          existingBooking.check_out_date, 
          'available'
        )
      }
      
      // Set new availability if booking is active
      if (data.status === 'confirmed' || data.status === 'checked_in') {
        await this.updateAvailabilityForBooking(
          data.id, 
          data.apartment_id, 
          data.check_in_date, 
          data.check_out_date, 
          'booked'
        )
      }
    }
    
    return data
  }

  static async delete(id: string): Promise<void> {
    // Get the booking details before deletion
    const booking = await this.getById(id)
    if (!booking) {
      throw new Error(`Booking with ID ${id} not found`)
    }
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // Clear availability for the deleted booking period
    await this.updateAvailabilityForBooking(
      id, 
      booking.apartment_id, 
      booking.check_in_date, 
      booking.check_out_date, 
      'available'
    )
  }

  private static async updateAvailabilityForBooking(
    bookingId: string, 
    apartmentId: string, 
    checkInDate: string, 
    checkOutDate: string, 
    status: 'available' | 'booked'
  ): Promise<void> {
    try {
      // Generate array of dates between check-in and check-out (inclusive of check-in, exclusive of check-out)
      const dates: string[] = []
      const currentDate = new Date(checkInDate)
      const endDate = new Date(checkOutDate)
      
      while (currentDate < endDate) {
        dates.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      if (dates.length > 0) {
        await availabilityService.setBulkAvailability(apartmentId, dates, status)
      }
    } catch (error) {
      console.error('Error updating availability for booking:', error)
      // Don't throw here to avoid breaking the main booking operation
    }
  }

  static async getBookingsForMonth(year: number, month: number): Promise<Booking[]> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        apartment:apartments(title)
      `)
      .or(`and(check_in_date.lte.${endDate},check_out_date.gte.${startDate})`)
      .order('check_in_date', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async getBookingsWithAvailability(year: number, month: number): Promise<{
    bookings: Booking[];
    availability: Record<string, ApartmentAvailability[]>;
  }> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    
    // Get all bookings for the month
    const bookings = await this.getBookingsForMonth(year, month)
    
    // Get all apartments
    const apartments = await apartmentService.getAll()
    
    // Get availability data for all apartments for this month
    const availability: Record<string, ApartmentAvailability[]> = {}
    
    await Promise.all(
      apartments.map(async (apartment) => {
        try {
          const aptAvailability = await availabilityService.getCalendar(apartment.id, startDate, endDate)
          availability[apartment.id] = aptAvailability
        } catch (error) {
          console.error(`Error fetching availability for apartment ${apartment.id}:`, error)
          availability[apartment.id] = []
        }
      })
    )
    
    return { bookings, availability }
  }
}

export const bookingService = BookingService

export class ApartmentBookingService {
  static async getBookingSettings(): Promise<BookingSettings> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'apartment_booking_settings')
      .maybeSingle()

    if (error) throw error

    return data?.value || {
      minimum_stay_days: 30,
      enable_split_stays: true,
      max_split_segments: 3,
      require_payment_immediately: true,
      allow_same_day_checkout_checkin: true,
      currency: 'EUR'
    }
  }

  static async updateBookingSettings(settings: Partial<BookingSettings>): Promise<void> {
    const current = await this.getBookingSettings()
    const updated = { ...current, ...settings }

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'apartment_booking_settings',
        value: updated
      })

    if (error) throw error
  }

  static async findSplitStayOptions(
    startDate: string,
    endDate: string,
    maxSegments: number = 3
  ): Promise<Array<Array<{ apartment: Apartment; checkIn: string; checkOut: string; price: number }>>> {
    const apartments = await apartmentService.getAll()
    const activeApartments = apartments.filter(apt => apt.status === 'available')

    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const dailyRate = (monthlyPrice: number) => monthlyPrice / 30

    const splitOptions: Array<Array<{ apartment: Apartment; checkIn: string; checkOut: string; price: number }>> = []

    async function findCombinations(
      currentDate: Date,
      segments: Array<{ apartment: Apartment; checkIn: string; checkOut: string; price: number }>,
      depth: number
    ) {
      if (currentDate >= end) {
        if (segments.length > 0) {
          splitOptions.push([...segments])
        }
        return
      }

      if (depth >= maxSegments) return

      for (const apartment of activeApartments) {
        let nextUnavailableDate = new Date(end)
        let searchDate = new Date(currentDate)

        while (searchDate < end) {
          const dateStr = searchDate.toISOString().split('T')[0]
          const isAvailable = await availabilityService.checkAvailability(
            apartment.id,
            dateStr,
            dateStr
          )

          if (!isAvailable) {
            nextUnavailableDate = new Date(searchDate)
            break
          }

          searchDate.setDate(searchDate.getDate() + 1)
        }

        if (nextUnavailableDate > currentDate) {
          const segmentEnd = nextUnavailableDate < end ? nextUnavailableDate : end
          const segmentDays = Math.ceil((segmentEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

          if (segmentDays >= 1) {
            const segmentPrice = dailyRate(apartment.price) * segmentDays

            segments.push({
              apartment,
              checkIn: currentDate.toISOString().split('T')[0],
              checkOut: segmentEnd.toISOString().split('T')[0],
              price: Math.round(segmentPrice * 100) / 100
            })

            await findCombinations(segmentEnd, segments, depth + 1)

            segments.pop()
          }
        }
      }
    }

    await findCombinations(start, [], 0)

    return splitOptions.filter(option => {
      const lastSegment = option[option.length - 1]
      return lastSegment && new Date(lastSegment.checkOut) >= end
    }).sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length
      const totalA = a.reduce((sum, seg) => sum + seg.price, 0)
      const totalB = b.reduce((sum, seg) => sum + seg.price, 0)
      return totalA - totalB
    })
  }

  static async createBookingWithSegments(
    guestInfo: {
      guest_name: string
      guest_email: string
      guest_phone?: string
      guest_count: number
      special_instructions?: string
    },
    segments: Array<{
      apartment_id: string
      check_in_date: string
      check_out_date: string
      segment_price: number
    }>
  ): Promise<{ booking: Booking; payment: ApartmentPayment }> {
    const isSplitStay = segments.length > 1
    const totalAmount = segments.reduce((sum, seg) => sum + seg.segment_price, 0)

    const firstSegment = segments[0]
    const lastSegment = segments[segments.length - 1]

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        apartment_id: firstSegment.apartment_id,
        guest_name: guestInfo.guest_name,
        guest_email: guestInfo.guest_email,
        guest_phone: guestInfo.guest_phone,
        check_in_date: firstSegment.check_in_date,
        check_out_date: lastSegment.check_out_date,
        booking_source: 'direct',
        guest_count: guestInfo.guest_count,
        total_amount: totalAmount,
        status: 'confirmed',
        payment_status: 'pending',
        is_split_stay: isSplitStay,
        special_instructions: guestInfo.special_instructions,
        metadata: {
          split_stay: isSplitStay,
          segment_count: segments.length
        }
      })
      .select()
      .single()

    if (bookingError || !booking) throw bookingError || new Error('Failed to create booking')

    if (isSplitStay) {
      const segmentInserts = segments.map((seg, index) => ({
        parent_booking_id: booking.id,
        apartment_id: seg.apartment_id,
        segment_order: index,
        check_in_date: seg.check_in_date,
        check_out_date: seg.check_out_date,
        segment_price: seg.segment_price
      }))

      const { error: segmentError } = await supabase
        .from('apartment_booking_segments')
        .insert(segmentInserts)

      if (segmentError) throw segmentError
    }

    const { data: payment, error: paymentError } = await supabase
      .from('apartment_payments')
      .insert({
        booking_id: booking.id,
        amount: totalAmount,
        currency: 'EUR',
        status: 'pending'
      })
      .select()
      .single()

    if (paymentError || !payment) throw paymentError || new Error('Failed to create payment record')

    return { booking, payment }
  }

  static async getBookingWithSegments(bookingId: string): Promise<Booking | null> {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        apartment:apartments(*)
      `)
      .eq('id', bookingId)
      .maybeSingle()

    if (bookingError) throw bookingError
    if (!booking) return null

    if (booking.is_split_stay) {
      const { data: segments, error: segmentsError } = await supabase
        .from('apartment_booking_segments')
        .select(`
          *,
          apartment:apartments(*)
        `)
        .eq('parent_booking_id', bookingId)
        .order('segment_order', { ascending: true })

      if (segmentsError) throw segmentsError

      booking.segments = segments || []
    }

    return booking
  }

  static async updatePaymentStatus(
    checkoutSessionId: string,
    paymentIntentId: string,
    status: 'succeeded' | 'failed' | 'refunded'
  ): Promise<void> {
    const { data: payment, error: paymentError } = await supabase
      .from('apartment_payments')
      .update({
        stripe_payment_intent_id: paymentIntentId,
        status: status
      })
      .eq('stripe_checkout_session_id', checkoutSessionId)
      .select()
      .single()

    if (paymentError) throw paymentError

    const bookingStatus = status === 'succeeded' ? 'paid' : status === 'refunded' ? 'refunded' : 'failed'

    await supabase
      .from('bookings')
      .update({ payment_status: bookingStatus })
      .eq('id', payment.booking_id)

    if (status === 'succeeded') {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', payment.booking_id)
        .single()

      if (booking) {
        if (booking.is_split_stay) {
          const { data: segments } = await supabase
            .from('apartment_booking_segments')
            .select('*')
            .eq('parent_booking_id', booking.id)

          for (const segment of segments || []) {
            const dates: string[] = []
            const currentDate = new Date(segment.check_in_date)
            const endDate = new Date(segment.check_out_date)

            while (currentDate < endDate) {
              dates.push(currentDate.toISOString().split('T')[0])
              currentDate.setDate(currentDate.getDate() + 1)
            }

            if (dates.length > 0) {
              await availabilityService.setBulkAvailability(segment.apartment_id, dates, 'booked')
            }
          }
        } else {
          const dates: string[] = []
          const currentDate = new Date(booking.check_in_date)
          const endDate = new Date(booking.check_out_date)

          while (currentDate < endDate) {
            dates.push(currentDate.toISOString().split('T')[0])
            currentDate.setDate(currentDate.getDate() + 1)
          }

          if (dates.length > 0) {
            await availabilityService.setBulkAvailability(booking.apartment_id, dates, 'booked')
          }
        }
      }
    }
  }
}

export const apartmentBookingService = ApartmentBookingService

export interface CoworkingPass {
  id: string
  name: string
  slug: string
  price: number
  duration_days: number
  duration_type: 'day' | 'week' | 'month'
  description: string
  features: string[]
  is_active: boolean
  sort_order: number
  max_capacity?: number
  current_capacity: number
  is_capacity_limited: boolean
  available_from?: string
  available_until?: string
  is_date_restricted: boolean
  created_at?: string
  updated_at?: string
}

export interface CoworkingPassAvailabilitySchedule {
  id: string
  pass_id: string
  schedule_name: string
  start_date: string
  end_date: string
  max_capacity?: number
  priority: number
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface PassAvailabilityCheck {
  available: boolean
  reason: string
  message: string
  next_available_date?: string
  pass_id: string
  check_date: string
}

export interface PassCapacityInfo {
  pass_id: string
  max_capacity?: number
  current_capacity: number
  available_capacity?: number
  is_capacity_limited: boolean
  date_range: {
    start_date: string
    end_date: string
  }
}

export interface CoworkingBooking {
  id: string
  pass_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  start_date: string
  end_date: string
  access_code?: string
  access_code_sent_at?: string
  booking_reference: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  booking_status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  total_amount: number
  currency: string
  special_notes?: string
  created_at?: string
  updated_at?: string
  pass?: CoworkingPass
}

export interface CoworkingPayment {
  id: string
  booking_id: string
  stripe_payment_intent_id?: string
  stripe_checkout_session_id?: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'
  payment_method?: string
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export class CoworkingPassService {
  static async getAll(): Promise<CoworkingPass[]> {
    const { data, error } = await supabase
      .from('coworking_passes')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getActive(): Promise<CoworkingPass[]> {
    const { data, error } = await supabase
      .from('coworking_passes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getActiveWithAvailability(checkDate?: string): Promise<CoworkingPass[]> {
    const passes = await this.getActive()
    const date = checkDate || new Date().toISOString().split('T')[0]

    const passesWithAvailability = await Promise.all(
      passes.map(async (pass) => {
        try {
          const availability = await this.checkAvailability(pass.id, date)
          return {
            ...pass,
            _availability: availability
          }
        } catch (error) {
          console.error(`Error checking availability for pass ${pass.id}:`, error)
          return pass
        }
      })
    )

    return passesWithAvailability.filter(pass => !pass._availability || pass._availability.available)
  }

  static async checkAvailability(passId: string, checkDate: string): Promise<PassAvailabilityCheck> {
    const { data, error } = await supabase.rpc('check_pass_availability', {
      p_pass_id: passId,
      p_check_date: checkDate
    })

    if (error) throw error
    return data as PassAvailabilityCheck
  }

  static async getCapacityInfo(passId: string, startDate: string, endDate: string): Promise<PassCapacityInfo> {
    const { data, error } = await supabase.rpc('get_pass_capacity', {
      p_pass_id: passId,
      p_start_date: startDate,
      p_end_date: endDate
    })

    if (error) throw error
    return data as PassCapacityInfo
  }

  static async recalculateAllCapacities(): Promise<void> {
    const { error } = await supabase.rpc('recalculate_pass_capacities')
    if (error) throw error
  }

  static async getById(id: string): Promise<CoworkingPass | null> {
    const { data, error } = await supabase
      .from('coworking_passes')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async getBySlug(slug: string): Promise<CoworkingPass | null> {
    const { data, error } = await supabase
      .from('coworking_passes')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async create(pass: Omit<CoworkingPass, 'id' | 'created_at' | 'updated_at'>): Promise<CoworkingPass> {
    const { data, error } = await supabase
      .from('coworking_passes')
      .insert(pass)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, pass: Partial<CoworkingPass>): Promise<CoworkingPass> {
    const { data, error} = await supabase
      .from('coworking_passes')
      .update(pass)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coworking_passes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export class CoworkingPassScheduleService {
  static async getAll(passId?: string): Promise<CoworkingPassAvailabilitySchedule[]> {
    let query = supabase
      .from('coworking_pass_availability_schedules')
      .select('*')
      .order('start_date', { ascending: true })

    if (passId) {
      query = query.eq('pass_id', passId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async getActive(passId?: string): Promise<CoworkingPassAvailabilitySchedule[]> {
    let query = supabase
      .from('coworking_pass_availability_schedules')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true })

    if (passId) {
      query = query.eq('pass_id', passId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<CoworkingPassAvailabilitySchedule | null> {
    const { data, error } = await supabase
      .from('coworking_pass_availability_schedules')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async create(
    schedule: Omit<CoworkingPassAvailabilitySchedule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CoworkingPassAvailabilitySchedule> {
    const { data, error } = await supabase
      .from('coworking_pass_availability_schedules')
      .insert(schedule)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(
    id: string,
    schedule: Partial<CoworkingPassAvailabilitySchedule>
  ): Promise<CoworkingPassAvailabilitySchedule> {
    const { data, error } = await supabase
      .from('coworking_pass_availability_schedules')
      .update(schedule)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coworking_pass_availability_schedules')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export class CoworkingBookingService {
  static async getAll(): Promise<CoworkingBooking[]> {
    const { data, error } = await supabase
      .from('coworking_bookings')
      .select(`
        *,
        pass:coworking_passes(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<CoworkingBooking | null> {
    const { data, error } = await supabase
      .from('coworking_bookings')
      .select(`
        *,
        pass:coworking_passes(*)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async getByEmail(email: string): Promise<CoworkingBooking[]> {
    const { data, error } = await supabase
      .from('coworking_bookings')
      .select(`
        *,
        pass:coworking_passes(*)
      `)
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getByReference(reference: string): Promise<CoworkingBooking | null> {
    const { data, error } = await supabase
      .from('coworking_bookings')
      .select(`
        *,
        pass:coworking_passes(*)
      `)
      .eq('booking_reference', reference)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async create(booking: Omit<CoworkingBooking, 'id' | 'created_at' | 'updated_at' | 'booking_reference'>): Promise<CoworkingBooking> {
    const { data, error } = await supabase
      .from('coworking_bookings')
      .insert(booking)
      .select(`
        *,
        pass:coworking_passes(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, booking: Partial<CoworkingBooking>): Promise<CoworkingBooking> {
    const { data, error } = await supabase
      .from('coworking_bookings')
      .update(booking)
      .eq('id', id)
      .select(`
        *,
        pass:coworking_passes(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coworking_bookings')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getCustomers(): Promise<Array<{
    customer_email: string
    customer_name: string
    total_bookings: number
    total_spent: number
    last_booking_date: string
  }>> {
    const { data, error } = await supabase
      .from('coworking_bookings')
      .select('customer_email, customer_name, total_amount, created_at, payment_status')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })

    if (error) throw error

    const customerMap = new Map<string, {
      customer_email: string
      customer_name: string
      total_bookings: number
      total_spent: number
      last_booking_date: string
    }>()

    data?.forEach(booking => {
      const existing = customerMap.get(booking.customer_email)
      if (existing) {
        existing.total_bookings += 1
        existing.total_spent += booking.total_amount || 0
        if (booking.created_at > existing.last_booking_date) {
          existing.last_booking_date = booking.created_at
        }
      } else {
        customerMap.set(booking.customer_email, {
          customer_email: booking.customer_email,
          customer_name: booking.customer_name,
          total_bookings: 1,
          total_spent: booking.total_amount || 0,
          last_booking_date: booking.created_at || new Date().toISOString()
        })
      }
    })

    return Array.from(customerMap.values()).sort((a, b) =>
      new Date(b.last_booking_date).getTime() - new Date(a.last_booking_date).getTime()
    )
  }

  static async getRevenue(startDate?: string, endDate?: string): Promise<{
    total: number
    by_pass_type: Record<string, number>
    count: number
  }> {
    let query = supabase
      .from('coworking_bookings')
      .select(`
        total_amount,
        pass:coworking_passes(name)
      `)
      .eq('payment_status', 'paid')

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const result = {
      total: 0,
      by_pass_type: {} as Record<string, number>,
      count: data?.length || 0
    }

    data?.forEach(booking => {
      result.total += booking.total_amount || 0
      const passName = booking.pass?.name || 'Unknown'
      result.by_pass_type[passName] = (result.by_pass_type[passName] || 0) + (booking.total_amount || 0)
    })

    return result
  }
}

export class CoworkingPaymentService {
  static async create(payment: Omit<CoworkingPayment, 'id' | 'created_at' | 'updated_at'>): Promise<CoworkingPayment> {
    const { data, error } = await supabase
      .from('coworking_payments')
      .insert(payment)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getByBookingId(bookingId: string): Promise<CoworkingPayment[]> {
    const { data, error } = await supabase
      .from('coworking_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async updateByPaymentIntentId(paymentIntentId: string, updates: Partial<CoworkingPayment>): Promise<CoworkingPayment> {
    const { data, error } = await supabase
      .from('coworking_payments')
      .update(updates)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export interface CoworkingImage {
  id: string
  image_url: string
  caption?: string
  alt_text: string
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export class CoworkingImageService {
  static async getAll(): Promise<CoworkingImage[]> {
    const { data, error } = await supabase
      .from('coworking_images')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getActive(): Promise<CoworkingImage[]> {
    const { data, error } = await supabase
      .from('coworking_images')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async create(image: Omit<CoworkingImage, 'id' | 'created_at' | 'updated_at'>): Promise<CoworkingImage> {
    const { data, error } = await supabase
      .from('coworking_images')
      .insert(image)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, image: Partial<CoworkingImage>): Promise<CoworkingImage> {
    const { data, error } = await supabase
      .from('coworking_images')
      .update(image)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coworking_images')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async reorder(imageIds: string[]): Promise<void> {
    const updates = imageIds.map((id, index) => ({
      id,
      sort_order: index
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('coworking_images')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)

      if (error) throw error
    }
  }
}

export const coworkingPassService = CoworkingPassService
export const coworkingPassScheduleService = CoworkingPassScheduleService
export const coworkingBookingService = CoworkingBookingService
export const coworkingPaymentService = CoworkingPaymentService
export const coworkingImageService = CoworkingImageService