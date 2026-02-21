chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "super-copy-parent",
    title: "Super copy to markdown",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: "copy-as-markdown",
    parentId: "super-copy-parent",
    title: "Copy",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "open-options",
    parentId: "super-copy-parent",
    title: "Options",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy-as-markdown") {
    chrome.tabs.sendMessage(tab.id, { action: "copy-selection" });
  } else if (info.menuItemId === "open-options") {
    chrome.runtime.openOptionsPage();
  }
});
