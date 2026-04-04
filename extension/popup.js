// popup.js - TrustLens PRO: Universal Forensic Controller & AI Agent
console.log("🛡️ TrustLens PRO: Forensic Systems Online.");

// --- 1. SELECTORS ---
const outputArea = document.getElementById('output');
const chatBox = document.getElementById('chat-box');
const queryInput = document.getElementById('user-query');
const urlBtn = document.getElementById('url-btn');
const textBtn = document.getElementById('text-btn');
const askBtn = document.getElementById('ask-btn');

// --- 2. CORE FORENSIC ENGINE ---
async function runAnalysis(content = "", type = "image", transcript = null) {
    outputArea.innerHTML = `<div style="color:#00ffcc; text-align:center; padding:20px;">💠 INITIATING ${type.toUpperCase()} FORENSIC AUDIT...</div>`;
    
    const targetContent = content || document.getElementById('manual-url').value;
    const targetTranscript = transcript || document.getElementById('video-transcript')?.value || null;

    try {
        const response = await fetch('http://127.0.0.1:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: type, 
                content: targetContent,
                transcript: targetTranscript 
            })
        });

        if (!response.ok) throw new Error('Server returned an error');
        
        const data = await response.json();
        const res = data.results ? data.results[0] : data;

        outputArea.innerHTML = `
            <div style="text-align:center; border-bottom:1px solid #333; padding-bottom:10px;">
                <h1 style="font-size:3.5rem; color:#00ffcc; margin:0;">${res.trust_score}%</h1>
                <h2 style="color:#ffcc00; margin:0; letter-spacing:2px; font-size:1.2rem;">${res.verdict.toUpperCase()}</h2>
            </div>
            
            <div class="pillar-box" style="font-size:0.85rem; margin-top:15px; color:#e0e0e0; line-height:1.4;">
                <p style="margin:8px 0; border-bottom:1px solid #222; padding-bottom:4px;">
                    <strong>🛡️ GEN-AI:</strong> ${res.detailed_report.gen_ai_analysis}
                </p>
                <p style="margin:8px 0; border-bottom:1px solid #222; padding-bottom:4px;">
                    <strong>👤 FACE:</strong> ${res.detailed_report.face_forensics}
                </p>
                <p style="margin:8px 0; border-bottom:1px solid #222; padding-bottom:4px;">
                    <strong>🔍 FORENSICS:</strong> ${res.detailed_report.metadata_editing}
                </p>
                <p style="margin:8px 0; border-bottom:1px solid #222; padding-bottom:4px;">
                    <strong>⚖️ LOGIC:</strong> ${res.detailed_report.physical_logic}
                </p>
                <p style="margin:8px 0; border-bottom:1px solid #222; padding-bottom:4px;">
                    <strong>🌐 PROVENANCE:</strong> ${res.origin_trace || "Verified Source"}
                </p>
            </div>

            <div style="display:flex; gap:8px; margin-top:15px;">
                <div style="flex:1; background:rgba(255,0,0,0.1); padding:8px; border-left:3px solid #ff4444; font-size:0.75rem;">
                    <strong style="color:#ff4444;">🚩 RED FLAGS:</strong><br>${res.red_flags?.join(", ") || "None Detected"}
                </div>
                <div style="flex:1; background:rgba(0,255,0,0.1); padding:8px; border-left:3px solid #00ffcc; font-size:0.75rem;">
                    <strong style="color:#00ffcc;">✅ GREEN FLAGS:</strong><br>${res.green_flags?.join(", ") || "Standard Authenticity"}
                </div>
            </div>
            
            <div style="margin-top:15px; padding:10px; background:#1e293b; border-radius:8px; font-size:0.8rem; border:1px solid #334155;">
                <strong style="color:#00ffcc;">AUDIT SUMMARY:</strong> ${res.summary}
            </div>
        `;

        chatBox.innerHTML = `<div class="agent-msg" style="color:#00ffcc; border-left:2px solid #00ffcc; padding-left:8px;">
            <b>Agent:</b> Audit logged. I have analyzed the <b>${res.verdict}</b> status. 
            I am ready to investigate these findings or answer general questions. 🛡️
        </div>`;

    } catch (err) {
        console.error("Connection Error:", err);
        outputArea.innerHTML = `<div style="color:#ff4444; padding:20px;">❌ Connection Error. Is 'node server.js' running?</div>`;
    }
}

// --- 3. HYBRID AI AGENT CHAT LOGIC ---
async function handleChat() {
    const q = queryInput.value;
    if (!q) return;

    chatBox.innerHTML += `<div class="user-msg" style="text-align:right; margin:10px 0; color:#888; font-size:0.85rem;"><b>You:</b> ${q}</div>`;
    queryInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q })
        });
        const data = await response.json();
        
        chatBox.innerHTML += `<div class="agent-msg" style="margin:10px 0; line-height:1.5; color:#fff; font-size:0.85rem;">
            <b style="color:#00ffcc;">Agent:</b> ${data.answer}
        </div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) { 
        chatBox.innerHTML += `<div style="color:#ff4444; font-size:0.75rem;">⚠️ Agent Connection Lost.</div>`; 
    }
}

// --- 4. UI HANDLERS & LISTENERS ---
if (urlBtn) urlBtn.onclick = () => runAnalysis("", "image");
if (textBtn) textBtn.onclick = () => runAnalysis("", "text");

if (askBtn) askBtn.onclick = handleChat;
if (queryInput) {
    queryInput.onkeypress = (e) => { 
        if (e.key === "Enter") handleChat(); 
    };
}

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "CONTEXT_MENU_AUDIT") {
        runAnalysis(msg.data, msg.contentType);
    }
});

chrome.runtime.sendMessage({ type: "SIDEPANEL_READY" });
