import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/analyze', analyzeRouter);

let latestScanContext = null;
let chatHistory = []; 

app.post('/chat', async (req, res) => {
    const { question } = req.body;

    if (chatHistory.length > 40) chatHistory.shift();

    const systemPrompt = `You are the TrustLens Forensic AI. 
    Current Scan Context: ${JSON.stringify(latestScanContext || "No scan yet")}.
    
    MISSION: 
    - Provide DIRECT, FACTUAL answers. Do not say "I don't have real-time info." 
    - Use your integrated web-search capabilities to verify breaking news.
    - If asked about attacks (like the AWS strikes in Bahrain/UAE), give specific details: dates, locations, and impact.
    - Be witty and expert-level. Use emojis.`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({

                model: "google/gemini-2.0-flash-001:online", 
                messages: [
                    { role: "system", content: systemPrompt },
                    ...chatHistory, 
                    { role: "user", content: question }
                ]
            })
        });

        const data = await response.json();
        const aiAnswer = data.choices[0].message.content;

        chatHistory.push({ role: "user", content: question }, { role: "assistant", content: aiAnswer });
        res.json({ answer: aiAnswer });
    } catch (err) {
        res.json({ answer: "⚠️ System connection to the live news-grid is lagging. Try again." });
    }
});

app.listen(5000, () => console.log("🛡️ Real-Time Agent & Forensic Engine Active on 5000"));
