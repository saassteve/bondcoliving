import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Plus, Edit2, Trash2, Eye, EyeOff, Star, ArrowUp, ArrowDown } from 'lucide-react';

interface LocalContent {
  id: string;
  title: string;
  category: string;
  content: string;
  visibility: string;
  order_index: number;
  is_published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

const categories = [
  { value: 'dining', label: 'Dining' },
  { value: 'activities', label: 'Activities' },
  { value: 'transport', label: 'Transport' },
  { value: 'essentials', label: 'Essentials' },
  { value: 'building', label: 'Building Info' },
  { value: 'emergency', label: 'Emergency' },
];

export default function AdminLocalInfoPage() {
  const [content, setContent] = useState<LocalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    category: 'dining',
    content: '',
    visibility: 'all',
    is_published: true,
    featured: false,
  });

  useEffect(() => {
    loadContent();
  }, [filterCategory]);

  const loadContent = async () => {
    setLoading(true);

    let query = supabase
      .from('local_content')
      .select('*')
      .order('order_index', { ascending: true });

    if (filterCategory !== 'all') {
      query = query.eq('category', filterCategory);
    }

    const { data } = await query;
    if (data) setContent(data);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingId) {
      const { error } = await supabase
        .from('local_content')
        .update(formData)
        .eq('id', editingId);

      if (!error) {
        resetForm();
        loadContent();
      }
    } else {
      const maxOrder = content.reduce((max, item) => Math.max(max, item.order_index), 0);

      const { error } = await supabase
        .from('local_content')
        .insert({
          ...formData,
          order_index: maxOrder + 1,
          created_by: user.id,
        });

      if (!error) {
        resetForm();
        loadContent();
      }
    }
  };

  const handleEdit = (item: LocalContent) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      category: item.category,
      content: item.content,
      visibility: item.visibility,
      is_published: item.is_published,
      featured: item.featured,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    const { error } = await supabase
      .from('local_content')
      .delete()
      .eq('id', id);

    if (!error) loadContent();
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('local_content')
      .update({ is_published: !currentStatus })
      .eq('id', id);

    if (!error) loadContent();
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('local_content')
      .update({ featured: !currentStatus })
      .eq('id', id);

    if (!error) loadContent();
  };

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = content.findIndex(item => item.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= content.length) return;

    const currentItem = content[currentIndex];
    const targetItem = content[targetIndex];

    await supabase
      .from('local_content')
      .update({ order_index: targetItem.order_index })
      .eq('id', currentItem.id);

    await supabase
      .from('local_content')
      .update({ order_index: currentItem.order_index })
      .eq('id', targetItem.id);

    loadContent();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'dining',
      content: '',
      visibility: 'all',
      is_published: true,
      featured: false,
    });
    setEditingId(null);
    setShowModal(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      dining: 'bg-orange-900/50 text-orange-300 border border-orange-700',
      activities: 'bg-purple-900/50 text-purple-300 border border-purple-700',
      transport: 'bg-blue-900/50 text-blue-300 border border-blue-700',
      essentials: 'bg-green-900/50 text-green-300 border border-green-700',
      building: 'bg-gray-700/50 text-gray-300 border border-gray-600',
      emergency: 'bg-red-900/50 text-red-300 border border-red-700',
    };
    return colors[category] || 'bg-gray-700/50 text-gray-300 border border-gray-600';
  };

  const getVisibilityColor = (visibility: string) => {
    const colors: { [key: string]: string } = {
      all: 'bg-blue-900/50 text-blue-300 border border-blue-700',
      overnight: 'bg-purple-900/50 text-purple-300 border border-purple-700',
      coworking: 'bg-green-900/50 text-green-300 border border-green-700',
    };
    return colors[visibility] || 'bg-gray-700/50 text-gray-300 border border-gray-600';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Local Information</h1>
          <p className="text-gray-300">Manage local guides and recommendations for guests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Content
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
            filterCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              filterCategory === cat.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : content.length === 0 ? (
        <div className="bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-700">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No content yet</h3>
          <p className="text-gray-300 mb-6">Add local information to help guests explore the area</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Content
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {content.map((item, index) => (
            <div
              key={item.id}
              className={`bg-gray-800 rounded-xl shadow-sm p-6 border ${
                item.featured ? 'border-2 border-yellow-500' : 'border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {item.featured && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                      {categories.find(c => c.value === item.category)?.label}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVisibilityColor(item.visibility)}`}>
                      {item.visibility === 'all' ? 'All Guests' : item.visibility}
                    </span>
                    {!item.is_published && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-700/50 text-gray-300 border border-gray-600">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{item.content}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => moveItem(item.id, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="h-5 w-5 text-gray-300" />
                  </button>
                  <button
                    onClick={() => moveItem(item.id, 'down')}
                    disabled={index === content.length - 1}
                    className="p-2 hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="h-5 w-5 text-gray-300" />
                  </button>
                  <button
                    onClick={() => toggleFeatured(item.id, item.featured)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                    title={item.featured ? 'Unfeature' : 'Feature'}
                  >
                    <Star className={`h-5 w-5 ${item.featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                  </button>
                  <button
                    onClick={() => togglePublished(item.id, item.is_published)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                    title={item.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {item.is_published ? (
                      <Eye className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                  >
                    <Edit2 className="h-5 w-5 text-indigo-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                  >
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] border border-gray-700 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? 'Edit Content' : 'New Content'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Best Coffee Shops Nearby"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Visible To
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Guests</option>
                    <option value="overnight">Overnight Guests</option>
                    <option value="coworking">Coworking Members</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Detailed information, tips, addresses, opening hours, etc..."
                  required
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="mr-2 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="mr-2 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Published</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {editingId ? 'Update' : 'Create'} Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
