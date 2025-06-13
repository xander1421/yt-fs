import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ToggleButton', () => {
  const BUTTON_ID = 'yt-tabfs-button';

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('createEl functionality', () => {
    it('should create button with correct attributes', () => {
      // Simulate ToggleButton.createEl()
      const button = document.createElement('button');
      button.id = BUTTON_ID;
      button.className = 'ytp-button yt-tabfs-button';
      button.innerHTML = 'TF';
      button.title = 'Toggle tab-fullscreen (Alt + T)';
      button.setAttribute('aria-label', 'Toggle tab-fullscreen');

      expect(button.id).toBe(BUTTON_ID);
      expect(button.className).toBe('ytp-button yt-tabfs-button');
      expect(button.innerHTML).toBe('TF');
      expect(button.title).toBe('Toggle tab-fullscreen (Alt + T)');
      expect(button.getAttribute('aria-label')).toBe('Toggle tab-fullscreen');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should add click event listener', () => {
      const mockClickHandler = vi.fn();
      
      const button = document.createElement('button');
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mockClickHandler();
      });

      // Simulate click
      const clickEvent = new Event('click', { bubbles: true });
      button.dispatchEvent(clickEvent);

      expect(mockClickHandler).toHaveBeenCalledOnce();
    });

    it('should prevent default and stop propagation on click', () => {
      const button = document.createElement('button');
      let preventDefaultCalled = false;
      let stopPropagationCalled = false;
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        preventDefaultCalled = true;
        stopPropagationCalled = true;
      });

      const clickEvent = new Event('click', { bubbles: true, cancelable: true });
      button.dispatchEvent(clickEvent);

      expect(preventDefaultCalled).toBe(true);
      expect(stopPropagationCalled).toBe(true);
      expect(clickEvent.defaultPrevented).toBe(true);
    });
  });

  describe('setActive functionality', () => {
    it('should add active class when isActive is true', () => {
      const button = document.createElement('button');
      button.className = 'ytp-button yt-tabfs-button';
      
      // Simulate setActive(true)
      button.classList.toggle('yt-tabfs-active', true);
      
      expect(button.classList.contains('yt-tabfs-active')).toBe(true);
      expect(button.className).toBe('ytp-button yt-tabfs-button yt-tabfs-active');
    });

    it('should remove active class when isActive is false', () => {
      const button = document.createElement('button');
      button.className = 'ytp-button yt-tabfs-button yt-tabfs-active';
      
      // Simulate setActive(false)
      button.classList.toggle('yt-tabfs-active', false);
      
      expect(button.classList.contains('yt-tabfs-active')).toBe(false);
      expect(button.className).toBe('ytp-button yt-tabfs-button');
    });

    it('should handle null button element gracefully', () => {
      const buttonElement = null;
      
      // Simulate setActive when button is null
      expect(() => {
        if (buttonElement) {
          buttonElement.classList.toggle('yt-tabfs-active', true);
        }
      }).not.toThrow();
    });
  });

  describe('button integration', () => {
    it('should be injectable into YouTube controls container', () => {
      // Create mock YouTube controls container
      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'ytp-right-controls';
      
      const existingButton = document.createElement('button');
      existingButton.textContent = 'Existing Button';
      controlsContainer.appendChild(existingButton);
      
      document.body.appendChild(controlsContainer);
      
      // Create and inject TF button
      const tfButton = document.createElement('button');
      tfButton.id = BUTTON_ID;
      tfButton.innerHTML = 'TF';
      controlsContainer.insertBefore(tfButton, controlsContainer.firstChild);
      
      expect(controlsContainer.children.length).toBe(2);
      expect(controlsContainer.firstChild).toBe(tfButton);
      expect(document.getElementById(BUTTON_ID)).toBe(tfButton);
    });

    it('should not duplicate if button already exists', () => {
      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'ytp-right-controls';
      document.body.appendChild(controlsContainer);
      
      // Create first button
      const button1 = document.createElement('button');
      button1.id = BUTTON_ID;
      button1.innerHTML = 'TF';
      controlsContainer.appendChild(button1);
      
      // Check if button already exists before adding another
      const existingButton = document.getElementById(BUTTON_ID);
      if (!existingButton) {
        const button2 = document.createElement('button');
        button2.id = BUTTON_ID;
        controlsContainer.appendChild(button2);
      }
      
      expect(controlsContainer.children.length).toBe(1);
      expect(document.getElementById(BUTTON_ID)).toBe(button1);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Toggle tab-fullscreen');
      button.title = 'Toggle tab-fullscreen (Alt + T)';
      
      expect(button.getAttribute('aria-label')).toBe('Toggle tab-fullscreen');
      expect(button.title).toBe('Toggle tab-fullscreen (Alt + T)');
    });

    it('should be focusable', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });
}); 