import express from 'express';
import { db, logAudit, hashPassword } from '../db.js';
import { authenticateToken, requireAdmin } from '../auth.js';

const router = express.Router();

// GET /api/admin/kpis
router.get('/kpis', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
    const activeParticipants = db.prepare(`
      SELECT COUNT(DISTINCT employee_id) as count
      FROM activity_submissions
    `).get().count;

    const subStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'CORRECTION_REQUIRED' THEN 1 ELSE 0 END) as correction,
        COALESCE(SUM(awarded_points), 0) as verified_points
      FROM activity_submissions
    `).get();

    const bonusStats = db.prepare(`
      SELECT
        COALESCE((SELECT SUM(bonus_points) FROM innovative_moments WHERE status = 'APPROVED'), 0) as moment_bonus,
        COALESCE((SELECT SUM(bonus_points) FROM ideas WHERE status IN ('ACCEPTED', 'IMPLEMENTED')), 0) as idea_bonus
    `).get();

    const totalVerifiedPoints = Number(subStats.verified_points) + Number(bonusStats.moment_bonus) + Number(bonusStats.idea_bonus);

    const flaggedCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_flagged = 1').get().count;
    const disqualifiedCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE disqualified = 1').get().count;

    const campaign = db.prepare('SELECT * FROM campaigns WHERE is_active = 1 LIMIT 1').get();

    // Channel breakdown
    const channelBreakdown = db.prepare(`
      SELECT c.id, c.name, c.type, c.icon_key,
             COUNT(s.id) as total_submissions,
             SUM(CASE WHEN s.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_submissions,
             COALESCE(SUM(s.awarded_points), 0) as points_awarded
      FROM social_channels c
      LEFT JOIN activity_submissions s ON s.channel_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY points_awarded DESC
    `).all();

    res.json({
      kpis: {
        totalEmployees: Number(totalEmployees),
        activeParticipants: Number(activeParticipants),
        totalSubmissions: Number(subStats.total),
        approvedSubmissions: Number(subStats.approved),
        pendingSubmissions: Number(subStats.pending),
        rejectedSubmissions: Number(subStats.rejected),
        correctionRequired: Number(subStats.correction),
        totalVerifiedPoints,
        flaggedCount: Number(flaggedCount),
        disqualifiedCount: Number(disqualifiedCount)
      },
      campaign,
      channelBreakdown
    });
  } catch (err) {
    console.error('Admin KPI error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/employees
router.get('/employees', authenticateToken, requireAdmin, (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.employee_code, u.role, u.campaign_role,
             u.is_active, u.is_flagged, u.flag_reason, u.disqualified, u.disqualification_reason,
             u.created_at,
             d.id as department_id, d.name as department_name, d.code as department_code,
             cat.id as category_id, cat.name as category_name,
             COALESCE(sub.verified_points, 0) as verified_points,
             COALESCE(sub.total_submissions, 0) as total_submissions,
             COALESCE(sub.pending_count, 0) as pending_count
      FROM users u
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories cat ON u.category_id = cat.id
      LEFT JOIN (
        SELECT employee_id,
               SUM(awarded_points) as verified_points,
               COUNT(*) as total_submissions,
               SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count
        FROM activity_submissions
        GROUP BY employee_id
      ) sub ON sub.employee_id = u.id
      ORDER BY u.role = 'ADMIN' DESC, u.role = 'HR' DESC, u.full_name ASC
    `).all();

    res.json({ employees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/employees (Add Employee)
router.post('/employees', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { full_name, email, employee_code, department_id, category_id, role = 'EMPLOYEE', campaign_role, password = 'password123' } = req.body;

    if (!full_name || !email || !employee_code || !department_id || !category_id) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const { hash, salt } = hashPassword(password);

    const result = db.prepare(`
      INSERT INTO users (full_name, email, employee_code, department_id, category_id, password_hash, salt, role, campaign_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(full_name.trim(), email.trim().toLowerCase(), employee_code.trim().toUpperCase(), Number(department_id), Number(category_id), hash, salt, role, campaign_role || null);

    const newId = Number(result.lastInsertRowid);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'ADMIN_CREATE_EMPLOYEE',
      entityType: 'USERS',
      entityId: String(newId),
      details: `Created employee record: ${full_name} (${employee_code}), Role: ${role}`
    });

    res.status(201).json({ message: 'Employee added successfully', id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/employees/:id (Edit Employee)
router.put('/employees/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const empId = Number(req.params.id);
    const { full_name, email, employee_code, department_id, category_id, role, campaign_role, is_active } = req.body;

    db.prepare(`
      UPDATE users
      SET full_name = ?, email = ?, employee_code = ?, department_id = ?, category_id = ?, role = ?, campaign_role = ?, is_active = ?
      WHERE id = ?
    `).run(full_name.trim(), email.trim().toLowerCase(), employee_code.trim().toUpperCase(), Number(department_id), Number(category_id), role, campaign_role || null, is_active ? 1 : 0, empId);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'ADMIN_UPDATE_EMPLOYEE',
      entityType: 'USERS',
      entityId: String(empId),
      details: `Updated employee #${empId} (${full_name})`
    });

    res.json({ message: 'Employee updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/employees/:id (Toggle Active)
router.delete('/employees/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const empId = Number(req.params.id);
    if (empId === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own admin account.' });
    }

    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(empId);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'ADMIN_DEACTIVATE_EMPLOYEE',
      entityType: 'USERS',
      entityId: String(empId),
      details: `Deactivated employee #${empId}`
    });

    res.json({ message: 'Employee deactivated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET & PUT /api/admin/channels (Social Channels)
router.get('/channels', authenticateToken, requireAdmin, (req, res) => {
  try {
    const channels = db.prepare('SELECT * FROM social_channels ORDER BY sort_order ASC, id ASC').all();
    res.json({ channels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/channels', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, type, owner_name, handle, channel_url, icon_key, sort_order = 0, description } = req.body;
    const result = db.prepare(`
      INSERT INTO social_channels (name, type, owner_name, handle, channel_url, icon_key, sort_order, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, type, owner_name, handle, channel_url, icon_key, Number(sort_order), description || null);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'ADMIN_CREATE_CHANNEL',
      entityType: 'SOCIAL_CHANNELS',
      entityId: String(result.lastInsertRowid),
      details: `Added social channel: ${name} (${type})`
    });

    res.status(201).json({ message: 'Channel created successfully', id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/channels/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const chId = Number(req.params.id);
    const { name, type, owner_name, handle, channel_url, icon_key, sort_order, is_active, description } = req.body;

    db.prepare(`
      UPDATE social_channels
      SET name = ?, type = ?, owner_name = ?, handle = ?, channel_url = ?, icon_key = ?, sort_order = ?, is_active = ?, description = ?
      WHERE id = ?
    `).run(name, type, owner_name, handle, channel_url, icon_key, Number(sort_order), is_active ? 1 : 0, description || null, chId);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'ADMIN_UPDATE_CHANNEL',
      entityType: 'SOCIAL_CHANNELS',
      entityId: String(chId),
      details: `Updated social channel #${chId} (${name})`
    });

    res.json({ message: 'Channel updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET & PUT /api/admin/points (Activity Types & Point Settings)
router.get('/points', authenticateToken, requireAdmin, (req, res) => {
  try {
    const activityTypes = db.prepare('SELECT * FROM activity_types ORDER BY id ASC').all();
    res.json({ activityTypes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/points/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const actId = Number(req.params.id);
    const { default_points, description, is_active, audit_reason } = req.body;

    if (!audit_reason) {
      return res.status(400).json({ error: 'Audit reason is mandatory for altering point values.' });
    }

    const old = db.prepare('SELECT * FROM activity_types WHERE id = ?').get(actId);
    if (!old) return res.status(404).json({ error: 'Activity type not found.' });

    db.prepare(`
      UPDATE activity_types
      SET default_points = ?, description = ?, is_active = ?
      WHERE id = ?
    `).run(Number(default_points), description || old.description, is_active !== undefined ? (is_active ? 1 : 0) : old.is_active, actId);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'ADMIN_POINT_VALUE_CHANGED',
      entityType: 'ACTIVITY_TYPES',
      entityId: String(actId),
      details: `Changed "${old.name}" points from ${old.default_points} to ${default_points}. Reason: ${audit_reason}`
    });

    res.json({ message: 'Point setting updated and logged to audit trail.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/correct-points (Point Correction with Audit Reason)
router.post('/correct-points', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { submission_id, new_points, audit_reason } = req.body;

    if (!submission_id || new_points === undefined || !audit_reason) {
      return res.status(400).json({ error: 'Submission ID, new point value, and audit reason are required.' });
    }

    const sub = db.prepare(`
      SELECT s.*, u.full_name as emp_name, u.employee_code
      FROM activity_submissions s
      JOIN users u ON s.employee_id = u.id
      WHERE s.id = ?
    `).get(Number(submission_id));

    if (!sub) return res.status(404).json({ error: 'Submission not found.' });

    db.prepare(`
      UPDATE activity_submissions
      SET awarded_points = ?, review_notes = coalesce(review_notes, '') || ' | Points corrected by Admin: ' || ?
      WHERE id = ?
    `).run(Number(new_points), audit_reason, sub.id);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'ADMIN_POINT_CORRECTION',
      entityType: 'ACTIVITY_SUBMISSION',
      entityId: String(sub.id),
      details: `Admin corrected points for ${sub.emp_name} (${sub.employee_code}) on submission #${sub.id} from ${sub.awarded_points} to ${new_points}. Audit Reason: ${audit_reason}`
    });

    res.json({ message: 'Points corrected successfully and logged to audit trail.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/tie-breaker/resolve
router.post('/tie-breaker/resolve', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { period_type, period_name, category_name = 'Overall', winner_employee_id, quality_reason } = req.body;

    if (!winner_employee_id || !quality_reason || !period_type || !period_name) {
      return res.status(400).json({
        error: 'Period type, period name, selected winner, and quality review reason (relevance, depth, genuine value) are required.'
      });
    }

    const winner = db.prepare('SELECT id, full_name, employee_code FROM users WHERE id = ?').get(Number(winner_employee_id));
    if (!winner) return res.status(404).json({ error: 'Selected winner employee not found.' });

    // Fetch verified points
    const verifiedPointsResult = db.prepare(`
      SELECT COALESCE(SUM(awarded_points), 0) as pts
      FROM activity_submissions
      WHERE employee_id = ? AND status = 'APPROVED'
    `).get(winner.id);

    // Insert into winners table
    db.prepare(`
      INSERT INTO winners (
        period_type, period_name, category_name, employee_id, rank_position,
        verified_points, recognition_title, is_tie_breaker, tie_breaker_reason, declared_by
      ) VALUES (?, ?, ?, ?, 1, ?, 'Gift Hamper + Shield', 1, ?, ?)
    `).run(
      period_type,
      period_name,
      category_name,
      winner.id,
      Number(verifiedPointsResult.pts),
      quality_reason,
      req.user.id
    );

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'TIE_BREAKER_RESOLVED',
      entityType: 'WINNERS',
      entityId: String(winner.id),
      details: `Admin ${req.user.full_name} resolved tie-breaker for ${period_name} (${category_name}). Declared ${winner.full_name} (${winner.employee_code}) Winner! Quality Review Rationale: ${quality_reason}`
    });

    res.json({
      message: `Tie-breaker resolved! ${winner.full_name} officially declared #1 Champion with "Gift Hamper + Shield" recognition.`,
      winner
    });
  } catch (err) {
    console.error('Tie-breaker resolve error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET & POST /api/admin/winners
router.get('/winners', authenticateToken, (req, res) => {
  try {
    const winners = db.prepare(`
      SELECT w.*, u.full_name as employee_name, u.employee_code, u.email,
             d.name as department_name, cat.name as category_name,
             dec.full_name as declared_by_name
      FROM winners w
      JOIN users u ON w.employee_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories cat ON u.category_id = cat.id
      LEFT JOIN users dec ON w.declared_by = dec.id
      ORDER BY w.id DESC
    `).all();

    res.json({ winners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/winners/declare', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { period_type, period_name, category_name = 'Overall', employee_id, rank_position = 1, recognition_title = 'Gift Hamper + Shield', notes } = req.body;

    const emp = db.prepare('SELECT id, full_name, employee_code FROM users WHERE id = ?').get(Number(employee_id));
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    const ptsResult = db.prepare(`
      SELECT COALESCE(SUM(awarded_points), 0) as pts
      FROM activity_submissions
      WHERE employee_id = ? AND status = 'APPROVED'
    `).get(emp.id);

    db.prepare(`
      INSERT INTO winners (
        period_type, period_name, category_name, employee_id, rank_position,
        verified_points, recognition_title, is_tie_breaker, tie_breaker_reason, declared_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(period_type, period_name, category_name, emp.id, Number(rank_position), Number(ptsResult.pts), recognition_title, notes || null, req.user.id);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'WINNER_DECLARED',
      entityType: 'WINNERS',
      entityId: String(emp.id),
      details: `Declared ${emp.full_name} (${emp.employee_code}) as Rank #${rank_position} for ${period_name} (${category_name}). Recognition: ${recognition_title}`
    });

    res.json({ message: `Winner declared: ${emp.full_name} awarded "${recognition_title}".` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp Updates Management
router.get('/whatsapp', authenticateToken, requireAdmin, (req, res) => {
  try {
    const updates = db.prepare(`
      SELECT w.*, u.full_name as created_by_name
      FROM whatsapp_updates w
      LEFT JOIN users u ON w.created_by = u.id
      ORDER BY w.created_at DESC
    `).all();
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { title, target_audience = 'ALL_EMPLOYEES', message_body, status = 'SENT' } = req.body;

    if (!title || !message_body) {
      return res.status(400).json({ error: 'Title and message body are required.' });
    }

    const sentAt = status === 'SENT' ? new Date().toISOString() : null;

    const result = db.prepare(`
      INSERT INTO whatsapp_updates (title, target_audience, message_body, status, created_by, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, target_audience, message_body, status, req.user.id, sentAt);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'WHATSAPP_UPDATE_CREATED',
      entityType: 'WHATSAPP_UPDATES',
      entityId: String(result.lastInsertRowid),
      details: `Broadcast message created: "${title}" (${status})`
    });

    res.status(201).json({ message: 'WhatsApp update recorded successfully.', id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Campaign Settings
router.get('/settings', authenticateToken, requireAdmin, (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE is_active = 1 LIMIT 1').get();
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { title, description, core_message, recognition_text, start_date, end_date, target_participants } = req.body;

    db.prepare(`
      UPDATE campaigns
      SET title = ?, description = ?, core_message = ?, recognition_text = ?, start_date = ?, end_date = ?, target_participants = ?
      WHERE is_active = 1
    `).run(title, description, core_message, recognition_text, start_date, end_date, Number(target_participants));

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      userRole: req.user.role,
      action: 'ADMIN_UPDATE_CAMPAIGN',
      entityType: 'CAMPAIGNS',
      entityId: '1',
      details: `Updated campaign settings. Motto: "${core_message}", Recognition: "${recognition_text}"`
    });

    res.json({ message: 'Campaign settings updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
