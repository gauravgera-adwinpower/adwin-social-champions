import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import LeaderboardView from './pages/LeaderboardView';
import AdminDashboard from './pages/AdminDashboard';
import { Shield, Trophy, Users, Heart } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'leaderboard', 'admin'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-wider uppercase text-blue-300">
          ADWIN Social Champions 2026
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="flex-1">
        {currentView === 'dashboard' && (
          <EmployeeDashboard onNavigateLeaderboard={() => setCurrentView('leaderboard')} />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView />
        )}

        {currentView === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Corporate Campaign Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-white mt-16 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-white">ADWIN Social Champions 2026</p>
                <p className="text-xs text-blue-400 font-semibold">“IF ADWIN GROWS, EVERYONE GROWS TOGETHER.”</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-300 font-extrabold bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Grand Recognition Package: Gift Hamper + Shield</span>
            </div>
          </div>

          {/* Campaign Team Attribution */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
            <div>
              <p className="font-bold text-slate-200">Gaurav Gera</p>
              <p className="text-[11px] text-slate-500">Digital Marketing & Program/Admin Lead</p>
            </div>
            <div>
              <p className="font-bold text-slate-200">Praveen Singh</p>
              <p className="text-[11px] text-slate-500">HR & Employee Coordination</p>
            </div>
            <div>
              <p className="font-bold text-slate-200">Hardeep Singh</p>
              <p className="text-[11px] text-slate-500">Content & Moment Capture</p>
            </div>
            <div>
              <p className="font-bold text-slate-200">Jai Shankar Ji</p>
              <p className="text-[11px] text-slate-500">Logistics & Rewards Support</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <p>© 2026 ADWIN. Confidential & Proprietary Internal Employee Engagement System.</p>
            <p>Designed for ~200 Employees across Supervisors, Workers, and Staff.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
