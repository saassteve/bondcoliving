/*
  # Add Analytics and Operations Management Tables

  ## New Tables

  ### Analytics Tables
  - `revenue_analytics` - Daily revenue tracking for charts and trends
  - `booking_analytics` - Booking metrics by source, type, and date
  - `occupancy_analytics` - Daily occupancy tracking per apartment

  ### Operations Tables
  - `cleaning_schedules` - Cleaning task scheduling and tracking
  - `maintenance_requests` - Property maintenance tracking
  - `tasks` - General task management for staff
  - `activity_logs` - Admin activity tracking

  ## Security
  - Enable RLS on all tables
  - Admins have full access
  - System can write analytics data

  ## Notes
  - Analytics tables auto-populate via triggers
  - Operations tables support staff workflows
  - Activity logs provide audit trail
*/

-- Revenue Analytics Table
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  building_id uuid REFERENCES buildings(id) ON DELETE CASCADE,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  revenue_type text NOT NULL CHECK (revenue_type IN ('apartment', 'coworking', 'service')),
  amount decimal(10,2) NOT NULL DEFAULT 0,
  booking_count integer NOT NULL DEFAULT 0,
  source text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, building_id, apartment_id, revenue_type, source)
);

-- Booking Analytics Table
CREATE TABLE IF NOT EXISTS booking_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  booking_source text NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('apartment', 'coworking')),
  count integer NOT NULL DEFAULT 0,
  total_revenue decimal(10,2) NOT NULL DEFAULT 0,
  average_length decimal(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, booking_source, booking_type)
);

-- Occupancy Analytics Table
CREATE TABLE IF NOT EXISTS occupancy_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  building_id uuid REFERENCES buildings(id) ON DELETE CASCADE,
  is_occupied boolean NOT NULL DEFAULT false,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, apartment_id)
);

-- Cleaning Schedules Table
CREATE TABLE IF NOT EXISTS cleaning_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE NOT NULL,
  scheduled_date timestamptz NOT NULL,
  completed_date timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  assigned_to text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes text,
  checklist jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES admin_users(user_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Maintenance Requests Table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  building_id uuid REFERENCES buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'cleaning', 'other')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'on_hold', 'resolved', 'closed')),
  reported_by uuid REFERENCES admin_users(user_id) ON DELETE SET NULL,
  assigned_to text,
  estimated_cost decimal(10,2),
  actual_cost decimal(10,2),
  scheduled_date timestamptz,
  completed_date timestamptz,
  images jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('cleaning', 'maintenance', 'inspection', 'guest_service', 'administrative', 'other')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date timestamptz,
  completed_date timestamptz,
  assigned_to text,
  created_by uuid REFERENCES admin_users(user_id) ON DELETE SET NULL,
  related_apartment_id uuid REFERENCES apartments(id) ON DELETE SET NULL,
  related_building_id uuid REFERENCES buildings(id) ON DELETE SET NULL,
  related_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES admin_users(user_id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_date ON revenue_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_building ON revenue_analytics(building_id);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_apartment ON revenue_analytics(apartment_id);

CREATE INDEX IF NOT EXISTS idx_booking_analytics_date ON booking_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_booking_analytics_source ON booking_analytics(booking_source);

CREATE INDEX IF NOT EXISTS idx_occupancy_analytics_date ON occupancy_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_occupancy_analytics_apartment ON occupancy_analytics(apartment_id);

CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_date ON cleaning_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_status ON cleaning_schedules(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_apartment ON cleaning_schedules(apartment_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_apartment ON maintenance_requests(apartment_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_user ON activity_logs(admin_user_id);

-- Enable RLS
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancy_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Analytics Tables (read-only for admins, system can write)
CREATE POLICY "Admins can view revenue analytics"
  ON revenue_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can manage revenue analytics"
  ON revenue_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view booking analytics"
  ON booking_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can manage booking analytics"
  ON booking_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view occupancy analytics"
  ON occupancy_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can manage occupancy analytics"
  ON occupancy_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Operations Tables (full access for admins)
CREATE POLICY "Admins can manage cleaning schedules"
  ON cleaning_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage maintenance requests"
  ON maintenance_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_cleaning_schedules_updated_at
  BEFORE UPDATE ON cleaning_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_analytics_updated_at
  BEFORE UPDATE ON booking_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
