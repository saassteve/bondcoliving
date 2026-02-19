import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/services/client';
import {
  Key, Plus, Trash2, Copy, Check, RefreshCw, Eye, EyeOff,
  Activity, Clock, Shield, AlertCircle, X, ChevronDown, ChevronUp
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  request_count: number;
  created_at: string;
}

interface ApiRequestLog {
  id: string;
  endpoint: string;
  method: string;
  query_params: Record<string, string>;
  response_status: number;
  ip_address: string | null;
  requested_at: string;
}

interface NewKeyResult {
  id: string;
  plainKey: string;
  name: string;
}

const ALL_SCOPES = [
  { value: 'bookings:read', label: 'Bookings', description: 'Read coworking and apartment bookings' },
  { value: 'passes:read', label: 'Passes', description: 'Read coworking pass types and pricing' },
  { value: 'stats:read', label: 'Statistics', description: 'Read revenue and booking statistics' },
  { value: 'customers:read', label: 'Customers', description: 'Read aggregated customer data' },
];

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(40);
  crypto.getRandomValues(array);
  return 'bk_' + Array.from(array).map((b) => chars[b % chars.length]).join('');
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function statusColor(code: number) {
  if (code < 300) return 'text-green-400';
  if (code < 400) return 'text-yellow-400';
  return 'text-red-400';
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<ApiRequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<NewKeyResult | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState(false);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['bookings:read']);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadKeys = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, is_active, last_used_at, request_count, created_at')
      .order('created_at', { ascending: false });
    setKeys(data ?? []);
    setLoading(false);
  }, []);

  const loadLogs = useCallback(async (keyId: string) => {
    setLogsLoading(true);
    const { data } = await supabase
      .from('api_request_logs')
      .select('id, endpoint, method, query_params, response_status, ip_address, requested_at')
      .eq('api_key_id', keyId)
      .order('requested_at', { ascending: false })
      .limit(50);
    setLogs(data ?? []);
    setLogsLoading(false);
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  useEffect(() => {
    if (selectedKeyId) loadLogs(selectedKeyId);
    else setLogs([]);
  }, [selectedKeyId, loadLogs]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) { setCreateError('Please enter a name for this key.'); return; }
    if (newKeyScopes.length === 0) { setCreateError('Select at least one scope.'); return; }
    setCreating(true);
    setCreateError('');

    const plainKey = generateApiKey();
    const keyHash = await sha256Hex(plainKey);
    const keyPrefix = plainKey.slice(0, 10);

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .maybeSingle();

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        name: newKeyName.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: newKeyScopes,
        created_by: adminData?.id ?? null,
      })
      .select('id')
      .single();

    setCreating(false);

    if (error) {
      setCreateError('Failed to create API key. Please try again.');
      return;
    }

    setNewKeyResult({ id: data.id, plainKey, name: newKeyName.trim() });
    setShowCreateModal(false);
    setNewKeyName('');
    setNewKeyScopes(['bookings:read']);
    loadKeys();
  };

  const handleToggleActive = async (key: ApiKey) => {
    await supabase
      .from('api_keys')
      .update({ is_active: !key.is_active, updated_at: new Date().toISOString() })
      .eq('id', key.id);
    loadKeys();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this API key? Any agents using it will lose access immediately.')) return;
    setDeletingId(id);
    await supabase.from('api_keys').delete().eq('id', id);
    if (selectedKeyId === id) setSelectedKeyId(null);
    setDeletingId(null);
    loadKeys();
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const baseUrl = `${supabaseUrl}/functions/v1`;

  const endpoints = [
    {
      method: 'GET', path: '/api-bookings', scope: 'bookings:read',
      description: 'List coworking or apartment bookings with optional filters.',
      params: [
        { name: 'type', type: 'string', description: '"coworking" (default) or "apartment"' },
        { name: 'status', type: 'string', description: 'Filter by booking_status (pending, confirmed, cancelled)' },
        { name: 'email', type: 'string', description: 'Filter by customer email (partial match)' },
        { name: 'reference', type: 'string', description: 'Look up by exact booking reference' },
        { name: 'start_date', type: 'date', description: 'Filter bookings from this date (YYYY-MM-DD)' },
        { name: 'end_date', type: 'date', description: 'Filter bookings up to this date (YYYY-MM-DD)' },
        { name: 'page', type: 'number', description: 'Page number (default: 1)' },
        { name: 'limit', type: 'number', description: 'Results per page, max 100 (default: 50)' },
      ],
    },
    {
      method: 'GET', path: '/api-passes', scope: 'passes:read',
      description: 'List all coworking pass types with pricing and availability.',
      params: [
        { name: 'active_only', type: 'boolean', description: '"true" (default) or "false" to include inactive passes' },
      ],
    },
    {
      method: 'GET', path: '/api-stats', scope: 'stats:read',
      description: 'Revenue and booking statistics for both coworking and apartments.',
      params: [
        { name: 'start_date', type: 'date', description: 'Start of date range (YYYY-MM-DD)' },
        { name: 'end_date', type: 'date', description: 'End of date range (YYYY-MM-DD)' },
      ],
    },
    {
      method: 'GET', path: '/api-customers', scope: 'customers:read',
      description: 'Aggregated customer data across all booking types.',
      params: [
        { name: 'search', type: 'string', description: 'Filter by name or email' },
        { name: 'page', type: 'number', description: 'Page number (default: 1)' },
        { name: 'limit', type: 'number', description: 'Results per page, max 100 (default: 50)' },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-gray-400">Manage access keys for AI agents and external integrations</p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setCreateError(''); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New API Key
        </button>
      </div>

      {/* API Documentation */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl mb-8">
        <button
          onClick={() => setExpandedDocs(!expandedDocs)}
          className="flex items-center justify-between w-full px-6 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">API Reference</span>
            <span className="text-xs text-gray-400 font-mono bg-gray-700 px-2 py-0.5 rounded">
              {baseUrl}
            </span>
          </div>
          {expandedDocs ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {expandedDocs && (
          <div className="border-t border-gray-700 px-6 pb-6">
            <div className="mt-4 mb-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-400 mb-2 font-medium">Authentication</p>
              <code className="text-sm text-green-400 font-mono">
                Authorization: Bearer {'<your_api_key>'}
              </code>
            </div>

            <div className="space-y-6">
              {endpoints.map((ep) => (
                <div key={ep.path} className="border border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/60">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-900/40 border border-emerald-700 px-2 py-0.5 rounded">
                      {ep.method}
                    </span>
                    <code className="text-sm text-white font-mono">{baseUrl}{ep.path}</code>
                    <span className="ml-auto text-xs text-gray-500 font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                      {ep.scope}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-300 mb-3">{ep.description}</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-700">
                          <th className="pb-2 font-medium w-32">Parameter</th>
                          <th className="pb-2 font-medium w-20">Type</th>
                          <th className="pb-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {ep.params.map((p) => (
                          <tr key={p.name}>
                            <td className="py-1.5 font-mono text-blue-300">{p.name}</td>
                            <td className="py-1.5 text-gray-500">{p.type}</td>
                            <td className="py-1.5 text-gray-400">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Keys List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
            </div>
          ) : keys.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
              <Key className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">No API keys yet</p>
              <p className="text-gray-400 text-sm">Create a key to give your AI agent access</p>
            </div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                onClick={() => setSelectedKeyId(selectedKeyId === key.id ? null : key.id)}
                className={`bg-gray-800 border rounded-xl p-4 cursor-pointer transition ${
                  selectedKeyId === key.id
                    ? 'border-blue-500 ring-1 ring-blue-500/40'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Key className={`w-4 h-4 flex-shrink-0 ${key.is_active ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className="text-white font-semibold truncate">{key.name}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(key); }}
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border transition ${
                        key.is_active
                          ? 'bg-green-900/40 text-green-300 border-green-700 hover:bg-green-900/70'
                          : 'bg-gray-700/40 text-gray-400 border-gray-600 hover:bg-gray-700'
                      }`}
                      title={key.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {key.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(key.id); }}
                      disabled={deletingId === key.id}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="font-mono text-xs text-gray-400 mb-3 bg-gray-900/60 px-2 py-1 rounded">
                  {key.key_prefix}••••••••••••••••••••••••••••••••
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {key.scopes.map((scope) => (
                    <span key={scope} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                      {scope}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {key.request_count.toLocaleString()} requests
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {key.last_used_at ? formatDateShort(key.last_used_at) : 'Never used'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Request Logs Panel */}
        <div className="lg:col-span-3">
          {!selectedKeyId ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center h-full flex flex-col items-center justify-center">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Select a key to view its request logs</p>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-semibold">Request Logs</span>
                  <span className="text-xs text-gray-500">(last 50)</span>
                </div>
                <button
                  onClick={() => loadLogs(selectedKeyId)}
                  className="p-1.5 text-gray-400 hover:text-white transition rounded"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {logsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : logs.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-gray-500 text-sm">No requests yet for this key</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50 max-h-[520px] overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="px-5 py-3 hover:bg-gray-700/30 transition">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-emerald-400 w-8">{log.method}</span>
                        <code className="text-sm text-white font-mono">{log.endpoint}</code>
                        <span className={`ml-auto text-sm font-bold font-mono ${statusColor(log.response_status)}`}>
                          {log.response_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(log.requested_at)}</span>
                        {log.ip_address && <span>· {log.ip_address}</span>}
                        {Object.keys(log.query_params ?? {}).length > 0 && (
                          <span className="font-mono text-gray-600 truncate max-w-xs">
                            ?{new URLSearchParams(log.query_params as Record<string, string>).toString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create API Key</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-white transition rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. AI Agent - Production"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scopes</label>
                <div className="space-y-2">
                  {ALL_SCOPES.map((scope) => (
                    <label
                      key={scope.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        newKeyScopes.includes(scope.value)
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="mt-0.5 accent-blue-500"
                      />
                      <div>
                        <p className="text-white text-sm font-medium">{scope.label}</p>
                        <p className="text-gray-400 text-xs">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {createError && (
                <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{createError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={creating}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {creating ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Key</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-time Key Display Modal */}
      {newKeyResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-900/40 rounded-lg border border-green-700">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">API Key Created</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              <span className="font-semibold text-yellow-400">Copy this key now.</span> For security, it will never be shown again after you close this dialog.
            </p>

            <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Key name: {newKeyResult.name}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-green-400 font-mono text-sm break-all">
                  {newKeyResult.plainKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newKeyResult.plainKey)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-gray-700"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 mb-6 text-sm">
              <p className="text-gray-400 mb-1 font-medium">Example usage:</p>
              <code className="text-gray-300 font-mono text-xs break-all">
                curl -H "Authorization: Bearer {newKeyResult.plainKey}" \<br />
                &nbsp;&nbsp;"{baseUrl}/api-bookings?type=coworking&limit=10"
              </code>
            </div>

            <button
              onClick={() => setNewKeyResult(null)}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              I've saved the key — Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
