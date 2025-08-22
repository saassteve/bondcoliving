import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Apartment {
  id: string;
  title: string;
  description: string;
  price: number;
  size: string;
  capacity: string;
  image_url: string;
  status: 'available' | 'occupied' | 'maintenance';
  sort_order: number;
  available_from?: string;
  available_until?: string;
  created_at: string;
  updated_at: string;
  slug?: string;
  features?: ApartmentFeature[];
  images?: ApartmentImage[];
}

export interface ApartmentFeature {
  id: string;
  apartment_id: string;
  icon: string;
  label: string;
  sort_order: number;
}

export interface ApartmentImage {
  id: string;
  apartment_id: string;
  image_url: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string;
  arrival_date: string;
  departure_date: string;
  apartment_preference?: string;
  about: string;
  heard_from?: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  text: string;
  author: string;
  rating: number;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface FeatureHighlight {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  apartment_id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in_date: string;
  check_out_date: string;
  booking_source: 'direct' | 'airbnb' | 'booking.com' | 'vrbo' | 'other';
  booking_reference?: string;
  door_code?: string;
  special_instructions?: string;
  guest_count: number;
  total_amount?: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ApartmentAvailability {
  id: string;
  apartment_id: string;
  date: string;
  status: 'available' | 'booked' | 'blocked';
  booking_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApartmentICalFeed {
  id: string;
  apartment_id: string;
  feed_name: string;
  ical_url: string;
  last_sync?: string;
  is_active: boolean;
  created_at: string;
}

// Services
export class ApartmentService {
  static async getAll(): Promise<Apartment[]> {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Apartment | null> {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  static async getBySlug(slug: string): Promise<Apartment | null> {
    // Since we don't have a slug column, we'll need to generate slugs and match
    const apartments = await this.getAll();
    return apartments.find(apt => this.generateSlug(apt.title) === slug) || null;
  }

  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static async create(apartment: Omit<Apartment, 'id' | 'created_at' | 'updated_at'>): Promise<Apartment> {
    const { data, error } = await supabase
      .from('apartments')
      .insert(apartment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, apartment: Partial<Apartment>): Promise<Apartment> {
    const { data, error } = await supabase
      .from('apartments')
      .update(apartment)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Apartment not found');
      }
      throw error;
    }
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('apartments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getFeatures(apartmentId: string): Promise<ApartmentFeature[]> {
    const { data, error } = await supabase
      .from('apartment_features')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async addFeature(feature: Omit<ApartmentFeature, 'id'>): Promise<ApartmentFeature> {
    const { data, error } = await supabase
      .from('apartment_features')
      .insert(feature)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteFeature(featureId: string): Promise<void> {
    const { error } = await supabase
      .from('apartment_features')
      .delete()
      .eq('id', featureId);
    
    if (error) throw error;
  }

  static async getImages(apartmentId: string): Promise<ApartmentImage[]> {
    const { data, error } = await supabase
      .from('apartment_images')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async addImage(image: Omit<ApartmentImage, 'id' | 'created_at'>): Promise<ApartmentImage> {
    const { data, error } = await supabase
      .from('apartment_images')
      .insert(image)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateImage(imageId: string, updates: Partial<ApartmentImage>): Promise<ApartmentImage> {
    const { data, error } = await supabase
      .from('apartment_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async setFeaturedImage(apartmentId: string, imageId: string): Promise<void> {
    // First, unset all featured images for this apartment
    await supabase
      .from('apartment_images')
      .update({ is_featured: false })
      .eq('apartment_id', apartmentId);

    // Then set the selected image as featured
    const { error } = await supabase
      .from('apartment_images')
      .update({ is_featured: true })
      .eq('id', imageId);
    
    if (error) throw error;
  }

  static async deleteImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('apartment_images')
      .delete()
      .eq('id', imageId);
    
    if (error) throw error;
  }
}

export class ApplicationService {
  static async getAll(): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async create(application: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert({ ...application, status: 'pending' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateStatus(id: string, status: Application['status']): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export class ReviewService {
  static async getFeatured(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_featured', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
}

export class FeatureHighlightService {
  static async getActive(): Promise<FeatureHighlight[]> {
    const { data, error } = await supabase
      .from('feature_highlights')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
}

export class BookingService {
  static async getAll(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async create(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    
    if (error) throw error;

    // Update apartment availability for the booking period
    await this.updateAvailabilityForBooking(booking.apartment_id, booking.check_in_date, booking.check_out_date, 'booked', `Booking: ${booking.guest_name}`);
    
    return data;
  }

  static async update(id: string, booking: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update(booking)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    // Get booking details before deletion to update availability
    const { data: booking } = await supabase
      .from('bookings')
      .select('apartment_id, check_in_date, check_out_date')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Clear availability for the booking period
    if (booking) {
      await this.updateAvailabilityForBooking(booking.apartment_id, booking.check_in_date, booking.check_out_date, 'available');
    }
  }

  static async getBookingsWithAvailability(year: number, month: number): Promise<{ bookings: Booking[], availability: Record<string, any[]> }> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const [bookingsResult, availabilityResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .gte('check_in_date', startDate)
        .lte('check_out_date', endDate),
      supabase
        .from('apartment_availability')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
    ]);

    if (bookingsResult.error) throw bookingsResult.error;
    if (availabilityResult.error) throw availabilityResult.error;

    // Group availability by apartment_id
    const availability: Record<string, any[]> = {};
    (availabilityResult.data || []).forEach(avail => {
      if (!availability[avail.apartment_id]) {
        availability[avail.apartment_id] = [];
      }
      availability[avail.apartment_id].push(avail);
    });

    return {
      bookings: bookingsResult.data || [],
      availability
    };
  }

  private static async updateAvailabilityForBooking(
    apartmentId: string, 
    checkInDate: string, 
    checkOutDate: string, 
    status: 'available' | 'booked' | 'blocked',
    notes?: string
  ): Promise<void> {
    const dates = [];
    const current = new Date(checkInDate);
    const end = new Date(checkOutDate);
    
    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    if (status === 'available') {
      // Remove availability records (set back to default available)
      await supabase
        .from('apartment_availability')
        .delete()
        .eq('apartment_id', apartmentId)
        .in('date', dates);
    } else {
      // Create or update availability records
      const records = dates.map(date => ({
        apartment_id: apartmentId,
        date,
        status,
        notes
      }));

      await supabase
        .from('apartment_availability')
        .upsert(records, { onConflict: 'apartment_id,date' });
    }
  }
}

export class AvailabilityService {
  static async getCalendar(apartmentId: string, startDate: string, endDate: string): Promise<ApartmentAvailability[]> {
    const { data, error } = await supabase
      .from('apartment_availability')
      .select('*')
      .eq('apartment_id', apartmentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async setBulkAvailability(
    apartmentId: string, 
    dates: string[], 
    status: 'available' | 'booked' | 'blocked',
    notes?: string
  ): Promise<void> {
    if (status === 'available') {
      // Remove availability records for these dates
      const { error } = await supabase
        .from('apartment_availability')
        .delete()
        .eq('apartment_id', apartmentId)
        .in('date', dates);
      
      if (error) throw error;
    } else {
      // Create or update availability records
      const records = dates.map(date => ({
        apartment_id: apartmentId,
        date,
        status,
        notes
      }));

      const { error } = await supabase
        .from('apartment_availability')
        .upsert(records, { onConflict: 'apartment_id,date' });
      
      if (error) throw error;
    }
  }

  static async checkAvailability(apartmentId: string, startDate: string, endDate: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('apartment_availability')
      .select('date, status')
      .eq('apartment_id', apartmentId)
      .gte('date', startDate)
      .lt('date', endDate)
      .neq('status', 'available');
    
    if (error) throw error;
    
    // If there are any non-available dates in the range, apartment is not available
    return (data || []).length === 0;
  }
}

export class ICalService {
  static async getFeeds(apartmentId: string): Promise<ApartmentICalFeed[]> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .select('*')
      .eq('apartment_id', apartmentId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async addFeed(feed: Omit<ApartmentICalFeed, 'id' | 'created_at'>): Promise<ApartmentICalFeed> {
    const { data, error } = await supabase
      .from('apartment_ical_feeds')
      .insert(feed)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteFeed(feedId: string): Promise<void> {
    const { error } = await supabase
      .from('apartment_ical_feeds')
      .delete()
      .eq('id', feedId);
    
    if (error) throw error;
  }

  static async syncFeed(feedId: string): Promise<{ success: boolean; message: string; stats?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('ical-sync', {
        body: { feedId, apartmentId: '' }, // apartmentId will be fetched from the feed record
      });

      if (error) {
        console.error('Supabase Edge Function error:', error);
        return { success: false, message: `Sync failed: ${error.message}` };
      }

      return data as { success: boolean; message: string; stats?: any };

    } catch (error: any) {
      console.error('Error invoking iCal sync function:', error);
      return { success: false, message: `An unexpected error occurred during sync: ${error.message}` };
    }
  }

  static getExportUrl(apartmentId: string): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/ical-export/${apartmentId}.ics`;
  }

  static async downloadExport(apartmentId: string, apartmentTitle: string): Promise<void> {
    try {
      const exportUrl = this.getExportUrl(apartmentId);
      const response = await fetch(exportUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch iCal: ${response.statusText}`);
      }
      
      const icalContent = await response.text();
      const blob = new Blob([icalContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${apartmentTitle.replace(/[^a-zA-Z0-9]/g, '-')}-availability.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading iCal export:', error);
      throw error;
    }
  }
}

// Export service instances
export const apartmentService = ApartmentService;
export const applicationService = ApplicationService;
export const reviewService = ReviewService;
export const featureHighlightService = FeatureHighlightService;
export const bookingService = BookingService;
export const availabilityService = AvailabilityService;
export const icalService = ICalService;