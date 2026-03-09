import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  LogIn,
  Activity,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  MapPin,
  Smartphone,
  Globe,
  Clock,
  X,
  ChevronDown
} from 'lucide-react';
import { API_BASE_URL } from '../../constants';
import { useAuth } from '../../App';

interface LoginActivity {
  id: number;
  user_email: string;
  status: string;
  status_display: string;
  ip_address: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  unusual_location: boolean;
  created_at: string;
}

interface ActivityLog {
  id: number;
  user_email: string;
  action: string;
  action_display: string;
  description: string;
  success: boolean;
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
  created_at: string;
}

type Tab = 'logins' | 'activity' | 'alerts';

const Tracing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('logins');
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-100 text-emerald-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'account_locked': return 'bg-orange-100 text-orange-700';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <LoginActivityTable activities={loginActivities} searchTerm={searchTerm} />
          ) : activeTab === 'activity' ? (
            <ActivityLogTable logs={activityLogs} searchTerm={searchTerm} />
          ) : (
            <SecurityAlertTable alerts={securityAlerts} searchTerm={searchTerm} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: LoginActivityTable
// ============================================================================

interface LoginActivityTableProps {
  activities: LoginActivity[];
  searchTerm: string;
}

const LoginActivityTable: React.FC<LoginActivityTableProps> = ({ activities, searchTerm }) => {
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
}

const ActivityLogTable: React.FC<ActivityLogTableProps> = ({ logs, searchTerm }) => {
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
}

const SecurityAlertTable: React.FC<SecurityAlertTableProps> = ({ alerts, searchTerm }) => {
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
