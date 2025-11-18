import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Book, Home, Coffee, ArrowRight, Instagram, Mail } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const MainLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Book },
    { name: 'Coworking', path: '/coworking', icon: Coffee },
  ];

  const handleFAQClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      window.location.href = '/#faq';
      return;
    }
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

      <div className="flex flex-col min-h-screen bg-[#1E1F1E] text-white selection:bg-[#C5C5B5] selection:text-[#1E1F1E]">
        
        {/* --- FLOATING NAVIGATION BAR --- */}
        <header 
          className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-8 transition-all duration-300 ${
            scrolled ? 'pt-4' : 'pt-6 md:pt-8'
          }`}
        >
          <div 
            className={`mx-auto max-w-5xl rounded-full border transition-all duration-300 ${
              scrolled 
                ? 'bg-[#1E1F1E]/90 backdrop-blur-xl border-white/10 shadow-2xl py-3 px-6' 
                : 'bg-black/30 backdrop-blur-md border-white/5 py-4 px-6' // Added dark glass background for contrast on hero
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="relative z-50 flex items-center gap-2 group" onClick={closeMenu}>
                <img 
                  src="https://ucarecdn.com/8a70b6b2-1930-403f-b333-8234cda9ac93/BondTextOnly.png" 
                  alt="Bond" 
                  className="h-6 md:h-7 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive(link.path)
                        ? 'bg-white/10 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <button
                  onClick={handleFAQClick}
                  className="px-5 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all"
                >
                  FAQ
                </button>
              </nav>

              {/* CTA & Mobile Toggle */}
              <div className="flex items-center gap-3">
                <Link
                  to="/apply"
                  className={`hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 hover:scale-105 ${
                    scrolled 
                      ? 'bg-[#C5C5B5] text-[#1E1F1E] hover:bg-white' 
                      : 'bg-white text-[#1E1F1E] hover:bg-[#C5C5B5]'
                  }`}
                >
                  Stay with Us
                </Link>

                {/* Mobile Burger */}
                <button
                  className="md:hidden relative z-50 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
                  onClick={toggleMenu}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* --- MOBILE MENU OVERLAY --- */}
        <div 
          className={`fixed inset-0 z-40 bg-[#1E1F1E] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            isMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:to-white transition-all"
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={handleFAQClick}
              className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:to-white transition-all"
            >
              FAQ
            </button>
            
            <div className="mt-8 w-full max-w-xs h-px bg-white/10" />
            
            <Link
              to="/apply"
              onClick={closeMenu}
              className="flex items-center gap-2 text-[#C5C5B5] text-xl uppercase tracking-widest hover:text-white transition-colors"
            >
              Book Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>


        {/* Main Content */}
        <main className="flex-grow pt-0">
          <Outlet />
        </main>

        {/* --- CINEMATIC FOOTER --- */}
        <footer className="relative bg-[#0a0a0a] pt-24 pb-12 overflow-hidden">
          {/* Background Texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
          
          <div className="container relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
              
              {/* Column 1: Brand */}
              <div className="md:col-span-5">
                <h3 className="text-2xl font-bold text-white mb-6">Bond.</h3>
                <p className="text-white/50 text-lg max-w-sm leading-relaxed mb-8">
                  A sanctuary for digital nomads in the heart of Funchal. Where independence meets community.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#C5C5B5] hover:text-[#1E1F1E] transition-all">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="mailto:hello@stayatbond.com" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#C5C5B5] hover:text-[#1E1F1E] transition-all">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Column 2: Explore */}
              <div className="md:col-span-3">
                <h4 className="text-white font-bold mb-6">Explore</h4>
                <ul className="space-y-4">
                  {navLinks.map(link => (
                    <li key={link.name}>
                      <Link to={link.path} className="text-white/50 hover:text-[#C5C5B5] transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                     <Link to="/apply" className="text-white/50 hover:text-[#C5C5B5] transition-colors">Apply to Stay</Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Contact */}
              <div className="md:col-span-4">
                <h4 className="text-white font-bold mb-6">Visit Us</h4>
                <address className="not-italic text-white/50 space-y-2 mb-6">
                  <p>Rua da Carreira</p>
                  <p>Funchal, Madeira</p>
                  <p>Portugal</p>
                </address>
                <a href="mailto:hello@stayatbond.com" className="text-[#C5C5B5] hover:text-white transition-colors hover:underline">
                  hello@stayatbond.com
                </a>
              </div>
            </div>

            {/* Big Footer Typography */}
            <div className="border-t border-white/10 pt-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-white/30 text-sm">
                  © {new Date().getFullYear()} Bond Coliving. All rights reserved.
                </p>
                <div className="flex gap-6 text-sm text-white/30">
                  <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                  <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                  <Link to="/login" className="hover:text-white transition-colors">Admin</Link>
                </div>
              </div>
              
              {/* Massive Brand Name */}
              <div className="mt-12 select-none">
                <h1 className="text-[15vw] md:text-[18vw] font-bold text-[#1E1F1E] leading-none text-center md:text-left tracking-tighter" style={{ textShadow: '-1px -1px 0 #2A2B2A, 1px -1px 0 #2A2B2A, -1px 1px 0 #2A2B2A, 1px 1px 0 #2A2B2A' }}>
                  BOND
                </h1>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default MainLayout;