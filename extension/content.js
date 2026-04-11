chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_BLOB_AS_DATAURL") {
        tryFetchBlobUrl(request.blobUrl)
            .then((dataUrl) => sendResponse(dataUrl ? { dataUrl } : { error: "empty" }))
            .catch(() => sendResponse({ error: "convert-failed" }));
        return true;
    }
    if (request.type === "GET_PUBLIC_MEDIA") {
        resolvePublicMedia(request)
            .then((res) => sendResponse(res))
            .catch((err) => sendResponse({ error: err?.message || String(err) }));
        return true;
    }
    return false;
});

function meta(name, attr = "property") {
    return document.querySelector(`meta[${attr}="${name}"]`)?.getAttribute("content") || null;
}

function pickFirst(...vals) {
    for (const v of vals) {
        if (typeof v === "string" && v.trim().length) return v.trim();
    }
    return null;
}

function pickBestFromSrcset(srcset) {
    if (!srcset) return null;
    const parts = srcset.split(",").map((p) => p.trim()).filter(Boolean);
    let best = null;
    let bestW = -1;
    for (const p of parts) {
        const m = p.match(/^(https?:\/\/\S+)\s+(\d+)w$/);
        if (m) {
            const w = Number(m[2]);
            if (w > bestW) {
                bestW = w;
                best = m[1];
            }
        } else if (!best) {
            best = p.split(/\s+/)[0];
        }
    }
    return best;
}

function isInstagramHost() {
    try {
        return /(^|\.)instagram\.com$/i.test(location.hostname);
    } catch {
        return false;
    }
}

function isInstagramCdnUrl(url) {
    if (!url || typeof url !== "string") return false;
    const u = url.toLowerCase();
    if (u.startsWith("blob:") || u.startsWith("data:")) return true;
    return (
        u.includes("cdninstagram.com") ||
        u.includes("fbcdn.net") ||
        /\.cdninstagram\.com/i.test(url)
    );
}

function isProbablyAvatarOrIcon(img) {
    const src = (img.getAttribute("src") || img.src || "").toLowerCase();
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if (w > 0 && w < 120 && h > 0 && h < 120) return true;
    if (src.includes("/s150x150/") || src.includes("/s320x320/") && w < 200) return true;
    if (src.includes("rsrc.php")) return true;
    return false;
}

/** Intersection area of element with viewport (pixels). */
function viewportScore(el) {
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return ix * iy;
}

function findBestInstagramArticle() {
    const articles = Array.from(document.querySelectorAll("article"));
    if (!articles.length) return null;

    let best = null;
    let bestScore = 0;
    for (const a of articles) {
        const s = viewportScore(a);
        if (s > bestScore) {
            bestScore = s;
            best = a;
        }
    }
    return bestScore > 4000 ? best : articles[0];
}

function bestVideoUrlFromEl(video) {
    if (!video) return null;
    const poster = video.getAttribute("poster") || "";
    const sources = Array.from(video.querySelectorAll("source[src]"));
    let bestSrc = null;
    let bestBytes = -1;
    for (const s of sources) {
        const u = s.getAttribute("src");
        if (!u || !isInstagramCdnUrl(u)) continue;
        const m = u.match(/(\d+)p?_?(\d+)?/);
        const guess = m ? parseInt(m[1], 10) : 0;
        const br = s.getAttribute("data-bitrate");
        const b = br ? parseInt(br, 10) : guess * 1000;
        if (b > bestBytes) {
            bestBytes = b;
            bestSrc = u;
        }
    }
    const direct = video.getAttribute("src") || video.currentSrc || "";
    if (direct && !direct.startsWith("blob:") && isInstagramCdnUrl(direct)) {
        return direct;
    }
    if (bestSrc) return bestSrc;
    if (direct && direct.startsWith("blob:")) return direct;
    if (poster && isInstagramCdnUrl(poster)) return { video: null, poster };
    return null;
}

/** Best in-viewport Reel/post video; distinguishes real MP4 URL vs poster-only vs blob. */
function pickInstagramVideoMedia(root) {
    const videos = Array.from(root.querySelectorAll("video"));
    let best = null;
    let bestArea = 0;
    for (const v of videos) {
        const score = viewportScore(v);
        if (score < 100) continue;
        const area = v.clientWidth * v.clientHeight;
        const urlish = bestVideoUrlFromEl(v);
        const hasSignal =
            (typeof urlish === "string" && urlish.length) ||
            (urlish && urlish.poster);
        if (hasSignal && area > bestArea) {
            bestArea = area;
            best = v;
        }
    }
    if (!best) return null;
    const r = bestVideoUrlFromEl(best);
    const poster = (best.getAttribute("poster") || "").trim();
    if (typeof r === "string") {
        return { mediaType: "video", url: r, poster };
    }
    if (r && r.poster) {
        return { mediaType: "image", url: r.poster, poster: "" };
    }
    const direct = (best.getAttribute("src") || best.currentSrc || "").trim();
    if (direct) return { mediaType: "video", url: direct, poster };
    return null;
}

function imgEffectiveUrl(img) {
    const fromSet = pickBestFromSrcset(img.getAttribute("srcset") || "");
    return pickFirst(fromSet, img.getAttribute("src"), img.currentSrc, img.src);
}

/** HTTPS CDN URLs only (not data:/blob: — those are already analyzable locally). */
function isStrictInstagramCdnHttps(url) {
    if (!url || typeof url !== "string") return false;
    const u = url.toLowerCase();
    if (!u.startsWith("http")) return false;
    if (u.includes("rsrc.php")) return false;
    return u.includes("cdninstagram.com") || u.includes("fbcdn.net") || /\.cdninstagram\.com/i.test(url);
}

const MAX_IG_MATERIALIZE_BYTES = 4 * 1024 * 1024;

function tryImageUrlToDataUrlViaCanvas(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const nw = img.naturalWidth || img.width;
                const nh = img.naturalHeight || img.height;
                if (!nw || !nh) {
                    resolve(null);
                    return;
                }
                const maxSide = 2048;
                const scale = Math.min(1, maxSide / Math.max(nw, nh));
                const w = Math.round(nw * scale);
                const h = Math.round(nh * scale);
                const c = document.createElement("canvas");
                c.width = w;
                c.height = h;
                c.getContext("2d").drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL("image/jpeg", 0.9));
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

/** Groq/Sightengine cannot reliably fetch IG CDN URLs; grab bytes in-page (correct Referer / session). */
async function tryMaterializeInstagramHttps(url) {
    if (!isStrictInstagramCdnHttps(url)) return null;
    try {
        const res = await fetch(url, {
            credentials: "omit",
            mode: "cors",
            referrerPolicy: "strict-origin-when-cross-origin"
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob.size || blob.size > MAX_IG_MATERIALIZE_BYTES) return null;
        if ((blob.type || "").toLowerCase().startsWith("video/")) return null;
        return await blobToDataUrl(blob);
    } catch {
        /* CORS — try decode via Image (some CDNs allow this path) */
    }
    return await tryImageUrlToDataUrlViaCanvas(url);
}

async function finalizeInstagramResolvedMedia(res) {
    if (!res?.content || typeof res.content !== "string") return res;
    if (!isInstagramHost()) return res;
    if (res.content.startsWith("data:") || res.content.startsWith("blob:")) return res;
    if (!isStrictInstagramCdnHttps(res.content)) return res;
    const dataUrl = await tryMaterializeInstagramHttps(res.content);
    if (!dataUrl) return res;
    const isVideoData = dataUrl.startsWith("data:video/");
    return {
        ...res,
        mediaType: isVideoData ? "video" : "image",
        content: dataUrl,
        source: `${res.source}:materialized`
    };
}

function pickInstagramCarouselImage(article) {
    const activeLi = article.querySelector('li[aria-hidden="false"]');
    const scope = activeLi || article;
    const imgs = Array.from(scope.querySelectorAll("img"));
    let best = null;
    let bestPx = 0;
    for (const img of imgs) {
        if (isProbablyAvatarOrIcon(img)) continue;
        const u = imgEffectiveUrl(img);
        if (!u || !isInstagramCdnUrl(u)) continue;
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        const px = w * h || 1;
        if (px > bestPx) {
            bestPx = px;
            best = u;
        }
    }
    return best;
}

function pickInstagramImage(root) {
    if (root && root.tagName === "ARTICLE") {
        const car = pickInstagramCarouselImage(root);
        if (car) return car;
    }

    const imgs = Array.from(root.querySelectorAll("img"));
    let best = null;
    let bestPx = 0;
    for (const img of imgs) {
        if (isProbablyAvatarOrIcon(img)) continue;
        const u = imgEffectiveUrl(img);
        if (!u || !isInstagramCdnUrl(u)) continue;
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        const px = w * h || 5000;
        const vis = viewportScore(img);
        const score = px * (vis > 0 ? 1 + vis / 1e6 : 0.1);
        if (score > bestPx) {
            bestPx = score;
            best = u;
        }
    }
    return best;
}

function extractInstagramJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
        let data;
        try {
            data = JSON.parse(s.textContent || "null");
        } catch {
            continue;
        }
        const nodes = Array.isArray(data) ? data : [data];
        for (const node of nodes) {
            if (!node || typeof node !== "object") continue;
            const t = node["@type"];
            const types = Array.isArray(t) ? t : [t];
            if (types.includes("VideoObject")) {
                const v = pickFirst(node.contentUrl, node.embedUrl, node.url);
                if (v && typeof v === "string") return { video: v };
                const th = node.thumbnailUrl;
                if (typeof th === "string") return { image: th };
                if (Array.isArray(th) && th[0]) return { image: String(th[0]) };
            }
            if (types.includes("ImageObject") && node.url) {
                return { image: String(node.url) };
            }
        }
    }
    return null;
}

async function resolveInstagramMedia({ hintMediaType, clickedUrl, pageUrl }) {
    if (clickedUrl && isInstagramCdnUrl(clickedUrl) && !clickedUrl.toLowerCase().includes("rsrc.php")) {
        const mt =
            hintMediaType || (clickedUrl.toLowerCase().includes(".mp4") ? "video" : "image");
        return { mediaType: mt, content: clickedUrl, source: "instagram:context-menu-url" };
    }

    const ld = extractInstagramJsonLd();
    if (ld?.video) return { mediaType: "video", content: ld.video, source: "instagram:json-ld:video" };
    if (ld?.image) return { mediaType: "image", content: ld.image, source: "instagram:json-ld:image" };

    const article = findBestInstagramArticle();
    const scope = article || document.querySelector("main") || document.body;

    const vm = pickInstagramVideoMedia(scope);
    if (vm) {
        if (vm.mediaType === "image") {
            return { mediaType: "image", content: vm.url, source: "instagram:video-poster" };
        }
        if (vm.url.startsWith("blob:")) {
            const dataVid = await tryFetchBlobUrl(vm.url);
            if (dataVid) {
                const MAX_B64 = 1_200_000;
                if (
                    dataVid.length > MAX_B64 &&
                    vm.poster &&
                    isInstagramCdnUrl(vm.poster)
                ) {
                    return {
                        mediaType: "image",
                        content: vm.poster,
                        source: "instagram:poster-instead-of-large-blob"
                    };
                }
                return {
                    mediaType: "video",
                    content: dataVid,
                    source: "instagram:blob-video->dataUrl"
                };
            }
            if (vm.poster && isInstagramCdnUrl(vm.poster)) {
                return {
                    mediaType: "image",
                    content: vm.poster,
                    source: "instagram:blob-fail-use-poster"
                };
            }
        } else {
            return { mediaType: "video", content: vm.url, source: "instagram:article:video" };
        }
    }

    const imgUrl = pickInstagramImage(scope);
    if (imgUrl) {
        return { mediaType: "image", content: imgUrl, source: "instagram:article:image" };
    }

    const ogImage = pickFirst(meta("og:image"), meta("og:image:url"), meta("og:image:secure_url"));
    const ogVideo = pickFirst(meta("og:video"), meta("og:video:url"), meta("og:video:secure_url"));
    if (ogVideo) return { mediaType: "video", content: ogVideo, source: "instagram:og:video" };
    if (ogImage) return { mediaType: "image", content: ogImage, source: "instagram:og:image" };

    const fallback = pickFirst(clickedUrl, pageUrl);
    return { mediaType: hintMediaType || "image", content: fallback, source: "instagram:fallback:url" };
}

async function blobToDataUrl(blob) {
    return await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject(new Error("Failed to read blob"));
        r.onload = () => resolve(r.result);
        r.readAsDataURL(blob);
    });
}

async function tryFetchBlobUrl(url) {
    if (!url || typeof url !== "string" || !url.startsWith("blob:")) return null;
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await blobToDataUrl(blob);
    } catch {
        return null;
    }
}

async function resolvePublicMedia({ hintMediaType, clickedUrl, pageUrl }) {
    const blobData = await tryFetchBlobUrl(clickedUrl);
    if (blobData) {
        return {
            mediaType: hintMediaType || "image",
            content: blobData,
            source: isInstagramHost() ? "instagram:blob->dataUrl" : "blob->dataUrl"
        };
    }

    if (isInstagramHost()) {
        const ig = await resolveInstagramMedia({ hintMediaType, clickedUrl, pageUrl });
        if (ig?.content) return await finalizeInstagramResolvedMedia(ig);
    }

    const ogVideo = pickFirst(meta("og:video"), meta("og:video:url"), meta("og:video:secure_url"));
    const ogImage = pickFirst(meta("og:image"), meta("og:image:url"), meta("og:image:secure_url"));
    const twStream = pickFirst(meta("twitter:player:stream", "name"), meta("twitter:player:stream", "property"));
    const twImage = pickFirst(meta("twitter:image", "name"), meta("twitter:image", "property"));

    const metaVideo = pickFirst(ogVideo, twStream);
    if (metaVideo) {
        return await finalizeInstagramResolvedMedia({
            mediaType: "video",
            content: metaVideo,
            source: "meta:video"
        });
    }

    const metaImg = pickFirst(ogImage, twImage);
    if (metaImg) {
        return await finalizeInstagramResolvedMedia({
            mediaType: "image",
            content: metaImg,
            source: "meta:image"
        });
    }

    const v = document.querySelector("article video[src], video[src], article video source[src], video source[src]");
    const videoUrl = v?.getAttribute?.("src") || v?.src || null;
    if (videoUrl) {
        if (videoUrl.startsWith("blob:")) {
            const asData = await tryFetchBlobUrl(videoUrl);
            if (asData) {
                return { mediaType: "video", content: asData, source: "dom:video+blob" };
            }
        }
        return await finalizeInstagramResolvedMedia({
            mediaType: "video",
            content: videoUrl,
            source: "dom:video"
        });
    }

    const imgEl = document.querySelector("article img") || document.querySelector("img");
    if (imgEl) {
        const best = pickBestFromSrcset(imgEl.getAttribute("srcset") || "");
        const imgUrl = pickFirst(best, imgEffectiveUrl(imgEl));
        if (imgUrl) {
            return await finalizeInstagramResolvedMedia({
                mediaType: "image",
                content: imgUrl,
                source: "dom:image"
            });
        }
    }

    const fallback = pickFirst(clickedUrl, pageUrl);
    return await finalizeInstagramResolvedMedia({
        mediaType: hintMediaType || "image",
        content: fallback,
        source: "fallback:url"
    });
}
