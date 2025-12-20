import { supabase } from '../supabase';

export interface CleaningSchedule {
  id: string;
  apartment_id: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  checklist?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  apartments?: {
    title: string;
    building_id?: string;
  };
}

export interface MaintenanceRequest {
  id: string;
  apartment_id?: string;
  building_id?: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'cleaning' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';
  reported_by?: string;
  assigned_to?: string;
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_date?: string;
  completed_date?: string;
  images?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  apartments?: {
    title: string;
  };
  buildings?: {
    name: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: 'cleaning' | 'maintenance' | 'inspection' | 'guest_service' | 'administrative' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_date?: string;
  assigned_to?: string;
  created_by?: string;
  related_apartment_id?: string;
  related_building_id?: string;
  related_booking_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

class OperationsService {
  // Cleaning Schedules
  async getCleaningSchedules(): Promise<CleaningSchedule[]> {
    const { data, error } = await supabase
      .from('cleaning_schedules')
      .select(`
        *,
        apartments (
          title,
          building_id
        )
      `)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getCleaningSchedule(id: string): Promise<CleaningSchedule> {
    const { data, error } = await supabase
      .from('cleaning_schedules')
      .select(`
        *,
        apartments (
          title,
          building_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createCleaningSchedule(schedule: Omit<CleaningSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<CleaningSchedule> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('cleaning_schedules')
      .insert({
        ...schedule,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCleaningSchedule(id: string, updates: Partial<CleaningSchedule>): Promise<CleaningSchedule> {
    const { data, error } = await supabase
      .from('cleaning_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCleaningSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('cleaning_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Maintenance Requests
  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        apartments (
          title
        ),
        buildings (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMaintenanceRequest(id: string): Promise<MaintenanceRequest> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        apartments (
          title
        ),
        buildings (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createMaintenanceRequest(request: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceRequest> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        ...request,
        reported_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMaintenanceRequest(id: string, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMaintenanceRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('maintenance_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  }

  async getTask(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Utility methods
  async getUpcomingCleanings(days: number = 7): Promise<CleaningSchedule[]> {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    const { data, error } = await supabase
      .from('cleaning_schedules')
      .select(`
        *,
        apartments (
          title,
          building_id
        )
      `)
      .gte('scheduled_date', today.toISOString())
      .lte('scheduled_date', future.toISOString())
      .in('status', ['scheduled', 'in_progress'])
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getOverdueTasks(): Promise<Task[]> {
    const today = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lt('due_date', today)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getUrgentMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        apartments (
          title
        ),
        buildings (
          name
        )
      `)
      .in('priority', ['high', 'urgent'])
      .in('status', ['open', 'in_progress'])
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const operationsService = new OperationsService();
