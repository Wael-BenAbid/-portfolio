import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '../components/OptimizedImage';
import { OptimizedVideo } from '../components/OptimizedVideo';
import { Link } from 'react-router-dom';
import { Category, Project } from '../types';
import { useProjects } from '../hooks/useData';
import { 
  ProjectsGridSkeleton, 
  ErrorDisplay,
  PageLoading 
} from '../components/Loading';
import { APIError } from '../services/api';
import { isVideoUrl } from '../constants';

const Work: React.FC = () => {
  const { data, loading, error, refetch } = useProjects();
  const [filter, setFilter] = useState<Category | 'Tous'>('Tous');
  const categories: (Category | 'Tous')[] = ['Tous', 'Développement', 'Drone', 'Mélangé'];

  // Get projects from API response or empty array
  const projects: Project[] = data?.results || [];
  
  const filteredProjects = projects.filter(p => 
    (p.is_active !== false) && (filter === 'Tous' || p.category === filter)
  );

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-24 md:pt-40 px-4 sm:px-8 md:px-24 pb-24"
      >
        <header className="mb-12 md:mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl font-display font-bold uppercase mb-8 md:mb-12"
          >
            Projets <br /> Sélectionnés
          </motion.h1>

          <div className="flex flex-wrap gap-4 sm:gap-8 border-b border-gray-800 pb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                disabled
                className="font-display text-xs tracking-widest uppercase text-gray-500"
              >
                {cat}
              </button>
            ))}
          </div>
        </header>
        <ProjectsGridSkeleton count={6} />
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-24 md:pt-40 px-4 sm:px-8 md:px-24 pb-24"
      >
        <header className="mb-12 md:mb-24">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-bold uppercase mb-8 md:mb-12">
              Projets <br /> Sélectionnés
            </h1>
         </header>
         <ErrorDisplay error={error} onRetry={refetch} />
       </motion.div>
     );
   }

   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="min-h-screen pt-24 md:pt-40 px-4 sm:px-8 md:px-24 pb-24"
     >
       <header className="mb-12 md:mb-24">
         <motion.h1 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-4xl sm:text-6xl md:text-8xl font-display font-bold uppercase mb-8 md:mb-12"
         >
           Projets <br /> Sélectionnés
         </motion.h1>

        <div className="flex flex-wrap gap-8 border-b border-gray-800 pb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`font-display text-xs tracking-widest uppercase transition-colors ${
                filter === cat ? 'text-blue-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-12 space-y-12">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className="group break-inside-avoid mb-12"
            >
               <Link to={`/project/${project.slug}`} className="block">
                  <div className="relative bg-gray-900 mb-6 rounded-sm">
                    {/* Affichage conditionnel selon le type de média */}
                    {/* Check if thumbnail is a video file */}
                    {isVideoUrl(project.thumbnail) ? (
                      <OptimizedVideo
                        src={project.thumbnail}
                        alt={project.title}
                        lazy={true}
                        grayscale={true}
                        hoverEffects={true}
                        objectFit="contain"
                        className="w-full h-auto"
                      />
                    ) : (
                      <OptimizedImage
                        src={project.thumbnail}
                        alt={project.title}
                        lazy={true}
                        grayscale={true}
                        hoverEffects={true}
                        objectFit="contain"
                        className="w-full h-auto"
                      />
                    )}
                   <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/10 transition-colors duration-500" />
                   
                    {project.featured && (
                      <div className="absolute top-6 left-6 bg-blue-500 text-white text-[10px] uppercase font-display px-3 py-1 rounded-full">
                        En vedette
                      </div>
                    )}
                    
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="px-3 py-1 border border-white/50 rounded-full text-[10px] uppercase font-display backdrop-blur-md">
                        Explorer
                      </span>
                    </div>
                 </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-display text-blue-500 uppercase tracking-widest mb-1">
                      {project.category}
                    </p>
                    <h3 className="text-xl font-display font-bold uppercase group-hover:text-blue-500 transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  <span className="text-gray-500 font-display text-xs">
                    {new Date(project.created_at).getFullYear()}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-gray-500 font-display uppercase tracking-widest">Aucun projet trouvé dans cette catégorie.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Work;
