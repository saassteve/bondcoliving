import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: 'Funchal, Madeira',
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
    // Validate required fields
    if (!searchParams.checkIn || !searchParams.checkOut) {
      alert('Please select both check-in and check-out dates');
      return;
    }
    
    // Navigate to search results page with parameters
    const searchQuery = new URLSearchParams({
      location: searchParams.location,
      people: searchParams.people.toString(),
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut
    }).toString();
    
    navigate(`/search?${searchQuery}`);
  };

  const getMinCheckOutDate = () => {
    if (!searchParams.checkIn) return '';
    const checkInDate = new Date(searchParams.checkIn);
    const minCheckOutDate = new Date(checkInDate);
    minCheckOutDate.setMonth(checkInDate.getMonth() + 1); // Minimum 1 month stay
    return minCheckOutDate.toISOString().split('T')[0];
  };

  return (
    <div className="bg-[#1E1F1E]/95 backdrop-blur-sm rounded-3xl shadow-2xl p-3 flex flex-col md:flex-row items-stretch gap-2 max-w-5xl mx-auto border border-[#C5C5B5]/20">
      {/* Location */}
      <div className="flex-1 px-6 py-4 border-b md:border-b-0 md:border-r border-[#C5C5B5]/20">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-[#C5C5B5]/60 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide font-medium text-[#C5C5B5]/80 mb-1">
              Location
            </label>
            <input
              type="text"
              placeholder="Where are you going?"
              value={searchParams.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full text-[#C5C5B5] placeholder-[#C5C5B5]/40 bg-transparent border-none outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* People */}
      <div className="flex-1 px-6 py-4 border-b md:border-b-0 md:border-r border-[#C5C5B5]/20">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-[#C5C5B5]/60 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide font-medium text-[#C5C5B5]/80 mb-1">
              People
            </label>
            <select
              value={searchParams.people}
              onChange={(e) => handleInputChange('people', parseInt(e.target.value))}
              className="w-full text-[#C5C5B5] bg-transparent border-none outline-none text-sm cursor-pointer appearance-none"
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
      <div className="flex-1 px-6 py-4 border-b md:border-b-0 md:border-r border-[#C5C5B5]/20">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-[#C5C5B5]/60 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide font-medium text-[#C5C5B5]/80 mb-1">
              Check In
            </label>
            <input
              type="date"
              value={searchParams.checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleInputChange('checkIn', e.target.value)}
              className="w-full text-[#C5C5B5] bg-transparent border-none outline-none text-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Check Out */}
      <div className="flex-1 px-6 py-4 border-b md:border-b-0 md:border-r border-[#C5C5B5]/20">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-[#C5C5B5]/60 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide font-medium text-[#C5C5B5]/80 mb-1">
              Check Out
            </label>
            <input
              type="date"
              value={searchParams.checkOut}
              min={getMinCheckOutDate()}
              onChange={(e) => handleInputChange('checkOut', e.target.value)}
              className="w-full text-[#C5C5B5] bg-transparent border-none outline-none text-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="bg-[#C5C5B5] hover:bg-white text-[#1E1F1E] px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex-shrink-0 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2"
        aria-label="Search available apartments"
      >
        <Search className="w-5 h-5" />
        <span className="hidden md:inline">Search</span>
      </button>
    </div>
  );
};

export default BookingBar;