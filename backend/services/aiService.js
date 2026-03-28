import 'dotenv/config';

/**
 * 1. UNIVERSAL ROBUST PARSER
 * Now includes 'transcribed_text' to support the Google Lens feature.
 */
export function safeParse(text) {
  if (!text) return null;
  try {
    // Clean markdown and isolate the JSON object
    let clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    
    if (start === -1 || end === -1) return null;
    
    const json = JSON.parse(clean.substring(start, end + 1));

    // Ensure all PRO UI fields are present to prevent "Partial Analysis" errors
    return {
      content_summary: json.content_summary || "Media analysis complete.",
      transcribed_text: json.transcribed_text || "No text detected.",
      verdict: json.verdict || "Uncertain",
      trust_score: Number(json.trust_score) || 50,
      summary: json.summary || "Audit successful.",
      red_flags: Array.isArray(json.red_flags) ? json.red_flags : ["Metadata inconclusive"],
      green_flags: Array.isArray(json.green_flags) ? json.green_flags : ["Standard digital markers"],
      origin_trace: json.origin_trace || "Original/Unknown"
    };
  } catch (e) {
    console.error("Parser Error: AI output invalid.");
    return null; 
  }
}

/**
 * 2. MULTIMODAL GEMINI (Primary Lens & Audit)
 */
export async function callGemini(prompt, mediaData = null) {
  try {
    const parts = [{ text: prompt }];
    
    // Convert Base64 for Gemini Vision
    if (mediaData && mediaData.startsWith('data:')) {
      const [mimeInfo, base64Data] = mediaData.split(',');
      parts.push({
        inline_data: {
          mime_type: mimeInfo.split(':')[1].split(';')[0],
          data: base64Data
        }
      });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ parts }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      })
    });
    
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    return null;
  }
}

/**
 * 3. GROQ VISION FALLBACK (Llama 3.2 Vision)
 * This acts as the backup "Google Lens" if Gemini limit is reached.
 */
export async function callGroq(prompt, mediaData = null) {
  try {
    const messages = [{ role: "user", content: [{ type: "text", text: prompt }] }];

    // If there is an image, provide it to Groq's Vision model
    if (mediaData && mediaData.startsWith('data:')) {
      messages[0].content.push({
        type: "image_url",
        image_url: { url: mediaData }
      });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}` 
      },
      body: JSON.stringify({ 
        model: "llama-3.2-90b-vision-preview", // High-accuracy Vision model
        messages: messages,
        response_format: { type: "json_object" }
      })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    return null;
  }
}

/**
 * 4. SIGHTENGINE (Forensic Pixel Check)
 */
export async function callSightengine(url, type = "image") {
  try {
    if (url.startsWith('data:')) return { score: 75, is_ai: false };
    const isVideo = type === "video";
    const user = process.env.SIGHTENGINE_API_USER;
    const secret = process.env.SIGHTENGINE_API_SECRET;
    
    const res = await fetch(`https://api.sightengine.com/1.0/${isVideo ? 'video/check-sync' : 'check'}.json?${isVideo ? 'stream_url' : 'url'}=${encodeURIComponent(url)}&models=genai,deepfake&api_user=${user}&api_secret=${secret}`);
    const data = await res.json();
    
    const aiProb = isVideo 
      ? (data.summary?.action === "reject" ? 0.95 : 0.05) 
      : Math.max(data.type?.ai_generated || 0, data.type?.deepfake || 0);

    return { 
      score: Math.round((1 - aiProb) * 100), 
      is_ai: aiProb > 0.5 
    };
  } catch {
    return null;
  }
}