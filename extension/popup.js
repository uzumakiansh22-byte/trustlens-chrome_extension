const output = document.getElementById('output');

// 1. TRIGGER SCAN (With Loading Logic)
const triggerScan = (type, content, transcript = null) => {
  chrome.storage.local.remove("result");
  
  // NEW: Professional Loading Screen
  output.innerHTML = `
    <div class="loader">
      <div class="glow-dot" style="margin: 0 auto 15px auto;"></div>
      <div class="loading-text">COMMENCING FORENSIC AUDIT...</div>
      <div class="loading-subtext" id="status-update">Synchronizing with 5-Pillar Engine</div>
    </div>`;

  // Dynamic status updates for the user
  const statusEl = document.getElementById('status-update');
  const statuses = [
    "Analyzing Pixel Signatures...",
    "Cross-Referencing Web Provenance...",
    "Auditing Logical Consistencies...",
    "Verifying Source Authenticity..."
  ];
  let i = 0;
  const statusInterval = setInterval(() => {
    if(statusEl) statusEl.innerText = statuses[i % statuses.length];
    i++;
  }, 2000);

  fetch("http://localhost:5000/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, content, transcript })
  })
  .then(res => res.json())
  .then(data => {
    clearInterval(statusInterval);
    chrome.storage.local.set({ result: { ...data, loading: false } });
  })
  .catch(err => {
    clearInterval(statusInterval);
    console.error("FETCH ERROR:", err);
    output.innerHTML = `<div class="error">CONNECTION FAILED: Check if backend is running on Port 5000</div>`;
  });
};

// 2. UI RENDERER
chrome.storage.onChanged.addListener((changes) => {
  if (!changes.result) return;
  const r = changes.result.newValue;
  
  if (!r || r.loading) return;

  // Handle "Null" results from the backend crash
  if (!r.results || r.results.length === 0 || r.results[0] === null) {
    output.innerHTML = `
      <div class="error">
        <b>AUDIT INTERRUPTED</b><br>
        The AI models returned an empty response. This usually happens if the API key is invalid or quota is reached.
      </div>`;
    return;
  }

  const d = r.results[0];
  const report = d.detailed_report || {};
  const isText = r.type === "text";

  // RENDER THE FINAL CARD
  output.innerHTML = `
    <div class="card">
      ${!isText ? `<div class="lens-box"><small>FORENSIC OCR</small><p>"${d.transcribed_text || 'No text detected'}"</p></div>` : ''}
      <div class="brief"><b>${isText ? 'CLAIM' : 'BRIEF'}:</b> ${d.content_summary}</div>
      <div class="score-display">${d.trust_score}%</div>
      <h2 class="${d.verdict}">${d.verdict}</h2>
      <div class="forensic-grid">
         <div class="pillar"><b>🧬 ${isText ? 'Source' : 'Gen-AI'}:</b> ${report.gen_ai_analysis || 'Verified'}</div>
         <div class="pillar"><b>👤 ${isText ? 'Logic' : 'Face'}:</b> ${report.face_forensics || 'Verified'}</div>
         <div class="pillar"><b>📁 ${isText ? 'Bias' : 'Forensics'}:</b> ${report.metadata_editing || 'Verified'}</div>
         <div class="pillar"><b>🏗️ ${isText ? 'Facts' : 'Logic'}:</b> ${report.physical_logic || 'Verified'}</div>
         <div class="pillar"><b>🌍 ${isText ? 'Satire' : 'Provenance'}:</b> ${report.provenance_check || 'Verified'}</div>
      </div>
      <p class="summary-p"><b>AUDIT REPORT:</b> ${d.summary}</p>
      <div class="origin-tag">🌐 ${d.origin_trace || 'Manual Verification Advised'}</div>
      <div class="flags">
        <div class="f-box red"><b>RED FLAGS</b><br>${(d.red_flags || []).slice(0,2).join('<br>')}</div>
        <div class="f-box green"><b>GREEN FLAGS</b><br>${(d.green_flags || []).slice(0,2).join('<br>')}</div>
      </div>
      <button class="dl-btn" id="final-dl-btn">DOWNLOAD REPORT</button>
    </div>`;

    document.getElementById('final-dl-btn').onclick = () => downloadReport(d);
});
// 3. EVENT LISTENERS (Manual Inputs)
document.getElementById('url-btn').onclick = () => {
  const val = document.getElementById('manual-url').value;
  // If it's a video link, we might want to check the transcript input too
  const transcript = document.getElementById('video-transcript')?.value;
  if(val) triggerScan("image", val, transcript); 
};

// Logic for the 'fake' upload button
const fileIn = document.getElementById('file-in');
const fakeBtn = document.getElementById('fake-upload-btn');
if (fakeBtn && fileIn) {
  fakeBtn.onclick = () => fileIn.click();
  fileIn.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => triggerScan("image", ev.target.result);
    reader.readAsDataURL(file);
  };
}

// Simple text fact-check button
const textBtn = document.getElementById('text-btn');
if(textBtn) {
    textBtn.onclick = () => {
        const val = document.getElementById('manual-url').value;
        if(val) triggerScan("text", val);
    };
}
