
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Chrome, Facebook } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

interface RegisterProps {
  onLogin: (user: any, token: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user, data.token);
        navigate('/');
      } else {
        const errorMsg = String(Object.values(data).flat()[0] || 'Registration failed');
        setError(errorMsg);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (provider: 'google' | 'facebook') => {
    setError(`${provider} registration requires OAuth setup. Please use email registration.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold tracking-widest mb-2 uppercase">Create Account</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest">Join our community</p>
        </div>

        <div className="p-10 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full bg-transparent border border-gray-800 py-3 pl-10 pr-3 focus:border-blue-500 outline-none font-display transition-colors text-sm"
                    placeholder="John"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full bg-transparent border border-gray-800 py-3 pl-10 pr-3 focus:border-blue-500 outline-none font-display transition-colors text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="space-y-2">
              <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className="w-full bg-transparent border border-gray-800 py-4 pl-12 pr-4 focus:border-blue-500 outline-none font-display transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-display uppercase text-center">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-white text-black font-display text-xs tracking-widest uppercase hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-800"></div>
            <span className="px-4 text-gray-500 text-xs uppercase">or sign up with</span>
            <div className="flex-1 border-t border-gray-800"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSocialRegister('google')}
              className="flex items-center justify-center gap-3 py-4 border border-gray-800 hover:border-white transition-colors"
            >
              <Chrome size={18} />
              <span className="text-xs font-display uppercase">Google</span>
            </button>
            <button 
              onClick={() => handleSocialRegister('facebook')}
              className="flex items-center justify-center gap-3 py-4 border border-gray-800 hover:border-white transition-colors"
            >
              <Facebook size={18} />
              <span className="text-xs font-display uppercase">Facebook</span>
            </button>
          </div>

          <div className="mt-8 text-center space-y-4">
            <Link to="/login" className="block text-[10px] font-display uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
              Already have an account? Sign In
            </Link>
            <Link to="/" className="block text-[10px] font-display uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
              Return to Public Site
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-600 text-[10px] mt-6">
          By registering, you agree to receive email notifications about new projects and updates.
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
