import React, { useState } from 'react';
import { Search, MapPin, Users, Calendar } from 'lucide-react';

interface BookingBarProps {
  onSearch?: (searchParams: {
    location: string;
    people: number;
    checkIn: string;
    checkOut: string;
  }) => void;
}

const BookingBar: React.FC<BookingBarProps> = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState({
    location: '',
    people: 1,
    checkIn: '',
    checkOut: ''
  });

  const handleInputChange = (field: string, value: string | number) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    // For now, just scroll to apartments section
    const apartmentsSection = document.getElementById('apartments-section');
    if (apartmentsSection) {
      apartmentsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Call the onSearch callback if provided
    if (onSearch) {
      onSearch(searchParams);
    }
    
    console.log('Search params:', searchParams);
  };

  const getMinCheckOutDate = () => {
    if (!searchParams.checkIn) return '';
    const checkInDate = new Date(searchParams.checkIn);
    const minCheckOutDate = new Date(checkInDate);
    minCheckOutDate.setMonth(checkInDate.getMonth() + 1); // Minimum 1 month stay
    return minCheckOutDate.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-2xl p-2 flex items-center gap-1 max-w-5xl mx-auto border border-white/20">
      {/* Location */}
      <div className="flex-1 px-6 py-4 border-r border-gray-200">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Location
            </label>
            <input
              type="text"
              placeholder="Funchal, Madeira"
              value={searchParams.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full text-gray-600 placeholder-gray-400 bg-transparent border-none outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* People */}
      <div className="flex-1 px-6 py-4 border-r border-gray-200">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              People
            </label>
            <select
              value={searchParams.people}
              onChange={(e) => handleInputChange('people', parseInt(e.target.value))}
              className="w-full text-gray-600 bg-transparent border-none outline-none text-sm cursor-pointer"
            >
              <option value={1}>1 person</option>
              <option value={2}>2 people</option>
              <option value={3}>3 people</option>
              <option value={4}>4+ people</option>
            </select>
          </div>
        </div>
      </div>

      {/* Check In */}
      <div className="flex-1 px-6 py-4 border-r border-gray-200">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Check In
            </label>
            <input
              type="date"
              value={searchParams.checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleInputChange('checkIn', e.target.value)}
              className="w-full text-gray-600 bg-transparent border-none outline-none text-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Check Out */}
      <div className="flex-1 px-6 py-4 border-r border-gray-200">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Check Out
            </label>
            <input
              type="date"
              value={searchParams.checkOut}
              min={getMinCheckOutDate()}
              onChange={(e) => handleInputChange('checkOut', e.target.value)}
              className="w-full text-gray-600 bg-transparent border-none outline-none text-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex-shrink-0"
        aria-label="Search available apartments"
      >
        <Search className="w-6 h-6" />
      </button>
    </div>
  );
};

export default BookingBar;