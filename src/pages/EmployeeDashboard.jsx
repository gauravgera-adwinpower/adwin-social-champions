import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ThumbsUp,
  UserPlus,
  Share2,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Lightbulb,
  Camera,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import ChallengeModal from '../components/ChallengeModal';
import MomentModal from '../components/MomentModal';
import IdeaModal from '../components/IdeaModal';

export default function EmployeeDashboard({ onNavigateLeaderboard }) {
  const { user, fetchWithAuth } = useAuth();

  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // { channel, activityType }
  const [isMomentOpen, setIsMomentOpen] = useState(false);
  const [isIdeaOpen, setIsIdeaOpen] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, challengesRes] = await Promise.all([
        fetchWithAuth('/api/dashboard/stats'),
        fetchWithAuth('/api/challenges')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json();
        setChallenges(challengesData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPlatformIcon = (iconKey) => {
    switch (iconKey?.toLowerCase()) {
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5 text-blue-700" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getPlatformBg = (iconKey) => {
    switch (iconKey?.toLowerCase()) {
      case 'facebook':
        return 'from-blue-600 to-blue-700';
      case 'instagram':
        return 'from-purple-600 via-pink-600 to-rose-600';
      case 'linkedin':
        return 'from-blue-700 to-indigo-800';
      case 'youtube':
        return 'from-red-600 to-red-700';
      default:
        return 'from-slate-700 to-slate-900';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Loading your ADWIN challenge panel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Flagged or Disqualified Banner (Disciplinary Alerts) */}
      {user?.disqualified ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500 text-red-900 flex items-start gap-3 shadow-md">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-red-950">
              Disciplinary Notice: Campaign Disqualification
            </h4>
            <p className="text-xs text-red-800 mt-1">
              You have been disqualified from the ADWIN Social Champions 2026 campaign. Reason: "{user.disqualification_reason || 'Repeated false activity claims detected during HR/Admin verification'}".
            </p>
            <p className="text-[11px] text-red-700 mt-1">
              Please contact Gaurav Gera (Admin) or Praveen Singh (HR) for clarification.
            </p>
          </div>
        </div>
      ) : user?.is_flagged ? (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400 text-amber-950 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-amber-950">
              Account Flagged for Review
            </h4>
            <p className="text-xs text-amber-900 mt-1">
              Notice: An activity claim was marked as unverified or misleading ({user.flag_reason || 'Screenshot discrepancy'}). Please ensure only genuine engagement is submitted. Repeated false claims will result in formal campaign disqualification.
            </p>
          </div>
        </div>
      ) : null}

      {/* 2. Top Campaign Spotlight Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-adwin-950 to-blue-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-12 bottom-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                ADWIN Social Champions 2026
              </span>
              <span className="text-xs text-blue-300 font-semibold px-2 py-0.5 rounded-full bg-blue-900/50 border border-blue-700/50">
                Oct – Dec 2026
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              “IF ADWIN GROWS, <br className="hidden sm:inline" />EVERYONE GROWS TOGETHER.”
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Welcome back, <strong className="text-white">{stats?.employee?.full_name}</strong> ({stats?.employee?.employee_code})! You are competing in the <span className="text-amber-300 font-bold">{stats?.employee?.category_name}</span> division within <span className="text-blue-200">{stats?.employee?.department_name}</span>.
            </p>

            {/* Recognition Showcase Banner */}
            <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-amber-400/30 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-amber-300 uppercase tracking-wider text-[10px]">
                  Quarterly & Monthly Grand Recognition:
                </p>
                <p className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>Gift Hamper + Shield</span>
                  <span className="text-amber-400 text-xs font-normal">(Top Performers in Supervisors, Workers & Staff)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => {
                const el = document.getElementById('challenges-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Take Today's / This Week's Challenge
            </button>

            <button
              onClick={() => setIsMomentOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-purple-400" />
              Capture Innovative Moment
            </button>

            <button
              onClick={() => setIsIdeaOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 transition-all flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Share Your Idea (+Bonus Pts)
            </button>
          </div>
        </div>
      </div>

      {/* 3. Performance & Rank KPI Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Weekly Verified Points */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Points</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.points?.weekly}</span>
            <span className="text-xs font-semibold text-slate-400">Week {stats?.points?.currentWeek}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Verified this week</p>
        </div>

        {/* Monthly Verified Points */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Points</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.points?.monthly}</span>
            <span className="text-xs font-semibold text-slate-400">October 2026</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Aggregated monthly</p>
        </div>

        {/* Quarterly Verified Points */}
        <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Quarterly Total</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Trophy className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.points?.quarterly}</span>
            <span className="text-xs font-semibold text-amber-600">Q4 Grand</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Grand Finale Total</p>
        </div>

        {/* Current Rank & Division */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Rank</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-700">#{stats?.rank?.overall}</span>
            <span className="text-xs font-semibold text-slate-400">/ {stats?.rank?.totalParticipants}</span>
          </div>
          <p className="mt-1 text-[11px] text-purple-900 font-medium">
            Category Rank: <strong>#{stats?.rank?.categoryRank}</strong> ({stats?.rank?.categoryName})
          </p>
        </div>

        {/* Pending Verification */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.pending?.count}</span>
            <span className="text-xs font-semibold text-amber-600">({stats?.pending?.points} pts)</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Under HR/Admin review</p>
        </div>
      </div>

      {/* 4. Progress Toward Next Rank Card */}
      {stats?.rank?.overall > 1 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Progress Toward Rank #{stats.rank.overall - 1}
              </h4>
            </div>
            <p className="text-xs text-slate-600">
              You need just <strong className="text-blue-600">{stats.rank.pointsToNextRank} more verified points</strong> to surpass the next competitor and climb the leaderboard!
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-64">
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(15, 100 - (stats.rank.pointsToNextRank * 5)))}%`
                }}
              ></div>
            </div>
            <button
              onClick={onNavigateLeaderboard}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap flex items-center gap-1"
            >
              View Board <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Prominent Challenges Grid */}
      <div id="challenges-grid" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Official ADWIN Social Channels (Challenge Matrix)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Engage with old and new ADWIN posts. Each completed set of Like + Follow + Share + Comment = <strong>20 base points</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>All 4 Channels Configurable by Admin</span>
          </div>
        </div>

        {/* The 4 ADWIN Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {challenges?.officialChannels?.map((ch) => (
            <div
              key={ch.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Card top banner */}
              <div className={`p-4 bg-gradient-to-r ${getPlatformBg(ch.icon_key)} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                    {getPlatformIcon(ch.icon_key)}
                  </div>
                  <a
                    href={ch.channel_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white text-[11px] font-semibold flex items-center gap-1"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h4 className="mt-3 font-extrabold text-base text-white">{ch.name}</h4>
                <p className="text-xs text-white/80 font-mono">{ch.handle}</p>
              </div>

              {/* Activity actions */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {ch.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Available Activities (+5 pts each):
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {challenges?.activityTypes?.map((act) => (
                      <button
                        key={act.id}
                        onClick={() => setActiveModal({ channel: ch, activityType: act })}
                        className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-colors flex items-center gap-1.5 group/btn"
                      >
                        <span className="p-1 rounded-lg bg-slate-100 text-slate-600 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-colors">
                          {act.code === 'LIKE' && <ThumbsUp className="w-3 h-3" />}
                          {act.code === 'FOLLOW' && <UserPlus className="w-3 h-3" />}
                          {act.code === 'SHARE' && <Share2 className="w-3 h-3" />}
                          {act.code === 'COMMENT' && <MessageSquare className="w-3 h-3" />}
                        </span>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 leading-tight">{act.name}</p>
                          <p className="text-[9px] text-blue-600 font-extrabold">+{act.default_points} pts</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card footer CTA */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => setActiveModal({ channel: ch, activityType: challenges?.activityTypes?.[0] })}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Submit Proof for {ch.name.split(' ')[1] || ch.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 6. Leadership Channels: Rishabh Gupta Executive Channels */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Leadership Channels (Rishabh Gupta)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Separate configurable challenge sources to amplify ADWIN executive thought leadership and green transition insights.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Executive Engagement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {challenges?.leadershipChannels?.map((ch) => (
              <div
                key={ch.id}
                className="bg-white rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                        {getPlatformIcon(ch.icon_key)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{ch.name}</h4>
                        <p className="text-xs text-indigo-600 font-mono">{ch.handle}</p>
                      </div>
                    </div>
                    <a
                      href={ch.channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Profile <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Quality comments on leadership posts count heavily in tie-breaker review!</span>
                  </div>

                  <button
                    onClick={() => setActiveModal({ channel: ch, activityType: challenges?.activityTypes?.[3] || challenges?.activityTypes?.[0] })}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Submit Leadership Activity</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Recent Submissions Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Your Activity & Verification Status</h3>
            <p className="text-xs text-slate-500">
              Only verified/approved submissions count toward your score and leaderboard standing.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {stats?.recentActivity?.length || 0} Submissions Recorded
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {stats?.recentActivity?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No activities submitted yet. Click "Take Today's Challenge" to earn your first points!
            </div>
          ) : (
            stats?.recentActivity?.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.channel_name}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-xs text-blue-600">{item.activity_name}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400 font-mono">{item.created_at}</span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium truncate max-w-xl">
                    Reference: {item.content_ref}
                  </p>

                  {item.comment_text && (
                    <p className="text-xs italic text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      "{item.comment_text}"
                    </p>
                  )}

                  {item.review_notes && (
                    <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Reviewer Note: {item.review_notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-slate-900">
                      {item.status === 'APPROVED' ? `+${item.awarded_points} pts` : `Claimed: ${item.claimed_points} pts`}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {item.status === 'APPROVED' ? 'Added to Total' : 'Pending Review'}
                    </p>
                  </div>

                  {item.status === 'APPROVED' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Approved
                    </span>
                  )}
                  {item.status === 'PENDING' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Pending
                    </span>
                  )}
                  {item.status === 'REJECTED' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                      Rejected
                    </span>
                  )}
                  {item.status === 'CORRECTION_REQUIRED' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Correction Needed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Challenge Evidence Modal */}
      {activeModal && (
        <ChallengeModal
          isOpen={Boolean(activeModal)}
          onClose={() => setActiveModal(null)}
          channel={activeModal.channel}
          activityType={activeModal.activityType}
          onSuccess={loadData}
        />
      )}

      {/* Moment Modal */}
      {isMomentOpen && (
        <MomentModal
          isOpen={isMomentOpen}
          onClose={() => setIsMomentOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* Idea Modal */}
      {isIdeaOpen && (
        <IdeaModal
          isOpen={isIdeaOpen}
          onClose={() => setIsIdeaOpen(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
