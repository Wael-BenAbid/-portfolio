
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { User, LogOut, Settings } from 'lucide-react';
import { useSettings } from '../hooks/useData';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: settings } = useSettings();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Navigation links - show login only when not authenticated
  const links = [
    { name: 'Travail', path: '/work' },
    ...(!isAuthenticated ? [{ name: 'Connexion', path: '/auth' }] : []),
    { name: 'À propos', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Temporary fix to bypass cache - force re-fetch settings
  const [siteTitle, setSiteTitle] = useState('ABIDOS');
  
  useEffect(() => {
    fetch('/api/settings/')
      .then(response => response.json())
      .then(data => setSiteTitle(data.hero_title || 'ABIDOS'))
      .catch(error => console.error('Error fetching settings:', error));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-8 py-10 flex justify-between items-center pointer-events-none">
      <Link to="/" className="pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-display text-lg font-bold tracking-tighter flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {siteTitle}
          </motion.span>
        </motion.div>
      </Link>

      <div className="relative flex gap-12 pointer-events-auto items-center">
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
            {user?.user_type === 'admin' ? (
              // Admin: direct link to admin panel + separate logout
              <>
                <Link to="/admin" className="flex items-center gap-2 group">
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
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              // Regular user: dropdown with Settings + Logout
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 group"
                >
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
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-3 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden"
                    >
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-[11px] font-display uppercase tracking-widest text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Settings size={14} />
                        Paramètres
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-display uppercase tracking-widest text-gray-400 hover:text-red-400 hover:bg-zinc-800 transition-colors border-t border-zinc-800"
                      >
                        <LogOut size={14} />
                        Déconnexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
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
