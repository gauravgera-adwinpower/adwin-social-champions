import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// GET /api/challenges
// Lists active social channels (official + leadership) and activity types
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch active channels
    const channels = db.prepare(`
      SELECT id, name, type, owner_name, handle, channel_url, icon_key, sort_order, description
      FROM social_channels
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `).all();

    // Fetch active activity types
    const activityTypes = db.prepare(`
      SELECT id, code, name, default_points, requires_evidence, description
      FROM activity_types
      WHERE is_active = 1
      ORDER BY id ASC
    `).all();

    // Fetch user's previous submissions to show what has already been claimed/submitted
    const userSubmissions = db.prepare(`
      SELECT channel_id, activity_type_id, content_ref, status, created_at
      FROM activity_submissions
      WHERE employee_id = ?
    `).all(userId);

    // Group channels into official ADWIN channels vs leadership channels
    const officialChannels = channels.filter(c => c.type === 'OFFICIAL');
    const leadershipChannels = channels.filter(c => c.type === 'LEADERSHIP');

    res.json({
      channels,
      officialChannels,
      leadershipChannels,
      activityTypes,
      userSubmissions,
      baseSetMaxPoints: 20,
      scoringNote: 'Base 4-activity set = 20 points (Like: 5, Follow: 5, Share: 5, Comment: 5). Verified evidence required.'
    });
  } catch (err) {
    console.error('Challenges fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
