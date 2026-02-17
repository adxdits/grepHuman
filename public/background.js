/**
 * grepHuman Background Service Worker
 * Handles extension lifecycle and cross-tab communication
 */

// Message types
const MessageType = {
  AnalyzePage: 'ANALYZE_PAGE',
  GetPageMetadata: 'GET_PAGE_METADATA',
  HideNonHumanResults: 'HIDE_NON_HUMAN_RESULTS',
  AnalysisComplete: 'ANALYSIS_COMPLETE'
};

/**
 * Extension installation handler
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[grepHuman] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // First time installation
    chrome.storage.local.set({
      settings: {
        autoAnalyze: true,
        showNotifications: false,
        googleFilterEnabled: false
      }
    });
  }
});

/**
 * Handle extension icon click (if popup is not set)
 */
chrome.action.onClicked.addListener(async (tab) => {
  // This only fires if no popup is defined in manifest
  // We have a popup, so this is a fallback
  if (tab.id) {
    await injectContentScript(tab.id);
  }
});

/**
 * Inject content script into a tab if not already present
 * @param {number} tabId - Tab ID to inject into
 */
async function injectContentScript(tabId) {
  try {
    // Check if content script is already responding
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' }).catch(() => null);
    if (response?.pong) {
      return; // Already injected
    }

    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js']
    });

    console.log('[grepHuman] Content script injected into tab:', tabId);
  } catch (error) {
    console.error('[grepHuman] Failed to inject content script:', error);
  }
}

/**
 * Handle messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('[grepHuman] Message handler error:', error);
      sendResponse({ error: error.message });
    });

  // Return true to indicate async response
  return true;
});

/**
 * Process incoming messages
 * @param {Object} message - The message object
 * @param {chrome.runtime.MessageSender} sender - Message sender info
 * @returns {Promise<Object>} Response object
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case MessageType.AnalyzePage: {
      const tab = await getCurrentTab();
      if (!tab?.id) {
        return { error: 'No active tab found' };
      }

      // Ensure content script is injected
      await injectContentScript(tab.id);

      // Request metadata from content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: MessageType.GetPageMetadata
      });

      return response;
    }

    default:
      return { error: 'Unknown message type' };
  }
}

/**
 * Get the currently active tab
 * @returns {Promise<chrome.tabs.Tab|null>}
 */
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  return tab || null;
}

/**
 * Listen for tab updates to potentially re-inject content script
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Only inject on http/https pages
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      // Content script will be injected via manifest's content_scripts
      // This handler is for any additional logic needed on page load
    }
  }
});

/**
 * Handle extension startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('[grepHuman] Extension started');
});

// Log service worker activation
console.log('[grepHuman] Background service worker active');
