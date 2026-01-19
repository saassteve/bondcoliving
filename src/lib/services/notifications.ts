import { supabase } from '../supabase';

export interface AdminNotification {
  id: string;
  admin_user_id: string | null;
  booking_id: string | null;
  notification_type: 'new_booking' | 'payment_received' | 'booking_cancelled' | 'booking_modified' | 'check_in' | 'check_out' | 'payment_failed' | 'system_alert';
  title: string;
  message: string;
  metadata: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
}

export async function getNotifications(limit = 20): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(): Promise<number> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.email) return 0;

  const { data, error } = await supabase
    .rpc('get_unread_notification_count', { p_admin_email: user.user.email });

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return data || 0;
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('mark_notification_read', { p_notification_id: notificationId });

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return data || false;
}

export async function markAllAsRead(): Promise<number> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.email) return 0;

  const { data, error } = await supabase
    .rpc('mark_all_notifications_read', { p_admin_email: user.user.email });

  if (error) {
    console.error('Error marking all as read:', error);
    return 0;
  }

  return data || 0;
}

export function subscribeToNotifications(
  callback: (notification: AdminNotification) => void
) {
  const channel = supabase
    .channel('admin_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications',
      },
      (payload) => {
        callback(payload.new as AdminNotification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
