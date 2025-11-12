// components/Header.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-md bg-[#0f100f]/60 border-b border-white/10">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-semibold text-[#C5C5B5] tracking-tight">Bond</Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-[#C5C5B5]">
            <Link to="/#apartments-section" className="hover:text-white">Apartments</Link>
            <Link to="/coworking" className="hover:text-white">Coworking</Link>
            <details className="relative">
              <summary className="cursor-pointer list-none hover:text-white">More</summary>
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-[#1E1F1E] p-2 shadow-xl">
                <Link to="/#amenities" className="block px-3 py-2 text-sm hover:bg-white/5 rounded-md">Amenities</Link>
                <Link to="/#location" className="block px-3 py-2 text-sm hover:bg-white/5 rounded-md">Location</Link>
                <Link to="/#faq" className="block px-3 py-2 text-sm hover:bg-white/5 rounded-md">FAQ</Link>
              </div>
            </details>
          </nav>

          {/* Mobile menu trigger only */}
          <button className="md:hidden p-2 text-[#C5C5B5]" onClick={() => setOpen(v => !v)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden bg-[#1E1F1E] border-b border-white/10">
          <div className="container py-3 grid gap-1">
            <Link to="/#apartments-section" className="px-1 py-2 text-[#C5C5B5]">Apartments</Link>
            <Link to="/coworking" className="px-1 py-2 text-[#C5C5B5]">Coworking</Link>
            <Link to="/#amenities" className="px-1 py-2 text-[#C5C5B5]">Amenities</Link>
            <Link to="/#location" className="px-1 py-2 text-[#C5C5B5]">Location</Link>
            <Link to="/#faq" className="px-1 py-2 text-[#C5C5B5]">FAQ</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;