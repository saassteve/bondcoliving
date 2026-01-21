import { supabase } from './client'

export type ImageFolder = 'apartments' | 'buildings' | 'events' | 'coworking'

const BUCKET_NAME = 'images'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface UploadResult {
  url: string
  path: string
}

export interface UploadError {
  message: string
  code?: string
}

function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${timestamp}-${randomStr}.${extension}`
}

function validateFile(file: File): UploadError | null {
  if (file.size > MAX_FILE_SIZE) {
    return { message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, code: 'FILE_TOO_LARGE' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { message: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF', code: 'INVALID_TYPE' }
  }

  return null
}

export const storageService = {
  async uploadImage(file: File, folder: ImageFolder): Promise<UploadResult> {
    const validationError = validateFile(file)
    if (validationError) {
      throw new Error(validationError.message)
    }

    const filename = generateUniqueFilename(file.name)
    const filePath = `${folder}/${filename}`

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath
    }
  },

  async uploadMultipleImages(files: File[], folder: ImageFolder): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (const file of files) {
      const result = await this.uploadImage(file, folder)
      results.push(result)
    }

    return results
  },

  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  },

  async deleteMultipleImages(paths: string[]): Promise<void> {
    if (paths.length === 0) return

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths)

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  },

  getPathFromUrl(url: string): string | null {
    if (!url) return null

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!url.includes(supabaseUrl)) {
      return null
    }

    const match = url.match(/\/storage\/v1\/object\/public\/images\/(.+)$/)
    return match ? match[1] : null
  },

  isSupabaseUrl(url: string): boolean {
    if (!url) return false
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    return url.includes(supabaseUrl) && url.includes('/storage/v1/object/public/images/')
  },

  validateImageUrl(url: string): { valid: boolean; error?: string } {
    if (!url) {
      return { valid: false, error: 'URL is required' }
    }

    // Check if it's a Supabase storage URL
    if (this.isSupabaseUrl(url)) {
      return { valid: true }
    }

    // Check if it's a local file path (starts with /)
    if (url.startsWith('/')) {
      return { valid: true }
    }

    // Block external CDN URLs
    const externalDomains = [
      'ucarecdn.com',
      'pexels.com',
      'pravatar.cc',
      'transparenttextures.com',
      'unsplash.com',
      'imgur.com',
      'cloudinary.com'
    ]

    const isExternal = externalDomains.some(domain => url.includes(domain))
    if (isExternal) {
      return {
        valid: false,
        error: 'External CDN URLs are not allowed. Please upload images to storage.'
      }
    }

    // Block other external URLs (http/https that aren't Supabase)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return {
        valid: false,
        error: 'External URLs are not allowed. Please upload images to storage.'
      }
    }

    return { valid: true }
  }
}
