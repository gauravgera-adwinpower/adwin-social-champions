import crypto from 'node:crypto';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'adwin-social-champions-secret-key-2026-secure';

export function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export function authenticateToken(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Session expired or invalid. Please login again.' });
  }

  // Fetch fresh user from DB
  const user = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.employee_code, u.role, u.campaign_role,
           u.is_active, u.is_flagged, u.flag_reason, u.disqualified, u.disqualification_reason,
           d.id as department_id, d.name as department_name, d.code as department_code,
           c.id as category_id, c.name as category_name
    FROM users u
    JOIN departments d ON u.department_id = d.id
    JOIN employee_categories c ON u.category_id = c.id
    WHERE u.id = ?
  `).get(payload.id);

  if (!user || !user.is_active) {
    return res.status(403).json({ error: 'User account inactive or not found.' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Administrative privileges required (Gaurav Gera).' });
  }
  next();
}

export function requireHRorAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'HR')) {
    return res.status(403).json({ error: 'Access denied. HR or Admin verification privileges required.' });
  }
  next();
}
