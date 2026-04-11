chrome.runtime.onInstalled.addListener(() => {
    // Create the right-click menu for all media types
    chrome.contextMenus.create({
        id: "trustlens-analyze",
        title: "Analyse with TrustLens PRO",
        contexts: ["image", "video", "selection", "page"]
    });
});

/** Queue scan for the side panel (reliable; runtime.sendMessage can drop if no listener yet). */
function queueScan(payload) {
    chrome.storage.session.set({ pendingScan: payload });
}

function isLikelyDirectMediaUrl(url) {
    if (!url || typeof url !== "string") return false;
    if (url.startsWith("data:image/") || url.startsWith("data:video/")) return true;
    if (url.startsWith("blob:")) return true;

    const lower = url.toLowerCase();
    if (/\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?|$)/.test(lower)) return true;
    if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(lower)) return true;
    if (lower.includes("cdninstagram.com") || lower.includes("fbcdn.net") || lower.includes("twimg.com")) return true;
    return false;
}

/** Session storage quota is small; huge data URLs must skip storage. */
const MAX_SCAN_STORAGE_CHARS = 700_000;

function deliverReadyScan(ts, mediaType, content, source) {
    if (!content) {
        queueScan({ mediaType, content: null, ts, status: "ready", source });
        return;
    }
    if (typeof content === "string" && content.length > MAX_SCAN_STORAGE_CHARS) {
        chrome.runtime.sendMessage({
            type: "START_SCAN",
            mediaType,
            content,
            source: `${source}:large-payload`
        });
        return;
    }
    queueScan({ mediaType, content, ts, status: "ready", source });
}

function queueViewportCapture(tab, ts, hintSource) {
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 88 }, (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) {
            queueScan({
                mediaType: "image",
                content: null,
                ts,
                status: "ready",
                source: `${hintSource}:capture-failed`
            });
            return;
        }
        queueScan({
            mediaType: "image",
            content: dataUrl,
            ts,
            status: "ready",
            source: `${hintSource}:viewport-capture`
        });
    });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    // 1. Wake up the sidepanel immediately
    chrome.sidePanel.open({ tabId: tab.id });

    // 2. Identify what was clicked
    let type = info.selectionText ? "text" : (info.videoUrl ? "video" : "image");
    let content = info.selectionText || info.srcUrl || info.videoUrl;
    const ts = Date.now();

    // Immediately show loading in sidepanel
    setTimeout(() => {
        queueScan({ mediaType: type, content: null, ts, status: "loading", source: "resolving" });
    }, 200);

    // Text selections can be queued instantly
    if (type === "text" && content) {
        setTimeout(() => {
            queueScan({ mediaType: "text", content, ts, status: "ready", source: "selection:text" });
        }, 350);
        return;
    }

    // 3. Social media / platforms: resolve the actual public media URL via DOM/meta tags.
    // Instagram in particular often doesn't expose srcUrl/videoUrl to context menu.
    const pageUrl = info.pageUrl || tab.url || "";
    const fallbackUrl = content || pageUrl;

    setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
            type: "GET_PUBLIC_MEDIA",
            hintMediaType: type,
            clickedUrl: content || null,
            pageUrl
        }, (response) => {
            if (chrome.runtime.lastError) {
                queueViewportCapture(tab, ts, "content-script-unreachable");
                return;
            }
            const resolvedType = response?.mediaType || type;
            let resolvedContent = response?.content || fallbackUrl;
            const source = response?.source || "fallback";

            const proceed = () => {
                const isMedia = isLikelyDirectMediaUrl(resolvedContent);
                if (!isMedia) {
                    queueViewportCapture(tab, ts, source);
                    return;
                }
                deliverReadyScan(ts, resolvedType, resolvedContent, source);
            };

            if (typeof resolvedContent === "string" && resolvedContent.startsWith("blob:")) {
                chrome.tabs.sendMessage(tab.id, { type: "GET_BLOB_AS_DATAURL", blobUrl: resolvedContent }, (r) => {
                    if (chrome.runtime.lastError || !r?.dataUrl) {
                        queueViewportCapture(tab, ts, `${source}:blob-convert-fail`);
                        return;
                    }
                    resolvedContent = r.dataUrl;
                    const outType =
                        resolvedType === "video" && resolvedContent.startsWith("data:image/")
                            ? "image"
                            : resolvedType;
                    deliverReadyScan(ts, outType, resolvedContent, `${source}:blob->dataUrl`);
                });
                return;
            }

            proceed();
        });
    }, 650);
});