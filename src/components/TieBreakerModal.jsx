import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Trophy,
  Scale,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Award,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function TieBreakerModal({ isOpen, onClose, tiedCandidates, timeframe, onSuccess }) {
  const { fetchWithAuth } = useAuth();
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState('');
  const [qualityReason, setQualityReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && tiedCandidates && tiedCandidates.length > 0) {
      loadComments();
      setSelectedWinnerId(String(tiedCandidates[0]?.employee_id || ''));
    }
  }, [isOpen, tiedCandidates]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const ids = tiedCandidates.map((c) => c.employee_id).join(',');
      const res = await fetchWithAuth(`/api/leaderboard/candidate-comments?employee_ids=${ids}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load candidate comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  if (!isOpen || !tiedCandidates || tiedCandidates.length < 2) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedWinnerId) {
      setError('Please select the winning candidate.');
      return;
    }

    if (!qualityReason.trim() || qualityReason.trim().length < 15) {
      setError('A comprehensive quality review reason (evaluating relevance, informational value, and genuine contribution) is mandatory (minimum 15 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/admin/tie-breaker/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_type: timeframe.toUpperCase(),
          period_name: `${timeframe.toUpperCase()} Champions Q4 2026`,
          category_name: 'Overall',
          winner_employee_id: Number(selectedWinnerId),
          quality_reason: qualityReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve tie-breaker');

      setSuccessMsg(data.message);
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-300/40 flex items-center justify-center">
              <Scale className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Manual Quality Review (Tie-Breaker)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Manual Review Required
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Top participants share {tiedCandidates[0]?.total_verified_points} verified points. Review comment quality & authentic contribution.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Official Evaluation Criteria Bar */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
            <p className="font-bold flex items-center gap-1.5 text-amber-900 mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Campaign Tie-Breaker Quality Review Rubric:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-lg border border-amber-200 font-medium">
                1. Relevance of comments
              </div>
              <div className="p-2 bg-white rounded-lg border border-amber-200 font-medium">
                2. Informational value
              </div>
              <div className="p-2 bg-white rounded-lg border border-amber-200 font-medium">
                3. Quality of comments
              </div>
              <div className="p-2 bg-white rounded-lg border border-amber-200 font-medium">
                4. Genuine contribution
              </div>
            </div>
          </div>

          {/* Tied Candidates Comparison Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Declared Winner ({timeframe.toUpperCase()}) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tiedCandidates.map((candidate) => {
                const isSelected = String(candidate.employee_id) === String(selectedWinnerId);
                return (
                  <div
                    key={candidate.employee_id}
                    onClick={() => setSelectedWinnerId(String(candidate.employee_id))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-400/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="winnerSelect"
                          checked={isSelected}
                          onChange={() => setSelectedWinnerId(String(candidate.employee_id))}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-bold text-sm text-slate-900">{candidate.full_name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                        {candidate.employee_code}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                      <p>{candidate.category_name} • {candidate.department_name}</p>
                      <p className="font-bold text-amber-700 text-sm">
                        {candidate.total_verified_points} Verified Points
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {candidate.quality_comments_count} Quality Comments • {candidate.approved_activities_count} Approved Activities
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Comment Review Stream */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Compare Approved Comment Submissions
            </label>
            <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
              {loadingComments ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading candidate comments...</div>
              ) : comments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No comment activities recorded yet for comparison.</div>
              ) : (
                comments.map((cm) => (
                  <div key={cm.id} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">
                        {cm.employee_name} ({cm.employee_code})
                      </span>
                      <span className="text-slate-400">{cm.channel_name}</span>
                    </div>
                    <p className="italic text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      "{cm.comment_text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quality Review Reason (Mandatory Audit Reason) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Recorded Review Reason & Decision Rationale * (Mandatory for Audit Trail)
            </label>
            <textarea
              rows={3}
              required
              value={qualityReason}
              onChange={(e) => setQualityReason(e.target.value)}
              placeholder="e.g. Selected Rajesh Sharma based on higher technical depth and genuine pride reflected in shop-floor manufacturing comments vs Anita's comments."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              This reason is logged in the permanent audit trail and displayed on the Winner Recognition Certificate.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              {submitting ? 'Recording Decision...' : 'Confirm Winner (Gift Hamper + Shield)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
