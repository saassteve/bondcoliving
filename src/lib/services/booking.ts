import { supabase } from './client'
import { availabilityService } from './availability'
import { apartmentService } from './apartment'
import type { Booking, ApartmentBookingSegment, ApartmentPayment, BookingSettings, Apartment, ApartmentAvailability } from './types'

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
      .select(`
        *,
        segments:apartment_booking_segments(
          id,
          apartment_id,
          segment_order,
          check_in_date,
          check_out_date,
          segment_price,
          notes,
          apartment:apartments(title)
        )
      `)
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

    if (booking.status === 'confirmed' || booking.status === 'checked_in') {
      await this.updateAvailabilityForBooking(data.id, booking.apartment_id, booking.check_in_date, booking.check_out_date, 'booked')
    }

    return data
  }

  static async update(id: string, booking: Partial<Booking>): Promise<Booking> {
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

    const datesChanged = booking.check_in_date !== undefined || booking.check_out_date !== undefined
    const statusChanged = booking.status !== undefined && booking.status !== existingBooking.status

    if (datesChanged || statusChanged) {
      if (datesChanged || booking.status === 'cancelled') {
        await this.updateAvailabilityForBooking(
          id,
          existingBooking.apartment_id,
          existingBooking.check_in_date,
          existingBooking.check_out_date,
          'available'
        )
      }

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
    const booking = await this.getById(id)
    if (!booking) {
      throw new Error(`Booking with ID ${id} not found`)
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) throw error

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
    }
  }

  static async getBookingsForMonth(year: number, month: number): Promise<Booking[]> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        apartment:apartments(title),
        segments:apartment_booking_segments(
          id,
          apartment_id,
          segment_order,
          check_in_date,
          check_out_date,
          segment_price,
          notes,
          apartment:apartments(title)
        )
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

    const bookings = await this.getBookingsForMonth(year, month)
    const apartments = await apartmentService.getAll()

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

    if (activeApartments.length === 0) return []

    const start = new Date(startDate)
    const end = new Date(endDate)
    const dailyRate = (monthlyPrice: number) => monthlyPrice / 30

    const formatDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const parseDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    type AvailablePeriod = {
      apartment: Apartment
      startDate: Date
      endDate: Date
    }

    const apartmentAvailability = await Promise.all(
      activeApartments.map(async (apartment) => {
        const unavailableDates = await availabilityService.getUnavailableDates(
          apartment.id,
          startDate,
          endDate
        )

        const periods: AvailablePeriod[] = []
        let periodStart: Date | null = null
        let currentDate = parseDate(startDate)
        const endDateObj = parseDate(endDate)

        while (currentDate < endDateObj) {
          const dateStr = formatDate(currentDate)
          const isAvailable = !unavailableDates.has(dateStr)

          if (isAvailable) {
            if (!periodStart) {
              periodStart = new Date(currentDate)
            }
          } else {
            if (periodStart) {
              periods.push({
                apartment,
                startDate: new Date(periodStart),
                endDate: new Date(currentDate)
              })
              periodStart = null
            }
          }

          currentDate.setDate(currentDate.getDate() + 1)
        }

        if (periodStart) {
          periods.push({
            apartment,
            startDate: new Date(periodStart),
            endDate: new Date(endDateObj)
          })
        }

        return periods
      })
    )

    const allPeriods = apartmentAvailability.flat().filter(period => {
      const days = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24))
      return days >= 1
    })

    if (allPeriods.length === 0) return []

    const splitOptions: Array<Array<{ apartment: Apartment; checkIn: string; checkOut: string; price: number }>> = []

    function findCombinations(
      targetStart: Date,
      segments: Array<{ apartment: Apartment; checkIn: string; checkOut: string; price: number }>,
      usedApartmentIds: Set<string>,
      depth: number
    ) {
      const targetStartTime = targetStart.getTime()
      const endTime = end.getTime()

      if (targetStartTime >= endTime) {
        if (segments.length > 1 && segments.length <= maxSegments) {
          splitOptions.push([...segments])
        }
        return
      }

      if (depth >= maxSegments) return

      for (const period of allPeriods) {
        const periodStartTime = period.startDate.getTime()
        const periodEndTime = period.endDate.getTime()

        if (periodStartTime <= targetStartTime && periodEndTime > targetStartTime) {
          const segmentStart = new Date(targetStart)
          const segmentEnd = periodEndTime < endTime ? new Date(period.endDate) : new Date(end)
          const segmentDays = Math.ceil((segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60 * 60 * 24))

          if (segmentDays >= 1) {
            const segmentPrice = dailyRate(period.apartment.price) * segmentDays
            const newUsedIds = new Set(usedApartmentIds)

            segments.push({
              apartment: period.apartment,
              checkIn: formatDate(segmentStart),
              checkOut: formatDate(segmentEnd),
              price: Math.round(segmentPrice * 100) / 100
            })
            newUsedIds.add(period.apartment.id)

            findCombinations(segmentEnd, segments, newUsedIds, depth + 1)
            segments.pop()
          }
        }
      }
    }

    findCombinations(parseDate(startDate), [], new Set(), 0)

    const validOptions = splitOptions.filter(option => {
      if (option.length < 2) return false
      const lastSegment = option[option.length - 1]
      const lastCheckout = parseDate(lastSegment.checkOut)
      return lastCheckout.getTime() >= end.getTime()
    })

    const uniqueOptions = validOptions.filter((option, index, self) => {
      const key = option.map(seg => `${seg.apartment.id}:${seg.checkIn}:${seg.checkOut}`).join('|')
      return index === self.findIndex(o =>
        o.map(seg => `${seg.apartment.id}:${seg.checkIn}:${seg.checkOut}`).join('|') === key
      )
    })

    return uniqueOptions.sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length
      const totalA = a.reduce((sum, seg) => sum + seg.price, 0)
      const totalB = b.reduce((sum, seg) => sum + seg.price, 0)
      return totalA - totalB
    }).slice(0, 10)
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

  static async updateBookingWithSegments(
    bookingId: string,
    guestInfo: {
      guest_name: string
      guest_email?: string | null
      guest_phone?: string | null
      guest_count: number
      special_instructions?: string | null
    },
    segments: Array<{
      apartment_id: string
      check_in_date: string
      check_out_date: string
      segment_price: number
      notes?: string | null
    }>,
    bookingSource?: string,
    bookingReference?: string | null,
    doorCode?: string | null,
    status?: string
  ): Promise<Booking> {
    const isSplitStay = segments.length > 1
    const totalAmount = segments.reduce((sum, seg) => sum + seg.segment_price, 0)

    const firstSegment = segments[0]
    const lastSegment = segments[segments.length - 1]

    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('is_split_stay')
      .eq('id', bookingId)
      .maybeSingle()

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update({
        apartment_id: firstSegment.apartment_id,
        guest_name: guestInfo.guest_name,
        guest_email: guestInfo.guest_email,
        guest_phone: guestInfo.guest_phone,
        check_in_date: firstSegment.check_in_date,
        check_out_date: lastSegment.check_out_date,
        booking_source: bookingSource || 'direct',
        booking_reference: bookingReference,
        door_code: doorCode,
        guest_count: guestInfo.guest_count,
        total_amount: totalAmount,
        status: status || 'confirmed',
        is_split_stay: isSplitStay,
        special_instructions: guestInfo.special_instructions,
        metadata: {
          split_stay: isSplitStay,
          segment_count: segments.length
        }
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (bookingError || !booking) throw bookingError || new Error('Failed to update booking')

    if (existingBooking?.is_split_stay) {
      const { error: deleteError } = await supabase
        .from('apartment_booking_segments')
        .delete()
        .eq('parent_booking_id', bookingId)

      if (deleteError) throw deleteError
    }

    if (isSplitStay) {
      const segmentInserts = segments.map((seg, index) => ({
        parent_booking_id: booking.id,
        apartment_id: seg.apartment_id,
        segment_order: index,
        check_in_date: seg.check_in_date,
        check_out_date: seg.check_out_date,
        segment_price: seg.segment_price,
        notes: seg.notes
      }))

      const { error: segmentError } = await supabase
        .from('apartment_booking_segments')
        .insert(segmentInserts)

      if (segmentError) throw segmentError
    }

    return booking
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

  static async createCheckoutSession(bookingData: {
    guestName: string
    guestEmail: string
    guestPhone?: string
    guestCount: number
    specialInstructions?: string
    segments: Array<{
      apartment_id: string
      check_in_date: string
      check_out_date: string
      segment_price: number
    }>
  }): Promise<{ url: string }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-apartment-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(bookingData),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create checkout session' }))
      throw new Error(error.message || 'Failed to create checkout session')
    }

    return response.json()
  }
}

export const bookingService = BookingService
export const apartmentBookingService = ApartmentBookingService
