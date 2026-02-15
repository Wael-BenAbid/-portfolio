
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { INITIAL_PROJECTS, STORAGE_KEYS } from '../constants';
import { Category, Project } from '../types';

const Work: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const categories: (Category | 'All')[] = ['All', 'Development', 'Drone', 'Mixed'];

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (saved) {
      setProjects(JSON.parse(saved));
    } else {
      setProjects(INITIAL_PROJECTS);
    }
  }, []);

  const filteredProjects = projects.filter(p => filter === 'All' || p.category === filter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-40 px-8 md:px-24 pb-24"
    >
      <header className="mb-24">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-display font-bold uppercase mb-12"
        >
          Selected <br /> Works
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link to={`/project/${project.slug}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-900 mb-6 rounded-sm">
                  <img 
                    src={project.thumbnail} 
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/10 transition-colors duration-500" />
                  
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="px-3 py-1 border border-white/50 rounded-full text-[10px] uppercase font-display backdrop-blur-md">
                      Explorar
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
                    {new Date(project.createdAt).getFullYear()}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-gray-500 font-display uppercase tracking-widest">No projects found in this category.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Work;
