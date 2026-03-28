import 'dotenv/config';
import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";

const app = express();

// 1. ROBUST CORS: Specifically allowing the Chrome Extension 
// (Sometimes 'cors()' is too broad for Chrome's security)
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. PAYLOAD LIMITS: Increased for high-res screenshots/base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. REQUEST LOGGER: Shows activity in your terminal for the judges
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${req.method} request to ${req.url}`);
  next();
});

// 4. ROUTES
app.use("/analyze", analyzeRoute);

// 5. GLOBAL ERROR CATCHER: Prevents the server from crashing if a route fails
app.use((err, req, res, next) => {
  console.error("!!! SERVER ERROR !!!", err.stack);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: "The forensic engine encountered an unexpected error." 
  });
});

// 6. INITIALIZATION
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n============================================`);
  console.log(`🚀 TrustLens PRO Server is LIVE`);
  console.log(`📡 Endpoints: http://localhost:${PORT}/analyze`);
  console.log(`🔧 Port: ${PORT}`);
  console.log(`============================================\n`);
});