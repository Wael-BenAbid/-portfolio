
import React, { Suspense, lazy, useEffect, useState, createContext, useContext } from 'react';
import * as Sentry from "@sentry/react";
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import { CustomCursor } from './components/CustomCursor';
import { Navbar } from './components/Navbar';
import { LoadingScreen } from './components/LoadingScreen';
import { Scene3D } from './components/Scene3D';
import { AlertTriangle, Lock, X } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from './constants';
import { getCookie } from './utils/cookies';
import { useSettings } from './hooks/useData';

// Initialize Sentry for error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1,
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException;
        // Don't send network errors in development
        if (import.meta.env.MODE === 'development' && error instanceof TypeError) {
          return null;
        }
      }
      return event;
    },
  });
}

// Types
interface User {
  id: number;
  email: string;
  user_type: 'admin' | 'registered' | 'visitor';
  first_name: string;
  last_name: string;
  profile_image: string | null;
  requires_password_change?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  clearPasswordChangeRequired: () => void;
}

// Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return { 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      isInitializing: false,
      login: () => {}, 
      logout: () => {}, 
      clearPasswordChangeRequired: () => {} 
    };
  }
  return context;
};

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Work = lazy(() => import('./pages/Work'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const AuthPage = lazy(() => import('./pages/Auth'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminSettings = lazy(() => import('./pages/Admin/Settings'));
const AdminCV = lazy(() => import('./pages/Admin/CV'));
const AdminStatistics = lazy(() => import('./pages/Admin/Statistics'));

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }: React.PropsWithChildren<{ adminOnly?: boolean }>) => {
  const { isAuthenticated, user, isInitializing } = useAuth();
  const location = useLocation();
  
  if (isInitializing) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to={`/auth?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  if (adminOnly && user?.user_type !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Auth Provider Component
const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
  /**
   * SECURITY: Never auto-login a user. Return null and require explicit authentication.
   * The backend will verify actual auth via the HttpOnly cookie.
   */
  const getUserFromSession = (): User | null => {
    try {
      const stored = sessionStorage.getItem('auth_user');
      if (!stored) return null;
      
      const user = JSON.parse(stored);
      // Validate minimum required fields
      if (!user.id || !user.email) {
        sessionStorage.removeItem('auth_user');
        return null;
      }
      return user;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      sessionStorage.removeItem('auth_user');
      return null;
    }
  };

  const initialUser = getUserFromSession();
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setToken] = useState<string | null>(initialUser ? 'http-only-cookie' : null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Verify authentication with backend on initial load
    const verifyAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update user state with fresh data from backend
          setUser(data);
          setToken('http-only-cookie'); // Ensure token state is consistent with authenticated user
          sessionStorage.setItem('auth_user', JSON.stringify(data));
        } else {
          // Backend says not authenticated, clear local state
          setUser(null);
          setToken(null);
          sessionStorage.removeItem('auth_user');
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        // If we can't reach backend, assume not authenticated to avoid stale state
        setUser(null);
        setToken(null);
        sessionStorage.removeItem('auth_user');
      } finally {
        setIsInitializing(false);
      }
    };

    verifyAuth();
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    // Store only user info in sessionStorage (non-sensitive data)
    // IMPORTANT: The auth token is handled via HttpOnly cookie by the backend
    // We do NOT store the token in sessionStorage to prevent XSS token theft
    // The token parameter is only used for React state, not persisted
    sessionStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      // Get CSRF token from cookie
      const csrfToken = getCookie('csrftoken');
      
      if (!csrfToken) {
        console.warn('CSRF token not found, proceeding with logout');
      }
      
      // Call backend logout endpoint to properly invalidate the token
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken || '',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if backend call fails
    }
    setUser(null);
    setToken(null);
    // Clear sessionStorage (only user info, no token stored)
    sessionStorage.removeItem('auth_user');
  };

  const clearPasswordChangeRequired = () => {
    if (user) {
      const updatedUser = { ...user, requires_password_change: false };
      setUser(updatedUser);
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!token, 
      isInitializing,
      login, 
      logout, 
      clearPasswordChangeRequired 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect to home if already authenticated and trying to access auth page
  if (isAuthenticated && window.location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/project/:slug" element={<ProjectDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<AuthPage onLogin={login} />} />
          
          {/* Admin Section */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute adminOnly>
              <AdminSettings />
            </ProtectedRoute>
          } />
          <Route path="/admin/cv" element={
            <ProtectedRoute adminOnly>
              <AdminCV />
            </ProtectedRoute>
          } />
          <Route path="/admin/statistics" element={
            <ProtectedRoute adminOnly>
              <AdminStatistics />
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
  );
};

// Password Change Modal Component
const PasswordChangeModal: React.FC = () => {
  const { user, clearPasswordChangeRequired, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Use the same API_BASE_URL as login to ensure cookies are sent
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PASSWORD_CHANGE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        }),
        credentials: 'include',  // Include cookies for authentication
      });

      if (response.ok) {
        setSuccess(true);
        clearPasswordChangeRequired();
        // Logout the user and redirect to login page to login with new password
        setTimeout(() => {
          logout();
          window.location.pathname = '/auth';
        }, 2000);
      } else {
        const data = await response.json();
        // Handle different error formats
        const errorMsg = data.error?.message || data.error || data.message || data.detail || 
          (data.details ? JSON.stringify(data.details) : 'Failed to change password');
        setError(errorMsg);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.requires_password_change) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-yellow-500/20 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Password Change Required</h2>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="p-3 bg-green-500/20 rounded-full w-fit mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-green-400 font-medium">Password changed successfully!</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-300 mb-6">
              For security reasons, you must change your default password before continuing.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={logout}
                  className="flex-1 px-4 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const location = useLocation();
  const hideNavPaths = ['/login', '/register'];
  const isAdminPath = location.pathname.startsWith('/admin');
  
  // Fetch site settings
  const { data: settings } = useSettings();

  return (
    <div 
      className={`relative min-h-screen text-white selection:${settings?.primary_color || '#6366f1'} selection:text-white overflow-x-hidden`}
      style={{ backgroundColor: settings?.background_color || '#0f0f0f' }}
    >
      <CustomCursor 
        cursorTheme={settings?.cursor_theme}
        cursorSize={settings?.cursor_size}
        customCursorColor={settings?.custom_cursor_color}
        primaryColor={settings?.primary_color}
      />
      {!hideNavPaths.includes(location.pathname) && !isAdminPath && <Navbar />}
      
      {/* Only show 3D background on public pages */}
      {!isAdminPath && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <Scene3D />
        </div>
      )}

      <main className="relative z-10">
        <Suspense fallback={<LoadingScreen />}>
          <AnimatedRoutes />
        </Suspense>
      </main>

      {/* Password Change Modal */}
      <PasswordChangeModal />
    </div>
  );
};

// Root Component with Router and Auth Provider
const Root = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH2_CLIENT_ID}>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);

export default Root;
