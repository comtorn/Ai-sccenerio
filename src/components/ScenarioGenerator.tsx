import React, { useState } from 'react';
import { Scenario, ConnectedSheet, LessonPlanWeek } from '../types';
import { appendScenarioToSheet } from '../services/sheetsService';
import {
  Sparkles,
  RefreshCw,
  Send,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  Gavel,
  Scale,
  Users,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  BookmarkPlus,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ScenarioGeneratorProps {
  scenarios: Scenario[];
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
  currentScenario: Scenario | null;
  setCurrentScenario: (sc: Scenario) => void;
  connectedSheet: ConnectedSheet | null;
  token: string | null;
  onNavigateToCourt: (scenario: Scenario) => void;
  lessonPlans: LessonPlanWeek[];
}

const VOCATIONAL_MAJORS = [
  'ช่างยนต์ / เครื่องกล',
  'ช่างไฟฟ้ากำลัง / ควบคุม',
  'ช่างอิเล็กทรอนิกส์ / หุ่นยนต์',
  'ช่างกลโรงงาน / แม่พิมพ์',
  'ช่างก่อสร้าง / สถาปัตยกรรม',
  'คอมพิวเตอร์ธุรกิจ / สารสนเทศ',
  'การบัญชี / การเงิน',
  'การตลาด / ค้าปลีกสมัยใหม่',
  'การโรงแรม / การท่องเที่ยว',
  'คหกรรม / อาหารและโภชนาการ',
  'โลจิสติกส์ / การจัดการคลังสินค้า',
];

const DIFFICULTY_LEVELS = [
  { label: 'พื้นฐาน ปวช. 1', desc: 'ประเด็นชัดเจน ตรงไปตรงมา เหมาะสำหรับเริ่มต้นเรียนรู้' },
  { label: 'ปานกลาง (มีข้อต่อสู้สองฝ่าย)', desc: 'มีข้ออ้างสัญญาจ้าง vs กฎหมายคุ้มครอง' },
  { label: 'ท้าทาย (เคสซับซ้อน/อุบัติเหตุรุนแรง)', desc: 'เชื่อมโยงหลายมาตรา หรือมี พ.ร.บ.เงินทดแทน/ประกันสังคมร่วมด้วย' },
];

export const ScenarioGenerator: React.FC<ScenarioGeneratorProps> = ({
  scenarios,
  setScenarios,
  currentScenario,
  setCurrentScenario,
  connectedSheet,
  token,
  onNavigateToCourt,
  lessonPlans,
}) => {
  const [vocationalField, setVocationalField] = useState('ช่างยนต์ / เครื่องกล');
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [customLawTopic, setCustomLawTopic] = useState('');
  const [difficulty, setDifficulty] = useState('พื้นฐาน ปวช. 1');
  const [focusIssues, setFocusIssues] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSavingToSheet, setIsSavingToSheet] = useState(false);

  // Active section tab in scenario viewer
  const [viewTab, setViewTab] = useState<'story' | 'law' | 'activity' | 'rubric'>('story');

  const selectedPlan = lessonPlans[selectedUnitIndex] || lessonPlans[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSyncStatus(null);

    try {
      const res = await fetch('/api/ai/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitTitle: selectedPlan ? `${selectedPlan.unitName}: ${selectedPlan.topic}` : 'กฎหมายคุ้มครองแรงงาน ปวช.1',
          lawTopic: customLawTopic || (selectedPlan ? selectedPlan.keyLaws : 'ค่าจ้างและเวลาทำงาน'),
          vocationalField,
          difficulty,
          focusIssues,
          studentAgeGroup: 'นักเรียน ปวช. 1 (อายุ 15-16 ปี ในระบบอาชีวศึกษา)',
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'ไม่สามารถสร้างสถานการณ์ได้');
      }

      const newScenario: Scenario = {
        ...json.data,
        createdAt: new Date().toLocaleTimeString('th-TH'),
        sheetSynced: false,
      };

      setScenarios((prev) => [newScenario, ...prev]);
      setCurrentScenario(newScenario);
      setViewTab('story');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToGoogleSheet = async () => {
    if (!currentScenario) return;
    if (!token || !connectedSheet) {
      setSyncStatus('กรุณาเชื่อมต่อ Google Sheet ก่อนทำการบันทึก');
      return;
    }

    const confirmed = window.confirm(
      `ยืนยันการเพิ่มสถานการณ์ "${currentScenario.title}" ลงใน Google Sheet "${connectedSheet.title}" ใช่หรือไม่?`
    );
    if (!confirmed) return;

    setIsSavingToSheet(true);
    setSyncStatus(null);
    try {
      const tab = connectedSheet.tabs.find((t) => t.includes('สถานการณ์') || t.includes('ข้อพิพาท')) || 'คลังสถานการณ์ข้อพิพาท ปวช.1';
      await appendScenarioToSheet(token, connectedSheet.id, tab, currentScenario);
      currentScenario.sheetSynced = true;
      setSyncStatus('บันทึกลง Google Sheet สำเร็จแล้ว!');
    } catch (err: any) {
      setSyncStatus('เกิดข้อผิดพลาด: ' + (err.message || 'บันทึกไม่สำเร็จ'));
    } finally {
      setIsSavingToSheet(false);
    }
  };

  const handleCopyText = () => {
    if (!currentScenario) return;
    const text = `【สถานการณ์จำลอง: ${currentScenario.title}】
สาขาวิชาชีพ: ${currentScenario.vocationalField}
สถานที่: ${currentScenario.workplace}

[เรื่องราวข้อพิพาท]
${currentScenario.story}

[ข้อเรียกร้องลูกจ้าง]
${currentScenario.dispute?.employeeClaim}

[ข้อต่อสู้นายจ้าง]
${currentScenario.dispute?.employerClaim}

[มาตรากฎหมายที่เกี่ยวข้อง]
${currentScenario.applicableLaws?.map((l) => `- ${l.article} (${l.lawName}): ${l.contentSummary}`).join('\n')}

[คำวินิจฉัยทางกฎหมาย]
${currentScenario.verdict?.conclusion}
เหตุผล: ${currentScenario.verdict?.reasoning}

[คำถามสำหรับนักเรียน]
${currentScenario.studentActivity?.questions?.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Scenario Generator : สร้างสถานการณ์จำลองข้อพิพาทแรงงาน
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            สำหรับนักเรียนระดับ ปวช. 1 อาชีวศึกษา โดยอิงเนื้อหาตามแผนการจัดการเรียนรู้รายวิชา
          </p>
        </div>

        {/* Existing Scenario Selector */}
        {scenarios.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap font-medium">คลังข้อพิพาท ({scenarios.length}):</label>
            <select
              value={currentScenario?.id || ''}
              onChange={(e) => {
                const found = scenarios.find((s) => s.id === e.target.value);
                if (found) setCurrentScenario(found);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 max-w-[220px] truncate"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Form Control (Left) & Preview/Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Generator Controls (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" /> ตั้งค่าพารามิเตอร์สถานการณ์
            </h2>
            <p className="text-[11px] text-slate-400">เลือกสาขาวิชาชีพและหน่วยการเรียนรู้</p>
          </div>

          {/* Vocational Major */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">สาขาวิชาชีพของนักศึกษา ปวช.:</label>
            <select
              value={vocationalField}
              onChange={(e) => setVocationalField(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {VOCATIONAL_MAJORS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Lesson Plan Week / Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">สัปดาห์ / หน่วยการเรียนรู้ตามแผน:</label>
            <select
              value={selectedUnitIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                setSelectedUnitIndex(idx);
                if (lessonPlans[idx]) {
                  setCustomLawTopic(lessonPlans[idx].keyLaws);
                }
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {lessonPlans.map((lp, idx) => (
                <option key={lp.weekNumber} value={idx}>
                  สัปดาห์ที่ {lp.weekNumber}: {lp.topic}
                </option>
              ))}
            </select>
            {selectedPlan && (
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">กฎหมายหลัก:</span> {selectedPlan.keyLaws}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">แนวทางสถานการณ์:</span> {selectedPlan.suggestedScenario}
                </div>
              </div>
            )}
          </div>

          {/* Specific Law Focus */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">ประเด็นกฎหมายเจาะจง (ระบุเพิ่มเติมได้):</label>
            <input
              type="text"
              placeholder="เช่น การหักค่าจ้าง ม.76, ค่าล่วงเวลา 1.5 เท่า, เลิกจ้างกะทันหัน ม.17"
              value={customLawTopic}
              onChange={(e) => setCustomLawTopic(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Difficulty Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">ระดับความซับซ้อนของข้อพิพาท:</label>
            <div className="space-y-1.5">
              {DIFFICULTY_LEVELS.map((d) => (
                <label
                  key={d.label}
                  className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                    difficulty === d.label
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    checked={difficulty === d.label}
                    onChange={() => setDifficulty(d.label)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-semibold">{d.label}</div>
                    <div className="text-[10px] text-slate-500">{d.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Context or Special Requests */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">โจทย์พิเศษเพิ่มเติม (ถ้ามี):</label>
            <textarea
              rows={2}
              placeholder="เช่น อยากให้มีนักเรียนฝึกงานทวิภาคีเป็นตัวเอก, มีการแอบอัดเสียง, หรือเกิดอุบัติเหตุอุปกรณ์ไม่พร้อม"
              value={focusIssues}
              onChange={(e) => setFocusIssues(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                กำลังวิเคราะห์และสร้างข้อพิพาท...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                สร้างสถานการณ์จำลอง AI ทันที
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Scenario Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentScenario ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Header Banner */}
              <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white relative">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {currentScenario.vocationalField}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    {currentScenario.workplace}
                  </span>
                  {currentScenario.sheetSynced && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ซิงค์ลง Google Sheet แล้ว
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{currentScenario.title}</h2>

                {/* Quick actions top bar */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
                  <button
                    onClick={handleSaveToGoogleSheet}
                    disabled={isSavingToSheet}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {isSavingToSheet ? 'กำลังบันทึกลงชีต...' : 'บันทึกลง Google Sheet'}
                  </button>

                  <button
                    onClick={() => onNavigateToCourt(currentScenario)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-semibold transition-colors"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    เล่นในห้องพิจารณาคดีจำลอง
                  </button>

                  <button
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}
                  </button>

                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> พิมพ์ใบงาน
                  </button>
                </div>

                {syncStatus && (
                  <p className="text-xs text-emerald-300 mt-2 font-medium bg-emerald-950/60 p-2 rounded-lg border border-emerald-800">
                    {syncStatus}
                  </p>
                )}
              </div>

              {/* Sub Navigation for Scenario */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-4 overflow-x-auto text-xs">
                <button
                  onClick={() => setViewTab('story')}
                  className={`py-3 px-4 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    viewTab === 'story'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1. เนื้อเรื่องและตัวละคร (Story & Characters)
                </button>
                <button
                  onClick={() => setViewTab('law')}
                  className={`py-3 px-4 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    viewTab === 'law'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2. ประเด็นและคำวินิจฉัย (Dispute & Laws)
                </button>
                <button
                  onClick={() => setViewTab('activity')}
                  className={`py-3 px-4 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    viewTab === 'activity'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3. คำถามใบงานและช้อยส์จำลอง (Student Task)
                </button>
                <button
                  onClick={() => setViewTab('rubric')}
                  className={`py-3 px-4 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    viewTab === 'rubric'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4. เกณฑ์การประเมินรูบริก (Rubric)
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {/* TAB 1: STORY & CHARACTERS */}
                {viewTab === 'story' && (
                  <div className="space-y-6">
                    {/* Characters */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600" /> ตัวละครในสถานการณ์
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentScenario.characters?.map((c, i) => (
                          <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                            <div className="text-xs font-medium text-indigo-700 mt-0.5">{c.role}</div>
                            <p className="text-xs text-slate-600 mt-1">{c.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Story Narrative */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" /> เหตุการณ์ข้อพิพาทจำลอง
                      </h3>
                      <div className="p-5 bg-amber-50/30 border border-amber-200/60 rounded-xl text-slate-800 text-sm leading-relaxed whitespace-pre-line font-['Sarabun',sans-serif]">
                        {currentScenario.story}
                      </div>
                    </div>

                    {/* Claims Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span> ข้อเรียกร้องของฝ่ายลูกจ้าง
                        </h4>
                        <p className="text-xs text-blue-800">{currentScenario.dispute?.employeeClaim}</p>
                      </div>

                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <h4 className="text-xs font-bold text-orange-900 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-600"></span> ข้อต่อสู้ของฝ่ายนายจ้าง
                        </h4>
                        <p className="text-xs text-orange-800">{currentScenario.dispute?.employerClaim}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LAWS & VERDICT */}
                {viewTab === 'law' && (
                  <div className="space-y-6">
                    {/* Key Legal Issues */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        ประเด็นข้อกฎหมายหลักที่ต้องวินิจฉัย
                      </h3>
                      <div className="space-y-2">
                        {currentScenario.keyLegalIssues?.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                              {i + 1}
                            </span>
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Applicable Laws */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        บทบัญญัติแห่งกฎหมายที่ปรับใช้
                      </h3>
                      <div className="space-y-3">
                        {currentScenario.applicableLaws?.map((law, i) => (
                          <div key={i} className="p-4 bg-white border border-indigo-100 rounded-xl shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-700 text-xs px-2.5 py-1 bg-indigo-50 rounded-md">
                                {law.article}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">{law.lawName}</span>
                            </div>
                            <div className="text-xs text-slate-800">
                              <span className="font-semibold text-slate-900">สาระสำคัญ:</span> {law.contentSummary}
                            </div>
                            <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/50">
                              <span className="font-semibold text-emerald-900">การปรับใช้กับคดีนี้:</span> {law.application}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legal Verdict & Precedent */}
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-100 border border-indigo-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-indigo-700" />
                        <h4 className="font-bold text-slate-900 text-sm">คำวินิจฉัยชี้ขาดตามหลักกฎหมายแรงงาน</h4>
                      </div>
                      <p className="text-xs text-indigo-950 font-semibold">{currentScenario.verdict?.conclusion}</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{currentScenario.verdict?.reasoning}</p>

                      <div className="pt-2 border-t border-indigo-200/60 text-xs space-y-1">
                        <div className="font-semibold text-slate-900">ผลทางกฎหมาย / ค่าชดใช้ / โทษ:</div>
                        <div className="text-slate-700 whitespace-pre-line">{currentScenario.verdict?.legalRemedy}</div>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        <span className="font-bold">💡 คำแนะนำแก่นักเรียน ปวช. ในการทำงานจริง: </span>
                        {currentScenario.verdict?.practicalAdvice}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: STUDENT ACTIVITY & CHOICES */}
                {viewTab === 'activity' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                      <h4 className="font-bold mb-1">คำสั่งใบงานสำหรับนักเรียน:</h4>
                      <p>{currentScenario.studentActivity?.instruction}</p>
                    </div>

                    {/* Questions */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        คำถามท้ายสถานการณ์ (Discussion Questions)
                      </h3>
                      <div className="space-y-3">
                        {currentScenario.studentActivity?.questions?.map((q, i) => (
                          <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
                            <span className="font-bold text-indigo-600 mr-2">ข้อที่ {i + 1}:</span>
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Roleplay Branching Choices */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        ตัวเลือกการตัดสินใจและผลลัพธ์ (Roleplay Decision Tree)
                      </h3>
                      <div className="space-y-3">
                        {currentScenario.studentActivity?.roleplayChoices?.map((choice) => (
                          <div
                            key={choice.id}
                            className={`p-4 rounded-xl border text-xs space-y-2 ${
                              choice.isLegallyCorrect
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">ทางเลือก: {choice.choiceText}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  choice.isLegallyCorrect
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {choice.isLegallyCorrect ? 'ถูกต้องตามกฎหมาย' : 'ไม่ถูกต้องตามกฎหมาย'}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px]">
                              <span className="font-semibold text-slate-700">ผลที่ตามมา:</span> {choice.consequence}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: RUBRIC */}
                {viewTab === 'rubric' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      เกณฑ์การประเมินผลการเรียนรู้แบบรูบริก (Rubric Assessment Matrix)
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3 min-w-[140px]">เกณฑ์การประเมิน (น้ำหนัก)</th>
                            <th className="p-3 min-w-[130px] bg-emerald-50/60 text-emerald-800">ดีเยี่ยม (4 คะแนน)</th>
                            <th className="p-3 min-w-[130px] bg-blue-50/60 text-blue-800">ดี (3 คะแนน)</th>
                            <th className="p-3 min-w-[130px] bg-amber-50/60 text-amber-800">พอใช้ (2 คะแนน)</th>
                            <th className="p-3 min-w-[130px] bg-rose-50/60 text-rose-800">ปรับปรุง (1 คะแนน)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {currentScenario.rubric?.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-900 bg-slate-50/30">
                                {r.criteriaName} <span className="text-indigo-600 font-normal">({r.weight})</span>
                              </td>
                              <td className="p-3 text-[11px] leading-relaxed bg-emerald-50/20">{r.excellentLevel}</td>
                              <td className="p-3 text-[11px] leading-relaxed bg-blue-50/20">{r.goodLevel}</td>
                              <td className="p-3 text-[11px] leading-relaxed bg-amber-50/20">{r.fairLevel}</td>
                              <td className="p-3 text-[11px] leading-relaxed bg-rose-50/20">{r.needsImprovement}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">ยังไม่ได้เลือกหรือสร้างสถานการณ์จำลอง</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                ตั้งค่าสาขาวิชาชีพของนักเรียน ปวช. และสัปดาห์การเรียนรู้ทางด้านซ้าย แล้วกดปุ่ม "สร้างสถานการณ์จำลอง AI" เพื่อเริ่มสร้างคดีข้อพิพาทใหม่
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-100 transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> สร้างสถานการณ์ตัวอย่างทันที
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
