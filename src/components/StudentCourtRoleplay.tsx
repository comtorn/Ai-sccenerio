import React, { useState } from 'react';
import { Scenario, EvaluationResult } from '../types';
import {
  Gavel,
  Scale,
  Award,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HeartHandshake,
  UserCheck,
  Building,
  User,
  Sparkles,
} from 'lucide-react';

interface StudentCourtRoleplayProps {
  scenarios: Scenario[];
  currentScenario: Scenario | null;
  onSelectScenario: (scenario: Scenario) => void;
}

export const StudentCourtRoleplay: React.FC<StudentCourtRoleplayProps> = ({
  scenarios,
  currentScenario,
  onSelectScenario,
}) => {
  const [selectedRole, setSelectedRole] = useState<'พนักงานตรวจแรงงาน' | 'ลูกจ้าง' | 'นายจ้าง'>('พนักงานตรวจแรงงาน');
  const [verdictChoice, setVerdictChoice] = useState('');
  const [studentReasoning, setStudentReasoning] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeScenario = currentScenario || scenarios[0];

  const handleEvaluate = async () => {
    if (!activeScenario) return;
    if (!studentReasoning.trim()) {
      setError('กรุณาเขียนเหตุผลและคำวินิจฉัยของนักเรียนก่อนส่งประเมิน');
      return;
    }

    setIsEvaluating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/evaluate-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioTitle: activeScenario.title,
          story: activeScenario.story,
          applicableLaws: activeScenario.applicableLaws,
          studentRole: selectedRole,
          studentVerdictChoice: verdictChoice || 'วินิจฉัยตามข้อเท็จจริง',
          studentReasoning: studentReasoning,
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'ประเมินคำตอบไม่สำเร็จ');
      }

      setEvaluation(json.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการประเมินผล');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setEvaluation(null);
    setStudentReasoning('');
    setVerdictChoice('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-600" />
            ห้องพิจารณาคดีจำลอง & ศาลแรงงานเสมือนจริง (ปวช.1)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            สวมบทบาทเป็นพนักงานตรวจแรงงาน ทนายความ หรือตัวแทนนายจ้าง/ลูกจ้าง พร้อมรับผลประเมินทันทีจาก AI
          </p>
        </div>

        {/* Scenario Switcher */}
        {scenarios.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap font-medium">เลือกคดี:</label>
            <select
              value={activeScenario?.id || ''}
              onChange={(e) => {
                const s = scenarios.find((item) => item.id === e.target.value);
                if (s) {
                  onSelectScenario(s);
                  setEvaluation(null);
                }
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 max-w-[220px] truncate"
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

      {activeScenario ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Case Brief (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {activeScenario.vocationalField}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-2">{activeScenario.title}</h2>
              <p className="text-xs text-slate-500">สถานที่: {activeScenario.workplace}</p>
            </div>

            {/* Characters */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> คู่กรณีและพยาน:
              </h3>
              <div className="space-y-1.5">
                {activeScenario.characters?.map((c, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg text-xs border border-slate-200">
                    <span className="font-bold text-slate-800">{c.name}</span>{' '}
                    <span className="text-indigo-600">({c.role})</span> - {c.detail}
                  </div>
                ))}
              </div>
            </div>

            {/* Story */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700">ข้อเท็จจริงในคดี:</h3>
              <div className="p-3.5 bg-amber-50/40 rounded-xl text-xs text-slate-700 leading-relaxed max-h-56 overflow-y-auto border border-amber-200/50 font-['Sarabun',sans-serif]">
                {activeScenario.story}
              </div>
            </div>

            {/* Quick Law Reference Hints */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/60 space-y-2">
              <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> มาตรากฎหมายที่เป็นคำใบ้:
              </h4>
              <div className="space-y-1">
                {activeScenario.applicableLaws?.map((l, i) => (
                  <div key={i} className="text-[11px] text-indigo-950">
                    <span className="font-bold text-indigo-700">{l.article}:</span> {l.contentSummary}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Submission & Roleplay Workspace (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {!evaluation ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">บัลลังก์ศาลแรงงานจำลอง</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลือกบทบาทที่นักศึกษาต้องการสวมบท แล้วเขียนคำวินิจฉัยหรือข้อต่อสู้
                  </p>
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">1. เลือกบทบาทของนักเรียน:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('พนักงานตรวจแรงงาน')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedRole === 'พนักงานตรวจแรงงาน'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <UserCheck className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                      <span className="text-xs">พนักงานตรวจแรงงาน / ผู้พิพากษา</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('ลูกจ้าง')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedRole === 'ลูกจ้าง'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <User className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                      <span className="text-xs">ตัวแทนฝ่ายลูกจ้าง</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('นายจ้าง')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedRole === 'นายจ้าง'
                          ? 'border-amber-600 bg-amber-50/70 text-amber-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Building className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                      <span className="text-xs">ตัวแทนฝ่ายนายจ้าง</span>
                    </button>
                  </div>
                </div>

                {/* Verdict Quick Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">2. คำชี้ขาดเบื้องต้น (เลือกหรือปรับแก้ได้):</label>
                  <div className="space-y-1.5">
                    {activeScenario.studentActivity?.roleplayChoices?.map((choice) => (
                      <label
                        key={choice.id}
                        className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer text-xs transition-colors ${
                          verdictChoice === choice.choiceText
                            ? 'border-indigo-500 bg-indigo-50/60 font-medium text-indigo-900'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="verdictChoice"
                          checked={verdictChoice === choice.choiceText}
                          onChange={() => setVerdictChoice(choice.choiceText)}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{choice.choiceText}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Student's Written Reasoning */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      3. เหตุผลและมาตรากฎหมายประกอบการตัดสิน (คะแนนหลัก):
                    </label>
                    <span className="text-[11px] text-slate-400">อ้างอิงมาตรากฎหมายจะได้รับคะแนนสูงขึ้น</span>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="เขียนอธิบายว่าเพราะเหตุใดจึงตัดสินเช่นนั้น? ฝ่ายใดทำผิดกฎหมายข้อไหน (เช่น ม. 17, ม. 47, ม. 76) นายจ้างต้องจ่ายเงินชดใช้หรือไม่ และนักศึกษาในฐานะคนทำงานควรระวังสิ่งใด..."
                    value={studentReasoning}
                    onChange={(e) => setStudentReasoning(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-['Sarabun',sans-serif]"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      ระบบ AI กำลังตรวจและเทียบเคียงกับตัวบทกฎหมายแรงงาน...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      ส่งคำตัดสินเพื่อรับผลการประเมินรูบริกทันที
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Results & Formative Evaluation Feedback Card */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in zoom-in-95">
                {/* Score & Grade Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                      ผลการประเมินคำตัดสินของนักศึกษา
                    </span>
                    <h3 className="text-lg font-bold">ระดับผลการเรียนรู้: {evaluation.grade}</h3>
                    <p className="text-xs text-indigo-200">
                      ความถูกต้องของคำวินิจฉัย: {evaluation.verdictAccuracy}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                      <div className="text-3xl font-extrabold text-amber-300">{evaluation.score}</div>
                      <div className="text-[10px] text-white/70">เต็ม 100 คะแนน</div>
                    </div>
                  </div>
                </div>

                {/* Law Application Feedback */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" /> การปรับใช้มาตรากฎหมาย:
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{evaluation.lawApplicationFeedback}</p>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> จุดเด่นในคำตอบของคุณ:
                    </h4>
                    <ul className="space-y-1 text-xs text-emerald-800">
                      {evaluation.strengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> สิ่งที่ควรปรับปรุงหรือศึกษาเพิ่ม:
                    </h4>
                    <ul className="space-y-1 text-xs text-amber-800">
                      {evaluation.improvements?.map((imp, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Practical Vocational Tip */}
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-xs">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> ข้อคิดเตือนใจสำหรับชีวิตช่าง / การทำงานจริง:
                  </h4>
                  <p className="text-indigo-950 font-medium leading-relaxed">{evaluation.vocationalTip}</p>
                </div>

                {/* Encouragement */}
                <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  <span>{evaluation.encouragement}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                  >
                    ลองตอบใหม่อีกครั้ง
                  </button>
                  <button
                    onClick={() => {
                      setEvaluation(null);
                      setStudentReasoning('');
                    }}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
                  >
                    ทำคดีถัดไป
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">กรุณาสร้างสถานการณ์จำลองก่อนในแท็บ "สร้างสถานการณ์จำลอง"</p>
        </div>
      )}
    </div>
  );
};
