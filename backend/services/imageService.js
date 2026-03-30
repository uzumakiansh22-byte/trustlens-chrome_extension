import { callSmartVisionAI, callSightengine, safeParse } from "./aiService.js";

/**
 * Handles Image Forensics using a 60/40 Weighted Scoring System.
 * Uses Groq (Vision) + Sightengine (Pixel Analysis).
 */
export async function handleImage(imageUrl) {
  const prompt = `Perform a MASTER 5-PILLAR FORENSIC AUDIT on this image.
  
  CORE MISSION:
  1. DESCRIPTION: Describe every detail in the image.
  2. OCR AUDIT: Read ALL text on the image. Check if the claims in that text are FACTUAL or a HOAX.
  3. THE 5 PILLARS: 
     - Pillar 1 (Gen-AI): Identify pixel noise and synthetic textures.
     - Pillar 2 (Faces): Check for deepfake 'shimmer' around eyes/mouth.
     - Pillar 3 (Forensics): Identify localized compression or editing traces.
     - Pillar 4 (Logic): Audit anatomical accuracy and shadow physics.
     - Pillar 5 (Provenance): Identify the likely ORIGIN or source outlet.

  STRICT JSON OUTPUT:
  {
    "content_summary": "Detailed scene description.",
    "transcribed_text": "Exact text found on image.",
    "verdict": "Real" | "Manipulated" | "AI-Generated",
    "trust_score": 0-100,
    "detailed_report": {
       "gen_ai_analysis": "Pillar 1 analysis.",
       "face_forensics": "Pillar 2 analysis.",
       "metadata_editing": "Pillar 3 & OCR truth-check.",
       "physical_logic": "Pillar 4 analysis.",
       "provenance_check": "Pillar 5 findings."
    },
    "summary": "Final forensic conclusion. Explain why it is real or fake.",
    "red_flags": [],
    "green_flags": [],
    "origin_trace": "Cite specific source URLs or outlets if verified."
  }`;

  console.log("TrustLens PRO: Initiating Visual Audit (Groq Vision + Sightengine)...");

  // Parallel execution for maximum performance during the demo
  const [visionRaw, sight] = await Promise.all([
    callSmartVisionAI(prompt, imageUrl).catch(() => null),
    callSightengine(imageUrl).catch(() => null)
  ]);

  // Use the universal parser with 'image' type context
  const mainAi = safeParse(visionRaw, "image") || { 
    verdict: sight ? (sight.score > 50 ? "Real" : "Manipulated") : "Uncertain",
    trust_score: sight ? sight.score : 50,
    summary: "Visual engines offline. Audit based on pixel-scan forensics." 
  };

  // Logic: Pixels (Hard Evidence) 60% + AI (Contextual Logic) 40%
  const finalScore = sight ? Math.round((sight.score * 0.6) + (mainAi.trust_score * 0.4)) : mainAi.trust_score;

  return { 
    type: "image", 
    results: [{ ...mainAi, trust_score: finalScore }] 
  };
}
