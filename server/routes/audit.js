import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin } from '../auth.js';

const router = express.Router();

// GET /api/audit
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { action, entity_type, search, limit = 100 } = req.query;

    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (action && action !== 'ALL') {
      query += ` AND action = ?`;
      params.push(action);
    }

    if (entity_type && entity_type !== 'ALL') {
      query += ` AND entity_type = ?`;
      params.push(entity_type);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(user_name) LIKE ? OR LOWER(details) LIKE ? OR LOWER(entity_id) LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const logs = db.prepare(query).all(...params);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
