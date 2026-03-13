import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Reply, Trash2, Check, X, Loader2, Inbox } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.user_type === 'admin') {
      fetchMessages();
    }
  }, [user?.user_type]);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/settings/contact/messages/`);
      if (res.ok) {
        const data = await res.json();
        // Handle both array and paginated responses
        const messagesList = Array.isArray(data) ? data : (data.results || []);
        setMessages(messagesList);
      } else {
        setError(`Impossible de charger les messages (${res.status})`);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError('Erreur reseau lors du chargement des messages');
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
        setError(null);
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || payload.detail || `Envoi impossible (${res.status})`);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      setError('Erreur reseau pendant l envoi de la reponse');
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
        setError(null);
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || payload.detail || `Suppression impossible (${res.status})`);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      setError('Erreur reseau pendant la suppression');
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
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#050b16]">
      <div className="pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white">Messages de Contact</h1>
            <p className="text-slate-300">Gerez les messages recus et envoyez des reponses.</p>
          </div>
          <button
            onClick={fetchMessages}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-display uppercase tracking-widest text-slate-200 transition hover:border-cyan-500/60 hover:text-white"
          >
            <Loader2 size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'new', 'replied'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-display uppercase tracking-widest transition ${
                filter === f
                  ? 'bg-cyan-500 text-black'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {f === 'all' && `Tous (${messages.length})`}
              {f === 'new' && `Nouveaux (${messages.filter(m => m.status === 'new').length})`}
              {f === 'replied' && `Repondus (${messages.filter(m => m.status === 'replied').length})`}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="grid gap-3 md:gap-4">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-12">
              <Loader2 size={20} className="animate-spin text-cyan-400" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-slate-400">
              <Inbox size={24} className="mb-2" />
              Aucun message pour ce filtre.
            </div>
          ) : (
            filteredMessages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`rounded-2xl border cursor-pointer transition ${
                  msg.status === 'new'
                    ? 'bg-[#0b1423]/90 border-cyan-500/40 hover:border-cyan-400'
                    : 'bg-[#0b1423]/60 border-slate-700 hover:border-slate-500'
                }`}
                onClick={() => setSelectedMessage(msg)}
              >
                <div className="flex justify-between items-start gap-4 p-4 md:p-5">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <p className="truncate font-bold text-white">{msg.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-display uppercase tracking-widest ${
                        msg.status === 'new'
                          ? 'bg-cyan-400/20 text-cyan-200'
                          : 'bg-emerald-400/20 text-emerald-200'
                      }`}>
                        {msg.status === 'new' ? 'Nouveau' : 'Repondu'}
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-slate-400">{msg.email}</p>
                    <p className="mb-1 text-sm font-semibold text-slate-200">{msg.subject}</p>
                    <p className="line-clamp-2 text-sm text-slate-400">{msg.message}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessage(msg);
                      }}
                      className="rounded-lg p-2 transition hover:bg-cyan-500/20"
                      title="Repondre"
                    >
                      <Reply size={17} className="text-cyan-300" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(msg.id);
                      }}
                      className="rounded-lg p-2 transition hover:bg-rose-500/20"
                      title="Supprimer"
                    >
                      <Trash2 size={17} className="text-rose-300" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
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
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0b1423]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-[#0b1423] p-6">
              <h2 className="text-2xl font-bold text-white">Message de {selectedMessage.name}</h2>
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setReplyText('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Message */}
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-widest text-slate-300">Message Original</h3>
                <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                  <p className="text-sm"><strong>De:</strong> {selectedMessage.name} ({selectedMessage.email})</p>
                  <p className="text-sm"><strong>Sujet:</strong> {selectedMessage.subject}</p>
                  <p className="text-sm"><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="mt-4 text-slate-300">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Previous Reply (if exists) */}
              {selectedMessage.admin_reply && (
                <div className="space-y-2">
                  <h3 className="text-sm uppercase tracking-widest text-slate-300">Votre Reponse Precedente</h3>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-100 whitespace-pre-wrap">{selectedMessage.admin_reply}</p>
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-widest text-slate-300">Votre Reponse</h3>
                <textarea
                  value={replyText || (selectedMessage.admin_reply || '')}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tapez votre reponse..."
                  className="h-32 w-full rounded-xl border border-slate-700 bg-slate-900/50 p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 border-t border-slate-700 pt-4">
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    setReplyText('');
                  }}
                  className="flex-1 rounded-xl bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex-1 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
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
