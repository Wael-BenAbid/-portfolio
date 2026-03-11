
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Save, LayoutDashboard, Globe, Key, Mail, Users, MapPin, Image, Upload, Loader2, Plus, Trash2, Edit2, X, User, Sparkles, Type } from 'lucide-react';
import { useAuth } from '../../App';
import { API_BASE_URL } from '../../constants';
import { authFetch } from '../../services/api';

const API_URL = API_BASE_URL;

interface SiteSettings {
  id?: number;
  site_name: string;
  site_title: string;
  logo_url: string;
  favicon_url: string;
  site_description: string;
  // Theme Settings
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  cursor_theme?: string;
  cursor_size?: number;
  custom_cursor_color?: string;
  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_tagline: string;
  // About Section
  about_title?: string;
  about_quote?: string;
  profile_image?: string;
  drone_image?: string;
  drone_video_url?: string;
  // Footer
  footer_background_video?: string;
  // Navigation
  nav_work_label?: string;
  nav_about_label?: string;
  nav_contact_label?: string;
  // Location
  location: string;
  latitude: number;
  longitude: number;
  // Social Media
  instagram_url: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  // OAuth
  google_client_id: string;
  google_client_secret: string;
  facebook_app_id: string;
  facebook_app_secret: string;
  // Email
  email_host: string;
  email_port: number;
  email_host_user: string;
  email_host_password: string;
  default_from_email: string;
   // Contact
  contact_email: string;
  contact_phone: string;
  contact_title: string;
  contact_subtitle: string;
  contact_form_placeholder_name: string;
  contact_form_placeholder_email: string;
  contact_form_placeholder_subject: string;
  contact_form_placeholder_message: string;
  contact_form_button_text: string;
  // Footer
  footer_text: string;
  copyright_year: number;
  version: string;
  designer_name: string;
  copyright_text: string;
  show_location: boolean;
  // SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

interface User {
  id: number;
  email: string;
  user_type: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  bio?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  admin_reply?: string;
  user?: number | null;
  replied_at?: string;
  created_at: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: '',
  site_title: '',
  logo_url: '',
  favicon_url: '',
  site_description: '',
  hero_title: '',
  hero_subtitle: '',
  hero_tagline: '',
  about_title: 'THE MIND BEHIND',
  about_quote: '"Technology is the vessel, but storytelling is the destination. I create digital landmarks that bridge the gap between imagination and reality."',
  profile_image: '',
  drone_image: '',
  drone_video_url: '',
  nav_work_label: 'Work',
  nav_about_label: 'About',
  nav_contact_label: 'Contact',
  location: '',
  latitude: 0,
  longitude: 0,
  instagram_url: '',
  linkedin_url: '',
  github_url: '',
  twitter_url: '',
  google_client_id: '',
  google_client_secret: '',
  facebook_app_id: '',
  facebook_app_secret: '',
  email_host: '',
  email_port: 587,
  email_host_user: '',
  email_host_password: '',
  default_from_email: '',
  contact_email: '',
  contact_phone: '',
  contact_title: 'Créons Ensemble',
  contact_subtitle: 'Que vous ayez besoin d\'un ingénieur full-stack ou d\'un cinéaste drone, je suis prêt pour le prochain défi.',
  contact_form_placeholder_name: 'Votre Nom',
  contact_form_placeholder_email: 'nom@email.com',
  contact_form_placeholder_subject: 'Sujet',
  contact_form_placeholder_message: 'Parlez-moi de votre vision...',
  contact_form_button_text: 'Envoyer le Message',
  footer_text: '',
  copyright_year: new Date().getFullYear(),
  version: '1.0.0',
  designer_name: 'WAEL',
  copyright_text: 'Your Name. All rights reserved.',
  show_location: true,
  footer_background_video: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>([]);
  const [savedStatus, setSavedStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // User Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    new_password: '',
    profile_image: ''
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const { user, token, logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchSettings();
    if (user?.user_type === 'admin') {
      fetchUsers();
      fetchContactMessages();
    }
  }, [token]);

  const fetchContactMessages = async () => {
    try {
      const response = await authFetch(`${API_URL}/settings/contact/messages/`);
      if (response.ok) {
        const data = await response.json();
        setContactMessages(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/`);
      if (response.ok) {
        const data = await response.json();
        // Replace null values with empty strings to avoid React warnings
        // Replace null values with appropriate defaults based on type to avoid React warnings
        const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
          const typedKey = key as keyof SiteSettings;
          
          if (value === null) {
            // Use default value from DEFAULT_SETTINGS for null values
            acc[typedKey] = DEFAULT_SETTINGS[typedKey];
          } else {
            // Type check and sanitize values based on default type
            const defaultValue = DEFAULT_SETTINGS[typedKey];
            if (typeof defaultValue === 'number' && typeof value !== 'number') {
              acc[typedKey] = Number(value) || defaultValue;
            } else if (typeof defaultValue === 'boolean' && typeof value !== 'boolean') {
              acc[typedKey] = Boolean(value);
            } else {
              acc[typedKey] = value;
            }
          }
          
          return acc;
        }, {} as Record<keyof SiteSettings, any>);
        
        // Ensure all required fields are present (fallback to defaults)
        Object.keys(DEFAULT_SETTINGS).forEach(key => {
          const typedKey = key as keyof SiteSettings;
          if (!(typedKey in sanitizedData)) {
            sanitizedData[typedKey] = DEFAULT_SETTINGS[typedKey];
          }
        });
        setSettings(sanitizedData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authFetch(`${API_URL}/auth/admin/users/`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authFetch(`${API_URL}/settings/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setSavedStatus(true);
        setTimeout(() => setSavedStatus(false), 2000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleUpdateUserType = async (userId: number, userType: string) => {
    try {
      const response = await authFetch(`${API_URL}/auth/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_type: userType })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Open user edit modal
  const openEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserData({
      email: u.email,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      bio: u.bio || '',
      new_password: '',
      profile_image: u.profile_image || ''
    });
  };

  // Handle user edit save
  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    
    try {
      const dataToSend: Record<string, string | undefined> = {
        email: editUserData.email,
        first_name: editUserData.first_name || undefined,
        last_name: editUserData.last_name || undefined,
        phone: editUserData.phone || undefined,
        bio: editUserData.bio || undefined,
      };
      
      // Only include profile_image if it has a value
      if (editUserData.profile_image) {
        dataToSend.profile_image = editUserData.profile_image;
      }
      
      // Only include password if it was changed
      if (editUserData.new_password && editUserData.new_password.trim()) {
        dataToSend.new_password = editUserData.new_password;
      }
      
      // Remove undefined values
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === undefined || dataToSend[key] === '') {
          delete dataToSend[key];
        }
      });
      
      const response = await authFetch(`${API_URL}/auth/admin/users/${editingUser.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (response.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        console.error('Update error:', error);
        // Handle validation errors
        const errorMessages = [];
        if (error.email) errorMessages.push(`Email: ${error.email.join(', ')}`);
        if (error.new_password) errorMessages.push(`Password: ${error.new_password.join(', ')}`);
        if (error.non_field_errors) errorMessages.push(error.non_field_errors.join(', '));
        showToast(errorMessages.length > 0 ? errorMessages.join('\n') : (error.error || 'Failed to update user'), 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Failed to update user', 'error');
    }
  };

  // Handle user delete
  const handleDeleteUser = async (userId: number) => {
    if (userId === user?.id) {
      showToast('Cannot delete your own account', 'error');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await authFetch(`${API_URL}/auth/admin/users/${userId}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  // Handle user profile image upload
  const handleUserProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file);
    if (url) {
      setEditUserData({ ...editUserData, profile_image: url });
    }
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!isAuthenticated) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await authFetch(`${API_URL}/settings/upload/`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const errorText = await response.text();
        console.error('Upload error:', errorText);
        try {
          const error = JSON.parse(errorText);
          const errorMessage = error.error?.message || error.error || error.detail || 'Failed to upload image';
          showToast(errorMessage, 'error');
        } catch {
          showToast('Failed to upload image', 'error');
        }
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload image', 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle image upload for settings fields
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof SiteSettings) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    
    setUploadingField(field);
    const url = await uploadImage(file);
    setUploadingField(null);
    
    if (url) {
      setSettings({ ...settings, [field]: url });
    }
    if (logoInputRef.current) logoInputRef.current.value = '';
    if (faviconInputRef.current) faviconInputRef.current.value = '';
    if (profileInputRef.current) profileInputRef.current.value = '';
  };

  // Handle reply to contact message
  const handleReply = async () => {
    if (!selectedMessage) return;
    
    try {
      const response = await authFetch(`${API_URL}/settings/contact/${selectedMessage.id}/reply/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply: replyText })
      });
      
      if (response.ok) {
        setReplyText('');
        setSelectedMessage(null);
        fetchContactMessages();
        showToast('Reply sent successfully', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to send reply', 'error');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast('Failed to send reply', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-500 font-display uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-900 bg-[#111] p-8 flex flex-col">
        <h2 className="font-display font-bold text-lg mb-12 tracking-widest text-blue-500">CONTROL</h2>
        <nav className="space-y-4 flex-1">
          <Link to="/admin" className="flex items-center gap-4 text-gray-500 hover:text-white font-display text-xs uppercase tracking-widest transition-colors">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          
          <button 
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'branding' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Sparkles size={16} /> Branding
          </button>
          
          <button 
            onClick={() => setActiveTab('hero')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'hero' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Type size={16} /> Hero Section
          </button>
          
          <Link to="/admin/cv" className="flex items-center gap-4 text-gray-500 hover:text-white font-display text-xs uppercase tracking-widest transition-colors">
            <User size={16} /> CV Management
          </Link>
          
          <button 
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'location' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <MapPin size={16} /> Location
          </button>
          
          <button 
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'social' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Globe size={16} /> Social Links
          </button>
          
          <button 
            onClick={() => setActiveTab('oauth')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'oauth' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Key size={16} /> OAuth
          </button>
          
          <button 
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'email' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Mail size={16} /> Email Config
          </button>
          
          <button 
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'contact' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Mail size={16} /> Contact Page
          </button>
          
          <button 
            onClick={() => setActiveTab('contact-messages')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'contact-messages' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Mail size={16} /> Contact Messages
          </button>
          
          <button 
            onClick={() => setActiveTab('footer')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'footer' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Image size={16} /> Footer
          </button>
          
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'home' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <LayoutDashboard size={16} /> Config Page Home
          </button>
          
          <button 
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'theme' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Sparkles size={16} /> Theme Settings
          </button>
          
          {user?.user_type === 'admin' && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'users' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Users size={16} /> Users
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-16 overflow-y-auto">
        <header className="flex justify-between items-center mb-16">
           <h1 className="text-4xl font-display font-bold uppercase">
            {activeTab === 'branding' && 'Branding Settings'}
            {activeTab === 'hero' && 'Hero Section'}
            {activeTab === 'location' && 'Location Settings'}
            {activeTab === 'social' && 'Social Media Links'}
            {activeTab === 'oauth' && 'OAuth Configuration'}
            {activeTab === 'email' && 'Email Configuration'}
            {activeTab === 'contact' && 'Contact Page Settings'}
            {activeTab === 'contact-messages' && 'Contact Messages'}
            {activeTab === 'footer' && 'Footer Settings'}
            {activeTab === 'home' && 'Config Page Home'}
            {activeTab === 'theme' && 'Theme Settings'}
            {activeTab === 'users' && 'User Management'}
          </h1>
          {savedStatus && <span className="text-green-500 font-display text-[10px] uppercase tracking-widest">Saved Successfully</span>}
        </header>

         {/* Contact Page Tab */}
        {activeTab === 'contact' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Contact Page Content</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Contact Page Title</label>
                  <input 
                    type="text"
                    value={settings.contact_title}
                    onChange={e => setSettings({...settings, contact_title: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase text-2xl"
                    placeholder="Créons Ensemble"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Contact Page Subtitle</label>
                  <textarea 
                    value={settings.contact_subtitle}
                    onChange={e => setSettings({...settings, contact_subtitle: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24 text-gray-300"
                    placeholder="Que vous ayez besoin d'un ingénieur full-stack ou d'un cinéaste drone, je suis prêt pour le prochain défi."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Form Placeholder - Name</label>
                  <input 
                    type="text"
                    value={settings.contact_form_placeholder_name}
                    onChange={e => setSettings({...settings, contact_form_placeholder_name: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Votre Nom"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Form Placeholder - Email</label>
                  <input 
                    type="email"
                    value={settings.contact_form_placeholder_email}
                    onChange={e => setSettings({...settings, contact_form_placeholder_email: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="nom@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Form Placeholder - Subject</label>
                  <input 
                    type="text"
                    value={settings.contact_form_placeholder_subject}
                    onChange={e => setSettings({...settings, contact_form_placeholder_subject: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Sujet"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Form Placeholder - Message</label>
                  <textarea 
                    value={settings.contact_form_placeholder_message}
                    onChange={e => setSettings({...settings, contact_form_placeholder_message: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24 text-gray-300"
                    placeholder="Parlez-moi de votre vision..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Form Button Text</label>
                  <input 
                    type="text"
                    value={settings.contact_form_button_text}
                    onChange={e => setSettings({...settings, contact_form_button_text: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Envoyer le Message"
                  />
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Site Branding</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Site Title (Navbar Name)</label>
                  <input 
                    type="text"
                    value={settings.site_title}
                    onChange={e => setSettings({...settings, site_title: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase text-2xl"
                    placeholder="WAEL"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Logo URL</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="url"
                      value={settings.logo_url || ''}
                      onChange={e => setSettings({...settings, logo_url: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="https://example.com/logo.png"
                    />
                    <input 
                      type="file"
                      ref={logoInputRef}
                      onChange={(e) => handleImageUpload(e, 'logo_url')}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <button 
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingField === 'logo_url' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                  {settings.logo_url && (
                    <div className="mt-4">
                      <p className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-2">Preview:</p>
                      <img src={settings.logo_url} alt="Logo" className="h-12 object-contain bg-white/10 p-2 rounded" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Favicon URL</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="url"
                      value={settings.favicon_url || ''}
                      onChange={e => setSettings({...settings, favicon_url: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="https://example.com/favicon.ico"
                    />
                    <input 
                      type="file"
                      ref={faviconInputRef}
                      onChange={(e) => handleImageUpload(e, 'favicon_url')}
                      accept="image/jpeg,image/png,image/gif,image/webp,image/x-icon"
                      className="hidden"
                    />
                    <button 
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingField === 'favicon_url' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                  {settings.favicon_url && (
                    <div className="mt-4">
                      <p className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-2">Preview:</p>
                      <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain bg-white/10 p-1 rounded" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Site Name</label>
                  <input 
                    type="text"
                    value={settings.site_name}
                    onChange={e => setSettings({...settings, site_name: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                    placeholder="Portfolio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Site Description</label>
                  <textarea 
                    value={settings.site_description}
                    onChange={e => setSettings({...settings, site_description: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24 text-gray-300"
                    placeholder="A brief description of your site..."
                  />
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Hero Tab */}
        {activeTab === 'hero' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Hero Content</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Hero Title (Main)</label>
                  <input 
                    type="text"
                    value={settings.hero_title}
                    onChange={e => setSettings({...settings, hero_title: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase text-2xl"
                    placeholder="ACTIVE"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Hero Subtitle</label>
                  <input 
                    type="text"
                    value={settings.hero_subtitle}
                    onChange={e => setSettings({...settings, hero_subtitle: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase text-xl"
                    placeholder="THEORY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Hero Tagline</label>
                  <input 
                    type="text"
                    value={settings.hero_tagline}
                    onChange={e => setSettings({...settings, hero_tagline: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Digital Experiences & Aerial Visuals"
                  />
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}





        {/* Location Tab */}
        {activeTab === 'location' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Location Information</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Location Name</label>
                  <input 
                    type="text"
                    value={settings.location}
                    onChange={e => setSettings({...settings, location: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Casablanca, Morocco"
                  />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Latitude</label>
                    <input 
                      type="number"
                      step="0.0001"
                      value={settings.latitude ?? ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setSettings({...settings, latitude: isNaN(val) ? 0 : val});
                      }}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Longitude</label>
                    <input 
                      type="number"
                      step="0.0001"
                      value={settings.longitude ?? ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setSettings({...settings, longitude: isNaN(val) ? 0 : val});
                      }}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    />
                  </div>
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Theme Tab */}
        {activeTab === 'theme' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Theme Colors</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Primary Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color"
                      value={settings.primary_color || '#6366f1'}
                      onChange={e => setSettings({...settings, primary_color: e.target.value})}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={settings.primary_color || '#6366f1'}
                      onChange={e => setSettings({...settings, primary_color: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Secondary Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color"
                      value={settings.secondary_color || '#8b5cf6'}
                      onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={settings.secondary_color || '#8b5cf6'}
                      onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color"
                      value={settings.accent_color || '#ec4899'}
                      onChange={e => setSettings({...settings, accent_color: e.target.value})}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={settings.accent_color || '#ec4899'}
                      onChange={e => setSettings({...settings, accent_color: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="#ec4899"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Background Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color"
                      value={settings.background_color || '#0a0a0a'}
                      onChange={e => setSettings({...settings, background_color: e.target.value})}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={settings.background_color || '#0a0a0a'}
                      onChange={e => setSettings({...settings, background_color: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="#0a0a0a"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Cursor Theme</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Cursor Type</label>
                  <select 
                    value={settings.cursor_theme || 'default'}
                    onChange={e => setSettings({...settings, cursor_theme: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                  >
                    <option value="default">Default</option>
                    <option value="neon">Neon</option>
                    <option value="minimal">Minimal</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Cursor Size</label>
                  <input 
                    type="number"
                    min="10"
                    max="50"
                    value={settings.cursor_size || 20}
                    onChange={e => setSettings({...settings, cursor_size: parseInt(e.target.value)})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="20"
                  />
                </div>
                {settings.cursor_theme === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Custom Cursor Color</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="color"
                        value={settings.custom_cursor_color || '#6366f1'}
                        onChange={e => setSettings({...settings, custom_cursor_color: e.target.value})}
                        className="w-12 h-12 rounded cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={settings.custom_cursor_color || '#6366f1'}
                        onChange={e => setSettings({...settings, custom_cursor_color: e.target.value})}
                        className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Social Media Links</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Instagram</label>
                  <input 
                    type="url"
                    value={settings.instagram_url}
                    onChange={e => setSettings({...settings, instagram_url: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">LinkedIn</label>
                  <input 
                    type="url"
                    value={settings.linkedin_url}
                    onChange={e => setSettings({...settings, linkedin_url: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">GitHub</label>
                  <input 
                    type="url"
                    value={settings.github_url}
                    onChange={e => setSettings({...settings, github_url: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Twitter</label>
                  <input 
                    type="url"
                    value={settings.twitter_url}
                    onChange={e => setSettings({...settings, twitter_url: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* OAuth Tab */}
        {activeTab === 'oauth' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">OAuth Configuration</h3>
              <div className="space-y-6">
                <div className="p-6 bg-[#111] border border-gray-800 rounded-lg">
                  <h4 className="text-sm font-display font-bold uppercase mb-4 text-gray-400">Google OAuth</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Client ID</label>
                      <input 
                        type="text"
                        value={settings.google_client_id}
                        onChange={e => setSettings({...settings, google_client_id: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="your-google-client-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Client Secret</label>
                      <input 
                        type="password"
                        value={settings.google_client_secret}
                        onChange={e => setSettings({...settings, google_client_secret: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="your-google-client-secret"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-[#111] border border-gray-800 rounded-lg">
                  <h4 className="text-sm font-display font-bold uppercase mb-4 text-gray-400">Facebook OAuth</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">App ID</label>
                      <input 
                        type="text"
                        value={settings.facebook_app_id}
                        onChange={e => setSettings({...settings, facebook_app_id: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="your-facebook-app-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">App Secret</label>
                      <input 
                        type="password"
                        value={settings.facebook_app_secret}
                        onChange={e => setSettings({...settings, facebook_app_secret: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="your-facebook-app-secret"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Email Configuration</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email Host</label>
                    <input 
                      type="text"
                      value={settings.email_host}
                      onChange={e => setSettings({...settings, email_host: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email Port</label>
                    <input 
                      type="number"
                      value={settings.email_port}
                      onChange={e => setSettings({...settings, email_port: parseInt(e.target.value)})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email Host User</label>
                  <input 
                    type="email"
                    value={settings.email_host_user}
                    onChange={e => setSettings({...settings, email_host_user: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email Host Password</label>
                  <input 
                    type="password"
                    value={settings.email_host_password}
                    onChange={e => setSettings({...settings, email_host_password: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="your-app-password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Default From Email</label>
                  <input 
                    type="email"
                    value={settings.default_from_email}
                    onChange={e => setSettings({...settings, default_from_email: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="noreply@yourdomain.com"
                  />
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Footer Tab */}
        {activeTab === 'footer' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Footer Settings</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Footer Text</label>
                  <input 
                    type="text"
                    value={settings.footer_text}
                    onChange={e => setSettings({...settings, footer_text: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="DESIGNED BY WAEL"
                  />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Copyright Year</label>
                    <input 
                      type="number"
                      value={settings.copyright_year}
                      onChange={e => setSettings({...settings, copyright_year: parseInt(e.target.value)})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Version</label>
                    <input 
                      type="text"
                      value={settings.version}
                      onChange={e => setSettings({...settings, version: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">SEO Settings</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Meta Title</label>
                  <input 
                    type="text"
                    value={settings.meta_title}
                    onChange={e => setSettings({...settings, meta_title: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Your Site Title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Meta Description</label>
                  <textarea 
                    value={settings.meta_description}
                    onChange={e => setSettings({...settings, meta_description: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24"
                    placeholder="A brief description of your site for search engines..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Meta Keywords</label>
                  <input 
                    type="text"
                    value={settings.meta_keywords}
                    onChange={e => setSettings({...settings, meta_keywords: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Config Page Home Tab */}
        {activeTab === 'home' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            {/* Navigation Bar Section */}
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Navigation Bar</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Work Label</label>
                  <input
                    type="text"
                    value={settings.nav_work_label || 'Work'}
                    onChange={e => setSettings({...settings, nav_work_label: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Work"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Label for the Work navigation link</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">About Label</label>
                  <input
                    type="text"
                    value={settings.nav_about_label || 'About'}
                    onChange={e => setSettings({...settings, nav_about_label: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="About"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Label for the About navigation link</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Contact Label</label>
                  <input
                    type="text"
                    value={settings.nav_contact_label || 'Contact'}
                    onChange={e => setSettings({...settings, nav_contact_label: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Contact"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Label for the Contact navigation link</p>
                </div>
              </div>
            </section>

            {/* About Section */}
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">About Section</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">About Title</label>
                  <input
                    type="text"
                    value={settings.about_title || 'THE MIND BEHIND'}
                    onChange={e => setSettings({...settings, about_title: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                    placeholder="THE MIND BEHIND"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Title displayed above the about quote</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">About Quote</label>
                  <textarea
                    value={settings.about_quote || ''}
                    onChange={e => setSettings({...settings, about_quote: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-32 text-gray-300"
                    placeholder='"Technology is the vessel, but storytelling is the destination..."'
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Quote displayed in the about section</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Profile Image URL</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={settings.profile_image || ''}
                      onChange={e => setSettings({...settings, profile_image: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="https://example.com/profile.jpg"
                    />
                    <input
                      type="file"
                      ref={profileInputRef}
                      onChange={(e) => handleImageUpload(e, 'profile_image')}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => profileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingField === 'profile_image' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                  {settings.profile_image && (
                    <div className="mt-4">
                      <p className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-2">Preview:</p>
                      <img src={settings.profile_image} alt="Profile" className="w-32 h-32 object-cover rounded-lg" />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-600 mt-1">Profile image displayed in the about section</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Drone/Work Image URL</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={settings.drone_image || ''}
                      onChange={e => setSettings({...settings, drone_image: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="https://example.com/drone.jpg"
                    />
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={(e) => handleImageUpload(e, 'drone_image')}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingField === 'drone_image' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                  {settings.drone_image && (
                    <div className="mt-4">
                      <p className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-2">Preview:</p>
                      <img src={settings.drone_image} alt="Drone" className="w-full h-48 object-cover rounded-lg" />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-600 mt-1">Work/drone image displayed in the about section</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Drone/Work Video URL</label>
                  <input
                    type="url"
                    value={settings.drone_video_url || ''}
                    onChange={e => setSettings({...settings, drone_video_url: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="https://example.com/drone-video.mp4"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Video URL for the about section (will replace the image if provided)</p>
                </div>

              </div>
            </section>

            {/* Footer Section */}
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Footer Configuration</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Designer Name</label>
                  <input
                    type="text"
                    value={settings.designer_name || ''}
                    onChange={e => setSettings({...settings, designer_name: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="WAEL"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Displayed as "DESIGNED BY [Name]" in the footer</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Copyright Text</label>
                  <input
                    type="text"
                    value={settings.copyright_text || ''}
                    onChange={e => setSettings({...settings, copyright_text: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="Your Name. All rights reserved."
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Displayed as "© [Year] [Copyright Text]" in the footer</p>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Show Location</label>
                  <button
                    type="button"
                    onClick={() => setSettings({...settings, show_location: !settings.show_location})}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.show_location ? 'bg-blue-500' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.show_location ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-xs text-gray-400">{settings.show_location ? 'Visible' : 'Hidden'}</span>
                </div>
                <p className="text-[10px] text-gray-600">When enabled, displays your location in the footer (LOC: [Location])</p>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Footer Background Video URL</label>
                  <input
                    type="url"
                    value={settings.footer_background_video || ''}
                    onChange={e => setSettings({...settings, footer_background_video: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="https://example.com/footer-video.mp4"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Video URL for the footer background (will be used instead of solid color if provided)</p>
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && user?.user_type === 'admin' && (
          <div className="max-w-4xl space-y-8">
            <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">User Management</h3>
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.id} className="p-6 bg-[#111] border border-gray-900 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                      {u.profile_image ? (
                        <img src={u.profile_image} alt={u.email} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-display font-bold">{u.email}</h4>
                      <p className="text-xs text-gray-500 mt-1">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-gray-600 mt-1">Created: {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <select 
                      value={u.user_type}
                      onChange={e => handleUpdateUserType(u.id, e.target.value)}
                      className="bg-transparent border border-gray-800 px-4 py-2 font-display text-xs uppercase"
                    >
                      <option value="admin" className="bg-[#111]">Admin</option>
                      <option value="registered" className="bg-[#111]">Registered</option>
                      <option value="visitor" className="bg-[#111]">Visitor</option>
                    </select>
                    <span className={`text-xs px-3 py-1 rounded ${u.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => openEditUser(u)}
                      className="p-2 hover:bg-gray-800 rounded transition-colors"
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 hover:bg-gray-800 rounded transition-colors"
                      title="Delete User"
                      disabled={u.id === user?.id}
                    >
                      <Trash2 className={`w-4 h-4 ${u.id === user?.id ? 'text-gray-600' : 'text-red-500'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Messages Tab */}
        {activeTab === 'contact-messages' && (
          <div className="max-w-6xl space-y-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-display font-bold uppercase text-blue-500">Messages ({contactMessages.length})</h2>
              <button 
                onClick={fetchContactMessages}
                className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2"
              >
                <Loader2 size={14} className="animate-spin" /> Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Message List */}
              <div className="space-y-4 h-[600px] overflow-y-auto">
                {contactMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-[10px] font-display uppercase tracking-widest mb-2">Aucun message</p>
                    <p className="text-sm">Vous n'avez pas encore reçu de messages.</p>
                  </div>
                ) : (
                  contactMessages.map(message => (
                    <div 
                      key={message.id}
                      onClick={() => {
                        setSelectedMessage(message);
                        setReplyText(message.admin_reply || '');
                      }}
                      className={`p-4 border border-gray-800 cursor-pointer transition-all ${
                        selectedMessage?.id === message.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-display font-bold uppercase text-sm">{message.name}</h3>
                        <span className={`text-[10px] font-display uppercase tracking-widest ${
                          message.status === 'new' ? 'text-green-500' : 
                          message.status === 'read' ? 'text-gray-500' : 
                          message.status === 'replied' ? 'text-blue-500' : 'text-gray-600'
                        }`}>
                          {message.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-display text-gray-400 mb-2">{message.email}</p>
                      <p className="font-display text-sm truncate mb-2">{message.subject}</p>
                      <p className="text-gray-400 text-sm line-clamp-2">{message.message}</p>
                      <p className="text-[10px] font-display text-gray-600 mt-2">{new Date(message.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
              
              {/* Message Detail */}
              {selectedMessage && (
                <div className="space-y-6">
                  <div className="p-4 border border-gray-800 bg-gray-900/50">
                    <h3 className="font-display font-bold uppercase text-lg mb-4">{selectedMessage.subject}</h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm"><span className="text-gray-500">De:</span> {selectedMessage.name}</p>
                      <p className="text-sm"><span className="text-gray-500">Email:</span> {selectedMessage.email}</p>
                      <p className="text-sm"><span className="text-gray-500">Date:</span> {new Date(selectedMessage.created_at).toLocaleString()}</p>
                      <p className="text-sm"><span className="text-gray-500">Statut:</span> {selectedMessage.status}</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-2">Message</h4>
                        <p className="text-gray-300 whitespace-pre-line">{selectedMessage.message}</p>
                      </div>
                      {selectedMessage.admin_reply && (
                        <div className="pt-4 border-t border-gray-800">
                          <h4 className="text-[10px] font-display uppercase tracking-widest text-blue-500 mb-2">Votre réponse</h4>
                          <p className="text-blue-400 whitespace-pre-line">{selectedMessage.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Reply Form */}
                  <div className="p-4 border border-gray-800">
                    <h4 className="text-[10px] font-display uppercase tracking-widest text-gray-500 mb-4">Répondre</h4>
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Écrire une réponse..."
                      className="w-full bg-transparent border border-gray-800 p-3 focus:border-blue-500 outline-none font-display text-sm h-40 text-gray-300"
                    />
                    <div className="flex gap-4 mt-4">
                      <button 
                        onClick={handleReply}
                        disabled={!replyText.trim()}
                        className="px-6 py-2 bg-blue-500 text-white font-display text-xs uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Envoyer la réponse
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedMessage(null);
                          setReplyText('');
                        }}
                        className="px-6 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors font-display text-xs uppercase tracking-widest"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {!selectedMessage && contactMessages.length > 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-[10px] font-display uppercase tracking-widest mb-2">Sélectionnez un message</p>
                  <p className="text-sm">Cliquez sur un message pour le voir et répondre.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111] border border-gray-800 p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-lg font-bold">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="hover:text-red-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Profile Image */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                    {editUserData.profile_image ? (
                      <img src={editUserData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUserProfileImageUpload}
                      className="hidden"
                      id="user-profile-image"
                    />
                    <label
                      htmlFor="user-profile-image"
                      className="cursor-pointer px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-display uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </label>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-display uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={editUserData.email}
                    onChange={e => setEditUserData({ ...editUserData, email: e.target.value })}
                    className="w-full bg-transparent border border-gray-800 px-4 py-3 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-display uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    value={editUserData.first_name}
                    onChange={e => setEditUserData({ ...editUserData, first_name: e.target.value })}
                    className="w-full bg-transparent border border-gray-800 px-4 py-3 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-display uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    value={editUserData.last_name}
                    onChange={e => setEditUserData({ ...editUserData, last_name: e.target.value })}
                    className="w-full bg-transparent border border-gray-800 px-4 py-3 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-display uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    value={editUserData.phone}
                    onChange={e => setEditUserData({ ...editUserData, phone: e.target.value })}
                    className="w-full bg-transparent border border-gray-800 px-4 py-3 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-display uppercase tracking-wider">Bio</label>
                  <textarea
                    value={editUserData.bio}
                    onChange={e => setEditUserData({ ...editUserData, bio: e.target.value })}
                    className="w-full bg-transparent border border-gray-800 px-4 py-3 focus:border-blue-500 outline-none h-24 resize-none"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-display uppercase tracking-wider">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={editUserData.new_password}
                    onChange={e => setEditUserData({ ...editUserData, new_password: e.target.value })}
                    className="w-full bg-transparent border border-gray-800 px-4 py-3 focus:border-blue-500 outline-none"
                    placeholder="Enter new password"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveUserEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 font-display text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-6 py-3 border border-gray-700 hover:border-gray-500 font-display text-xs uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
