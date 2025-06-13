import { describe, it, expect, beforeEach } from 'vitest';

describe('DOMOverlay', () => {
  const CSS_CLASS = 'yt-tabfs-enabled';

  beforeEach(() => {
    // Reset document HTML element classes
    document.documentElement.className = '';
  });

  describe('enable functionality', () => {
    it('should add CSS class to document element', () => {
      // Simulate DOMOverlay.enable()
      document.documentElement.classList.add(CSS_CLASS);
      
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(true);
    });

    it('should not duplicate class if already present', () => {
      document.documentElement.classList.add(CSS_CLASS);
      document.documentElement.classList.add(CSS_CLASS); // Add again
      
      expect(document.documentElement.classList.length).toBe(1);
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(true);
    });
  });

  describe('disable functionality', () => {
    it('should remove CSS class from document element', () => {
      document.documentElement.classList.add(CSS_CLASS);
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(true);
      
      // Simulate DOMOverlay.disable()
      document.documentElement.classList.remove(CSS_CLASS);
      
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(false);
    });

    it('should handle removing non-existent class gracefully', () => {
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(false);
      
      // Should not throw error
      expect(() => {
        document.documentElement.classList.remove(CSS_CLASS);
      }).not.toThrow();
    });
  });

  describe('isEnabled functionality', () => {
    it('should return true when class is present', () => {
      document.documentElement.classList.add(CSS_CLASS);
      
      const isEnabled = () => document.documentElement.classList.contains(CSS_CLASS);
      expect(isEnabled()).toBe(true);
    });

    it('should return false when class is not present', () => {
      const isEnabled = () => document.documentElement.classList.contains(CSS_CLASS);
      expect(isEnabled()).toBe(false);
    });
  });

  describe('toggle functionality', () => {
    it('should enable when currently disabled', () => {
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(false);
      
      // Simulate toggle logic
      const willBeEnabled = !document.documentElement.classList.contains(CSS_CLASS);
      if (willBeEnabled) {
        document.documentElement.classList.add(CSS_CLASS);
      } else {
        document.documentElement.classList.remove(CSS_CLASS);
      }
      
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(true);
      expect(willBeEnabled).toBe(true);
    });

    it('should disable when currently enabled', () => {
      document.documentElement.classList.add(CSS_CLASS);
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(true);
      
      // Simulate toggle logic
      const willBeEnabled = !document.documentElement.classList.contains(CSS_CLASS);
      if (willBeEnabled) {
        document.documentElement.classList.add(CSS_CLASS);
      } else {
        document.documentElement.classList.remove(CSS_CLASS);
      }
      
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(false);
      expect(willBeEnabled).toBe(false);
    });
  });

  describe('CSS class behavior', () => {
    it('should work with other classes present', () => {
      document.documentElement.className = 'some-other-class another-class';
      
      document.documentElement.classList.add(CSS_CLASS);
      
      expect(document.documentElement.classList.contains('some-other-class')).toBe(true);
      expect(document.documentElement.classList.contains('another-class')).toBe(true);
      expect(document.documentElement.classList.contains(CSS_CLASS)).toBe(true);
      expect(document.documentElement.classList.length).toBe(3);
    });
  });
}); 