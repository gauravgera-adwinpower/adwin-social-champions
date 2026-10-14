import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, logAudit } from '../db.js';
import { authenticateToken, requireHRorAdmin } from '../auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage for moments media
const momentsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/moments');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `moment-${unique}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const uploadMoments = multer({
  storage: momentsStorage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB for photos / clips
});

// ==========================================
// 1. INNOVATIVE MOMENTS (Hardeep Singh Lead)
// ==========================================

// GET /api/innovations/moments
router.get('/moments', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT m.*, u.full_name as employee_name, u.employee_code,
             d.name as department_name, c.name as category_name,
             rev.full_name as reviewer_name
      FROM innovative_moments m
      JOIN users u ON m.employee_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories c ON u.category_id = c.id
      LEFT JOIN users rev ON m.reviewed_by = rev.id
      WHERE 1=1
    `;
    const params = [];

    // Normal employees see approved moments plus their own pending
    if (req.user.role === 'EMPLOYEE') {
      query += ` AND (m.status = 'APPROVED' OR m.employee_id = ?)`;
      params.push(req.user.id);
    } else if (status && status !== 'ALL') {
      query += ` AND m.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY m.created_at DESC`;

    const moments = db.prepare(query).all(...params);
    res.json({ moments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/innovations/moments (Employee uploads moment)
router.post('/moments', authenticateToken, uploadMoments.single('media'), (req, res) => {
  try {
    const { title, description, media_type = 'IMAGE' } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required to capture an innovative moment.' });
    }

    const mediaPath = req.file ? `/uploads/moments/${req.file.filename}` : null;

    const result = db.prepare(`
      INSERT INTO innovative_moments (employee_id, title, description, media_path, media_type, bonus_points, status)
      VALUES (?, ?, ?, ?, ?, 0, 'PENDING')
    `).run(req.user.id, title.trim(), description.trim(), mediaPath, media_type);

    const momentId = Number(result.lastInsertRowid);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'MOMENT_CAPTURED',
      entityType: 'INNOVATIVE_MOMENTS',
      entityId: String(momentId),
      details: `Captured innovative moment: "${title}"`
    });

    res.status(201).json({
      message: 'Innovative moment submitted successfully! Hardeep Singh and the campaign committee will review it for bonus points.',
      momentId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/innovations/moments/:id/review (Hardeep Singh / Admin reviews and awards bonus points)
router.post('/moments/:id/review', authenticateToken, requireHRorAdmin, (req, res) => {
  try {
    const momentId = Number(req.params.id);
    const { status, bonus_points = 0, review_notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED.' });
    }

    const moment = db.prepare('SELECT m.*, u.full_name, u.employee_code FROM innovative_moments m JOIN users u ON m.employee_id = u.id WHERE m.id = ?').get(momentId);
    if (!moment) return res.status(404).json({ error: 'Moment not found.' });

    const awardedBonus = status === 'APPROVED' ? Number(bonus_points) : 0;

    db.prepare(`
      UPDATE innovative_moments
      SET status = ?, bonus_points = ?, reviewed_by = ?, review_notes = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(status, awardedBonus, req.user.id, review_notes || null, momentId);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: `MOMENT_${status}`,
      entityType: 'INNOVATIVE_MOMENTS',
      entityId: String(momentId),
      details: `${status} moment #${momentId} for ${moment.full_name}. Bonus points awarded: ${awardedBonus}. Notes: ${review_notes || 'None'}`
    });

    res.json({ message: `Innovative moment ${status.toLowerCase()} with ${awardedBonus} bonus points.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. SHARE YOUR IDEA MODULE
// ==========================================

// GET /api/innovations/ideas
router.get('/ideas', authenticateToken, (req, res) => {
  try {
    const { status, category } = req.query;

    let query = `
      SELECT i.*, u.full_name as employee_name, u.employee_code,
             d.name as department_name, c.name as category_name,
             rev.full_name as reviewer_name
      FROM ideas i
      JOIN users u ON i.employee_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories c ON u.category_id = c.id
      LEFT JOIN users rev ON i.reviewed_by = rev.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'ALL') {
      query += ` AND i.category = ?`;
      params.push(category);
    }

    if (req.user.role === 'EMPLOYEE') {
      // Employees see all ideas or their own
      query += ` AND (i.status IN ('ACCEPTED', 'IMPLEMENTED') OR i.employee_id = ?)`;
      params.push(req.user.id);
    } else if (status && status !== 'ALL') {
      query += ` AND i.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY i.created_at DESC`;

    const ideas = db.prepare(query).all(...params);
    res.json({ ideas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/innovations/ideas (Employee submits idea)
router.post('/ideas', authenticateToken, (req, res) => {
  try {
    const { title, description, category = 'CONTENT_IDEA' } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Idea title and description are required.' });
    }

    const result = db.prepare(`
      INSERT INTO ideas (employee_id, title, description, category, bonus_points, status)
      VALUES (?, ?, ?, ?, 0, 'SUBMITTED')
    `).run(req.user.id, title.trim(), description.trim(), category);

    const ideaId = Number(result.lastInsertRowid);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'IDEA_SUBMITTED',
      entityType: 'IDEAS',
      entityId: String(ideaId),
      details: `Submitted idea: "${title}" (${category})`
    });

    res.status(201).json({
      message: 'Idea shared successfully! The leadership team will review and consider it for bonus points and implementation.',
      ideaId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/innovations/ideas/:id/review (Admin/HR reviews idea lifecycle)
router.post('/ideas/:id/review', authenticateToken, requireHRorAdmin, (req, res) => {
  try {
    const ideaId = Number(req.params.id);
    const { status, bonus_points = 0, review_notes } = req.body;

    if (!['UNDER_REVIEW', 'ACCEPTED', 'IMPLEMENTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status for idea review.' });
    }

    const idea = db.prepare('SELECT i.*, u.full_name, u.employee_code FROM ideas i JOIN users u ON i.employee_id = u.id WHERE i.id = ?').get(ideaId);
    if (!idea) return res.status(404).json({ error: 'Idea not found.' });

    const awardedBonus = ['ACCEPTED', 'IMPLEMENTED'].includes(status) ? Number(bonus_points) : 0;

    db.prepare(`
      UPDATE ideas
      SET status = ?, bonus_points = ?, reviewed_by = ?, review_notes = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(status, awardedBonus, req.user.id, review_notes || null, ideaId);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: `IDEA_${status}`,
      entityType: 'IDEAS',
      entityId: String(ideaId),
      details: `Idea #${ideaId} for ${idea.full_name} moved to ${status}. Awarded bonus points: ${awardedBonus}. Notes: ${review_notes || 'None'}`
    });

    res.json({ message: `Idea marked as ${status} with ${awardedBonus} bonus points.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
