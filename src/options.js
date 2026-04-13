// options.js — Super Copy to Markdown

const DEFAULTS = { linkStyle: 'inline' };

const saveButton  = document.getElementById('save');
const resetButton = document.getElementById('reset');
const statusEl    = document.getElementById('status');

function applySettings(settings) {
  const radio = document.querySelector(`input[name="linkStyle"][value="${settings.linkStyle}"]`);
  if (radio) { radio.checked = true; }
}

function showStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? 'error' : '';
  setTimeout(() => { statusEl.textContent = ''; }, 1800);
}

// Load saved settings
chrome.storage.sync.get(DEFAULTS, applySettings);

// Save settings
saveButton.addEventListener('click', () => {
  const linkStyleRadio = document.querySelector('input[name="linkStyle"]:checked');
  const linkStyle = linkStyleRadio ? linkStyleRadio.value : DEFAULTS.linkStyle;
  chrome.storage.sync.set({ linkStyle }, () => showStatus('Saved.'));
});

// Reset to defaults
resetButton.addEventListener('click', () => {
  chrome.storage.sync.set(DEFAULTS, () => {
    applySettings(DEFAULTS);
    showStatus('Reset to defaults.');
  });
});
