Here is the complete, ready-to-paste markdown content for your **TrustLens Pro** repository. Copy the block below exactly as it is into your `README.md` file.

```markdown
🛡️ TrustLens Pro: Forensic AI Investigator

An investigative shield against digital misinformation and deepfake threats that brings AI-powered forensic analysis to your browser for instant credibility verification.**

---

🎯 Overview

TrustLens Pro is a Chrome Extension designed to combat digital misinformation by providing:
- One-click forensic analysis of images, videos, and text claims
- Multi-modal AI verification using 5 forensic pillars
- Real-time fact-checking with search-enabled AI
- Intuitive dashboard accessible without leaving your current tab

This project was built to democratize forensic tools, making advanced deepfake detection accessible to everyday users rather than just security experts.

---

## 📺 Project Demo
> **[INSERT DEMO VIDEO HERE]**
> *Tip: Drag and drop your .mp4 file directly into the GitHub editor to embed it here.*

---

## 🚀 Live Deployment

The project is currently live and operational. You can interact with the backend and install the extension using the links below:

* **Backend API (Hosted on Render):** `https://your-app-name.onrender.com`
* **Latest Extension Build:** [Download TrustLens-Pro-v1.0.0.zip](https://github.com/uzumakiansh22-byte/trustlens-chrome_extension/releases/latest)
---

✨ Features

 🔍 One-Click Audit
- Seamless Chrome context menu integration
- Instant forensic analysis without leaving current tab
- High-performance SidePanel dashboard

 📊 Unified Forensic Dashboard
- Visual "Trust Score" with color-coded results
- Break down audits into digestible Red/Green flags
- Real-time progress tracking

 🧠 Multi-Modal Analysis
- **Image Forensics** – Detects synthetic textures and pixel inconsistencies
- **Video/Transcript Audit** – Cross-references speech with visuals
- **Text Fact-Checking** – Identifies logical fallacies and emotional manipulation

 💬 Forensic Investigator Chat
- Integrated AI agent for deep-dive questions
- Personal consultant for specific scan results
- Context-aware follow-up queries

---

🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Chrome Extension Manifest V3, SidePanel API, JavaScript (ESM) |
| **Backend** | Node.js, Express.js |
| **AI/LLM** | Gemini 2.0 Flash (Online), Meta Llama 4, Groq |
| **Forensics API** | Sightengine |

---

📁 Project Structure

TrustLens-Pro/
├── backend/
│   ├── server.js            # Express server
│   ├── routes/             # API route definitions
│   └── .env                # Environment configuration
├── extension/
│   ├── manifest.json       # Chrome extension manifest
│   ├── sidepanel/          # Dashboard HTML/CSS/JS
│   ├── background.js       # Background service worker
│   └── content.js          # Content script for context menu
├── utils/
│   ├── forensicEngine.js   # 5-pillar analysis logic
│   ├── geminiService.js    # Gemini API integration
│   └── sightengineClient.js # Forensics API client
└── README.md               # This file
---

🚀 Getting Started

 Prerequisites
- Node.js (v18 or higher)
- Chrome Browser
- API keys:
  - OpenRouter API
  - Groq API
  - Sightengine API

---
## Installation (option 1)

To test the live version of TrustLens Pro, follow these steps:

### 1. Install the Extension
1. Download the **TrustLens-Pro-v1.0.0.zip** from the [Releases](https://github.com/uzumakiansh22-byte/trustlens-chrome_extension/releases) section.
2. Extract the ZIP file on your computer.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer Mode** (toggle in the top right corner).
5. Click **Load Unpacked** and select the extracted `extension` folder.

### 2. Perform an Audit
1. Right-click on any image, video, or highlighted text on any website.
2. Select **"Audit with TrustLens Pro"**.
3. The SidePanel will open automatically, displaying the live forensic analysis from our Render-hosted server.

---

##Installation (option 2)

1. Clone the repository
   ```bash
   git clone [https://github.com/anshtiwari-ucer/TrustLens-Pro.git](https://github.com/anshtiwari-ucer/TrustLens-Pro.git)
   cd TrustLens-Pro/backend
   ```
---
```
# 2. Install dependencies
   ```bash
   npm install
   ```
```
# 3. Set up environment variables
   
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   OPENROUTER_API_KEY=your_key_here
   GROQ_API_KEY=your_key_here
   SIGHTENGINE_API_USER=your_user_id
   SIGHTENGINE_API_SECRET=your_api_secret
   ```
```
# 4. Start the backend server
   ```bash
   node server.js
   ```
```
# 5. Load the Chrome extension
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer Mode**
   - Click **Load Unpacked** and select the `extension` folder

# 6. Access the extension
   - Right-click on any image, video, or selected text
   - Choose **"Audit with TrustLens Pro"**
   - View results in the SidePanel

---

# 📖 Usage Guide

## Image Forensics
1. Right-click on any suspicious image
2. Select **Audit with TrustLens Pro**
3. View pixel-level analysis and synthetic pattern detection
4. Check the Trust Score and individual pillar results

## Video Analysis
1. Right-click on a video element
2. Choose forensic audit option
3. Review lip-sync accuracy and frame-by-frame analysis
4. Get deepfake probability assessment

## Text Fact-Checking
1. Highlight suspicious text on any webpage
2. Right-click and select **Verify Claim**
3. See cross-referenced results from news databases
4. Review logical fallacy detection

## Investigator Chat
1. After any audit, click **Ask Forensic AI**
2. Type follow-up questions (e.g., "Why was this flagged as suspicious?")
3. Get detailed explanations from the AI consultant
4. Request deeper analysis on specific pillars

---

🧠 The 5-Pillar Logic

| Pillar | Detection Method |
|--------|------------------|
| **Gen-AI** | Detects pixel noise and synthetic patterns |
| **Face** | Audits deepfake 'shimmers' and lip-sync accuracy |
| **Forensics** | Identifies localized compression or metadata editing |
| **Logic** | Checks for anatomical errors and shadow physics |
| **Provenance** | Traces content back to likely original source |

---

🐛 Troubleshooting

  Extension Not Showing in Context Menu
Problem: Right-click menu doesn't show TrustLens Pro option

Solutions:
- Reload extension at `chrome://extensions/`
- Check console for errors (right-click → Inspect → Console)
- Ensure manifest.json has correct permissions
- Restart Chrome browser

  Backend Connection Failed
**Problem:** "Unable to reach TrustLens server"

**Solutions:**
- Verify backend is running on port 5000
- Check `.env` file for correct PORT value
- Ensure firewall allows localhost connections
- Review server logs for startup errors

### API Key Errors
**Problem:** 401 or 403 responses from APIs

**Solutions:**
- Verify all API keys are correctly set in `.env`
- Check API quotas haven't been exceeded
- Ensure keys have necessary permissions
- Regenerate keys if expired

### Slow Analysis Times
**Problem:** Audits taking longer than expected

**Solutions:**
- Check internet connection speed
- Reduce image/video file size
- Verify API response times in logs
- Consider upgrading API tier for faster processing

---

## 🔮 Future Roadmap

- [ ] **Social Media Integration** – Real-time "Trust Labels" on X (Twitter) and YouTube feeds
- [ ] **ClearSight Integration** – Forensic audio-verification for visually impaired wearable devices
- [ ] **Decentralized Truth-Grid** – Community-driven database for reporting deepfake campaigns
- [ ] **Batch Processing** – Analyze multiple files simultaneously
- [ ] **Export Reports** – PDF/CSV download of forensic findings
- [ ] **Browser Extension Stores** – Publish to Chrome Web Store
- [ ] **Mobile Companion App** – Scan content from phone camera
- [ ] **Historical Tracking** – Monitor misinformation trends over time

---

## 👤 About the Author

**Ansh Tiwari** Computer Science Student at **United College of Engineering and Research (UCER)**, affiliated with **AKTU**

Passionate about solving societal problems through AI and IoT, with a focus on digital security and misinformation prevention.

- **LinkedIn:** [in/ansh-tiwari-b64ab1385](https://www.linkedin.com/in/ansh-tiwari-b64ab1385/)
- **Portfolio:** [Your Portfolio Link Here]
- **GitHub:** [anshtiwari-ucer](https://github.com/uzumakiansh22-byte)

---

## 🙏 Acknowledgments

- Built with ❤️ for digital truth and credibility
- Powered by Google Gemini 2.0 Flash, Meta Llama 4, and Groq
- Forensics engine enhanced by Sightengine
- Inspired by the need for accessible deepfake detection

---

**Last Updated:** April 5, 2026  
**Version:** 1.0.0
```
