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
    <div className="min-h-screen bg-[#1E1F1E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Users className="h-8 w-8 mr-3 text-[#C5C5B5]" />
            Community
          </h1>
          <p className="text-[#C5C5B5]/80">Connect with {members.length} members in the Bond community</p>
        </div>

        {/* Filters */}
        <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 mb-6 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#C5C5B5]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, bio, or interests..."
                className="w-full pl-10 pr-4 py-3 bg-[#1E1F1E]/40 border border-[#C5C5B5]/20 rounded-xl text-white placeholder-[#C5C5B5]/50 focus:ring-2 focus:ring-[#C5C5B5]/50 focus:border-[#C5C5B5]/50"
              />
            </div>

            <div>
              <select
                value={selectedInterest}
                onChange={(e) => setSelectedInterest(e.target.value)}
                className="w-full px-4 py-3 bg-[#1E1F1E]/40 border border-[#C5C5B5]/20 rounded-xl text-white focus:ring-2 focus:ring-[#C5C5B5]/50 focus:border-[#C5C5B5]/50"
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
          <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-12 text-center backdrop-blur-sm">
            <Users className="h-16 w-16 text-[#C5C5B5]/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No members found</h3>
            <p className="text-[#C5C5B5]/60">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Link
                key={member.id}
                to={`/guest/community/${member.guest_user_id}`}
                className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 hover:bg-[#C5C5B5]/10 hover:border-[#C5C5B5]/30 transition-all duration-300 group backdrop-blur-sm"
              >
                <div className="flex items-start space-x-4">
                  {member.profile_photo_url ? (
                    <img
                      src={member.profile_photo_url}
                      alt={member.guest_user.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C5C5B5] to-[#C5C5B5]/80 flex items-center justify-center text-[#1E1F1E] font-bold text-lg">
                      {getInitials(member.guest_user.full_name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-1 group-hover:text-[#C5C5B5] transition">
                      {member.guest_user.full_name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-[#C5C5B5]/20 text-[#C5C5B5] rounded-full">
                        {member.guest_user.user_type === 'overnight' ? 'Guest' : 'Coworking'}
                      </span>
                      <span className="text-xs text-[#C5C5B5]/60">
                        Since {getJoinedDate(member.guest_user.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {member.bio && (
                  <p className="mt-3 text-sm text-[#C5C5B5]/80 line-clamp-2">{member.bio}</p>
                )}

                {member.interests && member.interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {member.interests.slice(0, 3).map((interest, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-[#C5C5B5]/10 text-[#C5C5B5]/80 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                    {member.interests.length > 3 && (
                      <span className="text-xs px-2 py-1 text-[#C5C5B5]/60">
                        +{member.interests.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[#C5C5B5]/20">
                  <button className="flex items-center text-sm text-[#C5C5B5] hover:text-white font-medium transition-colors">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
