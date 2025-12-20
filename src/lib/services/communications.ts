import { supabase } from '../supabase';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: 'booking_confirmation' | 'check_in_reminder' | 'check_out_reminder' | 'welcome' | 'follow_up' | 'custom';
  variables: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledMessage {
  id: string;
  template_id?: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body: string;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  error_message?: string;
  booking_id?: string;
  coworking_booking_id?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export interface MessageHistory {
  id: string;
  message_type: 'email' | 'sms' | 'notification';
  recipient_email?: string;
  recipient_phone?: string;
  subject?: string;
  body: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  booking_id?: string;
  coworking_booking_id?: string;
  guest_user_id?: string;
  template_id?: string;
  metadata?: Record<string, any>;
  created_by?: string;
}

export interface BulkMessage {
  id: string;
  campaign_name: string;
  template_id?: string;
  subject: string;
  body: string;
  recipient_filter: Record<string, any>;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

class CommunicationsService {
  // Email Templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...template,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Scheduled Messages
  async getScheduledMessages(): Promise<ScheduledMessage[]> {
    const { data, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .order('scheduled_for', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createScheduledMessage(message: Omit<ScheduledMessage, 'id' | 'created_at'>): Promise<ScheduledMessage> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('scheduled_messages')
      .insert({
        ...message,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateScheduledMessage(id: string, updates: Partial<ScheduledMessage>): Promise<ScheduledMessage> {
    const { data, error } = await supabase
      .from('scheduled_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteScheduledMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Message History
  async getMessageHistory(limit: number = 100): Promise<MessageHistory[]> {
    const { data, error } = await supabase
      .from('message_history')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getBookingMessages(bookingId: string): Promise<MessageHistory[]> {
    const { data, error } = await supabase
      .from('message_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Bulk Messages
  async getBulkMessages(): Promise<BulkMessage[]> {
    const { data, error } = await supabase
      .from('bulk_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createBulkMessage(message: Omit<BulkMessage, 'id' | 'created_at' | 'updated_at' | 'sent_count' | 'failed_count'>): Promise<BulkMessage> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('bulk_messages')
      .insert({
        ...message,
        sent_count: 0,
        failed_count: 0,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateBulkMessage(id: string, updates: Partial<BulkMessage>): Promise<BulkMessage> {
    const { data, error } = await supabase
      .from('bulk_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Utility Methods
  renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, variables[key] || '');
    });
    return rendered;
  }

  async sendImmediateEmail(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    body: string,
    bookingId?: string
  ): Promise<void> {
    // This would integrate with your email sending service
    // For now, we'll create a scheduled message for immediate sending
    await this.createScheduledMessage({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      body,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      booking_id: bookingId,
    });
  }
}

export const communicationsService = new CommunicationsService();
