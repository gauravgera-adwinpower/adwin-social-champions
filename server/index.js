import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { initDatabase } from './db.js';
import { seedData } from './seed.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import challengesRoutes from './routes/challenges.js';
import submissionsRoutes from './routes/submissions.js';
import verificationRoutes from './routes/verification.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';
import innovationsRoutes from './routes/innovations.js';
import reportsRoutes from './routes/reports.js';
import auditRoutes from './routes/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and ensure seed data is present
initDatabase();
seedData();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory for evidence screenshots & innovation moments
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/innovations', innovationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    campaign: 'ADWIN Social Champions 2026',
    coreMessage: 'IF ADWIN GROWS, EVERYONE GROWS TOGETHER.',
    recognition: 'Gift Hamper + Shield',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if available
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏆 ADWIN SOCIAL CHAMPIONS 2026 SERVER ACTIVE`);
  console.log(`🌐 API listening on http://localhost:${PORT}`);
  console.log(`✨ Motto: "IF ADWIN GROWS, EVERYONE GROWS TOGETHER."`);
  console.log(`🎁 Recognition: Gift Hamper + Shield`);
  console.log(`====================================================`);
});

export default app;
