const output = document.getElementById('output');

/**
 * 1. TRIGGER SCAN
 * Communicates with the Node.js backend
 */
const triggerScan = (type, content) => {
  // Clear UI and previous results immediately
  chrome.storage.local.remove("result");
  output.innerHTML = `<div class="loader">🔍 INITIATING FORENSIC SCAN...</div>`;
  
  console.log("TrustLens PRO: Sending Request Type:", type);

  fetch("http://localhost:5000/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, content })
  })
  .then(res => res.json())
  .then(data => {
    console.log("TrustLens PRO: Data Received:", data);
    // Trigger the storage listener
    chrome.storage.local.set({ result: { ...data, loading: false } });
  })
  .catch(err => {
    console.error("FETCH ERROR:", err);
    output.innerHTML = `<div class="error">BACKEND OFFLINE: Ensure server.js is running</div>`;
  });
};

/**
 * 2. DOWNLOAD REPORT HELPER
 * Generates a technical .txt file for the user
 */
function downloadReport(d) {
  const reportText = `
TRUSTLENS PRO: FORENSIC AUDIT DATA SHEET
----------------------------------------
Generated: ${new Date().toLocaleString()}
Media Type: Audit Report

[1] CONTENT BRIEF
${d.content_summary}

[2] LENS OCR TRANSCRIPTION
"${d.transcribed_text || 'No text detected'}"

[3] FINAL VERDICT: ${d.verdict.toUpperCase()}
Confidence Score: ${d.trust_score}%

[4] TECHNICAL SUMMARY
${d.summary}

[5] DETECTION FLAGS
Red Flags: ${(d.red_flags || []).join(', ')}
Green Flags: ${(d.green_flags || []).join(', ')}

[6] ORIGIN TRACE
Source: ${d.origin_trace}

--- End of Forensic Report ---`;

  const blob = new Blob([reportText], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `TrustLens_Audit_${Date.now()}.txt`;
  a.click();
}

/**
 * 3. BUTTON LISTENERS
 * Handles URL pasting and File Uploading
 */

// URL Scan Button
document.getElementById('url-btn').onclick = () => {
  const val = document.getElementById('manual-url').value;
  if(val) triggerScan("image", val);
};

// File Upload Hidden Input
document.getElementById('file-in').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => triggerScan("image", ev.target.result);
  reader.readAsDataURL(file);
};

// Manual trigger for the "fake" upload button in HTML
const uploadBtn = document.getElementById('fake-upload-btn');
if(uploadBtn) {
    uploadBtn.onclick = () => document.getElementById('file-in').click();
}

/**
 * 4. UI RENDERER (Storage Listener)
 * Injects the forensic data into the sidepanel
 */
chrome.storage.onChanged.addListener((changes) => {
  if (!changes.result) return;
  const r = changes.result.newValue;
  
  if (!r || r.loading) return;

  // Handle errors from backend (like quota full or timeout)
  if (r.error && (!r.results || r.results.length === 0)) {
    output.innerHTML = `<div class="error">${r.error}</div>`;
    return;
  }

  const d = r.results[0];
  
  // Render using the Premium styles from style.css
  output.innerHTML = `
    <div class="card">
      <div class="lens-box">
        <small>GOOGLE LENS OCR</small>
        <p>"${d.transcribed_text || 'No text detected'}"</p>
      </div>
      
      <div class="brief"><b>BRIEF:</b> ${d.content_summary}</div>
      
      <div class="score-display">${d.trust_score}%</div>
      <h2 class="${d.verdict}">${d.verdict}</h2>
      
      <p class="summary-p">${d.summary}</p>
      
      <div class="origin-tag">🌐 ${d.origin_trace}</div>
      
      <div class="flags">
        <div class="f-box red"><b>RED FLAGS</b><br>${(d.red_flags || []).slice(0,2).join('<br>')}</div>
        <div class="f-box green"><b>GREEN FLAGS</b><br>${(d.green_flags || []).slice(0,2).join('<br>')}</div>
      </div>
      
      <button class="dl-btn" id="final-dl-btn">DOWNLOAD AUDIT REPORT</button>
    </div>`;

    // Re-attach the download listener to the new button
    document.getElementById('final-dl-btn').onclick = () => downloadReport(d);
});