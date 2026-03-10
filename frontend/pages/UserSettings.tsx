import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Save, Bell, Lock, Loader2, CheckCircle, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../App';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { getCookie } from '../utils/cookies';
import { BackButton } from '../components/BackButton';

interface ContactMsg {
  id: number;
  subject: string;
  message: string;
  status: string;
  admin_reply: string;
  replied_at: string | null;
  created_at: string;
}

interface AppNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  link: string | null;
  created_at: string;
  is_read: boolean;
}

const UserSettings: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'messages' | 'notifications'>('profile');

  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone: (user as any)?.phone ?? '',
    bio: (user as any)?.bio ?? '',
    email_notifications: (user as any)?.email_notifications ?? true,
    notify_new_projects: (user as any)?.notify_new_projects ?? true,
    notify_updates: (user as any)?.notify_updates ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const isGoogleUser = (user as any)?.auth_provider === 'google';

  // Unread counts for tab badges
  const unreadNotifCount = notifications.filter(n => !n.is_read).length;
  const unreadMsgCount = messages.filter(m => m.status === 'replied' && m.admin_reply).length;

  useEffect(() => {
    if (activeTab === 'messages' && messages.length === 0) {
      setMessagesLoading(true);
      fetch(`${API_BASE_URL}/contact/my-messages/`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(data => setMessages(Array.isArray(data) ? data : data.results ?? []))
        .catch(() => {})
        .finally(() => setMessagesLoading(false));
    }
    if (activeTab === 'notifications' && notifications.length === 0) {
      setNotifLoading(true);
      fetch(`${API_BASE_URL}/interactions/notifications/`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(data => setNotifications(Array.isArray(data) ? data : data.results ?? []))
        .catch(() => {})
        .finally(() => setNotifLoading(false));
    }
  }, [activeTab]);

  const markNotifRead = async (id: number) => {
    const csrfToken = getCookie('csrftoken') || '';
    await fetch(`${API_BASE_URL}/interactions/notifications/${id}/read/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRFToken': csrfToken },
    }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const csrfToken = getCookie('csrftoken') || '';
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE_UPDATE}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        updateUser(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data?.error?.message || data?.error || 'Erreur lors de la sauvegarde.');
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }
    setPwSaving(true);
    setPwError(null);
    setPwSaved(false);
    try {
      const csrfToken = getCookie('csrftoken') || '';
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PASSWORD_CHANGE}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({
          current_password: pwForm.current_password,
          new_password: pwForm.new_password,
          confirm_password: pwForm.confirm_password,
        }),
      });
      if (res.ok) {
        setPwSaved(true);
        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setPwSaved(false), 3000);
      } else {
        const data = await res.json();
        setPwError(data?.error?.message || data?.error || data?.detail || 'Erreur lors du changement de mot de passe.');
      }
    } catch {
      setPwError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setPwSaving(false);
    }
  };

  const statusLabel = (s: string) => {
    if (s === 'replied') return { text: 'Répondu', cls: 'text-green-400 bg-green-400/10' };
    if (s === 'read') return { text: 'Lu', cls: 'text-blue-400 bg-blue-400/10' };
    if (s === 'archived') return { text: 'Archivé', cls: 'text-gray-400 bg-gray-400/10' };
    return { text: 'Nouveau', cls: 'text-yellow-400 bg-yellow-400/10' };
  };

  const tabs = [
    { id: 'profile' as const, label: 'Paramètres', icon: <User size={13} /> },
    { id: 'messages' as const, label: 'Messages', icon: <MessageCircle size={13} />, badge: unreadMsgCount },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell size={13} />, badge: unreadNotifCount },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-24">
        {/* Back link */}
        <BackButton to="/" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">
                {user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.email?.split('@')[0]}
              </h1>
              <p className="text-[12px] text-gray-500 mt-0.5">{user?.email}</p>
              {isGoogleUser && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-display uppercase tracking-widest text-blue-400">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Connecté via Google
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[11px] font-display uppercase tracking-widest transition-colors ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge ? (
                  <span className="ml-1 min-w-[16px] h-4 px-1 bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <form onSubmit={handleSave}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
                    <h2 className="text-[11px] font-display uppercase tracking-widest text-gray-400 mb-5">
                      Informations personnelles
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[11px] font-display uppercase tracking-widest text-gray-500 mb-2">Prénom</label>
                        <input type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Votre prénom"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-display uppercase tracking-widest text-gray-500 mb-2">Nom</label>
                        <input type="text" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Votre nom"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-[11px] font-display uppercase tracking-widest text-gray-500 mb-2">Email</label>
                      <input type="email" value={user?.email ?? ''} disabled
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                    </div>

                    <div className="mb-4">
                      <label className="block text-[11px] font-display uppercase tracking-widest text-gray-500 mb-2">Téléphone</label>
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+216 00 000 000"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>

                    <div>
                      <label className="block text-[11px] font-display uppercase tracking-widest text-gray-500 mb-2">Bio</label>
                      <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Quelques mots sur vous..." rows={3} maxLength={500}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
                      <p className="text-right text-[10px] text-gray-600 mt-1">{form.bio.length}/500</p>
                    </div>
                  </div>

                  {/* Email notification prefs */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
                    <h2 className="text-[11px] font-display uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                      <Bell size={13} /> Préférences de notifications
                    </h2>
                    {[
                      { key: 'email_notifications', label: 'Notifications par email' },
                      { key: 'notify_new_projects', label: 'Nouveaux projets' },
                      { key: 'notify_updates', label: 'Mises à jour' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center justify-between py-2.5 cursor-pointer group">
                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{label}</span>
                        <div className="relative">
                          <input type="checkbox" name={key} checked={(form as any)[key]} onChange={handleChange} className="sr-only peer" />
                          <div
                            onClick={() => setForm(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
                            className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${(form as any)[key] ? 'bg-blue-500' : 'bg-zinc-700'}`}
                          >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(form as any)[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-display uppercase tracking-widest py-3.5 rounded-xl transition-colors">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <><CheckCircle size={15} /> Sauvegardé</> : <><Save size={15} /> Sauvegarder</>}
                  </button>
                </form>

                {/* Password change */}
                {!isGoogleUser && (
                  <form onSubmit={handlePasswordChange} className="mt-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <h2 className="text-[11px] font-display uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                        <Lock size={13} /> Changer le mot de passe
                      </h2>
                      <div className="space-y-3">
                        {[
                          { key: 'current_password', label: 'Mot de passe actuel' },
                          { key: 'new_password', label: 'Nouveau mot de passe' },
                          { key: 'confirm_password', label: 'Confirmer le nouveau mot de passe' },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-[11px] font-display uppercase tracking-widest text-gray-500 mb-2">{label}</label>
                            <input type="password" value={(pwForm as any)[key]}
                              onChange={e => setPwForm(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder="••••••••" required
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                      {pwError && <p className="text-red-400 text-sm mt-3">{pwError}</p>}
                      <button type="submit" disabled={pwSaving}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-[11px] font-display uppercase tracking-widest py-3 rounded-xl transition-colors border border-zinc-700">
                        {pwSaving ? <Loader2 size={15} className="animate-spin" /> : pwSaved ? <><CheckCircle size={15} /> Mot de passe modifié</> : <><Lock size={15} /> Modifier le mot de passe</>}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* ── MESSAGES TAB ── */}
            {activeTab === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-[11px] font-display uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <MessageCircle size={13} /> Mes messages
                    </h2>
                    <Link to="/contact"
                      className="text-[10px] font-display uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                      + Nouveau message
                    </Link>
                  </div>

                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={20} className="animate-spin text-gray-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                      <MessageCircle size={32} className="mb-3 opacity-30" />
                      <p className="text-sm">Aucun message envoyé</p>
                      <Link to="/contact" className="mt-3 text-[11px] font-display uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                        Contacter l'admin
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {messages.map(msg => {
                        const { text, cls } = statusLabel(msg.status);
                        const isExpanded = expandedMsg === msg.id;
                        return (
                          <div key={msg.id} className="p-5">
                            <button
                              onClick={() => setExpandedMsg(isExpanded ? null : msg.id)}
                              className="w-full text-left"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{msg.subject}</p>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
                                  {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                                </div>
                              </div>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {/* User's original message */}
                                  <div className="mt-4 bg-zinc-800/50 rounded-xl p-4">
                                    <p className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-2">Votre message</p>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                                  </div>

                                  {/* Admin reply */}
                                  {msg.admin_reply && (
                                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                      <p className="text-[10px] font-display uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                                        Réponse de l'admin
                                        {msg.replied_at && (
                                          <span className="ml-auto text-blue-400/60 normal-case tracking-normal font-sans">
                                            {new Date(msg.replied_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-sm text-blue-100 whitespace-pre-wrap">{msg.admin_reply}</p>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-[11px] font-display uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Bell size={13} /> Notifications
                    </h2>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={() => notifications.filter(n => !n.is_read).forEach(n => markNotifRead(n.id))}
                        className="text-[10px] font-display uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>

                  {notifLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={20} className="animate-spin text-gray-500" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                      <Bell size={32} className="mb-3 opacity-30" />
                      <p className="text-sm">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => !notif.is_read && markNotifRead(notif.id)}
                          className={`w-full text-left p-5 flex items-start gap-4 transition-colors hover:bg-zinc-800/40 ${!notif.is_read ? 'bg-blue-500/5' : ''}`}
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-400' : 'text-white'}`}>{notif.title}</p>
                            <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-gray-600 mt-1.5">
                              {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default UserSettings;
