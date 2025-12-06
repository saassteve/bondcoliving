import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ClipboardList, CheckCircle, Clock, XCircle, MessageSquare } from 'lucide-react';

interface ServiceRequest {
  id: string;
  request_type: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  photos: any;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  guest_users: {
    full_name: string;
    email: string;
    user_type: string;
  };
}

interface StayExtension {
  id: string;
  current_checkout_date: string;
  requested_checkout_date: string;
  nights_extended: number;
  total_price: number;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  guest_users: {
    full_name: string;
    email: string;
  };
  bookings: {
    guest_name: string;
  };
  apartments: {
    title: string;
  };
}

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'extensions'>('requests');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [extensions, setExtensions] = useState<StayExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedExtension, setSelectedExtension] = useState<StayExtension | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, [activeTab, filterStatus]);

  const loadData = async () => {
    setLoading(true);

    if (activeTab === 'requests') {
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          guest_users (
            full_name,
            email,
            user_type
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data } = await query;
      if (data) setRequests(data);
    } else {
      let query = supabase
        .from('stay_extension_requests')
        .select(`
          *,
          guest_users (
            full_name,
            email
          ),
          bookings (
            guest_name
          ),
          apartments (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data } = await query;
      if (data) setExtensions(data);
    }

    setLoading(false);
  };

  const updateRequestStatus = async (id: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updates: any = { status };

    if (status === 'completed') {
      updates.resolved_by = user.id;
      updates.resolved_at = new Date().toISOString();
    }

    if (adminNotes && selectedRequest) {
      updates.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setSelectedRequest(null);
      setAdminNotes('');
      loadData();
    }
  };

  const updateExtensionStatus = async (id: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updates: any = { status };

    if (status !== 'pending') {
      updates.reviewed_by = user.id;
      updates.reviewed_at = new Date().toISOString();
    }

    if (adminNotes && selectedExtension) {
      updates.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from('stay_extension_requests')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setSelectedExtension(null);
      setAdminNotes('');
      loadData();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      paid: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
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

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Management</h1>
          <p className="text-gray-600">Manage guest service requests and stay extensions</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Service Requests ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('extensions')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'extensions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Stay Extensions ({extensions.filter(e => e.status === 'pending').length})
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
        {activeTab === 'requests' ? (
          <>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'rejected'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'requests' ? (
        requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No service requests</h3>
            <p className="text-gray-600">Service requests from guests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => {
                  setSelectedRequest(request);
                  setAdminNotes(request.admin_notes || '');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{request.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {request.request_type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{request.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>From: {request.guest_users?.full_name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDate(request.created_at)}</span>
                    </div>
                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Admin Notes:</strong> {request.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        extensions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No extension requests</h3>
            <p className="text-gray-600">Stay extension requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {extensions.map((extension) => (
              <div
                key={extension.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => {
                  setSelectedExtension(extension);
                  setAdminNotes(extension.admin_notes || '');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {extension.bookings?.guest_name || extension.guest_users?.full_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(extension.status)}`}>
                        {extension.status}
                      </span>
                    </div>
                    <div className="mb-3 space-y-1">
                      <p className="text-gray-900 font-medium">{extension.apartments?.title}</p>
                      <p className="text-gray-600">
                        Current checkout: {formatDateOnly(extension.current_checkout_date)}
                      </p>
                      <p className="text-gray-600">
                        Requested checkout: {formatDateOnly(extension.requested_checkout_date)}
                      </p>
                      <p className="text-gray-900 font-semibold">
                        +{extension.nights_extended} nights • €{extension.total_price}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{extension.guest_users?.email}</span>
                      <span>•</span>
                      <span>{formatDate(extension.created_at)}</span>
                    </div>
                    {extension.admin_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Admin Notes:</strong> {extension.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Request Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest</label>
                <p className="text-gray-900">{selectedRequest.guest_users?.full_name}</p>
                <p className="text-sm text-gray-600">{selectedRequest.guest_users?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                <p className="text-gray-900 capitalize">{selectedRequest.request_type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900">{selectedRequest.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{selectedRequest.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about this request..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <div className="flex gap-3">
                  {selectedRequest.status !== 'in_progress' && (
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'in_progress')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {selectedRequest.status !== 'completed' && (
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'completed')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Mark Completed
                    </button>
                  )}
                  {selectedRequest.status !== 'cancelled' && (
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'cancelled')}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedRequest(null);
                setAdminNotes('');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {selectedExtension && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Stay Extension Request</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest</label>
                <p className="text-gray-900">{selectedExtension.guest_users?.full_name}</p>
                <p className="text-sm text-gray-600">{selectedExtension.guest_users?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apartment</label>
                <p className="text-gray-900">{selectedExtension.apartments?.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Checkout</label>
                  <p className="text-gray-900">{formatDateOnly(selectedExtension.current_checkout_date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requested Checkout</label>
                  <p className="text-gray-900">{formatDateOnly(selectedExtension.requested_checkout_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Nights</label>
                  <p className="text-gray-900">{selectedExtension.nights_extended} nights</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price</label>
                  <p className="text-gray-900 font-semibold">€{selectedExtension.total_price}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about this extension request..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <div className="flex gap-3">
                  {selectedExtension.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateExtensionStatus(selectedExtension.id, 'approved')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateExtensionStatus(selectedExtension.id, 'rejected')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedExtension.status === 'approved' && (
                    <button
                      onClick={() => updateExtensionStatus(selectedExtension.id, 'paid')}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedExtension(null);
                setAdminNotes('');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
