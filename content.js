// Notices when you type in a form field and tells the background script,
// so the goblin knows this tab has unsent work and must not be put to sleep.
const FIELD = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
let dirty = false;

function report(value) {
  if (dirty === value) return;
  dirty = value;
  try {
    chrome.runtime.sendMessage({ type: 'goblin-form', dirty: value }).catch(() => {});
  } catch {
    // Extension was reloaded; this old script can no longer talk to it.
  }
}

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches && el.matches(FIELD) && el.type !== 'hidden') report(true);
}, true);

// Submitting the form means the work was sent, so the tab is safe again.
document.addEventListener('submit', () => report(false), true);
