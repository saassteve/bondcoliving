import { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { type GuestUser } from '../../lib/guestAuth';
import { User, MessageSquare, Calendar, MapPin, Mail, ArrowLeft } from 'lucide-react';

interface ProfileData {
  id: string;
  guest_user_id: string;
  bio: string | null;
  interests: string[] | null;
  profile_photo_url: string | null;
  social_links: Record<string, string> | null;
  guest_user: {
    id: string;
    full_name: string;
    user_type: string;
    created_at: string;
  };
}

export default function GuestProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { guestUser } = useOutletContext<{ guestUser: GuestUser | null }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('guest_profiles')
      .select(`
        *,
        guest_user:guest_users!inner(id, full_name, user_type, created_at)
      `)
      .eq('guest_user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
    } else {
      setProfile(data as any);
    }

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!profile || !guestUser) return;

    const { data: existingConversation } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('guest_user_id', guestUser.id)
      .maybeSingle();

    if (existingConversation) {
      navigate(`/guest/messages?conversation=${existingConversation.conversation_id}`);
    } else {
      navigate(`/guest/messages?new=${profile.guest_user_id}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getJoinedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#1E1F1E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-12 text-center backdrop-blur-sm">
            <User className="h-16 w-16 text-[#C5C5B5]/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Profile not found</h3>
            <p className="text-[#C5C5B5]/60 mb-6">This profile may not be visible or doesn't exist</p>
            <button
              onClick={() => navigate('/guest/community')}
              className="px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-xl hover:bg-white transition-all duration-300"
            >
              Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = guestUser?.id === profile.guest_user_id;

  return (
    <div className="min-h-screen bg-[#1E1F1E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <button
          onClick={() => navigate('/guest/community')}
          className="flex items-center text-[#C5C5B5] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Community
        </button>

        <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#C5C5B5] to-[#C5C5B5]/80 px-6 py-12 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.guest_user.full_name}
                  className="w-32 h-32 rounded-full border-4 border-[#1E1F1E] shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-[#1E1F1E] shadow-lg bg-[#1E1F1E] flex items-center justify-center text-[#C5C5B5] font-bold text-4xl">
                  {getInitials(profile.guest_user.full_name)}
                </div>
              )}

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-[#1E1F1E] mb-2">
                  {profile.guest_user.full_name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
                  <span className="px-3 py-1 bg-[#1E1F1E]/20 backdrop-blur-sm text-[#1E1F1E] rounded-full text-sm font-medium">
                    {profile.guest_user.user_type === 'overnight' ? 'Overnight Guest' : 'Coworking Member'}
                  </span>
                  <span className="flex items-center text-[#1E1F1E]/80 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {getJoinedDate(profile.guest_user.created_at)}
                  </span>
                </div>

                {!isOwnProfile && (
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-3 bg-[#1E1F1E] text-[#C5C5B5] rounded-xl font-semibold hover:bg-[#1E1F1E]/90 transition-all duration-300 flex items-center mx-auto sm:mx-0"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Send Message
                  </button>
                )}

                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/guest/settings')}
                    className="px-6 py-3 bg-[#1E1F1E] text-[#C5C5B5] rounded-xl font-semibold hover:bg-[#1E1F1E]/90 transition-all duration-300 mx-auto sm:mx-0"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 sm:px-8">
            {profile.bio && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-3">About</h2>
                <p className="text-[#C5C5B5]/80 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-3">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-[#C5C5B5]/20 text-[#C5C5B5] rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.social_links && Object.keys(profile.social_links).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Connect</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(profile.social_links).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-xl hover:bg-[#C5C5B5]/20 transition-all duration-300 text-sm font-medium capitalize border border-[#C5C5B5]/20"
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!profile.bio && (!profile.interests || profile.interests.length === 0) && (
              <div className="text-center py-8 text-[#C5C5B5]/60">
                {isOwnProfile ? (
                  <>
                    <p className="mb-4">Your profile is empty. Add some information about yourself!</p>
                    <button
                      onClick={() => navigate('/guest/settings')}
                      className="px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-xl hover:bg-white transition-all duration-300"
                    >
                      Complete Your Profile
                    </button>
                  </>
                ) : (
                  <p>This member hasn't added any information to their profile yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
