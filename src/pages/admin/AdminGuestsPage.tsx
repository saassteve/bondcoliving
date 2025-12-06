import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateInvitationCode } from '../../lib/guestAuth';
import { Users, Plus, Mail, Copy, Check, Calendar, Trash2, X } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'guest' | 'invitation'; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create invitations');
        setSubmitting(false);
        return;
      }

      // Generate invitation data
      const code = generateInvitationCode();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + inviteForm.access_days);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Insert invitation (RLS policy will verify admin access)
      const { error: insertError } = await supabase.from('guest_invitations').insert({
        invitation_code: code,
        email: inviteForm.email,
        full_name: inviteForm.full_name,
        user_type: inviteForm.user_type,
        access_start_date: startDate.toISOString(),
        access_end_date: endDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      });

      if (insertError) {
        console.error('Error creating invitation:', insertError);

        // Check if it's a permission error
        if (insertError.code === '42501' || insertError.message.includes('permission')) {
          setError('Admin access required. Please ensure you are logged in as an admin.');
        } else {
          setError(`Failed to create invitation: ${insertError.message}`);
        }
        setSubmitting(false);
        return;
      }

      // Success!
      setSuccess(`Invitation created successfully for ${inviteForm.full_name}`);
      setShowInviteModal(false);
      setInviteForm({
        email: '',
        full_name: '',
        user_type: 'overnight',
        access_days: 30,
      });

      // Switch to invitations tab and reload data
      setActiveTab('invitations');
      await loadData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Unexpected error creating invitation:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
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

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      if (deleteConfirm.type === 'guest') {
        // Delete guest user (cascade will handle related records)
        const { error: deleteError } = await supabase
          .from('guest_users')
          .delete()
          .eq('id', deleteConfirm.id);

        if (deleteError) {
          console.error('Error deleting guest:', deleteError);
          setError(`Failed to delete guest: ${deleteError.message}`);
        } else {
          setSuccess(`Successfully deleted guest: ${deleteConfirm.name}`);
          await loadData();
        }
      } else {
        // Delete invitation
        const { error: deleteError } = await supabase
          .from('guest_invitations')
          .delete()
          .eq('id', deleteConfirm.id);

        if (deleteError) {
          console.error('Error deleting invitation:', deleteError);
          setError(`Failed to delete invitation: ${deleteError.message}`);
        } else {
          setSuccess(`Successfully deleted invitation for: ${deleteConfirm.name}`);
          await loadData();
        }
      }

      setDeleteConfirm(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Unexpected error during deletion:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8">
      {success && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200 flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Actions</th>
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
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDeleteConfirm({ type: 'guest', id: guest.id, name: guest.full_name })}
                      className="text-red-400 hover:text-red-300 transition"
                      title="Delete guest"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                    <div className="flex items-center gap-3">
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
                      {!invitation.used && (
                        <button
                          onClick={() => setDeleteConfirm({ type: 'invitation', id: invitation.id, name: invitation.full_name })}
                          className="text-red-400 hover:text-red-300 transition"
                          title="Delete invitation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

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
                  onClick={() => {
                    setShowInviteModal(false);
                    setError(null);
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-red-900/50 rounded-full p-3 mr-3">
                  <Trash2 className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
                  <p className="text-sm text-gray-400 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-300">
                Are you sure you want to delete {deleteConfirm.type === 'guest' ? 'the guest account for' : 'the invitation for'}{' '}
                <strong className="text-white">{deleteConfirm.name}</strong>?
              </p>
              {deleteConfirm.type === 'guest' && (
                <p className="text-sm text-red-400 mt-2">
                  This will permanently delete all associated data including messages, service requests, and preferences.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
