import express from "express";
import { handleText } from "../services/textService.js";
import { handleImage } from "../services/imageService.js";
import { handleVideo } from "../services/videoService.js";

const router = express.Router();

/**
 * UNIVERSAL ROUTER: /analyze
 * Handles Text (Claims), Images (Forensics), and Video (Deepfakes).
 */
router.post("/", async (req, res) => {
  const { type, content } = req.body;
  
  // Terminal log for real-time monitoring during your demo
  console.log(`\n--- NEW AUDIT REQUEST ---`);
  console.log(`[TYPE]: ${type.toUpperCase()}`);

  if (!content) {
    console.error("[ERROR]: No content received in request body.");
    return res.status(400).json({ error: "No content provided for analysis." });
  }

  try {
    let result;

    // Directing traffic to the correct specialist service
    switch (type) {
      case "text":
        console.log("TrustLens PRO: Dispatching to Text Forensic Specialist...");
        result = await handleText(content);
        break;

      case "video":
        console.log("TrustLens PRO: Dispatching to Video/Deepfake Specialist...");
        result = await handleVideo(content);
        break;

      case "image":
      case "img":
        console.log("TrustLens PRO: Dispatching to Image/Lens Specialist...");
        result = await handleImage(content);
        break;

      default:
        // Smart Default: If type is unknown, try to treat it as text/claim
        console.log("TrustLens PRO: Unknown type. Defaulting to Text Analysis.");
        result = await handleText(content);
    }

    if (!result) {
      throw new Error("Service returned an empty or null result.");
    }

    console.log(`[SUCCESS]: ${type.toUpperCase()} Audit Completed. Sending to UI.`);
    res.json(result);

  } catch (error) {
    console.error("!!! BACKEND ERROR !!!", error.message);
    
    // Fallback JSON so your extension doesn't show a "Server Offline" or hang forever
    res.status(500).json({ 
      error: "The forensic engine encountered a timeout.",
      results: [{ 
        verdict: "Uncertain", 
        trust_score: 0, 
        summary: "Internal Server Processing Error. Please retry.",
        content_summary: "System busy or API limit reached.",
        transcribed_text: "N/A"
      }] 
    });
  }
});

export default router;