import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Heart, Calendar, BarChart2, Activity, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../constants';
import { authFetch } from '../../services/api';
import { BackButton } from '../../components/BackButton';
import { useAuth } from '../../App';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProjectStat {
  title: string;
  likes: number;
  views: number;
}

interface ActivityEntry {
  id: number;
  user_email: string;
  action_display: string;
  description: string;
  success: boolean;
  created_at: string;
}

interface StatsState {
  totalProjects: number;
  totalLikes: number;
  totalViews: number;
  totalVisitors: number;
  projectStats: ProjectStat[];
  recentActivity: ActivityEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs} h`;
  return `Il y a ${Math.floor(hrs / 24)} j`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, type: 'spring', stiffness: 120 }}
    whileHover={{ scale: 1.03, y: -2 }}
    className="relative bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/60 overflow-hidden"
  >
    {/* Background glow */}
    <div className={`absolute inset-0 opacity-5 ${color} rounded-2xl`} style={{ background: 'radial-gradient(circle at 70% 30%, currentColor 0%, transparent 70%)' }} />
    <div className="relative flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} bg-opacity-20`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">{title}</p>
    <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
  </motion.div>
);

// Animated bar chart using divs
const BarChart = ({
  data,
  valueKey,
  color,
  label,
}: {
  data: ProjectStat[];
  valueKey: 'likes' | 'views';
  color: string;
  label: string;
}) => {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">Aucun projet disponible</p>
      ) : (
        data.slice(0, 8).map((project, i) => {
          const pct = Math.round((project[valueKey] / max) * 100);
          return (
            <div key={project.title} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-28 truncate flex-shrink-0" title={project.title}>
                {project.title}
              </span>
              <div className="flex-1 bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.1 * i + 0.3, duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${color}`}
                />
              </div>
              <span className="text-xs font-mono text-slate-300 w-8 text-right flex-shrink-0">
                {project[valueKey]}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<StatsState>({
    totalProjects: 0,
    totalLikes: 0,
    totalViews: 0,
    totalVisitors: 0,
    projectStats: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);

    if (user?.user_type !== 'admin') {
      setError('Acces refuse: statistiques reservees aux comptes admin.');
      setLoading(false);
      return;
    }

    try {
      const [projectsRes, visitorsRes, activityRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/projects/`),
        authFetch(`${API_BASE_URL}/auth/visitors/`),
        authFetch(`${API_BASE_URL}/security/activity-logs/?page_size=8`),
      ]);

      if (!projectsRes.ok) {
        throw new Error(`Projects API returned ${projectsRes.status}`);
      }

      const projectsData = await projectsRes.json();
      const projects: any[] = projectsData.results || projectsData;

      const totalLikes = projects.reduce((sum: number, p: any) => {
        const pLikes = p.likes_count || 0;
        const mLikes = (p.media || []).reduce((ms: number, m: any) => ms + (m.likes_count || 0), 0);
        return sum + pLikes + mLikes;
      }, 0);

      const totalViews = projects.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0);

      const projectStats: ProjectStat[] = projects.map((p: any) => ({
        title: p.title,
        likes: (p.likes_count || 0) + (p.media || []).reduce((ms: number, m: any) => ms + (m.likes_count || 0), 0),
        views: p.views_count || 0,
      })).sort((a, b) => b.views - a.views);

      let visitorsCount = 0;
      if (visitorsRes.status === 403) {
        setError('Acces refuse: impossible de charger les visiteurs sans droits admin.');
      } else if (visitorsRes.ok) {
        const vData = await visitorsRes.json();
        visitorsCount = vData.count || 0;
      }

      let recentActivity: ActivityEntry[] = [];
      if (activityRes.status === 403) {
        setError('Acces refuse: impossible de charger le journal d\'activite sans droits admin.');
      } else if (activityRes.ok) {
        const aData = await activityRes.json();
        recentActivity = (aData.results || aData).slice(0, 8);
      }

      setStats({
        totalProjects: projects.length,
        totalLikes,
        totalViews,
        totalVisitors: visitorsCount,
        projectStats,
        recentActivity,
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  // ── Render: loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Chargement des statistiques…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={fetchStatistics}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ── Render: main ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-4">
            <BackButton to="/admin" />
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart2 size={22} className="text-cyan-400" />
                Statistiques
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">Performance et engagement du site</p>
            </div>
          </div>
          <button
            onClick={fetchStatistics}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-slate-300 hover:text-white transition-colors text-sm"
          >
            <RefreshCw size={14} />
            Actualiser
          </button>
        </motion.div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard title="Projets" value={stats.totalProjects} icon={Calendar} color="from-violet-500 to-purple-600" delay={0} />
          <StatCard title="Likes totaux" value={stats.totalLikes} icon={Heart} color="from-rose-500 to-pink-600" delay={0.07} />
          <StatCard title="Vues totales" value={stats.totalViews} icon={Eye} color="from-blue-500 to-cyan-500" delay={0.14} />
          <StatCard title="Visiteurs uniques" value={stats.totalVisitors} icon={Users} color="from-emerald-500 to-teal-500" delay={0.21} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Likes chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/60"
          >
            <div className="flex items-center gap-2 mb-6">
              <Heart size={16} className="text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Likes par projet</h3>
            </div>
            <BarChart data={stats.projectStats} valueKey="likes" color="bg-rose-500" label="Likes" />
          </motion.div>

          {/* Views chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/60"
          >
            <div className="flex items-center gap-2 mb-6">
              <Eye size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Vues par projet</h3>
            </div>
            <BarChart data={stats.projectStats} valueKey="views" color="bg-blue-500" label="Vues" />
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700/60">
            <Activity size={16} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Activité récente</h3>
          </div>

          {stats.recentActivity.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">Aucune activité récente disponible</p>
          ) : (
            <div className="divide-y divide-slate-700/40">
              {stats.recentActivity.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.04 }}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {entry.success ? (
                      <CheckCircle size={15} className="text-emerald-400" />
                    ) : (
                      <XCircle size={15} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      <span className="text-slate-400 mr-1.5">{entry.user_email}</span>
                      <span className="inline-block px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-300 mr-1.5">
                        {entry.action_display}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{entry.description}</p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 pt-0.5">
                    {formatRelativeTime(entry.created_at)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Statistics;
