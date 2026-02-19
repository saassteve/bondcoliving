import { supabase } from './client'
import type {
  CoworkingPass,
  CoworkingPassAvailabilitySchedule,
  PassAvailabilityCheck,
  PassCapacityInfo,
  CoworkingBooking,
  CoworkingPayment,
  CoworkingImage
} from './types'

export class CoworkingPassService {
  static async getAll(): Promise<CoworkingPass[]> {
    const { data, error } = await supabase.rpc('get_admin_coworking_passes')

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('coworking_passes')
        .select('*')
        .order('sort_order', { ascending: true })
      if (fallbackError) throw fallbackError
      return fallbackData || []
    }

    if (data?.error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('coworking_passes')
        .select('*')
        .order('sort_order', { ascending: true })
      if (fallbackError) throw fallbackError
      return fallbackData || []
    }

    return (data?.passes || []) as CoworkingPass[]
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
        } catch {
          return pass
        }
      })
    )

    return passesWithAvailability.filter(pass => !(pass as any)._availability || (pass as any)._availability.available)
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase.rpc('get_admin_coworking_bookings')

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('coworking_bookings')
        .select(`*, pass:coworking_passes(*)`)
        .order('created_at', { ascending: false })
      if (fallbackError) throw fallbackError
      return fallbackData || []
    }

    if (data?.error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('coworking_bookings')
        .select(`*, pass:coworking_passes(*)`)
        .order('created_at', { ascending: false })
      if (fallbackError) throw fallbackError
      return fallbackData || []
    }

    return (data?.bookings || []) as CoworkingBooking[]
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
    const { data, error } = await supabase.rpc('get_admin_coworking_stats')

    if (error) {
      return this.getRevenueFallback(startDate, endDate)
    }

    if (data?.error) {
      return this.getRevenueFallback(startDate, endDate)
    }

    return {
      total: data?.total || 0,
      by_pass_type: data?.by_pass_type || {},
      count: data?.count || 0
    }
  }

  private static async getRevenueFallback(startDate?: string, endDate?: string): Promise<{
    total: number
    by_pass_type: Record<string, number>
    count: number
  }> {
    let query = supabase
      .from('coworking_bookings')
      .select(`total_amount, pass:coworking_passes(name)`)
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
      const passName = (booking.pass as any)?.name || 'Unknown'
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
