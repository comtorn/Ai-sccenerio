import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for Thai Vocational Labor Law
const LABOR_LAW_SYSTEM_INSTRUCTION = `คุณคือผู้เชี่ยวชาญด้านกฎหมายแรงงานไทย (พระราชบัญญัติคุ้มครองแรงงาน พ.ศ. 2541 และที่แก้ไขเพิ่มเติม, พ.ร.บ.เงินทดแทน, พ.ร.บ.ประกันสังคม, พ.ร.บ.แรงงานสัมพันธ์) และเป็นอาจารย์ผู้เชี่ยวชาญการออกแบบการเรียนการสอนสำหรับนักเรียนอาชีวศึกษา ระดับประกาศนียบัตรวิชาชีพ ชั้นปีที่ 1 (ปวช. 1)

แนวทางการสร้างสถานการณ์จำลอง (Scenario Generator):
1. สถานการณ์ต้องสมจริง สอดคล้องกับบริบทของนักศึกษา ปวช. และสถานประกอบการจริง (เช่น โรงงาน, อู่ซ่อมรถ, ร้านอาหาร, โรงแรม, แผนกบัญชี, ก่อสร้าง, ร้านสะดวกซื้อ, ร้านไอที)
2. ภาษาที่ใช้ในเรื่องราวต้องน่าติดตาม เข้าใจง่ายสำหรับเด็ก ปวช.1 ไม่ใช้ศัพท์กฎหมายที่ซับซ้อนเกินไป แต่ระบุมาตรากฎหมายและหลักการได้อย่างถูกต้องแม่นยำ
3. มีความขัดแย้งที่ชัดเจนระหว่างนายจ้างและลูกจ้าง ชวนให้นักเรียนได้คิดวิเคราะห์และถกเถียง
4. อ้างอิงมาตรากฎหมายที่ถูกต้องเสมอ เช่น:
   - ม. 17 (การบอกกล่าวล่วงหน้าเลิกจ้าง)
   - ม. 22-23 (เวลาทำงานปกติ ไม่เกิน 8 ชม./วัน หรือ 48 ชม./สัปดาห์, งานอันตรายไม่เกิน 7 ชม./วัน หรือ 42 ชม./สัปดาห์)
   - ม. 24 (การทำงานล่วงเวลาต้องได้รับความยินยอมล่วงหน้า)
   - ม. 27 (เวลาพักระหว่างทำงาน ไม่น้อยกว่า 1 ชั่วโมงต่อวัน หลังทำงาน 5 ชม.)
   - ม. 28-30 (วันหยุดประจำสัปดาห์, วันหยุดตามประเพณี, วันหยุดพักผ่อนประจำปี)
   - ม. 31-36 (วันลาป่วย 30 วันทำงานมีค่าจ้าง, วันลากิจ, วันลาคลอด 98 วัน)
   - ม. 44-52 (การคุ้มครองแรงงานเด็ก ห้ามจ้างต่ำกว่า 15 ปี, อายุ 15-18 ปีต้องแจ้งพนักงานตรวจแรงงาน, ห้ามทำ OT/วันหยุด, ห้ามทำงานอันตราย)
   - ม. 61-63 (อัตราค่าล่วงเวลา 1.5 เท่า, ค่าทำงานวันหยุด 1-2 เท่า, ค่าล่วงเวลาวันหยุด 3 เท่า)
   - ม. 118 (อัตราค่าชดเชยการเลิกจ้างตามอายุงาน 30 วัน - 400 วัน)
   - ม. 119 (ข้อยกเว้นที่นายจ้างไม่ต้องจ่ายค่าชดเชย เช่น ทุจริต จงใจทำให้นายจ้างเสียหาย ละทิ้งหน้าที่ 3 วันติดต่อกัน)
   - พ.ร.บ.เงินทดแทน (ประสบอันตรายเนื่องจากการทำงาน)
   - พ.ร.บ.ประกันสังคม (7 กรณี)`;

// API: Generate Scenario
app.post('/api/ai/generate-scenario', async (req, res) => {
  try {
    const {
      unitTitle = 'เวลาทำงาน วันหยุด และการทำงานล่วงเวลา (OT)',
      lawTopic = 'การคำนวณค่าล่วงเวลาและข้อบังคับการทำงาน',
      vocationalField = 'ช่างยนต์',
      difficulty = 'ปวช.1 ระดับมาตรฐาน',
      focusIssues = '',
      studentAgeGroup = 'ปวช. 1 (อายุประมาณ 15-16 ปี)',
    } = req.body;

    const prompt = `จงสร้างสถานการณ์จำลองข้อพิพาทแรงงาน 1 เรื่อง สำหรับรายวิชากฎหมายแรงงาน ปวช. 1
ข้อมูลเบื้องต้น:
- หน่วยการเรียนรู้: ${unitTitle}
- ประเด็นกฎหมาย: ${lawTopic}
- สาขาวิชาชีพของนักเรียน: ${vocationalField}
- ระดับความยาก: ${difficulty}
- บริบทกลุ่มผู้เรียน: ${studentAgeGroup}
- ความต้องการเพิ่มเติมจากผู้สอน: ${focusIssues || 'เน้นการปรับใช้ในชีวิตจริงและการฝึกงาน'}

จงส่งผลลัพธ์เป็น JSON ตาม Schema ที่กำหนด`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: LABOR_LAW_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING, description: 'ชื่อสถานการณ์ที่น่าสนใจและดึงดูดใจวัยรุ่น ปวช.' },
            vocationalField: { type: Type.STRING, description: 'สาขาวิชาชีพที่เกี่ยวข้อง' },
            workplace: { type: Type.STRING, description: 'สถานที่เกิดเหตุ เช่น อู่ซ่อมรถสปีดคาร์, โรงแรมริเวอร์วิว' },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING, description: 'ตำแหน่ง เช่น ลูกจ้างฝึกงาน, หัวหน้าช่าง, ผู้จัดการ' },
                  detail: { type: Type.STRING, description: 'บุคลิกหรือข้อมูลสำคัญ เช่น อายุ 16 ปี ทำงานมา 7 เดือน' },
                },
                required: ['name', 'role', 'detail'],
              },
            },
            story: { type: Type.STRING, description: 'เนื้อเรื่องสถานการณ์จำลอง ละเอียด มีลำดับเหตุการณ์ชัดเจน 3-4 ย่อหน้า' },
            dispute: {
              type: Type.OBJECT,
              properties: {
                triggerEvent: { type: Type.STRING, description: 'เหตุการณ์จุดชนวนข้อพิพาท' },
                employeeClaim: { type: Type.STRING, description: 'ข้อเรียกร้องหรือเหตุผลของฝ่ายลูกจ้าง' },
                employerClaim: { type: Type.STRING, description: 'เหตุผลหรือข้อโต้แย้งของฝ่ายนายจ้าง' },
              },
              required: ['triggerEvent', 'employeeClaim', 'employerClaim'],
            },
            keyLegalIssues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'ประเด็นข้อกฎหมายหลักที่ต้องพิจารณา 2-3 ข้อ',
            },
            applicableLaws: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  lawName: { type: Type.STRING, description: 'ชื่อ พ.ร.บ. เช่น พระราชบัญญัติคุ้มครองแรงงาน พ.ศ. 2541' },
                  article: { type: Type.STRING, description: 'มาตรา เช่น มาตรา 24 หรือ มาตรา 61' },
                  contentSummary: { type: Type.STRING, description: 'สาระสำคัญของมาตรานี้' },
                  application: { type: Type.STRING, description: 'การนำมาปรับใช้กับกรณีนี้โดยตรง' },
                },
                required: ['lawName', 'article', 'contentSummary', 'application'],
              },
            },
            verdict: {
              type: Type.OBJECT,
              properties: {
                conclusion: { type: Type.STRING, description: 'คำวินิจฉัยชี้ขาดตามกฎหมาย (ฝ่ายใดถูก/ผิด)' },
                reasoning: { type: Type.STRING, description: 'เหตุผลทางนิติศาสตร์และการคุ้มครองแรงงาน' },
                legalRemedy: { type: Type.STRING, description: 'ผลทางกฎหมาย เช่น นายจ้างต้องจ่ายเงินเท่าใด หรือมีโทษปรับอย่างไร' },
                practicalAdvice: { type: Type.STRING, description: 'คำแนะนำแก่นักเรียน ปวช. เพื่อป้องกันปัญหาเมื่อเข้าสู่ตลาดแรงงานจริง' },
              },
              required: ['conclusion', 'reasoning', 'legalRemedy', 'practicalAdvice'],
            },
            studentActivity: {
              type: Type.OBJECT,
              properties: {
                instruction: { type: Type.STRING, description: 'คำสั่งใบงานสำหรับนักศึกษา ปวช.1' },
                questions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'คำถามท้ายสถานการณ์ 3 ข้อ'
                },
                roleplayChoices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      choiceText: { type: Type.STRING, description: 'แนวทางการตัดสินใจของตัวละคร' },
                      consequence: { type: Type.STRING, description: 'ผลลัพธ์ที่จะเกิดขึ้นตามกฎหมาย' },
                      isLegallyCorrect: { type: Type.BOOLEAN },
                    },
                    required: ['id', 'choiceText', 'consequence', 'isLegallyCorrect'],
                  },
                },
              },
              required: ['instruction', 'questions', 'roleplayChoices'],
            },
            rubric: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criteriaName: { type: Type.STRING, description: 'เกณฑ์การให้คะแนน เช่น การระบุข้อเท็จจริง' },
                  weight: { type: Type.STRING, description: 'เช่น 25%' },
                  excellentLevel: { type: Type.STRING, description: 'เกณฑ์คะแนนดีเยี่ยม (4 คะแนน)' },
                  goodLevel: { type: Type.STRING, description: 'เกณฑ์คะแนนดี (3 คะแนน)' },
                  fairLevel: { type: Type.STRING, description: 'เกณฑ์คะแนนพอใช้ (2 คะแนน)' },
                  needsImprovement: { type: Type.STRING, description: 'เกณฑ์คะแนนปรับปรุง (1 คะแนน)' },
                },
                required: ['criteriaName', 'weight', 'excellentLevel', 'goodLevel', 'fairLevel', 'needsImprovement'],
              },
            },
          },
          required: [
            'id',
            'title',
            'vocationalField',
            'workplace',
            'characters',
            'story',
            'dispute',
            'keyLegalIssues',
            'applicableLaws',
            'verdict',
            'studentActivity',
            'rubric',
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    if (!parsedData.id) {
      parsedData.id = 'SCENARIO-' + Date.now();
    }
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error generating scenario:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate scenario',
    });
  }
});

// API: Evaluate Student Verdict / Answer
app.post('/api/ai/evaluate-verdict', async (req, res) => {
  try {
    const {
      scenarioTitle,
      story,
      applicableLaws,
      studentRole = 'พนักงานตรวจแรงงาน',
      studentVerdictChoice,
      studentReasoning,
    } = req.body;

    const prompt = `ให้นักเรียน ปวช. 1 ตอบคำถามหรือเขียนคำวินิจฉัยในคดีข้อพิพาทแรงงานเรื่อง: "${scenarioTitle}"
เรื่องราวโดยย่อ: ${story}
กฎหมายที่เกี่ยวข้อง: ${JSON.stringify(applicableLaws)}

คำตอบของนักเรียน:
- สวมบทบาทเป็น: ${studentRole}
- ข้อตัดสิน/การเลือก: ${studentVerdictChoice || 'ไม่ได้เลือกตัวเลือก'}
- เหตุผลและคำอธิบายของนักเรียน: "${studentReasoning}"

จงประเมินและให้ข้อเสนอแนะเชิงสร้างสรรค์สำหรับนักศึกษาอาชีวะ (ปวช.1) ในรูปแบบ JSON`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: LABOR_LAW_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: 'คะแนนเต็ม 100' },
            grade: { type: Type.STRING, description: 'เช่น ดีเยี่ยม, ดีมาก, ผ่าน, ต้องปรับปรุง' },
            verdictAccuracy: { type: Type.STRING, description: 'ประเมินว่าชี้ถูกฝ่ายหรือไม่' },
            lawApplicationFeedback: { type: Type.STRING, description: 'การนำมาตรากฎหมายมาอ้างอิงของนักเรียน' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'จุดเด่นในคำตอบของนักเรียน'
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'สิ่งที่ต้องแก้ไขหรือควรศึกษาเพิ่ม'
            },
            vocationalTip: { type: Type.STRING, description: 'ข้อคิดเตือนใจสำหรับการไปทำงานหรือฝึกงานจริง' },
            encouragement: { type: Type.STRING, description: 'คำชื่นชมและให้กำลังใจ' },
          },
          required: [
            'score',
            'grade',
            'verdictAccuracy',
            'lawApplicationFeedback',
            'strengths',
            'improvements',
            'vocationalTip',
            'encouragement',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error evaluating verdict:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to evaluate answer',
    });
  }
});

// API: Generate Weekly Lesson Plan / Units
app.post('/api/ai/generate-lesson-plan', async (req, res) => {
  try {
    const { courseTitle = 'กฎหมายแรงงาน (Labor Law)', totalWeeks = 18, specialEmphasis = '' } = req.body;

    const prompt = `จงออกแบบแผนการจัดการเรียนรู้ 18 สัปดาห์ สำหรับรายวิชากฎหมายแรงงาน รหัสวิชา 20001-1004 หรือเทียบเท่า สำหรับนักเรียนระดับ ปวช. 1
เน้นการจัดการเรียนรู้เชิงรุก (Active Learning) ด้วยสถานการณ์จำลอง (Scenario-Based Learning)
ข้อกำหนดเพิ่มเติม: ${specialEmphasis || 'เน้นการเตรียมความพร้อมก่อนฝึกงานและสิทธิแรงงานในสถานประกอบการ'}

สร้างแผนการสอนครบทุกหน่วยและสัปดาห์ในรูปแบบ JSON`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: LABOR_LAW_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseCode: { type: Type.STRING },
            courseName: { type: Type.STRING },
            credits: { type: Type.STRING },
            description: { type: Type.STRING },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.NUMBER },
                  unitName: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  learningObjectives: { type: Type.STRING },
                  keyLaws: { type: Type.STRING },
                  suggestedScenario: { type: Type.STRING },
                  learningActivity: { type: Type.STRING },
                  assessmentMethod: { type: Type.STRING },
                },
                required: [
                  'weekNumber',
                  'unitName',
                  'topic',
                  'learningObjectives',
                  'keyLaws',
                  'suggestedScenario',
                  'learningActivity',
                  'assessmentMethod',
                ],
              },
            },
          },
          required: ['courseCode', 'courseName', 'credits', 'description', 'weeks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating lesson plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate lesson plan',
    });
  }
});

// Setup Vite in Dev or serve static in Prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
