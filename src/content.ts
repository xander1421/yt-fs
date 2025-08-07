/**
 * YouTube Tab-Fullscreen Extension - Content Script
 */

// Constants
const STORAGE_KEY = 'ytTabFS';
const CSS_CLASS = 'yt-tabfs-enabled';
const BUTTON_ID = 'yt-tabfs-button';

/**
 * StateManager - Handles per-tab memory using sessionStorage
 */
namespace StateManager {
  export function getState(): boolean {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  export function setState(isEnabled: boolean): void {
    try {
      if (isEnabled) {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * DOMOverlay - Manages the tab-fullscreen CSS class
 */
namespace DOMOverlay {
  export function enable(): void {
    document.documentElement.classList.add(CSS_CLASS);
  }

  export function disable(): void {
    document.documentElement.classList.remove(CSS_CLASS);
  }

  export function isEnabled(): boolean {
    return document.documentElement.classList.contains(CSS_CLASS);
  }
}

/**
 * ToggleButton - Creates and manages the tab-fullscreen button
 */
namespace ToggleButton {
  let button: HTMLElement | null = null;

  export function cleanup(): void {
    // Remove any existing buttons from DOM
    const existingButtons = document.querySelectorAll(`#${BUTTON_ID}`);
    existingButtons.forEach(btn => btn.remove());
    button = null;
  }

  export function create(): HTMLElement {
    // Always cleanup before creating new button
    cleanup();
    
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'ytp-button';
    btn.setAttribute('aria-label', 'Tab Fullscreen');
    btn.setAttribute('title', 'Tab Fullscreen (Alt+T)');
    btn.setAttribute('data-tooltip-opaque', 'false');
    
    // Create SVG icon that clearly shows tab-fullscreen concept
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none; width: 24px; height: 24px;">
        <!-- Tab bar (browser chrome) -->
        <rect x="6" y="2.5" width="12" height="2" rx="1" ry="1" fill="currentColor" stroke="none"/>
        <!-- Video frame -->
        <rect x="3" y="5" width="18" height="16" rx="2" ry="2"/>
        <!-- Up arrow -->
        <line x1="12" y1="9" x2="12" y2="6.2"/>
        <polyline points="10.7,7.5 12,6 13.3,7.5"/>
        <!-- Down arrow -->
        <line x1="12" y1="14.8" x2="12" y2="17.6"/>
        <polyline points="10.7,16.3 12,17.8 13.3,16.3"/>
        <!-- Left arrow -->
        <line x1="7.2" y1="12" x2="4.4" y2="12"/>
        <polyline points="5.9,10.7 4.4,12 5.9,13.3"/>
        <!-- Right arrow -->
        <line x1="16.8" y1="12" x2="19.6" y2="12"/>
        <polyline points="18.1,10.7 19.6,12 18.1,13.3"/>
      </svg>
    `;

    btn.addEventListener('click', handleClick);
    button = btn;
    return btn;
  }

  function handleClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const currentState = StateManager.getState();
    const newState = !currentState;
    
    if (newState) {
      DOMOverlay.enable();
    } else {
      DOMOverlay.disable();
    }
    
    StateManager.setState(newState);
    updateButtonState(newState);
  }

  export function updateButtonState(isEnabled: boolean): void {
    if (button) {
      if (isEnabled) {
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
      }
    }
  }

  export function getButton(): HTMLElement | null {
    return button;
  }
}

/**
 * UIInjector - Handles injecting the button into YouTube's controls
 */
namespace UIInjector {
  let injected = false;

  export function inject(): boolean {
    console.log('[YT-TabFS] inject() called');
    // Check if button actually exists in DOM
    const existingButton = document.getElementById(BUTTON_ID);
    if (injected && existingButton) {
      console.log('[YT-TabFS] Button already exists, skipping');
      return true;
    }

    // If our flag says injected but button doesn't exist, reset the flag
    if (injected && !existingButton) {
      console.log('[YT-TabFS] Injected flag true but button missing, resetting');
      injected = false;
    }

    // Always use left controls to avoid pushing out native buttons
    const controlsContainer = document.querySelector('.ytp-chrome-controls .ytp-left-controls');
    
    console.log('[YT-TabFS] Left controls found:', !!controlsContainer);
    
    if (!controlsContainer) {
      console.log('[YT-TabFS] No controls container found, aborting');
      return false;
    }
    
    // Clean up any existing buttons before creating new one
    ToggleButton.cleanup();

    const button = ToggleButton.create();
    const initialState = StateManager.getState();
    ToggleButton.updateButtonState(initialState);
    
    // Always use left controls placement strategy
    console.log('[YT-TabFS] Inserting button in LEFT controls');
    
    // Find the best position in left controls
    const volumePanel = controlsContainer.querySelector('.ytp-volume-panel');
    const timeDisplay = controlsContainer.querySelector('.ytp-time-display');
    
    console.log('[YT-TabFS] Found volume panel:', !!volumePanel, 'time display:', !!timeDisplay);
    
    // Insert after time display for best positioning
    if (timeDisplay && timeDisplay.nextSibling) {
      controlsContainer.insertBefore(button, timeDisplay.nextSibling);
      console.log('[YT-TabFS] Inserted after time display');
    } else if (volumePanel && volumePanel.nextSibling) {
      controlsContainer.insertBefore(button, volumePanel.nextSibling);
      console.log('[YT-TabFS] Inserted after volume panel');
    } else {
      // As last resort, append to the end
      controlsContainer.appendChild(button);
      console.log('[YT-TabFS] Appended to end of left controls');
    }
    
    console.log('[YT-TabFS] Button injection successful');
    injected = true;
    return true;
  }

  export function reset(): void {
    ToggleButton.cleanup();
    injected = false;
  }
}

/**
 * ObserverGuard - Manages DOM observation for SPA navigation
 */
namespace ObserverGuard {
  let observer: MutationObserver | null = null;
  let controlsObserver: MutationObserver | null = null;
  let currentPath: string = '';
  let currentUrl: string = '';
  let debounceTimer: number | null = null;

  function debounceNavigationHandler(callback: () => void, delay: number = 200): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(callback, delay);
  }

  function observePlayerControls(): void {
    // Stop any existing controls observer
    if (controlsObserver) {
      controlsObserver.disconnect();
    }

    // Watch specifically for changes in the player controls area
    const player = document.querySelector('#movie_player');
    if (!player) return;

    controlsObserver = new MutationObserver((mutations) => {
      // Check if our button was removed
      const existingButton = document.getElementById(BUTTON_ID);
      if (!existingButton && window.location.pathname.includes('/watch')) {
        // Check if left controls container exists
        const controls = document.querySelector('.ytp-chrome-controls .ytp-left-controls');
          
        if (controls) {
          debounceNavigationHandler(() => {
            UIInjector.reset();
            UIInjector.inject();
          }, 100);
        }
      }
    });

    controlsObserver.observe(player, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  export function start(): void {
    if (observer) return;

    // Track initial path and full URL
    currentPath = window.location.pathname;
    currentUrl = window.location.href;

    observer = new MutationObserver(() => {
      const newPath = window.location.pathname;
      const newUrl = window.location.href;
      
      // Check if navigation occurred (either path change or URL change)
      if (newPath !== currentPath || newUrl !== currentUrl) {
        currentPath = newPath;
        currentUrl = newUrl;
        
        if (newPath.includes('/watch')) {
          // User navigated to a video page (or between videos)
          debounceNavigationHandler(() => {
            UIInjector.reset();
            initOnce();
            // Start observing player controls
            setTimeout(() => observePlayerControls(), 500);
          }, 150);
        } else {
          // User navigated away from video page
          if (StateManager.getState()) {
            DOMOverlay.disable();
            StateManager.setState(false);
            const button = ToggleButton.getButton();
            if (button) {
              ToggleButton.updateButtonState(false);
            }
          }
          UIInjector.reset();
          if (controlsObserver) {
            controlsObserver.disconnect();
            controlsObserver = null;
          }
        }
      } else if (newPath.includes('/watch')) {
        // Still on video page, check if button still exists
        const existingButton = document.getElementById(BUTTON_ID);
        if (!existingButton) {
          debounceNavigationHandler(() => {
            UIInjector.reset();
            initOnce();
          }, 150);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Start observing controls if we're already on a video page
    if (currentPath.includes('/watch')) {
      setTimeout(() => observePlayerControls(), 500);
    }
  }

  export function stop(): void {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (controlsObserver) {
      controlsObserver.disconnect();
      controlsObserver = null;
    }
  }
}

/**
 * EventBridge - Handles keyboard shortcuts
 */
namespace EventBridge {
  function handleToggle(): void {
    // Check if we're on a video page
    if (!window.location.pathname.includes('/watch')) {
      return;
    }
    
    const button = ToggleButton.getButton();
    if (button) {
      button.click();
    } else {
      // Try to inject the button first
      if (UIInjector.inject()) {
        const newButton = ToggleButton.getButton();
        if (newButton) {
          newButton.click();
        }
      }
    }
  }

  export function init(): void {
    // Use browser API if available (Firefox), otherwise use chrome API
    const browserAPI = (typeof browser !== 'undefined' && browser) ? browser : chrome;
    
    // Listen for messages from background script
    browserAPI.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
      if (message.action === 'toggle-tabfs') {
        handleToggle();
        sendResponse({ success: true });
      }
      return true;
    });

    // Fallback: Direct keyboard listener as backup
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Check for Alt+T
      if (event.altKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        event.stopPropagation();
        handleToggle();
      }
    }, true);
  }
}

/**
 * VideoPlayerWaiter - Waits for YouTube video player to be ready
 */
namespace VideoPlayerWaiter {
  export function waitForPlayer(): Promise<boolean> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max wait
      const interval = 100; // Check every 100ms

      const checkPlayer = () => {
        // Check for left controls
        const controlsContainer = document.querySelector('.ytp-chrome-controls .ytp-left-controls');
        const player = document.querySelector('#movie_player');
        
        if (controlsContainer && player) {
          resolve(true);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          resolve(false);
          return;
        }
        
        setTimeout(checkPlayer, interval);
      };
      
      checkPlayer();
    });
  }
}

/**
 * Main initialization function
 */
async function initOnce(): Promise<void> {
  // Only inject on video pages
  if (!window.location.pathname.includes('/watch')) {
    return;
  }
  
  // Wait for YouTube player to be ready
  const playerReady = await VideoPlayerWaiter.waitForPlayer();
  
  if (!playerReady) {
    // Retry after a delay
    setTimeout(() => initOnce(), 1000);
    return;
  }
  
  if (UIInjector.inject()) {
    // Restore state if tab-fullscreen was previously enabled
    const savedState = StateManager.getState();
    if (savedState) {
      DOMOverlay.enable();
      ToggleButton.updateButtonState(true);
    }
  }
}

/**
 * Cleanup function to ensure proper state on page load
 */
function ensureCleanState(): void {
  // If we're not on a video page but tab-fullscreen is enabled, disable it
  if (!window.location.pathname.includes('/watch') && DOMOverlay.isEnabled()) {
    DOMOverlay.disable();
    StateManager.setState(false);
  }
}

/**
 * InitialLoadHandler - Handles proper initialization on first page load
 */
namespace InitialLoadHandler {
  let retryCount = 0;
  const maxRetries = 10;
  
  export function handleInitialLoad(): void {
    if (!window.location.pathname.includes('/watch')) {
      return;
    }
    
    initOnce()
      .then(() => {
        retryCount = 0; // Reset retry count on success
      })
      .catch((err) => {
        // Retry with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Max 5 seconds
          setTimeout(() => handleInitialLoad(), delay);
        }
      });
  }
}

/**
 * Entry point
 */
function init(): void {
  // Clean up any stale state first
  ensureCleanState();
  
  // Handle initial load with retry mechanism
  InitialLoadHandler.handleInitialLoad();
  
  ObserverGuard.start();
  EventBridge.init();
}

// Start the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

 