// server.js - TrustLens PRO: Real-Time Investigative Agent
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';
import chatRoute from "./routes/chat.js"; // [cite: 1727]

const app = express();
// Large base64 / data URLs from the extension (especially video) exceed the default ~100kb limit.
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cors({
    origin: '*', // Allows all extensions to connect during development
    methods: ['GET', 'POST','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/analyze', analyzeRouter);
app.use("/chat", chatRoute);

app.listen(5000, () => console.log("🛡️ Real-Time Agent & Forensic Engine Active on 5000"));