import express from "express";
import { callChatAssistant, callSmartTextAI } from "../services/aiService.js";

const router = express.Router();

/** If JSON-mode text models return a stringified object, pull a human-readable field. */
function extractReplyText(raw) {
  if (raw == null) return null;
  if (typeof raw !== "string") return String(raw);
  const t = raw.trim();
  if (!t.startsWith("{")) return t;
  try {
    const o = JSON.parse(t);
    const pick =
      o.reply ??
      o.response ??
      o.answer ??
      o.message ??
      o.summary ??
      o.content;
    if (typeof pick === "string" && pick.length) return pick;
    const firstStr = Object.values(o).find(
      (v) => typeof v === "string" && v.length > 0
    );
    if (firstStr) return firstStr;
  } catch {
    return t;
  }
  return t;
}

router.post("/", async (req, res) => {
  const { question } = req.body;
  try {
    const prompt = `You are TrustLens Assistant, a standalone general AI chatbot.
Answer ANY user question, whether it is about the scan or not.
Keep answers concise, useful, and easy to understand.
Target 50-100 words. Do not exceed 100 words.
Do not mention missing scan context unless the user explicitly asks about scan details.

User question:
${question}`;

    let raw = await callChatAssistant(prompt);
    if (!raw) {
      raw = await callSmartTextAI(prompt);
    }
    const reply =
      extractReplyText(raw) ||
      "Could not reach the AI. Check OPENROUTER_API_KEY / GROQ_API_KEY in .env and try again.";

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json({ reply });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;
