import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useProjects, useSettings } from '../hooks/useData';
import { ProjectCardSkeleton, ErrorDisplay, Spinner } from '../components/Loading';
import type { Project } from '../types';

const Home: React.FC = () => {
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  
  // Fetch projects and settings from API
  const { 
    data: projectsData, 
    loading: projectsLoading, 
    error: projectsError 
  } = useProjects();
  
  const { 
    data: settings, 
    loading: settingsLoading, 
    error: settingsError 
  } = useSettings();

  // Get featured projects (first 4)
  const featuredWorks: Project[] = projectsData?.results?.slice(0, 4) || [];

  // Scroll-based image transition for about section
  const { scrollYProgress: aboutScrollProgress } = useScroll({
    target: aboutSectionRef,
    offset: ["start end", "end start"]
  });

  // Clip path transition from top to bottom
  const clipPath = useTransform(
    aboutScrollProgress,
    [0.2, 0.6],
    ["inset(100% 0 0 0)", "inset(0 0 0 0)"]
  );

  // Use settings or defaults
  const heroTitle = settings?.hero_title || 'ACTIVE';
  const heroSubtitle = settings?.hero_subtitle || 'THEORY';
  const heroTagline = settings?.hero_tagline || 'Digital Experiences & Aerial Visuals';
  const aboutTitle = settings?.about_title || 'THE MIND BEHIND';
  const aboutQuote = settings?.about_quote || '"Technology is the vessel, but storytelling is the destination. I create digital landmarks that bridge the gap between imagination and reality."';
  const locationName = settings?.location || 'Casablanca, Morocco';
  const latitude = settings?.latitude || 33.5731;
  const longitude = settings?.longitude || -7.5898;
  const profileImage = settings?.profile_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
  const droneImage = settings?.drone_image || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop';
  const footerText = settings?.footer_text || 'DESIGNED BY ADRIAN';
  const copyrightYear = settings?.copyright_year || 2024;
  const version = settings?.version || '1.0';

  return (
    <div className="relative bg-transparent selection:bg-blue-500">
      {/* 1. HERO SECTION */}
      <section className="relative h-[120vh] flex flex-col items-center justify-center px-8 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="z-10"
        >
          <p className="font-display text-[10px] md:text-xs tracking-[0.8em] uppercase text-blue-500 mb-8">
            {heroTagline}
          </p>
          <h1 className="text-7xl md:text-[12rem] font-display font-bold leading-none tracking-tighter uppercase mb-12">
            {heroTitle} <br />
            <span className="text-transparent" style={{ WebkitTextStroke: '1.5px white' }}>{heroSubtitle}</span>
          </h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="w-px h-24 bg-gradient-to-b from-blue-500 to-transparent mb-8" />
            <p className="max-w-md text-gray-400 text-sm uppercase tracking-widest leading-relaxed">
              Based in {locationName} <br /> 
              {latitude}° N, {Math.abs(longitude)}° W
            </p>
          </motion.div>
        </motion.div>

        {/* Parallax background text */}
        <motion.div 
          style={{ y: useTransform(aboutScrollProgress, [0, 0.5], [0, -200]) }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none"
        >
          <h2 className="text-[30vw] font-display font-black">WORK</h2>
        </motion.div>
      </section>

      {/* 2. PROJECTS SECTION - Vertical Layout */}
      <section className="py-24 md:py-48 px-8 md:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-16 md:mb-24">
            <h3 className="text-4xl md:text-7xl font-display font-bold uppercase mb-8 leading-tight">
              SELECTED <br /> <span className="text-blue-500">PROJECTS</span>
            </h3>
            <p className="text-gray-400 text-lg max-w-sm mb-8">
              A curation of high-performance digital platforms and cinematic drone captures.
            </p>
            <Link to="/work" className="group flex items-center gap-4 text-xs font-display tracking-[0.3em] uppercase">
              Explore All <div className="p-4 border border-gray-800 rounded-full group-hover:bg-white group-hover:text-black transition-all"><ChevronRight size={16}/></div>
            </Link>
          </div>

          {/* Project Cards - Vertical Stack */}
          <div className="space-y-16 md:space-y-24">
            {projectsLoading && (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative">
                    <ProjectCardSkeleton />
                  </div>
                ))}
              </>
            )}
            
            {projectsError && (
              <ErrorDisplay 
                error={projectsError} 
                onRetry={() => window.location.reload()}
              />
            )}
            
            {!projectsLoading && !projectsError && featuredWorks.map((project, i) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="relative group cursor-pointer"
              >
                <Link to={`/project/${project.slug}`} className="block relative overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[21/9]">
                  <motion.div className="w-full h-full overflow-hidden rounded-2xl">
                    <img 
                      src={project.thumbnail} 
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s] ease-out"
                    />
                  </motion.div>
                  
                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 md:p-12 rounded-2xl">
                    <p className="font-display text-blue-500 text-xs tracking-widest uppercase mb-4">0{i+1} / {project.category}</p>
                    <h4 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tighter mb-6">{project.title}</h4>
                    <div className="flex flex-wrap gap-2 md:gap-4">
                      {project.technologies.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] font-display uppercase tracking-widest border border-white/20 px-3 py-1 md:px-4 md:py-2 rounded-full backdrop-blur-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Fixed Project Index */}
                  <div className="absolute top-6 left-6 md:top-8 md:left-8 mix-blend-difference z-20">
                     <span className="font-display text-3xl md:text-4xl opacity-50">0{i+1}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
            
            {!projectsLoading && !projectsError && featuredWorks.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-gray-500 font-display uppercase tracking-widest">No projects available yet.</p>
                <Link to="/work" className="mt-4 inline-block text-blue-500 hover:underline">
                  View all works
                </Link>
              </div>
            )}
          </div>

          {/* See More CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-24 md:mt-32 text-center"
          >
            <Link to="/work" className="group inline-block">
              <h3 className="text-4xl md:text-6xl font-display font-bold uppercase mb-4 group-hover:text-blue-500 transition-colors">SEE MORE</h3>
              <p className="font-display text-xs tracking-[0.5em] text-gray-500">VIEW COMPLETE PORTFOLIO</p>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3. ABOUT MINI SECTION - Scroll-based Image Transition */}
      <section ref={aboutSectionRef} className="py-48 px-8 md:px-24 bg-black/80 backdrop-blur-sm relative z-10 border-t border-gray-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">{aboutTitle}</p>
            <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-8">
              {aboutQuote}
            </h2>
            <Link to="/about" className="group flex items-center gap-4 text-xs font-display tracking-[0.3em] uppercase">
              Meet Adrian <div className="p-4 border border-gray-800 rounded-full group-hover:bg-white group-hover:text-black transition-all"><ChevronRight size={16}/></div>
            </Link>
          </motion.div>
          
          <div className="relative">
            <motion.div 
              style={{ clipPath }}
              className="relative z-10"
            >
              <img 
                src={droneImage} 
                alt="Drone Work" 
                loading="lazy"
                className="w-full h-[60vh] object-cover rounded-2xl"
              />
            </motion.div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 z-20">
              <img 
                src={profileImage} 
                alt="Profile" 
                loading="lazy"
                className="w-full h-full object-cover rounded-2xl border-4 border-black shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONTACT CTA */}
      <section className="py-48 px-8 md:px-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs font-display text-gray-500 uppercase tracking-[0.5em] mb-8">Ready to initiate?</p>
          <Link to="/contact" className="group inline-block">
            <h2 className="text-6xl md:text-8xl font-display font-bold uppercase group-hover:text-blue-500 transition-colors">GET IN TOUCH</h2>
          </Link>
        </motion.div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-24 px-8 md:px-24 border-t border-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="text-gray-500 text-sm font-display">© {copyrightYear} VERSION {version}</p>
            <p className="text-gray-600 text-xs font-display uppercase mt-2">{footerText}</p>
          </div>
          <div className="flex gap-8">
            {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors text-xs font-display uppercase tracking-widest">Instagram</a>}
            {settings?.linkedin_url && <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors text-xs font-display uppercase tracking-widest">LinkedIn</a>}
            {settings?.github_url && <a href={settings.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors text-xs font-display uppercase tracking-widest">GitHub</a>}
          </div>
          <div className="text-center md:text-right">
            <p className="text-gray-500 text-xs font-display uppercase tracking-widest">LOC: {locationName}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
