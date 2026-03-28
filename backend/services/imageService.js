import { callGemini, callGroq, callSightengine, safeParse } from "./aiService.js";

export async function handleImage(imageUrl) {
  const prompt = `You are a Lead Forensic Investigator. Generate a Technical Audit Report.
  
  REQUIRED SECTIONS IN YOUR 'summary':
  1. VISUAL EVIDENCE: Analyze lighting, shadows, and edge consistency.
  2. CONTEXTUAL EVIDENCE: Is this event verified by credible news? Is the source reliable?
  3. PIXEL INTEGRITY: Mention any AI-signature patterns or compression artifacts.

  STRICT JSON OUTPUT:
  {
    "content_summary": "Short description of the media.",
    "transcribed_text": "Text found via OCR.",
    "verdict": "Real" | "Manipulated" | "AI-Generated",
    "trust_score": 0-100,
    "summary": "EXPLAIN THE 'WHY': Start with 'Forensic Analysis:' and break down the specific reasons for this score based on the 3 sections above.",
    "red_flags": ["Specific technical reason 1", "Specific factual error 2"],
    "green_flags": ["Authentic marker 1"],
    "origin_trace": "Detailed source investigation"
  }`;

  console.log("TrustLens PRO: Commencing Full Forensic Audit...");

  const [gemRaw, groqRaw, sight] = await Promise.all([
    callGemini(prompt, imageUrl).catch(() => null),
    callGroq(prompt, imageUrl).catch(() => null),
    callSightengine(imageUrl, "image").catch(() => null)
  ]);

  const gemRes = safeParse(gemRaw);
  const groqRes = safeParse(groqRaw);

  // FAIL-SAFE: If LLMs fail, the report explains it's a "Pixel-Only" audit
  const mainAi = gemRes || groqRes || { 
    verdict: sight ? (sight.score > 50 ? "Real" : "Manipulated") : "Uncertain", 
    trust_score: sight ? sight.score : 50, 
    content_summary: "LLM Offline: Pixel Audit Only.",
    transcribed_text: "N/A",
    summary: `TECHNICAL REPORT: Primary AI reasoning is offline. Analysis is based strictly on Sightengine Pixel-Scanning. ${sight?.is_ai ? "Pixels show high probability of synthetic generation (GenAI)." : "Pixel distribution matches standard camera sensors."}`,
    red_flags: sight?.is_ai ? ["Synthetic Noise Pattern"] : ["Contextual AI Offline"],
    green_flags: !sight?.is_ai ? ["Natural Metadata Distribution"] : [],
    origin_trace: "Sightengine Forensic Node"
  };

  let finalScore = mainAi.trust_score;
  if (sight) {
    // If AI works, we blend. If not, we trust Sightengine's pixel score 100%.
    finalScore = (gemRes || groqRes) ? Math.round((sight.score * 0.5) + (mainAi.trust_score * 0.5)) : sight.score;
  }

  return { type: "image", results: [{ ...mainAi, trust_score: finalScore }] };
}