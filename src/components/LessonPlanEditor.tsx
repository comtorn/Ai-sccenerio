import React, { useState } from 'react';
import { LessonPlanWeek, ConnectedSheet } from '../types';
import { syncLessonPlansToSheet } from '../services/sheetsService';
import {
  Calendar,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  RefreshCw,
  Sparkles,
  Download,
  AlertTriangle,
  BookOpen,
  Filter,
} from 'lucide-react';

interface LessonPlanEditorProps {
  lessonPlans: LessonPlanWeek[];
  setLessonPlans: React.Dispatch<React.SetStateAction<LessonPlanWeek[]>>;
  connectedSheet: ConnectedSheet | null;
  token: string | null;
}

export const LessonPlanEditor: React.FC<LessonPlanEditorProps> = ({
  lessonPlans,
  setLessonPlans,
  connectedSheet,
  token,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<LessonPlanWeek | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  const filteredPlans = lessonPlans.filter(
    (lp) =>
      lp.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.keyLaws.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.weekNumber.toString() === searchTerm
  );

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...lessonPlans[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editForm) return;
    const updated = [...lessonPlans];
    updated[editingIndex] = editForm;
    setLessonPlans(updated);
    setEditingIndex(null);
    setEditForm(null);
    setStatusMsg({ type: 'success', text: `บันทึกการแก้ไขสัปดาห์ที่ ${editForm.weekNumber} เรียบร้อย` });
  };

  const handleAddNewWeek = () => {
    const nextWeek = lessonPlans.length + 1;
    const newPlan: LessonPlanWeek = {
      weekNumber: nextWeek,
      unitName: `หน่วยที่ ${Math.ceil(nextWeek / 2)}: กฎหมายแรงงาน ปวช.1`,
      topic: 'หัวข้อการเรียนรู้ใหม่',
      learningObjectives: 'ระบุจุดประสงค์การเรียนรู้',
      keyLaws: 'พ.ร.บ. คุ้มครองแรงงาน พ.ศ. 2541',
      suggestedScenario: 'สถานการณ์จำลองเพื่อการอภิปราย',
      learningActivity: 'กิจกรรมการวิเคราะห์กลุ่ม',
      assessmentMethod: 'แบบประเมินผลรูบริก',
    };
    setLessonPlans([...lessonPlans, newPlan]);
    handleStartEdit(lessonPlans.length);
  };

  const handleDeleteWeek = (index: number) => {
    const target = lessonPlans[index];
    const confirmed = window.confirm(`ต้องการลบสัปดาห์ที่ ${target.weekNumber} (${target.topic}) ใช่หรือไม่?`);
    if (!confirmed) return;
    const updated = lessonPlans.filter((_, i) => i !== index);
    setLessonPlans(updated);
  };

  const handleSyncToSheet = async () => {
    if (!token || !connectedSheet) {
      setStatusMsg({ type: 'error', text: 'กรุณาเชื่อมต่อ Google Sheet ด้านบนก่อน' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการบันทึกการแก้ไขลง Google Sheet?',
      description: `ระบบจะอัปเดตข้อมูลแผนการสอน 18 สัปดาห์ (${lessonPlans.length} รายการ) ลงในชีต "${connectedSheet.title}"`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsSaving(true);
        setStatusMsg(null);
        try {
          const tab = connectedSheet.tabs[0] || 'แผนการจัดการเรียนรู้ 18 สัปดาห์';
          await syncLessonPlansToSheet(token, connectedSheet.id, tab, lessonPlans);
          setStatusMsg({ type: 'success', text: 'บันทึกการแก้ไขลง Google Sheet สำเร็จเรียบร้อยแล้ว!' });
        } catch (err: any) {
          setStatusMsg({ type: 'error', text: err.message || 'บันทึกลงชีตไม่สำเร็จ' });
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const handleAiRegenerateCurriculum = async () => {
    const specialRequest = prompt(
      'ต้องการให้ AI ปรับปรุงแผนการสอน 18 สัปดาห์ โดยเน้นจุดใดเป็นพิเศษ? (เช่น เน้นการเตรียมพร้อมฝึกงานในโรงงานอุตสาหกรรม, เน้นเทคนิคช่างยนต์, เน้นสายธุรกิจค้าปลีก)'
    );
    if (specialRequest === null) return;

    setIsAiGenerating(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/ai/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: 'กฎหมายแรงงาน (ปวช.1)',
          totalWeeks: 18,
          specialEmphasis: specialRequest,
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data?.weeks) {
        throw new Error(json.error || 'สร้างแผนไม่สำเร็จ');
      }

      setLessonPlans(json.data.weeks);
      setStatusMsg({ type: 'success', text: `สร้างแผนการสอน 18 สัปดาห์ใหม่ด้วย AI สำเร็จแล้ว!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'AI เกิดข้อผิดพลาด' });
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            แผนการจัดการเรียนรู้ 18 สัปดาห์ (Curriculum Map)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            รหัสวิชา 20001-1004 กฎหมายแรงงาน ระดับ ปวช. 1 สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {connectedSheet && (
            <button
              onClick={handleSyncToSheet}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isSaving ? 'กำลังบันทึกลงชีต...' : 'บันทึกการแก้ไขลง Google Sheet'}
            </button>
          )}

          <button
            onClick={handleAiRegenerateCurriculum}
            disabled={isAiGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {isAiGenerating ? 'กำลังออกแบบแผนใหม่...' : 'ให้ AI ปรับปรุงแผน 18 สัปดาห์'}
          </button>

          <button
            onClick={handleAddNewWeek}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-600" /> เพิ่มสัปดาห์
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ค้นหาตามสัปดาห์, หน่วยการเรียนรู้, หัวข้อเรื่อง หรือมาตรากฎหมาย..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {/* Curriculum Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center">สัปดาห์</th>
                <th className="p-3 min-w-[160px]">หน่วย & หัวข้อเรื่อง</th>
                <th className="p-3 min-w-[200px]">จุดประสงค์การเรียนรู้</th>
                <th className="p-3 min-w-[130px]">มาตรากฎหมายหลัก</th>
                <th className="p-3 min-w-[200px]">สถานการณ์จำลอง (Scenario)</th>
                <th className="p-3 min-w-[150px]">กิจกรรม Active Learning</th>
                <th className="p-3 w-20 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPlans.map((lp, idx) => {
                const originalIndex = lessonPlans.findIndex((p) => p.weekNumber === lp.weekNumber);
                const isEditing = editingIndex === originalIndex;

                if (isEditing && editForm) {
                  return (
                    <tr key={lp.weekNumber} className="bg-indigo-50/40">
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={editForm.weekNumber}
                          onChange={(e) => setEditForm({ ...editForm, weekNumber: parseInt(e.target.value) || 0 })}
                          className="w-12 text-center text-xs border border-indigo-300 rounded p-1"
                        />
                      </td>
                      <td className="p-2 space-y-1">
                        <input
                          type="text"
                          value={editForm.unitName}
                          onChange={(e) => setEditForm({ ...editForm, unitName: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1 font-semibold"
                          placeholder="ชื่อหน่วย"
                        />
                        <input
                          type="text"
                          value={editForm.topic}
                          onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1"
                          placeholder="หัวข้อเรื่อง"
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={editForm.learningObjectives}
                          onChange={(e) => setEditForm({ ...editForm, learningObjectives: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1 resize-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editForm.keyLaws}
                          onChange={(e) => setEditForm({ ...editForm, keyLaws: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1"
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={editForm.suggestedScenario}
                          onChange={(e) => setEditForm({ ...editForm, suggestedScenario: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1 resize-none"
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={editForm.learningActivity}
                          onChange={(e) => setEditForm({ ...editForm, learningActivity: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1 resize-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={handleSaveEdit}
                            className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="บันทึก"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-slate-300 text-slate-700 rounded hover:bg-slate-400"
                            title="ยกเลิก"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={lp.weekNumber} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-900 bg-slate-50/50">
                      สัปดาห์ {lp.weekNumber}
                    </td>
                    <td className="p-3">
                      <div className="text-[11px] font-semibold text-indigo-700">{lp.unitName}</div>
                      <div className="font-semibold text-slate-900 text-xs mt-0.5">{lp.topic}</div>
                    </td>
                    <td className="p-3 text-[11px] leading-relaxed text-slate-600">{lp.learningObjectives}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-800 text-[10px] font-semibold">
                        {lp.keyLaws}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 leading-relaxed font-['Sarabun',sans-serif]">
                      {lp.suggestedScenario}
                    </td>
                    <td className="p-3 text-[11px] text-slate-600">{lp.learningActivity}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(originalIndex)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="แก้ไขแถวนี้"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWeek(originalIndex)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="ลบสัปดาห์นี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">{confirmDialog.title}</h3>
              <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-left">
                {confirmDialog.description}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                ยืนยันการบันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
