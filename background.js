// Remembers which tabs have a half-filled form (kept in session storage,
// which resets when Chrome restarts, just like the tab ids do).
const key = (tabId) => 'dirty:' + tabId;

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'goblin-form' || !sender.tab) return;
  if (msg.dirty) chrome.storage.session.set({ [key(sender.tab.id)]: true });
  else chrome.storage.session.remove(key(sender.tab.id));
});

chrome.tabs.onRemoved.addListener((id) => chrome.storage.session.remove(key(id)));

// A fresh page load throws away anything typed, so the flag no longer applies.
chrome.tabs.onUpdated.addListener((id, info) => {
  if (info.status === 'loading') chrome.storage.session.remove(key(id));
});

// Tabs that were already open at install time have no content script yet.
chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'], discarded: false });
  for (const tab of tabs) {
    chrome.scripting
      .executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['content.js'] })
      .catch(() => {});
  }
});
