import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// GET /api/leaderboard
router.get('/', authenticateToken, (req, res) => {
  try {
    const { timeframe = 'overall', week, month, department_id, category, channel_id } = req.query;

    let subFilter = `s.status = 'APPROVED'`;
    const subParams = [];

    if (timeframe === 'weekly') {
      const targetWeek = week ? Number(week) : 41;
      subFilter += ` AND s.period_week = ?`;
      subParams.push(targetWeek);
    } else if (timeframe === 'monthly') {
      const targetMonth = month ? Number(month) : 10;
      subFilter += ` AND s.period_month = ?`;
      subParams.push(targetMonth);
    } else if (timeframe === 'quarterly') {
      subFilter += ` AND s.period_month IN (10, 11, 12) AND s.period_year = 2026`;
    }

    if (channel_id && channel_id !== 'ALL') {
      subFilter += ` AND s.channel_id = ?`;
      subParams.push(Number(channel_id));
    }

    // Base user filter
    let userFilter = `u.is_active = 1 AND u.disqualified = 0`;
    const userParams = [];

    if (department_id && department_id !== 'ALL') {
      userFilter += ` AND u.department_id = ?`;
      userParams.push(Number(department_id));
    }

    if (category && category !== 'ALL') {
      userFilter += ` AND cat.name = ?`;
      userParams.push(category);
    }

    // Query aggregated verified scores
    const query = `
      SELECT u.id as employee_id,
             u.full_name,
             u.employee_code,
             u.email,
             d.name as department_name,
             d.code as department_code,
             cat.name as category_name,
             COALESCE(sub.verified_points, 0) +
             COALESCE(moments.bonus_pts, 0) +
             COALESCE(ideas.bonus_pts, 0) as total_verified_points,
             COALESCE(sub.approved_count, 0) as approved_activities_count,
             COALESCE(sub.comments_count, 0) as quality_comments_count,
             COALESCE(sub.likes_count, 0) as likes_count,
             COALESCE(sub.shares_count, 0) as shares_count,
             COALESCE(sub.follows_count, 0) as follows_count,
             u.is_flagged
      FROM users u
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories cat ON u.category_id = cat.id
      LEFT JOIN (
        SELECT s.employee_id,
               SUM(s.awarded_points) as verified_points,
               COUNT(*) as approved_count,
               SUM(CASE WHEN a.code = 'COMMENT' THEN 1 ELSE 0 END) as comments_count,
               SUM(CASE WHEN a.code = 'LIKE' THEN 1 ELSE 0 END) as likes_count,
               SUM(CASE WHEN a.code = 'SHARE' THEN 1 ELSE 0 END) as shares_count,
               SUM(CASE WHEN a.code = 'FOLLOW' THEN 1 ELSE 0 END) as follows_count
        FROM activity_submissions s
        JOIN activity_types a ON s.activity_type_id = a.id
        WHERE ${subFilter}
        GROUP BY s.employee_id
      ) sub ON sub.employee_id = u.id
      LEFT JOIN (
        SELECT employee_id, SUM(bonus_points) as bonus_pts
        FROM innovative_moments
        WHERE status = 'APPROVED'
        GROUP BY employee_id
      ) moments ON moments.employee_id = u.id
      LEFT JOIN (
        SELECT employee_id, SUM(bonus_points) as bonus_pts
        FROM ideas
        WHERE status IN ('ACCEPTED', 'IMPLEMENTED')
        GROUP BY employee_id
      ) ideas ON ideas.employee_id = u.id
      WHERE ${userFilter}
      ORDER BY total_verified_points DESC, quality_comments_count DESC, u.full_name ASC
    `;

    const allParams = [...subParams, ...userParams];
    const rawRoster = db.prepare(query).all(...allParams);

    // Assign dense ranks and check for tie on top position
    let currentRank = 1;
    let maxScore = -1;
    const topScorers = [];

    const leaderboard = rawRoster.map((entry, index) => {
      if (index === 0) {
        maxScore = entry.total_verified_points;
      }

      if (index > 0) {
        if (entry.total_verified_points < rawRoster[index - 1].total_verified_points) {
          currentRank = index + 1;
        }
      }

      const isTopScore = entry.total_verified_points > 0 && entry.total_verified_points === maxScore;
      if (isTopScore) {
        topScorers.push(entry);
      }

      return {
        ...entry,
        rank: currentRank,
        is_tied: false // will flag if top score tied
      };
    });

    // Check tie-breaker condition:
    // If 2 or more participants have the same top score > 0
    const hasTie = topScorers.length >= 2;
    if (hasTie) {
      leaderboard.forEach(item => {
        if (item.total_verified_points === maxScore && maxScore > 0) {
          item.is_tied = true;
        }
      });
    }

    // Category summary statistics
    const categoryStats = db.prepare(`
      SELECT cat.name as category_name,
             COUNT(DISTINCT u.id) as total_employees,
             COALESCE(SUM(s.awarded_points), 0) as verified_points
      FROM employee_categories cat
      LEFT JOIN users u ON u.category_id = cat.id AND u.is_active = 1 AND u.disqualified = 0
      LEFT JOIN activity_submissions s ON s.employee_id = u.id AND s.status = 'APPROVED'
      GROUP BY cat.id
    `).all();

    // Check if an official winner has been declared for this period
    let periodKey = timeframe.toUpperCase();
    if (timeframe === 'weekly') periodKey += `_WEEK_${week || 41}`;
    if (timeframe === 'monthly') periodKey += `_MONTH_${month || 10}`;

    const declaredWinner = db.prepare(`
      SELECT w.*, u.full_name as winner_name, u.employee_code, d.name as department_name, c.name as category_name
      FROM winners w
      JOIN users u ON w.employee_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories c ON u.category_id = c.id
      WHERE w.period_type = ? AND w.category_name = ?
      ORDER BY w.id DESC
      LIMIT 1
    `).get(timeframe.toUpperCase(), category || 'Overall');

    res.json({
      leaderboard,
      timeframe,
      hasTie,
      tieInfo: hasTie ? {
        message: 'Manual Review Required: Top participants share identical verified scores. Compare comment quality, informational relevance, and genuine engagement to finalize winner.',
        tiedCandidates: topScorers
      } : null,
      declaredWinner,
      categoryStats
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaderboard/candidate-comments
// Fetches detailed comments for tie-breaker review comparison
router.get('/candidate-comments', authenticateToken, (req, res) => {
  try {
    const { employee_ids } = req.query;
    if (!employee_ids) return res.json({ comments: [] });

    const ids = employee_ids.split(',').map(Number).filter(n => !isNaN(n));
    if (ids.length === 0) return res.json({ comments: [] });

    const placeholders = ids.map(() => '?').join(',');
    const comments = db.prepare(`
      SELECT s.id, s.employee_id, u.full_name as employee_name, u.employee_code,
             s.comment_text, s.content_ref, s.awarded_points, s.created_at,
             c.name as channel_name
      FROM activity_submissions s
      JOIN users u ON s.employee_id = u.id
      JOIN social_channels c ON s.channel_id = c.id
      JOIN activity_types a ON s.activity_type_id = a.id
      WHERE s.employee_id IN (${placeholders}) AND a.code = 'COMMENT' AND s.status = 'APPROVED'
      ORDER BY s.employee_id, s.created_at DESC
    `).all(...ids);

    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
