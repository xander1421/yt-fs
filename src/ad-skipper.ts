/**
 * YouTube Tab-Fullscreen Extension - Ad Skipper Module
 * Premium Feature - Auto-skip YouTube ads
 */

// Ad-related constants
const AD_SKIP_SELECTORS = [
  '.ytp-skip-ad-button',           // Main skip button
  '.ytp-ad-skip-button',           // Alternative skip button
  '.ytp-ad-skip-button-modern',    // Modern variant
  '.videoAdUiSkipButton',          // Legacy selector
  'button[id^="skip-button:"]'     // ID-based selector for current structure
];

const AD_DETECTION_SELECTORS = [
  '.ytp-skip-ad',                  // Skip ad container
  '.ytp-skip-ad-button__text',     // Skip button text
  '.ytp-ad-text',                  // Ad text indicator
  '.ytp-ad-overlay-container',     // Ad overlay
  '.ytp-ad-player-overlay',        // Ad player overlay
  'div[id^="skip-ad:"]'           // ID-based ad container detection
];

/**
 * PremiumManager - Handles premium feature access
 */
export namespace PremiumManager {
  export function isPremium(): boolean {
    // TODO: Implement actual premium check
    // For now, return true for development
    return true;
  }

  export function showUpgradePrompt(): void {
    console.log('[YT-TabFS] Premium feature - upgrade required');
    // TODO: Show upgrade prompt UI
  }

  export function startAlways(): void {
    console.log('[YT-TabFS] Premium feature - starting always');
    AdSkipper.start();
  }
}

/**
 * AdSkipperDebug - Debug utilities for ad skipper
 */
export namespace AdSkipperDebug {
  export function startAlways(): void {
    console.log('[YT-TabFS] DEBUG: Starting ad skipper in always-on mode');
    AdSkipper.start();
  }

  export function logAdElements(): void {
    console.log('[YT-TabFS] DEBUG: Checking for ad elements...');
    
    // Check all detection selectors
    AD_DETECTION_SELECTORS.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`[YT-TabFS] DEBUG: Found ad element: ${selector}`, element);
      }
    });

    // Check all skip button selectors
    AD_SKIP_SELECTORS.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const style = window.getComputedStyle(element);
        console.log(`[YT-TabFS] DEBUG: Found skip button: ${selector}, opacity: ${style.opacity}`, element);
      }
    });

    // Check video element
    const video = document.querySelector('video');
    if (video) {
      console.log(`[YT-TabFS] DEBUG: Video element found, playbackRate: ${video.playbackRate}`);
    }
  }
}

/**
 * AdSkipper - Premium feature for auto-skipping YouTube ads
 */
export namespace AdSkipper {
  let isActive = false;
  let adCheckInterval: number | null = null;
  let skipAttemptCount = 0;
  let lastSkipAttempt = 0;
  let originalPlaybackRate = 1;
  
  // Constants for skip attempt management
  const MAX_SKIP_ATTEMPTS = 5;
  const SKIP_COOLDOWN_MS = 10000; // 10 seconds

  export function start(): void {
    if (!PremiumManager.isPremium()) {
      PremiumManager.startAlways();
    }
    
    if (isActive) return;
    
    console.log('[YT-TabFS] Starting ad skipper with proven method');
    isActive = true;
    
    startAdMonitoring();
  }

  export function stop(): void {
    if (!isActive) return;
    
    console.log('[YT-TabFS] Stopping ad skipper');
    isActive = false;
    
    if (adCheckInterval) {
      clearInterval(adCheckInterval);
      adCheckInterval = null;
    }
    
    // Restore normal playback speed if needed
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      restoreNormalSpeed(video);
    }
  }

  function startAdMonitoring(): void {
    if (!isActive) return;
    
    console.log('[YT-TabFS] Starting ad monitoring with 500ms interval (proven method)');
    
    // Use the proven 500ms interval approach
    adCheckInterval = window.setInterval(() => {
      if (isActive) {
        skipAd();
      }
    }, 500);
    
    // Also try immediately
    skipAd();
  }

  function skipAd(): void {
    if (!isActive) return;
    
    // Check if we're in YouTube Shorts (skip ads don't work there)
    if (window.location.pathname.startsWith('/shorts/')) {
      return;
    }
    
    // Primary ad detection: look for .ad-showing class (most reliable)
    const adShowing = document.querySelector('.ad-showing');
    
    // Also check for timed pie countdown ads and survey questions
    const pieCountdown = document.querySelector('.ytp-ad-timed-pie-countdown-container');
    const surveyQuestions = document.querySelector('.ytp-ad-survey-questions');
    
    // If no ads detected, restore normal speed and return
    if (!adShowing && !pieCountdown && !surveyQuestions) {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        restoreNormalSpeed(video);
      }
      
      // Reset counters when no ads
      if (skipAttemptCount > 0) {
        skipAttemptCount = 0;
      }
      return;
    }
    
    console.log('[YT-TabFS] Ad detected, attempting to skip');
    
    // Throttle skip attempts
    const now = Date.now();
    if (now - lastSkipAttempt < 2000) return; // Wait 2 seconds between attempts
    
    skipAttemptCount++;
    if (skipAttemptCount > MAX_SKIP_ATTEMPTS) {
      const timeSinceLastAttempt = now - lastSkipAttempt;
      if (timeSinceLastAttempt < SKIP_COOLDOWN_MS) {
        return; // Still in cooldown
      } else {
        skipAttemptCount = 0; // Reset counter after cooldown
      }
    }
    
    lastSkipAttempt = now;
    
    // Find the player element
    let playerEl: any = null;
    let player: any = null;
    
    // Try different player selectors
    playerEl = document.querySelector('#movie_player') || document.querySelector('#ytd-player');
    
    if (!playerEl) {
      console.log('[YT-TabFS] Player element not found');
      return;
    }
    
    // Get the player object
    if (playerEl.getPlayer && typeof playerEl.getPlayer === 'function') {
      player = playerEl.getPlayer();
    } else {
      player = playerEl;
    }
    
    if (!player) {
      console.log('[YT-TabFS] Player object not found');
      return;
    }
    
    // Method 1: For pie countdown and survey ads, use player reload method
    if (pieCountdown || surveyQuestions) {
      console.log('[YT-TabFS] Skipping pie countdown or survey ad using player reload');
      reloadVideoAtCurrentTime(player, playerEl);
      return;
    }
    
    // Method 2: For regular video ads, try video seeking first
    if (adShowing) {
      const adVideo = document.querySelector('video.html5-main-video') as HTMLVideoElement;
      
      if (adVideo && adVideo.src && !adVideo.paused && !isNaN(adVideo.duration)) {
        console.log('[YT-TabFS] Ad video found, seeking to end');
        
        // For YouTube Music, seek to end
        if (window.location.hostname === 'music.youtube.com') {
          adVideo.currentTime = adVideo.duration;
          console.log('[YT-TabFS] YouTube Music ad skipped by seeking to end');
          skipAttemptCount = 0; // Reset on success
          return;
        }
        
        // For regular YouTube, try seeking first, then reload if needed
        const originalTime = adVideo.currentTime;
        adVideo.currentTime = adVideo.duration;
        
        // Check if seeking worked after a short delay
        setTimeout(() => {
          if (document.querySelector('.ad-showing')) {
            console.log('[YT-TabFS] Seeking failed, using player reload method');
            reloadVideoAtCurrentTime(player, playerEl);
          } else {
            console.log('[YT-TabFS] Ad skipped successfully by seeking');
            skipAttemptCount = 0; // Reset on success
          }
        }, 1000);
        
      } else {
        // No video element or not ready, use player reload
        console.log('[YT-TabFS] No ad video element, using player reload method');
        reloadVideoAtCurrentTime(player, playerEl);
      }
    }
  }

  function reloadVideoAtCurrentTime(player: any, playerEl: any): void {
    try {
      // Get current video data
      if (!player.getVideoData || typeof player.getVideoData !== 'function') {
        console.log('[YT-TabFS] getVideoData not available');
        return;
      }
      
      const videoData = player.getVideoData();
      if (!videoData || !videoData.video_id) {
        console.log('[YT-TabFS] No video data available');
        return;
      }
      
      const videoId = videoData.video_id;
      const start = Math.floor(player.getCurrentTime ? player.getCurrentTime() : 0);
      
      console.log(`[YT-TabFS] Reloading video ${videoId} at ${start}s`);
      
      // Use the proven reload method
      if (playerEl.loadVideoWithPlayerVars && typeof playerEl.loadVideoWithPlayerVars === 'function') {
        playerEl.loadVideoWithPlayerVars({ videoId, start });
      } else if (playerEl.loadVideoByPlayerVars && typeof playerEl.loadVideoByPlayerVars === 'function') {
        playerEl.loadVideoByPlayerVars({ videoId, start });
      } else if (player.loadVideoById && typeof player.loadVideoById === 'function') {
        player.loadVideoById(videoId, start);
      } else {
        console.log('[YT-TabFS] No suitable reload method found');
        return;
      }
      
      console.log('[YT-TabFS] Ad skipped using player reload method');
      skipAttemptCount = 0; // Reset on success
      
    } catch (error) {
      console.log('[YT-TabFS] Player reload failed:', error);
      
      // Fallback: speed up the ad
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        speedUpAd(video);
      }
    }
  }

  function speedUpAd(video: HTMLVideoElement): void {
    // Capture current playback rate before changing it
    if (video.playbackRate !== 16) {
      originalPlaybackRate = video.playbackRate;
      video.playbackRate = 16;
      console.log(`[YT-TabFS] Speeding up ad from ${originalPlaybackRate}x to 16x`);
    }
  }

  function restoreNormalSpeed(video: HTMLVideoElement): void {
    if (video.playbackRate !== originalPlaybackRate) {
      video.playbackRate = originalPlaybackRate;
      console.log(`[YT-TabFS] Restored normal playback speed to ${originalPlaybackRate}x`);
    }
  }

  export function isRunning(): boolean {
    return isActive;
  }
} 