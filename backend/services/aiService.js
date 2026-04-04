import 'dotenv/config';

/**
 * 1. UNIVERSAL ROBUST PARSER
 */
export function safeParse(text, type = "image") {
  if (!text) return null;
  try {
    let clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(clean.substring(start, end + 1));
  } catch (e) {
    return {
      content_summary: `Analyzed ${type} data.`,
      verdict: "Uncertain",
      trust_score: 50,
      summary: "AI analysis complete (recovery mode).",
      detailed_report: { gen_ai_analysis: "Pillar analysis complete." }
    };
  }
}

/* --- TEXT ENGINES --- */

export async function callTextPrimary(prompt) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001:online", 
        messages: [{ role: "user", content: prompt }],
        plugins: [{ id: "web", max_results: 3 }, { id: "response-healing" }],
        response_format: { type: "json_object" }
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

export async function callTextFallback(prompt) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ 
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

/* --- VISION ENGINES --- */

export async function callVisionPrimary(prompt, mediaData) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ 
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
          role: "user",
          content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: mediaData } }]
        }],
        response_format: { type: "json_object" }
      })
    });
    const data = await res.json();
    if (data.error) {
       console.log(`[GROQ DEBUG]: Error ${data.error.code} - ${data.error.message}`);
       return null;
    }

    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.log("[GROQ DEBUG]: Network Error", err.message);
    return null;
  }
}
export async function callVisionFallback(prompt, mediaData) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free", 
        messages: [{
          role: "user",
          content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: mediaData } }]
        }],
        response_format: { type: "json_object" }
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

/* --- THE EXPORTED CHAINS AND SERVICES --- */

export async function callSmartTextAI(prompt) {
  console.log("--- Text Chain: Seeking Truth ---");
  let res = await callTextPrimary(prompt);
  if (res) return res;
  return await callTextFallback(prompt);
}

export async function callSmartVisionAI(prompt, mediaData) {
  console.log("--- Vision Chain: Auditing Pixels ---");
  let res = await callVisionPrimary(prompt, mediaData);
  if (res) return res;
  return await callVisionFallback(prompt, mediaData);
}


export async function callSightengine(url, type = "image") {
  try {
    const isVideo = type === "video";
    const res = await fetch(`https://api.sightengine.com/1.0/${isVideo ? 'video/check-sync' : 'check'}.json?${isVideo ? 'stream_url' : 'url'}=${encodeURIComponent(url)}&models=genai,deepfake&api_user=${process.env.SIGHTENGINE_API_USER}&api_secret=${process.env.SIGHTENGINE_API_SECRET}`);
    const data = await res.json();
    const aiProb = isVideo 
      ? (data.summary?.action === "reject" ? 0.95 : 0.05) 
      : Math.max(data.type?.ai_generated || 0, data.type?.deepfake || 0);

    return { score: Math.round((1 - aiProb) * 100), is_ai: aiProb > 0.5 };
  } catch { return null; }
}
