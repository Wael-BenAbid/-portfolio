import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Instagram, Linkedin, Github, MapPin, Send, CheckCircle, ArrowUpRight, Twitter } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useSettings } from '../hooks/useData';

// ── Animated starfield canvas ──────────────────────────────────────────────
const StarField: React.FC = () => {
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

    interface Star {
      x: number; y: number; r: number;
      opacity: number; vx: number; vy: number;
      phase: number; speed: number;
    }

    const stars: Star[] = Array.from({ length: 300 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.014 + 0.005,
    }));

    const glows: Star[] = Array.from({ length: 20 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + 1.5,
      opacity: Math.random() * 0.35 + 0.1,
      vx: (Math.random() - 0.5) * 0.05,
      vy: (Math.random() - 0.5) * 0.05,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.007 + 0.003,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const tick = (s: Star, rgba: (a: number) => string) => {
        s.phase += s.speed;
        s.x = (s.x + s.vx + canvas.width) % canvas.width;
        s.y = (s.y + s.vy + canvas.height) % canvas.height;
        const a = s.opacity * (0.55 + 0.45 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(a);
        ctx.fill();
      };

      stars.forEach(s => tick(s, a => `rgba(160,190,255,${a})`));
      glows.forEach(s => {
        s.phase += s.speed;
        s.x = (s.x + s.vx + canvas.width) % canvas.width;
        s.y = (s.y + s.vy + canvas.height) % canvas.height;
        const a = s.opacity * (0.55 + 0.45 * Math.sin(s.phase));
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        grad.addColorStop(0, `rgba(150,180,255,${a})`);
        grad.addColorStop(1, 'rgba(150,180,255,0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,225,255,${a})`;
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
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// ── Animated input / textarea field ───────────────────────────────────────
interface FieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  maxLength?: number;
  delay?: number;
}

const Field: React.FC<FieldProps> = ({
  label, name, type = 'text', value, onChange, placeholder, rows, required, maxLength, delay = 0,
}) => {
  const [focused, setFocused] = useState(false);
  const Tag = rows ? 'textarea' : 'input';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="relative"
    >
      <label className={`block text-[10px] font-display uppercase tracking-[0.2em] mb-2 transition-colors duration-200 ${focused ? 'text-blue-400' : 'text-gray-500'}`}>
        {label}
      </label>
      <div className="relative">
        <Tag
          {...(rows ? { rows } : { type })}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 text-sm outline-none transition-all duration-300 focus:bg-white/[0.06] focus:border-blue-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.10)] resize-none"
          style={{ minHeight: rows ? `${rows * 1.6}rem` : undefined }}
        />
        {/* bottom accent line that grows on focus */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-xl"
          initial={false}
          animate={{ width: focused ? '100%' : '0%', opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {maxLength && (
        <p className="text-right text-[10px] text-gray-600 mt-1.5">{value.length}/{maxLength}</p>
      )}
    </motion.div>
  );
};

// ── Main component ────────────────────────────────────────────────────────
const Contact: React.FC = () => {
  const { data: settings } = useSettings();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/settings/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Something went wrong' }));
        setSubmitError(errorData.error || errorData.detail || 'Failed to send message');
      }
    } catch {
      setSubmitError('Network error. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) return null;

  const socialLinks = [
    { href: settings.instagram_url, Icon: Instagram, label: 'Instagram' },
    { href: settings.linkedin_url,  Icon: Linkedin,  label: 'LinkedIn'  },
    { href: settings.github_url,    Icon: Github,    label: 'GitHub'    },
    { href: settings.twitter_url,   Icon: Twitter,   label: 'Twitter'   },
  ].filter(s => s.href);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen bg-[#030508] text-white overflow-hidden"
    >
      <StarField />

      {/* Ambient glows */}
      <div className="fixed top-[-200px] left-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-150px] right-[5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-16 pt-24 md:pt-36 pb-20">

        {/* ── header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-20"
        >
          <p className="text-[10px] font-display uppercase tracking-[0.35em] text-blue-400 mb-4">
            — Prenons contact
          </p>
          <h1 className="text-[clamp(3rem,10vw,7rem)] font-display font-bold uppercase leading-[0.9] tracking-tight">
            {settings.contact_title}
          </h1>
        </motion.div>

        {/* ── two-column layout ── */}
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-16 xl:gap-24 items-start">

          {/* ── LEFT: info ── */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className="text-gray-400 text-lg leading-relaxed mb-14 max-w-sm"
            >
              {settings.contact_subtitle}
            </motion.p>

            {/* Info cards */}
            <div className="space-y-4 mb-14">
              {[
                {
                  icon: <MapPin size={20} />,
                  label: 'Localisation',
                  value: settings.location,
                  sub: `LAT: ${settings.latitude} / LNG: ${settings.longitude}`,
                  href: null,
                  delay: 0.22,
                },
                {
                  icon: <Mail size={20} />,
                  label: 'Email',
                  value: settings.contact_email,
                  sub: 'Réponse sous 24h',
                  href: `mailto:${settings.contact_email}`,
                  delay: 0.3,
                },
              ].map(({ icon, label, value, sub, href, delay }) => {
                const Inner = (
                  <div className="flex items-center gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-0.5">{label}</p>
                      <p className="text-white font-medium truncate">{value}</p>
                      {sub && <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-widest">{sub}</p>}
                    </div>
                    {href && <ArrowUpRight size={16} className="flex-shrink-0 text-gray-600 group-hover:text-blue-400 transition-colors" />}
                  </div>
                );

                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay, duration: 0.45 }}
                  >
                    {href ? (
                      <a href={href} className="group block bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-blue-500/30 rounded-2xl px-5 py-4 transition-all duration-300">
                        {Inner}
                      </a>
                    ) : (
                      <div className="bg-white/[0.03] border border-white/8 rounded-2xl px-5 py-4">
                        {Inner}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Social links */}
            {socialLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.45 }}
              >
                <p className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-4">Retrouvez-moi</p>
                <div className="flex gap-3">
                  {socialLinks.map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="group w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-blue-500/40 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT: form ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="relative"
          >
            {/* Glass card */}
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">

              <AnimatePresence mode="wait">
                {submitSuccess ? (
                  /* ── Success state ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-6"
                    >
                      <CheckCircle size={36} className="text-green-400" />
                    </motion.div>
                    <h3 className="text-2xl font-display font-bold mb-3">Message envoyé !</h3>
                    <p className="text-gray-400 text-sm mb-8 max-w-xs">Je vous répondrai dans les plus brefs délais. Merci de m'avoir contacté.</p>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="text-[11px] font-display uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Envoyer un autre message →
                    </button>
                  </motion.div>
                ) : (
                  /* ── Form ── */
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="mb-2">
                      <h2 className="text-lg font-display font-semibold">Envoyez-moi un message</h2>
                      <p className="text-[12px] text-gray-500 mt-1">Tous les champs sont requis.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="Nom complet" name="name" value={formData.name}
                        onChange={handleInputChange} placeholder={settings.contact_form_placeholder_name}
                        required delay={0.15} />
                      <Field label="Adresse email" name="email" type="email" value={formData.email}
                        onChange={handleInputChange} placeholder={settings.contact_form_placeholder_email}
                        required delay={0.2} />
                    </div>

                    <Field label="Sujet" name="subject" value={formData.subject}
                      onChange={handleInputChange} placeholder={settings.contact_form_placeholder_subject}
                      required delay={0.25} />

                    <Field label="Message" name="message" value={formData.message}
                      onChange={handleInputChange} placeholder={settings.contact_form_placeholder_message}
                      rows={5} required maxLength={1000} delay={0.3} />

                    <AnimatePresence>
                      {submitError && (
                        <motion.p
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="text-red-400 text-sm px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                        >
                          {submitError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display text-[11px] uppercase tracking-[0.2em] py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          {settings.contact_form_button_text}
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── footer ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-24 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-display uppercase tracking-[0.35em] text-gray-600"
        >
          <p>© 2024 Wael. Tous droits réservés.</p>
          <p>Coordonnées: {settings.latitude}, {settings.longitude}</p>
        </motion.footer>
      </div>
    </motion.div>
  );
};

export default Contact;
