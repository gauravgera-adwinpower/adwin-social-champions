import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Shield,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
  Settings,
  Bell,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, logout, demoAccounts, demoLogin } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top micro bar for motto & recognition announcement */}
      <div className="bg-gradient-to-r from-adwin-900 via-blue-900 to-indigo-950 py-1.5 px-4 text-xs font-medium border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              MOTTO
            </span>
            <span className="text-blue-100 tracking-wide font-semibold text-[11px] sm:text-xs">
              “IF ADWIN GROWS, EVERYONE GROWS TOGETHER.”
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300 hidden md:inline">Grand Champions Recognition:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm">
              <Trophy className="w-3 h-3" />
              Gift Hamper + Shield
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Campaign Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-3 text-left group transition-transform active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-wider text-base sm:text-lg text-white">ADWIN</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Champions 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  October – December Social Engagement Hub
                </p>
              </div>
            </button>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-1 ml-6 pl-6 border-l border-slate-800">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Employee Hub
              </button>

              <button
                onClick={() => setCurrentView('leaderboard')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'leaderboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Leaderboard & Winners
              </button>

              {isAdminOrHR && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    currentView === 'admin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  Admin & Verification
                </button>
              )}
            </nav>
          </div>

          {/* User profile & Demo Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
                title="Switch between demo accounts (Gaurav Gera Admin, Praveen HR, Supervisors, Workers, Staff)"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Switch Demo User</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showDemoMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 max-h-96 overflow-y-auto"
                  onClick={() => setShowDemoMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      One-Click Demo Account Switcher
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Test real permissions & role workflows
                    </p>
                  </div>

                  <div className="py-1">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => demoLogin(acc.email)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                          user?.email === acc.email ? 'bg-blue-900/30 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                            {acc.full_name}
                            {acc.role === 'ADMIN' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 font-bold border border-purple-500/30">
                                ADMIN
                              </span>
                            )}
                            {acc.role === 'HR' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-500/30">
                                HR
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {acc.employee_code} • {acc.category_name} ({acc.department_name?.split('&')[0]})
                          </p>
                        </div>
                        {user?.email === acc.email && (
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Pill info */}
            {user && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800 text-right">
                <div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-white">{user.full_name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                      {user.employee_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
                    <span className="text-amber-300 font-medium">{user.category_name}</span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{user.department_name}</span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-blue-400">
                  {user.full_name.charAt(0)}
                </div>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 border-t border-slate-800 bg-slate-900 space-y-2">
          <button
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Employee Hub
          </button>

          <button
            onClick={() => {
              setCurrentView('leaderboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              currentView === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Leaderboard & Winners
          </button>

          {isAdminOrHR && (
            <button
              onClick={() => {
                setCurrentView('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                currentView === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              Admin & Verification
            </button>
          )}

          {user && (
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
              <p className="font-bold text-white">{user.full_name} ({user.employee_code})</p>
              <p>{user.category_name} • {user.department_name}</p>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
