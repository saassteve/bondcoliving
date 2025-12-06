import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateInvitationCode } from '../../lib/guestAuth';
import { Users, Plus, Mail, Copy, Check, Calendar } from 'lucide-react';

interface GuestUser {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  status: string;
  access_start_date: string;
  access_end_date: string;
  created_at: string;
}

interface Invitation {
  id: string;
  invitation_code: string;
  email: string;
  full_name: string;
  user_type: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export default function AdminGuestsPage() {
  const [activeTab, setActiveTab] = useState<'guests' | 'invitations'>('guests');
  const [guests, setGuests] = useState<GuestUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    user_type: 'overnight' as 'overnight' | 'coworking',
    access_days: 30,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);

    if (activeTab === 'guests') {
      const { data } = await supabase
        .from('guest_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setGuests(data);
    } else {
      const { data } = await supabase
        .from('guest_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setInvitations(data);
    }

    setLoading(false);
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = generateInvitationCode();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + inviteForm.access_days);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase.from('guest_invitations').insert({
      invitation_code: code,
      email: inviteForm.email,
      full_name: inviteForm.full_name,
      user_type: inviteForm.user_type,
      access_start_date: startDate.toISOString(),
      access_end_date: endDate.toISOString(),
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    });

    if (!error) {
      setShowInviteModal(false);
      setInviteForm({
        email: '',
        full_name: '',
        user_type: 'overnight',
        access_days: 30,
      });
      loadData();
    }
  };

  const copyInvitationLink = (code: string) => {
    const link = `${window.location.origin}/guest/register?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Guest Platform</h1>
          <p className="text-gray-300">Manage guest access and invitations</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Invitation
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('guests')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'guests'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Active Guests ({guests.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'invitations'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Invitations ({invitations.filter(i => !i.used).length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : activeTab === 'guests' ? (
        <div className="bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Access Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{guest.full_name}</div>
                      <div className="text-sm text-gray-400">{guest.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      guest.user_type === 'overnight'
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        : 'bg-green-900/50 text-green-300 border border-green-700'
                    }`}>
                      {guest.user_type === 'overnight' ? 'Overnight' : 'Coworking'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {formatDate(guest.access_start_date)} - {formatDate(guest.access_end_date)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      guest.status === 'active'
                        ? 'bg-green-900/50 text-green-300 border border-green-700'
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {guest.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {formatDate(guest.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Guest Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Invitation Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{invitation.full_name}</div>
                      <div className="text-sm text-gray-400">{invitation.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-gray-700 rounded text-sm font-mono text-gray-300">
                      {invitation.invitation_code}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      invitation.user_type === 'overnight'
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        : 'bg-green-900/50 text-green-300 border border-green-700'
                    }`}>
                      {invitation.user_type === 'overnight' ? 'Overnight' : 'Coworking'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      invitation.used
                        ? 'bg-gray-700 text-gray-300 border border-gray-600'
                        : 'bg-green-900/50 text-green-300 border border-green-700'
                    }`}>
                      {invitation.used ? 'Used' : 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {formatDate(invitation.expires_at)}
                  </td>
                  <td className="px-6 py-4">
                    {!invitation.used && (
                      <button
                        onClick={() => copyInvitationLink(invitation.invitation_code)}
                        className="flex items-center text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        {copiedCode === invitation.invitation_code ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Create Guest Invitation</h2>

            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Guest Type
                </label>
                <select
                  value={inviteForm.user_type}
                  onChange={(e) => setInviteForm({ ...inviteForm, user_type: e.target.value as 'overnight' | 'coworking' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="overnight">Overnight Guest</option>
                  <option value="coworking">Coworking Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Duration (Days)
                </label>
                <input
                  type="number"
                  value={inviteForm.access_days}
                  onChange={(e) => setInviteForm({ ...inviteForm, access_days: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
