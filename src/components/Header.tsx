import React from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../services/auth';
import { ConnectedSheet } from '../types';
import {
  FileSpreadsheet,
  Sparkles,
  LogOut,
  ExternalLink,
  BookOpen,
  Gavel,
  Calendar,
  Layers,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  connectedSheet: ConnectedSheet | null;
  onOpenSheetManager: () => void;
  activeTab: 'generator' | 'court' | 'curriculum' | 'laws';
  setActiveTab: (tab: 'generator' | 'court' | 'curriculum' | 'laws') => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  setUser,
  token,
  setToken,
  connectedSheet,
  onOpenSheetManager,
  activeTab,
  setActiveTab,
  isSyncing,
}) => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      alert('เข้าสู่ระบบไม่สำเร็จ: ' + (err.message || 'โปรดลองใหม่อีกครั้ง'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">LaborLaw AI</span>
                <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                  ปวช. 1 อาชีวศึกษา
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                ระบบสร้างสถานการณ์จำลองข้อพิพาท & แผนการสอน เชื่อมต่อ Google Sheets
              </p>
            </div>
          </div>

          {/* Right Action: Sheet Connection + Auth */}
          <div className="flex items-center gap-3">
            {/* Google Sheet Status Button */}
            <button
              onClick={onOpenSheetManager}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                connectedSheet
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="จัดการการเชื่อมต่อ Google Sheets"
            >
              <FileSpreadsheet className={`w-4 h-4 ${connectedSheet ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="max-w-[140px] sm:max-w-[180px] truncate">
                {connectedSheet ? connectedSheet.title : 'เชื่อมต่อ Google Sheet'}
              </span>
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : connectedSheet ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : null}
            </button>

            {/* Google Authentication */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.displayName}
                  </div>
                  <div className="text-slate-400 text-[10px] truncate max-w-[120px]">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="ออกจากระบบ Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบ Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-100 text-sm">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'generator'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>สร้างสถานการณ์จำลอง (AI Scenario)</span>
          </button>

          <button
            onClick={() => setActiveTab('court')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'court'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Gavel className="w-4 h-4 text-amber-600" />
            <span>ห้องพิจารณาคดีจำลอง (Student Court)</span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'curriculum'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>แผนการสอน 18 สัปดาห์ (Curriculum Map)</span>
          </button>

          <button
            onClick={() => setActiveTab('laws')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'laws'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>คู่มือกฎหมายแรงงาน ปวช.</span>
          </button>
        </div>
      </div>
    </header>
  );
};
