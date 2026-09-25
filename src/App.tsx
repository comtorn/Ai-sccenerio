import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth } from './services/auth';
import { ConnectedSheet, LessonPlanWeek, Scenario } from './types';
import { INITIAL_LESSON_PLANS, INITIAL_SCENARIOS } from './data/curriculumData';
import { Header } from './components/Header';
import { SheetManagerModal } from './components/SheetManagerModal';
import { ScenarioGenerator } from './components/ScenarioGenerator';
import { StudentCourtRoleplay } from './components/StudentCourtRoleplay';
import { LessonPlanEditor } from './components/LessonPlanEditor';
import { LawLibrary } from './components/LawLibrary';
import { FileSpreadsheet, Sparkles, Gavel, Calendar, BookOpen, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generator' | 'court' | 'curriculum' | 'laws'>('generator');
  const [isSheetManagerOpen, setIsSheetManagerOpen] = useState(false);

  // Lesson Plans & Scenarios State
  const [lessonPlans, setLessonPlans] = useState<LessonPlanWeek[]>(() => {
    const saved = localStorage.getItem('labor_law_lesson_plans');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved lesson plans', e);
      }
    }
    return INITIAL_LESSON_PLANS;
  });

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const saved = localStorage.getItem('labor_law_scenarios');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved scenarios', e);
      }
    }
    return INITIAL_SCENARIOS;
  });

  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(() => {
    return scenarios.length > 0 ? scenarios[0] : null;
  });

  // Connected Google Sheet
  const [connectedSheet, setConnectedSheet] = useState<ConnectedSheet | null>(() => {
    const saved = localStorage.getItem('labor_law_connected_sheet');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('labor_law_lesson_plans', JSON.stringify(lessonPlans));
  }, [lessonPlans]);

  useEffect(() => {
    localStorage.setItem('labor_law_scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  useEffect(() => {
    if (connectedSheet) {
      localStorage.setItem('labor_law_connected_sheet', JSON.stringify(connectedSheet));
    } else {
      localStorage.removeItem('labor_law_connected_sheet');
    }
  }, [connectedSheet]);

  // Init Google Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        // Not signed in or token cleared
      }
    );
    return () => unsubscribe();
  }, []);

  const handleNavigateToCourt = (sc: Scenario) => {
    setCurrentScenario(sc);
    setActiveTab('court');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif]">
      {/* Header with Navigation and Sheet Integration */}
      <Header
        user={user}
        setUser={setUser}
        token={token}
        setToken={setToken}
        connectedSheet={connectedSheet}
        onOpenSheetManager={() => setIsSheetManagerOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Sheet Integration Banner for Unconnected State */}
      {!connectedSheet && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-2 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>
                <strong>เชื่อมต่อ Google Sheet:</strong> ซิงค์แผนการสอน 18 สัปดาห์ และส่งออกสถานการณ์ข้อพิพาทลงชีตใน Google Drive ได้โดยตรง
              </span>
            </div>
            <button
              onClick={() => setIsSheetManagerOpen(true)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors shrink-0 text-[11px]"
            >
              เชื่อมต่อหรือสร้างชีตทันที
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'generator' && (
          <ScenarioGenerator
            scenarios={scenarios}
            setScenarios={setScenarios}
            currentScenario={currentScenario}
            setCurrentScenario={setCurrentScenario}
            connectedSheet={connectedSheet}
            token={token}
            onNavigateToCourt={handleNavigateToCourt}
            lessonPlans={lessonPlans}
          />
        )}

        {activeTab === 'court' && (
          <StudentCourtRoleplay
            scenarios={scenarios}
            currentScenario={currentScenario}
            onSelectScenario={setCurrentScenario}
          />
        )}

        {activeTab === 'curriculum' && (
          <LessonPlanEditor
            lessonPlans={lessonPlans}
            setLessonPlans={setLessonPlans}
            connectedSheet={connectedSheet}
            token={token}
          />
        )}

        {activeTab === 'laws' && <LawLibrary />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium text-slate-700">
            รายวิชากฎหมายแรงงาน รหัสวิชา 20001-1004 • ระดับประกาศนียบัตรวิชาชีพ (ปวช. 1)
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) กระทรวงศึกษาธิการ • พ.ร.บ. คุ้มครองแรงงาน พ.ศ. 2541 และที่แก้ไขเพิ่มเติม
          </p>
        </div>
      </footer>

      {/* Google Sheets Modal */}
      <SheetManagerModal
        isOpen={isSheetManagerOpen}
        onClose={() => setIsSheetManagerOpen(false)}
        token={token}
        user={user}
        connectedSheet={connectedSheet}
        setConnectedSheet={setConnectedSheet}
        lessonPlans={lessonPlans}
        setLessonPlans={setLessonPlans}
        scenarios={scenarios}
        setScenarios={setScenarios}
      />
    </div>
  );
}
