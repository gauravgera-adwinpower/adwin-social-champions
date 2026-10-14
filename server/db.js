import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const evidenceDir = path.join(uploadsDir, 'evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}
const momentsDir = path.join(uploadsDir, 'moments');
if (!fs.existsSync(momentsDir)) {
  fs.mkdirSync(momentsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'adwin_social_champions.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return check === hash;
}

export function initDatabase() {
  db.exec(`
    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Employee Categories
    CREATE TABLE IF NOT EXISTS employee_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- Campaign Settings
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      core_message TEXT NOT NULL,
      recognition_text TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      target_participants INTEGER DEFAULT 200,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Users / Employees
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      employee_code TEXT NOT NULL UNIQUE,
      department_id INTEGER NOT NULL REFERENCES departments(id),
      category_id INTEGER NOT NULL REFERENCES employee_categories(id),
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'HR', 'EMPLOYEE')),
      campaign_role TEXT, -- e.g. "Digital Marketing Lead", "HR Coordination", "Moments Lead", "Logistics Lead"
      is_active INTEGER DEFAULT 1,
      is_flagged INTEGER DEFAULT 0,
      flag_reason TEXT,
      disqualified INTEGER DEFAULT 0,
      disqualification_reason TEXT,
      disqualified_by TEXT,
      disqualified_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Social Channels (Configurable by Admin)
    CREATE TABLE IF NOT EXISTS social_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('OFFICIAL', 'LEADERSHIP')),
      owner_name TEXT NOT NULL,
      handle TEXT NOT NULL,
      channel_url TEXT NOT NULL,
      icon_key TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Activity Types (Like, Follow, Share, Comment - Configurable points)
    CREATE TABLE IF NOT EXISTS activity_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      default_points INTEGER NOT NULL DEFAULT 5,
      requires_evidence INTEGER DEFAULT 1,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- Activity Submissions
    CREATE TABLE IF NOT EXISTS activity_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES users(id),
      channel_id INTEGER NOT NULL REFERENCES social_channels(id),
      activity_type_id INTEGER NOT NULL REFERENCES activity_types(id),
      content_ref TEXT NOT NULL, -- URL or Post Title
      comment_text TEXT,
      evidence_path TEXT,
      evidence_original_name TEXT,
      claimed_points INTEGER NOT NULL,
      awarded_points INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'CORRECTION_REQUIRED')),
      reviewer_id INTEGER REFERENCES users(id),
      review_notes TEXT,
      reviewed_at TEXT,
      period_week INTEGER NOT NULL,
      period_month INTEGER NOT NULL,
      period_year INTEGER NOT NULL DEFAULT 2026,
      created_at TEXT DEFAULT (datetime('now')),
      CONSTRAINT unique_emp_channel_post_activity UNIQUE(employee_id, channel_id, content_ref, activity_type_id)
    );

    -- Innovative Moments (Photo/Video capture by Hardeep Singh / Employees)
    CREATE TABLE IF NOT EXISTS innovative_moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      media_path TEXT,
      media_type TEXT DEFAULT 'IMAGE',
      bonus_points INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      reviewed_by INTEGER REFERENCES users(id),
      review_notes TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Employee Ideas
    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL, -- 'SOCIAL_MEDIA', 'CONTENT_IDEA', 'BRAND_GROWTH', 'WORKPLACE'
      bonus_points INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'IMPLEMENTED', 'REJECTED')),
      reviewed_by INTEGER REFERENCES users(id),
      review_notes TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Winners & Recognition
    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_type TEXT NOT NULL CHECK(period_type IN ('WEEKLY', 'MONTHLY', 'QUARTERLY')),
      period_name TEXT NOT NULL, -- e.g. "Week 41 (Oct 5-11)", "October 2026", "Q4 Grand Champions"
      category_name TEXT NOT NULL, -- 'Overall', 'Supervisors', 'Workers', 'Staff'
      employee_id INTEGER NOT NULL REFERENCES users(id),
      rank_position INTEGER NOT NULL,
      verified_points INTEGER NOT NULL,
      recognition_title TEXT NOT NULL DEFAULT 'Gift Hamper + Shield',
      is_tie_breaker INTEGER DEFAULT 0,
      tie_breaker_reason TEXT,
      declared_by INTEGER REFERENCES users(id),
      declared_at TEXT DEFAULT (datetime('now'))
    );

    -- WhatsApp Update Templates & Broadcast Logs
    CREATE TABLE IF NOT EXISTS whatsapp_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      target_audience TEXT NOT NULL DEFAULT 'ALL_EMPLOYEES',
      message_body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SENT', 'SCHEDULED')),
      created_by INTEGER REFERENCES users(id),
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Audit Logs (Mandatory for every Admin/HR action)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT NOT NULL,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Global System Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_subs_emp_status ON activity_submissions(employee_id, status);
    CREATE INDEX IF NOT EXISTS idx_subs_created_at ON activity_submissions(created_at);
    CREATE INDEX IF NOT EXISTS idx_subs_week_month ON activity_submissions(period_week, period_month);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
}

export function logAudit({ userId, userName, userRole, action, entityType, entityId, details, ipAddress = '127.0.0.1' }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId || null, userName || 'System', userRole || 'SYSTEM', action, entityType, String(entityId || ''), details, ipAddress);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
