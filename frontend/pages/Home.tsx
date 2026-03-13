import React, { useRef, useState, useEffect } from 'react';
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
import { detectImageOrientation, detectVideoOrientation, Orientation } from '../utils/mediaOrientation';

const Home: React.FC = () => {
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  
  // State pour stocker l'orientation de chaque média (clé = project.id)
  const [mediaOrientations, setMediaOrientations] = useState<Record<number, Orientation>>({});

  // Callback pour stocker l'orientation détectée
  const handleOrientation = (projectId: number, orientation: Orientation) => {
    setMediaOrientations(prev => ({ ...prev, [projectId]: orientation }));
  };

  const { data: projectsData, error: projectsError, loading: projectsLoading } = useProjects();
  const { data: settings, loading: settingsLoading } = useSettings();

  // Featured works - first 3 projects
  const featuredWorks = projectsData?.results.slice(0, 3) || [];

  // Settings values
  const { 
    hero_title: heroTitle = "CINEMATIC PORTFOLIO",
    hero_subtitle: heroSubtitle = "Capturing moments that tell stories",
    about_title: aboutTitle = "About Me",
    about_quote: aboutQuote = "Passionate about creating immersive digital experiences",
    profile_image: profileImage = "",
    drone_image: droneImage = "",
    footer_text: footerText = "Portfolio",
    copyright_year: copyrightYear = "2024",
    version: version = "1.0.0",
    location: locationName = "Tunisia",
    footer_background_video: footerBackgroundVideo = ""
  } = settings || {};

  // Détection de l'orientation pour tous les projets
  useEffect(() => {
    if (featuredWorks.length > 0) {
      featuredWorks.forEach(project => {
        if (!project.thumbnail || mediaOrientations[project.id]) return;
        
        if (isVideoUrl(project.thumbnail)) {
          detectVideoOrientation(project.thumbnail, (o) => handleOrientation(project.id, o));
        } else {
          detectImageOrientation(project.thumbnail, (o) => handleOrientation(project.id, o));
        }
      });
    }
  }, [featuredWorks]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* 1. HERO SECTION - Cinematic Intro */}
      <section className="relative h-screen flex flex-col justify-center items-center px-4 sm:px-8 md:px-24 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-10 pointer-events-none" />
        
        {/* Animated hero title */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-20 text-center max-w-5xl mx-auto"
        >
          <h1 className="text-7xl sm:text-9xl md:text-[15vw] font-display font-black uppercase tracking-tighter leading-none mb-8">
            {heroTitle}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-lg md:text-2xl font-light tracking-[0.3em] text-blue-400 uppercase"
          >
            {heroSubtitle}
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="w-px h-16 bg-blue-500/30 relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-1/3 bg-blue-500"
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="text-xs font-display tracking-widest text-blue-400 uppercase mt-4">Scroll</p>
        </motion.div>
      </section>

      {/* 2. WORK SHOWCASE - Featured Projects with Orientation Detection */}
      <section className="py-20 sm:py-32 px-4 sm:px-8 md:px-24 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 md:mb-20"
          >
            <p className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-4">Selected Works</p>
            <h2 className="text-5xl sm:text-7xl md:text-8xl font-display font-bold uppercase leading-tight">
              Featured <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
                Projects
              </span>
            </h2>
          </motion.div>

          {/* Projects Grid with Orientation Detection */}
          <div className="space-y-12 md:space-y-16">
            {projectsLoading && (
              <div className="space-y-12 md:space-y-16">
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
              </div>
            )}

            {featuredWorks.length > 0 && featuredWorks.map((project, i) => {
              // Orientation du média (portrait, landscape, square)
              const orientation = mediaOrientations[project.id];

              // Choix du ratio et objectFit selon orientation
              let aspectClass = 'aspect-[16/9] md:aspect-[21/9]';
              let objectFit: 'cover' | 'contain' = 'cover';
              if (orientation === 'portrait') {
                aspectClass = 'aspect-[9/10] md:aspect-[9/10]';
                objectFit = 'cover';
              } else if (orientation === 'square') {
                aspectClass = 'aspect-square';
                objectFit = 'cover';
              }

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: i * 0.15 }}
                  className="relative group cursor-pointer"
                >
                  <Link to={`/project/${project.slug}`} className="block">
                    <div className={`relative overflow-hidden rounded-3xl ${aspectClass} ring-1 ring-white/10 group-hover:ring-blue-500/50 transition-all duration-500 shadow-2xl group-hover:shadow-blue-500/20 group-hover:shadow-2xl`}>
                      {isVideoUrl(project.thumbnail) ? (
                        <motion.div
                          className="w-full h-full overflow-hidden rounded-3xl"
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
                            objectFit={objectFit}
                            className="w-full h-full"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          className="w-full h-full overflow-hidden rounded-3xl"
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
                            objectFit={objectFit}
                            className="w-full h-full"
                          />
                        </motion.div>
                      )}

                      {/* Overlay Info */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90 flex flex-col justify-end p-8 md:p-12 rounded-3xl"
                      >
                        <motion.p
                          initial={{ y: 10, opacity: 0 }}
                          whileHover={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.4 }}
                          className="font-display text-blue-400 text-xs tracking-widest uppercase mb-3"
                        >
                          0{i + 1} / {project.category}
                        </motion.p>
                        <motion.h4
                          initial={{ y: 10, opacity: 0 }}
                          whileHover={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.15, duration: 0.4 }}
                          className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-8"
                        >
                          {project.title}
                        </motion.h4>
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          whileHover={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.4 }}
                          className="flex flex-wrap gap-3 md:gap-4"
                        >
                          {Array.isArray(project.technologies)
                            ? project.technologies.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] font-display uppercase tracking-widest border border-blue-400/40 hover:border-blue-400 px-3 py-1 md:px-4 md:py-2 rounded-full backdrop-blur-sm hover:bg-blue-500/10 transition-all duration-300"
                                >
                                  {t}
                                </span>
                              ))
                            : []}
                        </motion.div>
                      </motion.div>

                      {/* Animated Project Index */}
                      <motion.div
                        className="absolute top-6 left-6 md:top-8 md:left-8 z-20"
                        whileHover={{ scale: 1.2 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="font-display text-3xl md:text-5xl font-black text-blue-500/40 group-hover:text-blue-500/70 transition-colors duration-500">
                          0{i + 1}
                        </span>
                      </motion.div>
                    </div>
                  </Link>
                  {/* Like Button */}
                  <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20">
                    <LikeButton
                      contentId={project.id}
                      contentType="project"
                      initialLiked={project.is_liked}
                      initialLikesCount={project.likes_count}
                    />
                  </div>
                </motion.div>
              );
            })}
            
            {projectsError && featuredWorks.length === 0 && (
              <ErrorDisplay 
                error={projectsError} 
                onRetry={() => window.location.reload()}
              />
            )}
            
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
