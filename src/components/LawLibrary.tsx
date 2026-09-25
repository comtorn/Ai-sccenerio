import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Calculator,
  ShieldAlert,
  Clock,
  Coins,
  Baby,
  Briefcase,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface LawSection {
  category: string;
  articles: Array<{
    number: string;
    title: string;
    summary: string;
    practicalRule: string;
    penalty?: string;
  }>;
}

const LAW_SECTIONS: LawSection[] = [
  {
    category: '1. การคุ้มครองแรงงานเด็กและเยาวชน (ปวช. 1 อายุ 15 - 18 ปี)',
    articles: [
      {
        number: 'มาตรา 44',
        title: 'อายุขั้นต่ำในการจ้างงาน',
        summary: 'ห้ามมิให้นายจ้างจ้างเด็กอายุต่ำกว่า 15 ปี เป็นลูกจ้าง',
        practicalRule: 'เด็ก ปวช.1 ที่อายุ 15 ปีขึ้นไป สามารถทำงานได้ตามกฎหมาย แต่นายจ้างต้องปฏิบัติตามขั้นตอนพิเศษ',
        penalty: 'ฝ่าฝืนมีโทษปรับตั้งแต่ 400,000 - 800,000 บาท ต่อลูกจ้างหนึ่งคน หรือจำคุกไม่เกิน 2 ปี',
      },
      {
        number: 'มาตรา 45',
        title: 'การแจ้งการจ้างแรงงานเด็กต่อพนักงานตรวจแรงงาน',
        summary: 'นายจ้างต้องแจ้งการจ้างเด็กอายุต่ำกว่า 18 ปี ต่อพนักงานตรวจแรงงานภายใน 15 วันนับแต่วันที่เด็กเข้าทำงาน',
        practicalRule: 'สถานประกอบการที่รับนักศึกษา ปวช.1 เข้าทำงานหรือฝึกงาน ต้องทำหนังสือแจ้ง สสค. ท้องที่เสมอ',
      },
      {
        number: 'มาตรา 47',
        title: 'ห้ามเด็กทำงานกะดึก (22.00 - 06.00 น.)',
        summary: 'ห้ามมิให้นายจ้างให้ลูกจ้างเด็กอายุต่ำกว่า 18 ปี ทำงานระหว่าง 22.00 น. ถึง 06.00 น.',
        practicalRule: 'ร้านสะดวกซื้อ, โรงงาน, หรืออู่ซ่อมรถ ห้ามสั่งเด็ก ปวช.1 เข้ากะดึกเด็ดขาด',
        penalty: 'ปรับไม่เกิน 100,000 บาท หรือจำคุกไม่เกิน 6 เดือน',
      },
      {
        number: 'มาตรา 48',
        title: 'ห้ามเด็กทำงานล่วงเวลา (OT) และวันหยุด',
        summary: 'ห้ามมิให้นายจ้างให้ลูกจ้างเด็กอายุต่ำกว่า 18 ปี ทำงานล่วงเวลาหรือทำงานในวันหยุดทุกกรณี',
        practicalRule: 'แม้เด็ก ปวช.1 จะสมัครใจหรือขอทำ OT เอง นายจ้างก็สั่งให้ทำไม่ได้ เพราะกฎหมายคุ้มครองความปลอดภัยขั้นเด็ดขาด',
      },
      {
        number: 'มาตรา 49 - 50',
        title: 'งานอันตรายและสถานที่ต้องห้ามสำหรับเด็ก',
        summary: 'ห้ามเด็กทำงานหลอม เป่า หรือรีดโลหะ, งานที่มีความร้อน/ความเย็นจัด, งานสารเคมีอันตราย, งานเครื่องปั๊มโลหะ และห้ามทำงานในโรงฆ่าสัตว์ โรงรับชำเรา หรือสถานที่เล่นการพนัน',
        practicalRule: 'นักเรียนช่างกล/ช่างเชื่อม ต้องมีอุปกรณ์ความปลอดภัยและครูฝึกควบคุมใกล้ชิดในงานฝึกทักษะ',
      },
    ],
  },
  {
    category: '2. เวลาทำงานปกติ เวลาพัก และวันหยุด',
    articles: [
      {
        number: 'มาตรา 23',
        title: 'เวลาทำงานปกติ',
        summary: 'งานทั่วไปไม่เกิน 8 ชั่วโมงต่อวัน และไม่เกิน 48 ชั่วโมงต่อสัปดาห์ (งานอันตรายต่อสุขภาพไม่เกิน 7 ชม./วัน หรือ 42 ชม./สัปดาห์)',
        practicalRule: 'หากทำงานเกิน 8 ชั่วโมง นายจ้างต้องจ่ายเป็นค่าล่วงเวลา (OT) เสมอ',
      },
      {
        number: 'มาตรา 27',
        title: 'เวลาพักระหว่างทำงาน',
        summary: 'ต้องจัดให้ลูกจ้างมีเวลาพักระหว่างทำงานไม่น้อยกว่า 1 ชั่วโมงต่อวัน หลังจากลูกจ้างทำงานมาแล้วไม่เกิน 5 ชั่วโมงติดต่อกัน',
        practicalRule: 'ไม่สามารถให้ลูกจ้างทำงาน 8 ชั่วโมงรวดแล้วให้กลับบ้านเร็ว 1 ชั่วโมงแทนเวลาพักได้',
      },
      {
        number: 'มาตรา 28 - 30',
        title: 'วันหยุด 3 ประเภท',
        summary: '1. วันหยุดประจำสัปดาห์: ไม่น้อยกว่า 1 วันต่อสัปดาห์ (ระยะห่างไม่เกิน 6 วัน)\n2. วันหยุดตามประเพณี: ไม่น้อยกว่า 13 วันต่อปี (รวมวันแรงงานแห่งชาติ 1 พ.ค.)\n3. วันหยุดพักผ่อนประจำปี: ทำงานครบ 1 ปี ได้หยุดไม่น้อยกว่า 6 วันทำงาน',
        practicalRule: 'วันหยุดประจำสัปดาห์และวันหยุดตามประเพณี ลูกจ้างรายเดือนยังคงได้รับค่าจ้างตามปกติ',
      },
    ],
  },
  {
    category: '3. อัตราค่าล่วงเวลา (OT) และค่าทำงานในวันหยุด',
    articles: [
      {
        number: 'มาตรา 61',
        title: 'ค่าล่วงเวลาในวันทำงานปกติ (OT ธรรมดา)',
        summary: 'ต้องจ่ายไม่น้อยกว่า 1.5 เท่า ของอัตราค่าจ้างต่อชั่วโมงในวันทำงานปกติ',
        practicalRule: 'สูตร: (ค่าจ้างรายวัน ÷ 8 ชั่วโมง) × 1.5 × จำนวนชั่วโมงที่ทำเพิ่ม',
      },
      {
        number: 'มาตรา 62',
        title: 'ค่าทำงานในวันหยุด (ทำงานในเวลาปกติของวันหยุด)',
        summary: 'สำหรับลูกจ้างรายเดือนที่มีสิทธิรับค่าจ้างในวันหยุดอยู่แล้ว ให้จ่ายเพิ่มอีกไม่น้อยกว่า 1 เท่า (ส่วนลูกจ้างรายวันจ่าย 2 เท่า)',
        practicalRule: 'ลูกจ้างรายเดือนมาทำงานวันอาทิตย์ ได้ค่าจ้างเพิ่มอีก 1 เท่าของรายชั่วโมง',
      },
      {
        number: 'มาตรา 63',
        title: 'ค่าล่วงเวลาในวันหยุด (OT วันหยุด)',
        summary: 'หากทำงานเกินเวลาปกติในวันหยุด ต้องจ่ายไม่น้อยกว่า 3 เท่า ของอัตราค่าจ้างต่อชั่วโมง',
        practicalRule: 'เรทสูงสุด 3 เท่า เช่น วันหยุดทำงานหลัง 17.00 น. เป็นต้นไป',
      },
    ],
  },
  {
    category: '4. ข้อห้ามการหักค่าจ้าง (มาตรา 76)',
    articles: [
      {
        number: 'มาตรา 76',
        title: 'ห้ามมิให้นายจ้างหักค่าจ้าง',
        summary: 'ห้ามหักค่าจ้าง เว้นแต่: ภาษี, ค่าบำรุงสหภาพแรงงาน, เงินสะสมกองทุนสงเคราะห์, หรือชดใช้ค่าเสียหายที่เกิดจากความจงใจหรือประมาทเลินเล่ออย่างร้ายแรงโดยลูกจ้างยินยอมเป็นหนังสือ',
        practicalRule: 'การหักค่าจานแตก, หักเงินมาสายนาทีละ 10 บาท, หรือหักเงินเพราะลูกค้าชิ่งหนี ถือว่าผิดกฎหมายคุ้มครองแรงงานทั้งสิ้น!',
        penalty: 'ปรับไม่เกิน 20,000 บาท หรือจ่ายเงินคืนพร้อมดอกเบี้ย 15% ต่อปี',
      },
    ],
  },
  {
    category: '5. ค่าชดเชยการเลิกจ้าง (มาตรา 118 & 119)',
    articles: [
      {
        number: 'มาตรา 118',
        title: 'อัตราค่าชดเชยตามอายุงาน',
        summary: '• 120 วัน แต่ไม่ถึง 1 ปี: 30 วัน\n• 1 ปี แต่ไม่ถึง 3 ปี: 90 วัน\n• 3 ปี แต่ไม่ถึง 6 ปี: 180 วัน\n• 6 ปี แต่ไม่ถึง 10 ปี: 240 วัน\n• 10 ปี แต่ไม่ถึง 20 ปี: 300 วัน\n• 20 ปีขึ้นไป: 400 วัน',
        practicalRule: 'ลูกจ้างที่ทำงานเกิน 120 วัน หากถูกเลิกจ้างโดยไม่มีความผิดร้ายแรง ต้องได้รับค่าชดเชยเสมอ',
      },
      {
        number: 'มาตรา 119',
        title: 'ข้อยกเว้นเลิกจ้างไม่ต้องจ่ายค่าชดเชย',
        summary: 'นายจ้างไม่ต้องจ่ายค่าชดเชยเมื่อ: ทุจริตต่อหน้าที่, จงใจทำให้นายจ้างเสียหาย, ประมาทเลินเล่อเป็นเหตุให้เสียหายร้ายแรง, ฝ่าฝืนข้อบังคับการทำงานที่เตือนเป็นหนังสือแล้ว, หรือละทิ้งหน้าที่ 3 วันทำงานติดต่อกันโดยไม่มีเหตุอันสมควร',
        practicalRule: 'การทำของเสียหายโดยอุบัติเหตุทั่วไป ไม่ใช่เหตุยกเว้นตาม ม. 119 นายจ้างยังคงต้องจ่ายค่าชดเชย',
      },
    ],
  },
];

export const LawLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number>(12000);
  const [otHours, setOtHours] = useState<number>(3);

  // Wage Calculator
  const hourlyRate = (monthlySalary / 30 / 8);
  const ot15 = hourlyRate * 1.5 * otHours;
  const holidayOt3 = hourlyRate * 3 * otHours;

  const filteredSections = LAW_SECTIONS.map((sec) => ({
    ...sec,
    articles: sec.articles.filter(
      (a) =>
        a.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.practicalRule.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((sec) => sec.articles.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          คู่มือกฎหมายแรงงานฉบับพกพาสำหรับนักเรียน ปวช. 1
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          สรุปสาระสำคัญของพระราชบัญญัติคุ้มครองแรงงาน พ.ศ. 2541 และที่แก้ไขเพิ่มเติม เน้นสิทธิของเด็กช่างและนักศึกษาฝึกงาน
        </p>
      </div>

      {/* Interactive Wage & OT Calculator */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            เครื่องคำนวณค่าจ้างและค่าล่วงเวลา (OT Calculator) สำหรับเด็ก ปวช.
          </h2>
          <span className="text-[11px] text-indigo-300">อิงตาม ม. 61 - 63</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[11px] text-indigo-200 block mb-1">เงินเดือน / ค่าจ้างเฉลี่ย (บาท/เดือน):</label>
            <input
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(Number(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-mono font-bold focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-[11px] text-indigo-200 block mb-1">จำนวนชั่วโมงที่ทำงานล่วงเวลา (ชม.):</label>
            <input
              type="number"
              value={otHours}
              onChange={(e) => setOtHours(Number(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-mono font-bold focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-[11px] text-slate-300">อัตราค่าจ้างต่อชั่วโมง:</div>
            <div className="text-base font-extrabold text-white font-mono mt-0.5">
              {hourlyRate.toFixed(2)} บาท/ชม.
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">(คิดจาก 30 วัน วันละ 8 ชม.)</div>
          </div>

          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
            <div className="text-[11px] text-amber-300 font-semibold">OT วันทำงานปกติ (1.5 เท่า):</div>
            <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
              +{ot15.toFixed(2)} บาท
            </div>
            <div className="text-[10px] text-indigo-200 mt-0.5">หากเป็น OT วันหยุด (3 เท่า): {holidayOt3.toFixed(2)} บ.</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ค้นหามาตรากฎหมาย เช่น ม. 47, ม. 76, หักค่าจ้าง, วันหยุด, ลาป่วย, ค่าชดเชย..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Law Articles Accordion / Cards */}
      <div className="space-y-6">
        {filteredSections.map((section, sIdx) => (
          <div key={sIdx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              {section.category}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.articles.map((art, aIdx) => (
                <div
                  key={aIdx}
                  className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2 text-xs hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded text-[11px]">
                      {art.number}
                    </span>
                    <span className="font-bold text-slate-900">{art.title}</span>
                  </div>

                  <p className="text-slate-600 leading-relaxed font-['Sarabun',sans-serif] whitespace-pre-line">
                    {art.summary}
                  </p>

                  <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 rounded-lg text-emerald-900 text-[11px] leading-relaxed">
                    <span className="font-bold text-emerald-800">💡 การนำไปใช้จริง: </span>
                    {art.practicalRule}
                  </div>

                  {art.penalty && (
                    <div className="text-[10px] text-rose-700 font-medium">
                      ⚠️ โทษนายจ้าง: {art.penalty}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
