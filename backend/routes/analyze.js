import express from 'express';
import { handleImage } from '../services/imageService.js';
import { handleText } from '../services/textService.js';
import { handleVideo } from '../services/videoService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { type, content, transcript } = req.body; // Added transcript here

  console.log(`\n[${new Date().toLocaleTimeString()}] POST request to /analyze`);
  console.log(`--- NEW AUDIT REQUEST ---`);
  console.log(`[TYPE]: ${type.toUpperCase()}`);

  try {
    let result;

    switch (type) {
      case 'image':
        console.log("TrustLens PRO: Dispatching to Image/Lens Specialist...");
        result = await handleImage(content);
        break;

      case 'text':
        console.log("TrustLens PRO: Dispatching to Fact-Check Specialist...");
        result = await handleText(content);
        break;

      case 'video':
        console.log("TrustLens PRO: Dispatching to Deepfake Specialist...");
        // Passes the transcript to the video service as you requested
        result = await handleVideo(content, transcript || null); 
        break;

      default:
        return res.status(400).json({ error: "Unsupported media type for audit." });
    }

    console.log(`[SUCCESS]: ${type.toUpperCase()} Audit Completed. Sending to UI.`);
    res.json(result);

  } catch (error) {
    console.error(`[CRITICAL ERROR]:`, error.message);
    res.status(500).json({ 
      error: "Forensic Engine Timeout", 
      message: "The audit failed due to an upstream API error. Please re-scan." 
    });
  }
});

export default router;
