import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Instagram, Linkedin, Github, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useSettings } from '../hooks/useData';

const Contact: React.FC = () => {
  const { data: settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/content/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Something went wrong' }));
        setSubmitError(errorData.error || errorData.detail || 'Failed to send message');
      }
    } catch (error) {
      setSubmitError('Network error. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) {
    return null;
  }

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
            {settings.contact_title}
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-md">
            {settings.contact_subtitle}
          </p>
          
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-full bg-gray-900 text-blue-500">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-display uppercase tracking-widest text-gray-500">Localisation</p>
                <p className="text-xl font-display">{settings.location}</p>
                <p className="text-[10px] font-display text-gray-600 mt-1 uppercase tracking-widest">
                  LAT: {settings.latitude} / LNG: {settings.longitude}
                </p>
              </div>
            </div>

            <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-6 group">
              <div className="p-4 rounded-full bg-gray-900 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-[10px] font-display uppercase tracking-widest text-gray-500">Me Contacter</p>
                <p className="text-xl font-display group-hover:text-blue-500 transition-colors">{settings.contact_email}</p>
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

        <form onSubmit={handleSubmit} className="space-y-12">
          {submitSuccess && (
            <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500 text-sm">
              Message sent successfully!
            </div>
          )}
          {submitError && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
              {submitError}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-[10px] font-display uppercase tracking-widest text-gray-500">Nom Complet</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-gray-800 py-4 focus:border-blue-500 outline-none font-display text-xl transition-colors"
              placeholder={settings.contact_form_placeholder_name}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-display uppercase tracking-widest text-gray-500">Adresse Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-gray-800 py-4 focus:border-blue-500 outline-none font-display text-xl transition-colors"
              placeholder={settings.contact_form_placeholder_email}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-display uppercase tracking-widest text-gray-500">Sujet</label>
            <input 
              type="text" 
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-gray-800 py-4 focus:border-blue-500 outline-none font-display text-xl transition-colors"
              placeholder={settings.contact_form_placeholder_subject}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-display uppercase tracking-widest text-gray-500">Message</label>
            <textarea 
              rows={4}
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-gray-800 py-4 focus:border-blue-500 outline-none font-display text-xl transition-colors resize-none"
              placeholder={settings.contact_form_placeholder_message}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-12 py-5 bg-white text-black font-display text-xs tracking-[0.3em] uppercase hover:bg-blue-500 hover:text-white transition-all w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Envoi en cours...' : settings.contact_form_button_text}
          </button>
        </form>
      </div>

      <footer className="pt-24 flex justify-between items-center text-[10px] font-display uppercase tracking-[0.4em] text-gray-600">
        <p>© 2024 WAEL. TOUS DROITS RÉSERVÉS.</p>
        <p>COORDONNÉES: {settings.latitude}, {settings.longitude}</p>
      </footer>
    </motion.div>
  );
};

export default Contact;
