
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../components/OnOffSwitch.css';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, LogOut, Settings as SettingsIcon, Home as HomeIcon, Star, X, Save, Image as ImageIcon, Upload, Loader2, User, TrendingUp, Activity, ClipboardList, ChevronDown, Mail, Phone, MessageSquare } from 'lucide-react';
import { STORAGE_KEYS, API_BASE_URL } from '../../constants';
import { authFetch, api, APIError } from '../../services/api';
import { compressImageIfNeeded } from '../../utils/imageCompression';
import { Project, MediaItem } from '../../types';
import { useAuth } from '../../App';
import { NotificationBell } from '../../components/NotificationBell';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    category: 'Développement',
    description: '',
    technologies: [],
    thumbnail: '',
    media: [],
    featured: false,
    is_active: true,
    show_registration: true
  });
  const [techInput, setTechInput] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTypeInput, setMediaTypeInput] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<'thumbnail' | 'media' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { token, logout, isAuthenticated, user } = useAuth();

  // View mode: projects or registrations
  const [viewMode, setViewMode] = useState<'projects' | 'registrations'>('projects');

  // Registrations state
  interface Registration {
    id: number;
    project_title: string;
    project_slug: string;
    user_id: number;
    user_email: string;
    user_first_name: string;
    user_last_name: string;
    user_phone: string;
    phone: string;
    message: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    status_display: string;
    created_at: string;
  }
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regFilter, setRegFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [regDetail, setRegDetail] = useState<Registration | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [contactTarget, setContactTarget] = useState<Registration | null>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);

  const fetchRegistrations = async () => {
    if (user?.user_type !== 'admin') {
      setError('Acces refuse: cette section est reservee aux comptes admin.');
      setRegistrations([]);
      return;
    }

    setRegLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/registrations/`);
      if (res.status === 403) {
        setError('Acces refuse: vous devez etre connecte avec un compte admin pour voir les inscriptions.');
        setRegistrations([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.results || data);
      } else {
        setError(`Impossible de charger les inscriptions (status ${res.status}).`);
      }
    } catch {}
    setRegLoading(false);
  };

  useEffect(() => {
    if (viewMode === 'registrations') fetchRegistrations();
  }, [viewMode, user?.user_type]);

  const updateRegistrationStatus = async (id: number, status: Registration['status']) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/registrations/${id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status, status_display: status === 'confirmed' ? 'Confirmé' : status === 'cancelled' ? 'Annulé' : 'En attente' } : r));
        if (regDetail?.id === id) setRegDetail(prev => prev ? { ...prev, status } : null);
      }
    } catch {}
  };

  const openContactModal = (reg: Registration) => {
    setContactTarget(reg);
    setContactSubject(`Concernant votre inscription: ${reg.project_title}`);
    setContactMessage('');
  };

  const sendContactMessage = async () => {
    if (!contactTarget) return;
    if (!contactMessage.trim()) {
      setError('Le message est obligatoire.');
      return;
    }

    setContactSending(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/registrations/${contactTarget.id}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: contactSubject, message: contactMessage }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Erreur lors de l\'envoi du message.');
        return;
      }

      setSuccessMessage(data.email_sent
        ? 'Message envoye. Un email de notification a ete envoye automatiquement.'
        : 'Message envoye dans la plateforme.');
      setContactTarget(null);
      setContactSubject('');
      setContactMessage('');
      setTimeout(() => setSuccessMessage(null), 4500);
    } catch {
      setError('Impossible d\'envoyer le message pour le moment.');
    } finally {
      setContactSending(false);
    }
  };


  useEffect(() => {
    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/projects/`);
      
      if (response.ok) {
        const data = await response.json();
        const projectsList = data.results || data;
        setProjects(projectsList);
        setError(null);
      } else {
        // Handle API errors - show error to user instead of silent fallback
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `Failed to fetch projects (Status: ${response.status})`;
        setError(errorMessage);
        setProjects([]);
      }
    } catch (error) {
      // Handle network errors - show error to user instead of silent fallback
      console.error('Error fetching projects:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to the server. Please check your connection.';
      setError(errorMessage);
      setProjects([]);
    }
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!isAuthenticated) return null;
    
    setUploading(true);
    try {
      const compressed = await compressImageIfNeeded(file);
      const formData = new FormData();
      formData.append('file', compressed);
      
      const data = await api.upload<{ url: string }>('/auth/upload/', formData);
      setError(null);
      return data.url;
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'Failed to upload image. Please try again.';
      console.error('Upload error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle thumbnail file selection
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingField('thumbnail');
    const url = await uploadImage(file);
    setUploadingField(null);
    
    if (url) {
      if (isEdit && editingProject) {
        setEditingProject({ ...editingProject, thumbnail: url });
      } else {
        setNewProject({ ...newProject, thumbnail: url });
      }
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle media file selection
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingField('media');
    
    try {
      const isVideo = file.type.startsWith('video/');
      const projectSlug = isEdit && editingProject ? editingProject.slug : newProject.slug;
      
      if (!projectSlug) {
        setError('Please save the project first before adding media');
        setUploadingField(null);
        return;
      }
      
      const formData = new FormData();
      formData.append('project', projectSlug);
      formData.append('media_type', isVideo ? 'video' : 'image');
      const fileToUpload = isVideo ? file : await compressImageIfNeeded(file);
      formData.append('file', fileToUpload);
      const mediaLength = isEdit && editingProject ? editingProject.media?.length ?? 0 : newProject.media?.length ?? 0;
      formData.append('order', String(mediaLength));
      
      const data = await api.upload<any>('/projects/media/create/', formData);
      const newMediaItem: MediaItem = {
        id: data.id,
        type: data.type,
        url: data.url,
        thumbnail_url: data.thumbnail_url,
        caption: data.caption,
        order: data.order,
        likes_count: data.likes_count || 0,
        is_liked: data.is_liked || false
      };
      
      if (isEdit && editingProject) {
        const currentMedia = editingProject.media || [];
        setEditingProject({
          ...editingProject,
          media: [...currentMedia, newMediaItem],
          thumbnail: editingProject.thumbnail || data.url
        });
      } else {
        const currentMedia = newProject.media || [];
        setNewProject({
          ...newProject,
          media: [...currentMedia, newMediaItem],
          thumbnail: newProject.thumbnail || data.url
        });
      }
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'Failed to upload media. Please try again.';
      console.error('Upload error:', errorMessage);
      setError(errorMessage);
    } finally {
      setUploadingField(null);
    }
    
    // Reset file input
    if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const deleteProject = async (id: number) => {
    setDeleteProjectId(id);
  };

  const confirmDelete = async () => {
    if (!deleteProjectId) return;
    
    try {
      const project = projects.find(p => p.id === deleteProjectId);
      if (!project) return;
      
      const response = await authFetch(`${API_BASE_URL}/projects/${project.slug}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== deleteProjectId));
        setError(null);
      } else {
        // Handle API errors - show error to user
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `Failed to delete project (Status: ${response.status})`;
        setError(errorMessage);
      }
    } catch (error) {
      // Handle network errors - show error to user
      console.error('Error deleting project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to the server. Please check your connection.';
      setError(errorMessage);
    }
  };

    const toggleActive = async (id: string | number) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    try {
      const response = await authFetch(`${API_BASE_URL}/projects/${project.slug}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !project.is_active })
      });
      if (response.ok) {
        const updated = projects.map(p =>
          p.id === id ? { ...p, is_active: !p.is_active } : p
        );
        setProjects(updated);
        setError(null);
      } else {
        // Handle API errors - show error to user
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `Failed to update project status (Status: ${response.status})`;
        setError(errorMessage);
      }
    } catch (error) {
      // Handle network errors - show error to user
      console.error('Error updating project status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to the server. Please check your connection.';
      setError(errorMessage);
    }
  };

  const toggleFeatured = async (id: string | number) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    try {
      const response = await authFetch(`${API_BASE_URL}/projects/${project.slug}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !project.featured })
      });
      if (response.ok) {
        const updated = projects.map(p =>
          p.id === id ? { ...p, featured: !p.featured } : p
        );
        setProjects(updated);
        setError(null);
      } else {
        // Handle API errors - show error to user
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `Failed to update project featured status (Status: ${response.status})`;
        setError(errorMessage);
      }
    } catch (error) {
      // Handle network errors - show error to user
      console.error('Error updating project featured status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to the server. Please check your connection.';
      setError(errorMessage);
    }
  };

  const addTechnology = () => {
    if (techInput.trim()) {
      const currentTechs = newProject.technologies || [];
      setNewProject({
        ...newProject, 
        technologies: [...currentTechs, techInput.trim()]
      });
      setTechInput('');
    }
  };

  const removeTechnology = (index: number) => {
    const currentTechs = newProject.technologies || [];
    setNewProject({
      ...newProject, 
      technologies: currentTechs.filter((_, i) => i !== index)
    });
  };

  const addMedia = () => {
    if (mediaUrlInput.trim()) {
      const currentMedia = newProject.media || [];
      const newMedia: MediaItem = {
        id: `m-${Date.now()}`,
        type: mediaTypeInput,
        url: mediaUrlInput.trim(),
        order: currentMedia.length + 1,
        likes_count: 0,
        is_liked: false
      };
      setNewProject({
        ...newProject,
        media: [...currentMedia, newMedia],
        // Set first image as thumbnail if not set
        thumbnail: newProject.thumbnail || (mediaTypeInput === 'image' ? mediaUrlInput.trim() : newProject.thumbnail)
      });
      setMediaUrlInput('');
    }
  };

  const removeMedia = (index: number) => {
    const currentMedia = newProject.media || [];
    const updated = currentMedia.filter((_, i) => i !== index);
    setNewProject({
      ...newProject,
      media: updated,
      thumbnail: updated[0]?.url || newProject.thumbnail
    });
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    // Create project without media field
    const { media, ...projectWithoutMedia } = newProject as any;
    const project: Project = {
      ...projectWithoutMedia,
      id: Date.now().toString(),
      slug: newProject.title?.toLowerCase().replace(/\s+/g, '-') || '',
      created_at: new Date().toISOString(),
      featured: newProject.featured || false,
      is_active: newProject.is_active || true,
      thumbnail: newProject.thumbnail || 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
      media: [] // Initialize with empty media array - will be added through separate API endpoint
    };
    
    // Fix category encoding issue
    if (project.category) {
      project.category = project.category.normalize('NFC');
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(project)
      });
      if (response.ok) {
        const created = await response.json();
        // If there were media items to add, add them through the media endpoint
        if (media && media.length > 0) {
          for (const mediaItem of media) {
            // For new projects, we need to handle media upload differently
            // This is just a placeholder - you would need to implement actual media upload
          }
        }
        setProjects([created, ...projects]);
        setError(null);
        setShowAddForm(false);
      } else {
        // Handle API errors - show error to user
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `Failed to create project (Status: ${response.status})`;
        setError(errorMessage);
      }
    } catch (error) {
      // Handle network errors - show error to user
      console.error('Error creating project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to the server. Please check your connection.';
      setError(errorMessage);
    }
    setNewProject({ title: '', category: 'Développement', description: '', technologies: [], thumbnail: '', media: [], featured: false, is_active: true, show_registration: true });
  };

  const updateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    // Create a copy of the project without media field to prevent duplicates
    const { media, ...projectWithoutMedia } = editingProject;
    
    // Fix category encoding issue
    if (projectWithoutMedia.category) {
      projectWithoutMedia.category = projectWithoutMedia.category.normalize('NFC') as 'Développement' | 'Drone' | 'Mélangé';
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/projects/${editingProject.slug}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectWithoutMedia)
      });
      if (response.ok) {
        // Fetch the updated project from API to get fresh data
        const getResponse = await authFetch(`${API_BASE_URL}/projects/${editingProject.slug}/`);
        if (getResponse.ok) {
          const updatedProject = await getResponse.json();
          const updated = projects.map(p => p.id === editingProject.id ? updatedProject : p);
          setProjects(updated);
        }
        setError(null);
        setEditingProject(null);
      } else {
        // Handle API errors - show error to user
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || `Failed to update project (Status: ${response.status})`;
        setError(errorMessage);
      }
    } catch (error) {
      // Handle network errors - show error to user
      console.error('Error updating project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to the server. Please check your connection.';
      setError(errorMessage);
    }
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-900 bg-[#111] p-8 flex flex-col justify-between">
        <div>
          <h2 className="font-display font-bold text-lg mb-12 tracking-widest text-blue-500">CONTROL</h2>
          <nav className="space-y-8">
            <Link to="/admin" className="flex items-center gap-4 text-white font-display text-xs uppercase tracking-widest">
              <Plus size={16} /> Dashboard
            </Link>
            <Link to="/admin/statistics" className="flex items-center gap-4 text-gray-500 hover:text-white font-display text-xs uppercase tracking-widest transition-colors">
              <TrendingUp size={16} /> Statistics
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-4 text-gray-500 hover:text-white font-display text-xs uppercase tracking-widest transition-colors">
              <SettingsIcon size={16} /> Settings
            </Link>
            <Link to="/admin/cv" className="flex items-center gap-4 text-gray-500 hover:text-white font-display text-xs uppercase tracking-widest transition-colors">
              <User size={16} /> CV Management
            </Link>
            <Link to="/admin/tracing" className="flex items-center gap-4 text-gray-500 hover:text-white font-display text-xs uppercase tracking-widest transition-colors">
              <Activity size={16} /> Traçage
            </Link>
            <button
              onClick={() => setViewMode('registrations')}
              className={`flex items-center gap-4 font-display text-xs uppercase tracking-widest transition-colors ${viewMode === 'registrations' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <ClipboardList size={16} /> Inscriptions
            </button>
            <Link to="/" className="flex items-center gap-4 text-gray-500 hover:text-white font-display text-xs uppercase tracking-widest transition-colors">
              <HomeIcon size={16} /> View Site
            </Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-4 text-red-500 font-display text-xs uppercase tracking-widest">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-16 overflow-y-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <X className="text-red-500" size={20} />
              <span className="text-red-400 font-display text-sm">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
            <span className="text-green-400 font-display text-sm">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-display font-bold uppercase">
              {viewMode === 'projects' ? 'Work Management' : 'Inscriptions'}
            </h1>
            <div className="flex items-center gap-1 bg-[#111] border border-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('projects')}
                className={`px-4 py-1.5 text-[10px] font-display uppercase tracking-widest rounded-md transition-all ${viewMode === 'projects' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Projets
              </button>
              <button
                onClick={() => setViewMode('registrations')}
                className={`px-4 py-1.5 text-[10px] font-display uppercase tracking-widest rounded-md transition-all ${viewMode === 'registrations' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Inscriptions
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell variant="dark" />
            {viewMode === 'projects' && (
              <button 
                onClick={() => { setShowAddForm(true); setEditingProject(null); setError(null); }}
                className="px-8 py-3 bg-blue-500 text-white font-display text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> New Project
              </button>
            )}
          </div>
        </header>

        {/* Add Project Form */}
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 p-10 bg-[#111] border border-gray-800 rounded-xl"
          >
            <h2 className="text-xl font-display font-bold uppercase mb-8">Add New Project</h2>
            <form onSubmit={addProject} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Project Title</label>
                  <input 
                    required
                    type="text" 
                    value={newProject.title ?? ''}
                    onChange={e => setNewProject({...newProject, title: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Category</label>
                  <select 
                    value={newProject.category}
                    onChange={e => setNewProject({...newProject, category: e.target.value as any})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase appearance-none"
                  >
                    <option value="Développement" className="bg-[#111]">Développement</option>
                    <option value="Drone" className="bg-[#111]">Drone</option>
                    <option value="Mélangé" className="bg-[#111]">Mélangé</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Description</label>
                <textarea 
                  required
                  value={newProject.description ?? ''}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Thumbnail</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="url"
                    value={newProject.thumbnail || ''}
                    onChange={e => setNewProject({...newProject, thumbnail: e.target.value})}
                    className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                    placeholder="https://example.com/image.jpg"
                  />
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleThumbnailUpload(e, false)}
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg"
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingField === 'thumbnail' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Upload
                  </button>
                </div>
                {newProject.thumbnail && (
                  <div className="mt-2 w-32 h-20 object-cover rounded overflow-hidden">
                    {newProject.thumbnail?.endsWith('.mp4') || newProject.thumbnail?.endsWith('.webm') || newProject.thumbnail?.endsWith('.ogg') ? (
                      <video
                        src={newProject.thumbnail}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img src={newProject.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
              </div>

              {/* Technologies */}
              <div className="space-y-4">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Technologies</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(newProject.technologies || []).map((tech, i) => (
                    <span key={i} className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-xs font-display">
                      {tech}
                      <button type="button" onClick={() => removeTechnology(i)} className="text-gray-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={techInput}
                    onChange={e => setTechInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    className="flex-1 bg-transparent border-b border-gray-800 py-2 focus:border-blue-500 outline-none font-display"
                    placeholder="Add technology..."
                  />
                  <button type="button" onClick={addTechnology} className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors">
                    Add
                  </button>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Media (Images/Videos)</label>
                <div className="grid grid-cols-4 gap-4 mb-2">
                  {(newProject.media || []).map((media, i) => (
                    <div key={i} className="relative group">
                      {media.type === 'image' && media.url ? (
                        <img src={media.url} alt="" className="w-full h-24 object-cover rounded" />
                      ) : media.type === 'image' ? (
                        <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-xs font-display uppercase">No Image</span>
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-xs font-display uppercase">Video</span>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add Image Button */}
                <div className="flex gap-2 mb-2">
                  <input 
                    type="url"
                    value={mediaUrlInput}
                    onChange={e => setMediaUrlInput(e.target.value)}
                    className="flex-1 min-w-[200px] bg-transparent border-b border-gray-800 py-2 focus:border-blue-500 outline-none font-display"
                    placeholder="Image URL..."
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setMediaTypeInput('image');
                      addMedia();
                    }}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={14} /> Add Image
                  </button>
                </div>
                
                {/* Add Video Button */}
                <div className="flex gap-2 mb-2">
                  <input 
                    type="url"
                    value={mediaUrlInput}
                    onChange={e => setMediaUrlInput(e.target.value)}
                    className="flex-1 min-w-[200px] bg-transparent border-b border-gray-800 py-2 focus:border-blue-500 outline-none font-display"
                    placeholder="Video URL..."
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setMediaTypeInput('video');
                      addMedia();
                    }}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={14} /> Add Video
                  </button>
                </div>
                
                {/* Upload Image Button */}
                <div className="flex gap-2 mb-2">
                  <input 
                    type="file"
                    ref={mediaFileInputRef}
                    onChange={handleMediaUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    id="image-upload"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('image-upload') as HTMLInputElement;
                      input?.click();
                    }}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingField === 'media' ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    Upload Image
                  </button>
                </div>
                
                {/* Upload Video Button */}
                <div className="flex gap-2">
                  <input 
                    type="file"
                    ref={mediaFileInputRef}
                    onChange={handleMediaUpload}
                    accept="video/mp4,video/webm,video/ogg"
                    className="hidden"
                    id="video-upload"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('video-upload') as HTMLInputElement;
                      input?.click();
                    }}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingField === 'media' ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    Upload Video
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="onoffswitch">
                  <input 
                    type="checkbox" 
                    name="onoffswitch" 
                    className="onoffswitch-checkbox" 
                    id="switch-active" 
                    checked={newProject.is_active}
                    onChange={e => setNewProject({...newProject, is_active: e.target.checked})}
                  />
                  <label className="onoffswitch-label" htmlFor="switch-active">
                    <span className="onoffswitch-inner"></span>
                    <span className="onoffswitch-switch"></span>
                  </label>
                </div>
                <label htmlFor="switch-active" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Active</label>
              </div>

              <div className="flex items-center gap-3">
                <div className="onoffswitch">
                  <input 
                    type="checkbox" 
                    name="onoffswitch" 
                    className="onoffswitch-checkbox" 
                    id="switch-featured" 
                    checked={newProject.featured}
                    onChange={e => setNewProject({...newProject, featured: e.target.checked})}
                  />
                  <label className="onoffswitch-label" htmlFor="switch-featured">
                    <span className="onoffswitch-inner"></span>
                    <span className="onoffswitch-switch"></span>
                  </label>
                </div>
                <label htmlFor="switch-featured" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Mark as Featured</label>
              </div>

              <div className="flex items-center gap-3">
                <div className="onoffswitch">
                  <input 
                    type="checkbox" 
                    name="onoffswitch" 
                    className="onoffswitch-checkbox" 
                    id="switch-show-registration" 
                    checked={newProject.show_registration}
                    onChange={e => setNewProject({...newProject, show_registration: e.target.checked})}
                  />
                  <label className="onoffswitch-label" htmlFor="switch-show-registration">
                    <span className="onoffswitch-inner"></span>
                    <span className="onoffswitch-switch"></span>
                  </label>
                </div>
                <label htmlFor="switch-show-registration" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Show Registration Button</label>
              </div>
              
              <div className="flex gap-4">
                <button type="submit" className="px-10 py-4 bg-white text-black font-display text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2">
                  <Save size={14} /> Create Project
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-10 py-4 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Edit Project Form */}
        {editingProject && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 p-10 bg-[#111] border border-gray-800 rounded-xl"
          >
            <h2 className="text-xl font-display font-bold uppercase mb-8">Edit Project</h2>
            <form onSubmit={updateProject} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Project Title</label>
                  <input 
                    required
                    type="text" 
                    value={editingProject.title}
                    onChange={e => setEditingProject({...editingProject, title: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Category</label>
                  <select 
                    value={editingProject.category}
                    onChange={e => setEditingProject({...editingProject, category: e.target.value as any})}
                    className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display uppercase appearance-none"
                  >
                    <option value="Développement" className="bg-[#111]">Développement</option>
                    <option value="Drone" className="bg-[#111]">Drone</option>
                    <option value="Mélangé" className="bg-[#111]">Mélangé</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Description</label>
                <textarea 
                  required
                  value={editingProject.description}
                  onChange={e => setEditingProject({...editingProject, description: e.target.value})}
                  className="w-full bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display h-24"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Thumbnail</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="url"
                    value={editingProject.thumbnail || ''}
                    onChange={e => setEditingProject({...editingProject, thumbnail: e.target.value})}
                    className="flex-1 bg-transparent border-b border-gray-800 py-3 focus:border-blue-500 outline-none font-display"
                  />
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleThumbnailUpload(e, true)}
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg"
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingField === 'thumbnail' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Upload
                  </button>
                </div>
                {editingProject.thumbnail && (
                  <div className="mt-2 w-32 h-20 object-cover rounded overflow-hidden">
                    {editingProject.thumbnail?.endsWith('.mp4') || editingProject.thumbnail?.endsWith('.webm') || editingProject.thumbnail?.endsWith('.ogg') ? (
                      <video
                        src={editingProject.thumbnail}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img src={editingProject.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
              </div>

              {/* Media */}
              <div className="space-y-4">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Media (Images/Videos)</label>
                <div className="grid grid-cols-4 gap-4 mb-2">
                  {(editingProject.media || []).map((media, i) => (
                    <div key={i} className="relative group">
                      {media.type === 'image' && media.url ? (
                        <img src={media.url} alt="" className="w-full h-24 object-cover rounded" />
                      ) : media.type === 'image' ? (
                        <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-xs font-display uppercase">No Image</span>
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-xs font-display uppercase">Video</span>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={async () => {
                          const currentMedia = editingProject.media || [];
                          const mediaItem = currentMedia[i];
                          

                          
                          // Only attempt to delete from backend if it has a real ID that exists in the database
                          if (mediaItem.id && !String(mediaItem.id).startsWith('m-')) {
                            try {
                              const response = await authFetch(`${API_BASE_URL}/projects/media/delete/${mediaItem.id}/`, {
                                method: 'DELETE',
                              });
                              
                              if (!response.ok) {
                                console.error('Failed to delete media item. Response status:', response.status);
                                // Continue with local state update even if backend deletion fails
                              }
                            } catch (error) {
                              console.error('Error deleting media item:', error);
                              // Continue with local state update even if there's an error
                            }
                          }
                          
                          // Always update local state to remove the media item from the UI
                          const updated = currentMedia.filter((_, idx) => idx !== i);
                          setEditingProject({
                            ...editingProject,
                            media: updated
                          });
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add Image Button */}
                <div className="flex gap-2 mb-2">
                  <input 
                    type="url"
                    value={mediaUrlInput}
                    onChange={e => setMediaUrlInput(e.target.value)}
                    className="flex-1 min-w-[200px] bg-transparent border-b border-gray-800 py-2 focus:border-blue-500 outline-none font-display"
                    placeholder="Image URL..."
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (mediaUrlInput.trim()) {
                        const currentMedia = editingProject.media || [];
                        const newMediaItem: MediaItem = {
                          id: `m-${Date.now()}`,
                          type: 'image',
                          url: mediaUrlInput.trim(),
                          order: currentMedia.length + 1,
                          likes_count: 0,
                          is_liked: false
                        };
                        setEditingProject({
                          ...editingProject,
                          media: [...currentMedia, newMediaItem],
                          thumbnail: editingProject.thumbnail || mediaUrlInput.trim()
                        });
                        setMediaUrlInput('');
                      }
                    }}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={14} /> Add Image
                  </button>
                </div>
                
                {/* Add Video Button */}
                <div className="flex gap-2 mb-2">
                  <input 
                    type="url"
                    value={mediaUrlInput}
                    onChange={e => setMediaUrlInput(e.target.value)}
                    className="flex-1 min-w-[200px] bg-transparent border-b border-gray-800 py-2 focus:border-blue-500 outline-none font-display"
                    placeholder="Video URL..."
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (mediaUrlInput.trim()) {
                        const currentMedia = editingProject.media || [];
                        const newMediaItem: MediaItem = {
                          id: `m-${Date.now()}`,
                          type: 'video',
                          url: mediaUrlInput.trim(),
                          order: currentMedia.length + 1,
                          likes_count: 0,
                          is_liked: false
                        };
                        setEditingProject({
                          ...editingProject,
                          media: [...currentMedia, newMediaItem],
                          thumbnail: editingProject.thumbnail || mediaUrlInput.trim()
                        });
                        setMediaUrlInput('');
                      }
                    }}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={14} /> Add Video
                  </button>
                </div>
                
                {/* Upload Image Button */}
                <div className="flex gap-2 mb-2">
                  <input 
                    type="file"
                    ref={mediaFileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleMediaUpload(e, true);
                      }
                    }}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('edit-image-upload') as HTMLInputElement;
                      input?.click();
                    }}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingField === 'media' ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    Upload Image
                  </button>
                </div>
                
                {/* Upload Video Button */}
                <div className="flex gap-2">
                  <input 
                    type="file"
                    ref={mediaFileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleMediaUpload(e, true);
                      }
                    }}
                    accept="video/mp4,video/webm,video/ogg"
                    className="hidden"
                    id="edit-video-upload"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('edit-video-upload') as HTMLInputElement;
                      input?.click();
                    }}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingField === 'media' ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    Upload Video
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="onoffswitch">
                  <input 
                    type="checkbox" 
                    name="onoffswitch" 
                    className="onoffswitch-checkbox" 
                    id="switch-edit-active" 
                    checked={editingProject.is_active}
                    onChange={e => setEditingProject({...editingProject, is_active: e.target.checked})}
                  />
                  <label className="onoffswitch-label" htmlFor="switch-edit-active">
                    <span className="onoffswitch-inner"></span>
                    <span className="onoffswitch-switch"></span>
                  </label>
                </div>
                <label htmlFor="switch-edit-active" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Active</label>
              </div>

              <div className="flex items-center gap-3">
                <div className="onoffswitch">
                  <input 
                    type="checkbox" 
                    name="onoffswitch" 
                    className="onoffswitch-checkbox" 
                    id="switch-edit-featured" 
                    checked={editingProject.featured}
                    onChange={e => setEditingProject({...editingProject, featured: e.target.checked})}
                  />
                  <label className="onoffswitch-label" htmlFor="switch-edit-featured">
                    <span className="onoffswitch-inner"></span>
                    <span className="onoffswitch-switch"></span>
                  </label>
                </div>
                <label htmlFor="switch-edit-featured" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Mark as Featured</label>
              </div>

              <div className="flex items-center gap-3">
                <div className="onoffswitch">
                  <input 
                    type="checkbox" 
                    name="onoffswitch" 
                    className="onoffswitch-checkbox" 
                    id="switch-edit-show-registration" 
                    checked={editingProject.show_registration}
                    onChange={e => setEditingProject({...editingProject, show_registration: e.target.checked})}
                  />
                  <label className="onoffswitch-label" htmlFor="switch-edit-show-registration">
                    <span className="onoffswitch-inner"></span>
                    <span className="onoffswitch-switch"></span>
                  </label>
                </div>
                <label htmlFor="switch-edit-show-registration" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Show Registration Button</label>
              </div>
              
              <div className="flex gap-4">
                <button type="submit" className="px-10 py-4 bg-blue-500 text-white font-display text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2">
                  <Save size={14} /> Save Changes
                </button>
                <button type="button" onClick={() => setEditingProject(null)} className="px-10 py-4 bg-transparent border border-gray-800 text-gray-500 font-display text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Projects List */}
        {viewMode === 'registrations' ? (
          /* ── Registrations View ─────────────────────────────── */
          <div>
            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-8">
              {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setRegFilter(f)}
                  className={`px-4 py-1.5 text-[10px] font-display uppercase tracking-widest border rounded transition-all ${regFilter === f ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'}`}
                >
                  {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'confirmed' ? 'Confirmés' : 'Annulés'}
                </button>
              ))}
              <button
                onClick={fetchRegistrations}
                className="ml-auto text-[10px] font-display uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                Actualiser
              </button>
            </div>

            {regLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : registrations.filter(r => regFilter === 'all' || r.status === regFilter).length === 0 ? (
              <div className="text-center py-20 text-gray-600 font-display text-sm uppercase tracking-widest">
                Aucune inscription trouvée
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.filter(r => regFilter === 'all' || r.status === regFilter).map(reg => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-[#111] border border-gray-900 hover:border-gray-700 rounded-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        {/* User info */}
                        <div>
                          <p className="text-[9px] font-display uppercase tracking-widest text-gray-600 mb-1">Utilisateur</p>
                          <p className="font-display font-bold text-sm uppercase text-white">
                            {reg.user_first_name} {reg.user_last_name}
                          </p>
                          <a href={`mailto:${reg.user_email}`} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1">
                            <Mail size={10} /> {reg.user_email}
                          </a>
                          {(reg.phone || reg.user_phone) && (
                            <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Phone size={10} /> {reg.phone || reg.user_phone}
                            </p>
                          )}
                        </div>
                        {/* Project */}
                        <div>
                          <p className="text-[9px] font-display uppercase tracking-widest text-gray-600 mb-1">Projet</p>
                          <p className="font-display text-sm uppercase text-white">{reg.project_title}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{new Date(reg.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        {/* Message */}
                        <div className="col-span-1">
                          <p className="text-[9px] font-display uppercase tracking-widest text-gray-600 mb-1">Message</p>
                          <p className="text-xs text-gray-400 line-clamp-3">
                            {reg.message || <span className="italic text-gray-700">Aucun message</span>}
                          </p>
                        </div>
                        {/* Status */}
                        <div>
                          <p className="text-[9px] font-display uppercase tracking-widest text-gray-600 mb-1">Statut</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-display uppercase tracking-wider ${
                            reg.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            reg.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {reg.status_display}
                          </span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {reg.status !== 'confirmed' && (
                          <button
                            onClick={() => updateRegistrationStatus(reg.id, 'confirmed')}
                            className="px-3 py-1.5 text-[9px] font-display uppercase tracking-widest bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded transition-all"
                          >
                            Confirmer
                          </button>
                        )}
                        {reg.status !== 'cancelled' && (
                          <button
                            onClick={() => updateRegistrationStatus(reg.id, 'cancelled')}
                            className="px-3 py-1.5 text-[9px] font-display uppercase tracking-widest bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-all"
                          >
                            Annuler
                          </button>
                        )}
                        <button
                          onClick={() => openContactModal(reg)}
                          className="px-3 py-1.5 text-[9px] font-display uppercase tracking-widest bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded transition-all text-center"
                        >
                          Contacter
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="p-6 bg-[#111] border border-gray-900 flex justify-between items-center group hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-8">
                <div className="w-20 h-16 bg-gray-900 overflow-hidden rounded">
                  <img src={project.thumbnail} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-widest">{project.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-[10px] font-display text-gray-500 uppercase tracking-[0.2em]">{project.category}</p>
                    {project.featured && (
                      <span className="flex items-center gap-1 text-[8px] font-display text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
                        <Star size={8} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-1">{project.description}</p>
                </div>
              </div>
               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => toggleActive(project.id)}
                     className={`transition-colors ${project.is_active ? 'text-green-500' : 'text-gray-500 hover:text-green-500'}`}
                     title={project.is_active ? "Deactivate" : "Activate"}
                   >
                     <div className={`w-4 h-4 rounded-full ${project.is_active ? 'bg-green-500' : 'bg-gray-600'}`} />
                   </button>
                   <button 
                     onClick={() => toggleFeatured(project.id)}
                     className={`transition-colors ${project.featured ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                     title={project.featured ? "Unmark as Featured" : "Mark as Featured"}
                   >
                     <Star size={16} fill={project.featured ? "currentColor" : "none"} />
                   </button>
                  <button 
                    onClick={() => startEdit(project)} 
                    className="text-gray-500 hover:text-white"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteProject(project.id)} 
                    className="text-gray-500 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )} {/* end viewMode conditional */}
      </main>

      {/* Delete Project Confirmation Modal */}
      {deleteProjectId && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDeleteProjectId(null);
            }
          }}
          onMouseDown={(e) => {
            const modal = document.querySelector('[role="dialog"]');
            if (modal && !modal.contains(e.target as Node)) {
              setDeleteProjectId(null);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-gray-800 p-8 max-w-md w-full"
            tabIndex={-1}
            ref={(el) => {
              if (el) {
                el.focus();
              }
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 id="delete-project-title" className="font-display text-lg font-bold">Delete Project</h3>
              <button 
                onClick={() => setDeleteProjectId(null)} 
                className="hover:text-red-500 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-gray-400">
                Are you sure you want to delete this project? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteProjectId(null)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-display uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-display uppercase tracking-wider transition-colors"
                  autoFocus
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {contactTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-gray-800 p-8 max-w-xl w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-lg font-bold uppercase">Envoyer un message</h3>
              <button onClick={() => setContactTarget(null)} className="hover:text-red-500 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Destinataire: <span className="text-blue-400">{contactTarget.user_email}</span>
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                className="w-full bg-transparent border border-gray-800 py-3 px-4 focus:border-blue-500 outline-none font-display text-sm"
                placeholder="Objet"
              />
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full bg-transparent border border-gray-800 py-3 px-4 focus:border-blue-500 outline-none font-display h-32 text-sm"
                placeholder="Votre message..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setContactTarget(null)}
                className="px-5 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors text-xs font-display uppercase tracking-widest"
              >
                Annuler
              </button>
              <button
                onClick={sendContactMessage}
                disabled={contactSending}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors text-xs font-display uppercase tracking-widest flex items-center gap-2"
              >
                {contactSending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />} Envoyer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

