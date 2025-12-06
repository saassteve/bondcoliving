import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentGuestUser, signOutGuest, type GuestUser } from '../lib/guestAuth';
import { Home, Users, Calendar, MessageSquare, FileText, Bell, Settings, Menu, X, Wrench, Clock } from 'lucide-react';

export default function GuestLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadGuestUser();
  }, []);

  const loadGuestUser = async () => {
    const user = await getCurrentGuestUser();
    setGuestUser(user);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOutGuest();
    navigate('/guest/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5C5B5]"></div>
      </div>
    );
  }

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: 'Dashboard', href: '/guest/dashboard', icon: Home, show: true },
    { name: 'Community', href: '/guest/community', icon: Users, show: true },
    { name: 'Events', href: '/guest/events', icon: Calendar, show: true },
    { name: 'Messages', href: '/guest/messages', icon: MessageSquare, show: true },
    { name: 'Local Info', href: '/guest/local-info', icon: FileText, show: guestUser?.user_type === 'overnight' },
    { name: 'Services', href: '/guest/services', icon: Wrench, show: guestUser?.user_type === 'overnight' },
    { name: 'Extend Stay', href: '/guest/extend-stay', icon: Clock, show: guestUser?.user_type === 'overnight' },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-[#1E1F1E]">
      {/* Top Navigation */}
      <nav className="bg-[#1E1F1E]/95 border-b border-[#C5C5B5]/20 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-[#C5C5B5] hover:text-white hover:bg-[#C5C5B5]/10"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link to="/guest/dashboard" className="flex items-center ml-2 lg:ml-0">
                <img
                  src="https://iili.io/FcjToIp.png"
                  alt="Bond"
                  className="h-8 w-auto"
                />
                <span className="ml-3 px-2 py-1 text-xs font-medium uppercase tracking-wide bg-[#C5C5B5]/20 text-[#C5C5B5] rounded-full">
                  {guestUser?.user_type === 'overnight' ? 'Guest' : 'Coworking'}
                </span>
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-[#C5C5B5]/20 text-white'
                        : 'text-[#C5C5B5] hover:bg-[#C5C5B5]/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to="/guest/notifications"
                className="p-2 rounded-xl text-[#C5C5B5] hover:text-white hover:bg-[#C5C5B5]/10 relative transition-all duration-300"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#C5C5B5] rounded-full"></span>
              </Link>
              <Link
                to="/guest/settings"
                className="p-2 rounded-xl text-[#C5C5B5] hover:text-white hover:bg-[#C5C5B5]/10 transition-all duration-300"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-[#C5C5B5] hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#C5C5B5]/20 bg-[#1E1F1E]/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-xl text-base font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-[#C5C5B5]/20 text-white'
                        : 'text-[#C5C5B5] hover:bg-[#C5C5B5]/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full text-left flex items-center px-3 py-2 rounded-xl text-base font-medium text-[#C5C5B5] hover:bg-[#C5C5B5]/10 hover:text-white transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet context={{ guestUser, refreshUser: loadGuestUser }} />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1E1F1E]/95 border-t border-[#C5C5B5]/20 z-50 backdrop-blur-sm">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs transition-all duration-300 ${
                  isActive(item.href)
                    ? 'text-white bg-[#C5C5B5]/20'
                    : 'text-[#C5C5B5]'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="truncate w-full text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
