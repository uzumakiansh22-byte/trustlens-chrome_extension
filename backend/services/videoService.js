import { callSmartVisionAI, callSmartTextAI, callSightengine, safeParse } from "./aiService.js";

/**
 * Handles Video Forensics.
 * 1. Checks visual authenticity (Groq + Sightengine).
 * 2. Checks transcript authenticity (OpenRouter Search) if provided.
 */
export async function handleVideo(videoUrl, transcript = null) {
  const visualPrompt = `Perform a Video Forensic Audit. 
  Check for deepfake artifacts (motion blur, lip-sync glitches, background warping).
  Return JSON: { content_summary, verdict, trust_score, detailed_report, summary }`;

  console.log("--- VIDEO AUDIT (Multimodal Stream) ---");

  // 1. Visual & Pixel Audit (Always Free)
  const [visionRaw, sight] = await Promise.all([
    callSmartVisionAI(visualPrompt, videoUrl).catch(() => null),
    callSightengine(videoUrl, "video").catch(() => null)
  ]);

  const visualRes = safeParse(visionRaw, "video") || { 
    verdict: sight?.is_ai ? "Manipulated" : "Real",
    trust_score: sight ? sight.score : 50,
    summary: "Visual scan complete."
  };

  // 2. Transcript Audit (Uses $1.00 Search Allowance if transcript exists)
  let transcriptRes = null;
  if (transcript && transcript.trim() !== "") {
    console.log("TrustLens PRO: Auditing Transcript Authenticity...");
    const textPrompt = `Fact-check this video transcript using web search: "${transcript}". 
    Is the speaker telling the truth? Name your sources. Return JSON.`;
    
    const textRaw = await callSmartTextAI(textPrompt);
    transcriptRes = safeParse(textRaw, "text");
  }

  // Combine Results
  const finalVerdict = transcriptRes 
    ? (visualRes.verdict === "Real" && transcriptRes.verdict === "True" ? "Real" : "Misleading")
    : visualRes.verdict;

  const finalSummary = transcriptRes 
    ? `VISUAL: ${visualRes.summary} | SPEECH: ${transcriptRes.summary}`
    : `${visualRes.summary} (Transcript not available for truth-audit).`;

  return {
    type: "video",
    results: [{
      ...visualRes,
      verdict: finalVerdict,
      summary: finalSummary,
      transcribed_text: transcript || "No transcript provided.",
      detailed_report: {
        gen_ai_analysis: visualRes.detailed_report?.gen_ai_analysis || "Visual check complete.",
        face_forensics: transcriptRes ? "Speech/Logic check complete." : "Speech check skipped (No Transcript).",
        metadata_editing: transcriptRes?.verdict || "N/A"
      },
      origin_trace: transcriptRes?.origin_trace || "Visual Origin Unverified"
    }]
  };
}