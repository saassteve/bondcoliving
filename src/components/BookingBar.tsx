import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Calendar, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface BookingBarProps {
  onSearch?: (searchParams: {
    location: string;
    people: number;
    checkIn: string;
    checkOut: string;
  }) => void;
  isSticky?: boolean;
}

const locationOptions = [
  { value: 'Funchal, Madeira', label: 'Funchal, Madeira' },
  { value: 'Lisbon, Portugal', label: 'Lisbon, Portugal' },
  { value: 'Porto, Portugal', label: 'Porto, Portugal' },
  { value: 'Barcelona, Spain', label: 'Barcelona, Spain' },
  { value: 'Madrid, Spain', label: 'Madrid, Spain' },
  { value: 'Berlin, Germany', label: 'Berlin, Germany' },
  { value: 'Amsterdam, Netherlands', label: 'Amsterdam, Netherlands' },
  { value: 'Paris, France', label: 'Paris, France' },
];

const BookingBar: React.FC<BookingBarProps> = ({ onSearch, isSticky = false }) => {
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
    
    // Call onSearch callback if provided (for modal close)
    if (onSearch) {
      onSearch(searchParams);
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
    if (!searchParams.checkIn) return new Date();
    const checkInDate = new Date(searchParams.checkIn);
    const minCheckOutDate = new Date(checkInDate);
    minCheckOutDate.setDate(checkInDate.getDate() + 30); // Minimum 30 days stay
    return minCheckOutDate;
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleCheckInChange = (date: Date | null) => {
    if (date) {
      handleInputChange('checkIn', formatDateForInput(date));
      // Clear checkout if it's before the new minimum date
      if (searchParams.checkOut) {
        const checkOutDate = new Date(searchParams.checkOut);
        const minCheckOut = new Date(date.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days in milliseconds
        if (checkOutDate < minCheckOut) {
          handleInputChange('checkOut', '');
        }
      }
    }
  };

  const handleCheckOutChange = (date: Date | null) => {
    if (date) {
      handleInputChange('checkOut', formatDateForInput(date));
    }
  };

  return (
    <div className={`bg-[#1E1F1E]/95 backdrop-blur-sm shadow-2xl p-2 sm:p-3 flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-row items-stretch gap-1 sm:gap-2 w-full border border-[#C5C5B5]/20 ${
      isSticky 
        ? 'rounded-none border-l-0 border-r-0 border-t-0' 
        : 'rounded-2xl sm:rounded-3xl max-w-5xl mx-auto'
    }`}>
      {/* Location */}
      <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 border-b md:border-b-0 md:border-r lg:border-r border-[#C5C5B5]/20">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-[#C5C5B5]/60 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide font-medium text-[#C5C5B5]/80 mb-1">
              Location
            </label>
            <div className="relative">
              <select
                value={searchParams.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full text-[#C5C5B5] bg-transparent border-none outline-none text-sm cursor-pointer appearance-none pr-6"
              >
                {locationOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#1E1F1E] text-[#C5C5B5]">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5C5B5]/40 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* People */}
      <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 border-b md:border-b lg:border-b-0 lg:border-r border-[#C5C5B5]/20">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-[#C5C5B5]/60 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide font-medium text-[#C5C5B5]/80 mb-1">
              People
            </label>
            <div className="relative">
              <select
                value={searchParams.people}
                onChange={(e) => handleInputChange('people', parseInt(e.target.value))}
                className="w-full text-[#C5C5B5] bg-transparent border-none outline-none text-sm cursor-pointer appearance-none pr-6"
              >
                <option value={1} className="bg-[#1E1F1E] text-[#C5C5B5]">1 person</option>
                <option value={2} className="bg-[#1E1F1E] text-[#C5C5B5]">2 people</option>
                <option value={3} className="bg-[#1E1F1E] text-[#C5C5B5]">3 people</option>
                <option value={4} className="bg-[#1E1F1E] text-[#C5C5B5]">4+ people</option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5C5B5]/40 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Check In */}
      <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 border-b md:border-b-0 md:border-r lg:border-r border-[#C5C5B5]/20">
        <div className="flex items-center cursor-pointer">
          <Calendar className="w-5 h-5 text-[#C5C5B5]/60 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide font-medium text-[#C5C5B5]/80 mb-1">
              Check In
            </label>
            <DatePicker
              selected={searchParams.checkIn ? new Date(searchParams.checkIn) : null}
              onChange={handleCheckInChange}
              minDate={new Date()}
              placeholderText="Select date"
              className="w-full text-[#C5C5B5] bg-transparent border-none outline-none text-sm cursor-pointer"
              calendarClassName="custom-datepicker"
              popperClassName="custom-datepicker-popper"
              dateFormat="MMM dd, yyyy"
            />
          </div>
        </div>
      </div>

      {/* Check Out */}
      <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 border-b md:border-b lg:border-b-0 lg:border-r border-[#C5C5B5]/20">
        <div className="flex items-center cursor-pointer">
          <Calendar className="w-5 h-5 text-[#C5C5B5]/60 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide font-medium text-[#C5C5B5]/80 mb-1">
              Check Out
            </label>
            <DatePicker
              selected={searchParams.checkOut ? new Date(searchParams.checkOut) : null}
              onChange={handleCheckOutChange}
              minDate={getMinCheckOutDate()}
              placeholderText={searchParams.checkIn ? "Select date" : "30 day minimum"}
              className="w-full text-[#C5C5B5] bg-transparent border-none outline-none text-sm cursor-pointer"
              calendarClassName="custom-datepicker"
              popperClassName="custom-datepicker-popper"
              dateFormat="MMM dd, yyyy"
              disabled={!searchParams.checkIn}
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className={`bg-[#C5C5B5] hover:bg-white text-[#1E1F1E] px-4 sm:px-8 py-3 sm:py-4 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex-shrink-0 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 md:col-span-2 lg:col-span-1 ${
          isSticky ? 'rounded-xl' : 'rounded-2xl'
        }`}
        aria-label="Search available apartments"
      >
        <Search className="w-5 h-5" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </div>
  );
};

export default BookingBar;