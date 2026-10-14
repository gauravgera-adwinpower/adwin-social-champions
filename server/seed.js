import { db, initDatabase, hashPassword, logAudit } from './db.js';

export function seedData() {
  initDatabase();

  // Check if already seeded
  const userCount = db.prepare('SELECT count(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('Database already seeded. Skipping initial seed.');
    return;
  }

  console.log('Seeding ADWIN Social Champions 2026 database...');

  // 1. Departments
  const departments = [
    { name: 'Manufacturing & Production', code: 'MFG' },
    { name: 'Quality Control & Assurance', code: 'QC' },
    { name: 'Logistics & Supply Chain', code: 'LSC' },
    { name: 'Sales & Digital Marketing', code: 'SDM' },
    { name: 'Human Resources & Admin', code: 'HR' },
    { name: 'Finance & Accounts', code: 'FIN' },
    { name: 'IT & Automation Systems', code: 'IT' },
    { name: 'Operations & Maintenance', code: 'OPS' },
  ];

  const deptInsert = db.prepare('INSERT INTO departments (name, code) VALUES (?, ?)');
  for (const d of departments) {
    deptInsert.run(d.name, d.code);
  }

  // 2. Employee Categories
  const categories = [
    { name: 'Supervisors', description: 'Floor, Shift, and Section Supervisors across operations' },
    { name: 'Workers', description: 'Machine Operators, Assembly Technicians, Warehouse & Field Crew' },
    { name: 'Staff', description: 'Office Personnel, Engineers, Executives, HR & Finance' },
  ];

  const catInsert = db.prepare('INSERT INTO employee_categories (name, description) VALUES (?, ?)');
  for (const c of categories) {
    catInsert.run(c.name, c.description);
  }

  // 3. Campaign
  db.prepare(`
    INSERT INTO campaigns (title, description, core_message, recognition_text, start_date, end_date, target_participants)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'ADWIN Social Champions 2026',
    '3-Month Employee Social Media Engagement & Advocacy Campaign for Q4 2026',
    'IF ADWIN GROWS, EVERYONE GROWS TOGETHER.',
    'Gift Hamper + Shield',
    '2026-10-01',
    '2026-12-31',
    200
  );

  // 4. Social Channels
  const channels = [
    {
      name: 'ADWIN Facebook',
      type: 'OFFICIAL',
      owner_name: 'ADWIN India Official',
      handle: '@adwinindia',
      channel_url: 'https://facebook.com/adwinindia',
      icon_key: 'Facebook',
      sort_order: 1,
      description: 'Official corporate Facebook page for product launches, company news, and team celebrations.'
    },
    {
      name: 'ADWIN Instagram',
      type: 'OFFICIAL',
      owner_name: 'ADWIN India Official',
      handle: '@adwinindia',
      channel_url: 'https://instagram.com/adwinindia',
      icon_key: 'Instagram',
      sort_order: 2,
      description: 'High-energy reels, factory culture, innovation spotlights, and milestone achievements.'
    },
    {
      name: 'ADWIN LinkedIn',
      type: 'OFFICIAL',
      owner_name: 'ADWIN India Official',
      handle: 'adwin-energy',
      channel_url: 'https://linkedin.com/company/adwin-energy',
      icon_key: 'Linkedin',
      sort_order: 3,
      description: 'Corporate announcements, B2B leadership, renewable energy thought leadership, and recruitment.'
    },
    {
      name: 'ADWIN YouTube',
      type: 'OFFICIAL',
      owner_name: 'ADWIN India Official',
      handle: '@adwinenergy',
      channel_url: 'https://youtube.com/@adwinenergy',
      icon_key: 'Youtube',
      sort_order: 4,
      description: 'In-depth manufacturing walkthroughs, customer stories, product guides, and leadership keynotes.'
    },
    {
      name: 'Rishabh Gupta – Instagram',
      type: 'LEADERSHIP',
      owner_name: 'Rishabh Gupta (Executive Leadership)',
      handle: '@rishabhgupta_adwin',
      channel_url: 'https://instagram.com/rishabhgupta_adwin',
      icon_key: 'Instagram',
      sort_order: 5,
      description: 'Executive leadership perspectives, vision stories, industry rallies, and behind-the-scenes.'
    },
    {
      name: 'Rishabh Gupta – LinkedIn',
      type: 'LEADERSHIP',
      owner_name: 'Rishabh Gupta (Executive Leadership)',
      handle: 'rishabh-gupta-adwin',
      channel_url: 'https://linkedin.com/in/rishabh-gupta-adwin',
      icon_key: 'Linkedin',
      sort_order: 6,
      description: 'Industry insights on green energy transition, team culture, manufacturing excellence, and strategy.'
    }
  ];

  const chanInsert = db.prepare(`
    INSERT INTO social_channels (name, type, owner_name, handle, channel_url, icon_key, sort_order, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const ch of channels) {
    chanInsert.run(ch.name, ch.type, ch.owner_name, ch.handle, ch.channel_url, ch.icon_key, ch.sort_order, ch.description);
  }

  // 5. Activity Types (5 points each, max 20 per set)
  const activityTypes = [
    { code: 'LIKE', name: 'Like Post', default_points: 5, requires_evidence: 1, description: 'Hit like / react on official post or leadership update' },
    { code: 'FOLLOW', name: 'Follow / Subscribe', default_points: 5, requires_evidence: 1, description: 'Follow page or subscribe to YouTube channel' },
    { code: 'SHARE', name: 'Share / Repost', default_points: 5, requires_evidence: 1, description: 'Share or repost with your network or to WhatsApp status' },
    { code: 'COMMENT', name: 'Thoughtful Comment', default_points: 5, requires_evidence: 1, description: 'Post an authentic, meaningful, constructive comment (spam comments not rewarded)' },
  ];

  const actInsert = db.prepare(`
    INSERT INTO activity_types (code, name, default_points, requires_evidence, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const at of activityTypes) {
    actInsert.run(at.code, at.name, at.default_points, at.requires_evidence, at.description);
  }

  // 6. Users / Campaign Committee & 10 Fictional Demo Employees
  const { hash, salt } = hashPassword('password123');

  const users = [
    // Program Committee
    {
      full_name: 'Gaurav Gera',
      email: 'gaurav.gera@adwin.com',
      employee_code: 'ADW-001',
      dept_id: 4, // Sales & Digital Marketing
      cat_id: 3, // Staff
      role: 'ADMIN',
      campaign_role: 'Digital Marketing & Program Lead (Admin)',
    },
    {
      full_name: 'Praveen Singh',
      email: 'praveen.singh@adwin.com',
      employee_code: 'ADW-002',
      dept_id: 5, // Human Resources & Admin
      cat_id: 3, // Staff
      role: 'HR',
      campaign_role: 'HR & Employee Coordination Lead',
    },
    {
      full_name: 'Hardeep Singh',
      email: 'hardeep.singh@adwin.com',
      employee_code: 'ADW-003',
      dept_id: 4, // Sales & Digital Marketing
      cat_id: 3, // Staff
      role: 'EMPLOYEE',
      campaign_role: 'Content & Moment Capture Lead',
    },
    {
      full_name: 'Jai Shankar Ji',
      email: 'jai.shankar@adwin.com',
      employee_code: 'ADW-004',
      dept_id: 3, // Logistics & Supply Chain
      cat_id: 1, // Supervisors
      role: 'EMPLOYEE',
      campaign_role: 'Logistics & Rewards Support Lead',
    },

    // 10 Fictional Demo Employees (Supervisors, Workers, Staff across departments)
    {
      full_name: 'Rajesh Sharma',
      email: 'rajesh.sharma@adwin.com',
      employee_code: 'ADW-101',
      dept_id: 1, // Manufacturing
      cat_id: 1, // Supervisors
      role: 'EMPLOYEE',
      campaign_role: 'Assembly Line Supervisor',
    },
    {
      full_name: 'Anita Verma',
      email: 'anita.verma@adwin.com',
      employee_code: 'ADW-102',
      dept_id: 2, // Quality Control
      cat_id: 3, // Staff
      role: 'EMPLOYEE',
      campaign_role: 'QA Testing Executive',
    },
    {
      full_name: 'Mukesh Kumar',
      email: 'mukesh.kumar@adwin.com',
      employee_code: 'ADW-103',
      dept_id: 1, // Manufacturing
      cat_id: 2, // Workers
      role: 'EMPLOYEE',
      campaign_role: 'CNC Machine Operator',
    },
    {
      full_name: 'Sunita Patel',
      email: 'sunita.patel@adwin.com',
      employee_code: 'ADW-104',
      dept_id: 6, // Finance & Accounts
      cat_id: 3, // Staff
      role: 'EMPLOYEE',
      campaign_role: 'Accounts Officer',
    },
    {
      full_name: 'Vikram Chauhan',
      email: 'vikram.chauhan@adwin.com',
      employee_code: 'ADW-105',
      dept_id: 3, // Logistics
      cat_id: 1, // Supervisors
      role: 'EMPLOYEE',
      campaign_role: 'Warehouse Shift In-Charge',
    },
    {
      full_name: 'Ramesh Yadav',
      email: 'ramesh.yadav@adwin.com',
      employee_code: 'ADW-106',
      dept_id: 8, // Operations & Maintenance
      cat_id: 2, // Workers
      role: 'EMPLOYEE',
      campaign_role: 'Electrical Maintenance Technician',
    },
    {
      full_name: 'Pooja Gupta',
      email: 'pooja.gupta@adwin.com',
      employee_code: 'ADW-107',
      dept_id: 4, // Sales & Marketing
      cat_id: 3, // Staff
      role: 'EMPLOYEE',
      campaign_role: 'Digital Marketing Associate',
    },
    {
      full_name: 'Dinesh Rawat',
      email: 'dinesh.rawat@adwin.com',
      employee_code: 'ADW-108',
      dept_id: 3, // Logistics
      cat_id: 2, // Workers
      role: 'EMPLOYEE',
      campaign_role: 'Dispatch & Packing Specialist',
    },
    {
      full_name: 'Kavita Joshi',
      email: 'kavita.joshi@adwin.com',
      employee_code: 'ADW-109',
      dept_id: 2, // Quality Control
      cat_id: 1, // Supervisors
      role: 'EMPLOYEE',
      campaign_role: 'Incoming QC Supervisor',
    },
    {
      full_name: 'Sanjay Mehra',
      email: 'sanjay.mehra@adwin.com',
      employee_code: 'ADW-110',
      dept_id: 1, // Manufacturing
      cat_id: 2, // Workers
      role: 'EMPLOYEE',
      campaign_role: 'Cell Assembly Operator',
    },
  ];

  const userInsert = db.prepare(`
    INSERT INTO users (full_name, email, employee_code, department_id, category_id, password_hash, salt, role, campaign_role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    userInsert.run(u.full_name, u.email, u.employee_code, u.dept_id, u.cat_id, hash, salt, u.role, u.campaign_role);
  }

  // 7. Seed Sample Submissions (October 2026 realistic data)
  // Let's create realistic activities with varying statuses
  const sampleActivities = [
    {
      emp_id: 5, // Rajesh Sharma (Supervisors)
      channel_id: 3, // LinkedIn
      act_type_id: 4, // Comment
      content_ref: 'https://linkedin.com/company/adwin-energy/posts/q4-manufacturing-expansion',
      comment_text: 'Proud to see our Haridwar facility achieve zero-defect manufacturing milestones! Real team dedication on the shop floor.',
      claimed_pts: 5,
      awarded_pts: 5,
      status: 'APPROVED',
      reviewer_id: 1, // Gaurav Gera
      review_notes: 'Excellent high-value comment reflecting manufacturing pride.',
      reviewed_at: '2026-10-06 11:30:00',
      week: 41,
      month: 10,
      created_at: '2026-10-06 10:15:00'
    },
    {
      emp_id: 5, // Rajesh Sharma
      channel_id: 3, // LinkedIn
      act_type_id: 1, // Like
      content_ref: 'https://linkedin.com/company/adwin-energy/posts/q4-manufacturing-expansion',
      comment_text: null,
      claimed_pts: 5,
      awarded_pts: 5,
      status: 'APPROVED',
      reviewer_id: 1,
      review_notes: 'Verified screenshot of like.',
      reviewed_at: '2026-10-06 11:30:00',
      week: 41,
      month: 10,
      created_at: '2026-10-06 10:14:00'
    },
    {
      emp_id: 5, // Rajesh Sharma
      channel_id: 5, // Rishabh Gupta IG
      act_type_id: 4, // Comment
      content_ref: 'https://instagram.com/p/DAxK92LeadershipKeynote',
      comment_text: 'Inspiring leadership guidance from Rishabh sir. When ADWIN grows, we all grow together!',
      claimed_pts: 5,
      awarded_pts: 5,
      status: 'APPROVED',
      reviewer_id: 2, // Praveen Singh
      review_notes: 'Genuine and positive engagement.',
      reviewed_at: '2026-10-07 14:10:00',
      week: 41,
      month: 10,
      created_at: '2026-10-07 12:40:00'
    },
    {
      emp_id: 6, // Anita Verma (Staff)
      channel_id: 2, // Instagram
      act_type_id: 4, // Comment
      content_ref: 'https://instagram.com/p/DAyL87CleanEnergyReel',
      comment_text: 'Our QC labs test every battery module rigorously for safety and efficiency. Loved this reel showcasing our testing chambers!',
      claimed_pts: 5,
      awarded_pts: 5,
      status: 'APPROVED',
      reviewer_id: 1,
      review_notes: 'Valuable technical perspective in comment.',
      reviewed_at: '2026-10-08 16:00:00',
      week: 41,
      month: 10,
      created_at: '2026-10-08 14:20:00'
    },
    {
      emp_id: 6, // Anita Verma
      channel_id: 2, // Instagram
      act_type_id: 3, // Share
      content_ref: 'https://instagram.com/p/DAyL87CleanEnergyReel',
      comment_text: null,
      claimed_pts: 5,
      awarded_pts: 5,
      status: 'APPROVED',
      reviewer_id: 2,
      review_notes: 'Shared to Instagram stories verified.',
      reviewed_at: '2026-10-08 16:05:00',
      week: 41,
      month: 10,
      created_at: '2026-10-08 14:25:00'
    },
    {
      emp_id: 7, // Mukesh Kumar (Workers)
      channel_id: 4, // YouTube
      act_type_id: 2, // Follow/Subscribe
      content_ref: 'https://youtube.com/@adwinenergy',
      comment_text: null,
      claimed_pts: 5,
      awarded_pts: 5,
      status: 'APPROVED',
      reviewer_id: 1,
      review_notes: 'Subscribed badge visible.',
      reviewed_at: '2026-10-09 10:00:00',
      week: 41,
      month: 10,
      created_at: '2026-10-09 09:15:00'
    },
    {
      emp_id: 7, // Mukesh Kumar (Workers)
      channel_id: 4, // YouTube
      act_type_id: 4, // Comment
      content_ref: 'https://youtube.com/watch?v=adwin-factory-tour-2026',
      comment_text: 'Proud to operate our automated CNC line featured at 03:45 in this video! ADWIN is building world-class technology.',
      claimed_pts: 5,
      awarded_pts: 5,
      status: 'APPROVED',
      reviewer_id: 1,
      review_notes: 'Authentic worker experience shared publicly.',
      reviewed_at: '2026-10-09 10:05:00',
      week: 41,
      month: 10,
      created_at: '2026-10-09 09:20:00'
    },
    {
      emp_id: 8, // Sunita Patel (Staff)
      channel_id: 6, // Rishabh Gupta LinkedIn
      act_type_id: 4, // Comment
      content_ref: 'https://linkedin.com/posts/rishabh-gupta-adwin-renewable-transition-2026',
      comment_text: 'Financial sustainability paired with green energy adoption is the winning formula. Very clear strategy outlined by Rishabh sir.',
      claimed_pts: 5,
      awarded_pts: 5,
      status: 'APPROVED',
      reviewer_id: 2,
      review_notes: 'Insightful corporate finance comment.',
      reviewed_at: '2026-10-10 15:40:00',
      week: 41,
      month: 10,
      created_at: '2026-10-10 11:00:00'
    },
    // PENDING Submissions for Admin/HR review demonstration
    {
      emp_id: 9, // Vikram Chauhan (Supervisors)
      channel_id: 1, // Facebook
      act_type_id: 4, // Comment
      content_ref: 'https://facebook.com/adwinindia/posts/october-dispatch-record',
      comment_text: 'Logistics team completed 500+ shipments ahead of deadline this Diwali season! Kudos to the entire warehouse crew.',
      claimed_pts: 5,
      awarded_pts: 0,
      status: 'PENDING',
      reviewer_id: null,
      review_notes: null,
      reviewed_at: null,
      week: 42,
      month: 10,
      created_at: '2026-10-14 09:30:00'
    },
    {
      emp_id: 10, // Ramesh Yadav (Workers)
      channel_id: 2, // Instagram
      act_type_id: 1, // Like
      content_ref: 'https://instagram.com/p/DAzFactoryDiwaliCelebration',
      comment_text: null,
      claimed_pts: 5,
      awarded_pts: 0,
      status: 'PENDING',
      reviewer_id: null,
      review_notes: null,
      reviewed_at: null,
      week: 42,
      month: 10,
      created_at: '2026-10-14 10:15:00'
    },
    {
      emp_id: 11, // Pooja Gupta (Staff)
      channel_id: 5, // Rishabh Gupta IG
      act_type_id: 3, // Share
      content_ref: 'https://instagram.com/p/DA0RishabhGuptaLeadershipQuote',
      comment_text: null,
      claimed_pts: 5,
      awarded_pts: 0,
      status: 'PENDING',
      reviewer_id: null,
      review_notes: null,
      reviewed_at: null,
      week: 42,
      month: 10,
      created_at: '2026-10-14 11:20:00'
    },
    // REJECTED claim (to demo anti-fraud & flagging)
    {
      emp_id: 12, // Dinesh Rawat (Workers)
      channel_id: 3, // LinkedIn
      act_type_id: 4, // Comment
      content_ref: 'https://linkedin.com/company/adwin-energy/posts/q4-manufacturing-expansion',
      comment_text: 'nice post',
      claimed_pts: 5,
      awarded_pts: 0,
      status: 'REJECTED',
      reviewer_id: 1,
      review_notes: 'Low-effort 2-word spam comment does not meet meaningful engagement standards.',
      reviewed_at: '2026-10-11 17:00:00',
      week: 41,
      month: 10,
      created_at: '2026-10-11 16:30:00'
    },
    // CORRECTION_REQUIRED claim
    {
      emp_id: 13, // Kavita Joshi (Supervisors)
      channel_id: 2, // Instagram
      act_type_id: 4, // Comment
      content_ref: 'https://instagram.com/p/DAyL87CleanEnergyReel',
      comment_text: 'Left a long comment regarding solar inverter durability.',
      claimed_pts: 5,
      awarded_pts: 0,
      status: 'CORRECTION_REQUIRED',
      reviewer_id: 2,
      review_notes: 'Screenshot provided was blurry and did not show your Instagram handle. Please upload a clear screenshot showing your username.',
      reviewed_at: '2026-10-12 12:00:00',
      week: 41,
      month: 10,
      created_at: '2026-10-12 10:00:00'
    }
  ];

  const subInsert = db.prepare(`
    INSERT INTO activity_submissions (
      employee_id, channel_id, activity_type_id, content_ref, comment_text,
      claimed_points, awarded_points, status, reviewer_id, review_notes,
      reviewed_at, period_week, period_month, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of sampleActivities) {
    subInsert.run(
      s.emp_id, s.channel_id, s.act_type_id, s.content_ref, s.comment_text,
      s.claimed_pts, s.awarded_pts, s.status, s.reviewer_id, s.review_notes,
      s.reviewed_at, s.week, s.month, s.created_at
    );
  }

  // 8. Seed Innovative Moments
  db.prepare(`
    INSERT INTO innovative_moments (employee_id, title, description, bonus_points, status, reviewed_by, review_notes, reviewed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    5, // Rajesh Sharma
    'Shop-Floor Solar Inverter Testing Rig Innovation',
    'Designed a quick-release harness for rapid battery pack testing that reduced cycle inspection time by 18% during peak shift.',
    25,
    'APPROVED',
    1,
    'Approved by Hardeep Singh & Gaurav Gera. High operational value and wonderful photo for corporate channels.',
    '2026-10-10 14:00:00',
    '2026-10-09 17:00:00'
  );

  db.prepare(`
    INSERT INTO innovative_moments (employee_id, title, description, bonus_points, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    7, // Mukesh Kumar
    'Precision Laser Marking Setup Video',
    'Recorded a 30-second high-speed clip showing our automated laser barcode etching on battery casings.',
    0,
    'PENDING',
    '2026-10-14 08:30:00'
  );

  // 9. Seed Ideas
  db.prepare(`
    INSERT INTO ideas (employee_id, title, description, category, bonus_points, status, reviewed_by, review_notes, reviewed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    6, // Anita Verma
    'Weekly "Behind the Scenes" Reel Series on Quality Testing',
    'Start a 45-second reel series showing funny, relatable, yet scientific stress tests on ADWIN solar batteries (water submersion, heat chambers).',
    'CONTENT_IDEA',
    20,
    'ACCEPTED',
    1,
    'Brilliant concept! Gaurav & Hardeep will schedule video shoot with QC lab on Oct 20.',
    '2026-10-12 11:00:00',
    '2026-10-11 09:30:00'
  );

  db.prepare(`
    INSERT INTO ideas (employee_id, title, description, category, bonus_points, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    9, // Vikram Chauhan
    'QR Code in Dispatch Boxes for Customer Unboxing Reviews',
    'Place a branded thank-you card with QR code leading directly to ADWIN review page and Instagram contest.',
    'BRAND_GROWTH',
    0,
    'UNDER_REVIEW',
    '2026-10-13 14:00:00'
  );

  // 10. Seed WhatsApp Update Templates
  const whatsappTemplates = [
    {
      title: 'Campaign Launch & Core Message Blast',
      target_audience: 'ALL_EMPLOYEES',
      message_body: `*ADWIN SOCIAL CHAMPIONS 2026 IS LIVE!* 🚀\n\nDear ADWIN Team,\nOur 3-month campaign (Oct-Dec 2026) has officially kicked off!\n\n🌟 *Core Motto:* "IF ADWIN GROWS, EVERYONE GROWS TOGETHER."\n🎁 *Grand Rewards:* *Gift Hamper + Shield* for Top Performers in Supervisors, Workers, and Staff categories!\n\n👉 *Login to your dashboard:* https://adwin-champions.internal\nEngage with our official Facebook, Instagram, LinkedIn, YouTube, and Rishabh Gupta's channels to earn verified points daily!\n\nLet's make ADWIN shine! ✨`,
      status: 'SENT',
      created_by: 1,
      sent_at: '2026-10-01 09:00:00'
    },
    {
      title: 'Week 41 Leaderboard Alert & Challenge of the Week',
      target_audience: 'ALL_EMPLOYEES',
      message_body: `🏆 *ADWIN WEEK 41 LEADERBOARD HIGHLIGHTS* 🏆\n\nTop performers this week are making waves across manufacturing, quality control, and office teams!\n\n⚡ *This Week\'s Spotlight Challenge:*\nEngage with Rishabh Gupta\'s LinkedIn post on our Renewable Energy Roadmap and share your genuine perspective in the comments!\n\nPoints rule: 5 pts Like, 5 pts Follow, 5 pts Share, 5 pts Quality Comment.\n\nCheck your rank and submit your screenshot proof on the dashboard now! 📲`,
      status: 'SENT',
      created_by: 1,
      sent_at: '2026-10-08 10:00:00'
    },
    {
      title: 'Reminder: Authentic Comments Only (Spam Policy)',
      target_audience: 'ALL_EMPLOYEES',
      message_body: `📢 *A QUICK REMINDER FROM HR & DIGITAL MARKETING TEAM*\n\nTo ensure our recognition remains prestigious and fair:\n• Please post meaningful comments that share genuine knowledge, pride, or enthusiasm.\n• Two-word or spam comments will be rejected during verification.\n\nEvery voice matters. Let's showcase ADWIN's true culture! 💪`,
      status: 'DRAFT',
      created_by: 2,
      sent_at: null
    }
  ];

  for (const t of whatsappTemplates) {
    db.prepare(`
      INSERT INTO whatsapp_updates (title, target_audience, message_body, status, created_by, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(t.title, t.target_audience, t.message_body, t.status, t.created_by, t.sent_at);
  }

  // 11. Initial Audit Logs
  logAudit({
    userId: 1,
    userName: 'Gaurav Gera',
    userRole: 'ADMIN',
    action: 'CAMPAIGN_INITIALIZED',
    entityType: 'CAMPAIGN',
    entityId: '1',
    details: 'ADWIN Social Champions 2026 campaign structure, social channels, and point matrices seeded successfully.'
  });

  logAudit({
    userId: 2,
    userName: 'Praveen Singh',
    userRole: 'HR',
    action: 'EMPLOYEE_ROSTER_VERIFIED',
    entityType: 'USERS',
    entityId: 'ALL',
    details: 'Initial roster of 10 fictional demo employees configured across Supervisors, Workers, and Staff.'
  });

  console.log('ADWIN Social Champions database successfully initialized and seeded!');
}

seedData();
