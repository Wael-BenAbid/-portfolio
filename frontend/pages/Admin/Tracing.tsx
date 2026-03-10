import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  LogIn,
  Activity,
  Filter,
  Search,
  RefreshCw,
  MapPin,
  Smartphone,
  X,
  Eye,
  Info
} from 'lucide-react';
import { API_BASE_URL } from '../../constants';
import { useAuth } from '../../App';
import { BackButton } from '../../components/BackButton';

interface LoginActivity {
  id: number;
  user_email: string;
  status: string;
  status_display: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  unusual_location: boolean;
  failed_attempt_after_success: boolean;
  created_at: string;
}

interface ActivityLog {
  id: number;
  user_email: string;
  action: string;
  action_display: string;
  description: string;
  object_type: string;
  object_id: number | null;
  ip_address: string;
  user_agent: string;
  changes: Record<string, unknown>;
  success: boolean;
  error_message: string;
  created_at: string;
}

interface SecurityAlert {
  id: number;
  user_email: string;
  alert_type: string;
  alert_type_display: string;
  severity: string;
  severity_display: string;
  status: string;
  status_display: string;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  action_taken: string;
  notified_at: string | null;
  resolved_at: string | null;
  resolved_by_email: string | null;
  created_at: string;
  updated_at: string;
}

type Tab = 'logins' | 'activity' | 'alerts';
type DetailItem = LoginActivity | ActivityLog | SecurityAlert;
type DetailType = 'login' | 'activity' | 'alert' | null;

const Tracing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('logins');
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const [detailType, setDetailType] = useState<DetailType>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchData();
  }, [token, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'logins') {
        await fetchLoginActivities();
      } else if (activeTab === 'activity') {
        await fetchActivityLogs();
      } else if (activeTab === 'alerts') {
        await fetchSecurityAlerts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginActivities = async () => {
    const response = await fetch(`${API_BASE_URL}/security/login-activities/`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch login activities');
    const data = await response.json();
    setLoginActivities(data.results || data);
  };

  const fetchActivityLogs = async () => {
    const response = await fetch(`${API_BASE_URL}/security/activity-logs/`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch activity logs');
    const data = await response.json();
    setActivityLogs(data.results || data);
  };

  const fetchSecurityAlerts = async () => {
    const response = await fetch(`${API_BASE_URL}/security/alerts/`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch security alerts');
    const data = await response.json();
    setSecurityAlerts(data.results || data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <BackButton to="/admin" />
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Traçage</h1>
                <p className="text-slate-400 text-sm">Activity Tracking & Security Monitoring</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg w-fit border border-slate-700">
            {[
              { id: 'logins', label: 'Login Activity', icon: LogIn },
              { id: 'activity', label: 'Activity Log', icon: Activity },
              { id: 'alerts', label: 'Security Alerts', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-center gap-3 text-red-400"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Loading data...</p>
            </div>
          ) : activeTab === 'logins' ? (
            <LoginActivityTable activities={loginActivities} searchTerm={searchTerm} onDetail={(item) => { setDetailItem(item); setDetailType('login'); }} />
          ) : activeTab === 'activity' ? (
            <ActivityLogTable logs={activityLogs} searchTerm={searchTerm} onDetail={(item) => { setDetailItem(item); setDetailType('activity'); }} />
          ) : (
            <SecurityAlertTable alerts={securityAlerts} searchTerm={searchTerm} onDetail={(item) => { setDetailItem(item); setDetailType('alert'); }} />
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailItem && detailType && (
          <DetailModal item={detailItem} type={detailType} onClose={() => { setDetailItem(null); setDetailType(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// COMPONENT: DetailModal
// ============================================================================

interface DetailModalProps {
  item: DetailItem;
  type: 'login' | 'activity' | 'alert';
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ item, type, onClose }) => {
  const rows: { label: string; value: React.ReactNode }[] = [];

  if (type === 'login') {
    const a = item as LoginActivity;
    rows.push(
      { label: 'User', value: a.user_email || 'N/A' },
      { label: 'Status', value: <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(a.status)}`}>{a.status_display}</span> },
      { label: 'IP Address', value: <span className="font-mono">{a.ip_address}</span> },
      { label: 'Browser', value: a.browser || '—' },
      { label: 'OS', value: a.os || '—' },
      { label: 'Device', value: a.device_type || 'Other' },
      { label: 'Country', value: a.country || '—' },
      { label: 'City', value: a.city || '—' },
      { label: 'Coordinates', value: a.latitude != null ? `${a.latitude}, ${a.longitude}` : '—' },
      { label: 'Unusual location', value: a.unusual_location ? <span className="text-yellow-400">⚠ Yes</span> : 'No' },
      { label: 'Failed after success', value: a.failed_attempt_after_success ? <span className="text-orange-400">Yes</span> : 'No' },
      { label: 'User Agent', value: <span className="text-xs break-all">{a.user_agent || '—'}</span> },
      { label: 'Time', value: new Date(a.created_at).toLocaleString() },
    );
  } else if (type === 'activity') {
    const l = item as ActivityLog;
    rows.push(
      { label: 'User', value: l.user_email || 'System' },
      { label: 'Action', value: l.action_display },
      { label: 'Description', value: l.description },
      { label: 'IP Address', value: <span className="font-mono">{l.ip_address || '—'}</span> },
      { label: 'Object Type', value: l.object_type || '—' },
      { label: 'Object ID', value: l.object_id != null ? String(l.object_id) : '—' },
      { label: 'Status', value: l.success ? <span className="text-emerald-400">✓ Success</span> : <span className="text-red-400">✗ Failed</span> },
      { label: 'Error', value: l.error_message || '—' },
      { label: 'Changes', value: Object.keys(l.changes || {}).length > 0 ? <pre className="text-xs bg-slate-900 p-2 rounded overflow-auto max-h-32">{JSON.stringify(l.changes, null, 2)}</pre> : '—' },
      { label: 'User Agent', value: <span className="text-xs break-all">{l.user_agent || '—'}</span> },
      { label: 'Time', value: new Date(l.created_at).toLocaleString() },
    );
  } else {
    const al = item as SecurityAlert;
    rows.push(
      { label: 'Title', value: al.title },
      { label: 'Type', value: al.alert_type_display },
      { label: 'Severity', value: <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(al.severity)}`}>{al.severity_display}</span> },
      { label: 'Status', value: <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(al.status)}`}>{al.status_display}</span> },
      { label: 'User', value: al.user_email || 'N/A' },
      { label: 'Description', value: al.description },
      { label: 'Evidence', value: Object.keys(al.evidence || {}).length > 0 ? <pre className="text-xs bg-slate-900 p-2 rounded overflow-auto max-h-32">{JSON.stringify(al.evidence, null, 2)}</pre> : '—' },
      { label: 'Action Taken', value: al.action_taken || '—' },
      { label: 'Notified At', value: al.notified_at ? new Date(al.notified_at).toLocaleString() : '—' },
      { label: 'Resolved At', value: al.resolved_at ? new Date(al.resolved_at).toLocaleString() : '—' },
      { label: 'Resolved By', value: al.resolved_by_email || '—' },
      { label: 'Created At', value: new Date(al.created_at).toLocaleString() },
      { label: 'Updated At', value: new Date(al.updated_at).toLocaleString() },
    );
  }

  const titles = { login: 'Login Activity Detail', activity: 'Activity Log Detail', alert: 'Security Alert Detail' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Info className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-white font-semibold">{titles[type]}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <dl className="space-y-3">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <dt className="text-slate-500 text-xs uppercase tracking-wider w-36 shrink-0 pt-0.5">{label}</dt>
                <dd className="text-slate-200 text-sm flex-1">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// COMPONENT: LoginActivityTable
// ============================================================================

interface LoginActivityTableProps {
  activities: LoginActivity[];
  searchTerm: string;
  onDetail: (item: LoginActivity) => void;
}

const LoginActivityTable: React.FC<LoginActivityTableProps> = ({ activities, searchTerm, onDetail }) => {
  const filtered = activities.filter(
    a => a.user_email.includes(searchTerm) || a.ip_address.includes(searchTerm)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">IP Address</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Device</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                No login activities found
              </td>
            </tr>
          ) : (
            filtered.map((activity) => (
              <tr key={activity.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 text-sm text-white">{activity.user_email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status_display}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300 font-mono">{activity.ip_address}</td>
                <td className="px-6 py-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span>{activity.device_type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    {activity.unusual_location && (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>{activity.country}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">{formatDateCompact(activity.created_at)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDetail(activity)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors border border-blue-600/30"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Détail
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// COMPONENT: ActivityLogTable
// ============================================================================

interface ActivityLogTableProps {
  logs: ActivityLog[];
  searchTerm: string;
  onDetail: (item: ActivityLog) => void;
}

const ActivityLogTable: React.FC<ActivityLogTableProps> = ({ logs, searchTerm, onDetail }) => {
  const filtered = logs.filter(
    l => l.user_email.includes(searchTerm) || l.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'bg-blue-100 text-blue-700';
      case 'logout': return 'bg-gray-100 text-gray-700';
      case 'password_change': return 'bg-yellow-100 text-yellow-700';
      case 'profile_update': return 'bg-cyan-100 text-cyan-700';
      case 'api_request': return 'bg-purple-100 text-purple-700';
      case 'data_create': return 'bg-green-100 text-green-700';
      case 'data_delete': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                No activity logs found
              </td>
            </tr>
          ) : (
            filtered.map((log) => (
              <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 text-sm text-white">{log.user_email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getActionColor(log.action)}`}>
                    {log.action_display}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">{log.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.success ? '✓ Success' : '✗ Failed'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">{formatDateCompact(log.created_at)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDetail(log)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors border border-blue-600/30"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Détail
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// COMPONENT: SecurityAlertTable
// ============================================================================

interface SecurityAlertTableProps {
  alerts: SecurityAlert[];
  searchTerm: string;
  onDetail: (item: SecurityAlert) => void;
}

const SecurityAlertTable: React.FC<SecurityAlertTableProps> = ({ alerts, searchTerm, onDetail }) => {
  const filtered = alerts.filter(
    a => a.user_email.includes(searchTerm) || a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-950';
      case 'high': return 'bg-orange-950';
      case 'medium': return 'bg-yellow-950';
      case 'low': return 'bg-gray-900';
      default: return 'bg-gray-900';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Severity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                No security alerts found
              </td>
            </tr>
          ) : (
            filtered.map((alert) => (
              <tr key={alert.id} className={`border-b border-slate-700 ${getSeverityBgColor(alert.severity)} hover:opacity-75 transition-opacity`}>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity_display}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white">{alert.alert_type_display}</td>
                <td className="px-6 py-4 text-sm text-white font-medium">{alert.title}</td>
                <td className="px-6 py-4 text-sm text-slate-300">{alert.user_email || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(alert.status)}`}>
                    {alert.status_display}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">{formatDateCompact(alert.created_at)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDetail(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors border border-blue-600/30"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Détail
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDateCompact = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'bg-emerald-100 text-emerald-700';
    case 'failed': return 'bg-red-100 text-red-700';
    case 'open': return 'bg-red-100 text-red-700';
    case 'investigating': return 'bg-yellow-100 text-yellow-700';
    case 'resolved': return 'bg-emerald-100 text-emerald-700';
    case 'false_positive': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-300';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'low': return 'bg-gray-100 text-gray-700 border-gray-300';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default Tracing;
