import { getFullBackendUrl, API_BASE_URL } from '../urlHelpers';

describe('urlHelpers', () => {
  // Save original env var
  const originalApiUrl = process.env.REACT_APP_API_URL;

  afterEach(() => {
    // Restore env var
    process.env.REACT_APP_API_URL = originalApiUrl;
  });

  describe('getFullBackendUrl', () => {
    it('returns already full URLs unchanged', () => {
      expect(getFullBackendUrl('http://example.com/test.pdf')).toBe('http://example.com/test.pdf');
      expect(getFullBackendUrl('https://example.com/test.pdf')).toBe('https://example.com/test.pdf');
    });

    it('converts relative paths to full URLs', () => {
      process.env.REACT_APP_API_URL = 'https://api.example.com/api';
      expect(getFullBackendUrl('/docs/test.pdf')).toBe('https://api.example.com/docs/test.pdf');
      expect(getFullBackendUrl('docs/test.pdf')).toBe('https://api.example.com/docs/test.pdf');
      expect(getFullBackendUrl('/pdfs/document.pdf')).toBe('https://api.example.com/pdfs/document.pdf');
    });

    it('handles empty or null paths', () => {
      process.env.REACT_APP_API_URL = 'https://api.example.com/api';
      expect(getFullBackendUrl('')).toBe('https://api.example.com');
      expect(getFullBackendUrl(null)).toBe('https://api.example.com');
      expect(getFullBackendUrl(undefined)).toBe('https://api.example.com');
    });

    it('uses default localhost URL when env var not set', () => {
      delete process.env.REACT_APP_API_URL;
      expect(getFullBackendUrl('/docs/test.pdf')).toBe('http://localhost:5000/docs/test.pdf');
    });

    it('properly removes /api suffix from base URL', () => {
      process.env.REACT_APP_API_URL = 'https://backend.com/api';
      expect(getFullBackendUrl('/docs/test.pdf')).toBe('https://backend.com/docs/test.pdf');
      
      process.env.REACT_APP_API_URL = 'https://backend.com/api/';
      expect(getFullBackendUrl('/docs/test.pdf')).toBe('https://backend.com/docs/test.pdf');
    });
  });
});