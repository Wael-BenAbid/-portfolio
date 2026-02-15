
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Code, Globe2, Award, Heart, Mail, Phone, MapPin, Linkedin, Github, ExternalLink } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

interface CVData {
  personal_info: {
    full_name: string;
    job_title: string;
    email: string;
    phone: string;
    location: string;
    profile_image: string;
    summary: string;
    linkedin: string;
    github: string;
  };
  experiences: Array<{
    id: number;
    title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string;
  }>;
  education: Array<{
    id: number;
    degree: string;
    institution: string;
    location: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string;
    gpa: string;
  }>;
  skills: Array<{
    id: number;
    name: string;
    level: string;
    category: string;
    percentage: number;
  }>;
  languages: Array<{
    id: number;
    name: string;
    level: string;
  }>;
  certifications: Array<{
    id: number;
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date: string | null;
    credential_id: string;
    credential_url: string;
  }>;
  projects: Array<{
    id: number;
    title: string;
    description: string;
    technologies: string;
    url: string;
    github_url: string;
    is_ongoing: boolean;
  }>;
  interests: Array<{
    id: number;
    name: string;
    icon: string;
    description: string;
  }>;
}

const About: React.FC = () => {
  const [cvData, setCVData] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('experience');

  useEffect(() => {
    fetchCVData();
  }, []);

  const fetchCVData = async () => {
    try {
      const response = await fetch(`${API_URL}/cv/`);
      if (response.ok) {
        const data = await response.json();
        setCVData(data);
      }
    } catch (error) {
      console.error('Error fetching CV data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-500 font-display uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-500 font-display uppercase tracking-widest">No CV data available</p>
      </div>
    );
  }

  const { personal_info, experiences, education, skills, languages, certifications, projects, interests } = cvData;

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const cat = skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

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
                    {exp.location} • {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : (exp.end_date && formatDate(exp.end_date))}
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
                <div className="absolute left-[-9px] top-0 w-4 h-4 bg-green-500 rounded-full" />
                <div className="mb-2">
                  <h3 className="text-xl font-display font-bold uppercase">{edu.degree}</h3>
                  <p className="text-green-500 font-display">{edu.institution}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {edu.location} • {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : (edu.end_date && formatDate(edu.end_date))}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </p>
                </div>
                {edu.description && <p className="text-sm text-gray-400 mt-4">{edu.description}</p>}
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
            <div className="grid md:grid-cols-2 gap-12">
              {Object.entries(skillsByCategory).map(([category, categorySkills], catIdx) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.1 }}
                >
                  <h3 className="text-sm font-display uppercase tracking-widest text-gray-500 mb-6 capitalize">{category}</h3>
                  <div className="space-y-4">
                    {categorySkills.map((skill, idx) => (
                      <div key={skill.id}>
                        <div className="flex justify-between text-xs font-display uppercase tracking-widest mb-2">
                          <span>{skill.name}</span>
                          <span className="text-gray-500">{skill.percentage}%</span>
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="h-full bg-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
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
            <div className="grid md:grid-cols-3 gap-6">
              {languages.map((lang, idx) => (
                <motion.div
                  key={lang.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-[#111] border border-gray-800 rounded-lg hover:border-blue-500/50 transition-colors"
                >
                  <Globe2 size={24} className="text-blue-500 mb-4" />
                  <h3 className="font-display font-bold uppercase">{lang.name}</h3>
                  <p className="text-xs text-gray-500 uppercase mt-1">{lang.level}</p>
                </motion.div>
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
            {certifications.map((cert, idx) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 bg-[#111] border border-gray-800 rounded-lg hover:border-blue-500/50 transition-colors flex justify-between items-start"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <Award size={20} className="text-yellow-500" />
                    <h3 className="font-display font-bold uppercase">{cert.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{cert.issuer}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Issued: {formatDate(cert.issue_date)}
                    {cert.expiry_date && ` • Expires: ${formatDate(cert.expiry_date)}`}
                  </p>
                  {cert.credential_id && (
                    <p className="text-xs text-gray-600 mt-1">Credential ID: {cert.credential_id}</p>
                  )}
                </div>
                {cert.credential_url && (
                  <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400">
                    <ExternalLink size={18} />
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Projects Section */}
        {activeSection === 'projects' && projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((proj, idx) => (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-[#111] border border-gray-800 rounded-lg hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-display font-bold uppercase">{proj.title}</h3>
                    {proj.is_ongoing && (
                      <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded uppercase">Ongoing</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{proj.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {proj.technologies.split(',').map((tech, i) => (
                      <span key={i} className="text-[10px] bg-gray-800 px-2 py-1 rounded uppercase">{tech.trim()}</span>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                        <ExternalLink size={12} /> Live Demo
                      </a>
                    )}
                    {proj.github_url && (
                      <a href={proj.github_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                        <Github size={12} /> GitHub
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Interests Section */}
        {activeSection === 'interests' && interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em] mb-8">Interests & Hobbies</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {interests.map((int, idx) => (
                <motion.div
                  key={int.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-[#111] border border-gray-800 rounded-lg hover:border-blue-500/50 transition-colors text-center"
                >
                  {int.icon && <span className="text-4xl mb-4 block">{int.icon}</span>}
                  <h3 className="font-display font-bold uppercase">{int.name}</h3>
                  {int.description && <p className="text-xs text-gray-500 mt-2">{int.description}</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default About;
