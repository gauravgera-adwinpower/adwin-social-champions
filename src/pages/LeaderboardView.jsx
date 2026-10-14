import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Scale,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Search,
  Users,
  Flame,
  Shield,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import TieBreakerModal from '../components/TieBreakerModal';

export default function LeaderboardView() {
  const { user, fetchWithAuth } = useAuth();

  const [timeframe, setTimeframe] = useState('overall'); // 'weekly', 'monthly', 'quarterly', 'overall'
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL', 'Supervisors', 'Workers', 'Staff'
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [search, setSearch] = useState('');

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [declaredWinner, setDeclaredWinner] = useState(null);
  const [hasTie, setHasTie] = useState(false);
  const [tieInfo, setTieInfo] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tie-breaker modal
  const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';

  const loadData = async () => {
    setLoading(true);
    try {
      let url = `/api/leaderboard?timeframe=${timeframe}`;
      if (activeCategory !== 'ALL') url += `&category=${encodeURIComponent(activeCategory)}`;
      if (selectedDept !== 'ALL') url += `&department_id=${selectedDept}`;
      if (selectedChannel !== 'ALL') url += `&channel_id=${selectedChannel}`;

      const [lbRes, metaRes, chanRes] = await Promise.all([
        fetchWithAuth(url),
        fetchWithAuth('/api/auth/meta'),
        fetchWithAuth('/api/challenges')
      ]);

      if (lbRes.ok) {
        const data = await lbRes.json();
        setLeaderboardData(data.leaderboard || []);
        setCategoryStats(data.categoryStats || []);
        setDeclaredWinner(data.declaredWinner || null);
        setHasTie(Boolean(data.hasTie));
        setTieInfo(data.tieInfo || null);
      }
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setDepartments(metaData.departments || []);
      }
      if (chanRes.ok) {
        const chanData = await chanRes.json();
        setChannels(chanData.channels || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeframe, activeCategory, selectedDept, selectedChannel]);

  const filteredRoster = leaderboardData.filter((entry) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      entry.full_name?.toLowerCase().includes(term) ||
      entry.employee_code?.toLowerCase().includes(term) ||
      entry.department_name?.toLowerCase().includes(term)
    );
  });

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md ring-2 ring-amber-300">
            <Crown className="w-4 h-4 fill-slate-950" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-900 flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-slate-200">
            2
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-amber-800 text-amber-100 flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-amber-600">
            3
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
            {rank}
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header & Campaign Recognition Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Campaign Leaderboard & Champions
              </h1>
              <p className="text-xs text-slate-500">
                Real-time verified standings for ADWIN Social Champions 2026. Only approved points count.
              </p>
            </div>
          </div>
        </div>

        {/* Grand Recognition Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg border border-amber-400/30">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Champions Prize Package
            </p>
            <p className="text-sm font-extrabold text-white">
              Gift Hamper + Shield
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tie-Breaker Alert Banner (if tie detected) */}
      {hasTie && (
        <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-950 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                  Manual Review Required
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-amber-950">
                  Top Score Tie Detected
                </h4>
              </div>
              <p className="text-xs text-amber-900 mt-1 max-w-2xl leading-relaxed">
                Two or more participants share the highest verified points ({tieInfo?.tiedCandidates?.[0]?.total_verified_points} pts). As per campaign rules, a manual quality review of comment relevance, depth, and genuine contribution will determine the official winner.
              </p>
            </div>
          </div>

          {isAdminOrHR && (
            <button
              onClick={() => setIsTieBreakerOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-slate-950 shadow-md flex items-center justify-center gap-2 shrink-0 transition-all"
            >
              <Scale className="w-4 h-4" />
              Perform Quality Review & Resolve
            </button>
          )}
        </div>
      )}

      {/* 3. Declared Winner Card (if any winner declared for this period) */}
      {declaredWinner && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-xl border border-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-lg shrink-0">
              <Crown className="w-8 h-8 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950 text-white uppercase tracking-wider">
                  Official Winner • {declaredWinner.period_name}
                </span>
                {declaredWinner.is_tie_breaker === 1 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/30 text-slate-950">
                    Won via Quality Review
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                {declaredWinner.winner_name} ({declaredWinner.employee_code})
              </h3>
              <p className="text-xs font-semibold text-slate-900">
                {declaredWinner.category_name} • {declaredWinner.department_name} • {declaredWinner.verified_points} Verified Points
              </p>
              {declaredWinner.tie_breaker_reason && (
                <p className="text-xs text-slate-950/90 mt-1 italic font-medium bg-white/20 p-2 rounded-xl">
                  Evaluation Note: "{declaredWinner.tie_breaker_reason}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/90 text-white p-4 rounded-2xl shrink-0 border border-amber-400/40">
            <Trophy className="w-8 h-8 text-amber-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-400">Award Package</p>
              <p className="text-sm font-extrabold">{declaredWinner.recognition_title}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Timeframe Views & Division Selector Tabs */}
      <div className="space-y-4">
        {/* Timeframe selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-xl bg-slate-200/80 p-1 border border-slate-300">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                timeframe === 'weekly' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                timeframe === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => setTimeframe('quarterly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                timeframe === 'quarterly' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quarterly Grand Finale (Oct-Dec)
            </button>
            <button
              onClick={() => setTimeframe('overall')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                timeframe === 'overall' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overall Campaign
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Employee Category Tabs (Supervisors, Workers, Staff) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Division:
          </span>
          {['ALL', 'Supervisors', 'Workers', 'Staff'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Participants (~200)' : cat}
            </button>
          ))}
        </div>

        {/* Dropdown Filters: Department & Platform */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Social Channel
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Platforms & Leadership Channels</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name} ({ch.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Main Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Verified Rankings ({filteredRoster.length} Employees)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Calculated strictly from HR/Admin approved claims
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Rank</th>
                <th className="py-3 px-4 font-bold">Employee</th>
                <th className="py-3 px-4 font-bold">Department</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold text-center">Approved Activities</th>
                <th className="py-3 px-4 font-bold text-center">Quality Comments</th>
                <th className="py-3 px-4 font-bold text-right">Verified Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading verified standings...
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No verified scores found for this filter combination.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((entry) => {
                  const isCurrentUser = entry.employee_id === user?.id;
                  return (
                    <tr
                      key={entry.employee_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrentUser ? 'bg-blue-50/70 font-semibold' : ''
                      } ${entry.is_tied ? 'bg-amber-50/40' : ''}`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRankBadge(entry.rank)}
                          {entry.is_tied && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-400 text-slate-950 uppercase">
                              TIED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Employee Name & Code */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            {entry.full_name}
                            {isCurrentUser && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-blue-600 text-white rounded font-bold">
                                YOU
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {entry.employee_code}
                          </p>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {entry.department_name}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.category_name === 'Supervisors'
                            ? 'bg-amber-100 text-amber-800'
                            : entry.category_name === 'Workers'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {entry.category_name}
                        </span>
                      </td>

                      {/* Approved Activities */}
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {entry.approved_activities_count}
                      </td>

                      {/* Quality Comments */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          {entry.quality_comments_count}
                        </span>
                      </td>

                      {/* Verified Points */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-black text-slate-900">
                          {entry.total_verified_points}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 font-semibold">pts</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tie Breaker Modal */}
      {isTieBreakerOpen && tieInfo && (
        <TieBreakerModal
          isOpen={isTieBreakerOpen}
          onClose={() => setIsTieBreakerOpen(false)}
          tiedCandidates={tieInfo.tiedCandidates}
          timeframe={timeframe}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
