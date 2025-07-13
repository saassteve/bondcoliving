import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Menu, X, Home, Users, Building, Coffee, LogOut, LayoutDashboard } from 'lucide-react';
import { authService, useAuth } from '../lib/auth';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await authService.signOut();
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Applications', path: '/admin/applications', icon: Users },
    { name: 'Rooms', path: '/admin/rooms', icon: Building },
    { name: 'Coworking', path: '/admin/coworking', icon: Coffee },
  ];

  return (
    <>
      <Helmet>
        <title>Bond Admin - Coliving & Coworking Management</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar for desktop */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between h-16 px-4 bg-gray-800 text-white">
            <Link to="/admin" className="text-xl font-bold">Bond Admin</Link>
            <button className="md:hidden p-2 focus:outline-none" onClick={closeSidebar}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="mt-5 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={closeSidebar}
                >
                  <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
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
          <header className="bg-white shadow border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <div className="flex items-center">
                <button
                  className="md:hidden p-2 text-gray-600 focus:outline-none"
                  onClick={toggleSidebar}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <Link to="/" className="ml-2 md:ml-0 text-sm text-gray-600 hover:text-primary-600">
                  <Home className="w-5 h-5 inline-block mr-1" />
                  View Website
                </Link>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-800">
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
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;