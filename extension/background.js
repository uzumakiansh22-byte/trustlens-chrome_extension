chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeTrust",
    title: "Analyse with TrustLens PRO",
    contexts: ["selection", "image", "video", "link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
  const type = info.selectionText ? "text" : (info.mediaType || "image");
  const content = info.selectionText || info.srcUrl || info.linkUrl;
  
  if (content) {
    chrome.storage.local.set({ result: { loading: true } });
    fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content })
    })
    .then(res => res.json())
    .then(data => chrome.storage.local.set({ result: { ...data, loading: false } }))
    .catch(() => chrome.storage.local.set({ result: { error: "Server Offline", loading: false } }));
  }
});