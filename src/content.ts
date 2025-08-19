/**
 * YouTube Tab-Fullscreen Extension - Content Script
 */

// Constants
const STORAGE_KEY = 'ytTabFS';
const CSS_CLASS = 'yt-tabfs-enabled';
const BUTTON_ID = 'yt-tabfs-button';

/**
 * Generic wait utility - similar to SponsorBlock's approach
 */
function wait<T>(
  condition: () => T,
  timeout: number = 5000,
  checkInterval: number = 50
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const result = condition();
      if (result) {
        resolve(result);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, checkInterval);
      }
    };
    
    check();
  });
}

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
    btn.className = 'ytp-button playerButton'; // Use both native and custom class like SponsorBlock
    btn.setAttribute('title', 'Tab Fullscreen (Alt+T)');
    
    // Create img element like SponsorBlock does
    const btnImage = document.createElement('img');
    btnImage.id = BUTTON_ID + 'Image';
    btnImage.className = 'playerButtonImage';
    // Use inline SVG as data URI since we can't use chrome.runtime.getURL in content script directly
    btnImage.src = 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path fill="white" d="M 6 2.5 L 18 2.5 C 18.55 2.5 19 2.95 19 3.5 C 19 4.05 18.55 4.5 18 4.5 L 6 4.5 C 5.45 4.5 5 4.05 5 3.5 C 5 2.95 5.45 2.5 6 2.5 Z M 3 5 L 21 5 C 22.10 5 23 5.90 23 7 L 23 19 C 23 20.10 22.10 21 21 21 L 3 21 C 1.90 21 1 20.10 1 19 L 1 7 C 1 5.90 1.90 5 3 5 Z M 3 7 L 3 19 L 21 19 L 21 7 L 3 7 Z M 12 9 L 14.29 11.29 C 14.68 11.68 14.68 12.31 14.29 12.70 C 13.90 13.09 13.27 13.09 12.88 12.70 L 12 11.83 L 11.12 12.70 C 10.73 13.09 10.10 13.09 9.71 12.70 C 9.32 12.31 9.32 11.68 9.71 11.29 L 12 9 Z M 12 15 L 9.71 12.71 C 9.32 12.32 9.32 11.69 9.71 11.30 C 10.10 10.91 10.73 10.91 11.12 11.30 L 12 12.17 L 12.88 11.30 C 13.27 10.91 13.90 10.91 14.29 11.30 C 14.68 11.69 14.68 12.32 14.29 12.71 L 12 15 Z M 9 12 L 6.71 9.71 C 6.32 9.32 5.69 9.32 5.30 9.71 C 4.91 10.10 4.91 10.73 5.30 11.12 L 6.17 12 L 5.30 12.88 C 4.91 13.27 4.91 13.90 5.30 14.29 C 5.69 14.68 6.32 14.68 6.71 14.29 L 9 12 Z M 15 12 L 17.29 14.29 C 17.68 14.68 18.31 14.68 18.70 14.29 C 19.09 13.90 19.09 13.27 18.70 12.88 L 17.83 12 L 18.70 11.12 C 19.09 10.73 19.09 10.10 18.70 9.71 C 18.31 9.32 17.68 9.32 17.29 9.71 L 15 12 Z"/>
      </svg>
    `);
    
    btn.appendChild(btnImage);

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
 * Get YouTube player controls - SponsorBlock style
 */
function getControls(): Element | null {
  // Primary target - right controls left section (where autoplay, subtitles, settings are)
  const rightControlsLeft = document.querySelector('.ytp-chrome-controls .ytp-right-controls .ytp-right-controls-left');
  if (rightControlsLeft && isVisible(rightControlsLeft as HTMLElement)) {
    console.log('[YT-TabFS] Found right-controls-left container');
    return rightControlsLeft;
  }

  // Fallback selectors
  const selectors = [
    // Main right controls container
    '.ytp-chrome-controls .ytp-right-controls',
    // Other fallbacks
    '.ytp-right-controls',
    '#movie_player .ytp-chrome-controls .ytp-right-controls',
    '.html5-video-player .ytp-chrome-controls .ytp-right-controls'
  ];

  for (const selector of selectors) {
    const controls = document.querySelector(selector);
    if (controls && isVisible(controls as HTMLElement)) {
      console.log('[YT-TabFS] Found controls with selector:', selector);
      return controls;
    }
  }

  console.warn('[YT-TabFS] No visible controls found');
  return null;
}

/**
 * Check if element is visible
 */
function isVisible(element: HTMLElement): boolean {
  return element && element.offsetWidth > 0 && element.offsetHeight > 0;
}

/**
 * Wait for video player to be ready - SponsorBlock style
 */
async function waitForVideo(): Promise<boolean> {
  try {
    console.log('[YT-TabFS] Waiting for video element...');
    // Wait for video element - but don't require specific readyState on first load
    await wait(() => {
      const video = document.querySelector('video');
      if (video) {
        console.log('[YT-TabFS] Video found, readyState:', video.readyState);
        // On initial load, video might not be ready yet, but controls could be
        return true;
      }
      return false;
    }, 10000, 100);

    console.log('[YT-TabFS] Video ready, waiting for controls...');
    // Wait for controls with multiple attempts
    let controls = null;
    for (let attempts = 0; attempts < 3; attempts++) {
      try {
        controls = await wait(() => getControls(), 5000, 100);
        if (controls) break;
      } catch (e) {
        console.log('[YT-TabFS] Controls wait attempt', attempts + 1, 'failed, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (controls) {
      console.log('[YT-TabFS] Controls found, player is ready');
      return true;
    } else {
      console.error('[YT-TabFS] Controls not found after all attempts');
      return false;
    }
  } catch (e) {
    console.error('[YT-TabFS] waitForVideo error:', e);
    return false;
  }
}

/**
 * UIInjector - Handles injecting the button into YouTube's controls
 */
namespace UIInjector {
  let isInjected = false;

  export function inject(): boolean {
    try {
      // Check if already injected
      const existingButton = document.getElementById(BUTTON_ID);
      if (isInjected && existingButton && existingButton.isConnected) {
        console.log('[YT-TabFS] Button already exists and connected');
        return true;
      }

      const controls = getControls();
      if (!controls) {
        console.log('[YT-TabFS] No controls found');
        return false;
      }

      console.log('[YT-TabFS] Found controls:', controls.className);

      // Clean up any orphaned buttons
      ToggleButton.cleanup();

      const button = ToggleButton.create();
      if (!button) {
        console.error('[YT-TabFS] Failed to create button');
        return false;
      }

      const initialState = StateManager.getState();
      ToggleButton.updateButtonState(initialState);
      
      try {
        // Always prepend to make it the leftmost button
        controls.prepend(button);
        
        console.log('[YT-TabFS] Button injected successfully to', controls.className);
        
        // Verify button is in DOM
        const verifyButton = document.getElementById(BUTTON_ID);
        if (verifyButton && verifyButton.isConnected) {
          isInjected = true;
          return true;
        } else {
          console.error('[YT-TabFS] Button not found after injection');
          return false;
        }
      } catch (e) {
        console.error('[YT-TabFS] Error during injection:', e);
        return false;
      }
    } catch (outerError) {
      console.error('[YT-TabFS] Outer error in inject:', outerError);
      return false;
    }
  }

  export function reset(): void {
    ToggleButton.cleanup();
    isInjected = false;
  }
}

/**
 * EventBridge - Handles keyboard shortcuts and extension messages
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
      console.log('[YT-TabFS] Received message:', message);
      if (message.action === 'toggle-tabfs') {
        handleToggle();
        sendResponse({ success: true });
      }
      return true;
    });

    // Fallback: Direct keyboard listener as backup
    // Add with capture phase to ensure we get the event first
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Check for Alt+T
      if (event.altKey && event.key.toLowerCase() === 't' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        console.log('[YT-TabFS] Alt+T detected via direct listener');
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleToggle();
        return false;
      }
    }, { capture: true });
    
    // Also add to window object as additional fallback
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Check for Alt+T
      if (event.altKey && event.key.toLowerCase() === 't' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        console.log('[YT-TabFS] Alt+T detected via window listener');
        event.preventDefault();
        event.stopPropagation();
        handleToggle();
        return false;
      }
    }, { capture: true });
    
    console.log('[YT-TabFS] EventBridge initialized - Alt+T shortcut ready');
  }
}

/**
 * Video change detection
 */
let currentVideoId: string | null = null;

function getVideoId(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

function checkVideoChange(): void {
  const newVideoId = getVideoId();
  if (newVideoId !== currentVideoId) {
    currentVideoId = newVideoId;
    console.log('[YT-TabFS] Video changed to:', newVideoId);
    
    // Reset and reinitialize
    UIInjector.reset();
    if (newVideoId) {
      setupVideo();
    }
  }
}

/**
 * Setup video - SponsorBlock style initialization
 */
async function setupVideo(): Promise<void> {
  console.log('[YT-TabFS] Setting up video');
  
  // Wait for video to be ready
  const videoReady = await waitForVideo();
  if (!videoReady) {
    console.log('[YT-TabFS] Video not ready, retrying...');
    // Retry with increasing delays
    setTimeout(() => setupVideo(), 1000);
    setTimeout(() => setupVideo(), 5000);
    return;
  }

  // Inject button with multiple attempts
  let injected = false;
  const attempts = [0, 100, 500, 1000, 2000];
  
  for (const delay of attempts) {
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    
    injected = UIInjector.inject();
    if (injected) {
      console.log('[YT-TabFS] Button injected successfully after', delay, 'ms');
      break;
    }
  }
  
  if (!injected) {
    console.error('[YT-TabFS] Failed to inject button after all attempts');
  }

  // Restore state if tab-fullscreen was previously enabled
  const savedState = StateManager.getState();
  if (savedState) {
    DOMOverlay.enable();
    ToggleButton.updateButtonState(true);
  }
}

/**
 * Initialize extension - SponsorBlock style
 */
async function init(): Promise<void> {
  console.log('[YT-TabFS] Initializing extension');
  
  // Initialize event bridge
  EventBridge.init();
  
  // Clean up any stale state if not on video page
  if (!window.location.pathname.includes('/watch') && DOMOverlay.isEnabled()) {
    DOMOverlay.disable();
    StateManager.setState(false);
  }

  // Setup initial video if on watch page
  if (window.location.pathname.includes('/watch')) {
    currentVideoId = getVideoId();
    await setupVideo();
  }

  // Watch for navigation changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      checkVideoChange();
    }
  }).observe(document, { subtree: true, childList: true });

  // Also check periodically for video changes
  setInterval(checkVideoChange, 1000);

  // Watch for dynamic control changes with debouncing
  let injectionTimeout: number | null = null;
  new MutationObserver(() => {
    if (window.location.pathname.includes('/watch') && !document.getElementById(BUTTON_ID)) {
      // Debounce injection attempts
      if (injectionTimeout) clearTimeout(injectionTimeout);
      injectionTimeout = setTimeout(() => {
        const controls = getControls();
        if (controls && !document.getElementById(BUTTON_ID)) {
          console.log('[YT-TabFS] Controls appeared, injecting button');
          UIInjector.inject();
        }
      }, 100);
    }
  }).observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Log extension version for debugging
console.log('[YT-TabFS] Content script loaded v1.2.0');

// Initialize EventBridge immediately for keyboard shortcuts
EventBridge.init();

// Start initialization with multiple strategies
if (document.readyState === 'loading') {
  console.log('[YT-TabFS] Document still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[YT-TabFS] DOMContentLoaded fired');
    init().catch(err => console.error('[YT-TabFS] Init error:', err));
  });
} else {
  console.log('[YT-TabFS] Document ready, initializing immediately');
  init().catch(err => {
    console.error('[YT-TabFS] Initialization error:', err);
    // Retry initialization
    setTimeout(() => init(), 1000);
  });
}

// Also try after a small delay to ensure YouTube's scripts are loaded
setTimeout(() => {
  console.log('[YT-TabFS] Delayed initialization attempt');
  if (!document.getElementById(BUTTON_ID)) {
    init().catch(err => console.error('[YT-TabFS] Delayed init error:', err));
  }
}, 100);

// Wait for YouTube player API to be ready
const waitForYouTubePlayer = () => {
  const checkPlayer = () => {
    const moviePlayer = document.getElementById('movie_player');
    if (moviePlayer && moviePlayer.classList.contains('html5-video-player')) {
      console.log('[YT-TabFS] YouTube player detected, ensuring initialization');
      if (!document.getElementById(BUTTON_ID) && window.location.pathname.includes('/watch')) {
        setupVideo();
      }
    } else {
      setTimeout(checkPlayer, 500);
    }
  };
  checkPlayer();
};

// Start checking for YouTube player
waitForYouTubePlayer();

// Additional check specifically for right controls left section
const waitForRightControls = () => {
  const checkControls = () => {
    const rightControlsLeft = document.querySelector('.ytp-chrome-controls .ytp-right-controls .ytp-right-controls-left');
    if (rightControlsLeft && !document.getElementById(BUTTON_ID) && window.location.pathname.includes('/watch')) {
      console.log('[YT-TabFS] Right controls left section detected, injecting button');
      UIInjector.inject();
    } else if (!rightControlsLeft) {
      setTimeout(checkControls, 200);
    }
  };
  setTimeout(checkControls, 1000); // Initial delay to let YouTube initialize
};

waitForRightControls();

// Listen for YouTube's navigation events
document.addEventListener('yt-navigate-finish', () => {
  console.log('[YT-TabFS] YouTube navigation finished');
  checkVideoChange();
});

// Listen for when player becomes ready
document.addEventListener('yt-player-updated', () => {
  console.log('[YT-TabFS] YouTube player updated');
  if (window.location.pathname.includes('/watch') && !document.getElementById(BUTTON_ID)) {
    setupVideo();
  }
});

// Try one more time after page load
window.addEventListener('load', () => {
  console.log('[YT-TabFS] Window load event');
  setTimeout(() => {
    if (window.location.pathname.includes('/watch') && !document.getElementById(BUTTON_ID)) {
      console.log('[YT-TabFS] Final attempt after window load');
      setupVideo();
    }
  }, 500);
});