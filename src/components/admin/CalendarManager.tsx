import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, RefreshCw, ExternalLink, AlertCircle, Check, Download, Upload, Copy } from 'lucide-react';
import { availabilityService, icalService, type ApartmentAvailability, type ApartmentICalFeed } from '../../lib/supabase';

interface CalendarManagerProps {
  apartmentId: string;
  apartmentTitle: string;
  onClose: () => void;
}

const CalendarManager: React.FC<CalendarManagerProps> = ({ apartmentId, apartmentTitle, onClose }) => {
  const [availability, setAvailability] = useState<ApartmentAvailability[]>([]);
  const [icalFeeds, setICalFeeds] = useState<ApartmentICalFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'available' | 'booked' | 'blocked'>('blocked');
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: '', url: '' });
  const [syncingFeed, setSyncingFeed] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [apartmentId, currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const [availabilityData, feedsData] = await Promise.all([
        availabilityService.getCalendar(apartmentId, startDate, endDate),
        icalService.getFeeds(apartmentId)
      ]);
      
      setAvailability(availabilityData);
      setICalFeeds(feedsData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleBulkUpdate = async () => {
    if (selectedDates.length === 0) return;
    
    try {
      await availabilityService.setBulkAvailability(apartmentId, selectedDates, bulkStatus);
      setSelectedDates([]);
      await fetchData();
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability');
    }
  };

  const handleAddFeed = async () => {
    if (!newFeed.name.trim() || !newFeed.url.trim()) return;
    
    try {
      await icalService.addFeed({
        apartment_id: apartmentId,
        feed_name: newFeed.name.trim(),
        ical_url: newFeed.url.trim(),
        is_active: true
      });
      
      setNewFeed({ name: '', url: '' });
      setShowAddFeed(false);
      await fetchData();
    } catch (error) {
      console.error('Error adding iCal feed:', error);
      alert('Failed to add iCal feed');
    }
  };

  const handleSyncFeed = async (feedId: string) => {
    setSyncingFeed(feedId);
    try {
      const result = await icalService.syncFeed(feedId);
      if (result.success) {
        // Show detailed success message
        const message = result.stats 
          ? `Sync successful!\n\nFeed: ${result.stats.feedName}\nEvents processed: ${result.stats.eventsProcessed}\nDates updated: ${result.stats.datesUpdated}`
          : result.message;
        alert(message);
        await fetchData();
      } else {
        alert(`Sync failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error syncing feed:', error);
      alert('Failed to sync iCal feed');
    } finally {
      setSyncingFeed(null);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!window.confirm('Are you sure you want to delete this iCal feed?')) return;
    
    try {
      await icalService.deleteFeed(feedId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting feed:', error);
      alert('Failed to delete iCal feed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'blocked':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAvailability = availability.find(a => a.date === date);
      const status = dayAvailability?.status || 'available';
      const isSelected = selectedDates.includes(date);
      const isPast = new Date(date) < new Date(new Date().toISOString().split('T')[0]);
      
      days.push(
        <div
          key={date}
          onClick={() => !isPast && handleDateClick(date)}
          className={`h-12 border rounded cursor-pointer flex items-center justify-center text-sm font-medium transition-all ${
            isPast 
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
              : isSelected
                ? 'bg-blue-500 text-white border-blue-500'
                : `${getStatusColor(status)} hover:scale-105`
          }`}
          title={dayAvailability?.notes || status}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDates([]);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDates([]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Calendar Management</h2>
            <p className="text-gray-600">{apartmentTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={previousMonth} className="p-2 hover:bg-gray-200 rounded">
                  ←
                </button>
                <h3 className="text-lg font-semibold">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded">
                  →
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                  <span>Blocked</span>
                </div>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedDates.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium mb-2">{selectedDates.length} dates selected</h4>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="available">Set Available</option>
                    <option value="booked">Set Booked</option>
                    <option value="blocked">Set Blocked</option>
                  </select>
                  <button
                    onClick={handleBulkUpdate}
                    className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setSelectedDates([])}
                    className="px-4 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* iCal Feeds */}
          <div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">iCal Feeds</h3>
                <button
                  onClick={() => setShowAddFeed(true)}
                  className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  title="Add iCal feed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {icalFeeds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No iCal feeds configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {icalFeeds.map((feed) => (
                    <div key={feed.id} className="p-3 bg-white rounded border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{feed.feed_name}</h4>
                          <p className="text-xs text-gray-500 truncate">{feed.ical_url}</p>
                          {feed.last_sync && (
                            <p className="text-xs text-gray-400 mt-1">
                              Last sync: {new Date(feed.last_sync).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleSyncFeed(feed.id)}
                            disabled={syncingFeed === feed.id}
                            className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            title="Sync feed"
                          >
                            <RefreshCw className={`w-4 h-4 ${syncingFeed === feed.id ? 'animate-spin' : ''}`} />
                          </button>
                          <a
                            href={feed.ical_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="Open feed URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteFeed(feed.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete feed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium mb-1">iCal Sync Info:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Synced events will be marked as "booked"</li>
                    <li>• Manual changes may be overwritten on sync</li>
                    <li>• Sync regularly to keep calendar updated</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Feed Modal */}
        {showAddFeed && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add iCal Feed</h3>
                <button onClick={() => setShowAddFeed(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feed Name
                  </label>
                  <input
                    type="text"
                    value={newFeed.name}
                    onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                    placeholder="e.g., Airbnb Calendar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    iCal URL
                  </label>
                  <input
                    type="url"
                    value={newFeed.url}
                    onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddFeed(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFeed}
                  disabled={!newFeed.name.trim() || !newFeed.url.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Feed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarManager;