chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "super-copy-parent",
    title: "Super copy to markdown",
    contexts: ["all"],
  });

  // Group 1: copy selection as markdown
  chrome.contextMenus.create({
    id: "copy-as-markdown",
    parentId: "super-copy-parent",
    title: "Copy as markdown",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "copy-as-quote",
    parentId: "super-copy-parent",
    title: "Copy as quote",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "separator-1",
    parentId: "super-copy-parent",
    type: "separator",
    contexts: ["all"],
  });

  // Group 2: copy as link
  chrome.contextMenus.create({
    id: "copy-selection-as-link",
    parentId: "super-copy-parent",
    title: "Copy as link",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "copy-link-as-markdown",
    parentId: "super-copy-parent",
    title: "Copy link as markdown",
    contexts: ["link"],
  });
  chrome.contextMenus.create({
    id: "copy-page-link",
    parentId: "super-copy-parent",
    title: "Copy page link",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "separator-2",
    parentId: "super-copy-parent",
    type: "separator",
    contexts: ["all"],
  });

  // Group 3: copy image
  chrome.contextMenus.create({
    id: "copy-image-as-markdown",
    parentId: "super-copy-parent",
    title: "Copy image as markdown",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "separator-3",
    parentId: "super-copy-parent",
    type: "separator",
    contexts: ["all"],
  });

  // Group 4: options
  chrome.contextMenus.create({
    id: "open-options",
    parentId: "super-copy-parent",
    title: "Options",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy-as-markdown") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => { window.__scmd = { options: { quote: false } }; }
    }).then(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['turndown.js', 'turndown-plugin-gfm.js', 'content.js']
      });
    });
  } else if (info.menuItemId === "copy-as-quote") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => { window.__scmd = { options: { quote: true } }; }
    }).then(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['turndown.js', 'turndown-plugin-gfm.js', 'content.js']
      });
    });
  } else if (info.menuItemId === "copy-selection-as-link") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['copy-selection-as-link.js']
    });
  } else if (info.menuItemId === "copy-link-as-markdown") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (linkUrl, selectionText) => {
        function firstLine(text) {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
          if (lines.length === 0) { return ''; }
          return lines.length > 1 ? lines[0] + '\u2026' : lines[0];
        }
        let caption = firstLine(selectionText);
        if (!caption) {
          const match = Array.from(document.querySelectorAll('a')).find(a => a.href === linkUrl);
          caption = match ? firstLine(match.textContent) : '';
        }
        if (!caption) { caption = linkUrl; }
        const escaped = caption.replace(/[[\]]/g, '\\$&');
        navigator.clipboard.writeText(`[${escaped}](<${linkUrl}>)`).catch(err => {
          console.error('Super Copy to Markdown: clipboard write failed', err);
        });
      },
      args: [info.linkUrl, info.selectionText || '']
    });
  } else if (info.menuItemId === "copy-image-as-markdown") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (srcUrl, selectionText) => {
        function firstLine(text) {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
          if (lines.length === 0) { return ''; }
          return lines.length > 1 ? lines[0] + '\u2026' : lines[0];
        }
        let alt = firstLine(selectionText);
        if (!alt) {
          const match = Array.from(document.querySelectorAll('img')).find(img => img.src === srcUrl);
          alt = match ? firstLine(match.getAttribute('alt') || '') : '';
        }
        const escaped = alt.replace(/[[\]]/g, '\\$&');
        navigator.clipboard.writeText(`![${escaped}](<${srcUrl}>)`).catch(err => {
          console.error('Super Copy to Markdown: clipboard write failed', err);
        });
      },
      args: [info.srcUrl, info.selectionText || '']
    });
  } else if (info.menuItemId === "copy-page-link") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['copy-link.js']
    });
  } else if (info.menuItemId === "open-options") {
    chrome.runtime.openOptionsPage();
  }
});
