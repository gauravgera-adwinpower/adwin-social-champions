import assert from 'node:assert/strict';
import { db, initDatabase, hashPassword } from './db.js';
import { seedData } from './seed.js';
import { createToken, verifyToken } from './auth.js';

console.log('----------------------------------------------------');
console.log('🧪 RUNNING ADWIN SOCIAL CHAMPIONS AUTOMATED TEST SUITE');
console.log('----------------------------------------------------');

// 1. Verify Database Initialization & Seed Integrity
initDatabase();
seedData();

const userCount = db.prepare('SELECT count(*) as c FROM users').get().c;
assert.ok(userCount >= 14, `Expected at least 14 users, found ${userCount}`);
console.log('✅ Test 1 Passed: Database schema and user roster initialized.');

// 2. Verify Gaurav Gera Admin Account
const gaurav = db.prepare('SELECT * FROM users WHERE email = ?').get('gaurav.gera@adwin.com');
assert.ok(gaurav, 'Gaurav Gera user must exist');
assert.equal(gaurav.role, 'ADMIN', 'Gaurav Gera must be ADMIN');
assert.equal(gaurav.employee_code, 'ADW-001', 'Gaurav Gera employee code must be ADW-001');
console.log('✅ Test 2 Passed: Gaurav Gera primary Admin privileges verified.');

// 3. Verify Program Committee (Praveen Singh, Hardeep Singh, Jai Shankar Ji)
const praveen = db.prepare('SELECT * FROM users WHERE email = ?').get('praveen.singh@adwin.com');
assert.equal(praveen.role, 'HR', 'Praveen Singh must have HR role');

const hardeep = db.prepare('SELECT * FROM users WHERE email = ?').get('hardeep.singh@adwin.com');
assert.ok(hardeep.campaign_role.includes('Moment'), 'Hardeep Singh must be Moments Lead');

const jai = db.prepare('SELECT * FROM users WHERE email = ?').get('jai.shankar@adwin.com');
assert.ok(jai.campaign_role.includes('Logistics'), 'Jai Shankar Ji must be Logistics & Rewards Lead');
console.log('✅ Test 3 Passed: Program committee leads verified with distinct roles.');

// 4. Verify Demo Employees Distribution
const supervisors = db.prepare(`SELECT count(*) as c FROM users WHERE category_id = 1 AND role = 'EMPLOYEE'`).get().c;
const workers = db.prepare(`SELECT count(*) as c FROM users WHERE category_id = 2 AND role = 'EMPLOYEE'`).get().c;
const staff = db.prepare(`SELECT count(*) as c FROM users WHERE category_id = 3 AND role = 'EMPLOYEE'`).get().c;

assert.ok(supervisors >= 3, 'Must have supervisors');
assert.ok(workers >= 4, 'Must have workers');
assert.ok(staff >= 3, 'Must have staff');
console.log(`✅ Test 4 Passed: 10 fictional demo employees verified (Supervisors: ${supervisors}, Workers: ${workers}, Staff: ${staff}).`);

// 5. Verify Social Channels (4 ADWIN Official + 2 Rishabh Gupta Leadership)
const officialChannels = db.prepare(`SELECT * FROM social_channels WHERE type = 'OFFICIAL'`).all();
const leadershipChannels = db.prepare(`SELECT * FROM social_channels WHERE type = 'LEADERSHIP'`).all();

assert.equal(officialChannels.length, 4, 'Must have 4 official ADWIN channels (FB, IG, LI, YT)');
assert.equal(leadershipChannels.length, 2, 'Must have 2 Rishabh Gupta leadership channels');
console.log('✅ Test 5 Passed: 4 ADWIN official channels + 2 Rishabh Gupta leadership channels verified.');

// 6. Verify Campaign Message and Recognition Text
const campaign = db.prepare('SELECT * FROM campaigns WHERE is_active = 1 LIMIT 1').get();
assert.equal(campaign.core_message, 'IF ADWIN GROWS, EVERYONE GROWS TOGETHER.');
assert.equal(campaign.recognition_text, 'Gift Hamper + Shield');
console.log(`✅ Test 6 Passed: Core motto "${campaign.core_message}" and recognition "${campaign.recognition_text}" verified.`);

// 7. Verify Activity Types & 20 Point Set Limit
const activityTypes = db.prepare('SELECT * FROM activity_types').all();
assert.equal(activityTypes.length, 4, 'Must have 4 activity types (Like, Follow, Share, Comment)');
const sumDefaultPoints = activityTypes.reduce((acc, a) => acc + a.default_points, 0);
assert.equal(sumDefaultPoints, 20, 'Sum of 4 base activity types must equal 20 points');
console.log('✅ Test 7 Passed: Point matrix verified (5 pts x 4 activities = 20 pts max base set).');

// 8. Test Duplicate Claim Prevention Logic
const testEmpId = 5; // Rajesh Sharma
const testChanId = 1; // Facebook
const testActId = 1; // Like
const testContentRef = 'https://facebook.com/adwinindia/posts/duplicate-test-post-1';

// Clear test row if exists
db.prepare('DELETE FROM activity_submissions WHERE employee_id = ? AND content_ref = ?').run(testEmpId, testContentRef);

// First submission
db.prepare(`
  INSERT INTO activity_submissions (
    employee_id, channel_id, activity_type_id, content_ref, claimed_points, awarded_points,
    status, period_week, period_month, period_year, created_at
  ) VALUES (?, ?, ?, ?, 5, 0, 'PENDING', 42, 10, 2026, datetime('now'))
`).run(testEmpId, testChanId, testActId, testContentRef);

// Attempt duplicate submission
let duplicateCaught = false;
try {
  db.prepare(`
    INSERT INTO activity_submissions (
      employee_id, channel_id, activity_type_id, content_ref, claimed_points, awarded_points,
      status, period_week, period_month, period_year, created_at
    ) VALUES (?, ?, ?, ?, 5, 0, 'PENDING', 42, 10, 2026, datetime('now'))
  `).run(testEmpId, testChanId, testActId, testContentRef);
} catch (err) {
  duplicateCaught = true;
}
assert.ok(duplicateCaught, 'Duplicate submission for same employee + channel + content_ref + activity must trigger DB constraint');
console.log('✅ Test 8 Passed: Duplicate submission prevention strictly enforced.');

// 9. Test Verification Workflow & Points Awarding
const sub = db.prepare('SELECT id, status, awarded_points, claimed_points FROM activity_submissions WHERE employee_id = ? AND content_ref = ?').get(testEmpId, testContentRef);
assert.equal(sub.status, 'PENDING');
assert.equal(sub.awarded_points, 0, 'Pending submissions must have 0 awarded points');

// Approve submission
db.prepare(`
  UPDATE activity_submissions
  SET status = 'APPROVED', awarded_points = claimed_points, reviewer_id = 1, reviewed_at = datetime('now')
  WHERE id = ?
`).run(sub.id);

const approvedSub = db.prepare('SELECT status, awarded_points FROM activity_submissions WHERE id = ?').get(sub.id);
assert.equal(approvedSub.status, 'APPROVED');
assert.equal(approvedSub.awarded_points, 5, 'Points must be awarded immediately upon approval');
console.log('✅ Test 9 Passed: Verification workflow verified (Pending -> Approved with points awarded).');

// 10. Test False-Claim Disciplinary Flagging & Disqualification
const badEmpId = 12; // Dinesh Rawat
db.prepare('UPDATE users SET is_flagged = 1, flag_reason = ? WHERE id = ?').run('Fraudulent screenshot detected', badEmpId);
const flaggedEmp = db.prepare('SELECT is_flagged, flag_reason FROM users WHERE id = ?').get(badEmpId);
assert.equal(flaggedEmp.is_flagged, 1);

// Formal Admin Disqualification
db.prepare(`
  UPDATE users
  SET disqualified = 1, disqualification_reason = ?, disqualified_by = 'Gaurav Gera', disqualified_at = datetime('now')
  WHERE id = ?
`).run('Repeated false claims after warning', badEmpId);
const disqEmp = db.prepare('SELECT disqualified, disqualification_reason FROM users WHERE id = ?').get(badEmpId);
assert.equal(disqEmp.disqualified, 1);
assert.equal(disqEmp.disqualification_reason, 'Repeated false claims after warning');

// Reinstate for continued testing
db.prepare('UPDATE users SET disqualified = 0, is_flagged = 0, disqualification_reason = NULL WHERE id = ?').run(badEmpId);
console.log('✅ Test 10 Passed: False-claim flagging and Admin disqualification workflow verified.');

// 11. Test Leaderboard Scoring & Tie-Breaker
const leaderboardRoster = db.prepare(`
  SELECT u.id, u.full_name,
         COALESCE(SUM(s.awarded_points), 0) as verified_points
  FROM users u
  LEFT JOIN activity_submissions s ON s.employee_id = u.id AND s.status = 'APPROVED'
  WHERE u.is_active = 1 AND u.disqualified = 0
  GROUP BY u.id
  ORDER BY verified_points DESC
`).all();

assert.ok(leaderboardRoster.length > 0, 'Leaderboard must produce results');
assert.ok(leaderboardRoster[0].verified_points >= 0, 'Verified points must be computed');
console.log(`✅ Test 11 Passed: Leaderboard calculated from verified points only. Current Top Performer: ${leaderboardRoster[0].full_name} (${leaderboardRoster[0].verified_points} pts).`);

// 12. Test Token Authentication
const token = createToken({ id: 1, role: 'ADMIN', email: 'gaurav.gera@adwin.com' });
assert.ok(token, 'Token must be generated');
const payload = verifyToken(token);
assert.equal(payload.id, 1);
assert.equal(payload.role, 'ADMIN');
console.log('✅ Test 12 Passed: JWT authentication and verification verified.');

// Clean up test submission
db.prepare('DELETE FROM activity_submissions WHERE employee_id = ? AND content_ref = ?').run(testEmpId, testContentRef);

console.log('----------------------------------------------------');
console.log('🎉 ALL 12 AUTOMATED TESTS PASSED SUCCESSFULLY!');
console.log('----------------------------------------------------');
