
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, LogOut, Settings as SettingsIcon, Home as HomeIcon, Star, X, Save, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { STORAGE_KEYS, INITIAL_PROJECTS, API_BASE_URL } from '../../constants';
import { Project } from '../../types';
import { useAuth } from '../../App';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  order: number;
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    category: 'Development',
    description: '',
    technologies: [],
    thumbnail: '',
    media: [],
    featured: false
  });
  const [techInput, setTechInput] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTypeInput, setMediaTypeInput] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<'thumbnail' | 'media' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/`);
      if (response.ok) {
        const data = await response.json();
        const projectsList = data.results || data;
        if (projectsList.length > 0) {
          setProjects(projectsList);
        } else {
          // If API returns empty, use initial projects
          setProjects(INITIAL_PROJECTS);
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
        }
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (saved) {
          setProjects(JSON.parse(saved));
        } else {
          setProjects(INITIAL_PROJECTS);
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) {
        setProjects(JSON.parse(saved));
      } else {
        setProjects(INITIAL_PROJECTS);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
      }
    }
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!token) return null;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_BASE_URL}/upload/`, {
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
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingField('media');
    const url = await uploadImage(file);
    setUploadingField(null);
    
    if (url) {
      const currentMedia = newProject.media || [];
      const newMedia: MediaItem = {
        id: `m-${Date.now()}`,
        type: 'image',
        url: url,
        order: currentMedia.length + 1
      };
      setNewProject({
        ...newProject,
        media: [...currentMedia, newMedia],
        thumbnail: newProject.thumbnail || url
      });
    }
    // Reset file input
    if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== id));
      } else {
        // Fallback to localStorage
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
    }
  };

  const toggleFeatured = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ featured: !project.featured })
      });
      if (response.ok) {
        const updated = projects.map(p => 
          p.id === id ? { ...p, featured: !p.featured } : p
        );
        setProjects(updated);
      } else {
        // Fallback to localStorage
        const updated = projects.map(p => 
          p.id === id ? { ...p, featured: !p.featured } : p
        );
        setProjects(updated);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error updating project:', error);
      const updated = projects.map(p => 
        p.id === id ? { ...p, featured: !p.featured } : p
      );
      setProjects(updated);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
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
        order: currentMedia.length + 1
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
    const project: Project = {
      ...newProject as Project,
      id: Date.now().toString(),
      slug: newProject.title?.toLowerCase().replace(/\s+/g, '-') || '',
      createdAt: new Date().toISOString(),
      featured: newProject.featured || false,
      thumbnail: newProject.thumbnail || 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
      media: newProject.media?.length ? newProject.media : [{ id: 'm-new', type: 'image', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop', order: 1 }]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(project)
      });
      if (response.ok) {
        const created = await response.json();
        setProjects([created, ...projects]);
      } else {
        // Fallback to localStorage
        const updated = [project, ...projects];
        setProjects(updated);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error creating project:', error);
      const updated = [project, ...projects];
      setProjects(updated);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
    }
    
    setShowAddForm(false);
    setNewProject({ title: '', category: 'Development', description: '', technologies: [], media: [], featured: false });
  };

  const updateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${editingProject.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(editingProject)
      });
      if (response.ok) {
        const updated = projects.map(p => p.id === editingProject.id ? editingProject : p);
        setProjects(updated);
      } else {
        // Fallback to localStorage
        const updated = projects.map(p => p.id === editingProject.id ? editingProject : p);
        setProjects(updated);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error updating project:', error);
      const updated = projects.map(p => p.id === editingProject.id ? editingProject : p);
      setProjects(updated);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
    }
    
    setEditingProject(null);
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
            <Link to="/admin/settings" className="flex items-center gap-4 text-gray-500 hover:text-white font-display text-xs uppercase tracking-widest transition-colors">
              <SettingsIcon size={16} /> Settings
            </Link>
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
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-display font-bold uppercase">Work Management</h1>
          <button 
            onClick={() => { setShowAddForm(true); setEditingProject(null); }}
            className="px-8 py-3 bg-blue-500 text-white font-display text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> New Project
          </button>
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
                    value={newProject.title}
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
                    <option value="Development" className="bg-[#111]">Development</option>
                    <option value="Drone" className="bg-[#111]">Drone</option>
                    <option value="Mixed" className="bg-[#111]">Mixed</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-gray-500">Description</label>
                <textarea 
                  required
                  value={newProject.description}
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
                    accept="image/jpeg,image/png,image/gif,image/webp"
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
                  <img src={newProject.thumbnail} alt="Thumbnail" className="mt-2 w-32 h-20 object-cover rounded" />
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
                      {media.type === 'image' ? (
                        <img src={media.url} alt="" className="w-full h-24 object-cover rounded" />
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
                <div className="flex gap-2 flex-wrap">
                  <select 
                    value={mediaTypeInput}
                    onChange={e => setMediaTypeInput(e.target.value as 'image' | 'video')}
                    className="bg-transparent border border-gray-800 px-3 py-2 font-display text-xs uppercase"
                  >
                    <option value="image" className="bg-[#111]">Image</option>
                    <option value="video" className="bg-[#111]">Video</option>
                  </select>
                  <input 
                    type="url"
                    value={mediaUrlInput}
                    onChange={e => setMediaUrlInput(e.target.value)}
                    className="flex-1 min-w-[200px] bg-transparent border-b border-gray-800 py-2 focus:border-blue-500 outline-none font-display"
                    placeholder="Media URL..."
                  />
                  <button type="button" onClick={addMedia} className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors">
                    Add URL
                  </button>
                  <input 
                    type="file"
                    ref={mediaFileInputRef}
                    onChange={handleMediaUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => mediaFileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingField === 'media' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Upload Image
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="featured"
                  checked={newProject.featured}
                  onChange={e => setNewProject({...newProject, featured: e.target.checked})}
                  className="w-4 h-4 bg-transparent border border-gray-800 accent-blue-500"
                />
                <label htmlFor="featured" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Mark as Featured</label>
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
                    <option value="Development" className="bg-[#111]">Development</option>
                    <option value="Drone" className="bg-[#111]">Drone</option>
                    <option value="Mixed" className="bg-[#111]">Mixed</option>
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
                    accept="image/jpeg,image/png,image/gif,image/webp"
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
                  <img src={editingProject.thumbnail} alt="Thumbnail" className="mt-2 w-32 h-20 object-cover rounded" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="edit-featured"
                  checked={editingProject.featured}
                  onChange={e => setEditingProject({...editingProject, featured: e.target.checked})}
                  className="w-4 h-4 bg-transparent border border-gray-800 accent-blue-500"
                />
                <label htmlFor="edit-featured" className="text-[10px] font-display uppercase tracking-widest text-gray-500 cursor-pointer">Mark as Featured</label>
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
      </main>
    </div>
  );
};

export default Dashboard;
