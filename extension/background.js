// background.js
let pendingData = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeTrustLens",
    title: "Analyse with TrustLens",
    contexts: ["image", "video", "selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeTrustLens") {
    pendingData = {
      type: info.selectionText ? "text" : (info.mediaType === "video" ? "video" : "image"),
      data: info.selectionText || info.srcUrl
    };
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SIDEPANEL_READY" && pendingData) {
    chrome.runtime.sendMessage({ 
      type: "CONTEXT_MENU_AUDIT", 
      contentType: pendingData.type,
      data: pendingData.data 
    });
    pendingData = null; 
  }
});
