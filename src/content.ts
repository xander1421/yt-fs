/**
 * YouTube Tab-Fullscreen Extension - Content Script
 * Version 1.0.0 - Free Core
 */

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
 * DOMOverlay - Manages CSS class application and cleanup
 */
namespace DOMOverlay {
  export function enable(): void {
    console.log('[YT-TabFS] DOMOverlay.enable() called');
    const htmlElement = document.documentElement;
    if (!htmlElement.classList.contains(CSS_CLASS)) {
      htmlElement.classList.add(CSS_CLASS);
      console.log('[YT-TabFS] Added yt-tabfs-enabled class to html element');
    } else {
      console.log('[YT-TabFS] yt-tabfs-enabled class already present');
    }
  }

  export function disable(): void {
    console.log('[YT-TabFS] DOMOverlay.disable() called');
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains(CSS_CLASS)) {
      htmlElement.classList.remove(CSS_CLASS);
      console.log('[YT-TabFS] Removed yt-tabfs-enabled class from html element');
    } else {
      console.log('[YT-TabFS] yt-tabfs-enabled class not present');
    }
  }

  export function isEnabled(): boolean {
    return document.documentElement.classList.contains(CSS_CLASS);
  }

  export function toggle(): boolean {
    const willBeEnabled = !isEnabled();
    if (willBeEnabled) {
      enable();
    } else {
      disable();
    }
    StateManager.setState(willBeEnabled);
    return willBeEnabled;
  }
}

/**
 * ToggleButton - Creates and manages the TF button
 */
namespace ToggleButton {
  let buttonElement: HTMLElement | null = null;

  export function create(): HTMLElement {
    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.className = 'ytp-button yt-tabfs-button';
    button.innerHTML = 'TF';
    button.title = 'Toggle Tab-Fullscreen (Alt+T)';
    button.setAttribute('aria-label', 'Toggle Tab-Fullscreen');
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[YT-TabFS] Button clicked');
      
      const currentState = StateManager.getState();
      console.log('[YT-TabFS] Current state before toggle:', currentState);
      
      const newState = !currentState;
      StateManager.setState(newState);
      console.log('[YT-TabFS] New state after toggle:', newState);
      
      if (newState) {
        console.log('[YT-TabFS] Enabling tab-fullscreen');
        DOMOverlay.enable();
      } else {
        console.log('[YT-TabFS] Disabling tab-fullscreen');
        DOMOverlay.disable();
      }
      
      updateButtonState(button, newState);
    });
    
    // Set initial button state
    const initialState = StateManager.getState();
    updateButtonState(button, initialState);
    
    buttonElement = button;
    return button;
  }

  function updateButtonState(button: HTMLElement, isEnabled: boolean): void {
    console.log('[YT-TabFS] Updating button state to:', isEnabled);
    if (isEnabled) {
      button.classList.add('yt-tabfs-active');
    } else {
      button.classList.remove('yt-tabfs-active');
    }
  }

  export function setActive(isActive: boolean): void {
    if (buttonElement) {
      updateButtonState(buttonElement, isActive);
    }
  }

  export function getElement(): HTMLElement | null {
    return buttonElement;
  }
}

/**
 * UIInjector - Handles button injection into YouTube player controls
 */
namespace UIInjector {
  let injected = false;
  let lastInjectionTime = 0;
  const INJECTION_DEBOUNCE = 1000; // 1 second debounce

  export function inject(): boolean {
    const now = Date.now();
    if (injected && (now - lastInjectionTime) < INJECTION_DEBOUNCE) {
      return true; // Skip if recently injected
    }

    const controlsContainer = document.querySelector('.ytp-chrome-controls .ytp-left-controls');
    if (!controlsContainer) {
      console.log('[YT-TabFS] Looking for controls container: false');
      return false;
    }

    console.log('[YT-TabFS] Looking for controls container: true');

    // Check if button already exists
    if (document.getElementById(BUTTON_ID)) {
      injected = true;
      lastInjectionTime = now;
      return true;
    }

    const button = ToggleButton.create();
    controlsContainer.appendChild(button);
    console.log('[YT-TabFS] Button inserted into controls');

    const initialState = StateManager.getState();
    console.log('[YT-TabFS] Initial state from storage:', initialState);
    
    // Apply initial state
    if (initialState) {
      console.log('[YT-TabFS] Applying initial tab-fullscreen state');
      DOMOverlay.enable();
    }

    injected = true;
    lastInjectionTime = now;
    return true;
  }

  export function initOnce(): void {
    const pathname = window.location.pathname;
    console.log('[YT-TabFS] initOnce called, pathname:', pathname);
    
    if (pathname !== '/watch') {
      return;
    }

    const now = Date.now();
    if (injected && (now - lastInjectionTime) < INJECTION_DEBOUNCE) {
      console.log('[YT-TabFS] Already injected recently, skipping');
      return;
    }

    if (inject()) {
      console.log('[YT-TabFS] Successfully injected button');
    } else {
      console.log('[YT-TabFS] Failed to inject button');
    }
  }

  export function reinjectIfMissing(): void {
    if (!document.getElementById(BUTTON_ID)) {
      injected = false;
      inject();
    }
  }

  export function isInjected(): boolean {
    return injected;
  }
}

/**
 * ObserverGuard - Manages MutationObserver lifecycle
 */
namespace ObserverGuard {
  let observer: MutationObserver | null = null;

  export function start(): void {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          UIInjector.reinjectIfMissing();
        }
      }
    });

    const ytdApp = document.querySelector('ytd-app');
    if (ytdApp) {
      observer.observe(ytdApp, { childList: true, subtree: false });
    }
  }

  export function stop(): void {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }
}

/**
 * EventBridge - Handles keyboard shortcuts and fullscreen events
 */
namespace EventBridge {
  let nativeFullscreenWasActive = false;
  let tabFsStateBeforeNative = false;

  export function initShortcuts(): void {
    // Listen for extension command
    if (typeof chrome !== 'undefined' && chrome.commands) {
      chrome.commands.onCommand.addListener((command) => {
        if (command === 'toggle-tabfs') {
          const isEnabled = DOMOverlay.toggle();
          ToggleButton.setActive(isEnabled);
        }
      });
    }

    // Fallback keyboard listener
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 't' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        // Only trigger if we're on a YouTube watch page and not in an input
        if (location.pathname === '/watch' && 
            !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          const isEnabled = DOMOverlay.toggle();
          ToggleButton.setActive(isEnabled);
        }
      }
    });
  }

  export function initFullscreenWatcher(): void {
    // Watch for native fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Watch for YouTube's fullscreen class changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target === document.documentElement) {
            handleYouTubeFullscreen();
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function handleFullscreenChange(): void {
    const isNativeFullscreen = !!document.fullscreenElement;
    
    if (isNativeFullscreen && !nativeFullscreenWasActive) {
      // Entering native fullscreen
      nativeFullscreenWasActive = true;
      tabFsStateBeforeNative = DOMOverlay.isEnabled();
      
      if (tabFsStateBeforeNative) {
        DOMOverlay.disable();
        ToggleButton.setActive(false);
      }
    } else if (!isNativeFullscreen && nativeFullscreenWasActive) {
      // Exiting native fullscreen
      nativeFullscreenWasActive = false;
      
      if (tabFsStateBeforeNative) {
        DOMOverlay.enable();
        ToggleButton.setActive(true);
      }
    }
  }

  function handleYouTubeFullscreen(): void {
    const hasYtFullscreen = document.documentElement.classList.contains('ytp-fullscreen');
    
    if (hasYtFullscreen && !nativeFullscreenWasActive) {
      // YouTube's fullscreen mode activated
      nativeFullscreenWasActive = true;
      tabFsStateBeforeNative = DOMOverlay.isEnabled();
      
      if (tabFsStateBeforeNative) {
        DOMOverlay.disable();
        ToggleButton.setActive(false);
      }
    } else if (!hasYtFullscreen && nativeFullscreenWasActive) {
      // YouTube's fullscreen mode deactivated
      nativeFullscreenWasActive = false;
      
      if (tabFsStateBeforeNative) {
        DOMOverlay.enable();
        ToggleButton.setActive(true);
      }
    }
  }
}

// Main initialization
function initOnce(): void {
  const pathname = window.location.pathname;
  console.log('[YT-TabFS] initOnce called, pathname:', pathname);
  
  if (pathname !== '/watch') {
    return;
  }

  if (UIInjector.inject()) {
    console.log('[YT-TabFS] Successfully injected button');
  } else {
    console.log('[YT-TabFS] Failed to inject button');
  }
}

function init(): void {
  // Initialize shortcuts and fullscreen watchers
  EventBridge.initShortcuts();
  EventBridge.initFullscreenWatcher();
  
  // Start observer for DOM changes
  ObserverGuard.start();
  
  // Initial injection attempt
  initOnce();
  
  // Watch for navigation changes (YouTube SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(initOnce, 100); // Small delay for DOM to settle
    }
  }).observe(document, { subtree: true, childList: true });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
} 