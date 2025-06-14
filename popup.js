document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('toggle').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      }, () => {
        chrome.tabs.sendMessage(tabId, { toggle: true });
      });
    });
  });
});
