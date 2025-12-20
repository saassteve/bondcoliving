/*
  # Create Images Storage Bucket

  This migration sets up Supabase Storage for handling image uploads.

  ## Storage Bucket
  - Creates a public bucket called "images" for storing all uploaded images
  - Public access allows images to be displayed on the website without authentication

  ## Folder Structure
  The bucket will organize images by type:
  - apartments/ - Apartment listing images
  - buildings/ - Building hero and gallery images
  - events/ - Community event images
  - coworking/ - Coworking space images

  ## Security
  - Public read access (anyone can view images)
  - Only authenticated users can upload images
  - Only authenticated users can delete images
  - File size limit enforced at application level
*/

-- Create the images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy: Allow public read access to all images
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Policy: Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Policy: Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
