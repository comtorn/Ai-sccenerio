import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ConnectedSheet, LessonPlanWeek, Scenario } from '../types';
import {
  parseSpreadsheetId,
  getSpreadsheetDetails,
  createCurriculumSpreadsheet,
  listUserDriveSpreadsheets,
  readLessonPlansFromSheet,
  syncLessonPlansToSheet,
} from '../services/sheetsService';
import {
  FileSpreadsheet,
  Plus,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  X,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
} from 'lucide-react';

interface SheetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  user: User | null;
  connectedSheet: ConnectedSheet | null;
  setConnectedSheet: (sheet: ConnectedSheet | null) => void;
  lessonPlans: LessonPlanWeek[];
  setLessonPlans: (plans: LessonPlanWeek[]) => void;
  scenarios: Scenario[];
  setScenarios: (scenarios: Scenario[]) => void;
}

export const SheetManagerModal: React.FC<SheetManagerModalProps> = ({
  isOpen,
  onClose,
  token,
  user,
  connectedSheet,
  setConnectedSheet,
  lessonPlans,
  setLessonPlans,
  scenarios,
  setScenarios,
}) => {
  const [sheetInput, setSheetInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; webViewLink?: string }>>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Load drive spreadsheets when opened
  useEffect(() => {
    if (isOpen && token) {
      loadDriveFiles();
    }
  }, [isOpen, token]);

  const loadDriveFiles = async () => {
    if (!token) return;
    setLoadingDrive(true);
    try {
      const files = await listUserDriveSpreadsheets(token);
      setDriveFiles(files);
    } catch (e) {
      console.warn('Could not list drive spreadsheets', e);
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleConnectSheet = async (targetIdOrUrl: string) => {
    if (!token) {
      setError('กรุณาเข้าสู่ระบบ Google เพื่อเชื่อมต่อ Google Sheets');
      return;
    }
    const cleanId = parseSpreadsheetId(targetIdOrUrl);
    if (!cleanId) {
      setError('กรุณากรอก Google Sheet URL หรือ ID ที่ถูกต้อง');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const details = await getSpreadsheetDetails(token, cleanId);
      const newSheetInfo: ConnectedSheet = {
        id: details.id,
        title: details.title || 'Google Sheet กฎหมายแรงงาน',
        url: details.url || `https://docs.google.com/spreadsheets/d/${details.id}/edit`,
        tabs: details.tabs,
        lastSyncedAt: new Date().toLocaleTimeString('th-TH'),
      };
      setConnectedSheet(newSheetInfo);

      // Try reading lesson plans if available
      try {
        const matchingTab = details.tabs.find((t: string) => t.includes('แผน') || t.includes('Lesson') || t.includes('Sheet1'));
        if (matchingTab) {
          const importedPlans = await readLessonPlansFromSheet(token, cleanId, matchingTab);
          if (importedPlans && importedPlans.length > 0) {
            setLessonPlans(importedPlans);
            setSuccessMsg(`เชื่อมต่อชีต "${details.title}" สำเร็จ และโหลดแผนการสอน ${importedPlans.length} สัปดาห์เรียบร้อย`);
          } else {
            setSuccessMsg(`เชื่อมต่อชีต "${details.title}" สำเร็จเรียบร้อย`);
          }
        } else {
          setSuccessMsg(`เชื่อมต่อชีต "${details.title}" สำเร็จเรียบร้อย`);
        }
      } catch (readErr) {
        console.warn('Could not read existing rows:', readErr);
        setSuccessMsg(`เชื่อมต่อชีต "${details.title}" เรียบร้อย`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ไม่สามารถเข้าถึงชีตได้ โปรดตรวจสอบสิทธิ์การแชร์หรือ URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!token) {
      setError('กรุณาเข้าสู่ระบบ Google ก่อนสร้างชีตใน Drive');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'สร้าง Google Spreadsheet ใหม่ใน Google Drive ของคุณ?',
      description: `ระบบจะสร้างไฟล์ Google Sheet ใหม่ชื่อ "แผนการสอนและคลังข้อพิพาทกฎหมายแรงงาน_ปวช1" ใน Google Drive ของคุณ พร้อมบรรจุ 3 ชีตย่อย:\n1. แผนการจัดการเรียนรู้ 18 สัปดาห์ (${lessonPlans.length} รายการ)\n2. คลังสถานการณ์ข้อพิพาท (${scenarios.length} เคส)\n3. เกณฑ์การประเมินรูบริก`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
          const created = await createCurriculumSpreadsheet(
            token,
            'แผนการสอนและคลังข้อพิพาทกฎหมายแรงงาน_ปวช1',
            lessonPlans,
            scenarios
          );
          setConnectedSheet({
            id: created.spreadsheetId,
            title: created.title,
            url: created.spreadsheetUrl,
            tabs: ['แผนการจัดการเรียนรู้ 18 สัปดาห์', 'คลังสถานการณ์ข้อพิพาท ปวช.1', 'เกณฑ์การประเมินรูบริก'],
            lastSyncedAt: new Date().toLocaleTimeString('th-TH'),
          });
          setSuccessMsg(`สร้างไฟล์ Google Sheet ใน Google Drive สำเร็จแล้ว!`);
          loadDriveFiles();
        } catch (err: any) {
          setError(err.message || 'สร้างชีตไม่สำเร็จ');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSyncLocalToSheet = async () => {
    if (!token || !connectedSheet) return;

    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการบันทึกแผนงานลง Google Sheet?',
      description: `ต้องการอัปเดตข้อมูลแผนการสอน 18 สัปดาห์ในชีต "${connectedSheet.title}" ใช่หรือไม่? ข้อมูลในชีตจะถูกเขียนทับด้วยข้อมูลปัจจุบัน`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        setError(null);
        try {
          const tab = connectedSheet.tabs[0] || 'แผนการจัดการเรียนรู้ 18 สัปดาห์';
          await syncLessonPlansToSheet(token, connectedSheet.id, tab, lessonPlans);
          setConnectedSheet({
            ...connectedSheet,
            lastSyncedAt: new Date().toLocaleTimeString('th-TH'),
          });
          setSuccessMsg('บันทึกแผนการสอนลง Google Sheet สำเร็จแล้ว!');
        } catch (err: any) {
          setError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'สัปดาห์ที่',
      'หน่วยการเรียนรู้',
      'หัวข้อเรื่อง',
      'จุดประสงค์การเรียนรู้',
      'มาตรากฎหมาย',
      'สถานการณ์จำลองตัวอย่าง',
      'กิจกรรม',
      'การวัดผล',
    ];
    const rows = lessonPlans.map((lp) => [
      `"${lp.weekNumber}"`,
      `"${lp.unitName.replace(/"/g, '""')}"`,
      `"${lp.topic.replace(/"/g, '""')}"`,
      `"${lp.learningObjectives.replace(/"/g, '""')}"`,
      `"${lp.keyLaws.replace(/"/g, '""')}"`,
      `"${lp.suggestedScenario.replace(/"/g, '""')}"`,
      `"${lp.learningActivity.replace(/"/g, '""')}"`,
      `"${lp.assessmentMethod.replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'แผนการสอนกฎหมายแรงงาน_ปวช1.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">จัดการข้อมูล Google Sheets</h2>
              <p className="text-xs text-slate-500">
                เชื่อมต่อชีตแผนการสอน บันทึกสถานการณ์จำลอง และซิงค์สองทาง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notifications */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-sm text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">เกิดข้อผิดพลาด</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Currently Connected Sheet Card */}
          {connectedSheet ? (
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> เชื่อมต่อกับ Google Sheet แล้ว
                </span>
                <span className="text-[11px] text-emerald-700">
                  ซิงค์ล่าสุด: {connectedSheet.lastSyncedAt || 'เมื่อสักครู่'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">{connectedSheet.title}</h3>
              <p className="text-xs text-slate-500 font-mono mb-4 break-all">ID: {connectedSheet.id}</p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100">
                <a
                  href={connectedSheet.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-50 shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> เปิดดูใน Google Sheets
                </a>

                <button
                  onClick={handleSyncLocalToSheet}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-2xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  บันทึกการแก้ไขลงชีตนี้
                </button>

                <button
                  onClick={() => setConnectedSheet(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-50 transition-colors ml-auto"
                >
                  ยกเลิกการเชื่อมต่อ
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
              <FolderOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">ยังไม่ได้เชื่อมต่อ Google Sheet</p>
                <p className="mt-1 text-amber-800">
                  คุณสามารถสร้างชีตใหม่ใน Google Drive ของคุณทันที หรือเชื่อมต่อชีตที่มีอยู่เพื่อซิงค์แผนการสอน 18 สัปดาห์ และบันทึกสถานการณ์ข้อพิพาท
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>ตัวเลือกการเชื่อมต่อ</span>
            </h3>

            {/* Option 1: Create New Google Sheet in Drive */}
            <div className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    สร้างไฟล์ Google Sheet ใหม่ใน Google Drive ของคุณ
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    ระบบจะสร้างไฟล์สเปรดชีตมาตรฐาน 3 แผ่นงาน (แผนการสอน, คลังข้อพิพาท, เกณฑ์รูบริก) พร้อมใส่ข้อมูลเริ่มต้นให้อัตโนมัติ
                  </p>
                </div>
                <button
                  onClick={handleCreateNewSheet}
                  disabled={loading || !token}
                  className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  สร้างชีตใหม่ทันที
                </button>
              </div>
              {!token && (
                <p className="text-[11px] text-amber-600 mt-2">
                  * ต้องเข้าสู่ระบบ Google ด้านบนก่อนจึงจะสร้างชีตใน Drive ได้
                </p>
              )}
            </div>

            {/* Option 2: Connect Existing by URL / ID */}
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                เชื่อมต่อด้วย Google Sheet URL หรือ ID ที่มีอยู่
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="วางลิงก์ เช่น https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n... หรือใส่ ID"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={() => handleConnectSheet(sheetInput)}
                  disabled={loading || !sheetInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0"
                >
                  {loading ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ'}
                </button>
              </div>
            </div>

            {/* Option 3: Select from User's Drive Spreadsheets */}
            {token && (
              <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    เลือกจาก Google Drive ของคุณ
                  </h4>
                  <button
                    onClick={loadDriveFiles}
                    disabled={loadingDrive}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingDrive ? 'animate-spin' : ''}`} /> รีเฟรช
                  </button>
                </div>

                {loadingDrive ? (
                  <p className="text-xs text-slate-400 py-3 text-center">กำลังค้นหาไฟล์ Google Sheets ใน Drive...</p>
                ) : driveFiles.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={() => handleConnectSheet(file.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded text-[11px] font-medium text-slate-700 transition-colors shrink-0"
                        >
                          เลือกชีตนี้
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">ไม่พบไฟล์สเปรดชีตใน Drive หรือยังไม่ได้ให้สิทธิ์เข้าถึง</p>
                )}
              </div>
            )}

            {/* Offline Fallback: Export CSV */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">หรือสำรองข้อมูลเป็นไฟล์ CSV (ใช้งานออฟไลน์):</span>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> ดาวน์โหลด CSV
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">{confirmDialog.title}</h3>
              <p className="text-xs text-slate-600 mt-2 whitespace-pre-line text-left bg-slate-50 p-3 rounded-lg border border-slate-200">
                {confirmDialog.description}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                ยืนยันดำเนินการ (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
