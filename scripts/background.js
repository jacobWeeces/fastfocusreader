function handleMessage(request, sender, sendResponse) {
  const tabId = request.tabId;
  if (request.command === "toggle") {
    // Get the current state for this specific tab
    chrome.storage.local.get([`extensionIsActive_${tabId}`], function(result) {
      let extensionIsActive = !!result[`extensionIsActive_${tabId}`];

      if (extensionIsActive) {
        // If the extension is active, reload the tab to remove the content script.
        chrome.tabs.reload(tabId);
        // Store state as inactive for this specific tab
        chrome.storage.local.set({[`extensionIsActive_${tabId}`]: false});
        sendResponse({extensionIsActive: false});
      } else {
        // Otherwise, just notify the content script that the extension is now active.
        chrome.scripting.executeScript({
          target: {tabId: tabId},
          files: ["scripts/content.js"]
        }, () => {
          chrome.tabs.sendMessage(tabId, {command: "activate"});
          // Store state as active for this specific tab
          chrome.storage.local.set({[`extensionIsActive_${tabId}`]: true});
          sendResponse({extensionIsActive: true});
        });
      }
    });
    return true;  // Indicate that the response will be sent asynchronously.
  } else if (request.command === "getState") {
    chrome.storage.local.get([`extensionIsActive_${tabId}`], function(result) {
      sendResponse(!!result[`extensionIsActive_${tabId}`]);
    });
    return true;  // Indicate that the response will be sent asynchronously.
  }
}

// Inject content script when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get([`extensionIsActive_${tabId}`], function(result) {
      if (!!result[`extensionIsActive_${tabId}`]) {
        chrome.scripting.executeScript({
          target: {tabId: tabId},
          files: ["scripts/content.js"]
        }, () => {
          chrome.tabs.sendMessage(tabId, {command: "activate"});
        });
      }
    });
  }
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === 'updateTabStorage') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const tabId = tabs[0].id;
        chrome.storage.local.set({[`extensionIsActive_${tabId}`]: request.state});
      }
    });
    sendResponse({status: 'done'});
  } else if (request.command) {
    handleMessage(request, sender, sendResponse);
    return true;  // Indicate that the response will be sent asynchronously.
  }
});
