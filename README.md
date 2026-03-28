# 🛡️ TrustLens PRO 2026
**The Advanced Forensic Suite for Real-Time Misinformation Audit**

TrustLens PRO is a high-performance Chrome Extension and Node.js ecosystem designed to dismantle digital deception. By leveraging **Triple-Model Orchestration**, it performs simultaneous forensic audits on Text, Images, and Videos to provide an evidence-based "Trust Score."

---

## 🚀 The Mission
In an era of generative AI and deepfakes, "seeing is no longer believing." TrustLens PRO empowers users to verify the digital world through:
1. **Visual Integrity:** Detecting AI-generated pixel patterns.
2. **Contextual Truth:** Fact-checking claims against global news databases.
3. **Google Lens OCR:** Transcribing hidden text within media for deeper analysis.

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Primary Vision AI:** Google Gemini 2.0 Flash (Multimodal)
- **Contextual Fallback:** Groq (Llama 3.2 Vision / Llama 3.3 70B)
- **Pixel Forensics:** Sightengine (GenAI & Deepfake Detection)
- **Frontend:** Chrome Extension Manifest V3 (Sidepanel API)

---

## 🌟 Key Features
- **🔍 Google Lens Integration:** Real-time OCR transcription of any text found within images or video frames.
- **🧠 Triple-Model Verification:** Cross-references results between Gemini, Groq, and Sightengine to eliminate AI hallucinations.
- **📹 Deepfake Detection:** Specialized forensic scanning for temporal inconsistencies and facial warping in video.
- **📋 Forensic Data Sheets:** Generates a downloadable technical report explaining the *why* behind every verdict.
- **🚨 Red/Green Flag System:** Instant visual breakdown of authentic vs. suspicious digital markers.

---

## 📦 Installation & Setup

1. Backend Configuration
a. Navigate to the `/backend` folder.
b. Run `npm install` to install dependencies.
c. Create a `.env` file and add your API keys:
   ```env
   GEMINI_API_KEY=your_key
   GROQ_API_KEY=your_key
   SIGHTENGINE_API_USER=your_user_id
   SIGHTENGINE_API_SECRET=your_secret
   PORT=5000


2. Extension Setup
a. Open Google Chrome and go to chrome://extensions/.
b. Enable Developer Mode (top right toggle).
c. Click Load Unpacked and select the /extension folder from this project.
d. Pin TrustLens PRO to your toolbar!

3 📖 How to Use
a. Right-Click Audit: Right-click any image, video, or highlighted text on the web and select "Analyse with TrustLens PRO."
b. Manual Upload: Open the sidepanel and upload a local screenshot for a full forensic breakdown.

c. URL Scan: Paste a direct link to any media file for a high-speed cloud audit.