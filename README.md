# ADWIN Social Champions 2026 — Enterprise Engagement Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: v22](https://img.shields.io/badge/Node-v22%2B-green.svg)](https://nodejs.org)
[![Campaign](https://img.shields.io/badge/Campaign-ADWIN%20Social%20Champions%202026-orange.svg)]()
[![Recognition](https://img.shields.io/badge/Recognition-Gift%20Hamper%20%2B%20Shield-amber.svg)]()

> **Core Campaign Motto:** *“IF ADWIN GROWS, EVERYONE GROWS TOGETHER.”*  
> **Recognition:** **Gift Hamper + Shield**  
> **Campaign Scope:** October 1, 2026 – December 31, 2026 (Q4 2026) for approximately 200 ADWIN employees spanning **Supervisors, Workers, and Staff**.

---

## 🌟 Executive Overview
**ADWIN Social Champions 2026** is a full-stack, secure employee engagement and social media advocacy web application. Unlike static mockups or visual templates, this is a **fully functional, production-ready system** with real database transactions, screenshot evidence verification workflows, anti-fraud duplicate prevention, automated tie-breaking with qualitative comment evaluation, and executive administrative control.

---

## 👥 Campaign Committee & Program Leads

| Team Member | Official Role | Dashboard Capabilities |
|---|---|---|
| **Gaurav Gera** | Digital Marketing & Program/Admin Lead | Primary Administrator. Full access to employee rosters, points matrix, challenge rules, audit logs, winner declarations, and disciplinary actions. |
| **Ruchi Singh** | HR & Employee Coordination Lead | Verification Lead. Reviews evidence queue, approves/rejects submissions, flags false claims, and manages HR communications. |
| **Hardeep Singh** | Content & Moment Capture Lead | Photography & Videography Lead. Reviews shop-floor innovative moments submitted by workers and awards bonus points. |
| **Jai Shankar** | Logistics & Rewards Support Lead | Manages inventory, certificates, and fulfillment for the **Gift Hamper + Shield** recognition awards. |

---

## 🏢 Social Channels (Configurable by Admin)

### Official ADWIN Channels
1. **Facebook:** [ADWIN India Official](https://www.facebook.com/adwinbatteries) (`@adwinindia`)
2. **Instagram:** [ADWIN India Official](https://www.instagram.com/adwin_power/) (`@adwinindia`)
3. **LinkedIn:** [ADWIN Energy Company](https://www.linkedin.com/company/adwin-power) (`adwin-energy`)
4. **YouTube:** [ADWIN Energy Channel](https://www.youtube.com/@adwinpower) (`@adwinenergy`)

### Leadership Thought Leadership Channels
5. **Rishabh Gupta – Instagram:** [Rishabh Gupta Executive](https://www.instagram.com/rishabhxadwin/) (`@rishabhgupta_adwin`)
6. **Rishabh Gupta – LinkedIn:** [Rishabh Gupta Executive Profile](https://www.linkedin.com/in/rishabh-gupta-0b47473a9/) (`rishabh-gupta-adwin`)

*Note: All social channels, handles, and URLs are stored dynamically in the relational database and can be edited, deactivated, or expanded directly from the Admin Settings panel.*

---

## 🎯 Scoring & Verification Integrity Rules

- **Base Activity Points:**
  - **Like:** 5 points
  - **Follow / Subscribe:** 5 points
  - **Share / Repost:** 5 points
  - **Comment:** 5 points
  - **Maximum Base Set:** 20 points for completing all four activities on a post.
- **Evidence Verification:** Points are **never awarded automatically via checkboxes**. Every claim requires a post reference and screenshot proof. Points are credited only when an authorized reviewer (Gaurav Gera / Ruchi Singh) changes the status to `APPROVED`.
- **Duplicate Claim Blocker:** The system enforces a unique database constraint on `(employee_id, channel_id, content_ref, activity_type_id)`. Re-submitting the same post for repeat points is strictly prevented.
- **Anti-Spam Policy:** Meaningful, authentic comments must be at least 8 characters. Spam or 2-word comments are rejected.
- **Disciplinary Rule:** Repeated fraudulent claims result in formal disqualification with a mandatory audit reason recorded by Admin.

---

## ⚖️ Tie-Breaker Workflow

When two or more participants share the highest verified score in any leaderboard timeframe:
1. The system automatically displays a prominent **"Manual Review Required"** badge.
2. Admin/HR initiates the manual quality review modal.
3. The committee compares candidates side-by-side using the 4-part rubric:
   1. *Relevance of comments*
   2. *Informational value*
   3. *Quality of comments*
   4. *Genuine contribution*
4. The administrator selects the winning champion and records a **mandatory written decision rationale** that is logged in the audit trail and printed on the **Gift Hamper + Shield** certificate.

---

## 🔑 Demo Accounts Credentials

All demo accounts share the default test password: `password123`  
*A 1-click Demo Account Switcher is available in the top navigation bar of both login and internal pages.*

| Full Name | Role | Email | Employee Code | Department | Category |
|---|---|---|---|---|---|
| **Gaurav Gera** | `ADMIN` | `gaurav.gera@adwin.com` | `ADW-001` | Sales & Digital Marketing | Staff |
| **Ruchi Singh** | `HR` | `ruchi.singh@adwin.com` | `ADW-002` | Human Resources & Admin | Staff |
| **Hardeep Singh** | `EMPLOYEE` | `hardeep.singh@adwin.com` | `ADW-003` | Sales & Digital Marketing | Staff |
| **Jai Shankar Ji** | `EMPLOYEE` | `jai.shankar@adwin.com` | `ADW-004` | Logistics & Supply Chain | Supervisors |
| **Rajesh Sharma** | `EMPLOYEE` | `rajesh.sharma@adwin.com` | `ADW-101` | Manufacturing & Production | Supervisors |
| **Anita Verma** | `EMPLOYEE` | `anita.verma@adwin.com` | `ADW-102` | Quality Control & Assurance | Staff |
| **Mukesh Kumar** | `EMPLOYEE` | `mukesh.kumar@adwin.com` | `ADW-103` | Manufacturing & Production | Workers |
| **Sunita Patel** | `EMPLOYEE` | `sunita.patel@adwin.com` | `ADW-104` | Finance & Accounts | Staff |
| **Vikram Chauhan** | `EMPLOYEE` | `vikram.chauhan@adwin.com` | `ADW-105` | Logistics & Supply Chain | Supervisors |
| **Ramesh Yadav** | `EMPLOYEE` | `ramesh.yadav@adwin.com` | `ADW-106` | Operations & Maintenance | Workers |
| **Pooja Gupta** | `EMPLOYEE` | `pooja.gupta@adwin.com` | `ADW-107` | Sales & Digital Marketing | Staff |
| **Dinesh Rawat** | `EMPLOYEE` | `dinesh.rawat@adwin.com` | `ADW-108` | Logistics & Supply Chain | Workers |
| **Kavita Joshi** | `EMPLOYEE` | `kavita.joshi@adwin.com` | `ADW-109` | Quality Control & Assurance | Supervisors |
| **Sanjay Mehra** | `EMPLOYEE` | `sanjay.mehra@adwin.com` | `ADW-110` | Manufacturing & Production | Workers |

---

## 🚀 Running the Application

### Prerequisites
- Node.js 20+ (Node 22 LTS recommended for built-in high-performance SQLite)
- Git

### Installation & Launch
```bash
# Clone the repository
git clone <your-github-repo-url>
cd adwin-social-champions

# Install dependencies
npm install

# Build production client bundle
npm run build

# Start the unified production server (API + Client on port 5000)
npm start
```
Open **`http://localhost:5000`** in any modern web browser.

---

## 🧪 Testing

Run the automated test suites:
```bash
# 1. Run backend unit & integrity tests (12 tests)
npm test

# 2. Run live HTTP server integration tests (9 end-to-end tests)
node server/test-live-http.js
```

---

## 🚢 Production Deployment & GitHub Connection

### Connecting to GitHub
1. Create a new repository on your GitHub account (e.g. `github.com/adwin-energy/social-champions-2026`).
2. Add the remote and push the `main` branch:
   ```bash
   git remote add origin https://github.com/<your-org>/<your-repo>.git
   git branch -M main
   git push -u origin main
   ```

### Hosting Options
- **Vercel / Render / Railway:** Deploy directly from your GitHub repository. The application serves both the Express API and built Vite SPA. Set environment variable `PORT=5000` and `NODE_ENV=production`.
- **Database Migration (Supabase / PostgreSQL):** The schema in `server/db.js` is fully ANSI SQL compliant with tables, foreign keys, and indexes. A Supabase connection string can be supplied in `.env` if cloud-hosted PostgreSQL is preferred over native SQLite.
- **QR Code Setup:** Once the live HTTPS production domain is active (e.g. `https://socialchampions.adwin.com`), point any QR code generator to `https://<your-domain>/login` for factory-floor scan-to-participate rollout.
