// Grab UI Elements
const scanOutput = document.getElementById('scan-results');
const chatBox = document.getElementById('chat-box');

// --- 1. THE CHATBOT (With Bubbles) ---
document.getElementById('send-chat').onclick = () => {
    const input = document.getElementById('chat-input');
    const query = input.value.trim();
    if (!query) return;

    chatBox.innerHTML += `<div class="msg-row user-row"><div class="bubble user-bubble">${escapeHtml(query)}</div></div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, context: scanOutput.innerText })
    })
    .then(res => res.json())
    .then(data => {
        const reply = data.reply || data.error || 'No reply.';
        chatBox.innerHTML += `<div class="msg-row ai-row"><div class="bubble ai-bubble">${escapeHtml(reply)}</div></div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    })
    .catch(() => {
        chatBox.innerHTML += `<div class="msg-row ai-row"><div class="bubble ai-bubble error">Server connection failed</div></div>`;
    });
};

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function sanitizeHttpUrl(u) {
    if (!u || typeof u !== 'string') return '';
    try {
        const url = new URL(u.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
        return url.href;
    } catch {
        return '';
    }
}

function renderVerificationSources(list) {
    if (!Array.isArray(list) || !list.length) {
        return `<p class="sources-empty">No web sources were returned. Enable search-capable models (OpenRouter online) and API keys, or verify claims manually.</p>`;
    }
    const items = list
        .map((s) => {
            const href = sanitizeHttpUrl(s.url);
            const title = escapeHtml(String(s.title || href || 'Source'));
            const sup = escapeHtml(String(s.supports || ''));
            if (!href) {
                return `<li class="source-item"><span class="source-title">${title}</span>${sup ? ` <span class="source-support">(${sup})</span>` : ''}</li>`;
            }
            return `<li class="source-item"><a class="source-link" href="${href}" target="_blank" rel="noopener noreferrer">${title}</a>${sup ? ` <span class="source-support">· ${sup}</span>` : ''}</li>`;
        })
        .join('');
    return `<ul class="source-list">${items}</ul>`;
}

function renderTraceUrls(urls, note) {
    const arr = Array.isArray(urls) ? urls.map(sanitizeHttpUrl).filter(Boolean) : [];
    let html = '';
    if (arr.length) {
        html += '<ul class="trace-list">';
        for (const href of [...new Set(arr)]) {
            const short = href.length > 72 ? href.slice(0, 70) + '…' : href;
            html += `<li><a class="trace-link" href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(short)}</a></li>`;
        }
        html += '</ul>';
    }
    if (note && String(note).trim()) {
        html += `<p class="trace-note">${escapeHtml(String(note).trim())}</p>`;
    }
    if (!html) {
        return `<p class="sources-empty">No traceable URLs for this image yet (common for unique UGC). Try Google Lens / TinEye from the original post.</p>`;
    }
    return html;
}

/** Unicode escapes so icons render even if source file encoding is wrong */
const ICON = {
    scan: '\u{1F50D}',
    folder: '\u{1F4C1}',
    genAi: '\u{1F916}',
    face: '\u{1F441}\uFE0F',
    lab: '\u{1F52C}',
    balance: '\u{2696}\uFE0F',
    globe: '\u{1F310}',
    flagRed: '\u{1F6A9}',
    check: '\u{2705}\uFE0F'
};

// --- 2. THE SCAN ENGINE ---
/** @param {{ analysisSource?: string }} meta */
const runScan = (type, content, meta = {}) => {
    const analysisSource = meta.analysisSource || 'manual';
    if (!content) {
        scanOutput.innerHTML = `<div class="error">Nothing to analyze (empty selection or URL).</div>`;
        return;
    }
    scanOutput.innerHTML = `<div class="loader"><div class="loader-line"><span class="loader-dot"></span> Analysing forensic pillars…</div><span class="loader-source">${escapeHtml(analysisSource)}</span></div>`;

    fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(j => Promise.reject(j.message || j.error || res.statusText));
        }
        return res.json();
    })
    .then(data => {
        if (data && data.error) throw new Error(data.error);
        const d = data.results && data.results[0] ? data.results[0] : data;
        if (!d) throw new Error('No results from server');
        const rep = d.detailed_report || {};
        const gen = rep.gen_ai_analysis || rep.gen_ai || '—';
        const face = rep.face_forensics || rep.face || '—';
        const forensics = rep.metadata_editing || rep.forensics || '—';
        const logic = rep.physical_logic || rep.logic || '—';
        const provenance = rep.provenance_check || rep.source || '—';

        const red = Array.isArray(d.red_flags) ? d.red_flags[0] : d.red_flags;
        const green = Array.isArray(d.green_flags) ? d.green_flags[0] : d.green_flags;

        const isImageResult = data.type === 'image';

        const ocrVerdict = d.ocr_claim_verdict != null ? String(d.ocr_claim_verdict) : '';
        const ocrType = d.ocr_claim_type != null ? String(d.ocr_claim_type) : '';
        const ocrClaimBox =
            isImageResult && (ocrVerdict || ocrType || d.ocr_claim_summary)
                ? `<div class="ocr-claim-box glass-panel-inner">
                <h4 class="section-title">Text on image (fact-check)</h4>
                ${ocrType ? `<p class="ocr-claim-meta">Type: <strong>${escapeHtml(ocrType)}</strong></p>` : ''}
                ${ocrVerdict ? `<p class="ocr-claim-verdict">Claim check: <strong>${escapeHtml(ocrVerdict)}</strong>${d.ocr_claim_trust_score != null ? ` · score ${escapeHtml(String(d.ocr_claim_trust_score))}` : ''}</p>` : ''}
                ${d.ocr_claim_summary ? `<p class="ocr-claim-summary">${escapeHtml(String(d.ocr_claim_summary))}</p>` : ''}
                <p class="ocr-disclaimer">Automated fact-checks can be wrong. Use real sources before sharing.</p>
            </div>`
                : '';

        const sourcesBlock = `<div class="sources-box glass-panel-inner">
            <h4 class="section-title">Sources that support or debunk on-image claims</h4>
            ${renderVerificationSources(d.verification_sources)}
        </div>`;

        const traceBlock = `<div class="trace-box glass-panel-inner">
            <h4 class="section-title">Where this media might appear elsewhere</h4>
            ${renderTraceUrls(d.media_trace_urls, d.media_trace_note)}
        </div>`;

        const evidenceSections = isImageResult ? `${sourcesBlock}${traceBlock}` : '';

        scanOutput.innerHTML = `
            <div class="result-card glass-panel">
                <div class="analysis-source-row"><span class="analysis-source-label">Analysis source</span><code class="analysis-source-value">${escapeHtml(analysisSource)}</code></div>
                <div class="ocr-top">OCR / claim: <span>"${escapeHtml(String(d.transcribed_text || d.content_summary || 'No text detected'))}"</span></div>
                ${ocrClaimBox}
                <div class="big-score">${d.trust_score ?? 0}%</div>
                <div class="verdict-label">${escapeHtml(String(d.verdict || 'UNCERTAIN'))}</div>

                <div class="pillar-grid">
                    <div class="pillar">${ICON.genAi} GEN-AI: ${escapeHtml(String(gen))}</div>
                    <div class="pillar">${ICON.face} FACE: ${escapeHtml(String(face))}</div>
                    <div class="pillar">${ICON.lab} FORENSICS: ${escapeHtml(String(forensics))}</div>
                    <div class="pillar">${ICON.balance} LOGIC: ${escapeHtml(String(logic))}</div>
                    <div class="pillar">${ICON.globe} PROVENANCE: ${escapeHtml(String(provenance))}</div>
                </div>

                <div class="audit-summary-box">
                    <strong>Final audit:</strong> ${escapeHtml(String(d.summary || 'Analysis complete.'))}
                </div>

                <div class="flag-row">
                    <div class="f-box red">${ICON.flagRed} Red: ${escapeHtml(String(red || 'None'))}</div>
                    <div class="f-box green">${ICON.check} Green: ${escapeHtml(String(green || 'None'))}</div>
                </div>
                ${evidenceSections}
            </div>
        `;
    })
    .catch(err => {
        const msg = typeof err === 'string' ? err : (err && err.message) ? err.message : 'Scan failed.';
        scanOutput.innerHTML = `<div class="error">${escapeHtml(msg)} Check that the backend is running on port 5000.</div>`;
    });
};

// --- 3. Side panel: consume queued scans (storage is set by background.js) ---
let lastConsumedReadyTs = 0;
let lastConsumedLoadingTs = 0;

function drainPendingScan() {
    chrome.storage.session.get(['pendingScan'], (data) => {
        if (!data.pendingScan) return;
        const p = data.pendingScan;
        const ts = p.ts || 0;
        chrome.storage.session.remove('pendingScan', () => {
            if (p.status === 'loading') {
                if (ts <= lastConsumedLoadingTs) return;
                lastConsumedLoadingTs = ts;
                scanOutput.innerHTML = `<div class="loader"><span class="loader-dot"></span> Preparing scan…</div>`;
                return;
            }
            if (ts <= lastConsumedReadyTs) return;
            lastConsumedReadyTs = ts;
            runScan(p.mediaType, p.content, { analysisSource: p.source || 'unknown' });
        });
    });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'session' || !changes.pendingScan || !changes.pendingScan.newValue) return;
    drainPendingScan();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drainPendingScan);
} else {
    drainPendingScan();
}

chrome.runtime.onMessage.addListener((request) => {
    if (request && request.type === 'START_SCAN' && request.mediaType && request.content !== undefined) {
        runScan(request.mediaType, request.content, { analysisSource: request.source || 'message' });
    }
});

// --- 4. Manual controls ---
document.getElementById('url-btn').onclick = () => {
    const url = document.getElementById('manual-url').value.trim();
    if (url) runScan('image', url, { analysisSource: 'manual:url' });
};

document.getElementById('upload-trigger').onclick = () => {
    document.getElementById('file-in').click();
};

document.getElementById('file-in').onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const dataUrl = reader.result;
        const isVideo = file.type.startsWith('video/');
        runScan(isVideo ? 'video' : 'image', dataUrl, { analysisSource: 'manual:upload' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
};
