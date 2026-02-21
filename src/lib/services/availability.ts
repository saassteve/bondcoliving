import { supabase } from './client'
import type { ApartmentAvailability } from './types'

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
      .rpc('check_apartment_available_for_dates', {
        p_apartment_id: apartmentId,
        p_check_in: startDate,
        p_check_out: endDate,
        p_exclude_booking_id: null
      })

    if (error) throw error

    return data === true
  }

  static async getUnavailableDates(apartmentId: string, startDate: string, endDate: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .rpc('get_unavailable_dates_for_apartment', {
        p_apartment_id: apartmentId,
        p_start_date: startDate,
        p_end_date: endDate
      })

    if (error) throw error

    return new Set((data || []).map((row: { unavailable_date: string }) => row.unavailable_date))
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

export const availabilityService = AvailabilityService
