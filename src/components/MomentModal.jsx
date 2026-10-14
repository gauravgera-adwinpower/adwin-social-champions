import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Camera, Sparkles, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

export default function MomentModal({ isOpen, onClose, onSuccess }) {
  const { fetchWithAuth } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setError('Media file size exceeds 15MB.');
        return;
      }
      setMediaFile(file);
      setError('');
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      const res = await fetchWithAuth('/api/innovations/moments', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit moment');

      setSuccessMsg(data.message);
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Capture Innovative Moment</h3>
              <p className="text-xs text-purple-200">Hardeep Singh (Content Lead) Review Queue</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p>
              Capture teamwork, smart tooling, shop-floor breakthroughs, or proud factory moments. Hardeep Singh and the committee can award <strong>15 to 50 bonus points</strong>!
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Moment Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shop-Floor Solar Inverter Testing Rig Innovation"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Operational Impact *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what happened, who was involved, and why this represents ADWIN excellence..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Attach Photo or Clip (Optional, max 15MB)
            </label>
            <div className="mt-1 flex justify-center px-4 py-4 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:border-purple-400">
              {preview ? (
                <img src={preview} alt="Moment Preview" className="max-h-32 rounded-lg border shadow-sm" />
              ) : (
                <label className="cursor-pointer text-xs font-semibold text-purple-600 flex flex-col items-center gap-1">
                  <UploadCloud className="w-6 h-6 text-purple-400" />
                  <span>Choose Photo / Video Clip</span>
                  <input type="file" accept="image/*,video/*" onChange={handleFile} className="sr-only" />
                </label>
              )}
            </div>
          </div>

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
              className="px-5 py-2.5 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-lg shadow-purple-700/30 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Moment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
