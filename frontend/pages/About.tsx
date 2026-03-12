import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Code, Globe2, Award, Heart, Mail, Phone, MapPin, Linkedin, Github, ExternalLink, AlertCircle } from 'lucide-react';
import { useCV } from '../hooks/useData';
import { AboutSkeleton, ErrorDisplay } from '../components/Loading';
import RadialProgress from '../components/RadialProgress';

// ── Animated starfield canvas ─────────────────────────────────────────────
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

const About: React.FC = () => {
  const { data: cvData, loading, error, refetch } = useCV();
  const [retrying, setRetrying] = useState(false);
  const retryCountRef = useRef(0);

  // Debug: log CV data state for troubleshooting
  useEffect(() => {
    console.log('[About] CV data state:', {
      loading,
      error: error ? { message: error.message, status: error.status } : null,
      hasData: !!cvData,
      experiences: cvData?.experiences?.length ?? 0,
      education: cvData?.education?.length ?? 0,
      skills: cvData?.skills?.length ?? 0,
      languages: cvData?.languages?.length ?? 0,
    });
  }, [cvData, loading, error]);

  // Auto-retry when CV data loaded but all sections are empty (likely cold start fallback)
  const hasNoSections = !loading && cvData && 
    cvData.experiences.length === 0 && cvData.education.length === 0 && 
    cvData.skills.length === 0 && cvData.languages.length === 0;
  
  useEffect(() => {
    if (!hasNoSections || retryCountRef.current >= 6) return;
    const timer = setTimeout(async () => {
      retryCountRef.current++;
      setRetrying(true);
      await refetch();
      setRetrying(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [hasNoSections, refetch, cvData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Loading state
  if (loading) {
    return <AboutSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-24 md:pt-40 px-4 sm:px-8 md:px-24">
        <ErrorDisplay error={error} onRetry={refetch} />
      </div>
    );
  }

  // No data state
  if (!cvData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-2xl font-display font-bold mb-4">No CV Data Available</h2>
        <p className="text-gray-400 mb-8">CV information has not been configured yet.</p>
        <a 
          href="/admin/cv" 
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          Configure in Admin
        </a>
      </div>
    );
  }

  const { personal_info, experiences, education, skills, languages, certifications, projects, interests } = cvData;

  // Group skills by category
  const skillsByCategory = skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    const cat = skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen bg-[#030508] pt-24 pb-24"
    >
      <StarField />
      {/* Ambient glow orbs */}
      <div className="fixed top-[-150px] right-[10%] w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-100px] left-[5%] w-[400px] h-[400px] bg-indigo-700/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10">
      {/* Header / Personal Info */}
      <div className="px-4 sm:px-8 md:px-24 mb-20">
        <div className="flex flex-col md:flex-row gap-8 sm:gap-12 items-center md:items-start">
          {/* Profile Image */}
          {personal_info.profile_image && (
            <motion.div
              initial={{ opacity: 0, x: -50, rotateY: 45 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-gray-900 flex-shrink-0 border-4 border-blue-500/20"
            >
              <img 
                src={personal_info.profile_image} 
                alt={personal_info.full_name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
          
          {/* Name and Title */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex-1"
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold uppercase mb-4">
              {personal_info.full_name || 'Your Name'}
            </h1>
            <p className="text-lg sm:text-2xl text-blue-500 font-display uppercase tracking-widest mb-6">
              {personal_info.job_title || 'Your Job Title'}
            </p>
            
            {/* Contact Info */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-400 mb-8">
              {personal_info.email && (
                <a href={`mailto:${personal_info.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail size={16} /> {personal_info.email}
                </a>
              )}
              {personal_info.phone && (
                <a href={`tel:${personal_info.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={16} /> {personal_info.phone}
                </a>
              )}
              {personal_info.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={16} /> {personal_info.location}
                </span>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {personal_info.linkedin && (
                <a href={personal_info.linkedin} target="_blank" rel="noopener noreferrer" 
                  className="p-3 bg-gray-900 hover:bg-blue-500 transition-colors rounded-lg">
                  <Linkedin size={20} />
                </a>
              )}
              {personal_info.github && (
                <a href={personal_info.github} target="_blank" rel="noopener noreferrer"
                  className="p-3 bg-gray-900 hover:bg-blue-500 transition-colors rounded-lg">
                  <Github size={20} />
                </a>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Summary */}
        {personal_info.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 max-w-4xl"
          >
            <p className="text-lg text-gray-400 leading-relaxed">
              {personal_info.summary}
            </p>
          </motion.div>
        )}
      </div>

      {/* All Content Sections Displayed Together */}
      <div className="px-4 sm:px-8 md:px-24 space-y-16 sm:space-y-24">
        {/* Experience Section */}
        {experiences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Briefcase size={16} />
              Expérience Professionnelle
            </h2>
            <div className="grid gap-8">
              {experiences.map((exp, idx) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -50, rotateY: 20 }}
                  whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6, ease: "easeOut" }}
                  className="relative pl-8 border-l-2 border-gray-800 hover:border-blue-500 transition-colors"
                >
                  <div className="absolute left-[-9px] top-0 w-4 h-4 bg-blue-500 rounded-full" />
                  <div className="mb-2">
                    <h3 className="text-xl font-display font-bold uppercase">{exp.title}</h3>
                    <p className="text-blue-500 font-display">{exp.company}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {exp.location} | {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : (exp.end_date && formatDate(exp.end_date))}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 whitespace-pre-line">{exp.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <GraduationCap size={16} />
              Formation
            </h2>
            <div className="grid gap-8">
              {education.map((edu, idx) => (
                <motion.div
                  key={edu.id}
                  initial={{ opacity: 0, x: 50, rotateY: -20 }}
                  whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6, ease: "easeOut" }}
                  className="relative pl-8 border-l-2 border-gray-800 hover:border-blue-500 transition-colors"
                >
                  <div className="absolute left-[-9px] top-0 w-4 h-4 bg-blue-500 rounded-full" />
                  <div className="mb-2">
                    <h3 className="text-xl font-display font-bold uppercase">{edu.degree}</h3>
                    <p className="text-blue-500 font-display">{edu.institution}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {edu.location} | {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : (edu.end_date && formatDate(edu.end_date))}
                    </p>
                    {edu.gpa && <p className="text-xs text-gray-400 mt-1">GPA: {edu.gpa}</p>}
                  </div>
                  {edu.description && (
                    <p className="text-sm text-gray-400 mt-4">{edu.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Skills Section */}
        {skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Code size={16} />
              Compétences
            </h2>
            <div className="grid gap-8">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-sm font-display text-gray-500 uppercase tracking-widest mb-4">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(categorySkills as typeof skills).map((skill) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-gray-900/50 p-4 rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-display text-sm">{skill.name}</span>
                          <span className="text-xs text-gray-500">{skill.percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Languages Section */}
        {languages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Globe2 size={16} />
              Langues
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {languages.map((lang, idx) => {
                const percentage = lang.percentage || 50;

                return (
                  <motion.div
                    key={lang.id}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5, scale: 1.05 }}
                    className="bg-gray-900/50 p-6 rounded-lg text-center cursor-pointer"
                  >
                    <RadialProgress 
                      percentage={percentage}
                      size={120}
                      strokeWidth={8}
                      color="#e74c3c"
                      backgroundColor="#f0f0f0"
                      text={lang.name}
                      subtitle={lang.level}
                      showPercentage={true}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Award size={16} />
              Certifications
            </h2>
            <div className="grid gap-4">
              {certifications.map((cert, idx) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30, rotateY: 15 }}
                  whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  whileHover={{ x: 5, rotateY: 5 }}
                  className="bg-gray-900/50 p-6 rounded-lg flex items-start gap-4"
                >
                  <Award className="w-8 h-8 text-blue-500 flex-shrink-0" />
                   <div className="flex-1">
                    <h4 className="font-display font-bold uppercase">{cert.name}</h4>
                    <p className="text-sm text-gray-400">{cert.issuing_organization}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Issued: {formatDate(cert.issue_date)}
                      {cert.expiration_date && ` | Expires: ${formatDate(cert.expiration_date)}`}
                    </p>
                    {cert.credential_id && (
                      <p className="text-xs text-gray-500">Credential ID: {cert.credential_id}</p>
                    )}
                    {cert.credential_url && (
                      <a 
                        href={cert.credential_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-2"
                      >
                        View Credential <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Code size={16} />
              Projets
            </h2>
            <div className="grid gap-4">
              {projects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="bg-gray-900/50 p-6 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-display font-bold uppercase">{project.title}</h4>
                    {project.is_ongoing && (
                      <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded">En cours</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{project.description}</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Technologies: {Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}
                  </p>
                  <div className="flex gap-4">
                      {project.live_url && (
                        <a 
                          href={project.live_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                        >
                          Démonstration <ExternalLink size={12} />
                        </a>
                      )}
                      {project.github_url && (
                        <a 
                          href={project.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                        >
                          <Github size={12} /> Code Source
                        </a>
                      )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Interests Section */}
        {interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Heart size={16} />
              Intérêts
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {interests.map((interest, idx) => (
                <motion.div
                  key={interest.id}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="bg-gray-900/50 p-6 rounded-lg text-center cursor-pointer"
                >
                  <div className="text-3xl mb-2">{interest.icon}</div>
                  <h4 className="font-display font-bold uppercase">{interest.name}</h4>
                  {interest.description && (
                    <p className="text-xs text-gray-500 mt-2">{interest.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="mt-32 text-center text-gray-600 text-sm"
      >
        <p>© {new Date().getFullYear()} {personal_info.full_name || 'Your Name'}. All rights reserved.</p>
      </motion.div>
      </div>{/* end z-10 */}
    </motion.div>
  );
};

export default About;
