/**
 * YouTube Tab-Fullscreen Extension - Content Script
 * Version 1.0.0 - Free Core
 */

import { AdSkipper, AdSkipperDebug } from './ad-skipper';

// Constants
const STORAGE_KEY = 'ytTabFS';
const CSS_CLASS = 'yt-tabfs-enabled';
const BUTTON_ID = 'yt-tabfs-button';

/**
 * StateManager - Handles per-tab memory using sessionStorage
 */
namespace StateManager {
  export function load(): boolean {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  export function save(isEnabled: boolean): void {
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

  export function getState(): boolean {
    return load();
  }

  export function setState(isEnabled: boolean): void {
    save(isEnabled);
  }
}

/**
 * DOMOverlay - Manages the tab-fullscreen CSS class
 */
namespace DOMOverlay {
  export function enable(): void {
    console.log('[YT-TabFS] DOMOverlay.enable() called, current path:', window.location.pathname);
    document.documentElement.classList.add(CSS_CLASS);
    console.log('[YT-TabFS] Added yt-tabfs-enabled class to html element');
    
    // Ad skipper runs by default, so no need to start it here
    console.log('[YT-TabFS] Tab-fullscreen enabled, ad skipper continues running');
  }

  export function disable(): void {
    console.log('[YT-TabFS] DOMOverlay.disable() called, current path:', window.location.pathname);
    document.documentElement.classList.remove(CSS_CLASS);
    console.log('[YT-TabFS] Removed yt-tabfs-enabled class from html element');
    
    // Keep ad skipper running even when tab-fullscreen is disabled
    console.log('[YT-TabFS] Tab-fullscreen disabled, but ad skipper continues running');
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
    existingButtons.forEach(btn => {
      console.log('[YT-TabFS] Removing existing button from DOM');
      btn.remove();
    });
    button = null;
  }

  export function create(): HTMLElement {
    // Always cleanup before creating new button
    cleanup();
    
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'ytp-button';
    btn.setAttribute('aria-label', 'Tab Fullscreen');
    btn.setAttribute('title', 'Tab Fullscreen (Alt+T) | Auto Ad-Skip Always On');
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
    
    console.log('[YT-TabFS] Button clicked');
    const currentState = StateManager.getState();
    console.log('[YT-TabFS] Current state before toggle:', currentState);
    
    const newState = !currentState;
    console.log('[YT-TabFS] New state after toggle:', newState);
    
    if (newState) {
      console.log('[YT-TabFS] Enabling tab-fullscreen');
      DOMOverlay.enable();
    } else {
      console.log('[YT-TabFS] Disabling tab-fullscreen');
      DOMOverlay.disable();
    }
    
    StateManager.setState(newState);
    updateButtonState(newState);
  }

  export function updateButtonState(isEnabled: boolean): void {
    console.log('[YT-TabFS] Updating button state to:', isEnabled);
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
    // Check if button actually exists in DOM (not just our flag)
    const existingButton = document.getElementById(BUTTON_ID);
    if (injected && existingButton) {
      console.log('[YT-TabFS] Already injected and button exists in DOM, skipping');
      return true;
    }

    // If our flag says injected but button doesn't exist, reset the flag
    if (injected && !existingButton) {
      console.log('[YT-TabFS] Injection flag set but button missing from DOM, resetting');
      injected = false;
    }

    const controlsContainer = document.querySelector('.ytp-chrome-controls .ytp-left-controls');
    if (!controlsContainer) {
      console.log('[YT-TabFS] Looking for controls container: false');
      return false;
    }

    console.log('[YT-TabFS] Looking for controls container: true');
    
    // Clean up any existing buttons before creating new one
    ToggleButton.cleanup();

    const button = ToggleButton.create();
    const initialState = StateManager.getState();
    ToggleButton.updateButtonState(initialState);
    
    controlsContainer.appendChild(button);
    console.log('[YT-TabFS] Button inserted into controls');
    console.log('[YT-TabFS] Initial state from storage:', initialState);
    
    // Start ad skipper by default (always enabled)
    console.log('[YT-TabFS] Starting ad skipper by default');
    AdSkipper.start();
    
    // If we're already in fullscreen mode, keep ad skipper running
    if (initialState) {
      console.log('[YT-TabFS] Tab-fullscreen already enabled, ad skipper continues running');
    }
    
    injected = true;
    return true;
  }

  export function reset(): void {
    console.log('[YT-TabFS] UIInjector reset called');
    ToggleButton.cleanup();
    injected = false;
  }
}

/**
 * ObserverGuard - Manages DOM observation for SPA navigation
 */
namespace ObserverGuard {
  let observer: MutationObserver | null = null;
  let currentPath: string = '';
  let currentUrl: string = '';
  let debounceTimer: number | null = null;

  function debounceNavigationHandler(callback: () => void, delay: number = 200): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(callback, delay);
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
        console.log('[YT-TabFS] Navigation detected:', currentUrl, '->', newUrl);
        currentPath = newPath;
        currentUrl = newUrl;
        
        if (newPath.includes('/watch')) {
          // User navigated to a video page (or between videos)
          // Use debounced handler to prevent multiple rapid injections
          debounceNavigationHandler(() => {
            console.log('[YT-TabFS] Processing video navigation');
            UIInjector.reset();
            initOnce().catch(err => console.error('[YT-TabFS] Error in initOnce:', err));
          }, 150);
        } else {
          // User navigated away from video page (e.g., to homepage)
          // Automatically disable tab-fullscreen to prevent UI elements from being hidden
          if (StateManager.getState()) {
            console.log('[YT-TabFS] Auto-disabling tab-fullscreen on navigation away from video');
            DOMOverlay.disable();
            StateManager.setState(false);
            // Update button state if it exists
            const button = ToggleButton.getButton();
            if (button) {
              ToggleButton.updateButtonState(false);
            }
          }
          // Reset injection flag so button can be re-injected on next video
          UIInjector.reset();
        }
      } else if (newPath.includes('/watch')) {
        // Still on video page, but check if button still exists in DOM
        // This handles cases where YouTube rebuilds the player without URL change
        const existingButton = document.getElementById(BUTTON_ID);
        if (!existingButton) {
          console.log('[YT-TabFS] Button missing from DOM, re-injecting');
          debounceNavigationHandler(() => {
            UIInjector.reset();
            initOnce().catch(err => console.error('[YT-TabFS] Error in initOnce:', err));
          }, 150);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  export function stop(): void {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }
}

/**
 * EventBridge - Handles keyboard shortcuts
 */
namespace EventBridge {
  function handleToggle(): void {
    console.log('[YT-TabFS] Toggle triggered');
    
    // Check if we're on a video page
    if (!window.location.pathname.includes('/watch')) {
      console.log('[YT-TabFS] Not on video page, ignoring toggle command');
      return;
    }
    
    const button = ToggleButton.getButton();
    if (button) {
      console.log('[YT-TabFS] Button found, clicking');
      button.click();
    } else {
      console.log('[YT-TabFS] Button not found, trying to inject');
      // Try to inject the button first
      if (UIInjector.inject()) {
        const newButton = ToggleButton.getButton();
        if (newButton) {
          console.log('[YT-TabFS] Button injected and clicked');
          newButton.click();
        } else {
          console.log('[YT-TabFS] Failed to get button after injection');
        }
      } else {
        console.log('[YT-TabFS] Failed to inject button');
      }
    }
  }

  export function init(): void {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[YT-TabFS] Message received:', message);
      
      if (message.action === 'toggle-tabfs') {
        handleToggle();
        sendResponse({ success: true });
      }
      
      // Return true to indicate we'll send a response asynchronously
      return true;
    });

    // Fallback: Direct keyboard listener as backup
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Check for Alt+T
      if (event.altKey && event.key.toLowerCase() === 't') {
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();
        
        console.log('[YT-TabFS] Direct Alt+T keydown detected');
        handleToggle();
      }
    }, true); // Use capture phase to catch it early

    console.log('[YT-TabFS] EventBridge initialized with both message listener and direct keyboard fallback');
  }
}

/**
 * VideoPlayerWaiter - Waits for YouTube video player to be ready
 */
namespace VideoPlayerWaiter {
  export function waitForPlayer(): Promise<boolean> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      const interval = 100; // Check every 100ms

      const checkPlayer = () => {
        const controlsContainer = document.querySelector('.ytp-chrome-controls .ytp-left-controls');
        const player = document.querySelector('#movie_player');
        
        if (controlsContainer && player) {
          console.log('[YT-TabFS] Video player is ready');
          resolve(true);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          console.log('[YT-TabFS] Video player wait timeout');
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
  console.log('[YT-TabFS] initOnce called, pathname:', window.location.pathname);
  
  // Only inject on video pages
  if (!window.location.pathname.includes('/watch')) {
    console.log('[YT-TabFS] Not on video page, skipping injection');
    return;
  }
  
  // Wait for YouTube player to be ready
  console.log('[YT-TabFS] Waiting for video player to be ready...');
  const playerReady = await VideoPlayerWaiter.waitForPlayer();
  
  if (!playerReady) {
    console.log('[YT-TabFS] Video player not ready, retrying later');
    // Retry after a delay
    setTimeout(() => initOnce(), 1000);
    return;
  }
  
  if (UIInjector.inject()) {
    console.log('[YT-TabFS] Successfully injected button');
    
    // Restore state if tab-fullscreen was previously enabled
    const savedState = StateManager.getState();
    if (savedState) {
      console.log('[YT-TabFS] Restoring tab-fullscreen state from storage');
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
    console.log('[YT-TabFS] Cleaning up stale tab-fullscreen state on non-video page');
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
        console.log('[YT-TabFS] Initial load completed successfully');
        retryCount = 0; // Reset retry count on success
      })
      .catch((err) => {
        console.error('[YT-TabFS] Error in initial initOnce:', err);
        
        // Retry with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Max 5 seconds
          console.log(`[YT-TabFS] Retrying initial load in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          setTimeout(() => handleInitialLoad(), delay);
        } else {
          console.error('[YT-TabFS] Max retries reached for initial load');
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

// Expose debug functions globally for testing
(window as any).ytTabFSDebug = {
  logAdElements: () => AdSkipperDebug.logAdElements(),
  isAdSkipperRunning: () => AdSkipper.isRunning(),
  stopAdSkipper: () => AdSkipper.stop(),
  startAdSkipper: () => AdSkipper.start() // In case user wants to restart it
}; 