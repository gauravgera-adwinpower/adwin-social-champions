import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, logAudit } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for evidence upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/evidence');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proof-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Allowed: PNG, JPG, JPEG, WEBP, PDF (Max 5MB).'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter
});

function calculatePeriod() {
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  if (year !== 2026 || month < 10 || month > 12) {
    return { week: 42, month: 10, year: 2026 };
  }

  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

  return { week: weekNo, month, year };
}

// POST /api/submissions
router.post('/', authenticateToken, upload.single('evidence'), (req, res) => {
  try {
    const userId = req.user.id;

    // Check if employee is disqualified
    if (req.user.disqualified) {
      return res.status(403).json({
        error: `Submission disabled: You have been disqualified from this campaign. Reason: ${req.user.disqualification_reason || 'Policy violation'}.`
      });
    }

    const { channel_id, activity_type_id, content_ref, comment_text } = req.body;

    if (!channel_id || !activity_type_id || !content_ref) {
      return res.status(400).json({
        error: 'Missing required fields: Platform/Channel, Activity Type, and Post/Content reference are required.'
      });
    }

    const cleanContentRef = content_ref.trim();

    // Verify channel exists
    const channel = db.prepare('SELECT id, name FROM social_channels WHERE id = ? AND is_active = 1').get(Number(channel_id));
    if (!channel) {
      return res.status(400).json({ error: 'Selected social channel does not exist or is inactive.' });
    }

    // Verify activity type
    const activityType = db.prepare('SELECT id, code, name, default_points, requires_evidence FROM activity_types WHERE id = ? AND is_active = 1').get(Number(activity_type_id));
    if (!activityType) {
      return res.status(400).json({ error: 'Selected activity type does not exist or is inactive.' });
    }

    // Validate comment if Comment activity
    if (activityType.code === 'COMMENT') {
      if (!comment_text || comment_text.trim().length < 8) {
        return res.status(400).json({
          error: 'Please provide the text of your comment. Meaningful, authentic comments must be at least 8 characters long (spam/one-word comments are not rewarded).'
        });
      }
    }

    // DUPLICATE CLAIM CHECK
    // Rule: Prevent duplicate activity claims for the same employee + platform + content + activity type
    const duplicate = db.prepare(`
      SELECT id, status, created_at
      FROM activity_submissions
      WHERE employee_id = ? AND channel_id = ? AND LOWER(content_ref) = LOWER(?) AND activity_type_id = ?
    `).get(userId, Number(channel_id), cleanContentRef, Number(activity_type_id));

    if (duplicate) {
      return res.status(409).json({
        error: `Duplicate claim prevented: You have already submitted a "${activityType.name}" activity for this specific post (${channel.name}) on ${duplicate.created_at}. Current status: ${duplicate.status}. Repeated submissions for the same post are not permitted.`
      });
    }

    const { week, month, year } = calculatePeriod();
    const evidencePath = req.file ? `/uploads/evidence/${req.file.filename}` : null;
    const evidenceOriginalName = req.file ? req.file.originalname : null;

    const claimedPoints = activityType.default_points || 5;

    const insertStmt = db.prepare(`
      INSERT INTO activity_submissions (
        employee_id, channel_id, activity_type_id, content_ref, comment_text,
        evidence_path, evidence_original_name, claimed_points, awarded_points,
        status, period_week, period_month, period_year, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'PENDING', ?, ?, ?, datetime('now'))
    `);

    const result = insertStmt.run(
      userId,
      Number(channel_id),
      Number(activity_type_id),
      cleanContentRef,
      comment_text ? comment_text.trim() : null,
      evidencePath,
      evidenceOriginalName,
      claimedPoints,
      week,
      month,
      year
    );

    const submissionId = Number(result.lastInsertRowid);

    logAudit({
      userId,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'SUBMISSION_CREATED',
      entityType: 'ACTIVITY_SUBMISSION',
      entityId: String(submissionId),
      details: `Submitted "${activityType.name}" on ${channel.name} for "${cleanContentRef}". Claimed: ${claimedPoints} pts. Status: PENDING verification.`
    });

    const newSub = db.prepare(`
      SELECT s.*, c.name as channel_name, c.icon_key, a.name as activity_name, a.code as activity_code
      FROM activity_submissions s
      JOIN social_channels c ON s.channel_id = c.id
      JOIN activity_types a ON s.activity_type_id = a.id
      WHERE s.id = ?
    `).get(submissionId);

    res.status(201).json({
      message: 'Activity submitted successfully! It is now Pending review by HR/Admin. Points will be awarded upon verification.',
      submission: newSub
    });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submissions/my
router.get('/my', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status;

    let query = `
      SELECT s.*, c.name as channel_name, c.type as channel_type, c.icon_key,
             a.name as activity_name, a.code as activity_code,
             u.full_name as reviewer_name
      FROM activity_submissions s
      JOIN social_channels c ON s.channel_id = c.id
      JOIN activity_types a ON s.activity_type_id = a.id
      LEFT JOIN users u ON s.reviewer_id = u.id
      WHERE s.employee_id = ?
    `;
    const params = [userId];

    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'].includes(status.toUpperCase())) {
      query += ` AND s.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY s.created_at DESC`;

    const submissions = db.prepare(query).all(...params);
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
