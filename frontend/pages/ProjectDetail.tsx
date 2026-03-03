import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { useProject, useProjects } from '../hooks/useData';
import { ProjectDetailSkeleton, ErrorDisplay, Spinner } from '../components/Loading';
import { OptimizedImage } from '../components/OptimizedImage';
import { ImageCarousel } from '../components/ImageCarousel';

const ProjectDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // Fetch current project
  const { data: project, loading, error, refetch } = useProject(slug);
  
  // Fetch all projects for navigation
  const { data: allProjectsData } = useProjects();
  const allProjects = allProjectsData?.results || [];
  
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Loading state
  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <ErrorDisplay 
          error={error} 
          onRetry={refetch}
        />
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-2xl font-display font-bold mb-4">Project Not Found</h2>
        <p className="text-gray-400 mb-8">The project you're looking for doesn't exist.</p>
        <Link 
          to="/work" 
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          Back to Works
        </Link>
      </div>
    );
  }

  // Find next project
  const currentIndex = allProjects.findIndex(p => p.slug === slug);
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length] || project;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#0a0a0a] relative"
    >
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <motion.div style={{ opacity, scale }} className="absolute inset-0">
          <OptimizedImage
            src={project.thumbnail}
            alt={project.title}
            width={1920}
            height={1080}
            lazy={false}
            placeholder={false}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-transparent" />
        </motion.div>

        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-24 pb-24">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-4xl"
          >
             <div className="flex items-center gap-4 mb-4">
               <p className="text-blue-500 font-display text-sm tracking-[0.4em] uppercase">
                 {project.category}
               </p>
               {project.featured && (
                 <span className="text-blue-500 font-display text-sm tracking-[0.4em] uppercase bg-blue-500/10 px-4 py-1 rounded">
                   Featured
                 </span>
               )}
             </div>
            <h1 className="text-6xl md:text-9xl font-display font-bold uppercase mb-8 leading-none">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-4">
               {project.technologies?.map(tech => (
                 <span key={tech} className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-display uppercase tracking-widest">
                   {tech}
                 </span>
               ))}
            </div>
          </motion.div>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="absolute top-12 left-12 p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all z-20"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      </section>

      {/* Content Section */}
      <section className="py-24 px-8 md:px-24">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Project Information */}
          <div className="w-full lg:w-1/3 space-y-16">
            <div>
              <h3 className="text-xs font-display text-gray-500 uppercase tracking-widest mb-6">Brief</h3>
              <p className="text-xl text-gray-300 leading-loose italic">
                "{project.description}"
              </p>
            </div>
            <div className="pt-8 border-t border-gray-800">
               <p className="text-xs font-display text-gray-500 uppercase tracking-widest mb-2">Date</p>
               <p className="text-gray-300">
                 {new Date(project.created_at).toLocaleDateString('en-US', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric'
                 })}
               </p>
             </div>

              {project.is_active && project.show_registration && (
                <div>
                  <Link
                    to="/auth"
                    state={{ from: `/project/${project.slug}` }}
                    className="inline-block px-8 py-3 bg-blue-500 text-white font-display text-xs uppercase tracking-widest hover:bg-blue-600 transition-all"
                  >
                    Inscription
                  </Link>
                </div>
              )}
          </div>
          
          {/* Media Carousel */}
          <div className="w-full lg:w-2/3">
              {project.media && project.media.length > 0 ? (
                // All media types are displayed in the carousel
                <ImageCarousel media={project.media} projectTitle={project.title} />
              ) : (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No additional media</p>
                </div>
              )}
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <section className="py-32 border-t border-gray-900 text-center">
        <p className="text-gray-500 font-display text-xs uppercase tracking-widest mb-4">Next Project</p>
        {nextProject && (
          <Link 
            to={`/project/${nextProject.slug}`}
            className="group inline-flex items-center gap-4"
          >
            <h2 className="text-4xl md:text-6xl font-display font-bold uppercase group-hover:text-blue-500 transition-colors">
              {nextProject.title}
            </h2>
            <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
          </Link>
        )}
      </section>
    </motion.div>
  );
};

export default ProjectDetail;
