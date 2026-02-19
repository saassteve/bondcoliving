import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Settings, Image, Key, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { coworkingBookingService, coworkingPassService, type CoworkingBooking, type CoworkingPass } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import PassAvailabilityManager from '../../components/admin/PassAvailabilityManager';
import CoworkingImageManager from '../../components/admin/CoworkingImageManager';
import CoworkingBookingList from '../../components/admin/CoworkingBookingList';
import CoworkingCalendar from '../../components/admin/CoworkingCalendar';
import CoworkingStats from '../../components/admin/CoworkingStats';
import CoworkingPassList from '../../components/admin/CoworkingPassList';
import CoworkingCodeManager from '../../components/admin/CoworkingCodeManager';
import CoworkingBookingEditModal from '../../components/admin/CoworkingBookingEditModal';
import CoworkingPassEditModal from '../../components/admin/CoworkingPassEditModal';
import EmailQueueManager from '../../components/admin/EmailQueueManager';

interface PassCode {
  id: string;
  code: string;
  is_used: boolean;
  used_at: string | null;
  booking_id: string | null;
  created_at: string;
}

type ViewType = 'list' | 'calendar' | 'stats' | 'passes' | 'images' | 'codes' | 'emails';

const AdminCoworkingPage: React.FC = () => {
  const [bookings, setBookings] = useState<CoworkingBooking[]>([]);
  const [passes, setPasses] = useState<CoworkingPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingBooking, setEditingBooking] = useState<CoworkingBooking | null>(null);
  const [managingPass, setManagingPass] = useState<string | null>(null);
  const [editingPass, setEditingPass] = useState<CoworkingPass | null>(null);
  const [revenue, setRevenue] = useState<{ total: number; by_pass_type: Record<string, number>; count: number } | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [passCodes, setPassCodes] = useState<PassCode[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, passesData, revenueData, codesData] = await Promise.all([
        coworkingBookingService.getAll(),
        coworkingPassService.getAll(),
        coworkingBookingService.getRevenue(),
        fetchPassCodes(),
      ]);
      setBookings(bookingsData);
      setPasses(passesData);
      setRevenue(revenueData);
      setPassCodes(codesData);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchPassCodes = async (): Promise<PassCode[]> => {
    const { data, error } = await supabase
      .from('coworking_pass_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  };

  const handleSaveBookingEdit = async () => {
    if (!editingBooking) return;

    try {
      await coworkingBookingService.update(editingBooking.id, {
        customer_name: editingBooking.customer_name,
        customer_email: editingBooking.customer_email,
        customer_phone: editingBooking.customer_phone,
        start_date: editingBooking.start_date,
        booking_status: editingBooking.booking_status,
        payment_status: editingBooking.payment_status,
        access_code: editingBooking.access_code,
        special_notes: editingBooking.special_notes,
      });
      await fetchData();
      setEditingBooking(null);
    } catch {
      showFeedback('error', 'Failed to update booking.');
    }
  };

  const handleSendAccessCodeEmail = async () => {
    if (!editingBooking) return;
    if (!window.confirm('Send access code email to customer?')) return;

    try {
      setSendingEmail(editingBooking.id);
      const { data, error } = await supabase.functions.invoke('send-coworking-email', {
        body: { emailType: 'access_code', bookingId: editingBooking.id, resendEmail: true }
      });

      if (error || data?.error) {
        showFeedback('error', 'Failed to send access code email.');
        return;
      }

      if (data?.success) {
        showFeedback('success', 'Access code email sent successfully!');
        await fetchData();
      }
    } catch {
      showFeedback('error', 'Failed to send access code email.');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      await coworkingBookingService.delete(id);
      await fetchData();
    } catch {
      showFeedback('error', 'Failed to delete booking.');
    }
  };

  const handleSavePassPrice = async () => {
    if (!editingPass) return;

    try {
      const { error } = await supabase
        .from('coworking_passes')
        .update({ price: editingPass.price, is_active: editingPass.is_active })
        .eq('id', editingPass.id);

      if (error) throw error;

      showFeedback('success', 'Pass updated successfully!');
      setEditingPass(null);
      await fetchData();
    } catch {
      showFeedback('error', 'Failed to update pass.');
    }
  };

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleViewBookingFromCode = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) setEditingBooking({ ...booking });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const viewButtons: { key: ViewType; label: string; icon?: React.ReactNode }[] = [
    { key: 'list', label: 'List' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'stats', label: 'Stats' },
    { key: 'passes', label: 'Passes', icon: <Settings className="w-4 h-4 inline mr-1" /> },
    { key: 'images', label: 'Images', icon: <Image className="w-4 h-4 inline mr-1" /> },
    { key: 'codes', label: 'Codes', icon: <Key className="w-4 h-4 inline mr-1" /> },
    { key: 'emails', label: 'Emails', icon: <Mail className="w-4 h-4 inline mr-1" /> },
  ];

  return (
    <>
      <Helmet>
        <title>Coworking - Bond Admin</title>
      </Helmet>

      <div>
        {feedback && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border mb-4 ${feedback.type === 'success' ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-red-900/20 border-red-700 text-red-300'}`}>
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="text-sm">{feedback.message}</span>
          </div>
        )}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Coworking Management</h1>

          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <div className="flex items-center">
              {viewButtons.map((btn, idx) => (
                <button
                  key={btn.key}
                  onClick={() => setCurrentView(btn.key)}
                  className={`px-3 py-1 ${idx === 0 ? 'rounded-l-md' : ''} ${idx === viewButtons.length - 1 ? 'rounded-r-md' : ''} ${
                    currentView === btn.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {currentView === 'stats' && revenue && (
          <CoworkingStats revenue={revenue} passes={passes} />
        )}

        {currentView === 'list' && (
          <CoworkingBookingList
            bookings={bookings}
            filter={filter}
            onFilterChange={setFilter}
            onEdit={(booking) => setEditingBooking({ ...booking })}
            onDelete={handleDeleteBooking}
          />
        )}

        {currentView === 'calendar' && (
          <CoworkingCalendar
            bookings={bookings}
            currentMonth={currentMonth}
            onPreviousMonth={previousMonth}
            onNextMonth={nextMonth}
          />
        )}

        {currentView === 'passes' && (
          <div className="space-y-6">
            {managingPass ? (
              <PassAvailabilityManager passId={managingPass} onClose={() => setManagingPass(null)} />
            ) : (
              <CoworkingPassList
                passes={passes}
                onEditPass={(pass) => setEditingPass({ ...pass })}
                onManagePass={setManagingPass}
              />
            )}
          </div>
        )}

        {currentView === 'images' && <CoworkingImageManager />}

        {currentView === 'codes' && (
          <CoworkingCodeManager
            passCodes={passCodes}
            onRefresh={fetchData}
            onViewBooking={handleViewBookingFromCode}
          />
        )}

        {currentView === 'emails' && <EmailQueueManager />}
      </div>

      {editingBooking && (
        <CoworkingBookingEditModal
          booking={editingBooking}
          sendingEmail={sendingEmail === editingBooking.id}
          onUpdate={(updates) => setEditingBooking({ ...editingBooking, ...updates })}
          onSave={handleSaveBookingEdit}
          onCancel={() => setEditingBooking(null)}
          onSendEmail={handleSendAccessCodeEmail}
        />
      )}

      {editingPass && (
        <CoworkingPassEditModal
          pass={editingPass}
          onUpdate={(updates) => setEditingPass({ ...editingPass, ...updates })}
          onSave={handleSavePassPrice}
          onCancel={() => setEditingPass(null)}
        />
      )}
    </>
  );
};

export default AdminCoworkingPage;
