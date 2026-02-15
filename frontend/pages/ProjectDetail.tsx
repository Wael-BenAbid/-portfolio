
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PROJECTS } from '../constants';

const ProjectDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const project = PROJECTS.find(p => p.slug === slug);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Project not found.</p>
        <Link to="/work">Go back</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#0a0a0a]"
    >
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <motion.div style={{ opacity, scale }} className="absolute inset-0">
          <img 
            src={project.thumbnail} 
            alt={project.title} 
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
            <p className="text-blue-500 font-display text-sm tracking-[0.4em] uppercase mb-4">
              {project.category}
            </p>
            <h1 className="text-6xl md:text-9xl font-display font-bold uppercase mb-8 leading-none">
              {project.title}
            </h1>
            <div className="flex gap-4">
              {project.technologies.map(tech => (
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
        >
          <ArrowLeft size={20} />
        </button>
      </section>

      {/* Content Section */}
      <section className="py-32 px-8 md:px-24">
        <div className="grid md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
            <h3 className="text-xs font-display text-gray-500 uppercase tracking-widest mb-6">Brief</h3>
            <p className="text-xl text-gray-300 leading-relaxed italic">
              "{project.description}"
            </p>
          </div>
          <div className="md:col-span-8 flex flex-col gap-24">
            {project.media.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative overflow-hidden group"
              >
                {item.type === 'image' ? (
                  <img src={item.url} alt={`Media ${idx}`} className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-1000" />
                ) : (
                  <video 
                    src={item.url} 
                    autoPlay 
                    muted 
                    loop 
                    className="w-full h-auto"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <section className="py-32 border-t border-gray-900 text-center">
        <p className="text-gray-500 font-display text-xs uppercase tracking-widest mb-4">Next Project</p>
        <Link 
          to={`/project/${PROJECTS[(PROJECTS.indexOf(project) + 1) % PROJECTS.length].slug}`}
          className="text-4xl md:text-6xl font-display font-bold uppercase hover:text-blue-500 transition-colors"
        >
          {PROJECTS[(PROJECTS.indexOf(project) + 1) % PROJECTS.length].title}
        </Link>
      </section>
    </motion.div>
  );
};

export default ProjectDetail;
