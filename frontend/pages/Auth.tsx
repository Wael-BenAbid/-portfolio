import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { BackButton } from '../components/BackButton';
import { useGoogleLogin } from '@react-oauth/google';

// Types
interface AuthProps {
  onLogin: (user: any, token: string) => void;
}

// ── Polygon-mesh canvas background (matches geometric network aesthetic) ───
const PolygonMesh: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Node { x: number; y: number; vx: number; vy: number; r: number }

    const NODE_COUNT = 90;
    const MAX_DIST = 160;

    let nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // update positions
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.35;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0,210,190,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // draw nodes
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,220,200,0.85)';
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
};

// Input Field Component with Password Toggle
const InputField: React.FC<{
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder: string;
  icon: React.ReactNode;
}> = ({ label, type, value, onChange, onFocus, placeholder, icon }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isPassword] = useState(type === 'password');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (onFocus) onFocus();
    // Clear the input when focusing if it's a password field with placeholder dots
    if (type === 'password' && inputRef.current) {
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }
  };

  // Eye Icon
  const EyeIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <motion.div
      className="relative mb-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-400">
          {icon}
        </div>
        <input
          ref={inputRef}
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all duration-300"
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-400 transition-colors"
          >
            {showPassword ? EyeOffIcon : EyeIcon}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Social Button Component
const SocialButton: React.FC<{
  provider: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ provider, icon, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      type="button"
      className="flex items-center justify-center gap-3 w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-all duration-300"
    >
      {icon}
      <span>Continuer avec {provider}</span>
    </motion.button>
  );
};

// Main Auth Page Component
const AuthPage: React.FC<AuthProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginRedirectPath, setLoginRedirectPath] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Navigate to the intended page once authenticated
  useEffect(() => {
    if (loginRedirectPath && isAuthenticated) {
      navigate(loginRedirectPath);
      setLoginRedirectPath(null);
    }
  }, [isAuthenticated, loginRedirectPath, navigate]);

  // Clear form when switching tabs
  useEffect(() => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setConfirmPassword('');
    setError('');
  }, [activeTab]);

  // Icons
  const UserIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  
  const EmailIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
  
  const LockIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
  
  const GoogleIcon = (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const FacebookIcon = (
    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  // Extracts a readable string from any DRF error shape:
  // - {error: "string"}
  // - {error: {message: "string"}}
  // - {error: {message: ["string"]}}
  // - {error: {message: {non_field_errors: ["string"], field: ["string"]}}}
  const extractError = (data: any, fallback: string): string => {
    const err = data?.error;
    if (!err) return data?.message || fallback;
    if (typeof err === 'string') return err;
    const msg = err.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return String(msg[0] ?? fallback);
    if (msg && typeof msg === 'object') {
      for (const v of Object.values(msg)) {
        if (Array.isArray(v) && v.length > 0) return String(v[0]);
      }
    }
    return fallback;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        credentials: 'include',  // Include cookies for authentication
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onLogin(data.user, data.access_token || 'http-only-cookie');
        // Set redirect path to trigger useEffect that waits for isAuthenticated to update
        const searchParams = new URLSearchParams(window.location.search);
        const from = searchParams.get('from') || '/';
        setLoginRedirectPath(from);
      } else {
        setError(extractError(data, 'Login failed'));
      }
    } catch {
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          password_confirm: confirmPassword.trim(),
          first_name: firstName.trim(),
          last_name: '',
        }),
        credentials: 'include',  // Include cookies for authentication
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onLogin(data.user, data.access_token || 'http-only-cookie');
        // Set redirect path to trigger useEffect that waits for isAuthenticated to update
        setLoginRedirectPath('/');
      } else {
        setError(extractError(data, 'Registration failed'));
      }
    } catch {
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/social/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'google',
            provider_token: tokenResponse.access_token,
          }),
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          onLogin(data.user, data.access_token || 'http-only-cookie');
          // Set redirect path to trigger useEffect that waits for isAuthenticated to update
          setLoginRedirectPath('/');
        } else {
          const errorData = await res.json();
          setError(extractError(errorData, 'Google authentication failed'));
        }
      } catch {
        setError('Network error. Please check if the server is running.');
      }
    },
    onError: () => {
      setError('Google authentication failed');
    },
  });

  const handleSocialAuth = async (provider: 'facebook') => {
    setError(`${provider} authentication would redirect to OAuth flow`);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#060d12] overflow-hidden">
      {/* Polygon-mesh background */}
      <div className="fixed inset-0 z-0">
        <PolygonMesh />
      </div>
      
      {/* Gradient overlay — darken edges, keep mesh visible in middle */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d12]/70 via-transparent to-[#060d12]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060d12]/60 via-transparent to-[#060d12]/60" />
      </div>
      
      {/* Content */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-20 min-h-screen flex items-center justify-center px-4 py-12 sm:py-20"
      >
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-6 text-left">
            <BackButton />
          </div>
          
          {/* Logo/Title */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-300 via-cyan-400 to-emerald-300 bg-clip-text text-transparent mb-2"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Welcome
            </motion.h1>
            <p className="text-gray-400 text-lg">Enter your creative universe</p>
          </motion.div>
          
          {/* Auth Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl"
          >
            {/* Tab Switcher */}
            <div className="flex mb-8 bg-white/5 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
            
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Forms */}
            <AnimatePresence mode="wait">
              {activeTab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                >
                  <InputField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="Enter your email"
                    icon={EmailIcon}
                  />
                  
                  <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Enter your password"
                    icon={LockIcon}
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-teal-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </motion.button>
                  
                  <div className="mt-6 text-center">
                    <a href="/forgot-password" className="text-teal-400 hover:text-teal-300 text-sm transition-colors">
                      Forgot password?
                    </a>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleRegister}
                >
                  <InputField
                    label="First Name"
                    type="text"
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="Choose a username"
                    icon={UserIcon}
                  />
                  
                  <InputField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="Enter your email"
                    icon={EmailIcon}
                  />
                  
                  <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Create a password"
                    icon={LockIcon}
                  />
                  
                  <InputField
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm your password"
                    icon={LockIcon}
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-teal-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
            
            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-500">Ou continuer avec</span>
              </div>
            </div>
            
             {/* Social Auth Buttons */}
            <div className="space-y-3">
              <SocialButton
                provider="Google"
                icon={GoogleIcon}
                onClick={() => googleLogin()}
              />
              <SocialButton
                provider="Facebook"
                icon={FacebookIcon}
                onClick={() => handleSocialAuth('facebook')}
              />
            </div>
          </motion.div>
          
          {/* Bottom Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-gray-500 text-sm mt-8"
          >
            By continuing, you agree to our{' '}
            <a href="#" className="text-teal-400 hover:text-teal-300 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-teal-400 hover:text-teal-300 transition-colors">
              Privacy Policy
            </a>
          </motion.p>
        </div>
      </motion.div>
      
      {/* Decorative glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="fixed top-20 left-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="fixed bottom-20 right-10 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"
      />
    </div>
  );
};

export default AuthPage;

