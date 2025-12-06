import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCurrentGuestUser, type GuestUser } from '../../lib/guestAuth';
import { MessageSquare, Plus, Send, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'guest' | 'admin';
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function GuestMessagesPage() {
  const { guestUser } = useOutletContext<{ guestUser: GuestUser | null }>();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'general' as 'general' | 'maintenance' | 'billing' | 'amenities' | 'other',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    message: '',
  });

  useEffect(() => {
    if (guestUser) {
      loadTickets();
    }
  }, [guestUser]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    if (!guestUser) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('admin_support_tickets')
      .select('*')
      .eq('guest_user_id', guestUser.id)
      .order('last_message_at', { ascending: false });

    if (data && !error) {
      setTickets(data);
    }
    setLoading(false);
  };

  const loadMessages = async (ticketId: string) => {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('admin_support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setMessages(data);

      // Mark messages as read
      const unreadMessages = data.filter(m => m.sender_type === 'admin' && !m.is_read);
      if (unreadMessages.length > 0) {
        await supabase
          .from('admin_support_messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id));
      }
    }
    setLoadingMessages(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestUser) return;

    setSending(true);

    try {
      // Create ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('admin_support_tickets')
        .insert({
          guest_user_id: guestUser.id,
          subject: newTicketForm.subject,
          category: newTicketForm.category,
          priority: newTicketForm.priority,
        })
        .select()
        .single();

      if (ticketError || !ticketData) {
        console.error('Error creating ticket:', ticketError);
        alert('Failed to create ticket. Please try again.');
        setSending(false);
        return;
      }

      // Add first message
      const { error: messageError } = await supabase
        .from('admin_support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_type: 'guest',
          sender_id: guestUser.id,
          message: newTicketForm.message,
        });

      if (messageError) {
        console.error('Error creating message:', messageError);
        alert('Ticket created but failed to add message.');
      }

      setNewTicketForm({
        subject: '',
        category: 'general',
        priority: 'normal',
        message: '',
      });
      setShowNewTicket(false);
      await loadTickets();
      setSelectedTicket(ticketData);
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestUser || !selectedTicket || !newMessage.trim()) return;

    setSending(true);

    const { error } = await supabase
      .from('admin_support_messages')
      .insert({
        ticket_id: selectedTicket.id,
        sender_type: 'guest',
        sender_id: guestUser.id,
        message: newMessage,
      });

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } else {
      setNewMessage('');
      await loadMessages(selectedTicket.id);
      await loadTickets();
    }

    setSending(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-900/50 text-blue-300 border border-blue-700';
      case 'in_progress':
        return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700';
      case 'resolved':
      case 'closed':
        return 'bg-green-900/50 text-green-300 border border-green-700';
      default:
        return 'bg-gray-700/50 text-gray-300 border border-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#1E1F1E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <MessageSquare className="h-8 w-8 mr-3 text-[#C5C5B5]" />
              Contact Bond Team
            </h1>
            <p className="text-[#C5C5B5]/80">Get help and support from our team</p>
          </div>
          <button
            onClick={() => setShowNewTicket(true)}
            className="flex items-center px-4 py-2 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Conversation
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5C5B5]"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-1">
              <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-[#C5C5B5]/20">
                  <h2 className="font-semibold text-white">Your Conversations</h2>
                </div>
                <div className="divide-y divide-[#C5C5B5]/10">
                  {tickets.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-[#C5C5B5]/40 mx-auto mb-3" />
                      <p className="text-[#C5C5B5]/60 text-sm">No conversations yet</p>
                      <p className="text-[#C5C5B5]/40 text-xs mt-1">Start one to get help</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full text-left p-4 hover:bg-[#C5C5B5]/10 transition ${
                          selectedTicket?.id === ticket.id ? 'bg-[#C5C5B5]/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-sm line-clamp-1">{ticket.subject}</h3>
                          <div className="ml-2">{getStatusIcon(ticket.status)}</div>
                        </div>
                        {ticket.last_message_preview && (
                          <p className="text-xs text-[#C5C5B5]/70 line-clamp-2 mb-2">
                            {ticket.last_message_preview}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-[#C5C5B5]/50">
                            {formatDate(ticket.last_message_at)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col h-[600px]">
                  {/* Header */}
                  <div className="p-4 border-b border-[#C5C5B5]/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-white">{selectedTicket.subject}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedTicket.status)}`}>
                            {selectedTicket.status.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#C5C5B5]/20 text-[#C5C5B5]">
                            {selectedTicket.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="text-[#C5C5B5]/60 hover:text-white transition lg:hidden"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5C5B5]"></div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_type === 'guest' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl p-4 ${
                              message.sender_type === 'guest'
                                ? 'bg-[#C5C5B5] text-[#1E1F1E]'
                                : 'bg-[#C5C5B5]/10 text-white border border-[#C5C5B5]/20'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                            <p
                              className={`text-xs mt-2 ${
                                message.sender_type === 'guest' ? 'text-[#1E1F1E]/60' : 'text-[#C5C5B5]/50'
                              }`}
                            >
                              {formatMessageTime(message.created_at)}
                              {message.sender_type === 'admin' && ' • Bond Team'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  {selectedTicket.status !== 'closed' && (
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-[#C5C5B5]/20">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 text-white rounded-lg focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent placeholder-[#C5C5B5]/40"
                          disabled={sending}
                        />
                        <button
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                          className="px-4 py-2 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-12 text-center backdrop-blur-sm">
                  <MessageSquare className="h-16 w-16 text-[#C5C5B5]/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Select a Conversation</h3>
                  <p className="text-[#C5C5B5]/60 mb-6">
                    Choose a conversation from the left to view messages
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">New Conversation</h2>
              <button
                onClick={() => setShowNewTicket(false)}
                className="text-[#C5C5B5]/60 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 text-white rounded-lg focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent"
                  placeholder="Brief description of your request"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                    Category
                  </label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as any })}
                    className="w-full px-4 py-2 bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 text-white rounded-lg focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="billing">Billing</option>
                    <option value="amenities">Amenities</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                    Priority
                  </label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value as any })}
                    className="w-full px-4 py-2 bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 text-white rounded-lg focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
                  Message
                </label>
                <textarea
                  value={newTicketForm.message}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 text-white rounded-lg focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent"
                  placeholder="Describe your request or question..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-[#C5C5B5]/20 text-[#C5C5B5] rounded-lg hover:bg-[#C5C5B5]/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {sending ? 'Creating...' : 'Start Conversation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
