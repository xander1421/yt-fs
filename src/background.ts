/**
 * YouTube Tab-Fullscreen Extension - Background Script
 * Handles keyboard shortcuts and commands
 */

// Listen for keyboard commands from the manifest
chrome.commands.onCommand.addListener(async (command: string) => {
  console.log('[YT-TabFS Background] Command received:', command);
  
  if (command === 'toggle-tabfs') {
    try {
      // Get the active tab
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      
      if (!activeTab?.id) {
        console.log('[YT-TabFS Background] No active tab found');
        return;
      }
      
      // Check if the tab is on YouTube
      if (!activeTab.url?.includes('youtube.com')) {
        console.log('[YT-TabFS Background] Not on YouTube, ignoring command');
        return;
      }
      
      // Send message to content script
      await chrome.tabs.sendMessage(activeTab.id, {
        action: 'toggle-tabfs'
      });
      
      console.log('[YT-TabFS Background] Toggle message sent to content script');
      
    } catch (error) {
      console.error('[YT-TabFS Background] Error handling command:', error);
    }
  }
});

// Optional: Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id && tab.url?.includes('youtube.com')) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggle-tabfs'
      });
    } catch (error) {
      console.error('[YT-TabFS Background] Error on icon click:', error);
    }
  }
});

console.log('[YT-TabFS Background] Background script loaded'); 