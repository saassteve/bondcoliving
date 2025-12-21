import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, AlertTriangle, CheckCircle, Clock, Play, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { EmailQueueItem, EmailQueueStats } from '../../lib/services/types';

interface Props {
  onClose?: () => void;
}

const EmailQueueManager: React.FC<Props> = ({ onClose }) => {
  const [queue, setQueue] = useState<EmailQueueItem[]>([]);
  const [stats, setStats] = useState<EmailQueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [queueResult, statsResult] = await Promise.all([
        supabase
          .from('email_queue')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.rpc('get_email_queue_stats'),
      ]);

      if (queueResult.error) throw queueResult.error;
      if (statsResult.error) throw statsResult.error;

      setQueue(queueResult.data || []);
      setStats(statsResult.data);
    } catch (err) {
      console.error('Error fetching email queue:', err);
      setError('Failed to load email queue');
    } finally {
      setLoading(false);
    }
  };

  const processQueue = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase.functions.invoke('process-email-queue');

      if (error) throw error;

      if (data.processed > 0 || data.failed > 0) {
        setSuccess(`Processed ${data.processed} emails, ${data.failed} failed`);
      } else {
        setSuccess('No pending emails to process');
      }

      await fetchData();
    } catch (err) {
      console.error('Error processing queue:', err);
      setError('Failed to process email queue. Check that RESEND_API_KEY is configured.');
    } finally {
      setProcessing(false);
    }
  };

  const cancelEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({ status: 'cancelled' })
        .eq('id', emailId);

      if (error) throw error;

      await fetchData();
    } catch (err) {
      console.error('Error cancelling email:', err);
      setError('Failed to cancel email');
    }
  };

  const retryEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({
          status: 'pending',
          attempts: 0,
          next_retry_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', emailId);

      if (error) throw error;

      await fetchData();
      setSuccess('Email queued for retry');
    } catch (err) {
      console.error('Error retrying email:', err);
      setError('Failed to retry email');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-gray-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Email Queue</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={processQueue}
            disabled={processing}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Play className={`w-4 h-4 mr-2 ${processing ? 'animate-pulse' : ''}`} />
            {processing ? 'Processing...' : 'Process Queue'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-sm text-gray-400">Pending</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
            <p className="text-sm text-gray-400">Processing</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.sent}</p>
            <p className="text-sm text-gray-400">Sent</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            <p className="text-sm text-gray-400">Failed</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-300">{stats.total}</p>
            <p className="text-sm text-gray-400">Total (7 days)</p>
          </div>
        </div>
      )}

      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Email Domain Not Verified</p>
            <p className="text-red-400/80 text-sm mt-1">
              The domain <code className="bg-red-900/50 px-1 rounded">stayatbond.com</code> needs to be verified in Resend.
              Go to <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">resend.com/domains</a> to add and verify the domain.
              Until verified, emails cannot be sent to customers.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Recipient</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Attempts</th>
              <th className="pb-3 pr-4">Created</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {queue.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No emails in queue
                </td>
              </tr>
            ) : (
              queue.map((email) => (
                <tr key={email.id} className="text-sm">
                  <td className="py-3 pr-4">
                    <span className="text-white font-medium capitalize">
                      {email.email_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500 block">{email.booking_type}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-gray-300">{email.recipient_email}</span>
                    {email.recipient_name && (
                      <span className="text-xs text-gray-500 block">{email.recipient_name}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {getStatusBadge(email.status)}
                    {email.error_message && (
                      <p className="text-xs text-red-400 mt-1 max-w-xs truncate" title={email.error_message}>
                        {email.error_message}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {email.attempts}/{email.max_attempts}
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {new Date(email.created_at).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      {(email.status === 'failed' || email.status === 'cancelled') && (
                        <button
                          onClick={() => retryEmail(email.id)}
                          className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                          title="Retry"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      {email.status === 'pending' && (
                        <button
                          onClick={() => cancelEmail(email.id)}
                          className="p-1 rounded bg-gray-700 hover:bg-red-600 text-gray-300"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmailQueueManager;
