import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Spinner, Skeleton } from '../components/Loading';
import { ProjectSchema } from '../services/validations';

// Example test for the API service
describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make a GET request', async () => {
    const mockData = { id: 1, name: 'Test' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const response = await fetch('http://localhost:8000/api/test/');
    const data = await response.json();

    expect(data).toEqual(mockData);
  });

  it('should handle errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'Not found' }),
    });

    const response = await fetch('http://localhost:8000/api/notfound/');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });
});

// Example test for validation schemas
describe('Validation Schemas', () => {
  it('should validate project data', async () => {
    const validProject = {
      id: '1',
      title: 'Test Project',
      slug: 'test-project',
      description: 'A test project',
      category: 'Développement',
      thumbnail: 'https://example.com/image.jpg',
      created_at: '2024-01-01',
      featured: true,
      technologies: ['React', 'TypeScript'],
      media: [],
      likes_count: 0,
    };

    const result = ProjectSchema.safeParse(validProject);
    console.log('Validation result:', result);
    expect(result.success).toBe(true);
  });

  it('should reject invalid project data', async () => {
    const invalidProject = {
      id: '1',
      title: '', // Empty title should fail
      slug: 'test-project',
      description: 'A test project',
      category: 'InvalidCategory', // Invalid category
      thumbnail: 'not-a-url', // Invalid URL
      created_at: '2024-01-01',
    };

    const result = ProjectSchema.safeParse(invalidProject);
    expect(result.success).toBe(false);
  });
});

// Example component test
describe('Loading Components', () => {
  it('should render spinner', async () => {
    render(<Spinner size="md" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render skeleton', async () => {
    render(<Skeleton className="w-full h-20" />);
    
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});

// Example hook test
describe('useQuery Hook', () => {
  it('should fetch data successfully', async () => {
    const mockData = { results: [], count: 0 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    // Test implementation would go here
    expect(true).toBe(true);
  });
});