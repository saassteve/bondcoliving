import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { type GuestUser } from '../../lib/guestAuth';
import { Users, Search, MessageSquare } from 'lucide-react';

interface MemberProfile {
  id: string;
  guest_user_id: string;
  bio: string | null;
  interests: string[] | null;
  profile_photo_url: string | null;
  guest_user: {
    full_name: string;
    user_type: string;
    created_at: string;
  };
}

export default function GuestCommunityPage() {
  const { guestUser } = useOutletContext<{ guestUser: GuestUser | null }>();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, selectedInterest, members]);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('guest_profiles')
      .select(`
        *,
        guest_user:guest_users!inner(full_name, user_type, created_at)
      `)
      .eq('show_in_directory', true);

    if (error) {
      console.error('Error loading members:', error);
    } else if (data) {
      setMembers(data as any);
      setFilteredMembers(data as any);
    }

    setLoading(false);
  };

  const filterMembers = () => {
    let filtered = [...members];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.guest_user.full_name.toLowerCase().includes(query) ||
          member.bio?.toLowerCase().includes(query) ||
          member.interests?.some((interest) => interest.toLowerCase().includes(query))
      );
    }

    if (selectedInterest) {
      filtered = filtered.filter((member) =>
        member.interests?.some((interest) => interest.toLowerCase() === selectedInterest.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  };

  const allInterests = Array.from(
    new Set(
      members.flatMap((member) => member.interests || [])
    )
  ).sort();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getJoinedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Users className="h-8 w-8 mr-3 text-blue-600" />
          Community
        </h1>
        <p className="text-gray-600">Connect with {members.length} members in the Bond community</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, bio, or interests..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <select
              value={selectedInterest}
              onChange={(e) => setSelectedInterest(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Interests</option>
              {allInterests.map((interest) => (
                <option key={interest} value={interest}>
                  {interest}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Link
              key={member.id}
              to={`/guest/community/${member.guest_user_id}`}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
            >
              <div className="flex items-start space-x-4">
                {member.profile_photo_url ? (
                  <img
                    src={member.profile_photo_url}
                    alt={member.guest_user.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {getInitials(member.guest_user.full_name)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                    {member.guest_user.full_name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {member.guest_user.user_type === 'overnight' ? 'Guest' : 'Coworking'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Since {getJoinedDate(member.guest_user.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {member.bio && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{member.bio}</p>
              )}

              {member.interests && member.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {member.interests.slice(0, 3).map((interest, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                  {member.interests.length > 3 && (
                    <span className="text-xs px-2 py-1 text-gray-500">
                      +{member.interests.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
