import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Book, Home, MapPin, Coffee, LogIn } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const MainLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Book },
    { name: 'Coworking', path: '/coworking', icon: Coffee },
  ];

  const handleFAQClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate there first
    if (location.pathname !== '/') {
      window.location.href = '/#faq';
      return;
    }
    
    // If we're on the home page, scroll to FAQ section
    const faqSection = document.getElementById('faq');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
    closeMenu();
  };

  return (
    <>
      <Helmet>
        <title>Bond - Premium Digital Nomad Coliving in Central Funchal, Madeira</title>
        <meta name="description" content="Premium coliving for digital nomads in central Funchal, Madeira. Private apartments with enterprise-grade WiFi, coworking space, all amenities included. 5 minutes to ocean & city center." />
      </Helmet>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#1E1F1E]/90 backdrop-blur-sm border-b border-[#C5C5B5]/10">
          <div className="container flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center text-2xl font-bold tracking-tight text-[#C5C5B5]" onClick={closeMenu}>
              <img 
                src="https://ucarecdn.com/8a70b6b2-1930-403f-b333-8234cda9ac93/BondTextOnly.png" 
                alt="Bond" 
                className="h-8 w-auto"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.path}
                    to={link.path}
                    className={`flex items-center text-sm uppercase tracking-wide transition duration-150 ease-in-out ${
                      isActive(link.path) 
                        ? 'text-[#C5C5B5]' 
                        : 'text-[#C5C5B5]/60 hover:text-[#C5C5B5]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.name}
                  </Link>
                );
              })}
              <button
                onClick={handleFAQClick}
                className="flex items-center text-sm uppercase tracking-wide transition duration-150 ease-in-out text-[#C5C5B5]/60 hover:text-[#C5C5B5]"
              >
                <Book className="w-4 h-4 mr-2" />
                FAQ
              </button>
              <div className="flex items-center space-x-4">
                <Link
                  to="/apply"
                  className="relative bg-gradient-to-r from-[#C5C5B5] to-white text-[#1E1F1E] px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:shadow-lg hover:scale-105 hover:from-white hover:to-[#C5C5B5] group"
                >
                  <span className="relative z-10">Stay with Us</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-[#C5C5B5] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-[#C5C5B5]/60 hover:text-[#C5C5B5] focus:outline-none"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden py-6 px-4 bg-[#1E1F1E] border-t border-[#C5C5B5]/10 animate-fade-in">
              <div className="space-y-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link 
                      key={link.path}
                      to={link.path}
                      className={`flex items-center py-2 text-sm uppercase tracking-wide ${
                        isActive(link.path) 
                          ? 'text-[#C5C5B5]' 
                          : 'text-[#C5C5B5]/60 hover:text-[#C5C5B5]'
                      }`}
                      onClick={closeMenu}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {link.name}
                    </Link>
                  );
                })}
                <button
                  onClick={handleFAQClick}
                  className="flex items-center py-2 text-sm uppercase tracking-wide text-[#C5C5B5]/60 hover:text-[#C5C5B5]"
                >
                  <Book className="w-5 h-5 mr-3" />
                  FAQ
                </button>
                <Link
                  to="/apply"
                  className="flex items-center py-3 px-4 text-sm uppercase tracking-wide bg-gradient-to-r from-[#C5C5B5] to-white text-[#1E1F1E] rounded-full font-semibold mt-4 justify-center hover:from-white hover:to-[#C5C5B5] transition-all duration-300"
                  onClick={closeMenu}
                >
                  <MapPin className="w-5 h-5 mr-3" />
                  Stay with Us
                </Link>
              </div>
            </nav>
          )}
        </header>
        
        {/* Sticky Booking Bar */}
        <StickyBookingBar />
        
        {/* Main Content */}
        <main className="flex-grow page-transition">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="bg-[#1E1F1E] border-t border-[#C5C5B5]/10 py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#C5C5B5] mb-6">Bond</h3>
                <p className="text-[#C5C5B5]/60">
                  A modern coliving and coworking space in Funchal, Madeira.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-bold tracking-tight text-[#C5C5B5] mb-6">Links</h4>
                <ul className="space-y-3">
                  {navLinks.map((link) => (
                    <li key={link.path}>
                      <Link 
                        to={link.path} 
                        className="text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors text-sm uppercase tracking-wide"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button 
                      onClick={handleFAQClick}
                      className="text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors text-sm uppercase tracking-wide"
                    >
                      FAQ
                    </button>
                  </li>
                  <li>
                    <Link 
                      to="/apply" 
                      className="text-[#C5C5B5]/60 hover:text-[#C5C5B5] transition-colors text-sm uppercase tracking-wide"
                    >
                      Stay
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold tracking-tight text-[#C5C5B5] mb-6">Contact</h4>
                <address className="not-italic text-[#C5C5B5]/60 text-sm uppercase tracking-wide">
                  <p>Funchal, Madeira</p>
                  <a 
                    href="mailto:hello@stayatbond.com" 
                    className="mt-3 block hover:text-[#C5C5B5] transition-colors"
                  >
                    hello@stayatbond.com
                  </a>
                </address>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-[#C5C5B5]/10">
              <div className="mb-6 text-center">
                <img 
                  src="https://ucarecdn.com/8a70b6b2-1930-403f-b333-8234cda9ac93/BondTextOnly.png" 
                  alt="Bond" 
                  className="h-8 w-auto mx-auto"
                />
              </div>
              <div className="flex flex-col items-center space-y-3">
                <p className="text-[#C5C5B5]/40 text-sm text-center">
                  © {new Date().getFullYear()} Bond. All rights reserved.
                </p>
                <Link 
                  to="/login" 
                  className="text-[#C5C5B5]/30 hover:text-[#C5C5B5]/60 transition-colors text-xs"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default MainLayout;