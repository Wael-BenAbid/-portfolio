import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Check, Lock } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { BackButton } from '../components/BackButton';

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

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

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

      nodes.forEach((n) => {
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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

// Main Component
const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if there's a reset token in the URL
    const token = searchParams.get('token');
    if (token) {
      setStep('reset');
      sessionStorage.setItem('reset_token', token);
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send reset email. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem('reset_token');
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          password: newPassword,
          password_confirm: confirmPassword
        })
      });

      if (response.ok) {
        setSuccess(true);
        sessionStorage.removeItem('reset_token');
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to reset password. Token may have expired.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#060d12] overflow-hidden">
      <div className="fixed inset-0 z-0">
        <PolygonMesh />
      </div>

      <div className="fixed inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d12]/70 via-transparent to-[#060d12]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060d12]/60 via-transparent to-[#060d12]/60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-20 min-h-screen flex items-center justify-center px-6 py-12"
      >
        <div className="w-full max-w-md">
          <div className="mb-6">
            <BackButton />
          </div>

          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-bold tracking-widest mb-2 uppercase">Reset Password</h1>
            <p className="text-gray-500 text-xs uppercase tracking-widest">
              {step === 'email' ? 'Request a password reset' : 'Create a new password'}
            </p>
          </div>

          <div className="p-10 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-slate-400 text-sm">
              {step === 'email' ? 'Request a password reset' : 'Create a new password'}
            </p>
          </motion.div>

          {/* Step 1: Request Reset Email */}
          {step === 'email' && !success && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleRequestReset}
              className="space-y-6"
              autoComplete="off"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-transparent border border-gray-800 py-4 pl-12 pr-4 focus:border-blue-500 outline-none font-display transition-colors"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-[10px] font-display uppercase text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-white text-black font-display text-xs tracking-widest uppercase hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center text-[10px] font-display uppercase tracking-widest text-gray-600">
                Remember your password?{' '}
                <a href="/auth" className="text-white hover:text-blue-500 transition-colors">
                  Back to Login
                </a>
              </p>
            </motion.form>
          )}

          {/* Step 2: Reset Password */}
          {step === 'reset' && !success && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleResetPassword}
              className="space-y-6"
              autoComplete="off"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border border-gray-800 py-4 pl-12 pr-4 focus:border-blue-500 outline-none font-display transition-colors"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border border-gray-800 py-4 pl-12 pr-4 focus:border-blue-500 outline-none font-display transition-colors"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-[10px] font-display uppercase text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-white text-black font-display text-xs tracking-widest uppercase hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </motion.form>
          )}

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white rounded-full">
                    <Check className="w-6 h-6 text-black" />
                  </div>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-widest mb-2 uppercase text-white">
                  {step === 'email' ? 'Email Sent!' : 'Password Reset!'}
                </h2>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">
                  {step === 'email'
                    ? 'Check your email for the reset link. Redirecting to login...'
                    : 'Your password has been reset successfully. Redirecting to login...'}
                </p>
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
