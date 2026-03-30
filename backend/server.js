import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import analyzeRoutes from './routes/analyze.js';

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
// Crucial: Increased limit for high-res images/screenshots
app.use(express.json({ limit: '50mb' })); 

// ROUTES
app.use('/analyze', analyzeRoutes);

// HEALTH CHECK (Good for your demo to show the server is "Live")
app.get('/', (req, res) => res.send('TrustLens PRO Forensic Server: ONLINE'));

app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 TRUSTLENS PRO SERVER RUNNING ON PORT ${PORT}`);
  console.log(`🛡️  5-PILLAR FORENSIC ENGINE: ACTIVE`);
  console.log(`-----------------------------------------`);
});
