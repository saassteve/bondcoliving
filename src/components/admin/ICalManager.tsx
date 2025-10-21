import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import { icalService, apartmentService, type ApartmentICalFeed, type Apartment } from '../../lib/supabase';

const ICalManager: React.FC = () => {
  const [feeds, setFeeds] = useState<ApartmentICalFeed[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    apartment_id: '',
    feed_name: '',
    ical_url: '',
    is_active: true
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feedsData, apartmentsData] = await Promise.all([
        icalService.getAllFeeds(),
        apartmentService.getAll()
      ]);
      setFeeds(feedsData);
      setApartments(apartmentsData);
    } catch (err) {
      setError('Failed to load iCal feeds');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await icalService.addFeed(formData);
      setSuccess('iCal feed added successfully');
      setFormData({
        apartment_id: '',
        feed_name: '',
        ical_url: '',
        is_active: true
      });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to add iCal feed');
      console.error('Error adding feed:', err);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('Are you sure you want to delete this iCal feed? This will also remove all associated blocked dates from the calendar.')) return;

    try {
      const result = await icalService.deleteFeed(feedId);
      if (result.success) {
        setSuccess(`Feed deleted successfully. Removed ${result.availability_deleted || 0} blocked dates and ${result.events_deleted || 0} events.`);
      } else {
        setError(result.message || 'Failed to delete iCal feed');
      }
      fetchData();
    } catch (err) {
      setError('Failed to delete iCal feed');
      console.error('Error deleting feed:', err);
    }
  };

  const handleSyncFeed = async (feedId: string) => {
    setSyncing(feedId);
    setError(null);
    setSuccess(null);

    try {
      const result = await icalService.syncFeed(feedId);
      if (result.success) {
        setSuccess(`Sync completed: ${result.results?.[0]?.datesBooked || 0} dates updated`);
        fetchData();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to sync iCal feed');
      console.error('Error syncing feed:', err);
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAllFeeds = async (apartmentId: string) => {
    setSyncing(apartmentId);
    setError(null);
    setSuccess(null);

    try {
      const result = await icalService.syncAllFeeds(apartmentId);
      if (result.success) {
        const totalDates = result.results?.reduce((sum, r) => sum + (r.datesBooked || 0), 0) || 0;
        setSuccess(`Sync completed: ${totalDates} dates updated across ${result.results?.length || 0} feeds`);
        fetchData();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to sync iCal feeds');
      console.error('Error syncing feeds:', err);
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleActive = async (feedId: string, currentStatus: boolean) => {
    try {
      await icalService.updateFeed(feedId, { is_active: !currentStatus });
      setSuccess(`Feed ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (err) {
      setError('Failed to update feed status');
      console.error('Error updating feed:', err);
    }
  };

  const handleCleanupOrphaned = async () => {
    if (!confirm('This will remove all blocked dates from deleted iCal feeds. Continue?')) return;

    try {
      const result = await icalService.cleanupOrphanedAvailability();
      if (result.success) {
        setSuccess(`Cleaned up ${result.deleted_count} orphaned availability records from feeds: ${result.orphaned_feeds.join(', ')}`);
        fetchData();
      } else {
        setError(result.message || 'Failed to cleanup orphaned availability');
      }
    } catch (err) {
      setError('Failed to cleanup orphaned availability');
      console.error('Error cleaning up orphaned availability:', err);
    }
  };

  const getApartmentName = (apartmentId: string) => {
    return apartments.find(apt => apt.id === apartmentId)?.title || 'Unknown';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading iCal feeds...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">iCal Feed Management</h2>
        <div className="flex gap-3">
          <button
            onClick={handleCleanupOrphaned}
            className="admin-btn-secondary flex items-center px-4 py-2 rounded-lg"
            title="Remove blocked dates from deleted feeds"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Orphaned
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="admin-btn-primary flex items-center px-6 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add iCal Feed
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddFeed} className="admin-card p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4 text-white">Add New iCal Feed</h3>

          <div>
            <label className="admin-label block text-sm mb-2">Apartment</label>
            <select
              value={formData.apartment_id}
              onChange={(e) => setFormData({ ...formData, apartment_id: e.target.value })}
              className="admin-select w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an apartment</option>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label block text-sm mb-2">Feed Name</label>
            <input
              type="text"
              value={formData.feed_name}
              onChange={(e) => setFormData({ ...formData, feed_name: e.target.value })}
              className="admin-input w-full px-4 py-2 rounded-lg border focus:outline-none"
              placeholder="e.g., Airbnb, Booking.com"
              required
            />
          </div>

          <div>
            <label className="admin-label block text-sm mb-2">iCal URL</label>
            <input
              type="url"
              value={formData.ical_url}
              onChange={(e) => setFormData({ ...formData, ical_url: e.target.value })}
              className="admin-input w-full px-4 py-2 rounded-lg border focus:outline-none"
              placeholder="https://..."
              required
            />
            <p className="admin-text-muted text-sm mt-1">
              Paste the iCal export URL from your booking platform
            </p>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="admin-btn-primary px-6 py-2 rounded-lg">
              Add Feed
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="admin-btn-secondary px-6 py-2 rounded-lg border"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {apartments.map((apartment) => {
          const apartmentFeeds = feeds.filter(f => f.apartment_id === apartment.id);
          if (apartmentFeeds.length === 0) return null;

          return (
            <div key={apartment.id} className="admin-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">{apartment.title}</h3>
                <button
                  onClick={() => handleSyncAllFeeds(apartment.id)}
                  disabled={syncing === apartment.id}
                  className="admin-btn-primary flex items-center px-4 py-2 rounded-lg"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing === apartment.id ? 'animate-spin' : ''}`} />
                  Sync All Feeds
                </button>
              </div>

              <div className="space-y-3">
                {apartmentFeeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-white">{feed.feed_name}</h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            feed.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-300'
                          }`}
                        >
                          {feed.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-300">
                        <a
                          href={feed.ical_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View iCal URL
                        </a>
                        <span>•</span>
                        <span>Last sync: {formatDate(feed.last_sync)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(feed.id, feed.is_active || false)}
                        className="admin-btn-secondary px-4 py-2 rounded-lg border text-sm"
                      >
                        {feed.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleSyncFeed(feed.id)}
                        disabled={syncing === feed.id}
                        className="admin-btn-primary px-4 py-2 rounded-lg text-sm flex items-center"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing === feed.id ? 'animate-spin' : ''}`} />
                        Sync
                      </button>
                      <button
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="admin-btn-danger p-2 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {feeds.length === 0 && (
          <div className="text-center py-12 admin-card">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2 text-white">No iCal Feeds Yet</h3>
            <p className="admin-text-muted mb-6">
              Add iCal feeds from your booking platforms to automatically sync availability
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="admin-btn-primary inline-flex items-center px-6 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ICalManager;
