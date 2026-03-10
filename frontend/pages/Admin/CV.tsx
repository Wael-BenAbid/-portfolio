import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { motion } from 'framer-motion';
import { Save, LayoutDashboard, Briefcase, GraduationCap, Award, Code, Globe2, Heart, User, Plus, Trash2, Edit2, X, Loader2, MapPin, Upload } from 'lucide-react';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../components/BackButton';
import { API_BASE_URL } from '../../constants';

interface SiteSettings {
  id?: number;
  cv_full_name: string;
  cv_job_title: string;
  cv_email: string;
  cv_phone: string;
  cv_location: string;
  cv_profile_image: string;
  cv_summary: string;
  location: string;
  latitude: number;
  longitude: number;
  instagram_url: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
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
  percentage: number;
  order: number;
}

interface CVCertification {
  id?: number;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string | null;
  credential_id: string;
  credential_url: string;
  order: number;
}

interface CVProject {
  id?: number;
  title: string;
  description: string;
  technologies: string[];
  github_url: string;
  live_url?: string;
  image_url?: string;
  order: number;
}

interface CVInterest {
  id?: number;
  name: string;
  icon: string;
  order: number;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  bio: string;
  profile_image: string;
  is_active: boolean;
  created_at: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  cv_full_name: '',
  cv_job_title: '',
  cv_email: '',
  cv_phone: '',
  cv_location: '',
  cv_profile_image: '',
  cv_summary: '',
  location: '',
  latitude: 0,
  longitude: 0,
  instagram_url: '',
  linkedin_url: '',
  github_url: '',
  twitter_url: '',
};

const CV: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [experiences, setExperiences] = useState<CVExperience[]>([]);
  const [education, setEducation] = useState<CVEducation[]>([]);
  const [skills, setSkills] = useState<CVSkill[]>([]);
  const [languages, setLanguages] = useState<CVLanguage[]>([]);
  const [certifications, setCertifications] = useState<CVCertification[]>([]);
  const [cvProjects, setCVProjects] = useState<CVProject[]>([]);
  const [interests, setInterests] = useState<CVInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [editingExperience, setEditingExperience] = useState<CVExperience | null>(null);
  const [editingEducation, setEditingEducation] = useState<CVEducation | null>(null);
  const [editingSkill, setEditingSkill] = useState<CVSkill | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<CVLanguage | null>(null);
  const [editingCertification, setEditingCertification] = useState<CVCertification | null>(null);
  const [editingCVProject, setEditingCVProject] = useState<CVProject | null>(null);
  const [editingInterest, setEditingInterest] = useState<CVInterest | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchCVData();
  }, [token]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Convert null values to empty strings to prevent controlled/uncontrolled input warnings
        const sanitized = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v === null ? (DEFAULT_SETTINGS as Record<string, unknown>)[k] ?? '' : v])
        );
        setSettings({ ...DEFAULT_SETTINGS, ...sanitized } as SiteSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchCVData = async () => {
    try {
      const [expRes, eduRes, skillRes, langRes, certRes, projRes, intRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cv/experiences/`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/cv/education/`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/cv/skills/`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/cv/languages/`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/cv/certifications/`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/cv/projects/`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/cv/interests/`, { credentials: 'include' })
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
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('field', field);

    setUploading(true);
    setUploadingField(field);

    try {
      const response = await fetch(`${API_BASE_URL}/settings/upload/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, [field]: data.url }));
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploading(false);
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        showToast('Settings saved successfully!', 'success');
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const renderPersonalTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={settings.cv_full_name}
              onChange={e => setSettings({ ...settings, cv_full_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
            <input
              type="text"
              value={settings.cv_job_title}
              onChange={e => setSettings({ ...settings, cv_job_title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Software Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={settings.cv_email}
              onChange={e => setSettings({ ...settings, cv_email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={settings.cv_phone}
              onChange={e => setSettings({ ...settings, cv_phone: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={settings.cv_location}
              onChange={e => setSettings({ ...settings, cv_location: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 overflow-hidden">
            {settings.cv_profile_image ? (
              <img
                src={settings.cv_profile_image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={48} />
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              ref={profileInputRef}
              onChange={(e) => handleImageUpload(e, 'cv_profile_image')}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
            />
            <button
              onClick={() => profileInputRef.current?.click()}
              disabled={uploading && uploadingField === 'cv_profile_image'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading && uploadingField === 'cv_profile_image' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload New Image
                </>
              )}
            </button>
            <p className="text-sm text-gray-400 mt-2">JPG, PNG, GIF or WebP (Max 5MB)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Professional Summary</h3>
        <textarea
          value={settings.cv_summary}
          onChange={e => setSettings({ ...settings, cv_summary: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Write a brief professional summary..."
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn</label>
            <input
              type="url"
              value={settings.linkedin_url}
              onChange={e => setSettings({ ...settings, linkedin_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">GitHub</label>
            <input
              type="url"
              value={settings.github_url}
              onChange={e => setSettings({ ...settings, github_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://github.com/yourusername"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Twitter</label>
            <input
              type="url"
              value={settings.twitter_url}
              onChange={e => setSettings({ ...settings, twitter_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://twitter.com/yourusername"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
            <input
              type="url"
              value={settings.instagram_url}
              onChange={e => setSettings({ ...settings, instagram_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://instagram.com/yourusername"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const handleSaveExperience = async () => {
    if (!editingExperience) return;
    try {
      const method = editingExperience.id ? 'PUT' : 'POST';
      const url = editingExperience.id 
        ? `${API_BASE_URL}/cv/experiences/${editingExperience.id}/`
        : `${API_BASE_URL}/cv/experiences/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingExperience),
        credentials: 'include',
      });

      if (response.ok) {
        const savedExperience = await response.json();
        if (editingExperience.id) {
          setExperiences(prev => prev.map(exp => exp.id === savedExperience.id ? savedExperience : exp));
        } else {
          setExperiences(prev => [...prev, savedExperience]);
        }
        setEditingExperience(null);
        showToast('Experience saved successfully!', 'success');
      } else {
        console.error('Failed to save experience');
        showToast('Failed to save experience', 'error');
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      showToast('Error saving experience', 'error');
    }
  };

  const handleDeleteExperience = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cv/experiences/${id}/`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        setExperiences(prev => prev.filter(exp => exp.id !== id));
        showToast('Experience deleted successfully!', 'success');
      } else {
        console.error('Failed to delete experience');
        showToast('Failed to delete experience', 'error');
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
      showToast('Error deleting experience', 'error');
    }
  };

  const renderExperienceTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Experience</h3>
          <button
            onClick={() => setEditingExperience({
              title: '',
              company: '',
              location: '',
              start_date: '',
              end_date: null,
              is_current: false,
              description: '',
              order: experiences.length
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Experience
          </button>
        </div>
        <div className="space-y-4">
          {experiences.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Briefcase size={48} className="mx-auto mb-4" />
              <p>No experience entries yet</p>
            </div>
          ) : (
            experiences.map(exp => (
              <div key={exp.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{exp.title}</h4>
                    <p className="text-sm text-gray-400">{exp.company}, {exp.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingExperience(exp)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                </p>
                <p className="text-sm text-gray-400">{exp.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Experience Modal */}
      {editingExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingExperience.id ? 'Edit Experience' : 'Add Experience'}
              </h3>
              <button
                onClick={() => setEditingExperience(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                <input
                  type="text"
                  value={editingExperience.title}
                  onChange={(e) => setEditingExperience({ ...editingExperience, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                <input
                  type="text"
                  value={editingExperience.company}
                  onChange={(e) => setEditingExperience({ ...editingExperience, company: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Tech Company Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={editingExperience.location}
                  onChange={(e) => setEditingExperience({ ...editingExperience, location: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={editingExperience.start_date}
                    onChange={(e) => setEditingExperience({ ...editingExperience, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={editingExperience.end_date || ''}
                    onChange={(e) => setEditingExperience({ ...editingExperience, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editingExperience.is_current}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingExperience.is_current}
                  onChange={(e) => setEditingExperience({ ...editingExperience, is_current: e.target.checked, end_date: e.target.checked ? null : editingExperience.end_date })}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-300">I'm currently working here</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingExperience.description}
                  onChange={(e) => setEditingExperience({ ...editingExperience, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your responsibilities and achievements..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingExperience(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExperience}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEducationTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Education</h3>
          <button
            onClick={() => setEditingEducation({
              degree: '',
              institution: '',
              location: '',
              start_date: '',
              end_date: null,
              is_current: false,
              description: '',
              gpa: '',
              order: education.length
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Education
          </button>
        </div>
        <div className="space-y-4">
          {education.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <GraduationCap size={48} className="mx-auto mb-4" />
              <p>No education entries yet</p>
            </div>
          ) : (
            education.map(edu => (
              <div key={edu.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{edu.degree}</h4>
                    <p className="text-sm text-gray-400">{edu.institution}, {edu.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingEducation(edu)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
                </p>
                <p className="text-sm text-gray-400">{edu.description}</p>
                {edu.gpa && <p className="text-sm text-gray-400">GPA: {edu.gpa}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Education Modal */}
      {editingEducation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingEducation.id ? 'Edit Education' : 'Add Education'}
              </h3>
              <button
                onClick={() => setEditingEducation(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Degree</label>
                <input
                  type="text"
                  value={editingEducation.degree}
                  onChange={(e) => setEditingEducation({ ...editingEducation, degree: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Bachelor of Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Institution</label>
                <input
                  type="text"
                  value={editingEducation.institution}
                  onChange={(e) => setEditingEducation({ ...editingEducation, institution: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. University of Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={editingEducation.location}
                  onChange={(e) => setEditingEducation({ ...editingEducation, location: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Boston, MA"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={editingEducation.start_date}
                    onChange={(e) => setEditingEducation({ ...editingEducation, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={editingEducation.end_date || ''}
                    onChange={(e) => setEditingEducation({ ...editingEducation, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editingEducation.is_current}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingEducation.is_current}
                  onChange={(e) => setEditingEducation({ ...editingEducation, is_current: e.target.checked, end_date: e.target.checked ? null : editingEducation.end_date })}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-300">I'm currently studying here</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingEducation.description}
                  onChange={(e) => setEditingEducation({ ...editingEducation, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your program and achievements..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">GPA</label>
                <input
                  type="text"
                  value={editingEducation.gpa}
                  onChange={(e) => setEditingEducation({ ...editingEducation, gpa: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 3.8/4.0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingEducation(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEducation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const getSkillPercentageByLevel = (level: string): number => {
    switch (level) {
      case 'beginner': return 30;
      case 'intermediate': return 60;
      case 'advanced': return 80;
      case 'expert': return 95;
      default: return 0;
    }
  };

  const renderSkillsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Skills</h3>
          <button
            onClick={() => setEditingSkill({
              name: '',
              level: '',
              category: '',
              percentage: 0,
              order: skills.length
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Skill
          </button>
        </div>
        <div className="space-y-4">
          {skills.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Code size={48} className="mx-auto mb-4" />
              <p>No skills added yet</p>
            </div>
          ) : (
            skills.map(skill => (
              <div key={skill.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{skill.name}</h4>
                    <p className="text-sm text-gray-400">{skill.category} - {skill.level}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingSkill(skill)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {skill.percentage > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>Proficiency</span>
                      <span>{skill.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${skill.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Skills Modal */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingSkill.id ? 'Edit Skill' : 'Add Skill'}
              </h3>
              <button
                onClick={() => setEditingSkill(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Skill Name</label>
                <input
                  type="text"
                  value={editingSkill.name}
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. JavaScript"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <div className="space-y-2">
                  <select
                    value={editingSkill.category}
                    onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    <option value="technical">Technical</option>
                    <option value="language">Language</option>
                    <option value="soft">Soft Skills</option>
                    <option value="tool">Tools & Software</option>
                    <option value="backend">Backend</option>
                    <option value="frontend">Front End</option>
                    <option value="monitoring">Monitoring & CI/CD</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={editingSkill.category}
                    onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Or type custom category..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                <select
                  value={editingSkill.level}
                  onChange={(e) => setEditingSkill({ 
                    ...editingSkill, 
                    level: e.target.value,
                    percentage: getSkillPercentageByLevel(e.target.value)
                  })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Proficiency (%)</label>
                <input
                  type="number"
                  value={editingSkill.percentage}
                  onChange={(e) => setEditingSkill({ ...editingSkill, percentage: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  placeholder="e.g. 90"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingSkill(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLanguagesTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Languages</h3>
          <button
            onClick={() => setEditingLanguage({
              name: '',
              level: '',
              percentage: 50,
              order: languages.length
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Language
          </button>
        </div>
        <div className="space-y-4">
          {languages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Globe2 size={48} className="mx-auto mb-4" />
              <p>No languages added yet</p>
            </div>
          ) : (
            languages.map(lang => (
              <div key={lang.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white">{lang.name}</h4>
                    <p className="text-sm text-gray-400">{lang.level}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingLanguage(lang)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteLanguage(lang.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Languages Modal */}
      {editingLanguage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingLanguage.id ? 'Edit Language' : 'Add Language'}
              </h3>
              <button
                onClick={() => setEditingLanguage(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Language Name</label>
                <input
                  type="text"
                  value={editingLanguage.name}
                  onChange={(e) => setEditingLanguage({ ...editingLanguage, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. French"
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                <select
                  value={editingLanguage.level}
                  onChange={(e) => {
                    const newLevel = e.target.value;
                    // Set percentage based on level
                    let newPercentage = 50; // Default
                    switch(newLevel) {
                      case 'native':
                      case 'c2':
                        newPercentage = 100;
                        break;
                      case 'fluent':
                      case 'c1':
                        newPercentage = 90;
                        break;
                      case 'advanced':
                      case 'b2':
                        newPercentage = 75;
                        break;
                      case 'intermediate':
                      case 'b1':
                        newPercentage = 60;
                        break;
                      case 'basic':
                      case 'a2':
                        newPercentage = 40;
                        break;
                      case 'a1':
                        newPercentage = 20;
                        break;
                    }
                    setEditingLanguage({ ...editingLanguage, level: newLevel, percentage: newPercentage });
                  }}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="native">Native</option>
                  <option value="fluent">Fluent</option>
                  <option value="advanced">Advanced</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="basic">Basic</option>
                  <option value="a1">A1 (Beginner)</option>
                  <option value="a2">A2 (Elementary)</option>
                  <option value="b1">B1 (Intermediate)</option>
                  <option value="b2">B2 (Upper Intermediate)</option>
                  <option value="c1">C1 (Advanced)</option>
                  <option value="c2">C2 (Proficient)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Proficiency %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingLanguage.percentage || 50}
                  onChange={(e) => setEditingLanguage({ ...editingLanguage, percentage: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingLanguage(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLanguage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCertificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Certifications</h3>
          <button
            onClick={() => setEditingCertification({
              name: '',
              issuing_organization: '',
              issue_date: '',
              expiration_date: null,
              credential_id: '',
              credential_url: '',
              order: certifications.length
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Certification
          </button>
        </div>
        <div className="space-y-4">
          {certifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Award size={48} className="mx-auto mb-4" />
              <p>No certifications added yet</p>
            </div>
          ) : (
            certifications.map(cert => (
              <div key={cert.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{cert.name}</h4>
                    <p className="text-sm text-gray-400">{cert.issuing_organization}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCertification(cert)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCertification(cert.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  {cert.issue_date} - {cert.expiration_date || 'No Expiration'}
                </p>
                {cert.credential_id && <p className="text-sm text-gray-400">ID: {cert.credential_id}</p>}
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    View Credential
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Certifications Modal */}
      {editingCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingCertification.id ? 'Edit Certification' : 'Add Certification'}
              </h3>
              <button
                onClick={() => setEditingCertification(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Certification Name</label>
                <input
                  type="text"
                  value={editingCertification.name}
                  onChange={(e) => setEditingCertification({ ...editingCertification, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. AWS Certified Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Issuing Organization</label>
                <input
                  type="text"
                  value={editingCertification.issuing_organization}
                  onChange={(e) => setEditingCertification({ ...editingCertification, issuing_organization: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Amazon Web Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Issue Date</label>
                <input
                  type="date"
                  value={editingCertification.issue_date}
                  onChange={(e) => setEditingCertification({ ...editingCertification, issue_date: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Expiration Date (optional)</label>
                <input
                  type="date"
                  value={editingCertification.expiration_date || ''}
                  onChange={(e) => setEditingCertification({ ...editingCertification, expiration_date: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Credential ID (optional)</label>
                <input
                  type="text"
                  value={editingCertification.credential_id}
                  onChange={(e) => setEditingCertification({ ...editingCertification, credential_id: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. ABC12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Credential URL (optional)</label>
                <input
                  type="url"
                  value={editingCertification.credential_url}
                  onChange={(e) => setEditingCertification({ ...editingCertification, credential_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://verify.aws.amazon.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingCertification(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCertification}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Projects</h3>
          <button
            onClick={() => setEditingCVProject({
              title: '',
              description: '',
              technologies: [],
              github_url: '',
              live_url: '',
              image_url: '',
              order: cvProjects.length
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Project
          </button>
        </div>
        <div className="space-y-4">
          {cvProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Code size={48} className="mx-auto mb-4" />
              <p>No projects added yet</p>
            </div>
          ) : (
            cvProjects.map(proj => (
              <div key={proj.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{proj.title}</h4>
                    <p className="text-sm text-gray-400">{proj.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCVProject(proj)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {proj.technologies.map(tech => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      GitHub
                    </a>
                  )}
                  {proj.live_url && (
                    <a
                      href={proj.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CV Projects Modal */}
      {editingCVProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingCVProject.id ? 'Edit Project' : 'Add Project'}
              </h3>
              <button
                onClick={() => setEditingCVProject(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
                <input
                  type="text"
                  value={editingCVProject.title}
                  onChange={(e) => setEditingCVProject({ ...editingCVProject, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. E-commerce Platform"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingCVProject.description}
                  onChange={(e) => setEditingCVProject({ ...editingCVProject, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your project..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={editingCVProject.technologies.join(', ')}
                  onChange={(e) => setEditingCVProject({ ...editingCVProject, technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. React, Node.js, MongoDB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL (optional)</label>
                <input
                  type="url"
                  value={editingCVProject.github_url}
                  onChange={(e) => setEditingCVProject({ ...editingCVProject, github_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://github.com/username/project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Live URL (optional)</label>
                <input
                  type="url"
                  value={editingCVProject.live_url}
                  onChange={(e) => setEditingCVProject({ ...editingCVProject, live_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://project-demo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  value={editingCVProject.image_url}
                  onChange={(e) => setEditingCVProject({ ...editingCVProject, image_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/project-image.jpg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingCVProject(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCVProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInterestsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Interests</h3>
          <button
            onClick={() => setEditingInterest({
              name: '',
              icon: '',
              order: interests.length
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Interest
          </button>
        </div>
        <div className="space-y-4">
          {interests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Heart size={48} className="mx-auto mb-4" />
              <p>No interests added yet</p>
            </div>
          ) : (
            interests.map(interest => (
              <div key={interest.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white">{interest.name}</h4>
                    {interest.icon && <p className="text-sm text-gray-400">{interest.icon}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingInterest(interest)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteInterest(interest.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Interests Modal */}
      {editingInterest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingInterest.id ? 'Edit Interest' : 'Add Interest'}
              </h3>
              <button
                onClick={() => setEditingInterest(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Interest Name</label>
                <input
                  type="text"
                  value={editingInterest.name}
                  onChange={(e) => setEditingInterest({ ...editingInterest, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Photography"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon (optional)</label>
                <input
                  type="text"
                  value={editingInterest.icon}
                  onChange={(e) => setEditingInterest({ ...editingInterest, icon: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 📷"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingInterest(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInterest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleSaveEducation = async () => {
    if (!editingEducation) return;
    try {
      const method = editingEducation.id ? 'PUT' : 'POST';
      const url = editingEducation.id 
        ? `${API_BASE_URL}/cv/education/${editingEducation.id}/`
        : `${API_BASE_URL}/cv/education/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEducation),
        credentials: 'include',
      });

      if (response.ok) {
        const savedEducation = await response.json();
        if (editingEducation.id) {
          setEducation(prev => prev.map(edu => edu.id === savedEducation.id ? savedEducation : edu));
        } else {
          setEducation(prev => [...prev, savedEducation]);
        }
        setEditingEducation(null);
        showToast('Education saved successfully!', 'success');
      } else {
        console.error('Failed to save education');
        showToast('Failed to save education', 'error');
      }
    } catch (error) {
      console.error('Error saving education:', error);
      showToast('Error saving education', 'error');
    }
  };

  const handleDeleteEducation = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cv/education/${id}/`, {
        credentials: 'include',
        
        method: 'DELETE',
        
      });

      if (response.ok) {
        setEducation(prev => prev.filter(edu => edu.id !== id));
      }
    } catch (error) {
      console.error('Error deleting education:', error);
    }
  };

  const handleSaveSkill = async () => {
    if (!editingSkill) return;
    try {
      const method = editingSkill.id ? 'PUT' : 'POST';
      const url = editingSkill.id 
        ? `${API_BASE_URL}/cv/skills/${editingSkill.id}/`
        : `${API_BASE_URL}/cv/skills/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSkill),
        credentials: 'include',
      });

      if (response.ok) {
        const savedSkill = await response.json();
        if (editingSkill.id) {
          setSkills(prev => prev.map(skill => skill.id === savedSkill.id ? savedSkill : skill));
        } else {
          setSkills(prev => [...prev, savedSkill]);
        }
        setEditingSkill(null);
        showToast('Skill saved successfully!', 'success');
      } else {
        console.error('Failed to save skill');
        showToast('Failed to save skill', 'error');
      }
    } catch (error) {
      console.error('Error saving skill:', error);
      showToast('Error saving skill', 'error');
    }
  };

  const handleDeleteSkill = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cv/skills/${id}/`, {
        credentials: 'include',
        
        method: 'DELETE',
        
      });

      if (response.ok) {
        setSkills(prev => prev.filter(skill => skill.id !== id));
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  const handleSaveLanguage = async () => {
    if (!editingLanguage) return;
    try {
      const method = editingLanguage.id ? 'PUT' : 'POST';
      const url = editingLanguage.id 
        ? `${API_BASE_URL}/cv/languages/${editingLanguage.id}/`
        : `${API_BASE_URL}/cv/languages/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingLanguage),
        credentials: 'include',
      });

      if (response.ok) {
        const savedLanguage = await response.json();
        if (editingLanguage.id) {
          setLanguages(prev => prev.map(lang => lang.id === savedLanguage.id ? savedLanguage : lang));
        } else {
          setLanguages(prev => [...prev, savedLanguage]);
        }
        setEditingLanguage(null);
        showToast('Language saved successfully!', 'success');
      } else {
        console.error('Failed to save language');
        showToast('Failed to save language', 'error');
      }
    } catch (error) {
      console.error('Error saving language:', error);
      showToast('Error saving language', 'error');
    }
  };

  const handleDeleteLanguage = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cv/languages/${id}/`, {
        credentials: 'include',
        
        method: 'DELETE',
        
      });

      if (response.ok) {
        setLanguages(prev => prev.filter(lang => lang.id !== id));
      }
    } catch (error) {
      console.error('Error deleting language:', error);
    }
  };

  const handleSaveCertification = async () => {
    if (!editingCertification) return;
    try {
      const method = editingCertification.id ? 'PUT' : 'POST';
      const url = editingCertification.id 
        ? `${API_BASE_URL}/cv/certifications/${editingCertification.id}/`
        : `${API_BASE_URL}/cv/certifications/`;

      // Fix field names for backend
      const { issuing_organization, expiration_date, ...rest } = editingCertification;
      const backendData = {
        ...rest,
        issuer: issuing_organization,
        expiry_date: expiration_date,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
        credentials: 'include',
      });

      if (response.ok) {
        const savedCertification = await response.json();
        if (editingCertification.id) {
          setCertifications(prev => prev.map(cert => cert.id === savedCertification.id ? savedCertification : cert));
        } else {
          setCertifications(prev => [...prev, savedCertification]);
        }
        setEditingCertification(null);
        showToast('Certification saved successfully!', 'success');
      } else {
        console.error('Failed to save certification');
        showToast('Failed to save certification', 'error');
      }
    } catch (error) {
      console.error('Error saving certification:', error);
      showToast('Error saving certification', 'error');
    }
  };

  const handleDeleteCertification = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cv/certifications/${id}/`, {
        credentials: 'include',
        
        method: 'DELETE',
        
      });

      if (response.ok) {
        setCertifications(prev => prev.filter(cert => cert.id !== id));
      }
    } catch (error) {
      console.error('Error deleting certification:', error);
    }
  };

  const handleSaveCVProject = async () => {
    if (!editingCVProject) return;
    try {
      const method = editingCVProject.id ? 'PUT' : 'POST';
      const url = editingCVProject.id 
        ? `${API_BASE_URL}/cv/projects/${editingCVProject.id}/`
        : `${API_BASE_URL}/cv/projects/`;

      // Fix field names for backend
      const backendData = {
        ...editingCVProject,
        url: editingCVProject.live_url,
        technologies: editingCVProject.technologies,
      };
      delete backendData.live_url;
      delete backendData.image_url;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
        credentials: 'include',
      });

      if (response.ok) {
        const savedProject = await response.json();
        if (editingCVProject.id) {
          setCVProjects(prev => prev.map(proj => proj.id === savedProject.id ? savedProject : proj));
        } else {
          setCVProjects(prev => [...prev, savedProject]);
        }
        setEditingCVProject(null);
        showToast('Project saved successfully!', 'success');
      } else {
        console.error('Failed to save project');
        showToast('Failed to save project', 'error');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      showToast('Error saving project', 'error');
    }
  };

  const handleDeleteProject = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cv/projects/${id}/`, {
        credentials: 'include',
        
        method: 'DELETE',
        
      });

      if (response.ok) {
        setCVProjects(prev => prev.filter(proj => proj.id !== id));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleSaveInterest = async () => {
    if (!editingInterest) return;
    try {
      const method = editingInterest.id ? 'PUT' : 'POST';
      const url = editingInterest.id 
        ? `${API_BASE_URL}/cv/interests/${editingInterest.id}/`
        : `${API_BASE_URL}/cv/interests/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingInterest),
        credentials: 'include',
      });

      if (response.ok) {
        const savedInterest = await response.json();
        if (editingInterest.id) {
          setInterests(prev => prev.map(interest => interest.id === savedInterest.id ? savedInterest : interest));
        } else {
          setInterests(prev => [...prev, savedInterest]);
        }
        setEditingInterest(null);
        showToast('Interest saved successfully!', 'success');
      } else {
        console.error('Failed to save interest');
        showToast('Failed to save interest', 'error');
      }
    } catch (error) {
      console.error('Error saving interest:', error);
      showToast('Error saving interest', 'error');
    }
  };

  const handleDeleteInterest = async (id: number | undefined) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cv/interests/${id}/`, {
        credentials: 'include',
        
        method: 'DELETE',
        
      });

      if (response.ok) {
        setInterests(prev => prev.filter(interest => interest.id !== id));
      }
    } catch (error) {
      console.error('Error deleting interest:', error);
    }
  };

  const tabs = [
    { id: 'personal', label: 'CV Personal', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'languages', label: 'Languages', icon: Globe2 },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'projects', label: 'CV Projects', icon: Code },
    { id: 'interests', label: 'Interests', icon: Heart },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex h-screen">
        <aside className="w-64 bg-[#1a1a1a] border-r border-gray-700 p-6 flex flex-col">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton className="w-full" />
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
            <p className="text-sm text-gray-400">CV Management</p>
          </div>
          
          <nav className="flex-1 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-700">
            <button
              onClick={() => window.location.href = '/admin'}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
            >
              <LayoutDashboard size={20} />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                <Save size={20} />
                Save Changes
              </button>
            </div>

            {activeTab === 'personal' && renderPersonalTab()}
            {activeTab === 'experience' && renderExperienceTab()}
            {activeTab === 'education' && renderEducationTab()}
            {activeTab === 'skills' && renderSkillsTab()}
            {activeTab === 'languages' && renderLanguagesTab()}
            {activeTab === 'certifications' && renderCertificationsTab()}
            {activeTab === 'projects' && renderProjectsTab()}
            {activeTab === 'interests' && renderInterestsTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CV;
