import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Code, Globe2, Award, Heart, Mail, Phone, MapPin, Linkedin, Github, ExternalLink, AlertCircle } from 'lucide-react';
import { useCV } from '../hooks/useData';
import { AboutSkeleton, ErrorDisplay } from '../components/Loading';

const About: React.FC = () => {
  const { data: cvData, loading, error, refetch } = useCV();
  const [activeSection, setActiveSection] = useState('experience');

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
      <div className="min-h-screen bg-[#0a0a0a] pt-40 px-8 md:px-24">
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
          href="/admin/settings" 
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
      className="min-h-screen bg-[#0a0a0a] pt-24 pb-24"
    >
      {/* Header / Personal Info */}
      <div className="px-8 md:px-24 mb-16">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Profile Image */}
          {personal_info.profile_image && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-48 h-48 rounded-full overflow-hidden bg-gray-900 flex-shrink-0 border-4 border-blue-500/20"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase mb-4">
              {personal_info.full_name || 'Your Name'}
            </h1>
            <p className="text-2xl text-blue-500 font-display uppercase tracking-widest mb-6">
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

      {/* Section Navigation */}
      <div className="px-8 md:px-24 mb-12">
        <div className="flex flex-wrap gap-4 border-b border-gray-800 pb-4">
          {[
            { id: 'experience', label: 'Experience', icon: Briefcase, count: experiences.length },
            { id: 'education', label: 'Education', icon: GraduationCap, count: education.length },
            { id: 'skills', label: 'Skills', icon: Code, count: skills.length },
            { id: 'languages', label: 'Languages', icon: Globe2, count: languages.length },
            { id: 'certifications', label: 'Certifications', icon: Award, count: certifications.length },
            { id: 'projects', label: 'Projects', icon: Code, count: projects.length },
            { id: 'interests', label: 'Interests', icon: Heart, count: interests.length },
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 font-display text-xs uppercase tracking-widest transition-colors ${
                activeSection === section.id 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <section.icon size={14} />
              {section.label}
              <span className="bg-gray-800 px-2 py-0.5 rounded text-[10px]">{section.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-8 md:px-24">
        {/* Experience Section */}
        {activeSection === 'experience' && experiences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Work Experience</h2>
            {experiences.map((exp, idx) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
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
          </motion.div>
        )}

        {/* Education Section */}
        {activeSection === 'education' && education.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Education</h2>
            {education.map((edu, idx) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
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
          </motion.div>
        )}

        {/* Skills Section */}
        {activeSection === 'skills' && skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Skills</h2>
            <div className="grid gap-8">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                  <h3 className="text-sm font-display text-gray-500 uppercase tracking-widest mb-4">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(categorySkills as typeof skills).map((skill) => (
                      <div key={skill.id} className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-display text-sm">{skill.name}</span>
                          <span className="text-xs text-gray-500">{skill.percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.percentage}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Languages Section */}
        {activeSection === 'languages' && languages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Languages</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {languages.map((lang) => (
                <div key={lang.id} className="bg-gray-900/50 p-6 rounded-lg text-center">
                  <Globe2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <h4 className="font-display font-bold uppercase">{lang.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{lang.level}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Certifications Section */}
        {activeSection === 'certifications' && certifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Certifications</h2>
            {certifications.map((cert) => (
              <div key={cert.id} className="bg-gray-900/50 p-6 rounded-lg flex items-start gap-4">
                <Award className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-display font-bold uppercase">{cert.name}</h4>
                  <p className="text-sm text-gray-400">{cert.issuer}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Issued: {formatDate(cert.issue_date)}
                    {cert.expiry_date && ` | Expires: ${formatDate(cert.expiry_date)}`}
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
              </div>
            ))}
          </motion.div>
        )}

        {/* Projects Section */}
        {activeSection === 'projects' && projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Projects</h2>
            {projects.map((project) => (
              <div key={project.id} className="bg-gray-900/50 p-6 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-display font-bold uppercase">{project.title}</h4>
                  {project.is_ongoing && (
                    <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded">Ongoing</span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-4">{project.description}</p>
                <p className="text-xs text-gray-500 mb-4">Technologies: {project.technologies}</p>
                <div className="flex gap-4">
                  {project.url && (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                    >
                      Live Demo <ExternalLink size={12} />
                    </a>
                  )}
                  {project.github_url && (
                    <a 
                      href={project.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                    >
                      <Github size={12} /> Source Code
                    </a>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Interests Section */}
        {activeSection === 'interests' && interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Interests</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {interests.map((interest) => (
                <div key={interest.id} className="bg-gray-900/50 p-6 rounded-lg text-center">
                  <div className="text-3xl mb-2">{interest.icon}</div>
                  <h4 className="font-display font-bold uppercase">{interest.name}</h4>
                  {interest.description && (
                    <p className="text-xs text-gray-500 mt-2">{interest.description}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state for active section */}
        {['experience', 'education', 'skills', 'languages', 'certifications', 'projects', 'interests'].includes(activeSection) && 
          ((activeSection === 'experience' && experiences.length === 0) ||
           (activeSection === 'education' && education.length === 0) ||
           (activeSection === 'skills' && skills.length === 0) ||
           (activeSection === 'languages' && languages.length === 0) ||
           (activeSection === 'certifications' && certifications.length === 0) ||
           (activeSection === 'projects' && projects.length === 0) ||
           (activeSection === 'interests' && interests.length === 0)) && (
          <div className="py-16 text-center">
            <p className="text-gray-500 font-display uppercase tracking-widest">No data available for this section.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default About;
