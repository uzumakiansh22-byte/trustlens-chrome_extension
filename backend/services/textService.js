import { callGemini, callGroq, safeParse } from "./aiService.js";

export async function handleText(text) {
  const prompt = `Perform a Truth-Audit on: "${text}"
  
  RESEARCH CRITERIA:
  - Cross-reference with major news outlets (AP, Reuters, BBC).
  - Check for logical fallacies or emotional baiting.
  - Verify if this is a known satirical or parody source.

  Respond ONLY JSON: {
    "content_summary": "Summary of claim.",
    "verdict": "True" | "False" | "Misleading",
    "trust_score": 0-100,
    "summary": "TRUTH REPORT: Explain the specific findings. If False, provide the correct facts. If True, list the confirming sources.",
    "red_flags": [], "green_flags": [], "origin_trace": "..."
  }`;

  const raw = await callGemini(prompt) || await callGroq(prompt);
  const res = safeParse(raw);
  return { type: "text", results: [res] };
}