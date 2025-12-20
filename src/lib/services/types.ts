export interface Building {
  id: string
  slug: string
  name: string
  address: string
  description?: string
  has_on_site_coworking: boolean
  check_in_instructions?: string
  latitude?: number
  longitude?: number
  image_url?: string
  sort_order?: number
  stay_type?: 'short_term' | 'long_term'
  status?: 'active' | 'coming_soon'
  gallery_images?: string[]
  hero_image_url?: string
  tagline?: string
  created_at?: string
  updated_at?: string
}

export interface Apartment {
  id: string
  slug?: string
  title: string
  description: string
  price: number
  building_id?: string
  accommodation_type?: 'short_term' | 'long_term'
  nightly_price?: number
  minimum_stay_nights?: number
  minimum_stay_months?: number
  size: string
  capacity: string
  image_url: string
  status?: 'available' | 'occupied' | 'maintenance'
  sort_order?: number
  available_from?: string
  available_until?: string
  created_at?: string
  updated_at?: string
  building?: Building
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

export interface ApartmentICalExport {
  id: string
  apartment_id: string
  export_token: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

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
