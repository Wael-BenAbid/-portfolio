
import React, { Suspense, lazy, useEffect, useState, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CustomCursor } from './components/CustomCursor';
import { Navbar } from './components/Navbar';
import { LoadingScreen } from './components/LoadingScreen';
import { Scene3D } from './components/Scene3D';

// Types
interface User {
  id: number;
  email: string;
  user_type: 'admin' | 'registered' | 'visitor';
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: null, token: null, isAuthenticated: false, login: () => {}, logout: () => {} };
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

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }: React.PropsWithChildren<{ adminOnly?: boolean }>) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (adminOnly && user?.user_type !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Auth Provider Component
const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    // Redirect to home if landing on auth page without coming from a link
    // This handles the case where browser remembers the hash URL
    const hash = window.location.hash;
    if (hash === '#/auth' && !sessionStorage.getItem('redirected_to_auth')) {
      window.location.hash = '#/';
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect to home if already authenticated and trying to access auth page
  if (isAuthenticated && location.pathname === '/auth') {
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
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
  );
};

// Main App Component
const App: React.FC = () => {
  const location = useLocation();
  const hideNavPaths = ['/login', '/register'];
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen bg-[#0f0f0f] text-white selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <CustomCursor />
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
    </div>
  );
};

// Root Component with Router and Auth Provider
const Root = () => (
  <HashRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </HashRouter>
);

export default Root;
