import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Briefcase,
  Layers,
  Share2,
  Calendar,
  Sliders,
  Trophy,
  Award,
  Lightbulb,
  MessageCircle,
  FileBarChart,
  ShieldAlert,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Download,
  ExternalLink,
  ThumbsUp,
  Clock,
  Sparkles,
  Info,
  Scale
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, fetchWithAuth } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard'); // 14 tabs
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Submissions Verification State
  const [submissions, setSubmissions] = useState([]);
  const [subCounts, setSubCounts] = useState(null);
  const [subFilterStatus, setSubFilterStatus] = useState('PENDING');
  const [subSearch, setSubSearch] = useState('');

  // Selected Submission Review Modal
  const [reviewModalSub, setReviewModalSub] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [awardedPtsInput, setAwardedPtsInput] = useState('');
  const [flagEmployee, setFlagEmployee] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Disqualification Modal
  const [disqModalEmp, setDisqModalEmp] = useState(null);
  const [disqReason, setDisqReason] = useState('');

  // Point Correction Modal
  const [correctModalSub, setCorrectModalSub] = useState(null);
  const [correctNewPts, setCorrectNewPts] = useState('');
  const [correctReason, setCorrectReason] = useState('');

  // Employees Roster
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState('');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    full_name: '', email: '', employee_code: '', department_id: 1, category_id: 3, role: 'EMPLOYEE', campaign_role: ''
  });

  // Social Channels
  const [channels, setChannels] = useState([]);
  const [editingChannel, setEditingChannel] = useState(null);

  // Point Settings
  const [points, setPoints] = useState([]);
  const [editingPoint, setEditingPoint] = useState(null);
  const [pointAuditReason, setPointAuditReason] = useState('');

  // Winners Management
  const [winners, setWinners] = useState([]);
  const [winnerPeriodType, setWinnerPeriodType] = useState('WEEKLY');
  const [winnerPeriodName, setWinnerPeriodName] = useState('Week 41 (Oct 5-11)');
  const [winnerEmpId, setWinnerEmpId] = useState('');
  const [winnerTitle, setWinnerTitle] = useState('Gift Hamper + Shield');

  // Ideas & Moments
  const [moments, setMoments] = useState([]);
  const [ideas, setIdeas] = useState([]);

  // WhatsApp Updates
  const [whatsappUpdates, setWhatsappUpdates] = useState([]);
  const [waTitle, setWaTitle] = useState('');
  const [waBody, setWaBody] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Metadata
  const [meta, setMeta] = useState({ departments: [], categories: [] });

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [kpiRes, metaRes] = await Promise.all([
        fetchWithAuth('/api/admin/kpis'),
        fetchWithAuth('/api/auth/meta')
      ]);

      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        setKpis(kpiData);
      }
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMeta(metaData);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Lazy load tab data
  useEffect(() => {
    if (activeTab === 'verification') loadVerificationQueue();
    if (activeTab === 'employees') loadEmployees();
    if (activeTab === 'channels') loadChannels();
    if (activeTab === 'points') loadPoints();
    if (activeTab === 'winners') loadWinners();
    if (activeTab === 'innovations') loadInnovations();
    if (activeTab === 'whatsapp') loadWhatsApp();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab, subFilterStatus]);

  const loadVerificationQueue = async () => {
    try {
      const res = await fetchWithAuth(`/api/verification/queue?status=${subFilterStatus}&search=${subSearch}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setSubCounts(data.counts || null);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadChannels = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  };

  const loadPoints = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/points');
      if (res.ok) {
        const data = await res.json();
        setPoints(data.activityTypes || []);
      }
    } catch (err) {
      console.error('Failed to load points:', err);
    }
  };

  const loadWinners = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/winners');
      if (res.ok) {
        const data = await res.json();
        setWinners(data.winners || []);
      }
    } catch (err) {
      console.error('Failed to load winners:', err);
    }
  };

  const loadInnovations = async () => {
    try {
      const [mRes, iRes] = await Promise.all([
        fetchWithAuth('/api/innovations/moments?status=ALL'),
        fetchWithAuth('/api/innovations/ideas?status=ALL')
      ]);
      if (mRes.ok) {
        const mData = await mRes.json();
        setMoments(mData.moments || []);
      }
      if (iRes.ok) {
        const iData = await iRes.json();
        setIdeas(iData.ideas || []);
      }
    } catch (err) {
      console.error('Failed to load innovations:', err);
    }
  };

  const loadWhatsApp = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/whatsapp');
      if (res.ok) {
        const data = await res.json();
        setWhatsappUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetchWithAuth(`/api/audit?search=${auditSearch}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  // Submit Review Action
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModalSub) return;
    setReviewing(true);

    try {
      const res = await fetchWithAuth(`/api/verification/${reviewModalSub.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes,
          awarded_points: reviewAction === 'APPROVE' ? (awardedPtsInput !== '' ? Number(awardedPtsInput) : reviewModalSub.claimed_points) : 0,
          flag_employee: flagEmployee,
          flag_reason: flagReason || reviewNotes
        })
      });

      if (res.ok) {
        setReviewModalSub(null);
        setReviewNotes('');
        setFlagEmployee(false);
        setFlagReason('');
        loadVerificationQueue();
        loadInitialData();
      }
    } catch (err) {
      console.error('Failed to review:', err);
    } finally {
      setReviewing(false);
    }
  };

  // Disqualification Action
  const handleDisqualifySubmit = async (e) => {
    e.preventDefault();
    if (!disqModalEmp || !disqReason.trim()) return;

    try {
      const res = await fetchWithAuth('/api/verification/disqualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: disqModalEmp.id,
          reason: disqReason.trim()
        })
      });

      if (res.ok) {
        setDisqModalEmp(null);
        setDisqReason('');
        loadEmployees();
        loadInitialData();
      }
    } catch (err) {
      console.error('Failed to disqualify:', err);
    }
  };

  // Reinstate Employee Action
  const handleReinstate = async (empId) => {
    if (!confirm('Are you sure you want to reinstate this employee?')) return;
    try {
      const res = await fetchWithAuth('/api/verification/reinstate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: empId,
          note: 'Reinstated by Admin after review.'
        })
      });
      if (res.ok) {
        loadEmployees();
        loadInitialData();
      }
    } catch (err) {
      console.error('Failed to reinstate:', err);
    }
  };

  // Point Correction Action
  const handleCorrectPointsSubmit = async (e) => {
    e.preventDefault();
    if (!correctModalSub || correctNewPts === '' || !correctReason.trim()) return;

    try {
      const res = await fetchWithAuth('/api/admin/correct-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: correctModalSub.id,
          new_points: Number(correctNewPts),
          audit_reason: correctReason.trim()
        })
      });

      if (res.ok) {
        setCorrectModalSub(null);
        setCorrectNewPts('');
        setCorrectReason('');
        loadVerificationQueue();
        loadInitialData();
      }
    } catch (err) {
      console.error('Failed to correct points:', err);
    }
  };

  // Declare Winner
  const handleDeclareWinner = async (e) => {
    e.preventDefault();
    if (!winnerEmpId) return;

    try {
      const res = await fetchWithAuth('/api/admin/winners/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_type: winnerPeriodType,
          period_name: winnerPeriodName,
          category_name: 'Overall',
          employee_id: Number(winnerEmpId),
          rank_position: 1,
          recognition_title: winnerTitle
        })
      });

      if (res.ok) {
        loadWinners();
        alert('Winner declared and recognition recorded successfully!');
      }
    } catch (err) {
      console.error('Failed to declare winner:', err);
    }
  };

  // Create WhatsApp Broadcast
  const handleCreateWhatsApp = async (e) => {
    e.preventDefault();
    if (!waTitle.trim() || !waBody.trim()) return;

    try {
      const res = await fetchWithAuth('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: waTitle.trim(),
          message_body: waBody.trim(),
          status: 'SENT'
        })
      });

      if (res.ok) {
        setWaTitle('');
        setWaBody('');
        loadWhatsApp();
        alert('WhatsApp update logged & ready for broadcast!');
      }
    } catch (err) {
      console.error('Failed to create WhatsApp update:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-indigo-500 text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Executive Control Panel
            </span>
            <span className="text-xs text-slate-400">
              Primary Administrator: <strong>Gaurav Gera</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Program Management & Verification
          </h2>
          <p className="text-xs text-slate-400">
            Full authority over employee rosters, challenge rules, verification queue, point settings, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/reports/export-csv"
            download
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Export Full CSV Report
          </a>
        </div>
      </div>

      {/* Admin Horizontal Tabs Navigation */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-200">
        {[
          { key: 'dashboard', label: 'Dashboard KPIs', icon: LayoutDashboard },
          { key: 'verification', label: 'Activity Verification', icon: CheckSquare },
          { key: 'employees', label: 'Employees Roster', icon: Users },
          { key: 'channels', label: 'Social Channels', icon: Share2 },
          { key: 'points', label: 'Point Settings', icon: Sliders },
          { key: 'winners', label: 'Winners Management', icon: Trophy },
          { key: 'innovations', label: 'Moments & Ideas', icon: Lightbulb },
          { key: 'whatsapp', label: 'WhatsApp Updates', icon: MessageCircle },
          { key: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
          { key: 'audit', label: 'Audit Logs', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DASHBOARD KPIS */}
      {/* ============================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Employees</span>
              <p className="mt-2 text-2xl font-black text-slate-900">{kpis?.kpis?.totalEmployees}</p>
              <p className="text-[11px] text-slate-500 mt-1">~200 campaign scope</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Participants</span>
              <p className="mt-2 text-2xl font-black text-blue-600">{kpis?.kpis?.activeParticipants}</p>
              <p className="text-[11px] text-slate-500 mt-1">Submitted &ge; 1 activity</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</span>
              <p className="mt-2 text-2xl font-black text-slate-900">{kpis?.kpis?.totalSubmissions}</p>
              <p className="text-[11px] text-slate-500 mt-1">All platforms combined</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Verified Points Awarded</span>
              <p className="mt-2 text-2xl font-black text-amber-700">{kpis?.kpis?.totalVerifiedPoints}</p>
              <p className="text-[11px] text-slate-500 mt-1">Approved activities + bonuses</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="text-xs font-bold uppercase">Approved</span>
              <p className="text-xl font-extrabold mt-1">{kpis?.kpis?.approvedSubmissions}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <span className="text-xs font-bold uppercase">Pending Verification</span>
              <p className="text-xl font-extrabold mt-1">{kpis?.kpis?.pendingSubmissions}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
              <span className="text-xs font-bold uppercase">Rejected Claims</span>
              <p className="text-xl font-extrabold mt-1">{kpis?.kpis?.rejectedSubmissions}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
              <span className="text-xs font-bold uppercase">Disqualified</span>
              <p className="text-xl font-extrabold mt-1">{kpis?.kpis?.disqualifiedCount}</p>
            </div>
          </div>

          {/* Channel Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Channel Engagement Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis?.channelBreakdown?.map((ch) => (
                <div key={ch.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{ch.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {ch.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Submissions: <strong>{ch.total_submissions}</strong></span>
                    <span>Approved: <strong>{ch.approved_submissions}</strong></span>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs font-bold text-slate-900 border-t border-slate-200">
                    <span>Points Awarded:</span>
                    <span className="text-blue-600 font-black">{ch.points_awarded} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ACTIVITY VERIFICATION QUEUE */}
      {/* ============================================================== */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Filter Buttons */}
            <div className="flex rounded-xl bg-slate-200 p-1">
              {['PENDING', 'APPROVED', 'REJECTED', 'CORRECTION_REQUIRED', 'ALL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSubFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    subFilterStatus === st ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadVerificationQueue()}
                placeholder="Search employee, post..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                    <th className="py-3 px-4 font-bold">ID / Date</th>
                    <th className="py-3 px-4 font-bold">Employee</th>
                    <th className="py-3 px-4 font-bold">Platform & Activity</th>
                    <th className="py-3 px-4 font-bold">Post Reference / Comment</th>
                    <th className="py-3 px-4 font-bold text-center">Evidence</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                        No submissions matching filter "{subFilterStatus}".
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-bold text-slate-900">#{sub.id}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{sub.created_at}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {sub.employee_name}
                              {sub.disqualified === 1 && (
                                <span className="px-1 py-0.2 bg-red-600 text-white rounded text-[8px] font-bold">
                                  DISQUALIFIED
                                </span>
                              )}
                              {sub.is_flagged === 1 && (
                                <span className="px-1 py-0.2 bg-amber-500 text-slate-950 rounded text-[8px] font-bold">
                                  FLAGGED
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {sub.employee_code} • {sub.category_name} ({sub.department_code})
                            </p>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-blue-700">{sub.channel_name}</p>
                          <p className="text-[11px] text-slate-600">{sub.activity_name} ({sub.claimed_points} pts)</p>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="truncate text-slate-800 font-medium">{sub.content_ref}</p>
                          {sub.comment_text && (
                            <p className="text-[11px] text-slate-500 italic truncate mt-0.5">
                              "{sub.comment_text}"
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {sub.evidence_path ? (
                            <a
                              href={sub.evidence_path}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-lg"
                            >
                              <Eye className="w-3.5 h-3.5" /> Proof
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">None</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            sub.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            sub.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {sub.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setReviewModalSub(sub);
                                setReviewAction('APPROVE');
                                setAwardedPtsInput(String(sub.claimed_points));
                                setReviewNotes('');
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              title="Review & Verify"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setCorrectModalSub(sub);
                                setCorrectNewPts(String(sub.awarded_points));
                                setCorrectReason('');
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="Correct Points with Audit Reason"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: EMPLOYEES ROSTER */}
      {/* ============================================================== */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-extrabold text-base text-slate-900">
              Employee Roster ({employees.length} Participants)
            </h3>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                    <th className="py-3 px-4 font-bold">Code</th>
                    <th className="py-3 px-4 font-bold">Name & Email</th>
                    <th className="py-3 px-4 font-bold">Department</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Role</th>
                    <th className="py-3 px-4 font-bold text-center">Verified Points</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Disciplinary Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{emp.employee_code}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{emp.full_name}</p>
                        <p className="text-[10px] text-slate-400">{emp.email}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{emp.department_name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{emp.category_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-black text-blue-700">
                        {emp.verified_points} pts
                      </td>
                      <td className="py-3 px-4 text-center">
                        {emp.disqualified === 1 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Disqualified
                          </span>
                        ) : emp.is_flagged === 1 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Flagged
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Good Standing
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {emp.disqualified === 1 ? (
                          <button
                            onClick={() => handleReinstate(emp.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                          >
                            Reinstate
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setDisqModalEmp(emp);
                              setDisqReason('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg"
                          >
                            Disqualify...
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SOCIAL CHANNELS CONFIG */}
      {/* ============================================================== */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">
              Configure Social Channels (Official ADWIN & Leadership)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map((ch) => (
              <div key={ch.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-slate-900">{ch.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {ch.type}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Handle: <strong>{ch.handle}</strong></p>
                  <p>URL: <a href={ch.channel_url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate">{ch.channel_url}</a></p>
                  <p>Description: {ch.description}</p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Status: {ch.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                  <button
                    onClick={() => setEditingChannel(ch)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Channel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: POINT SETTINGS */}
      {/* ============================================================== */}
      {activeTab === 'points' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <p className="font-bold">Point Configuration Rules:</p>
            <p className="mt-1">
              Default activity points: Like = 5 pts, Follow = 5 pts, Share = 5 pts, Comment = 5 pts. Base complete set = 20 pts. Every point value modification must be accompanied by a mandatory audit reason.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {points.map((pt) => (
              <div key={pt.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{pt.code}</span>
                <h4 className="font-extrabold text-base text-slate-900">{pt.name}</h4>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <span className="text-3xl font-black text-blue-600">{pt.default_points}</span>
                  <span className="text-xs font-bold text-blue-800 ml-1">pts</span>
                </div>
                <p className="text-xs text-slate-500">{pt.description}</p>
                <button
                  onClick={() => {
                    const newPts = prompt(`Enter new point value for ${pt.name}:`, pt.default_points);
                    if (newPts && !isNaN(newPts)) {
                      const reason = prompt('Enter mandatory audit reason for changing points:');
                      if (reason && reason.trim()) {
                        fetchWithAuth(`/api/admin/points/${pt.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ default_points: Number(newPts), audit_reason: reason })
                        }).then(() => loadPoints());
                      } else {
                        alert('Audit reason is required to change points.');
                      }
                    }
                  }}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Change Points (Audit Logged)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: WINNERS MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'winners' && (
        <div className="space-y-6">
          {/* Declaration form */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Declare Campaign Winner & Recognition
            </h3>
            <form onSubmit={handleDeclareWinner} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Period Type</label>
                <select
                  value={winnerPeriodType}
                  onChange={(e) => setWinnerPeriodType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="WEEKLY">Weekly Winner</option>
                  <option value="MONTHLY">Monthly Winner</option>
                  <option value="QUARTERLY">Quarterly Champion (Grand Finale)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Period Name</label>
                <input
                  type="text"
                  required
                  value={winnerPeriodName}
                  onChange={(e) => setWinnerPeriodName(e.target.value)}
                  placeholder="e.g. October 2026"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Winner Employee</label>
                <select
                  value={winnerEmpId}
                  onChange={(e) => setWinnerEmpId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_code} - {e.category_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Recognition Package</label>
                <input
                  type="text"
                  required
                  value={winnerTitle}
                  onChange={(e) => setWinnerTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 rounded-xl shadow-md"
                >
                  Declare Winner & Issue "Gift Hamper + Shield"
                </button>
              </div>
            </form>
          </div>

          {/* List of Declared Winners */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b font-extrabold text-sm text-slate-900">
              Declared Winners History
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {winners.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No winners declared yet.</div>
              ) : (
                winners.map((w) => (
                  <div key={w.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-sm text-slate-900">
                        {w.employee_name} ({w.employee_code}) — {w.period_name} ({w.period_type})
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {w.category_name} • {w.department_name} • {w.verified_points} Verified Pts
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      🏆 {w.recognition_title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: MOMENTS & IDEAS REVIEW */}
      {/* ============================================================== */}
      {activeTab === 'innovations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> Employee Ideas Review Pipeline
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {ideas.map((idea) => (
                <div key={idea.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{idea.title}</span>
                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">
                      {idea.category}
                    </span>
                    <p className="text-slate-600 mt-1">{idea.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Submitted by: {idea.employee_name} ({idea.employee_code}) • Status: {idea.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const pts = prompt('Enter bonus points to award:', 20);
                        if (pts) {
                          fetchWithAuth(`/api/innovations/ideas/${idea.id}/review`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'ACCEPTED', bonus_points: Number(pts), review_notes: 'Accepted for implementation' })
                          }).then(() => loadInnovations());
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white"
                    >
                      Accept (+Bonus)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 8: WHATSAPP UPDATES */}
      {/* ============================================================== */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WhatsApp Composer */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" /> WhatsApp Campaign Broadcast Composer
            </h3>
            <form onSubmit={handleCreateWhatsApp} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Broadcast Title</label>
                <input
                  type="text"
                  required
                  value={waTitle}
                  onChange={(e) => setWaTitle(e.target.value)}
                  placeholder="e.g. Mid-Week Challenge Spotlight"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Content (Supports WhatsApp *bold*, _italic_)</label>
                <textarea
                  rows={6}
                  required
                  value={waBody}
                  onChange={(e) => setWaBody(e.target.value)}
                  placeholder="*ADWIN Social Champions 2026 Announcement*..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
                >
                  Save & Log Broadcast
                </button>
              </div>
            </form>
          </div>

          {/* WhatsApp Feed & Live Bubble Preview */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-white">Broadcast Logs & WhatsApp Preview</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {whatsappUpdates.map((wa) => (
                <div key={wa.id} className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                    <span>{wa.title}</span>
                    <span className="font-mono text-slate-400">{wa.created_at}</span>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap text-slate-200 leading-relaxed bg-black/30 p-3 rounded-xl border border-emerald-900/40">
                    {wa.message_body}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(wa.message_body);
                      alert('Copied to clipboard! You can now paste into ADWIN WhatsApp groups.');
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                  >
                    Copy Text to WhatsApp
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 9: AUDIT LOGS */}
      {/* ============================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">
              System Audit Trail (Mandatory Compliance Log)
            </h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs()}
                placeholder="Search audit trail..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                    <th className="py-3 px-4 font-bold">Timestamp</th>
                    <th className="py-3 px-4 font-bold">User</th>
                    <th className="py-3 px-4 font-bold">Action</th>
                    <th className="py-3 px-4 font-bold">Entity</th>
                    <th className="py-3 px-4 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[10px]">
                        {log.created_at}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {log.user_name} ({log.user_role})
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Verify Activity Claim #{reviewModalSub.id}
            </h3>
            <p className="text-xs text-slate-600">
              {reviewModalSub.employee_name} ({reviewModalSub.category_name}) • {reviewModalSub.activity_name} on {reviewModalSub.channel_name}
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Decision Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {['APPROVE', 'REJECT', 'CORRECTION_REQUIRED'].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setReviewAction(act)}
                      className={`py-2 rounded-xl font-bold text-xs ${
                        reviewAction === act ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {reviewAction === 'APPROVE' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Awarded Points</label>
                  <input
                    type="number"
                    value={awardedPtsInput}
                    onChange={(e) => setAwardedPtsInput(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reviewer Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Notes for employee and audit record..."
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              {reviewAction === 'REJECT' && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 space-y-2">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flagEmployee}
                      onChange={(e) => setFlagEmployee(e.target.checked)}
                    />
                    <span>Flag Employee for False/Fraudulent Claim</span>
                  </label>
                  {flagEmployee && (
                    <input
                      type="text"
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder="Reason for disciplinary flag..."
                      className="w-full p-2 rounded-lg border border-red-300 text-xs bg-white text-slate-900"
                    />
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setReviewModalSub(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  {reviewing ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disqualification Modal */}
      {disqModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Disqualify Employee
            </h3>
            <p className="text-xs text-slate-600">
              Apply disciplinary rule to <strong>{disqModalEmp.full_name}</strong> ({disqModalEmp.employee_code}).
            </p>

            <form onSubmit={handleDisqualifySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Formal Disqualification Reason * (Audit Logged)
                </label>
                <textarea
                  rows={3}
                  required
                  value={disqReason}
                  onChange={(e) => setDisqReason(e.target.value)}
                  placeholder="e.g. Repeated fraudulent screenshots submitted despite prior warning."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setDisqModalEmp(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  Confirm Disqualification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Point Correction Modal */}
      {correctModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" /> Correct Points (Audit Logged)
            </h3>
            <p className="text-xs text-slate-600">
              Correct points for submission #{correctModalSub.id} ({correctModalSub.employee_name}).
            </p>

            <form onSubmit={handleCorrectPointsSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Point Value *</label>
                <input
                  type="number"
                  required
                  value={correctNewPts}
                  onChange={(e) => setCorrectNewPts(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory Audit Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  placeholder="Reason for correcting awarded points..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCorrectModalSub(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save Point Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
