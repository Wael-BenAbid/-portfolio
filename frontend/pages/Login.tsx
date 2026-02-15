
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Chrome, Facebook } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user, data.token);
        if (data.user.user_type === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(data.non_field_errors?.[0] || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    // For demo purposes - in production, you'd use OAuth flow
    setError(`${provider} login requires OAuth setup. Please use email login.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold tracking-widest mb-2 uppercase">Welcome Back</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest">Sign in to your account</p>
        </div>

        <div className="p-10 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-gray-800 py-4 pl-12 pr-4 focus:border-blue-500 outline-none font-display transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-gray-800 py-4 pl-12 pr-12 focus:border-blue-500 outline-none font-display transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-display uppercase text-center">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-white text-black font-display text-xs tracking-widest uppercase hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-800"></div>
            <span className="px-4 text-gray-500 text-xs uppercase">or continue with</span>
            <div className="flex-1 border-t border-gray-800"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-3 py-4 border border-gray-800 hover:border-white transition-colors"
            >
              <Chrome size={18} />
              <span className="text-xs font-display uppercase">Google</span>
            </button>
            <button 
              onClick={() => handleSocialLogin('facebook')}
              className="flex items-center justify-center gap-3 py-4 border border-gray-800 hover:border-white transition-colors"
            >
              <Facebook size={18} />
              <span className="text-xs font-display uppercase">Facebook</span>
            </button>
          </div>

          <div className="mt-8 text-center space-y-4">
            <Link to="/register" className="block text-[10px] font-display uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
              Don't have an account? Register
            </Link>
            <Link to="/" className="block text-[10px] font-display uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
              Return to Public Site
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
