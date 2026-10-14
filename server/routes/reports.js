import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin } from '../auth.js';

const router = express.Router();

// GET /api/reports/analytics
router.get('/analytics', authenticateToken, requireAdmin, (req, res) => {
  try {
    // 1. Department Performance
    const deptPerformance = db.prepare(`
      SELECT d.name as department_name, d.code as department_code,
             COUNT(DISTINCT u.id) as total_employees,
             COUNT(s.id) as total_submissions,
             SUM(CASE WHEN s.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_submissions,
             COALESCE(SUM(s.awarded_points), 0) as verified_points
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id AND u.is_active = 1
      LEFT JOIN activity_submissions s ON s.employee_id = u.id
      GROUP BY d.id
      ORDER BY verified_points DESC
    `).all();

    // 2. Category Performance (Supervisors, Workers, Staff)
    const categoryPerformance = db.prepare(`
      SELECT cat.name as category_name,
             COUNT(DISTINCT u.id) as total_employees,
             COUNT(s.id) as total_submissions,
             SUM(CASE WHEN s.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_submissions,
             COALESCE(SUM(s.awarded_points), 0) as verified_points
      FROM employee_categories cat
      LEFT JOIN users u ON u.category_id = cat.id AND u.is_active = 1
      LEFT JOIN activity_submissions s ON s.employee_id = u.id
      GROUP BY cat.id
      ORDER BY verified_points DESC
    `).all();

    // 3. Platform Breakdown
    const platformBreakdown = db.prepare(`
      SELECT c.name as channel_name, c.type as channel_type, c.icon_key,
             COUNT(s.id) as total_submissions,
             SUM(CASE WHEN s.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
             COALESCE(SUM(s.awarded_points), 0) as total_points
      FROM social_channels c
      LEFT JOIN activity_submissions s ON s.channel_id = c.id
      GROUP BY c.id
      ORDER BY total_points DESC
    `).all();

    // 4. Verification Status Distribution
    const statusDistribution = db.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(claimed_points), 0) as claimed_points
      FROM activity_submissions
      GROUP BY status
    `).all();

    // 5. Weekly Trend
    const weeklyTrend = db.prepare(`
      SELECT period_week,
             COUNT(*) as submissions,
             SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
             COALESCE(SUM(awarded_points), 0) as points
      FROM activity_submissions
      GROUP BY period_week
      ORDER BY period_week ASC
    `).all();

    res.json({
      deptPerformance,
      categoryPerformance,
      platformBreakdown,
      statusDistribution,
      weeklyTrend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/export-csv
// Exports complete employee performance report as CSV
router.get('/export-csv', authenticateToken, requireAdmin, (req, res) => {
  try {
    const data = db.prepare(`
      SELECT u.employee_code, u.full_name, u.email,
             d.name as department, cat.name as category, u.role,
             COALESCE(sub.verified_points, 0) + COALESCE(mom.bonus_points, 0) + COALESCE(ide.bonus_points, 0) as total_verified_points,
             COALESCE(sub.approved_count, 0) as approved_activities,
             COALESCE(sub.pending_count, 0) as pending_activities,
             COALESCE(sub.rejected_count, 0) as rejected_activities,
             CASE WHEN u.disqualified = 1 THEN 'Disqualified' WHEN u.is_flagged = 1 THEN 'Flagged' ELSE 'Good Standing' END as compliance_status,
             u.disqualification_reason
      FROM users u
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories cat ON u.category_id = cat.id
      LEFT JOIN (
        SELECT employee_id,
               SUM(awarded_points) as verified_points,
               SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
               SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
               SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count
        FROM activity_submissions
        GROUP BY employee_id
      ) sub ON sub.employee_id = u.id
      LEFT JOIN (
        SELECT employee_id, SUM(bonus_points) as bonus_points
        FROM innovative_moments
        WHERE status = 'APPROVED'
        GROUP BY employee_id
      ) mom ON mom.employee_id = u.id
      LEFT JOIN (
        SELECT employee_id, SUM(bonus_points) as bonus_points
        FROM ideas
        WHERE status IN ('ACCEPTED', 'IMPLEMENTED')
        GROUP BY employee_id
      ) ide ON ide.employee_id = u.id
      WHERE u.is_active = 1
      ORDER BY total_verified_points DESC, approved_activities DESC, u.full_name ASC
    `).all();

    // Build CSV string
    const headers = [
      'Rank', 'Employee Code', 'Full Name', 'Official Email',
      'Department', 'Category', 'Role', 'Total Verified Points',
      'Approved Activities', 'Pending Activities', 'Rejected Activities',
      'Compliance Status', 'Disqualification Reason'
    ];

    let csv = headers.join(',') + '\n';
    data.forEach((row, idx) => {
      const line = [
        idx + 1,
        `"${row.employee_code}"`,
        `"${row.full_name}"`,
        `"${row.email}"`,
        `"${row.department}"`,
        `"${row.category}"`,
        `"${row.role}"`,
        row.total_verified_points,
        row.approved_activities,
        row.pending_activities,
        row.rejected_activities,
        `"${row.compliance_status}"`,
        `"${(row.disqualification_reason || '').replace(/"/g, '""')}"`
      ];
      csv += line.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ADWIN_Social_Champions_Performance_Report.csv"');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
