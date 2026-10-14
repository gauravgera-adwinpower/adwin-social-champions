import assert from 'node:assert/strict';

async function runLiveTests() {
  console.log('====================================================');
  console.log('⚡ TESTING LIVE FULL-STACK SERVER (PORT 5000)');
  console.log('====================================================');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, 'ONLINE');
  assert.equal(health.recognition, 'Gift Hamper + Shield');
  console.log('✅ 1. Health Endpoint Passed: Online & "Gift Hamper + Shield" verified.');

  // 2. Static SPA serving
  const spaRes = await fetch('http://localhost:5000/');
  assert.equal(spaRes.status, 200);
  const spaHtml = await spaRes.text();
  assert.ok(spaHtml.includes('ADWIN Social Champions 2026'), 'SPA HTML must include campaign title');
  console.log('✅ 2. Frontend SPA Delivery Passed: Serving built Vite React production app.');

  // 3. Demo accounts
  const demoRes = await fetch('http://localhost:5000/api/auth/demo-accounts');
  assert.equal(demoRes.status, 200);
  const demoData = await demoRes.json();
  assert.ok(demoData.accounts.length >= 14, 'Demo accounts list must have >= 14 accounts');
  console.log(`✅ 3. Demo Accounts Passed: ${demoData.accounts.length} accounts available.`);

  // 4. Admin Login (Gaurav Gera)
  const adminRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gaurav.gera@adwin.com', password: 'password123' })
  });
  assert.equal(adminRes.status, 200);
  const adminData = await adminRes.json();
  assert.equal(adminData.user.role, 'ADMIN');
  const adminToken = adminData.token;
  console.log('✅ 4. Admin Authentication Passed: Logged in as Gaurav Gera (ADMIN).');

  // 5. Admin KPIs
  const kpiRes = await fetch('http://localhost:5000/api/admin/kpis', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(kpiRes.status, 200);
  const kpiData = await kpiRes.json();
  assert.ok(kpiData.kpis.totalEmployees >= 14);
  assert.ok(kpiData.kpis.totalVerifiedPoints >= 0);
  console.log(`✅ 5. Admin KPIs Passed: Total Employees: ${kpiData.kpis.totalEmployees}, Verified Points: ${kpiData.kpis.totalVerifiedPoints}.`);

  // 6. Employee Login (Rajesh Sharma - Supervisor)
  const empRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rajesh.sharma@adwin.com', password: 'password123' })
  });
  assert.equal(empRes.status, 200);
  const empData = await empRes.json();
  assert.equal(empData.user.category_name, 'Supervisors');
  const empToken = empData.token;
  console.log(`✅ 6. Employee Login Passed: Rajesh Sharma (${empData.user.category_name} - ${empData.user.department_name}).`);

  // 7. Dashboard Stats
  const dashRes = await fetch('http://localhost:5000/api/dashboard/stats', {
    headers: { Authorization: `Bearer ${empToken}` }
  });
  assert.equal(dashRes.status, 200);
  const dashData = await dashRes.json();
  assert.ok(dashData.points.quarterly >= 0);
  assert.ok(dashData.rank.overall >= 1);
  console.log(`✅ 7. Employee Dashboard Passed: Weekly: ${dashData.points.weekly} pts, Monthly: ${dashData.points.monthly} pts, Quarterly: ${dashData.points.quarterly} pts, Rank #${dashData.rank.overall}.`);

  // 8. Leaderboard View
  const lbRes = await fetch('http://localhost:5000/api/leaderboard?timeframe=overall', {
    headers: { Authorization: `Bearer ${empToken}` }
  });
  assert.equal(lbRes.status, 200);
  const lbData = await lbRes.json();
  assert.ok(lbData.leaderboard.length > 0);
  console.log(`✅ 8. Leaderboard Passed: Top Champion: ${lbData.leaderboard[0].full_name} (${lbData.leaderboard[0].total_verified_points} verified pts).`);

  // 9. CSV Report Export
  const csvRes = await fetch('http://localhost:5000/api/reports/export-csv', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('Rank,Employee Code,Full Name'));
  assert.ok(csvText.includes('ADW-101'));
  console.log(`✅ 9. CSV Export Passed: Full employee performance spreadsheet generated (${csvText.length} bytes).`);

  console.log('====================================================');
  console.log('🎉 ALL 9 LIVE HTTP INTEGRATION TESTS PASSED!');
  console.log('====================================================');
}

runLiveTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
