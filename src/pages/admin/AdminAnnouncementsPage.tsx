import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Megaphone, Plus, Edit2, Trash2, Eye, EyeOff, Pin, PinOff, AlertCircle, Info } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  priority: string;
  is_pinned: boolean;
  is_published: boolean;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'all',
    priority: 'normal',
    is_pinned: false,
    is_published: true,
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) setAnnouncements(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingId) {
      const { error } = await supabase
        .from('announcements')
        .update(formData)
        .eq('id', editingId);

      if (!error) {
        resetForm();
        loadAnnouncements();
      }
    } else {
      const { error } = await supabase
        .from('announcements')
        .insert({
          ...formData,
          created_by: user.id,
        });

      if (!error) {
        resetForm();
        loadAnnouncements();
      }
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      target_audience: announcement.target_audience,
      priority: announcement.priority,
      is_pinned: announcement.is_pinned,
      is_published: announcement.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (!error) loadAnnouncements();
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_published: !currentStatus })
      .eq('id', id);

    if (!error) loadAnnouncements();
  };

  const togglePinned = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_pinned: !currentStatus })
      .eq('id', id);

    if (!error) loadAnnouncements();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      target_audience: 'all',
      priority: 'normal',
      is_pinned: false,
      is_published: true,
    });
    setEditingId(null);
    setShowModal(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'normal': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'overnight': return 'bg-purple-100 text-purple-700';
      case 'coworking': return 'bg-green-100 text-green-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
          <p className="text-gray-600">Manage property-wide announcements for guests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Announcement
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Megaphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No announcements yet</h3>
          <p className="text-gray-600 mb-6">Create your first announcement to communicate with guests</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                announcement.is_pinned ? 'border-yellow-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {announcement.is_pinned && <Pin className="h-5 w-5 text-yellow-600" />}
                    <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAudienceColor(announcement.target_audience)}`}>
                      {announcement.target_audience === 'all' ? 'All Guests' : announcement.target_audience}
                    </span>
                    {!announcement.is_published && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                  <p className="text-sm text-gray-500">
                    Created {formatDate(announcement.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => togglePublished(announcement.id, announcement.is_published)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title={announcement.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {announcement.is_published ? (
                      <Eye className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => togglePinned(announcement.id, announcement.is_pinned)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    {announcement.is_pinned ? (
                      <Pin className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <PinOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Edit2 className="h-5 w-5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Announcement' : 'New Announcement'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Important announcement about..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Announcement details..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Guests</option>
                    <option value="overnight">Overnight Guests</option>
                    <option value="coworking">Coworking Members</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Pin to top</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Publish immediately</span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Published announcements will be visible to guests on their dashboard and announcements page.
                  High priority and pinned announcements appear at the top.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingId ? 'Update' : 'Create'} Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
