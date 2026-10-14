import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  ThumbsUp,
  UserPlus,
  Share2,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function ChallengeModal({ isOpen, onClose, channel, activityType, onSuccess }) {
  const { fetchWithAuth } = useAuth();

  const [selectedChannelId, setSelectedChannelId] = useState(channel?.id || '');
  const [selectedActivityId, setSelectedActivityId] = useState(activityType?.id || '');
  const [contentRef, setContentRef] = useState('');
  const [commentText, setCommentText] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isCommentActivity = selectedActivityId === 4 || activityType?.code === 'COMMENT';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit. Please upload a smaller image.');
        return;
      }
      setEvidenceFile(file);
      setError('');

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!contentRef.trim()) {
      setError('Please provide the Post URL or Title reference.');
      return;
    }

    if (isCommentActivity && (!commentText.trim() || commentText.trim().length < 8)) {
      setError('Please provide your authentic comment text (minimum 8 characters). Spam comments are not rewarded.');
      return;
    }

    if (!evidenceFile) {
      setError('Screenshot evidence is required to verify your genuine engagement.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('channel_id', selectedChannelId || channel?.id);
      formData.append('activity_type_id', selectedActivityId || activityType?.id);
      formData.append('content_ref', contentRef.trim());
      if (commentText.trim()) {
        formData.append('comment_text', commentText.trim());
      }
      formData.append('evidence', evidenceFile);

      const res = await fetchWithAuth('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSuccessMsg(data.message);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Record Social Media Engagement</h3>
              <p className="text-xs text-blue-200">
                {channel?.name} • {activityType?.name || 'Social Activity'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Validation / Anti-Fraud Alert</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Target Channel Info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Channel:</span>
              <span className="text-xs font-bold text-slate-900">{channel?.name}</span>
              <span className="text-[11px] font-mono text-blue-600">{channel?.handle}</span>
            </div>
            <a
              href={channel?.channel_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              Open Link <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Activity Type Badge & Points */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-200/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                {activityType?.code === 'LIKE' && <ThumbsUp className="w-4 h-4" />}
                {activityType?.code === 'FOLLOW' && <UserPlus className="w-4 h-4" />}
                {activityType?.code === 'SHARE' && <Share2 className="w-4 h-4" />}
                {activityType?.code === 'COMMENT' && <MessageSquare className="w-4 h-4" />}
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">{activityType?.name}</p>
                <p className="text-[11px] text-slate-500">{activityType?.description}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-sm">
                +{activityType?.default_points || 5} Points
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified on Approval</p>
            </div>
          </div>

          {/* Post / Content Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Post URL or Topic / Title Reference *
            </label>
            <input
              type="text"
              required
              value={contentRef}
              onChange={(e) => setContentRef(e.target.value)}
              placeholder="e.g. https://linkedin.com/posts/... OR 'October Expansion Announcement'"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Applies to both old and new ADWIN posts. Duplicate claims for the same post are blocked automatically.
            </p>
          </div>

          {/* Comment text if applicable */}
          {isCommentActivity && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Comment Text *
                </label>
                <span className="text-[10px] text-slate-400">
                  {commentText.length} chars (min 8)
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your genuine knowledge, proud milestone, or authentic insight. Spam or two-word comments ('nice', 'good') are not rewarded."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                💡 Tie-Breaker Rule: In case of top score ties, comment relevance, depth, and genuine contribution decide the winners of the Gift Hamper + Shield!
              </p>
            </div>
          )}

          {/* Screenshot / Evidence File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Upload Screenshot Evidence * (PNG, JPG, PDF &lt; 5MB)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-blue-400 bg-slate-50/50 transition-colors">
              <div className="space-y-2 text-center">
                {filePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={filePreview}
                      alt="Evidence preview"
                      className="max-h-36 rounded-lg border border-slate-200 shadow-sm mx-auto"
                    />
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">{evidenceFile?.name}</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="flex text-xs text-slate-600 justify-center">
                      <label className="relative cursor-pointer rounded-md font-bold text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Click to select screenshot</span>
                        <input
                          type="file"
                          required
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Show your user handle and active engagement clearly
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Submitting Evidence...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Submit for Verification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
