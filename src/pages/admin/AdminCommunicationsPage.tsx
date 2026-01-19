import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Plus, Edit2, Trash2, Send, Clock, CheckCircle2, XCircle, Eye, X, Webhook } from 'lucide-react';
import WebhookHealthMonitor from '../../components/admin/WebhookHealthMonitor';
import EmailQueueManager from '../../components/admin/EmailQueueManager';

const AdminCommunicationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'scheduled' | 'history' | 'webhooks' | 'queue'>('templates');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Mock data - will be replaced with actual service calls
  const mockTemplates = [
    {
      id: '1',
      name: 'Booking Confirmation',
      subject: 'Your Bond Booking Confirmation - {{booking_reference}}',
      template_type: 'booking_confirmation',
      is_active: true,
      variables: ['guest_name', 'booking_reference', 'check_in_date', 'check_out_date', 'apartment_name', 'total_amount']
    },
    {
      id: '2',
      name: 'Check-in Reminder',
      subject: 'Your Bond Check-in is Tomorrow - {{booking_reference}}',
      template_type: 'check_in_reminder',
      is_active: true,
      variables: ['guest_name', 'booking_reference', 'building_name', 'apartment_name', 'check_in_time', 'access_code']
    },
    {
      id: '3',
      name: 'Check-out Reminder',
      subject: 'Check-out Tomorrow - {{booking_reference}}',
      template_type: 'check_out_reminder',
      is_active: true,
      variables: ['guest_name', 'booking_reference', 'check_out_time']
    }
  ];

  const mockScheduled = [
    {
      id: '1',
      recipient_email: 'guest@example.com',
      recipient_name: 'John Doe',
      subject: 'Your Bond Check-in is Tomorrow - BND-12345',
      scheduled_for: new Date(Date.now() + 86400000).toISOString(),
      status: 'pending'
    }
  ];

  const mockHistory = [
    {
      id: '1',
      recipient_email: 'guest@example.com',
      subject: 'Your Bond Booking Confirmation - BND-12345',
      status: 'sent',
      sent_at: new Date(Date.now() - 3600000).toISOString(),
      message_type: 'email'
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
      sent: 'bg-green-900/50 text-green-300 border border-green-700',
      failed: 'bg-red-900/50 text-red-300 border border-red-700',
      cancelled: 'bg-gray-700/50 text-gray-300 border border-gray-600'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Helmet>
        <title>Communications - Bond Admin</title>
      </Helmet>

      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Communications</h1>
            <p className="text-gray-300 text-sm sm:text-base">Manage email templates and automated messages</p>
          </div>
          {activeTab === 'templates' && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Template</span>
            </button>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-300 mb-1">Automated Guest Communications</h3>
              <p className="text-sm text-blue-200">
                Create email templates with dynamic variables to automate booking confirmations, check-in reminders, and follow-ups.
                Schedule messages or send immediately to enhance guest experience.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <Mail className="w-4 h-4" />
            Templates ({mockTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'scheduled'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            Scheduled ({mockScheduled.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            History ({mockHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'webhooks'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <Webhook className="w-4 h-4" />
            Webhooks
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email Queue
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid gap-4">
            {mockTemplates.map((template) => (
              <div key={template.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        template.is_active
                          ? 'bg-green-900/50 text-green-300 border border-green-700'
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700">
                        {template.template_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">Subject: {template.subject}</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <span
                          key={variable}
                          className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded font-mono"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplateModal(true);
                      }}
                      className="p-2 text-indigo-400 hover:bg-gray-700 rounded-lg transition"
                      title="Edit template"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition"
                      title="Preview template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this template?')) {
                          console.log('Delete template:', template.id);
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-4">
            {mockScheduled.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No scheduled messages</h3>
                <p className="text-gray-300">Scheduled messages will appear here</p>
              </div>
            ) : (
              mockScheduled.map((message) => (
                <div key={message.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-white">{message.subject}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(message.status)}`}>
                          {message.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-1">
                        To: {message.recipient_name} ({message.recipient_email})
                      </p>
                      <p className="text-sm text-gray-400">
                        Scheduled for: {formatDate(message.scheduled_for)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition"
                        title="Cancel scheduled message"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {mockHistory.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-white">{message.recipient_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{message.subject}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(message.status)}`}>
                          {message.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{formatDate(message.sent_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <WebhookHealthMonitor />
          </div>
        )}

        {/* Email Queue Tab */}
        {activeTab === 'queue' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <EmailQueueManager />
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {selectedTemplate ? 'Edit Template' : 'New Email Template'}
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-200">
                <strong>Note:</strong> Use <code className="px-1 py-0.5 bg-blue-900/50 rounded">{'{{variable_name}}'}</code> for dynamic content.
                Available variables will be replaced with actual booking data when sending.
              </p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Welcome Email"
                  defaultValue={selectedTemplate?.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Type</label>
                <select
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  defaultValue={selectedTemplate?.template_type || 'custom'}
                >
                  <option value="booking_confirmation">Booking Confirmation</option>
                  <option value="check_in_reminder">Check-in Reminder</option>
                  <option value="check_out_reminder">Check-out Reminder</option>
                  <option value="welcome">Welcome Message</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject Line</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Welcome to Bond - {{guest_name}}"
                  defaultValue={selectedTemplate?.subject}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Body</label>
                <textarea
                  rows={10}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  placeholder="Hi {{guest_name}},&#10;&#10;Thank you for booking with Bond!&#10;&#10;..."
                  defaultValue={selectedTemplate?.body}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="rounded"
                  defaultChecked={selectedTemplate?.is_active !== false}
                />
                <label htmlFor="is_active" className="text-sm text-gray-300">
                  Template is active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Template functionality will be connected to the communications service');
                    setShowTemplateModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {selectedTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCommunicationsPage;
