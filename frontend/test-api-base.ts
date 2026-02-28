import { API_BASE_URL } from './constants';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);

// Test buildURL function
import { buildURL } from './services/api';
console.log('buildURL("/projects/"):', buildURL('/projects/'));
console.log('buildURL("/settings/"):', buildURL('/settings/'));
console.log('buildURL("/auth/login/"):', buildURL('/auth/login/'));
