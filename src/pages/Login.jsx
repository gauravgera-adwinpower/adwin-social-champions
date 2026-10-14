import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Trophy,
  Sparkles,
  Lock,
  Mail,
  User,
  Hash,
  Briefcase,
  Layers,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function Login() {
  const { login, register, demoAccounts, demoLogin } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [meta, setMeta] = useState({ departments: [], categories: [] });

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [password, setPassword] = useState('');

  const [useDetailedLogin, setUseDetailedLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/auth/meta');
        if (res.ok) {
          const data = await res.json();
          setMeta(data);
          if (data.departments.length > 0) setDepartmentId(String(data.departments[0].id));
          if (data.categories.length > 0) setCategoryId(String(data.categories[0].id));
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    }
    loadMeta();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const payload = {
          email: email.trim(),
          password
        };
        if (useDetailedLogin) {
          payload.full_name = fullName.trim();
          payload.employee_code = employeeCode.trim();
          payload.department_id = departmentId;
          payload.category_id = categoryId;
        }

        await login(payload);
      } else {
        // Register mode with all 6 required fields
        if (!fullName || !email || !employeeCode || !departmentId || !categoryId || !password) {
          throw new Error('All 6 fields are mandatory for ADWIN employee registration.');
        }

        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          employee_code: employeeCode.trim(),
          department_id: Number(departmentId),
          category_id: Number(categoryId),
          password
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDemo = async (demoEmail) => {
    setError('');
    setSubmitting(true);
    try {
      await demoLogin(demoEmail);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Brand Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/30 border border-blue-400/40 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          ADWIN Social Champions 2026
        </h1>

        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>IF ADWIN GROWS, EVERYONE GROWS TOGETHER.</span>
        </div>

        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          October – December 2026 Employee Social Media Engagement Program
        </p>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-amber-300 font-bold">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Top Champions Recognition: Gift Hamper + Shield</span>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Employee Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              New Employee Register
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-900/30 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show Full 6-Fields if Register OR Detailed Login requested */}
            {(mode === 'register' || useDetailedLogin) && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Employee Code *
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={employeeCode}
                        onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                        placeholder="e.g. ADW-101"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Employee Category *
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {meta.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {meta.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Official Office Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@adwin.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDetailedLogin}
                    onChange={(e) => setUseDetailedLogin(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Verify with 6 parameters (Name, Code, Dept, Cat)</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Challenge Hub' : 'Register & Join Campaign'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Quick One-Click Demo Logins
              </span>
              <span className="text-[10px] text-slate-500">Default pwd: password123</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Primary Admin */}
              <button
                type="button"
                onClick={() => handleSelectDemo('gaurav.gera@adwin.com')}
                className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-purple-200">Gaurav Gera</p>
                  <p className="text-[10px] text-purple-300">Admin • Program Lead</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300">
                  ADMIN
                </span>
              </button>

              {/* HR Verifier */}
              <button
                type="button"
                onClick={() => handleSelectDemo('praveen.singh@adwin.com')}
                className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-emerald-200">Praveen Singh</p>
                  <p className="text-[10px] text-emerald-300">HR • Verification Lead</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                  HR
                </span>
              </button>

              {/* Supervisor */}
              <button
                type="button"
                onClick={() => handleSelectDemo('rajesh.sharma@adwin.com')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-200">Rajesh Sharma</p>
                  <p className="text-[10px] text-slate-400">Supervisor • Manufacturing</p>
                </div>
                <span className="text-[10px] font-mono text-amber-400">ADW-101</span>
              </button>

              {/* Worker */}
              <button
                type="button"
                onClick={() => handleSelectDemo('mukesh.kumar@adwin.com')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-200">Mukesh Kumar</p>
                  <p className="text-[10px] text-slate-400">Worker • CNC Operator</p>
                </div>
                <span className="text-[10px] font-mono text-blue-400">ADW-103</span>
              </button>

              {/* Staff */}
              <button
                type="button"
                onClick={() => handleSelectDemo('anita.verma@adwin.com')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-200">Anita Verma</p>
                  <p className="text-[10px] text-slate-400">Staff • Quality Control</p>
                </div>
                <span className="text-[10px] font-mono text-blue-400">ADW-102</span>
              </button>

              {/* Moments Lead */}
              <button
                type="button"
                onClick={() => handleSelectDemo('hardeep.singh@adwin.com')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-200">Hardeep Singh</p>
                  <p className="text-[10px] text-slate-400">Moments & Content Capture</p>
                </div>
                <span className="text-[10px] font-mono text-blue-400">ADW-003</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
