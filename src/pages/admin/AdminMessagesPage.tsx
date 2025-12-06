import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Send, X, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  guest_users: {
    full_name: string;
    email: string;
    user_type: string;
  };
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

export default function AdminMessagesPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('open');

  useEffect(() => {
    loadTickets();
  }, [filterStatus]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    setLoading(true);

    let query = supabase
      .from('admin_support_tickets')
      .select(`
        *,
        guest_users (
          full_name,
          email,
          user_type
        )
      `)
      .order('last_message_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;

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
    }
    setLoadingMessages(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSending(true);

    const { error } = await supabase
      .from('admin_support_messages')
      .insert({
        ticket_id: selectedTicket.id,
        sender_type: 'admin',
        sender_id: user.id,
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

  const updateTicketStatus = async (ticketId: string, status: string) => {
    const { error } = await supabase
      .from('admin_support_tickets')
      .update({ status })
      .eq('id', ticketId);

    if (!error) {
      await loadTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-900/50 text-red-300 border border-red-700';
      case 'high':
        return 'bg-orange-900/50 text-orange-300 border border-orange-700';
      case 'normal':
        return 'bg-blue-900/50 text-blue-300 border border-blue-700';
      case 'low':
        return 'bg-gray-700/50 text-gray-300 border border-gray-600';
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Guest Messages</h1>
          <p className="text-gray-300">Respond to guest inquiries and support requests</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('open')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'open'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'in_progress'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('resolved')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'resolved'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          Resolved
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h2 className="font-semibold text-white">Conversations ({tickets.length})</h2>
              </div>
              <div className="divide-y divide-gray-700 max-h-[700px] overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-300 text-sm">No conversations</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-left p-4 hover:bg-gray-750 transition ${
                        selectedTicket?.id === ticket.id ? 'bg-gray-750' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">
                            {ticket.subject}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {ticket.guest_users?.full_name} • {ticket.guest_users?.user_type}
                          </p>
                        </div>
                        <div className="ml-2">{getStatusIcon(ticket.status)}</div>
                      </div>
                      {ticket.last_message_preview && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                          {ticket.last_message_preview}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs text-gray-500">
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
              <div className="bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-700 flex flex-col h-[700px]">
                {/* Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="font-semibold text-white">{selectedTicket.subject}</h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <User className="h-4 w-4" />
                        <span>{selectedTicket.guest_users?.full_name}</span>
                        <span>•</span>
                        <span>{selectedTicket.guest_users?.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-gray-400 hover:text-white transition lg:hidden"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                      className="px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-700 text-gray-300 border border-gray-600">
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-xl p-4 ${
                            message.sender_type === 'admin'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-700 text-gray-100 border border-gray-600'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          <p
                            className={`text-xs mt-2 ${
                              message.sender_type === 'admin' ? 'text-indigo-200' : 'text-gray-400'
                            }`}
                          >
                            {formatMessageTime(message.created_at)}
                            {message.sender_type === 'admin' && ' • You'}
                            {message.sender_type === 'guest' && ` • ${selectedTicket.guest_users?.full_name}`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                {selectedTicket.status !== 'closed' && (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-700">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
                <p className="text-gray-300">
                  Choose a conversation from the left to view and respond to guest messages
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
