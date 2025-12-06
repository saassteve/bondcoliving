import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { updateGuestProfile, type GuestUser } from '../../lib/guestAuth';
import { User, MessageSquare, Bell, Save } from 'lucide-react';

export default function GuestSettingsPage() {
  const { guestUser } = useOutletContext<{ guestUser: GuestUser | null }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    if (guestUser) {
      loadSettings();
    }
  }, [guestUser]);

  const loadSettings = async () => {
    if (!guestUser) return;

    const [profileData, prefsData] = await Promise.all([
      supabase
        .from('guest_profiles')
        .select('*')
        .eq('guest_user_id', guestUser.id)
        .maybeSingle(),
      supabase
        .from('messaging_preferences')
        .select('*')
        .eq('guest_user_id', guestUser.id)
        .maybeSingle(),
    ]);

    if (profileData.data) {
      setBio(profileData.data.bio || '');
      setInterests(profileData.data.interests?.join(', ') || '');
      setShowInDirectory(profileData.data.show_in_directory ?? true);
    }

    if (prefsData.data) {
      setAllowMessages(prefsData.data.allow_messages ?? true);
      setEmailNotifications(prefsData.data.email_notifications ?? true);
      setPushNotifications(prefsData.data.push_notifications ?? true);
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!guestUser) return;

    setSaving(true);
    setMessage(null);

    const interestsArray = interests
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const result = await updateGuestProfile(guestUser.id, {
      bio,
      interests: interestsArray,
      show_in_directory: showInDirectory,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }

    setSaving(false);
  };

  const handleSavePreferences = async () => {
    if (!guestUser) return;

    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('messaging_preferences')
      .update({
        allow_messages: allowMessages,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        updated_at: new Date().toISOString(),
      })
      .eq('guest_user_id', guestUser.id);

    if (!error) {
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Profile Information
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={guestUser?.full_name || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Name cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={guestUser?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell the community about yourself..."
            />
          </div>

          <div>
            <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
              Interests
            </label>
            <input
              type="text"
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Hiking, Coffee, Tech, Music (comma-separated)"
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple interests with commas</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showInDirectory"
              checked={showInDirectory}
              onChange={(e) => setShowInDirectory(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showInDirectory" className="ml-2 block text-sm text-gray-700">
              Show my profile in the community directory
            </label>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Privacy & Messaging */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          Privacy & Messaging
        </h2>

        <div className="space-y-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="allowMessages"
              checked={allowMessages}
              onChange={(e) => setAllowMessages(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <div className="ml-3">
              <label htmlFor="allowMessages" className="block text-sm font-medium text-gray-700">
                Allow messages from other members
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Other community members can send you direct messages
              </p>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Bell className="h-5 w-5 mr-2 text-blue-600" />
          Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <div className="ml-3">
              <label htmlFor="emailNotifications" className="block text-sm font-medium text-gray-700">
                Email notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Receive important updates and announcements via email
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="pushNotifications"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <div className="ml-3">
              <label htmlFor="pushNotifications" className="block text-sm font-medium text-gray-700">
                Push notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Receive real-time notifications for messages and events
              </p>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
