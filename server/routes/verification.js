import express from 'express';
import { db, logAudit } from '../db.js';
import { authenticateToken, requireHRorAdmin, requireAdmin } from '../auth.js';

const router = express.Router();

// GET /api/verification/queue
// HR and Admin can view all pending and past submissions
router.get('/queue', authenticateToken, requireHRorAdmin, (req, res) => {
  try {
    const { status, department_id, category_id, channel_id, search } = req.query;

    let query = `
      SELECT s.*,
             u.full_name as employee_name, u.employee_code, u.email as employee_email,
             u.is_flagged, u.flag_reason, u.disqualified, u.disqualification_reason,
             d.name as department_name, d.code as department_code,
             cat.name as category_name,
             c.name as channel_name, c.type as channel_type, c.icon_key,
             a.name as activity_name, a.code as activity_code,
             rev.full_name as reviewer_name
      FROM activity_submissions s
      JOIN users u ON s.employee_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories cat ON u.category_id = cat.id
      JOIN social_channels c ON s.channel_id = c.id
      JOIN activity_types a ON s.activity_type_id = a.id
      LEFT JOIN users rev ON s.reviewer_id = rev.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      query += ` AND s.status = ?`;
      params.push(status.toUpperCase());
    }

    if (department_id && department_id !== 'ALL') {
      query += ` AND u.department_id = ?`;
      params.push(Number(department_id));
    }

    if (category_id && category_id !== 'ALL') {
      query += ` AND u.category_id = ?`;
      params.push(Number(category_id));
    }

    if (channel_id && channel_id !== 'ALL') {
      query += ` AND s.channel_id = ?`;
      params.push(Number(channel_id));
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(u.full_name) LIKE ? OR LOWER(u.employee_code) LIKE ? OR LOWER(s.content_ref) LIKE ?)`;
      params.push(term, term, term);
    }

    // Default order: PENDING first, then newest
    query += `
      ORDER BY
        CASE s.status
          WHEN 'PENDING' THEN 1
          WHEN 'CORRECTION_REQUIRED' THEN 2
          ELSE 3
        END,
        s.created_at DESC
    `;

    const submissions = db.prepare(query).all(...params);

    // Summary counters
    const counts = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'CORRECTION_REQUIRED' THEN 1 ELSE 0 END) as correction
      FROM activity_submissions
    `).get();

    res.json({ submissions, counts });
  } catch (err) {
    console.error('Verification queue error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/verification/:id/review
// Approve, Reject, or Request Correction
router.post('/:id/review', authenticateToken, requireHRorAdmin, (req, res) => {
  try {
    const submissionId = Number(req.params.id);
    const { action, notes, awarded_points, flag_employee, flag_reason } = req.body;

    if (!['APPROVE', 'REJECT', 'CORRECTION_REQUIRED'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be APPROVE, REJECT, or CORRECTION_REQUIRED.' });
    }

    const submission = db.prepare(`
      SELECT s.*, u.id as emp_id, u.full_name as emp_name, u.employee_code,
             c.name as channel_name, a.name as activity_name
      FROM activity_submissions s
      JOIN users u ON s.employee_id = u.id
      JOIN social_channels c ON s.channel_id = c.id
      JOIN activity_types a ON s.activity_type_id = a.id
      WHERE s.id = ?
    `).get(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    let newStatus = 'PENDING';
    let finalAwardedPoints = 0;

    if (action === 'APPROVE') {
      newStatus = 'APPROVED';
      finalAwardedPoints = (awarded_points !== undefined && awarded_points !== null)
        ? Number(awarded_points)
        : submission.claimed_points;
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      finalAwardedPoints = 0;
    } else if (action === 'CORRECTION_REQUIRED') {
      newStatus = 'CORRECTION_REQUIRED';
      finalAwardedPoints = 0;
    }

    // Update submission record
    db.prepare(`
      UPDATE activity_submissions
      SET status = ?, awarded_points = ?, reviewer_id = ?, review_notes = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, finalAwardedPoints, req.user.id, notes || null, submissionId);

    // If flagging employee on false claim / policy violation
    if (flag_employee) {
      db.prepare(`
        UPDATE users
        SET is_flagged = 1, flag_reason = ?
        WHERE id = ?
      `).run(flag_reason || notes || 'False claim / fraudulent submission detected during verification.', submission.emp_id);

      logAudit({
        userId: req.user.id,
        userName: req.user.full_name,
        userRole: req.user.role,
        action: 'EMPLOYEE_FLAGGED',
        entityType: 'USERS',
        entityId: String(submission.emp_id),
        details: `Flagged employee ${submission.emp_name} (${submission.employee_code}) due to false claim on submission #${submissionId}. Reason: ${flag_reason || notes}`
      });
    }

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: `SUBMISSION_${action}`,
      entityType: 'ACTIVITY_SUBMISSION',
      entityId: String(submissionId),
      details: `${action} submission #${submissionId} for ${submission.emp_name} (${submission.activity_name} on ${submission.channel_name}). Awarded Points: ${finalAwardedPoints}. Notes: ${notes || 'None'}`
    });

    const updated = db.prepare(`
      SELECT s.*, u.full_name as employee_name, rev.full_name as reviewer_name
      FROM activity_submissions s
      JOIN users u ON s.employee_id = u.id
      LEFT JOIN users rev ON s.reviewer_id = rev.id
      WHERE s.id = ?
    `).get(submissionId);

    res.json({ message: `Submission marked as ${newStatus}.`, submission: updated });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/verification/disqualify
// Admin records disciplinary disqualification after repeated fraudulent claims
router.post('/disqualify', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { employee_id, reason } = req.body;

    if (!employee_id || !reason) {
      return res.status(400).json({ error: 'Employee ID and formal disqualification reason are required.' });
    }

    const emp = db.prepare('SELECT id, full_name, employee_code FROM users WHERE id = ?').get(Number(employee_id));
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    db.prepare(`
      UPDATE users
      SET disqualified = 1, disqualification_reason = ?, disqualified_by = ?, disqualified_at = datetime('now')
      WHERE id = ?
    `).run(reason.trim(), req.user.full_name, emp.id);

    // Also nullify awarded points for any fraudulent submissions if requested
    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'DISCIPLINARY_DISQUALIFICATION',
      entityType: 'USERS',
      entityId: String(emp.id),
      details: `Admin ${req.user.full_name} disqualified ${emp.full_name} (${emp.employee_code}). Formal Reason: ${reason}`
    });

    res.json({ message: `Employee ${emp.full_name} has been disqualified from ADWIN Social Champions 2026. Reason recorded.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/verification/reinstate
// Admin can reinstate employee upon successful appeal or clarification
router.post('/reinstate', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { employee_id, note } = req.body;
    const emp = db.prepare('SELECT id, full_name, employee_code FROM users WHERE id = ?').get(Number(employee_id));
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    db.prepare(`
      UPDATE users
      SET disqualified = 0, disqualification_reason = NULL, is_flagged = 0, flag_reason = NULL
      WHERE id = ?
    `).run(emp.id);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'EMPLOYEE_REINSTATED',
      entityType: 'USERS',
      entityId: String(emp.id),
      details: `Admin ${req.user.full_name} reinstated ${emp.full_name} (${emp.employee_code}). Note: ${note || 'Reinstated after review.'}`
    });

    res.json({ message: `Employee ${emp.full_name} has been reinstated.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
