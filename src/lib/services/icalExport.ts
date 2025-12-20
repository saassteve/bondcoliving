import { supabase } from './client'
import type { ApartmentICalExport } from './types'

export class ICalExportService {
  static async getExportUrl(apartmentId: string): Promise<string | null> {
    const { data, error } = await supabase
      .rpc('get_or_create_export_token', { p_apartment_id: apartmentId })

    if (error) {
      console.error('Error getting export token:', error)
      throw error
    }

    if (!data) return null

    const baseUrl = import.meta.env.VITE_SUPABASE_URL
    return `${baseUrl}/functions/v1/export-ical?token=${data}`
  }

  static async regenerateToken(apartmentId: string): Promise<string> {
    await supabase
      .from('apartment_ical_exports')
      .delete()
      .eq('apartment_id', apartmentId)

    const url = await this.getExportUrl(apartmentId)
    if (!url) throw new Error('Failed to generate export URL')
    return url
  }

  static async deactivateExport(apartmentId: string): Promise<void> {
    const { error } = await supabase
      .from('apartment_ical_exports')
      .update({ is_active: false })
      .eq('apartment_id', apartmentId)

    if (error) throw error
  }

  static async getAll(): Promise<ApartmentICalExport[]> {
    const { data, error } = await supabase
      .from('apartment_ical_exports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const icalExportService = ICalExportService
