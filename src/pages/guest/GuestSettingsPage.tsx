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
    <div className="min-h-screen bg-[#1E1F1E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-[#C5C5B5]/80">Manage your profile and preferences</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl border backdrop-blur-sm ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 mb-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <User className="h-5 w-5 mr-2 text-[#C5C5B5]" />
            Profile Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={guestUser?.full_name || ''}
                disabled
                className="w-full px-4 py-3 border border-[#C5C5B5]/20 rounded-xl bg-[#1E1F1E]/60 text-[#C5C5B5]/50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-[#C5C5B5]/50">Name cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                Email
              </label>
              <input
                type="email"
                value={guestUser?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-[#C5C5B5]/20 rounded-xl bg-[#1E1F1E]/60 text-[#C5C5B5]/50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-[#C5C5B5]/50">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-[#C5C5B5] mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[#1E1F1E]/40 border border-[#C5C5B5]/20 rounded-xl text-white placeholder-[#C5C5B5]/50 focus:ring-2 focus:ring-[#C5C5B5]/50 focus:border-[#C5C5B5]/50"
                placeholder="Tell the community about yourself..."
              />
            </div>

            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-[#C5C5B5] mb-2">
                Interests
              </label>
              <input
                type="text"
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="w-full px-4 py-3 bg-[#1E1F1E]/40 border border-[#C5C5B5]/20 rounded-xl text-white placeholder-[#C5C5B5]/50 focus:ring-2 focus:ring-[#C5C5B5]/50 focus:border-[#C5C5B5]/50"
                placeholder="Hiking, Coffee, Tech, Music (comma-separated)"
              />
              <p className="mt-1 text-xs text-[#C5C5B5]/50">Separate multiple interests with commas</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showInDirectory"
                checked={showInDirectory}
                onChange={(e) => setShowInDirectory(e.target.checked)}
                className="h-4 w-4 text-[#C5C5B5] focus:ring-[#C5C5B5] border-[#C5C5B5]/30 rounded"
              />
              <label htmlFor="showInDirectory" className="ml-2 block text-sm text-[#C5C5B5]">
                Show my profile in the community directory
              </label>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-xl font-semibold hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Privacy & Messaging */}
        <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 mb-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-[#C5C5B5]" />
            Privacy & Messaging
          </h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="allowMessages"
                checked={allowMessages}
                onChange={(e) => setAllowMessages(e.target.checked)}
                className="h-4 w-4 text-[#C5C5B5] focus:ring-[#C5C5B5] border-[#C5C5B5]/30 rounded mt-1"
              />
              <div className="ml-3">
                <label htmlFor="allowMessages" className="block text-sm font-medium text-[#C5C5B5]">
                  Allow messages from other members
                </label>
                <p className="text-xs text-[#C5C5B5]/60 mt-1">
                  Other community members can send you direct messages
                </p>
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-xl font-semibold hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-[#C5C5B5]" />
            Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 text-[#C5C5B5] focus:ring-[#C5C5B5] border-[#C5C5B5]/30 rounded mt-1"
              />
              <div className="ml-3">
                <label htmlFor="emailNotifications" className="block text-sm font-medium text-[#C5C5B5]">
                  Email notifications
                </label>
                <p className="text-xs text-[#C5C5B5]/60 mt-1">
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
                className="h-4 w-4 text-[#C5C5B5] focus:ring-[#C5C5B5] border-[#C5C5B5]/30 rounded mt-1"
              />
              <div className="ml-3">
                <label htmlFor="pushNotifications" className="block text-sm font-medium text-[#C5C5B5]">
                  Push notifications
                </label>
                <p className="text-xs text-[#C5C5B5]/60 mt-1">
                  Receive real-time notifications for messages and events
                </p>
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-xl font-semibold hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
