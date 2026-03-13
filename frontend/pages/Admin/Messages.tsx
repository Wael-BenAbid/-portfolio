import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Reply, Trash2, Check, X } from 'lucide-react';
import { API_BASE_URL } from '../../constants';
import { authFetch } from '../../services/api';
import { useAuth } from '../../App';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  admin_reply?: string;
  created_at: string;
  replied_at?: string;
}

export const AdminMessages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'replied'>('all');

  useEffect(() => {
    if (user?.user_type === 'admin') {
      fetchMessages();
    }
  }, [user?.user_type]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/settings/contact/messages/`);
      if (res.ok) {
        const data = await res.json();
        // Handle both array and paginated responses
        const messagesList = Array.isArray(data) ? data : (data.results || []);
        setMessages(messagesList);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
    setLoading(false);
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    setSending(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/settings/contact/${selectedMessage.id}/reply/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply: replyText }),
        }
      );
      
      if (res.ok) {
        setMessages(prev =>
          prev.map(m =>
            m.id === selectedMessage.id
              ? {
                  ...m,
                  status: 'replied',
                  admin_reply: replyText,
                  replied_at: new Date().toISOString(),
                }
              : m
          )
        );
        setSelectedMessage(null);
        setReplyText('');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
    setSending(false);
  };

  const deleteMessage = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message?')) return;
    
    try {
      const res = await authFetch(
        `${API_BASE_URL}/settings/contact/messages/${id}/`,
        { method: 'DELETE' }
      );
      
      if (res.ok || res.status === 204) {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'new') return m.status === 'new';
    if (filter === 'replied') return m.status === 'replied';
    return true;
  });

  if (user?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Accès refusé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold">Messages de Contact</h1>
        <p className="text-gray-400">Gérez les messages reçus et envoyez des réponses</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'new', 'replied'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === f
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {f === 'all' && `Tous (${messages.length})`}
            {f === 'new' && `Nouveaux (${messages.filter(m => m.status === 'new').length})`}
            {f === 'replied' && `Répondus (${messages.filter(m => m.status === 'replied').length})`}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="grid gap-4">
        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : filteredMessages.length === 0 ? (
          <p className="text-gray-400">Aucun message</p>
        ) : (
          filteredMessages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-lg border-l-4 cursor-pointer transition ${
                msg.status === 'new'
                  ? 'bg-gray-800/50 border-yellow-500 hover:bg-gray-800'
                  : 'bg-gray-900/50 border-green-500 hover:bg-gray-900'
              }`}
              onClick={() => setSelectedMessage(msg)}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white truncate">{msg.name}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      msg.status === 'new'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-green-500/20 text-green-300'
                    }`}>
                      {msg.status === 'new' ? 'Nouveau' : 'Répondu'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{msg.email}</p>
                  <p className="text-sm font-semibold text-gray-300 mb-1">{msg.subject}</p>
                  <p className="text-sm text-gray-400 line-clamp-2">{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMessage(msg);
                    }}
                    className="p-2 hover:bg-blue-500/20 rounded transition"
                    title="Répondre"
                  >
                    <Reply size={18} className="text-blue-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(msg.id);
                    }}
                    className="p-2 hover:bg-red-500/20 rounded transition"
                    title="Supprimer"
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {selectedMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedMessage(null);
            setReplyText('');
          }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Message de {selectedMessage.name}</h2>
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setReplyText('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Message */}
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-widest text-gray-400">Message Original</h3>
                <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm"><strong>De:</strong> {selectedMessage.name} ({selectedMessage.email})</p>
                  <p className="text-sm"><strong>Sujet:</strong> {selectedMessage.subject}</p>
                  <p className="text-sm"><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-gray-300 mt-4">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Previous Reply (if exists) */}
              {selectedMessage.admin_reply && (
                <div className="space-y-2">
                  <h3 className="text-sm uppercase tracking-widest text-gray-400">Votre Réponse Précédente</h3>
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedMessage.admin_reply}</p>
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-widest text-gray-400">Votre Réponse</h3>
                <textarea
                  value={replyText || (selectedMessage.admin_reply || '')}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tapez votre réponse..."
                  className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    setReplyText('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition flex items-center justify-center gap-2 font-semibold"
                >
                  {sending ? 'Envoi...' : (
                    <>
                      <Check size={18} />
                      Envoyer la Réponse
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminMessages;
