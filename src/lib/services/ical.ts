import { supabase } from './client'
import type { ApartmentICalFeed } from './types'

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

export const icalService = ICalService
