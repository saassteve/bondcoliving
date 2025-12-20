import { supabase } from '../supabase';

export interface RevenueAnalytics {
  date: string;
  building_id?: string;
  apartment_id?: string;
  revenue_type: 'apartment' | 'coworking' | 'service';
  amount: number;
  booking_count: number;
  source?: string;
}

export interface BookingAnalytics {
  date: string;
  booking_source: string;
  booking_type: 'apartment' | 'coworking';
  count: number;
  total_revenue: number;
  average_length?: number;
}

export interface OccupancyAnalytics {
  date: string;
  apartment_id: string;
  building_id?: string;
  is_occupied: boolean;
  booking_id?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  activeBookings: number;
  occupancyRate: number;
  averageBookingValue: number;
  revenueGrowth: number;
  bookingGrowth: number;
}

export interface RevenueBySource {
  source: string;
  amount: number;
  count: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  bookings: number;
}

class AnalyticsService {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get current month revenue
    const { data: currentMonthRevenue } = await supabase
      .from('revenue_analytics')
      .select('amount, booking_count')
      .gte('date', firstOfMonth.toISOString().split('T')[0]);

    // Get last month revenue for growth calculation
    const { data: lastMonthRevenue } = await supabase
      .from('revenue_analytics')
      .select('amount, booking_count')
      .gte('date', firstOfLastMonth.toISOString().split('T')[0])
      .lte('date', lastOfLastMonth.toISOString().split('T')[0]);

    // Get all apartments for occupancy calculation
    const { data: apartments } = await supabase
      .from('apartments')
      .select('id, status');

    // Get today's occupancy
    const { data: todayOccupancy } = await supabase
      .from('occupancy_analytics')
      .select('is_occupied')
      .eq('date', today.toISOString().split('T')[0]);

    // Calculate stats
    const currentRevenue = currentMonthRevenue?.reduce((sum, r) => sum + parseFloat(r.amount as any), 0) || 0;
    const currentBookings = currentMonthRevenue?.reduce((sum, r) => sum + r.booking_count, 0) || 0;

    const lastRevenue = lastMonthRevenue?.reduce((sum, r) => sum + parseFloat(r.amount as any), 0) || 0;
    const lastBookings = lastMonthRevenue?.reduce((sum, r) => sum + r.booking_count, 0) || 0;

    const totalApartments = apartments?.length || 0;
    const occupiedToday = todayOccupancy?.filter(o => o.is_occupied).length || 0;
    const occupancyRate = totalApartments > 0 ? (occupiedToday / totalApartments) * 100 : 0;

    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const bookingGrowth = lastBookings > 0 ? ((currentBookings - lastBookings) / lastBookings) * 100 : 0;

    return {
      totalRevenue: currentRevenue,
      monthlyRevenue: currentRevenue,
      totalBookings: currentBookings,
      activeBookings: currentBookings,
      occupancyRate,
      averageBookingValue: currentBookings > 0 ? currentRevenue / currentBookings : 0,
      revenueGrowth,
      bookingGrowth,
    };
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(days: number = 30): Promise<RevenueTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('date, amount, booking_count')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped = (data || []).reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, bookings: 0 };
      }
      acc[date].revenue += parseFloat(item.amount as any);
      acc[date].bookings += item.booking_count;
      return acc;
    }, {} as Record<string, RevenueTrend>);

    return Object.values(grouped);
  }

  /**
   * Get revenue breakdown by source
   */
  async getRevenueBySource(days: number = 30): Promise<RevenueBySource[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('source, amount, booking_count')
      .gte('date', startDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Group by source
    const grouped = (data || []).reduce((acc, item) => {
      const source = item.source || 'direct';
      if (!acc[source]) {
        acc[source] = { source, amount: 0, count: 0 };
      }
      acc[source].amount += parseFloat(item.amount as any);
      acc[source].count += item.booking_count;
      return acc;
    }, {} as Record<string, RevenueBySource>);

    return Object.values(grouped).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Get occupancy rate over time
   */
  async getOccupancyTrends(days: number = 30): Promise<{ date: string; rate: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: occupancyData, error } = await supabase
      .from('occupancy_analytics')
      .select('date, is_occupied')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    const { data: apartments } = await supabase
      .from('apartments')
      .select('id');

    const totalApartments = apartments?.length || 1;

    // Group by date and calculate rate
    const grouped = (occupancyData || []).reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date, occupied: 0, total: 0 };
      }
      if (item.is_occupied) acc[item.date].occupied++;
      acc[item.date].total++;
      return acc;
    }, {} as Record<string, { date: string; occupied: number; total: number }>);

    return Object.values(grouped).map(item => ({
      date: item.date,
      rate: (item.occupied / totalApartments) * 100,
    }));
  }

  /**
   * Get booking sources analytics
   */
  async getBookingSources(days: number = 30): Promise<BookingAnalytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('booking_analytics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Generate analytics data from bookings (run periodically)
   */
  async generateAnalytics(date?: Date): Promise<void> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    // Get all bookings for the date
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, apartments(building_id)')
      .lte('check_in_date', dateStr)
      .gte('check_out_date', dateStr);

    // Get coworking bookings
    const { data: coworkingBookings } = await supabase
      .from('coworking_bookings')
      .select('*')
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)
      .eq('payment_status', 'paid');

    // Generate revenue analytics for apartment bookings
    if (bookings && bookings.length > 0) {
      const revenueData = bookings.map(booking => ({
        date: dateStr,
        building_id: (booking.apartments as any)?.building_id,
        apartment_id: booking.apartment_id,
        revenue_type: 'apartment' as const,
        amount: booking.total_amount || 0,
        booking_count: 1,
        source: booking.booking_source,
      }));

      await supabase
        .from('revenue_analytics')
        .upsert(revenueData, { onConflict: 'date,building_id,apartment_id,revenue_type,source' });
    }

    // Generate revenue analytics for coworking
    if (coworkingBookings && coworkingBookings.length > 0) {
      const coworkingRevenue = coworkingBookings.reduce((sum, b) => sum + parseFloat(b.total_amount as any), 0);

      await supabase
        .from('revenue_analytics')
        .upsert({
          date: dateStr,
          revenue_type: 'coworking',
          amount: coworkingRevenue,
          booking_count: coworkingBookings.length,
          source: 'direct',
        }, { onConflict: 'date,building_id,apartment_id,revenue_type,source' });
    }

    // Generate occupancy analytics
    if (bookings) {
      const occupancyData = bookings.map(booking => ({
        date: dateStr,
        apartment_id: booking.apartment_id,
        building_id: (booking.apartments as any)?.building_id,
        is_occupied: true,
        booking_id: booking.id,
      }));

      await supabase
        .from('occupancy_analytics')
        .upsert(occupancyData, { onConflict: 'date,apartment_id' });
    }
  }
}

export const analyticsService = new AnalyticsService();
