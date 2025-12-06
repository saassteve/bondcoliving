import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash, Check, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PromotionBanner {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  background_color: string;
  text_color: string;
  link_url: string | null;
  link_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const AdminPromotionsPage: React.FC = () => {
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<PromotionBanner | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotion_banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      alert('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBanner({
      id: '',
      title: '',
      message: '',
      is_active: true,
      start_date: null,
      end_date: null,
      background_color: '#1E1F1E',
      text_color: '#FFFFFF',
      link_url: null,
      link_text: null,
      sort_order: banners.length,
      created_at: '',
      updated_at: '',
    });
    setIsCreating(true);
  };

  const handleEdit = (banner: PromotionBanner) => {
    setEditingBanner({ ...banner });
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingBanner) return;

    try {
      if (isCreating) {
        const { error } = await supabase.from('promotion_banners').insert({
          title: editingBanner.title,
          message: editingBanner.message,
          is_active: editingBanner.is_active,
          start_date: editingBanner.start_date,
          end_date: editingBanner.end_date,
          background_color: editingBanner.background_color,
          text_color: editingBanner.text_color,
          link_url: editingBanner.link_url,
          link_text: editingBanner.link_text,
          sort_order: editingBanner.sort_order,
        });

        if (error) throw error;
        alert('Banner created successfully!');
      } else {
        const { error } = await supabase
          .from('promotion_banners')
          .update({
            title: editingBanner.title,
            message: editingBanner.message,
            is_active: editingBanner.is_active,
            start_date: editingBanner.start_date,
            end_date: editingBanner.end_date,
            background_color: editingBanner.background_color,
            text_color: editingBanner.text_color,
            link_url: editingBanner.link_url,
            link_text: editingBanner.link_text,
            sort_order: editingBanner.sort_order,
          })
          .eq('id', editingBanner.id);

        if (error) throw error;
        alert('Banner updated successfully!');
      }

      setEditingBanner(null);
      setIsCreating(false);
      await fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase.from('promotion_banners').delete().eq('id', id);

      if (error) throw error;
      alert('Banner deleted successfully!');
      await fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const toggleActive = async (banner: PromotionBanner) => {
    try {
      const { error } = await supabase
        .from('promotion_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      await fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('Failed to update banner status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5C5B5]"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Promotions - Admin</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#C5C5B5]">Promotion Banners</h1>
            <p className="text-gray-400 mt-1">Manage promotional banners displayed on the website</p>
          </div>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-2" />
            Create Banner
          </button>
        </div>

        <div className="space-y-4">
          {banners.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-400">No promotion banners yet</p>
              <button onClick={handleCreate} className="btn-primary mt-4">
                Create Your First Banner
              </button>
            </div>
          ) : (
            banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[#C5C5B5]">{banner.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          banner.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-600 text-gray-400'
                        }`}
                      >
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div
                      className="p-4 rounded-lg mb-3"
                      style={{
                        backgroundColor: banner.background_color,
                        color: banner.text_color,
                      }}
                    >
                      <p className="text-sm">{banner.message}</p>
                      {banner.link_url && banner.link_text && (
                        <a
                          href={banner.link_url}
                          className="text-sm font-semibold underline mt-2 inline-block"
                          style={{ color: banner.text_color }}
                        >
                          {banner.link_text} →
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      {banner.start_date && (
                        <span>Starts: {new Date(banner.start_date).toLocaleDateString()}</span>
                      )}
                      {banner.end_date && (
                        <span>Ends: {new Date(banner.end_date).toLocaleDateString()}</span>
                      )}
                      {!banner.start_date && !banner.end_date && <span>Always visible</span>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(banner)}
                      className="btn-secondary"
                      title={banner.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {banner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleEdit(banner)} className="btn-secondary">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="btn bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#C5C5B5] mb-4">
                {isCreating ? 'Create Promotion Banner' : 'Edit Promotion Banner'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title (internal reference)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editingBanner.title}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    placeholder="e.g., Summer Sale 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={editingBanner.message}
                    onChange={(e) => setEditingBanner({ ...editingBanner, message: e.target.value })}
                    placeholder="The message to display to visitors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Background Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-10 rounded cursor-pointer"
                        value={editingBanner.background_color}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, background_color: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="input flex-1"
                        value={editingBanner.background_color}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, background_color: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-10 rounded cursor-pointer"
                        value={editingBanner.text_color}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, text_color: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="input flex-1"
                        value={editingBanner.text_color}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, text_color: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Start Date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={
                        editingBanner.start_date
                          ? new Date(editingBanner.start_date).toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          start_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      End Date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={
                        editingBanner.end_date
                          ? new Date(editingBanner.end_date).toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          end_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Link URL (optional)
                    </label>
                    <input
                      type="url"
                      className="input"
                      value={editingBanner.link_url || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, link_url: e.target.value || null })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Link Text (optional)
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editingBanner.link_text || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, link_text: e.target.value || null })
                      }
                      placeholder="Learn More"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Sort Order (lower numbers appear first)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={editingBanner.sort_order}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, sort_order: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="banner-active"
                    className="mr-2"
                    checked={editingBanner.is_active}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, is_active: e.target.checked })
                    }
                  />
                  <label htmlFor="banner-active" className="text-sm text-gray-300">
                    Banner is active and visible to visitors
                  </label>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: editingBanner.background_color,
                    color: editingBanner.text_color,
                  }}
                >
                  <p className="text-sm font-medium">Preview:</p>
                  <p className="text-sm mt-1">{editingBanner.message || 'Your message will appear here'}</p>
                  {editingBanner.link_url && editingBanner.link_text && (
                    <a
                      href={editingBanner.link_url}
                      className="text-sm font-semibold underline mt-2 inline-block"
                      style={{ color: editingBanner.text_color }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {editingBanner.link_text} →
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingBanner(null);
                    setIsCreating(false);
                  }}
                  className="btn bg-white border border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary">
                  {isCreating ? 'Create Banner' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPromotionsPage;
