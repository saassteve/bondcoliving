import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WebhookLog {
  id: string;
  event_id: string;
  event_type: string;
  processing_status: string;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export default function WebhookHealthMonitor() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    processing: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadWebhookLogs();
  }, []);

  async function loadWebhookLogs() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setLogs(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading webhook logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(webhookLogs: WebhookLog[]) {
    const total = webhookLogs.length;
    const success = webhookLogs.filter((log) => log.processing_status === 'success').length;
    const failed = webhookLogs.filter((log) => log.processing_status === 'failed').length;
    const processing = webhookLogs.filter((log) => log.processing_status === 'processing' || log.processing_status === 'received').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    setStats({
      total,
      success,
      failed,
      processing,
      successRate,
    });
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
      case 'received':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'processing':
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleString();
  }

  function getEventTypeDisplay(eventType: string) {
    const types: Record<string, string> = {
      'checkout.session.completed': 'Checkout Complete',
      'checkout.session.expired': 'Session Expired',
      'payment_intent.succeeded': 'Payment Success',
      'payment_intent.payment_failed': 'Payment Failed',
      'charge.refunded': 'Refund Processed',
    };
    return types[eventType] || eventType;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Webhook Health Monitor</h2>
        <button
          onClick={loadWebhookLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-700">{stats.success}</div>
          <div className="text-sm text-green-600">Successful</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-2xl font-bold text-yellow-700">{stats.processing}</div>
          <div className="text-sm text-yellow-600">Processing</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.successRate}%</div>
          <div className="text-sm text-blue-600">Success Rate</div>
        </div>
      </div>

      {stats.successRate < 90 && stats.total > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Low Success Rate Alert</h3>
              <p className="text-sm text-red-700 mt-1">
                Your webhook success rate is below 90%. Please check your Stripe webhook
                configuration and ensure STRIPE_WEBHOOK_SECRET is properly set.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Recent Webhook Events</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading webhook logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No webhook events recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(log.processing_status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {getEventTypeDisplay(log.event_type)}
                        </span>
                        {getStatusBadge(log.processing_status)}
                      </div>
                      <p className="text-sm text-gray-600">Event ID: {log.event_id}</p>
                      {log.error_message && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {log.error_message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Webhook Configuration</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <strong>Endpoint URL:</strong> {window.location.origin.replace(/:\d+/, '')}/functions/v1/stripe-webhook
          </p>
          <p>
            <strong>Events to monitor:</strong> checkout.session.completed, payment_intent.succeeded,
            payment_intent.payment_failed
          </p>
        </div>
      </div>
    </div>
  );
}
