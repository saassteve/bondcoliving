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
    
    // Add slugs to apartments
    const apartmentsWithSlugs = (data || []).map(apartment => ({
      ...apartment,
      slug: this.generateSlug(apartment.title)
    }))
    
    return apartmentsWithSlugs
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

export class AvailabilityService {
  static async getCalendar(apartmentId: string, startDate?: string, endDate?: string): Promise<ApartmentAvailability[]> {
    const { data, error } = await supabase
      .rpc('get_apartment_calendar', {
        apartment_uuid: apartmentId,
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    
    if (error) throw error
    return data || []
  }

  static async checkAvailability(apartmentId: string, startDate: string, endDate: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_apartment_availability', {
        apartment_uuid: apartmentId,
        start_date: startDate,
        end_date: endDate
      })
    
    if (error) throw error
    return data
  }

  static async setAvailability(
    apartmentId: string, 
    date: string, 
    status: 'available' | 'booked' | 'blocked',
    bookingReference?: string,
    notes?: string
  ): Promise<ApartmentAvailability> {
    const { data, error } = await supabase
      .from('apartment_availability')
      .upsert({
        apartment_id: apartmentId,
        date,
        status,
        booking_reference: bookingReference,
        notes
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async setBulkAvailability(
    apartmentId: string,
    dates: string[],
    status: 'available' | 'booked' | 'blocked',
    bookingReference?: string,
    notes?: string
  ): Promise<ApartmentAvailability[]> {
    const records = dates.map(date => ({
      apartment_id: apartmentId,
      date,
      status,
      booking_reference: bookingReference,
      notes
    }))

    const { data, error } = await supabase
      .from('apartment_availability')
      .upsert(records)
      .select()
    
    if (error) throw error
    return data || []
  }

  static async deleteAvailability(apartmentId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('apartment_availability')
      .delete()
      .eq('apartment_id', apartmentId)
      .eq('date', date)
    
    if (error) throw error
  }
}

export class ICalService {
  static async getFeeds(apartmentId: string): Promise<ApartmentICalFeed[]> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async addFeed(feed: Omit<ApartmentICalFeed, 'id' | 'created_at' | 'last_sync'>): Promise<ApartmentICalFeed> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .insert(feed)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateFeed(id: string, updates: Partial<ApartmentICalFeed>): Promise<ApartmentICalFeed> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteFeed(id: string): Promise<void> {
    const { error } = await supabase
      .from('apartment_ical_feeds')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async syncFeed(feedId: string): Promise<{ success: boolean; message: string; eventsProcessed?: number }> {
    try {
      // Get the feed details
      const { data: feed, error: feedError } = await supabase
        .from('apartment_ical_feeds')
        .select('*')
        .eq('id', feedId)
        .single()
      
      if (feedError) throw feedError
      if (!feed) throw new Error('Feed not found')

      // Fetch the iCal data
      const response = await fetch(feed.ical_url)
      if (!response.ok) {
        throw new Error(`Failed to fetch iCal: ${response.statusText}`)
      }
      
      const icalData = await response.text()
      
      // Parse iCal data (basic parsing - you might want to use a proper iCal library)
      const events = this.parseICalEvents(icalData)
      
      // Convert events to availability records
      const availabilityRecords: any[] = []
      
      for (const event of events) {
        const startDate = new Date(event.dtstart)
        const endDate = new Date(event.dtend)
        
        // Generate date range
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          availabilityRecords.push({
            apartment_id: feed.apartment_id,
            date: currentDate.toISOString().split('T')[0],
            status: 'booked',
            booking_reference: event.summary || 'External booking',
            notes: `Synced from ${feed.feed_name}`
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }

      // Bulk upsert availability records
      if (availabilityRecords.length > 0) {
        const { error: upsertError } = await supabase
          .from('apartment_availability')
          .upsert(availabilityRecords)
        
        if (upsertError) throw upsertError
      }

      // Update last sync time
      await supabase
        .from('apartment_ical_feeds')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', feedId)

      return {
        success: true,
        message: `Successfully synced ${events.length} events`,
        eventsProcessed: events.length
      }
    } catch (error) {
      console.error('iCal sync error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private static parseICalEvents(icalData: string): Array<{
    dtstart: string
    dtend: string
    summary?: string
    uid?: string
  }> {
    const events: Array<{
      dtstart: string
      dtend: string
      summary?: string
      uid?: string
    }> = []
    
    const lines = icalData.split('\n').map(line => line.trim())
    let currentEvent: any = null
    
    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {}
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.dtstart && currentEvent.dtend) {
          events.push(currentEvent)
        }
        currentEvent = null
      } else if (currentEvent && line.includes(':')) {
        const [key, ...valueParts] = line.split(':')
        const value = valueParts.join(':')
        
        if (key.startsWith('DTSTART')) {
          currentEvent.dtstart = this.parseICalDate(value)
        } else if (key.startsWith('DTEND')) {
          currentEvent.dtend = this.parseICalDate(value)
        } else if (key === 'SUMMARY') {
          currentEvent.summary = value
        } else if (key === 'UID') {
          currentEvent.uid = value
        }
      }
    }
    
    return events
  }

  private static parseICalDate(dateString: string): string {
    // Handle different iCal date formats
    if (dateString.includes('T')) {
      // DateTime format: 20231225T120000Z
      const cleanDate = dateString.replace(/[TZ]/g, ' ').trim()
      const year = cleanDate.substring(0, 4)
      const month = cleanDate.substring(4, 6)
      const day = cleanDate.substring(6, 8)
      return `${year}-${month}-${day}`
    } else {
      // Date only format: 20231225
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      return `${year}-${month}-${day}`
    }
  }
}

// Convenience exports
export const apartmentService = ApartmentService
export const applicationService = ApplicationService
export const reviewService = ReviewService
export const featureHighlightService = FeatureHighlightService
export const siteSettingService = SiteSettingService
export const availabilityService = AvailabilityService
export const icalService = ICalService