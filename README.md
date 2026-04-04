🛡️ TrustLens Pro: Forensic AI Investigator
TrustLens Pro is an advanced investigative Chrome Extension designed to combat digital misinformation, forged claims, and deepfakes. It provides a multi-layered forensic audit of images, videos, and text claims using a hybrid AI engine.

TRUSTLENS ai forensic || Project by ANSH TIWARI

🚀 The Dashboard
TrustLens Pro lives in your browser's SidePanel, offering a sleek and informative interface to manage your digital audits in real-time.



Key Features
5-Pillar Forensic Audit: Deep analysis on Gen-AI signatures, face shimmers, metadata editing, physical logic, and provenance.

Real-Time Fact-Checking: Powered by Gemini 2.0 Flash (Online) to verify breaking news claims via integrated web-search capabilities.

Weighted Scoring System: Combines hard pixel evidence (60%) with contextual AI logic (40%) to provide a reliable Trust Score.

Conversational Agent: A built-in "Forensic Investigator" chatbot to discuss scan results and answer complex investigative questions.

🛠️ Technical Stack
Frontend: Chrome Extension Manifest V3, SidePanel API, ESM JavaScript.

Backend: Node.js, Express.js.

AI Models:

Text/Search: Google Gemini 2.0 Flash (Online) via OpenRouter.

Vision: Meta Llama 4 Scout.

Pixel Forensics: Sightengine (Deepfake & Gen-AI detection).

🔍 The Investigation Process
TrustLens Pro integrates seamlessly into your browsing experience. With a single click, a comprehensive audit is launched.


How to Use
Context Menu Audit: Right-click any image, video, or selected text on a webpage and select "Analyse with TrustLens Pro".

Multimodal Scan: Use the dashboard to manually paste media URLs or text claims.

Video Transcription: Paste a video transcript to perform a simultaneous visual and speech truth-audit.

Investigate: Engage with the Forensic Investigator chatbot at the bottom of the panel to ask follow-up questions about specific scan results.

⚙️ Installation & Setup
1. Backend Configuration
Navigate to your backend directory and create a .env file:

Code snippet
PORT=5000
OPENROUTER_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
SIGHTENGINE_API_USER=your_user_id
SIGHTENGINE_API_SECRET=your_api_secret
Install dependencies and start the server:

Bash
npm install
node server.js
2. Extension Installation
Open Chrome and navigate to chrome://extensions/.

Enable Developer Mode (top right).

Click Load Unpacked.

Select the folder containing your extension files (including manifest.json).

👤 Author
Ansh tiwari
UCER | Student at AKTU University
