/**
 * YouTube Tab-Fullscreen Extension - Background Script
 * Compatible with both Manifest V2 (Firefox) and V3 (Chrome)
 */

// Debug flag - set to false for production
const DEBUG_BG = false;

// Use browser API if available (Firefox), otherwise use chrome API
const browserAPI = (typeof browser !== 'undefined' && browser) ? browser : chrome;

// Listen for keyboard commands from the manifest
browserAPI.commands.onCommand.addListener(async (command: string) => {
  if (DEBUG_BG) console.log('[YT-TabFS Background] Command received:', command);
  if (command === 'toggle-tabfs') {
    try {
      // Get the active tab
      const tabs = await browserAPI.tabs.query({
        active: true,
        currentWindow: true
      });
      
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        if (DEBUG_BG) console.log('[YT-TabFS Background] No active tab found');
        return;
      }
      
      // Check if the tab is on YouTube
      if (!activeTab.url?.includes('youtube.com')) {
        if (DEBUG_BG) console.log('[YT-TabFS Background] Not on YouTube:', activeTab.url);
        return;
      }
      
      if (DEBUG_BG) console.log('[YT-TabFS Background] Sending toggle message to tab:', activeTab.id);
      // Send message to content script
      await browserAPI.tabs.sendMessage(activeTab.id, {
        action: 'toggle-tabfs'
      });
    } catch (error) {
      if (DEBUG_BG) console.error('[YT-TabFS Background] Error:', error);
    }
  }
});

// Handle extension icon click
// For Manifest V3 (Chrome)
if (browserAPI.action?.onClicked) {
  browserAPI.action.onClicked.addListener(async (tab: any) => {
    if (tab.id && tab.url?.includes('youtube.com')) {
      try {
        await browserAPI.tabs.sendMessage(tab.id, {
          action: 'toggle-tabfs'
        });
      } catch (error) {
        // Silent fail
      }
    }
  });
}

// For Manifest V2 (Firefox)
if (browserAPI.browserAction?.onClicked) {
  browserAPI.browserAction.onClicked.addListener(async (tab: any) => {
    if (tab.id && tab.url?.includes('youtube.com')) {
      try {
        await browserAPI.tabs.sendMessage(tab.id, {
          action: 'toggle-tabfs'
        });
      } catch (error) {
        // Silent fail
      }
    }
  });
}