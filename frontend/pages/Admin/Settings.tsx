
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Save, LayoutDashboard, Globe, Key, Mail, Users, Bell, Lock, MapPin, Image, Type, Sparkles, Upload, Loader2, Plus, Trash2, Edit2, X, Briefcase, GraduationCap, Award, Code, Globe2, Heart, User } from 'lucide-react';
import { useAuth } from '../../App';

const API_URL = 'http://localhost:8000/api';

interface SiteSettings {
  id?: number;
  site_name: string;
  site_title: string;
  logo_url: string;
  favicon_url: string;
  site_description: string;
  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_tagline: string;
  // CV Personal Info
  cv_full_name: string;
  cv_job_title: string;
  cv_email: string;
  cv_phone: string;
  cv_location: string;
  cv_profile_image: string;
  cv_summary: string;
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
  // Footer
  footer_text: string;
  copyright_year: number;
  version: string;
  // SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

interface CVExperience {
  id?: number;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
  order: number;
}

interface CVEducation {
  id?: number;
  degree: string;
  institution: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
  gpa: string;
  order: number;
}

interface CVSkill {
  id?: number;
  name: string;
  level: string;
  category: string;
  percentage: number;
  order: number;
}

interface CVLanguage {
  id?: number;
  name: string;
  level: string;
  order: number;
}

interface CVCertification {
  id?: number;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string;
  credential_url: string;
  description: string;
  order: number;
}

interface CVProject {
  id?: number;
  title: string;
  description: string;
  technologies: string;
  url: string;
  github_url: string;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean;
  order: number;
}

interface CVInterest {
  id?: number;
  name: string;
  icon: string;
  description: string;
  order: number;
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

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [savedStatus, setSavedStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  // CV Data States
  const [experiences, setExperiences] = useState<CVExperience[]>([]);
  const [education, setEducation] = useState<CVEducation[]>([]);
  const [skills, setSkills] = useState<CVSkill[]>([]);
  const [languages, setLanguages] = useState<CVLanguage[]>([]);
  const [certifications, setCertifications] = useState<CVCertification[]>([]);
  const [cvProjects, setCVProjects] = useState<CVProject[]>([]);
  const [interests, setInterests] = useState<CVInterest[]>([]);
  
  // Edit States
  const [editingExperience, setEditingExperience] = useState<CVExperience | null>(null);
  const [editingEducation, setEditingEducation] = useState<CVEducation | null>(null);
  const [editingSkill, setEditingSkill] = useState<CVSkill | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<CVLanguage | null>(null);
  const [editingCertification, setEditingCertification] = useState<CVCertification | null>(null);
  const [editingCVProject, setEditingCVProject] = useState<CVProject | null>(null);
  const [editingInterest, setEditingInterest] = useState<CVInterest | null>(null);
  
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
  const { user, token, logout } = useAuth();

  useEffect(() => {
    fetchSettings();
    fetchCVData();
    if (user?.user_type === 'admin') {
      fetchUsers();
    }
  }, [token]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCVData = async () => {
    try {
      const [expRes, eduRes, skillRes, langRes, certRes, projRes, intRes] = await Promise.all([
        fetch(`${API_URL}/cv/experiences/`),
        fetch(`${API_URL}/cv/education/`),
        fetch(`${API_URL}/cv/skills/`),
        fetch(`${API_URL}/cv/languages/`),
        fetch(`${API_URL}/cv/certifications/`),
        fetch(`${API_URL}/cv/projects/`),
        fetch(`${API_URL}/cv/interests/`)
      ]);
      
      if (expRes.ok) {
        const data = await expRes.json();
        setExperiences(Array.isArray(data) ? data : (data.results || []));
      }
      if (eduRes.ok) {
        const data = await eduRes.json();
        setEducation(Array.isArray(data) ? data : (data.results || []));
      }
      if (skillRes.ok) {
        const data = await skillRes.json();
        setSkills(Array.isArray(data) ? data : (data.results || []));
      }
      if (langRes.ok) {
        const data = await langRes.json();
        setLanguages(Array.isArray(data) ? data : (data.results || []));
      }
      if (certRes.ok) {
        const data = await certRes.json();
        setCertifications(Array.isArray(data) ? data : (data.results || []));
      }
      if (projRes.ok) {
        const data = await projRes.json();
        setCVProjects(Array.isArray(data) ? data : (data.results || []));
      }
      if (intRes.ok) {
        const data = await intRes.json();
        setInterests(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (error) {
      console.error('Error fetching CV data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
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
      const response = await fetch(`${API_URL}/settings/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
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
      const response = await fetch(`${API_URL}/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
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
      
      const response = await fetch(`${API_URL}/admin/users/${editingUser.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
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
        alert(errorMessages.length > 0 ? errorMessages.join('\n') : (error.error || 'Failed to update user'));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  // Handle user delete
  const handleDeleteUser = async (userId: number) => {
    if (userId === user?.id) {
      alert('Cannot delete your own account');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
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
    if (!token) return null;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_URL}/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const error = await response.json();
        console.error('Upload error:', error);
        alert(error.error || 'Failed to upload image');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
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

  // ============ CV CRUD Functions ============

  // Experience
  const saveExperience = async (exp: CVExperience) => {
    const method = exp.id ? 'PATCH' : 'POST';
    const url = exp.id ? `${API_URL}/cv/experiences/${exp.id}/` : `${API_URL}/cv/experiences/`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(exp)
      });
      if (response.ok) {
        fetchCVData();
        setEditingExperience(null);
      }
    } catch (error) {
      console.error('Error saving experience:', error);
    }
  };

  const deleteExperience = async (id: number) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;
    try {
      await fetch(`${API_URL}/cv/experiences/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchCVData();
    } catch (error) {
      console.error('Error deleting experience:', error);
    }
  };

  // Education
  const saveEducation = async (edu: CVEducation) => {
    const method = edu.id ? 'PATCH' : 'POST';
    const url = edu.id ? `${API_URL}/cv/education/${edu.id}/` : `${API_URL}/cv/education/`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(edu)
      });
      if (response.ok) {
        fetchCVData();
        setEditingEducation(null);
      }
    } catch (error) {
      console.error('Error saving education:', error);
    }
  };

  const deleteEducation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this education?')) return;
    try {
      await fetch(`${API_URL}/cv/education/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchCVData();
    } catch (error) {
      console.error('Error deleting education:', error);
    }
  };

  // Skill
  const saveSkill = async (skill: CVSkill) => {
    const method = skill.id ? 'PATCH' : 'POST';
    const url = skill.id ? `${API_URL}/cv/skills/${skill.id}/` : `${API_URL}/cv/skills/`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(skill)
      });
      if (response.ok) {
        fetchCVData();
        setEditingSkill(null);
      }
    } catch (error) {
      console.error('Error saving skill:', error);
    }
  };

  const deleteSkill = async (id: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      await fetch(`${API_URL}/cv/skills/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchCVData();
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  // Language
  const saveLanguage = async (lang: CVLanguage) => {
    const method = lang.id ? 'PATCH' : 'POST';
    const url = lang.id ? `${API_URL}/cv/languages/${lang.id}/` : `${API_URL}/cv/languages/`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(lang)
      });
      if (response.ok) {
        fetchCVData();
        setEditingLanguage(null);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const deleteLanguage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this language?')) return;
    try {
      await fetch(`${API_URL}/cv/languages/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchCVData();
    } catch (error) {
      console.error('Error deleting language:', error);
    }
  };

  // Certification
  const saveCertification = async (cert: CVCertification) => {
    const method = cert.id ? 'PATCH' : 'POST';
    const url = cert.id ? `${API_URL}/cv/certifications/${cert.id}/` : `${API_URL}/cv/certifications/`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(cert)
      });
      if (response.ok) {
        fetchCVData();
        setEditingCertification(null);
      }
    } catch (error) {
      console.error('Error saving certification:', error);
    }
  };

  const deleteCertification = async (id: number) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    try {
      await fetch(`${API_URL}/cv/certifications/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchCVData();
    } catch (error) {
      console.error('Error deleting certification:', error);
    }
  };

  // CV Project
  const saveCVProject = async (proj: CVProject) => {
    const method = proj.id ? 'PATCH' : 'POST';
    const url = proj.id ? `${API_URL}/cv/projects/${proj.id}/` : `${API_URL}/cv/projects/`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(proj)
      });
      if (response.ok) {
        fetchCVData();
        setEditingCVProject(null);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const deleteCVProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`${API_URL}/cv/projects/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchCVData();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Interest
  const saveInterest = async (int: CVInterest) => {
    const method = int.id ? 'PATCH' : 'POST';
    const url = int.id ? `${API_URL}/cv/interests/${int.id}/` : `${API_URL}/cv/interests/`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(int)
      });
      if (response.ok) {
        fetchCVData();
        setEditingInterest(null);
      }
    } catch (error) {
      console.error('Error saving interest:', error);
    }
  };

  const deleteInterest = async (id: number) => {
    if (!confirm('Are you sure you want to delete this interest?')) return;
    try {
      await fetch(`${API_URL}/cv/interests/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchCVData();
    } catch (error) {
      console.error('Error deleting interest:', error);
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
          
          <button 
            onClick={() => setActiveTab('cv-personal')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'cv-personal' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <User size={16} /> CV Personal
          </button>
          
          <button 
            onClick={() => setActiveTab('cv-experience')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'cv-experience' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Briefcase size={16} /> Experience
          </button>
          
          <button 
            onClick={() => setActiveTab('cv-education')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'cv-education' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <GraduationCap size={16} /> Education
          </button>
          
          <button 
            onClick={() => setActiveTab('cv-skills')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'cv-skills' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Code size={16} /> Skills
          </button>
          
          <button 
            onClick={() => setActiveTab('cv-languages')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'cv-languages' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Globe2 size={16} /> Languages
          </button>
          
          <button 
            onClick={() => setActiveTab('cv-certifications')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'cv-certifications' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Award size={16} /> Certifications
          </button>
          
          <button 
            onClick={() => setActiveTab('cv-projects')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'cv-projects' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Code size={16} /> CV Projects
          </button>
          
          <button 
            onClick={() => setActiveTab('cv-interests')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'cv-interests' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Heart size={16} /> Interests
          </button>
          
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
            onClick={() => setActiveTab('footer')}
            className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'footer' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Image size={16} /> Footer
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
            {activeTab === 'cv-personal' && 'CV Personal Info'}
            {activeTab === 'cv-experience' && 'Work Experience'}
            {activeTab === 'cv-education' && 'Education'}
            {activeTab === 'cv-skills' && 'Skills'}
            {activeTab === 'cv-languages' && 'Languages'}
            {activeTab === 'cv-certifications' && 'Certifications'}
            {activeTab === 'cv-projects' && 'CV Projects'}
            {activeTab === 'cv-interests' && 'Interests'}
            {activeTab === 'location' && 'Location Settings'}
            {activeTab === 'social' && 'Social Media Links'}
            {activeTab === 'oauth' && 'OAuth Configuration'}
            {activeTab === 'email' && 'Email Configuration'}
            {activeTab === 'footer' && 'Footer Settings'}
            {activeTab === 'users' && 'User Management'}
          </h1>
          {savedStatus && <span className="text-green-500 font-display text-[10px] uppercase tracking-widest">Saved Successfully</span>}
        </header>

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
                    placeholder="ADRIAN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Logo URL</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="url"
                      value={settings.logo_url}
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
                      value={settings.favicon_url}
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

        {/* CV Personal Info Tab */}
        {activeTab === 'cv-personal' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-12">
            <section className="space-y-8">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Personal Information</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Full Name</label>
                    <input 
                      type="text"
                      value={settings.cv_full_name}
                      onChange={e => setSettings({...settings, cv_full_name: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Job Title</label>
                    <input 
                      type="text"
                      value={settings.cv_job_title}
                      onChange={e => setSettings({...settings, cv_job_title: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="Full Stack Developer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Email</label>
                    <input 
                      type="email"
                      value={settings.cv_email}
                      onChange={e => setSettings({...settings, cv_email: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Phone</label>
                    <input 
                      type="text"
                      value={settings.cv_phone}
                      onChange={e => setSettings({...settings, cv_phone: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Location</label>
                  <input 
                    type="text"
                    value={settings.cv_location}
                    onChange={e => setSettings({...settings, cv_location: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="New York, USA"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Profile Image</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="url"
                      value={settings.cv_profile_image}
                      onChange={e => setSettings({...settings, cv_profile_image: e.target.value})}
                      className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="https://example.com/profile.jpg"
                    />
                    <input 
                      type="file"
                      ref={profileInputRef}
                      onChange={(e) => handleImageUpload(e, 'cv_profile_image')}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <button 
                      type="button"
                      onClick={() => profileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingField === 'cv_profile_image' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                  {settings.cv_profile_image && (
                    <img src={settings.cv_profile_image} alt="Profile" className="mt-4 w-32 h-32 object-cover rounded-lg" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Professional Summary</label>
                  <textarea 
                    value={settings.cv_summary}
                    onChange={e => setSettings({...settings, cv_summary: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-32 text-gray-300"
                    placeholder="A brief professional summary..."
                  />
                </div>
              </div>
            </section>

            <button type="submit" className="px-12 py-5 bg-white text-black font-display text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-4">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Experience Tab */}
        {activeTab === 'cv-experience' && (
          <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Work Experience</h3>
              <button 
                onClick={() => setEditingExperience({ title: '', company: '', location: '', start_date: '', end_date: null, is_current: false, description: '', order: 0 })}
                className="px-6 py-3 bg-blue-500 text-white font-display text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Experience
              </button>
            </div>

            {/* Experience Form */}
            {editingExperience && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[#111] border border-gray-800 rounded-xl"
              >
                <h4 className="text-lg font-display font-bold uppercase mb-6">{editingExperience.id ? 'Edit' : 'Add'} Experience</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Job Title</label>
                      <input 
                        type="text"
                        value={editingExperience.title}
                        onChange={e => setEditingExperience({...editingExperience, title: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Company</label>
                      <input 
                        type="text"
                        value={editingExperience.company}
                        onChange={e => setEditingExperience({...editingExperience, company: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="Tech Company"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Location</label>
                    <input 
                      type="text"
                      value={editingExperience.location}
                      onChange={e => setEditingExperience({...editingExperience, location: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="New York, USA"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Start Date</label>
                      <input 
                        type="date"
                        value={editingExperience.start_date}
                        onChange={e => setEditingExperience({...editingExperience, start_date: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">End Date</label>
                      <input 
                        type="date"
                        value={editingExperience.end_date || ''}
                        onChange={e => setEditingExperience({...editingExperience, end_date: e.target.value || null})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        disabled={editingExperience.is_current}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id="is_current"
                      checked={editingExperience.is_current}
                      onChange={e => setEditingExperience({...editingExperience, is_current: e.target.checked, end_date: e.target.checked ? null : editingExperience.end_date})}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <label htmlFor="is_current" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Currently working here</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Description</label>
                    <textarea 
                      value={editingExperience.description}
                      onChange={e => setEditingExperience({...editingExperience, description: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24"
                      placeholder="Describe your responsibilities and achievements..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => saveExperience(editingExperience)}
                      className="px-8 py-3 bg-white text-black font-display text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button 
                      onClick={() => setEditingExperience(null)}
                      className="px-8 py-3 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Experience List */}
            <div className="space-y-4">
              {experiences.map(exp => (
                <div key={exp.id} className="p-6 bg-[#111] border border-gray-900 flex justify-between items-start group hover:border-blue-500/50 transition-all">
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest">{exp.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{exp.company} • {exp.location}</p>
                    <p className="text-xs text-gray-500 mt-2">{exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}</p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{exp.description}</p>
                  </div>
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingExperience(exp)} className="text-gray-500 hover:text-white">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => exp.id && deleteExperience(exp.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'cv-education' && (
          <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Education</h3>
              <button 
                onClick={() => setEditingEducation({ degree: '', institution: '', location: '', start_date: '', end_date: null, is_current: false, description: '', gpa: '', order: 0 })}
                className="px-6 py-3 bg-blue-500 text-white font-display text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Education
              </button>
            </div>

            {editingEducation && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[#111] border border-gray-800 rounded-xl"
              >
                <h4 className="text-lg font-display font-bold uppercase mb-6">{editingEducation.id ? 'Edit' : 'Add'} Education</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Degree</label>
                      <input 
                        type="text"
                        value={editingEducation.degree}
                        onChange={e => setEditingEducation({...editingEducation, degree: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="Bachelor of Science in Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Institution</label>
                      <input 
                        type="text"
                        value={editingEducation.institution}
                        onChange={e => setEditingEducation({...editingEducation, institution: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="University Name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Location</label>
                      <input 
                        type="text"
                        value={editingEducation.location}
                        onChange={e => setEditingEducation({...editingEducation, location: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">GPA</label>
                      <input 
                        type="text"
                        value={editingEducation.gpa}
                        onChange={e => setEditingEducation({...editingEducation, gpa: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="3.8/4.0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Start Date</label>
                      <input 
                        type="date"
                        value={editingEducation.start_date}
                        onChange={e => setEditingEducation({...editingEducation, start_date: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">End Date</label>
                      <input 
                        type="date"
                        value={editingEducation.end_date || ''}
                        onChange={e => setEditingEducation({...editingEducation, end_date: e.target.value || null})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        disabled={editingEducation.is_current}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id="edu_current"
                      checked={editingEducation.is_current}
                      onChange={e => setEditingEducation({...editingEducation, is_current: e.target.checked, end_date: e.target.checked ? null : editingEducation.end_date})}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <label htmlFor="edu_current" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Currently studying here</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Description</label>
                    <textarea 
                      value={editingEducation.description}
                      onChange={e => setEditingEducation({...editingEducation, description: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24"
                      placeholder="Relevant coursework, achievements, activities..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => saveEducation(editingEducation)}
                      className="px-8 py-3 bg-white text-black font-display text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button 
                      onClick={() => setEditingEducation(null)}
                      className="px-8 py-3 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              {education.map(edu => (
                <div key={edu.id} className="p-6 bg-[#111] border border-gray-900 flex justify-between items-start group hover:border-blue-500/50 transition-all">
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest">{edu.degree}</h4>
                    <p className="text-sm text-gray-400 mt-1">{edu.institution} • {edu.location}</p>
                    <p className="text-xs text-gray-500 mt-2">{edu.start_date} - {edu.is_current ? 'Present' : edu.end_date} {edu.gpa && `• GPA: ${edu.gpa}`}</p>
                  </div>
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingEducation(edu)} className="text-gray-500 hover:text-white">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => edu.id && deleteEducation(edu.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'cv-skills' && (
          <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Skills</h3>
              <button 
                onClick={() => setEditingSkill({ name: '', level: 'intermediate', category: 'technical', percentage: 80, order: 0 })}
                className="px-6 py-3 bg-blue-500 text-white font-display text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Skill
              </button>
            </div>

            {editingSkill && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[#111] border border-gray-800 rounded-xl"
              >
                <h4 className="text-lg font-display font-bold uppercase mb-6">{editingSkill.id ? 'Edit' : 'Add'} Skill</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Skill Name</label>
                      <input 
                        type="text"
                        value={editingSkill.name}
                        onChange={e => setEditingSkill({...editingSkill, name: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="JavaScript"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Category</label>
                      <select 
                        value={editingSkill.category}
                        onChange={e => setEditingSkill({...editingSkill, category: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                      >
                        <option value="technical" className="bg-[#111]">Technical</option>
                        <option value="language" className="bg-[#111]">Language</option>
                        <option value="soft" className="bg-[#111]">Soft Skills</option>
                        <option value="tool" className="bg-[#111]">Tools & Software</option>
                        <option value="other" className="bg-[#111]">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Level</label>
                      <select 
                        value={editingSkill.level}
                        onChange={e => setEditingSkill({...editingSkill, level: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                      >
                        <option value="beginner" className="bg-[#111]">Beginner</option>
                        <option value="intermediate" className="bg-[#111]">Intermediate</option>
                        <option value="advanced" className="bg-[#111]">Advanced</option>
                        <option value="expert" className="bg-[#111]">Expert</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Percentage ({editingSkill.percentage}%)</label>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={editingSkill.percentage}
                        onChange={e => setEditingSkill({...editingSkill, percentage: parseInt(e.target.value)})}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => saveSkill(editingSkill)}
                      className="px-8 py-3 bg-white text-black font-display text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button 
                      onClick={() => setEditingSkill(null)}
                      className="px-8 py-3 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {skills.map(skill => (
                <div key={skill.id} className="p-4 bg-[#111] border border-gray-900 flex justify-between items-center group hover:border-blue-500/50 transition-all">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-display font-bold uppercase tracking-widest text-sm">{skill.name}</h4>
                      <span className="text-xs text-gray-500">{skill.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${skill.percentage}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase">{skill.category} • {skill.level}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingSkill(skill)} className="text-gray-500 hover:text-white">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => skill.id && deleteSkill(skill.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages Tab */}
        {activeTab === 'cv-languages' && (
          <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Languages</h3>
              <button 
                onClick={() => setEditingLanguage({ name: '', level: 'intermediate', order: 0 })}
                className="px-6 py-3 bg-blue-500 text-white font-display text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Language
              </button>
            </div>

            {editingLanguage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[#111] border border-gray-800 rounded-xl"
              >
                <h4 className="text-lg font-display font-bold uppercase mb-6">{editingLanguage.id ? 'Edit' : 'Add'} Language</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Language</label>
                      <input 
                        type="text"
                        value={editingLanguage.name}
                        onChange={e => setEditingLanguage({...editingLanguage, name: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="English"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Level</label>
                      <select 
                        value={editingLanguage.level}
                        onChange={e => setEditingLanguage({...editingLanguage, level: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                      >
                        <option value="native" className="bg-[#111]">Native</option>
                        <option value="fluent" className="bg-[#111]">Fluent</option>
                        <option value="advanced" className="bg-[#111]">Advanced</option>
                        <option value="intermediate" className="bg-[#111]">Intermediate</option>
                        <option value="basic" className="bg-[#111]">Basic</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => saveLanguage(editingLanguage)}
                      className="px-8 py-3 bg-white text-black font-display text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button 
                      onClick={() => setEditingLanguage(null)}
                      className="px-8 py-3 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {languages.map(lang => (
                <div key={lang.id} className="p-4 bg-[#111] border border-gray-900 flex justify-between items-center group hover:border-blue-500/50 transition-all">
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-sm">{lang.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 uppercase">{lang.level}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingLanguage(lang)} className="text-gray-500 hover:text-white">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => lang.id && deleteLanguage(lang.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'cv-certifications' && (
          <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Certifications</h3>
              <button 
                onClick={() => setEditingCertification({ name: '', issuer: '', issue_date: '', expiry_date: null, credential_id: '', credential_url: '', description: '', order: 0 })}
                className="px-6 py-3 bg-blue-500 text-white font-display text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Certification
              </button>
            </div>

            {editingCertification && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[#111] border border-gray-800 rounded-xl"
              >
                <h4 className="text-lg font-display font-bold uppercase mb-6">{editingCertification.id ? 'Edit' : 'Add'} Certification</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Certification Name</label>
                      <input 
                        type="text"
                        value={editingCertification.name}
                        onChange={e => setEditingCertification({...editingCertification, name: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="AWS Solutions Architect"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Issuing Organization</label>
                      <input 
                        type="text"
                        value={editingCertification.issuer}
                        onChange={e => setEditingCertification({...editingCertification, issuer: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="Amazon Web Services"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Issue Date</label>
                      <input 
                        type="date"
                        value={editingCertification.issue_date}
                        onChange={e => setEditingCertification({...editingCertification, issue_date: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Expiry Date (Optional)</label>
                      <input 
                        type="date"
                        value={editingCertification.expiry_date || ''}
                        onChange={e => setEditingCertification({...editingCertification, expiry_date: e.target.value || null})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Credential ID</label>
                      <input 
                        type="text"
                        value={editingCertification.credential_id}
                        onChange={e => setEditingCertification({...editingCertification, credential_id: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="ABC123XYZ"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Credential URL</label>
                      <input 
                        type="url"
                        value={editingCertification.credential_url}
                        onChange={e => setEditingCertification({...editingCertification, credential_url: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Description</label>
                    <textarea 
                      value={editingCertification.description}
                      onChange={e => setEditingCertification({...editingCertification, description: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24"
                      placeholder="Brief description..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => saveCertification(editingCertification)}
                      className="px-8 py-3 bg-white text-black font-display text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button 
                      onClick={() => setEditingCertification(null)}
                      className="px-8 py-3 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              {certifications.map(cert => (
                <div key={cert.id} className="p-6 bg-[#111] border border-gray-900 flex justify-between items-start group hover:border-blue-500/50 transition-all">
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest">{cert.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{cert.issuer}</p>
                    <p className="text-xs text-gray-500 mt-2">Issued: {cert.issue_date} {cert.expiry_date && `• Expires: ${cert.expiry_date}`}</p>
                    {cert.credential_id && <p className="text-xs text-gray-600 mt-1">Credential ID: {cert.credential_id}</p>}
                  </div>
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingCertification(cert)} className="text-gray-500 hover:text-white">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => cert.id && deleteCertification(cert.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CV Projects Tab */}
        {activeTab === 'cv-projects' && (
          <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">CV Projects</h3>
              <button 
                onClick={() => setEditingCVProject({ title: '', description: '', technologies: '', url: '', github_url: '', start_date: null, end_date: null, is_ongoing: false, order: 0 })}
                className="px-6 py-3 bg-blue-500 text-white font-display text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Project
              </button>
            </div>

            {editingCVProject && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[#111] border border-gray-800 rounded-xl"
              >
                <h4 className="text-lg font-display font-bold uppercase mb-6">{editingCVProject.id ? 'Edit' : 'Add'} Project</h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Project Title</label>
                    <input 
                      type="text"
                      value={editingCVProject.title}
                      onChange={e => setEditingCVProject({...editingCVProject, title: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="Project Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Description</label>
                    <textarea 
                      value={editingCVProject.description}
                      onChange={e => setEditingCVProject({...editingCVProject, description: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24"
                      placeholder="Describe the project..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Technologies (comma-separated)</label>
                    <input 
                      type="text"
                      value={editingCVProject.technologies}
                      onChange={e => setEditingCVProject({...editingCVProject, technologies: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                      placeholder="React, Node.js, PostgreSQL"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Live URL</label>
                      <input 
                        type="url"
                        value={editingCVProject.url}
                        onChange={e => setEditingCVProject({...editingCVProject, url: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">GitHub URL</label>
                      <input 
                        type="url"
                        value={editingCVProject.github_url}
                        onChange={e => setEditingCVProject({...editingCVProject, github_url: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id="proj_ongoing"
                      checked={editingCVProject.is_ongoing}
                      onChange={e => setEditingCVProject({...editingCVProject, is_ongoing: e.target.checked})}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <label htmlFor="proj_ongoing" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Ongoing project</label>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => saveCVProject(editingCVProject)}
                      className="px-8 py-3 bg-white text-black font-display text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button 
                      onClick={() => setEditingCVProject(null)}
                      className="px-8 py-3 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              {cvProjects.map(proj => (
                <div key={proj.id} className="p-6 bg-[#111] border border-gray-900 flex justify-between items-start group hover:border-blue-500/50 transition-all">
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest">{proj.title}</h4>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{proj.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{proj.technologies}</p>
                    <div className="flex gap-4 mt-2">
                      {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Live Demo</a>}
                      {proj.github_url && <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">GitHub</a>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingCVProject(proj)} className="text-gray-500 hover:text-white">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => proj.id && deleteCVProject(proj.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests Tab */}
        {activeTab === 'cv-interests' && (
          <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-display text-blue-500 uppercase tracking-[0.3em]">Interests & Hobbies</h3>
              <button 
                onClick={() => setEditingInterest({ name: '', icon: '', description: '', order: 0 })}
                className="px-6 py-3 bg-blue-500 text-white font-display text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Interest
              </button>
            </div>

            {editingInterest && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[#111] border border-gray-800 rounded-xl"
              >
                <h4 className="text-lg font-display font-bold uppercase mb-6">{editingInterest.id ? 'Edit' : 'Add'} Interest</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Name</label>
                      <input 
                        type="text"
                        value={editingInterest.name}
                        onChange={e => setEditingInterest({...editingInterest, name: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="Photography"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Icon (emoji or name)</label>
                      <input 
                        type="text"
                        value={editingInterest.icon}
                        onChange={e => setEditingInterest({...editingInterest, icon: e.target.value})}
                        className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                        placeholder="📷 or camera"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Description</label>
                    <textarea 
                      value={editingInterest.description}
                      onChange={e => setEditingInterest({...editingInterest, description: e.target.value})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24"
                      placeholder="Brief description..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => saveInterest(editingInterest)}
                      className="px-8 py-3 bg-white text-black font-display text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button 
                      onClick={() => setEditingInterest(null)}
                      className="px-8 py-3 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {interests.map(int => (
                <div key={int.id} className="p-4 bg-[#111] border border-gray-900 flex justify-between items-start group hover:border-blue-500/50 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      {int.icon && <span className="text-xl">{int.icon}</span>}
                      <h4 className="font-display font-bold uppercase tracking-widest text-sm">{int.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{int.description}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingInterest(int)} className="text-gray-500 hover:text-white">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => int.id && deleteInterest(int.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                      value={settings.latitude}
                      onChange={e => setSettings({...settings, latitude: parseFloat(e.target.value)})}
                      className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Longitude</label>
                    <input 
                      type="number"
                      step="0.0001"
                      value={settings.longitude}
                      onChange={e => setSettings({...settings, longitude: parseFloat(e.target.value)})}
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
                    placeholder="DESIGNED BY ADRIAN"
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
