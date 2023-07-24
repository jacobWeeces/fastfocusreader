function updateButtonTextFromStorage() {
  chrome.storage.local.get(["extensionIsActive"], function(result) {
    let extensionIsActive = !!result.extensionIsActive;
  });
}

document.getElementById('toggleButton').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tabId = tabs[0].id;
    chrome.runtime.sendMessage({command: "toggle", tabId: tabId}, function(response) {
    });    
  });
});

