import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Helper to get current ISO week and month
function getCurrentPeriod() {
  const now = new Date();
  // For October 2026 campaign context: if current time is outside Oct-Dec 2026, default to Oct 2026
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  // If testing in standard current time, ensure Q4 2026 bounds
  if (year !== 2026 || month < 10 || month > 12) {
    // Default to October 2026 Week 41 for demo context
    return { week: 41, month: 10, year: 2026 };
  }

  // Calculate ISO week
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

  return { week: weekNo, month, year };
}

router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { week, month, year } = getCurrentPeriod();

    // 1. Weekly Points (Approved in current week)
    const weeklyResult = db.prepare(`
      SELECT COALESCE(SUM(awarded_points), 0) as total
      FROM activity_submissions
      WHERE employee_id = ? AND status = 'APPROVED' AND period_week = ? AND period_year = ?
    `).get(userId, week, year);
    const weeklyPoints = weeklyResult ? Number(weeklyResult.total) : 0;

    // 2. Monthly Points (Approved in current month)
    const monthlyResult = db.prepare(`
      SELECT COALESCE(SUM(awarded_points), 0) as total
      FROM activity_submissions
      WHERE employee_id = ? AND status = 'APPROVED' AND period_month = ? AND period_year = ?
    `).get(userId, month, year);
    const monthlyPoints = monthlyResult ? Number(monthlyResult.total) : 0;

    // 3. Quarterly Points (Approved in Oct, Nov, Dec 2026) + Bonus points from Moments and Ideas
    const subQuarterly = db.prepare(`
      SELECT COALESCE(SUM(awarded_points), 0) as total
      FROM activity_submissions
      WHERE employee_id = ? AND status = 'APPROVED' AND period_year = ? AND period_month IN (10, 11, 12)
    `).get(userId, year);

    const momentBonus = db.prepare(`
      SELECT COALESCE(SUM(bonus_points), 0) as total
      FROM innovative_moments
      WHERE employee_id = ? AND status = 'APPROVED'
    `).get(userId);

    const ideaBonus = db.prepare(`
      SELECT COALESCE(SUM(bonus_points), 0) as total
      FROM ideas
      WHERE employee_id = ? AND status IN ('ACCEPTED', 'IMPLEMENTED')
    `).get(userId);

    const quarterlyPoints = Number(subQuarterly.total) + Number(momentBonus.total) + Number(ideaBonus.total);

    // 4. Pending Submissions Count & Claimed Points
    const pendingResult = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(claimed_points), 0) as points
      FROM activity_submissions
      WHERE employee_id = ? AND status = 'PENDING'
    `).get(userId);

    // 5. Calculate Current Rank (Overall)
    // Rank is based on Total Verified Points across all approved activities + bonuses
    const allRanks = db.prepare(`
      SELECT u.id,
        (
          COALESCE((SELECT SUM(awarded_points) FROM activity_submissions WHERE employee_id = u.id AND status = 'APPROVED'), 0) +
          COALESCE((SELECT SUM(bonus_points) FROM innovative_moments WHERE employee_id = u.id AND status = 'APPROVED'), 0) +
          COALESCE((SELECT SUM(bonus_points) FROM ideas WHERE employee_id = u.id AND status IN ('ACCEPTED', 'IMPLEMENTED')), 0)
        ) as total_points
      FROM users u
      WHERE u.is_active = 1 AND u.disqualified = 0
      ORDER BY total_points DESC, u.id ASC
    `).all();

    let currentRank = 1;
    let nextRankPoints = 0;
    let pointsToNextRank = 0;

    for (let i = 0; i < allRanks.length; i++) {
      if (allRanks[i].id === userId) {
        currentRank = i + 1;
        if (i > 0) {
          nextRankPoints = allRanks[i - 1].total_points;
          pointsToNextRank = Math.max(0, nextRankPoints - allRanks[i].total_points + 5);
        }
        break;
      }
    }

    // 6. Category Rank
    const categoryRanks = db.prepare(`
      SELECT u.id,
        (
          COALESCE((SELECT SUM(awarded_points) FROM activity_submissions WHERE employee_id = u.id AND status = 'APPROVED'), 0) +
          COALESCE((SELECT SUM(bonus_points) FROM innovative_moments WHERE employee_id = u.id AND status = 'APPROVED'), 0) +
          COALESCE((SELECT SUM(bonus_points) FROM ideas WHERE employee_id = u.id AND status IN ('ACCEPTED', 'IMPLEMENTED')), 0)
        ) as total_points
      FROM users u
      WHERE u.category_id = ? AND u.is_active = 1 AND u.disqualified = 0
      ORDER BY total_points DESC, u.id ASC
    `).all(req.user.category_id);

    let categoryRank = 1;
    for (let i = 0; i < categoryRanks.length; i++) {
      if (categoryRanks[i].id === userId) {
        categoryRank = i + 1;
        break;
      }
    }

    // 7. Recent Submissions (Last 10)
    const recentActivity = db.prepare(`
      SELECT s.id, s.content_ref, s.comment_text, s.claimed_points, s.awarded_points,
             s.status, s.review_notes, s.reviewed_at, s.created_at,
             c.name as channel_name, c.type as channel_type, c.icon_key,
             a.name as activity_name, a.code as activity_code
      FROM activity_submissions s
      JOIN social_channels c ON s.channel_id = c.id
      JOIN activity_types a ON s.activity_type_id = a.id
      WHERE s.employee_id = ?
      ORDER BY s.created_at DESC
      LIMIT 10
    `).all(userId);

    // 8. Campaign Information
    const campaign = db.prepare(`
      SELECT title, core_message, recognition_text, start_date, end_date
      FROM campaigns
      WHERE is_active = 1
      LIMIT 1
    `).get();

    res.json({
      employee: {
        id: req.user.id,
        full_name: req.user.full_name,
        employee_code: req.user.employee_code,
        department_name: req.user.department_name,
        category_name: req.user.category_name,
        role: req.user.role,
        campaign_role: req.user.campaign_role,
        is_flagged: req.user.is_flagged,
        disqualified: req.user.disqualified,
        disqualification_reason: req.user.disqualification_reason
      },
      points: {
        weekly: weeklyPoints,
        monthly: monthlyPoints,
        quarterly: quarterlyPoints,
        currentWeek: week,
        currentMonth: month,
        currentYear: year,
      },
      rank: {
        overall: currentRank,
        totalParticipants: allRanks.length,
        categoryRank: categoryRank,
        categoryTotal: categoryRanks.length,
        categoryName: req.user.category_name,
        pointsToNextRank,
        nextRankPoints
      },
      pending: {
        count: Number(pendingResult.count),
        points: Number(pendingResult.points)
      },
      recentActivity,
      campaign
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
