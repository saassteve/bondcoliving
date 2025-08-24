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
    
    try {
      // Try with the regular client (should work with proper RLS policy)
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
        
        // For RLS errors, use Edge Function to submit application
        if (error.code === '42501') {
          console.log('RLS error detected, using Edge Function submission...');
          
          try {
            const { data: edgeData, error: edgeError } = await supabase.functions.invoke('submit-application', {
              body: application
            });
            
            if (edgeError) {
              console.error('Edge Function error:', edgeError);
              throw new Error(`Edge Function failed: ${edgeError.message}`);
            }
            
            console.log('Application created successfully via Edge Function:', edgeData);
            return edgeData;
          } catch (edgeError) {
            console.error('Edge Function submission failed:', edgeError);
            
            // Final fallback: Store locally and provide contact info
            const mockApplication = {
              id: `temp-${Date.now()}`,
              ...application,
              status: 'pending' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const existingApplications = JSON.parse(localStorage.getItem('bond_applications') || '[]');
            existingApplications.push(mockApplication);
            localStorage.setItem('bond_applications', JSON.stringify(existingApplications));
            
            console.log('Application stored locally as final fallback:', mockApplication);
            return mockApplication;
          }
        } else {
          throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
        }
      }
      
      console.log('Application created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in ApplicationService.create:', error);
      throw error;
    }
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
      .neq('status', 'available')
    
    if (error) throw error
    return (data || []).length === 0
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

  static async deleteFeed(feedId: string): Promise<void> {
    const { error } = await supabase
      .from('apartment_ical_feeds')
      .delete()
      .eq('id', feedId)
    
    if (error) throw error
  }

  static async syncFeed(feedId: string): Promise<{ success: boolean; message: string }> {
    try {
      // First get the apartment_id from the feed
      const { data: feedData, error: feedError } = await supabase
        .from('apartment_ical_feeds')
        .select('apartment_id')
        .eq('id', feedId)
        .single();

      if (feedError || !feedData) {
        return { success: false, message: 'Feed not found' };
      }

      const { data, error } = await supabase.functions.invoke('ical-sync', {
        body: { feedId, apartmentId: feedData.apartment_id },
      });

      if (error) {
        console.error('Supabase Edge Function error:', error);
        return { success: false, message: `Sync failed: ${error.message}` };
      }

      return data as { success: boolean; message: string };
    } catch (error: any) {
      console.error('Error invoking iCal sync function:', error);
      return { success: false, message: `An unexpected error occurred during sync: ${error.message}` };
    }
  }

  static async generateICalFeed(apartmentId: string, apartmentTitle: string): Promise<string> {
    const { data: availabilityData, error: availabilityError } = await supabase
      .from('apartment_availability')
      .select('*')
      .eq('apartment_id', apartmentId)
      .neq('status', 'available')
      .order('date', { ascending: true });

    if (availabilityError) throw availabilityError;

    // Generate iCal header
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bond Coliving//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${apartmentTitle} - Bond Coliving`,
      `X-WR-CALDESC:Availability calendar for ${apartmentTitle} at Bond Coliving`
    ].join('\r\n') + '\r\n';

    // Add events for each non-available date
    for (const entry of availabilityData || []) {
      const startDate = new Date(entry.date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1); // Next day (iCal end dates are exclusive)

      const uid = `bond-${entry.apartment_id}-${entry.date}@stayatbond.com`;
      const summary = `${apartmentTitle} - ${entry.status.toUpperCase()}`;
      const description = entry.notes || `Status: ${entry.status}`;
      const timestamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');
      
      // Format dates for iCal (YYYYMMDD)
      const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
      const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

      icalContent += [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${startDateStr}`,
        `DTEND;VALUE=DATE:${endDateStr}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `STATUS:${entry.status === 'booked' ? 'CONFIRMED' : 'TENTATIVE'}`,
        `TRANSP:OPAQUE`,
        'END:VEVENT'
      ].join('\r\n') + '\r\n';
    }

    icalContent += 'END:VCALENDAR\r\n';
    return icalContent;
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
  created_at?: string
  updated_at?: string
  apartment?: {
    title: string
  }
}

export class BookingService {
  static async getAll(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        apartment:apartments(title)
      `)
      .order('check_in_date', { ascending: false })
    
    if (error) throw error
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