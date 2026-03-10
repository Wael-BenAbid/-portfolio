import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../App';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

interface NotificationBellProps {
  /** Poll interval in ms (default 30 000) */
  pollInterval?: number;
  /** Visual variant – 'light' for dark backgrounds (Navbar), 'dark' for light sidebars */
  variant?: 'light' | 'dark';
}

const formatTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} j`;
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  pollInterval = 30_000,
  variant = 'light',
}) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/interactions/notifications/unread-count/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count ?? 0);
      }
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/interactions/notifications/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list: Notification[] = (data.results || data).slice(0, 20);
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.is_read).length);
      }
    } catch {}
    setLoading(false);
  }, []);

  // Poll for unread count in background — only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, pollInterval);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchUnreadCount, pollInterval]);

  // When panel opens, load full list
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id: number) => {
    await fetch(`${API_BASE_URL}/interactions/notifications/${id}/read/`, {
      method: 'POST',
      credentials: 'include',
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch(`${API_BASE_URL}/interactions/notifications/mark-all-read/`, {
      method: 'POST',
      credentials: 'include',
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.is_read) await markRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const iconClass = variant === 'light'
    ? 'text-white/70 hover:text-white'
    : 'text-slate-400 hover:text-white';

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(v => !v)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${iconClass}`}
        aria-label="Notifications"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-11 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <CheckCheck size={13} />
                    Tout lire
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-10">Aucune notification</p>
              )}
              {!loading && notifications.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800 last:border-0 cursor-pointer transition-colors ${
                    n.is_read ? 'hover:bg-slate-800/40' : 'bg-slate-800/70 hover:bg-slate-800'
                  }`}
                  onClick={() => handleNotifClick(n)}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    {n.is_read ? (
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${n.is_read ? 'text-slate-400' : 'text-white'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{formatTime(n.created_at)}</p>
                  </div>
                  {n.link && <ExternalLink size={12} className="flex-shrink-0 text-slate-600 mt-1" />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
