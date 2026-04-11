import { callSmartTextAI, safeParse } from "./aiService.js";

/**
 * Handles Fact-Checking using OpenRouter (Web-Search Enabled).
 * Identifies logical fallacies and cites real-world sources.
 */
export async function handleText(text) {
  const prompt = `Act as an Elite Fact-Checker. Audit this claim using your Web-Search tool: "${text}"
  
  TASKS:
  1. TRUTH VERDICT: Is this claim True, False, or Misleading?
  2. REASONING: Explain exactly WHY using current news and data.
  3. SOURCES: Cite the specific news outlets or official records that confirm or debunk this.
  4. BIAS CHECK: Identify emotional manipulation or logical fallacies.

  STRICT JSON OUTPUT:
  {
    "content_summary": "Summary of the claim.",
    "verdict": "True" | "False" | "Misleading",
    "trust_score": 0-100,
    "detailed_report": {
       "gen_ai_analysis": "Source integrity check.",
       "face_forensics": "Logical flow analysis.",
       "metadata_editing": "Sentiment and bias report.",
       "physical_logic": "Fact-check details.",
       "provenance_check": "Detailed source citation and URL."
    },
    "summary": "Full truth report. Name your sources clearly.",
    "red_flags": [],
    "green_flags": [],
    "origin_trace": "Name of the Source or the direct URL link."
  }`;

  console.log("TrustLens PRO: Dispatching Text Audit (OpenRouter Search Chain)...");

  const raw = await callSmartTextAI(prompt);
  
  // Use the universal parser with 'text' type context
  const res = safeParse(raw, "text") || {
    verdict: "Manual Check Required",
    trust_score: 50,
    summary: "Fact-check engines are at capacity. Please verify with primary news outlets."
  };

  return { 
    type: "text", 
    results: [res] 
  };
}