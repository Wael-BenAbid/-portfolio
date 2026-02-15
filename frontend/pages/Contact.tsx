
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Instagram, Linkedin, Github, MapPin } from 'lucide-react';
import { STORAGE_KEYS, INITIAL_ABOUT } from '../constants';
import { AboutData } from '../types';

const Contact: React.FC = () => {
  const [about, setAbout] = useState<AboutData>(INITIAL_ABOUT);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ABOUT);
    if (saved) setAbout(JSON.parse(saved));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-40 px-8 md:px-24 flex flex-col justify-between pb-24"
    >
      <div className="grid lg:grid-cols-2 gap-24">
        <div>
          <h1 className="text-6xl md:text-8xl font-display font-bold uppercase mb-12 leading-tight">
            Let's <br /> Create
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-md">
            Whether you need a full-stack engineer or a drone cinematographer, I'm ready for the next challenge.
          </p>
          
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-full bg-gray-900 text-blue-500">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-display uppercase tracking-widest text-gray-500">Location</p>
                <p className="text-xl font-display">{about.location}</p>
                <p className="text-[10px] font-display text-gray-600 mt-1 uppercase tracking-widest">
                  LAT: {about.coordinates.lat} / LNG: {about.coordinates.lng}
                </p>
              </div>
            </div>

            <a href={`mailto:${about.email}`} className="flex items-center gap-6 group">
              <div className="p-4 rounded-full bg-gray-900 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email Me</p>
                <p className="text-xl font-display group-hover:text-blue-500 transition-colors">{about.email}</p>
              </div>
            </a>
            
            <div className="flex gap-4">
              {[Instagram, Linkedin, Github].map((Icon, idx) => (
                <a 
                  key={idx} 
                  href="#" 
                  className="p-4 rounded-full bg-gray-900 hover:bg-blue-500 hover:text-white transition-colors"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <form className="space-y-12">
          <div className="space-y-2">
            <label className="block text-[10px] font-display uppercase tracking-widest text-gray-500">Full Name</label>
            <input 
              type="text" 
              className="w-full bg-transparent border-b border-gray-800 py-4 focus:border-blue-500 outline-none font-display text-xl transition-colors"
              placeholder="Your Name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-display uppercase tracking-widest text-gray-500">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-transparent border-b border-gray-800 py-4 focus:border-blue-500 outline-none font-display text-xl transition-colors"
              placeholder="name@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-display uppercase tracking-widest text-gray-500">Message</label>
            <textarea 
              rows={4}
              className="w-full bg-transparent border-b border-gray-800 py-4 focus:border-blue-500 outline-none font-display text-xl transition-colors resize-none"
              placeholder="Tell me about your vision..."
            />
          </div>
          <button className="px-12 py-5 bg-white text-black font-display text-xs tracking-[0.3em] uppercase hover:bg-blue-500 hover:text-white transition-all w-full md:w-auto">
            Send Message
          </button>
        </form>
      </div>

      <footer className="pt-24 flex justify-between items-center text-[10px] font-display uppercase tracking-[0.4em] text-gray-600">
        <p>© 2024 ADRIAN. ALL RIGHTS RESERVED.</p>
        <p>COORDINATES: {about.coordinates.lat}, {about.coordinates.lng}</p>
      </footer>
    </motion.div>
  );
};

export default Contact;
