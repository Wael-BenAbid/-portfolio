import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Heart, Calendar, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../../constants';
import { Link } from 'react-router-dom';

const Statistics: React.FC = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalLikes: 0,
    totalViews: 0,
    totalVisitors: 0,
    dailyLikes: 0,
    dailyViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Fetch projects with likes and views
      const projectsResponse = await fetch(`${API_BASE_URL}/projects/`, {
        credentials: 'include',
      });

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const projects = projectsData.results || projectsData;
        
        // Fetch visitors count
        const visitorsResponse = await fetch(`${API_BASE_URL}/auth/visitors/`, {
          credentials: 'include',
        });

        let visitorsCount = 0;
        if (visitorsResponse.ok) {
          const visitorsData = await visitorsResponse.json();
          visitorsCount = visitorsData.count || 0;
        }

        // Calculate total likes and views
        const totalLikes = projects.reduce((sum: number, project: any) => {
          const projectLikes = project.likes_count || 0;
          const mediaLikes = (project.media || []).reduce((mSum: number, media: any) => mSum + (media.likes_count || 0), 0);
          return sum + projectLikes + mediaLikes;
        }, 0);

        const totalViews = projects.reduce((sum: number, project: any) => sum + (project.views_count || 0), 0);

        // Calculate today's statistics
        const today = new Date().toISOString().split('T')[0];
        // For now, use mock data for daily stats
        const dailyLikes = Math.floor(Math.random() * 50);
        const dailyViews = Math.floor(Math.random() * 500);

        setStats({
          totalProjects: projects.length,
          totalLikes,
          totalViews,
          totalVisitors: visitorsCount,
          dailyLikes,
          dailyViews,
        });
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    trend?: 'up' | 'down'; 
    trendValue?: number; 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gray-900 rounded-lg p-6 border border-gray-800"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <Icon size={24} className="text-blue-500" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trendValue}%
          </div>
        )}
      </div>
      <h3 className="text-gray-400 font-display text-xs uppercase tracking-widest mb-2">
        {title}
      </h3>
      <p className="text-3xl font-display font-bold">{value.toLocaleString()}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchStatistics}
            className="px-6 py-3 bg-blue-500 text-white font-display text-xs uppercase tracking-widest hover:bg-blue-600 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 md:p-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link
            to="/admin"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span className="font-display text-xs uppercase tracking-widest">
              Back to Dashboard
            </span>
          </Link>
          <h1 className="text-4xl md:text-6xl font-display font-bold uppercase mb-4">
            Statistics
          </h1>
          <p className="text-gray-500 font-display text-xs uppercase tracking-widest">
            Site performance and user engagement
          </p>
        </motion.div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={Calendar}
          />
          <StatCard
            title="Total Likes"
            value={stats.totalLikes}
            icon={Heart}
            trend="up"
            trendValue={12}
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews}
            icon={Eye}
            trend="up"
            trendValue={8}
          />
          <StatCard
            title="Unique Visitors"
            value={stats.totalVisitors}
            icon={Users}
            trend="up"
            trendValue={5}
          />
          <StatCard
            title="Daily Likes"
            value={stats.dailyLikes}
            icon={Heart}
          />
          <StatCard
            title="Daily Views"
            value={stats.dailyViews}
            icon={Eye}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-800"
          >
            <h3 className="text-gray-400 font-display text-xs uppercase tracking-widest mb-6">
              Likes Over Time
            </h3>
            <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 font-display text-xs">Chart Placeholder</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-800"
          >
            <h3 className="text-gray-400 font-display text-xs uppercase tracking-widest mb-6">
              Views Over Time
            </h3>
            <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 font-display text-xs">Chart Placeholder</p>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-lg p-6 border border-gray-800"
        >
          <h3 className="text-gray-400 font-display text-xs uppercase tracking-widest mb-6">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-display text-sm">New project created</p>
                  <p className="text-gray-500 text-xs">2 minutes ago</p>
                </div>
              </div>
              <span className="text-blue-500 font-display text-xs">+1</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-display text-sm">Project liked</p>
                  <p className="text-gray-500 text-xs">5 minutes ago</p>
                </div>
              </div>
              <span className="text-green-500 font-display text-xs">+12</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-display text-sm">High traffic</p>
                  <p className="text-gray-500 text-xs">15 minutes ago</p>
                </div>
              </div>
              <span className="text-yellow-500 font-display text-xs">+50%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Statistics;
