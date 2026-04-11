import { callSmartTextAI, safeParse } from "./aiService.js";

const MIN_OCR_LEN = 10;

function meaningfulOcr(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.trim();
  if (t.length < MIN_OCR_LEN) return false;
  const lower = t.toLowerCase();
  if (/^(no text|n\/a|none|null|not applicable|\.\.\.)$/i.test(lower)) return false;
  return true;
}

/**
 * Fact-check text visible on an image using the search-enabled text model.
 * Returns structured verdict + URLs when the model can cite them.
 */
export async function factCheckOcrOnImage(ocrText, imageContext = "") {
  if (!meaningfulOcr(ocrText)) return null;

  const prompt = `You verify TEXT that was extracted by OCR from a single image (meme, screenshot, news graphic, ad, etc.).

IMAGE CONTEXT (from vision model, may help):
${imageContext || "Not provided."}

OCR TEXT FROM THE IMAGE (exactly as read):
"${ocrText.replace(/"/g, '\\"')}"

INSTRUCTIONS:
1. Decide what kind of text this is: factual claim, opinion, joke/meme, quote, ad, decorative text, nonsense, or unclear.
2. If there are factual claims, use web search. Return True / False / Misleading / Unverifiable (if you cannot verify with available evidence).
3. If there is NO factual claim (pure meme text, opinion-only, random), set claim_verdict to "Not applicable".
4. Always try to give 2-5 verification_sources with REAL https URLs you found (news, government, official docs, reputable fact-checkers). If you cannot find any, use an empty array — do not invent URLs.
5. For image provenance: if search suggests where this image or story appears elsewhere, add media_trace_urls (https only). If not traceable, use [].

STRICT JSON OUTPUT:
{
  "claim_type": "factual_claim" | "opinion" | "meme_or_humor" | "ad_or_promo" | "quote" | "decorative" | "nonsense_or_unclear" | "no_claim",
  "claim_verdict": "True" | "False" | "Misleading" | "Unverifiable" | "Not applicable",
  "trust_score": 0,
  "summary": "2-4 sentences for the user.",
  "verification_sources": [{"title": "", "url": "https://...", "supports": "confirms|debunks|context"}],
  "media_trace_urls": ["https://..."],
  "media_trace_note": "Short note on where this image/story may appear online, or empty string."
}`;

  console.log("TrustLens PRO: OCR claim check (web search)…");
  const raw = await callSmartTextAI(prompt);
  const parsed = safeParse(raw, "text");
  if (!parsed) return null;

  return {
    claim_type: parsed.claim_type || null,
    claim_verdict: parsed.claim_verdict || parsed.verdict || "Unverifiable",
    trust_score: typeof parsed.trust_score === "number" ? parsed.trust_score : null,
    summary: parsed.summary || "",
    verification_sources: Array.isArray(parsed.verification_sources)
      ? parsed.verification_sources
      : [],
    media_trace_urls: Array.isArray(parsed.media_trace_urls) ? parsed.media_trace_urls : [],
    media_trace_note: parsed.media_trace_note || ""
  };
}
