import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useProjects, useSettings } from '../hooks/useData';
import { ProjectCardSkeleton, ErrorDisplay } from '../components/Loading';
import LikeButton from '../components/LikeButton';
import { OptimizedImage } from '../components/OptimizedImage';
import { OptimizedVideo } from '../components/OptimizedVideo';
import type { Project } from '../types';
import { isVideoUrl } from '../constants';

const Home: React.FC = () => {
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  
  // Fetch projects and settings from API
  const { 
    data: projectsData, 
    loading: projectsLoading, 
    error: projectsError 
  } = useProjects();
  
  const { data: settings } = useSettings();

  // Get featured projects (first 4 active, or all active if no featured)
  const featuredWorks: Project[] = projectsData?.results?.filter(p => p.is_active).slice(0, 4) || [];

  // Scroll-based image transition for about section
  const { scrollYProgress: aboutScrollProgress } = useScroll({
    target: aboutSectionRef,
    offset: ["start end", "end start"]
  });

  // Use settings or defaults
  const heroTitle = settings?.hero_title || 'CREATIVE DEVELOPER';
  const heroSubtitle = settings?.hero_subtitle || 'Digital Craftsman';
  const heroTagline = settings?.hero_tagline || 'Digital Experiences & Aerial Visuals';
  const aboutTitle = settings?.about_title || 'THE MIND BEHIND';
  const aboutQuote = settings?.about_quote || '"Technology is the vessel, but storytelling is the destination. I create digital landmarks that bridge the gap between imagination and reality."';
  const locationName = settings?.location || 'Bizerte, Tunisia';
  const latitude = settings?.latitude || 33.5731;
  const longitude = settings?.longitude || -7.5898;
  const footerText = settings?.footer_text || 'DESIGNED BY wael';
  const footerBackgroundVideo = settings?.footer_background_video;
  const copyrightYear = settings?.copyright_year || 2026;
  const version = settings?.version || '1.0';
  const profileImage = settings?.profile_image;
  const droneImage = settings?.drone_image;
  


  return (
    <div className="relative bg-transparent selection:bg-blue-500">

      {/* 1. HERO SECTION */}
      <section className="relative h-[120vh] flex flex-col items-center justify-center px-4 sm:px-8 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="z-10 max-w-5xl"
        >
          <motion.p 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-display text-[10px] md:text-xs tracking-[0.8em] uppercase text-blue-500 mb-8 relative inline-block"
          >
            <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-px bg-blue-500/50"></span>
            {heroTagline}
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-5xl sm:text-7xl md:text-[11rem] font-display font-black leading-none tracking-tighter uppercase mb-12 relative"
          >
            {heroTitle} <br />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" 
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {heroSubtitle}
            </motion.span>
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="w-px h-24 bg-gradient-to-b from-blue-500 via-blue-500/30 to-transparent mb-8" />
            <p className="max-w-md text-gray-400 text-sm uppercase tracking-widest leading-relaxed">
              Based in <span className="text-white font-semibold">{locationName}</span> <br /> 
              <span className="text-blue-400">{latitude}° N, {Math.abs(longitude)}° W</span>
            </p>
            
            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="mt-12"
            >
              <Link to="/work" className="group relative inline-flex items-center gap-3 px-8 py-4 text-sm font-display tracking-[0.1em] uppercase overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors duration-500"></div>
                
                {/* Border animation */}
                <div className="absolute inset-0 border border-blue-500/30 group-hover:border-blue-500 transition-colors duration-500"></div>
                
                <span className="relative z-10">Discover My Work</span>
                <motion.div 
                  className="relative z-10 w-5 h-5 flex items-center justify-center border border-blue-500/30 group-hover:border-blue-500 rounded-full transition-colors duration-500"
                  whileHover={{ x: 4 }}
                >
                  <ChevronRight size={14} className="group-hover:text-blue-400 transition-colors" />
                </motion.div>
              </Link>
            </motion.div>
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
      <section className="py-16 sm:py-24 md:py-48 px-4 sm:px-8 md:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-16 md:mb-24"
          >
            <h3 className="text-4xl sm:text-5xl md:text-7xl font-display font-black uppercase mb-8 leading-tight">
              SELECTED <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">PROJECTS</span>
            </h3>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-gray-400 text-base md:text-lg max-w-2xl mb-8 leading-relaxed"
            >
              A curation of high-performance digital platforms and cinematic drone captures that push the boundaries of what's possible.
            </motion.p>
            <motion.div
              whileHover={{ x: 8 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/work" className="group inline-flex items-center gap-3 text-xs font-display tracking-[0.3em] uppercase border-b border-blue-500/30 hover:border-blue-500 pb-1 transition-colors duration-300">
                Explore All Works <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

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
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="relative group cursor-pointer"
              >
                 <div className="block relative overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[21/9] ring-1 ring-white/10 group-hover:ring-blue-500/30 transition-all duration-500">
                    {/* Check if thumbnail is a video */}
                    {isVideoUrl(project.thumbnail) ? (
                      <div className="block relative overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[21/9]">
                         <motion.div 
                          className="w-full h-full overflow-hidden rounded-2xl"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                         >
                           <OptimizedVideo
                             src={project.thumbnail}
                             alt={project.title}
                             lazy={true}
                             placeholder={true}
                             grayscale={true}
                             hoverEffects={true}
                             objectFit="cover"
                             className="w-full h-full"
                           />
                         </motion.div>
                        
                        {/* Overlay Info */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90 flex flex-col justify-end p-8 md:p-12 rounded-2xl"
                        >
                          <motion.p 
                            initial={{ y: 10, opacity: 0 }}
                            whileHover={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="font-display text-blue-400 text-xs tracking-widest uppercase mb-3"
                          >
                            0{i+1} / {project.category}
                          </motion.p>
                          <motion.h4 
                            initial={{ y: 10, opacity: 0 }}
                            whileHover={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tighter mb-6"
                          >
                            {project.title}
                          </motion.h4>
                          <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            whileHover={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="flex flex-wrap gap-2 md:gap-3"
                          >
                            {Array.isArray(project.technologies) ? project.technologies.slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] font-display uppercase tracking-widest border border-blue-400/40 hover:border-blue-400 px-3 py-1 md:px-4 md:py-2 rounded-full backdrop-blur-sm hover:bg-blue-500/10 transition-all duration-300">
                                {t}
                              </span>
                            )) : []}
                          </motion.div>
                        </motion.div>

                        {/* Animated Project Index */}
                        <motion.div 
                          className="absolute top-6 left-6 md:top-8 md:left-8 z-20"
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="font-display text-3xl md:text-5xl font-black text-blue-500/40 group-hover:text-blue-500/70 transition-colors duration-500">0{i+1}</span>
                        </motion.div>
                     </div>
                   ) : (
                     /* For images, keep the link */
                     <Link to={`/project/${project.slug}`} className="block relative overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[21/9] ring-1 ring-white/10 group-hover:ring-blue-500/30 transition-all duration-500">
                        <motion.div 
                          className="w-full h-full overflow-hidden rounded-2xl"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                          <OptimizedImage
                            src={project.thumbnail}
                            alt={project.title}
                            lazy={true}
                            placeholder={true}
                            grayscale={true}
                            hoverEffects={true}
                            objectFit="cover"
                            className="w-full h-full"
                          />
                        </motion.div>
                        
                        {/* Overlay Info */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90 flex flex-col justify-end p-8 md:p-12 rounded-2xl"
                        >
                          <motion.p 
                            initial={{ y: 10, opacity: 0 }}
                            whileHover={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="font-display text-blue-400 text-xs tracking-widest uppercase mb-3"
                          >
                            0{i+1} / {project.category}
                          </motion.p>
                          <motion.h4 
                            initial={{ y: 10, opacity: 0 }}
                            whileHover={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tighter mb-6"
                          >
                            {project.title}
                          </motion.h4>
                          <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            whileHover={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="flex flex-wrap gap-2 md:gap-3"
                          >
                            {Array.isArray(project.technologies) ? project.technologies.slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] font-display uppercase tracking-widest border border-blue-400/40 hover:border-blue-400 px-3 py-1 md:px-4 md:py-2 rounded-full backdrop-blur-sm hover:bg-blue-500/10 transition-all duration-300">
                                {t}
                              </span>
                            )) : []}
                          </motion.div>
                        </motion.div>

                        {/* Animated Project Index */}
                        <motion.div 
                          className="absolute top-6 left-6 md:top-8 md:left-8 z-20"
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="font-display text-3xl md:text-5xl font-black text-blue-500/40 group-hover:text-blue-500/70 transition-colors duration-500">0{i+1}</span>
                        </motion.div>

                        {/* Fixed Project Index */}
                        <div className="absolute top-6 left-6 md:top-8 md:left-8 mix-blend-difference z-20">
                           <span className="font-display text-3xl md:text-4xl opacity-50">0{i+1}</span>
                        </div>
                    </Link>
                   )}
                  
                  {/* Like Button */}
                  <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20">
                    <LikeButton 
                      contentId={project.id} 
                      contentType="project" 
                      initialLiked={project.is_liked} 
                      initialLikesCount={project.likes_count} 
                    />
                  </div>
                </div>
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
      <section ref={aboutSectionRef} className="py-24 sm:py-48 px-4 sm:px-8 md:px-24 bg-black/80 backdrop-blur-sm relative z-10 border-t border-gray-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-center">
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
              Meet WAEL <div className="p-4 border border-gray-800 rounded-full group-hover:bg-white group-hover:text-black transition-all"><ChevronRight size={16}/></div>
            </Link>
          </motion.div>

          {/* Images column — staggered composition */}
          {(profileImage || droneImage) && (
            <div className="relative h-[480px] md:h-[560px] hidden md:block">
              {/* Top-right: work/drone image */}
              {droneImage && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.15 }}
                  className="absolute top-0 right-0 w-[72%] overflow-hidden rounded-2xl shadow-2xl"
                  style={{ aspectRatio: '4/3' }}
                >
                  <OptimizedImage
                    src={droneImage}
                    alt="Work / Drone"
                    objectFit="cover"
                    className="w-full h-full"
                    grayscale={true}
                    hoverEffects={true}
                  />
                </motion.div>
              )}
              {/* Bottom-left: profile image slightly overlapping */}
              {profileImage && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute bottom-0 left-0 w-[55%] overflow-hidden rounded-2xl shadow-2xl border border-gray-800"
                  style={{ aspectRatio: '3/4' }}
                >
                  <OptimizedImage
                    src={profileImage}
                    alt="Profile"
                    objectFit="cover"
                    className="w-full h-full"
                    grayscale={true}
                    hoverEffects={true}
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* Mobile: stacked images */}
          {(profileImage || droneImage) && (
            <div className="flex flex-col gap-4 md:hidden">
              {droneImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  className="overflow-hidden rounded-2xl"
                  style={{ aspectRatio: '4/3' }}
                >
                  <OptimizedImage src={droneImage} alt="Work / Drone" objectFit="cover" className="w-full h-full" grayscale={true} hoverEffects={true} />
                </motion.div>
              )}
              {profileImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className="overflow-hidden rounded-2xl w-2/3"
                  style={{ aspectRatio: '3/4' }}
                >
                  <OptimizedImage src={profileImage} alt="Profile" objectFit="cover" className="w-full h-full" grayscale={true} hoverEffects={true} />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. CONTACT CTA */}
      <section className="py-24 sm:py-48 px-4 sm:px-8 md:px-24 text-center">
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
      <footer className={`py-16 sm:py-24 px-4 sm:px-8 md:px-24 border-t border-gray-900 ${footerBackgroundVideo ? 'relative overflow-hidden' : ''}`}>
        {footerBackgroundVideo && (
          <video
            src={footerBackgroundVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-10"
          />
        )}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
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

