import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Menu, X, Home, Building, Coffee, LogOut, LayoutDashboard, Settings, Calendar, CalendarCheck, Megaphone, UserCheck, Bell, PartyPopper, MapPin, Wrench, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { authService, useAuth } from '../lib/auth';

interface NavItem {
  name: string;
  path?: string;
  icon: any;
  children?: NavItem[];
}

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Load expanded state from localStorage
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('adminMenuExpanded');
    return saved ? JSON.parse(saved) : { 'Guest Platform': true };
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const newState = { ...prev, [itemName]: !prev[itemName] };
      localStorage.setItem('adminMenuExpanded', JSON.stringify(newState));
      return newState;
    });
  };

  const isActive = (path: string) => location.pathname === path;

  const isParentActive = (item: NavItem): boolean => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some(child => child.path && isActive(child.path));
    }
    return false;
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await authService.signOut();
    }
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Bookings', path: '/admin/bookings', icon: Calendar },
    { name: 'Rooms', path: '/admin/rooms', icon: Building },
    { name: 'Buildings', path: '/admin/buildings', icon: Home },
    { name: 'iCal Sync', path: '/admin/ical', icon: CalendarCheck },
    { name: 'Coworking', path: '/admin/coworking', icon: Coffee },
    {
      name: 'Guest Platform',
      icon: UserCheck,
      children: [
        { name: 'Guest Directory', path: '/admin/guests', icon: UserCheck },
        { name: 'Guest Messages', path: '/admin/messages', icon: MessageSquare },
        { name: 'Announcements', path: '/admin/announcements', icon: Bell },
        { name: 'Events', path: '/admin/events', icon: PartyPopper },
        { name: 'Local Info', path: '/admin/local-info', icon: MapPin },
        { name: 'Services', path: '/admin/services', icon: Wrench },
        { name: 'Promotions', path: '/admin/promotions', icon: Megaphone },
      ]
    },
    { name: 'Account', path: '/admin/account', icon: Settings },
  ];

  return (
    <>
      <Helmet>
        <title>Bond Admin - Coliving & Coworking Management</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex h-screen bg-slate-900">
        {/* Mobile overlay backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between h-16 px-4 bg-gray-800 text-white">
            <Link to="/admin" className="text-xl font-bold" onClick={closeSidebar}>Bond Admin</Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-700 focus:outline-none transition-colors"
              onClick={closeSidebar}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="mt-3 px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems[item.name];

              if (hasChildren) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={`flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium rounded-lg transition-colors ${
                        isParentActive(item)
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3 flex-shrink-0" aria-hidden="true" />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-0.5 space-y-0.5">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.path}
                              to={child.path!}
                              className={`flex items-center pl-12 pr-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                isActive(child.path!)
                                  ? 'bg-gray-800 text-white'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              }`}
                              onClick={closeSidebar}
                            >
                              <ChildIcon className="w-4 h-4 mr-3 flex-shrink-0" aria-hidden="true" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`flex items-center px-4 py-3.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path!)
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={closeSidebar}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="bg-slate-800 shadow border-b border-slate-700">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <div className="flex items-center">
                <button
                  className="md:hidden p-2 text-gray-600 focus:outline-none"
                  onClick={toggleSidebar}
                >
                  <Menu className="w-6 h-6 text-slate-300" />
                </button>
                <Link to="/" className="ml-2 md:ml-0 text-sm text-slate-300 hover:text-slate-100">
                  <Home className="w-5 h-5 inline-block mr-1" />
                  View Website
                </Link>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-slate-100">
                  {user?.email || 'Admin User'}
                  {user?.role === 'guest' && (
                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Guest
                    </span>
                  )}
                </span>
              </div>
            </div>
          </header>
          <main className="admin-main flex-1 overflow-y-auto bg-slate-900 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;