import { callGemini, callGroq, callSightengine, safeParse } from "./aiService.js";

export async function handleVideo(videoUrl) {
  const prompt = `Video Forensic Audit Request.
  Analyze the footage for:
  - Facial warping during rapid movement.
  - Sync errors between audio and lip movement.
  - Background 'shimmering' typical of deepfakes.

  Respond ONLY JSON: {
    "content_summary": "...",
    "transcribed_text": "...",
    "verdict": "Real" | "Manipulated",
    "trust_score": 0-100,
    "summary": "DETAILED AUDIT: Explain why the video movements look natural or synthetic. Mention specific timestamps if possible.",
    "red_flags": [], "green_flags": [], "origin_trace": "..."
  }`;

  const [gemRaw, groqRaw, sight] = await Promise.all([
    callGemini(prompt, videoUrl).catch(() => null),
    callGroq(prompt, videoUrl).catch(() => null),
    callSightengine(videoUrl, "video").catch(() => null)
  ]);

  const mainAi = safeParse(gemRaw) || safeParse(groqRaw) || {
    verdict: "Audit Pending",
    trust_score: sight ? sight.score : 50,
    summary: "VIDEO REPORT: Manual frame-by-frame context is unavailable. Pixel-based deepfake scanning is at " + (sight ? sight.score : 50) + "% confidence."
  };

  const finalScore = sight ? Math.round((sight.score * 0.7) + (mainAi.trust_score * 0.3)) : mainAi.trust_score;
  return { type: "video", results: [{ ...mainAi, trust_score: finalScore }] };
}