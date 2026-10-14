import express from 'express';
import { db, verifyPassword, hashPassword, logAudit } from '../db.js';
import { createToken, authenticateToken } from '../auth.js';

const router = express.Router();

// GET metadata (departments & categories) for registration & dropdowns
router.get('/meta', (req, res) => {
  try {
    const departments = db.prepare('SELECT id, name, code FROM departments WHERE is_active = 1 ORDER BY name ASC').all();
    const categories = db.prepare('SELECT id, name, description FROM employee_categories WHERE is_active = 1 ORDER BY id ASC').all();
    const campaign = db.prepare('SELECT * FROM campaigns WHERE is_active = 1 LIMIT 1').get();
    res.json({ departments, categories, campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Login
// Supports either { email, password } OR { full_name, email, employee_code, department_id, category_id, password }
router.post('/login', (req, res) => {
  try {
    const { email, password, employee_code, department_id, category_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Official email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare(`
      SELECT u.*, d.name as department_name, d.code as department_code,
             c.name as category_name
      FROM users u
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories c ON u.category_id = c.id
      WHERE LOWER(u.email) = ?
    `).get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'No account found with this official email.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'This employee account has been deactivated. Please contact HR.' });
    }

    // Verify employee code if provided
    if (employee_code && employee_code.trim().toUpperCase() !== user.employee_code.toUpperCase()) {
      return res.status(401).json({ error: 'Employee code does not match records.' });
    }

    // Verify department if provided
    if (department_id && Number(department_id) !== user.department_id) {
      return res.status(401).json({ error: 'Department selection does not match employee record.' });
    }

    // Verify category if provided
    if (category_id && Number(category_id) !== user.category_id) {
      return res.status(401).json({ error: 'Employee category selection does not match record.' });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const token = createToken({ id: user.id, role: user.role, email: user.email });

    logAudit({
      userId: user.id,
      userName: user.full_name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: String(user.id),
      details: `Successful login for ${user.full_name} (${user.employee_code}) - Role: ${user.role}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      employee_code: user.employee_code,
      role: user.role,
      campaign_role: user.campaign_role,
      department_id: user.department_id,
      department_name: user.department_name,
      department_code: user.department_code,
      category_id: user.category_id,
      category_name: user.category_name,
      is_flagged: user.is_flagged,
      disqualified: user.disqualified,
      disqualification_reason: user.disqualification_reason
    };

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST Register new employee
router.post('/register', (req, res) => {
  try {
    const { full_name, email, employee_code, department_id, category_id, password } = req.body;

    if (!full_name || !email || !employee_code || !department_id || !category_id || !password) {
      return res.status(400).json({
        error: 'All fields are mandatory: Full Name, Official Office Email, Employee Code, Department, Employee Category, Password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = employee_code.trim().toUpperCase();

    // Check unique email and code
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? OR UPPER(employee_code) = ?').get(cleanEmail, cleanCode);
    if (existing) {
      return res.status(400).json({ error: 'An employee with this email or employee code is already registered.' });
    }

    const { hash, salt } = hashPassword(password);

    const result = db.prepare(`
      INSERT INTO users (full_name, email, employee_code, department_id, category_id, password_hash, salt, role, campaign_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'EMPLOYEE', 'Participant')
    `).run(full_name.trim(), cleanEmail, cleanCode, Number(department_id), Number(category_id), hash, salt);

    const newUserId = Number(result.lastInsertRowid);
    const token = createToken({ id: newUserId, role: 'EMPLOYEE', email: cleanEmail });

    logAudit({
      userId: newUserId,
      userName: full_name.trim(),
      userRole: 'EMPLOYEE',
      action: 'USER_REGISTERED',
      entityType: 'USERS',
      entityId: String(newUserId),
      details: `New employee registered: ${full_name} (${cleanCode})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    const user = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.employee_code, u.role, u.campaign_role,
             d.id as department_id, d.name as department_name, d.code as department_code,
             c.id as category_id, c.name as category_name
      FROM users u
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories c ON u.category_id = c.id
      WHERE u.id = ?
    `).get(newUserId);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// GET Demo Accounts List for one-click testing
router.get('/demo-accounts', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.employee_code, u.role, u.campaign_role,
             d.name as department_name, c.name as category_name
      FROM users u
      JOIN departments d ON u.department_id = d.id
      JOIN employee_categories c ON u.category_id = c.id
      WHERE u.is_active = 1
      ORDER BY
        CASE u.role
          WHEN 'ADMIN' THEN 1
          WHEN 'HR' THEN 2
          ELSE 3
        END,
        c.id, u.full_name
    `).all();

    res.json({ accounts, defaultPassword: 'password123' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
