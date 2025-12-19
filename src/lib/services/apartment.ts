import { supabase } from './client'
import { availabilityService } from './availability'
import type { Apartment, ApartmentFeature, ApartmentImage, Review, FeatureHighlight, SiteSetting, Building } from './types'

export class ApartmentService {
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

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
      .select(`
        *,
        building:buildings(*)
      `)
      .order('sort_order', { ascending: true })

    if (error) throw error

    const apartmentsWithSlugs = await Promise.all((data || []).map(async (apartment) => {
      let actualStatus = apartment.status

      try {
        const today = new Date().toISOString().split('T')[0]
        const isAvailable = await availabilityService.checkAvailability(apartment.id, today, today)

        if (!isAvailable && apartment.status === 'available') {
          actualStatus = 'occupied'
        }
      } catch (error) {
        console.warn('Could not check availability for apartment:', apartment.id)
      }

      return {
        ...apartment,
        status: actualStatus,
        slug: this.generateSlug(apartment.title)
      }
    }))

    return apartmentsWithSlugs
  }

  static async getById(id: string): Promise<Apartment | null> {
    const { data, error } = await supabase
      .from('apartments')
      .select(`
        *,
        building:buildings(*)
      `)
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
    const existingApartment = await this.getById(id)
    if (!existingApartment) {
      throw new Error(`Apartment with ID ${id} not found`)
    }

    const updateData = {
      ...apartment,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('apartments')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Apartment with ID ${id} not found`)
      }
      throw new Error(`Failed to update apartment: ${error.message}`)
    }

    if (!data) {
      throw new Error(`Apartment with ID ${id} not found`)
    }

    if (apartment.image_url) {
      try {
        const { data: featuredImage } = await supabase
          .from('apartment_images')
          .select('id')
          .eq('apartment_id', id)
          .eq('is_featured', true)
          .single()

        if (featuredImage) {
          await supabase
            .from('apartment_images')
            .update({ image_url: apartment.image_url })
            .eq('id', featuredImage.id)
        }
      } catch (imageError) {
        console.warn('Could not update featured image:', imageError)
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
    const { error } = await supabase
      .from('apartment_features')
      .delete()
      .eq('id', id)

    if (error) throw error
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
    await supabase
      .from('apartment_images')
      .update({ is_featured: false })
      .eq('apartment_id', apartmentId)

    const { error } = await supabase
      .from('apartment_images')
      .update({ is_featured: true })
      .eq('id', imageId)

    if (error) throw error
  }
}

export class ReviewService {
  static async getFeatured(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
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
    const { data, error } = await supabase
      .from('feature_highlights')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
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

export class BuildingService {
  static async getAll(): Promise<Building[]> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Building | null> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async getBySlug(slug: string): Promise<Building | null> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async create(building: Omit<Building, 'id' | 'created_at' | 'updated_at'>): Promise<Building> {
    const { data, error } = await supabase
      .from('buildings')
      .insert(building)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, building: Partial<Building>): Promise<Building> {
    const { data, error } = await supabase
      .from('buildings')
      .update({
        ...building,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const apartmentService = ApartmentService
export const reviewService = ReviewService
export const featureHighlightService = FeatureHighlightService
export const siteSettingService = SiteSettingService
export const buildingService = BuildingService
