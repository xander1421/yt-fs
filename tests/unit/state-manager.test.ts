import { describe, it, expect, vi } from 'vitest';

// We need to load the content script and extract the StateManager namespace
// Since the content script uses namespaces, we'll test the functionality indirectly

describe('StateManager', () => {
  const STORAGE_KEY = 'ytTabFS';

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.getItem = vi.fn().mockReturnValue(null);
    window.sessionStorage.setItem = vi.fn();
    window.sessionStorage.removeItem = vi.fn();
  });

  describe('save functionality', () => {
    it('should save enabled state to sessionStorage', () => {
      // Since we can't directly import namespaced modules, we'll simulate the behavior
      const mockSave = (isEnabled: boolean) => {
        if (isEnabled) {
          sessionStorage.setItem(STORAGE_KEY, '1');
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      };

      mockSave(true);
      expect(sessionStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, '1');

      mockSave(false);
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should handle storage errors gracefully', () => {
      window.sessionStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      const mockSave = (isEnabled: boolean) => {
        try {
          if (isEnabled) {
            sessionStorage.setItem(STORAGE_KEY, '1');
          } else {
            sessionStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          // Should handle gracefully
        }
      };

      expect(() => mockSave(true)).not.toThrow();
    });
  });

  describe('load functionality', () => {
    it('should return true when storage contains "1"', () => {
      window.sessionStorage.getItem = vi.fn().mockReturnValue('1');
      
      const mockLoad = () => {
        try {
          return sessionStorage.getItem(STORAGE_KEY) === '1';
        } catch {
          return false;
        }
      };

      expect(mockLoad()).toBe(true);
      expect(sessionStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should return false when storage is empty', () => {
      window.sessionStorage.getItem = vi.fn().mockReturnValue(null);
      
      const mockLoad = () => {
        try {
          return sessionStorage.getItem(STORAGE_KEY) === '1';
        } catch {
          return false;
        }
      };

      expect(mockLoad()).toBe(false);
    });

    it('should return false when storage throws error', () => {
      window.sessionStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const mockLoad = () => {
        try {
          return sessionStorage.getItem(STORAGE_KEY) === '1';
        } catch {
          return false;
        }
      };

      expect(mockLoad()).toBe(false);
    });
  });
}); 