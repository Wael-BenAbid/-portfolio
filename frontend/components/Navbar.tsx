
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { User, LogOut } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface SiteSettings {
  site_title: string;
  logo_url: string;
}

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Filter out Login link if user is authenticated
  const links = [
    { name: 'Work', path: '/work' },
    ...(isAuthenticated ? [] : [{ name: 'Login', path: '/auth' }]),
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const siteTitle = settings?.site_title || 'ADRIAN';
  const logoUrl = settings?.logo_url;

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-8 py-10 flex justify-between items-center pointer-events-none">
      <Link to="/" className="pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-display text-lg font-bold tracking-tighter flex items-center gap-2"
        >
          {logoUrl ? (
            <img src={logoUrl} alt={siteTitle} className="h-8 w-auto" />
          ) : (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {siteTitle}
              </motion.span>
            </>
          )}
        </motion.div>
      </Link>

      <div className="flex gap-12 pointer-events-auto items-center">
        {links.map((link, i) => (
          <motion.div
            key={link.path}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link 
              to={link.path} 
              className="relative group overflow-hidden h-6 block"
              onClick={() => {
                // Mark that user intentionally navigated to auth
                if (link.path === '/auth') {
                  sessionStorage.setItem('redirected_to_auth', 'true');
                }
              }}
            >
              <motion.div
                animate={{ y: location.pathname === link.path ? -24 : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col"
              >
                <span className="text-[10px] font-display tracking-[0.4em] uppercase text-gray-400 group-hover:text-white transition-colors h-6 flex items-center">
                  {link.name}
                </span>
                <span className="text-[10px] font-display tracking-[0.4em] uppercase text-blue-500 h-6 flex items-center">
                  {link.name}
                </span>
              </motion.div>
            </Link>
          </motion.div>
        ))}
        
        {/* User Status */}
        {isAuthenticated ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4"
          >
            <Link to={user?.user_type === 'admin' ? '/admin' : '/'} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>
              <span className="text-[10px] font-display uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                {user?.first_name || user?.email?.split('@')[0]}
              </span>
            </Link>
            <button 
              onClick={logout}
              className="text-gray-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="flex items-center gap-2"
          >
            <div className="w-1 h-1 bg-gray-800 rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-gray-700 rounded-full animate-pulse delay-100" />
            <div className="w-1 h-1 bg-gray-600 rounded-full animate-pulse delay-200" />
          </motion.div>
        )}
      </div>
    </nav>
  );
};
