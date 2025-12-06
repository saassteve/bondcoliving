/*
  # Guest Platform Schema

  1. New Tables
    - `guest_users`
      - Extended user profile linked to auth.users
      - Stores user type (overnight/coworking), status, and dates
      - Links to bookings or coworking passes
    
    - `guest_profiles`
      - Public profile information (bio, interests, photo)
      - Controls directory visibility
      - Separate from core user data for privacy
    
    - `messaging_preferences`
      - Opt-in/opt-out controls for messaging
      - Block list management
      - Notification preferences
    
    - `conversations`
      - Direct message threads between users
      - Tracks last message and activity
    
    - `messages`
      - Individual messages in conversations
      - Support for text and future media
      - Read status tracking
    
    - `conversation_participants`
      - Links users to conversations
      - Tracks read status per participant
    
    - `guest_invitations`
      - Invitation codes for platform access
      - Supports both overnight and coworking guests
      - Tracks usage and expiration
    
    - `local_content`
      - Tips, guides, and local information
      - Categorized content with visibility rules
      - Rich text support
    
    - `community_events`
      - Events calendar for community
      - RSVP tracking
      - Visible to all platform users
    
    - `event_rsvps`
      - Tracks event attendance
      - Links guests to events
    
    - `announcements`
      - Admin communications
      - Target audience selection
      - Scheduling support
    
    - `announcement_reads`
      - Tracks who read each announcement
      - Engagement analytics
    
    - `service_requests`
      - Maintenance and service requests
      - Overnight guests only
      - Status tracking
    
    - `stay_extension_requests`
      - Request to extend current stay
      - Overnight guests only
      - Payment integration
  
  2. Security
    - Enable RLS on all tables
    - Policies for guest access based on user type
    - Admin full access policies
    - Privacy controls for messaging and profiles
*/

-- Guest Users Table
CREATE TABLE IF NOT EXISTS guest_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('overnight', 'coworking')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  access_start_date timestamptz NOT NULL,
  access_end_date timestamptz NOT NULL,
  grace_period_days integer DEFAULT 7,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Guest Profiles Table (Public Information)
CREATE TABLE IF NOT EXISTS guest_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio text,
  interests text[], -- Array of interests
  profile_photo_url text,
  social_links jsonb DEFAULT '{}', -- {instagram: "url", linkedin: "url", etc}
  show_in_directory boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messaging Preferences
CREATE TABLE IF NOT EXISTS messaging_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  allow_messages boolean DEFAULT true,
  blocked_users uuid[] DEFAULT '{}',
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  created_at timestamptz DEFAULT now()
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE NOT NULL,
  last_read_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, guest_user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES guest_users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Guest Invitations Table
CREATE TABLE IF NOT EXISTS guest_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code text UNIQUE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('overnight', 'coworking')),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  access_start_date timestamptz NOT NULL,
  access_end_date timestamptz NOT NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  used_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Local Content Table
CREATE TABLE IF NOT EXISTS local_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('dining', 'activities', 'transport', 'essentials', 'building', 'emergency')),
  content text NOT NULL,
  visibility text NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'overnight', 'coworking')),
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  featured boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Community Events Table
CREATE TABLE IF NOT EXISTS community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  location text NOT NULL,
  max_attendees integer,
  image_url text,
  is_published boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event RSVPs Table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES community_events(id) ON DELETE CASCADE NOT NULL,
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, guest_user_id)
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'overnight', 'coworking')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  is_pinned boolean DEFAULT false,
  is_published boolean DEFAULT true,
  scheduled_for timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Announcement Reads Table
CREATE TABLE IF NOT EXISTS announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, guest_user_id)
);

-- Service Requests Table (Overnight Guests Only)
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('maintenance', 'cleaning', 'supplies', 'other')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  photos jsonb DEFAULT '[]',
  admin_notes text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stay Extension Requests Table (Overnight Guests Only)
CREATE TABLE IF NOT EXISTS stay_extension_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid REFERENCES guest_users(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE NOT NULL,
  current_checkout_date timestamptz NOT NULL,
  requested_checkout_date timestamptz NOT NULL,
  nights_extended integer NOT NULL,
  total_price decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'completed')),
  payment_intent_id text,
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_users_user_id ON guest_users(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_users_booking_id ON guest_users(booking_id);
CREATE INDEX IF NOT EXISTS idx_guest_users_status ON guest_users(status);
CREATE INDEX IF NOT EXISTS idx_guest_users_access_dates ON guest_users(access_start_date, access_end_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_guest_user_id ON conversation_participants(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_guest_user_id ON event_rsvps(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_guest_user_id ON service_requests(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- Enable Row Level Security
ALTER TABLE guest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_extension_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_users
CREATE POLICY "Authenticated users can view active guest users"
  ON guest_users FOR SELECT
  TO authenticated
  USING (status = 'active' AND NOW() BETWEEN access_start_date AND access_end_date);

CREATE POLICY "Users can view own guest user record"
  ON guest_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own guest user record"
  ON guest_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to guest users"
  ON guest_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        SELECT email FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- RLS Policies for guest_profiles
CREATE POLICY "Active guests can view profiles in directory"
  ON guest_profiles FOR SELECT
  TO authenticated
  USING (
    show_in_directory = true 
    AND EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = guest_profiles.guest_user_id
      AND gu.status = 'active'
      AND NOW() BETWEEN gu.access_start_date AND gu.access_end_date
    )
  );

CREATE POLICY "Users can view own profile"
  ON guest_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = guest_profiles.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON guest_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = guest_profiles.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = guest_profiles.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own profile"
  ON guest_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = guest_profiles.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

-- RLS Policies for messaging_preferences
CREATE POLICY "Users can view own messaging preferences"
  ON messaging_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = messaging_preferences.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messaging preferences"
  ON messaging_preferences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = messaging_preferences.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = messaging_preferences.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messaging preferences"
  ON messaging_preferences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = messaging_preferences.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN guest_users gu ON cp.guest_user_id = gu.id
      WHERE cp.conversation_id = conversations.id
      AND gu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants in own conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = conversation_participants.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      JOIN guest_users gu ON cp2.guest_user_id = gu.id
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND gu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversation participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = conversation_participants.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users
      WHERE guest_users.id = conversation_participants.guest_user_id
      AND guest_users.user_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN guest_users gu ON cp.guest_user_id = gu.id
      WHERE cp.conversation_id = messages.conversation_id
      AND gu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN guest_users gu ON cp.guest_user_id = gu.id
      WHERE cp.conversation_id = messages.conversation_id
      AND gu.user_id = auth.uid()
      AND gu.id = messages.sender_id
    )
  );

-- RLS Policies for guest_invitations
CREATE POLICY "Admins can manage guest invitations"
  ON guest_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Anyone can view unused invitation by code"
  ON guest_invitations FOR SELECT
  TO anon, authenticated
  USING (used = false AND expires_at > NOW());

-- RLS Policies for local_content
CREATE POLICY "Active guests can view published content"
  ON local_content FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.user_id = auth.uid()
      AND gu.status = 'active'
      AND NOW() BETWEEN gu.access_start_date AND gu.access_end_date
      AND (
        local_content.visibility = 'all' 
        OR local_content.visibility = gu.user_type
      )
    )
  );

CREATE POLICY "Admins can manage local content"
  ON local_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for community_events
CREATE POLICY "Active guests can view published events"
  ON community_events FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND event_date >= NOW() - INTERVAL '7 days'
    AND EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.user_id = auth.uid()
      AND gu.status = 'active'
    )
  );

CREATE POLICY "Admins can manage community events"
  ON community_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for event_rsvps
CREATE POLICY "Active guests can view RSVPs for events"
  ON event_rsvps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.user_id = auth.uid()
      AND gu.status = 'active'
    )
  );

CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = event_rsvps.guest_user_id
      AND gu.user_id = auth.uid()
      AND gu.status = 'active'
    )
  );

CREATE POLICY "Users can update own RSVPs"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = event_rsvps.guest_user_id
      AND gu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = event_rsvps.guest_user_id
      AND gu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own RSVPs"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = event_rsvps.guest_user_id
      AND gu.user_id = auth.uid()
    )
  );

-- RLS Policies for announcements
CREATE POLICY "Active guests can view published announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND (scheduled_for IS NULL OR scheduled_for <= NOW())
    AND EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.user_id = auth.uid()
      AND gu.status = 'active'
      AND (
        announcements.target_audience = 'all' 
        OR announcements.target_audience = gu.user_type
      )
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for announcement_reads
CREATE POLICY "Users can view own announcement reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = announcement_reads.guest_user_id
      AND gu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark announcements as read"
  ON announcement_reads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = announcement_reads.guest_user_id
      AND gu.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all announcement reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for service_requests
CREATE POLICY "Overnight guests can view own service requests"
  ON service_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = service_requests.guest_user_id
      AND gu.user_id = auth.uid()
      AND gu.user_type = 'overnight'
    )
  );

CREATE POLICY "Overnight guests can create service requests"
  ON service_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = service_requests.guest_user_id
      AND gu.user_id = auth.uid()
      AND gu.user_type = 'overnight'
      AND gu.status = 'active'
    )
  );

CREATE POLICY "Admins can manage all service requests"
  ON service_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for stay_extension_requests
CREATE POLICY "Overnight guests can view own extension requests"
  ON stay_extension_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = stay_extension_requests.guest_user_id
      AND gu.user_id = auth.uid()
      AND gu.user_type = 'overnight'
    )
  );

CREATE POLICY "Overnight guests can create extension requests"
  ON stay_extension_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_users gu
      WHERE gu.id = stay_extension_requests.guest_user_id
      AND gu.user_id = auth.uid()
      AND gu.user_type = 'overnight'
      AND gu.status = 'active'
    )
  );

CREATE POLICY "Admins can manage all extension requests"
  ON stay_extension_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to automatically expire guest access
CREATE OR REPLACE FUNCTION expire_guest_access()
RETURNS void AS $$
BEGIN
  UPDATE guest_users
  SET status = 'expired'
  WHERE status = 'active'
  AND NOW() > (access_end_date + (grace_period_days || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*)::integer INTO count
  FROM messages m
  JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
  JOIN guest_users gu ON cp.guest_user_id = gu.id
  WHERE gu.user_id = user_uuid
  AND m.created_at > cp.last_read_at
  AND m.sender_id != gu.id;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
