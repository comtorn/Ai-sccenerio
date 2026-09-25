import { LessonPlanWeek, Scenario } from '../types';

export function parseSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Check if it's a URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function listUserDriveSpreadsheets(accessToken: string): Promise<Array<{ id: string; name: string; webViewLink?: string; modifiedTime?: string }>> {
  try {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.append('q', "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    url.searchParams.append('fields', 'files(id, name, webViewLink, modifiedTime)');
    url.searchParams.append('orderBy', 'modifiedTime desc');
    url.searchParams.append('pageSize', '20');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json();
      console.warn('Failed to list drive files:', err);
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.warn('Error listing spreadsheets:', error);
    return [];
  }
}

export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'ไม่สามารถเข้าถึง Google Sheet นี้ได้');
  }

  const data = await res.json();
  const tabs = data.sheets?.map((s: any) => s.properties?.title as string) || [];
  return {
    id: data.spreadsheetId,
    title: data.properties?.title,
    url: data.spreadsheetUrl,
    tabs,
  };
}

export async function createCurriculumSpreadsheet(
  accessToken: string,
  title: string,
  lessonPlans: LessonPlanWeek[],
  scenarios: Scenario[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  // 1. Create spreadsheet with multiple tabs
  const payload = {
    properties: {
      title: title || 'แผนการสอนและคลังข้อพิพาทกฎหมายแรงงาน_ปวช1',
    },
    sheets: [
      {
        properties: {
          title: 'แผนการจัดการเรียนรู้ 18 สัปดาห์',
          gridProperties: { rowCount: 50, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'คลังสถานการณ์ข้อพิพาท ปวช.1',
          gridProperties: { rowCount: 100, columnCount: 12 },
        },
      },
      {
        properties: {
          title: 'เกณฑ์การประเมินรูบริก',
          gridProperties: { rowCount: 40, columnCount: 8 },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Sheet ได้');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Populate Tab 1: Lesson Plans
  const lessonPlanRows = [
    [
      'สัปดาห์ที่ (Week)',
      'หน่วยการเรียนรู้ (Unit)',
      'หัวข้อเรื่อง (Topic)',
      'จุดประสงค์การเรียนรู้ (Learning Objectives)',
      'มาตรากฎหมายที่เกี่ยวข้อง (Key Laws)',
      'สถานการณ์จำลองตัวอย่าง (Suggested Scenario)',
      'กิจกรรมการเรียนรู้ Active Learning',
      'วิธีการวัดและประเมินผล (Assessment)',
    ],
    ...lessonPlans.map((lp) => [
      lp.weekNumber,
      lp.unitName,
      lp.topic,
      lp.learningObjectives,
      lp.keyLaws,
      lp.suggestedScenario,
      lp.learningActivity,
      lp.assessmentMethod,
    ]),
  ];

  // 3. Populate Tab 2: Scenarios
  const scenarioRows = [
    [
      'รหัสสถานการณ์ (ID)',
      'ชื่อคดี/ข้อพิพาท (Title)',
      'สาขาวิชาชีพ (Field)',
      'สถานที่เกิดเหตุ (Workplace)',
      'ตัวละคร (Characters)',
      'เนื้อเรื่องจำลอง (Story)',
      'ข้อเรียกร้องลูกจ้าง (Employee Claim)',
      'ข้อต่อสู้นายจ้าง (Employer Claim)',
      'มาตรากฎหมาย (Laws)',
      'คำวินิจฉัยชี้ขาด (Verdict)',
      'คำถามท้ายใบงาน (Questions)',
      'คำแนะนำแก่นักเรียนอาชีวะ (Vocational Advice)',
    ],
    ...scenarios.map((sc) => [
      sc.id,
      sc.title,
      sc.vocationalField,
      sc.workplace,
      sc.characters.map((c) => `${c.name} (${c.role})`).join(', '),
      sc.story,
      sc.dispute?.employeeClaim || '',
      sc.dispute?.employerClaim || '',
      sc.applicableLaws?.map((l) => `${l.article}: ${l.lawName}`).join('; ') || '',
      sc.verdict?.conclusion || '',
      sc.studentActivity?.questions?.join(' | ') || '',
      sc.verdict?.practicalAdvice || '',
    ]),
  ];

  // 4. Populate Tab 3: Rubric
  const rubricRows = [
    [
      'มิติการประเมิน (Criteria)',
      'น้ำหนัก (Weight)',
      'ดีเยี่ยม (4 คะแนน)',
      'ดี (3 คะแนน)',
      'พอใช้ (2 คะแนน)',
      'ต้องปรับปรุง (1 คะแนน)',
    ],
    [
      '1. การระบุข้อเท็จจริงในข้อพิพาท',
      '20%',
      'ระบุคู่กรณีและเหตุการณ์ขัดแย้งได้อย่างครบถ้วนและแม่นยำ',
      'ระบุคู่กรณีและประเด็นสำคัญได้เป็นส่วนใหญ่',
      'ระบุประเด็นได้บางส่วน ขาดรายละเอียดสำคัญ',
      'ไม่สามารถระบุข้อเท็จจริงหลักได้ถูกต้อง',
    ],
    [
      '2. การปรับใช้มาตรากฎหมายแรงงาน',
      '30%',
      'อ้างอิงมาตรากฎหมายได้ถูกต้องตรงประเด็นและอธิบายสาระสำคัญได้ชัดเจน',
      'อ้างอิงมาตรากฎหมายได้ถูกต้อง แต่คำอธิบายยังไม่สมบูรณ์',
      'อ้างอิงกฎหมายคลาดเคลื่อนเล็กน้อย หรืออ้างได้ไม่ครบ',
      'ไม่อ้างอิงกฎหมายหรือระบุมาตราผิด',
    ],
    [
      '3. การให้เหตุผลและการวินิจฉัย',
      '30%',
      'ให้เหตุผลสนับสนุนคำตัดสินได้อย่างเป็นระบบ เป็นธรรม และสอดคล้องกับหลักนิติศาสตร์',
      'ให้เหตุผลได้สมเหตุสมผลตามหลักเกณฑ์ทั่วไป',
      'ให้เหตุผลยังไม่ชัดเจน หรือมีอคติฝ่ายใดฝ่ายหนึ่ง',
      'ไม่มีเหตุผลรองรับข้อสรุป',
    ],
    [
      '4. ข้อเสนอแนะเชิงวิชาชีพและการป้องกัน',
      '20%',
      'เสนอแนะแนวทางแก้ไขอย่างสร้างสรรค์และวิธีป้องกันปัญหาในการฝึกงานได้อย่างเป็นรูปธรรม',
      'เสนอแนะแนวทางได้ดี ปฏิบัติได้จริง',
      'เสนอแนะทางออกทั่วไป ยังไม่ตรงกับสายวิชาชีพ',
      'ไม่มีข้อเสนอแนะในการปรับปรุง',
    ],
  ];

  // Batch update values
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: "'แผนการจัดการเรียนรู้ 18 สัปดาห์'!A1",
          values: lessonPlanRows,
        },
        {
          range: "'คลังสถานการณ์ข้อพิพาท ปวช.1'!A1",
          values: scenarioRows,
        },
        {
          range: "'เกณฑ์การประเมินรูบริก'!A1",
          values: rubricRows,
        },
      ],
    }),
  });

  return {
    spreadsheetId,
    spreadsheetUrl: sheetData.spreadsheetUrl,
    title: sheetData.properties?.title,
  };
}

export async function readLessonPlansFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string = 'แผนการจัดการเรียนรู้ 18 สัปดาห์'
): Promise<LessonPlanWeek[]> {
  const encodedRange = encodeURIComponent(`'${sheetTitle}'!A1:H100`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'ไม่สามารถอ่านข้อมูลแผนการสอนได้');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];
  if (rows.length <= 1) return [];

  const items: LessonPlanWeek[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || !r[0]) continue;
    items.push({
      weekNumber: parseInt(r[0]) || i,
      unitName: r[1] || `หน่วยที่ ${i}`,
      topic: r[2] || '',
      learningObjectives: r[3] || '',
      keyLaws: r[4] || '',
      suggestedScenario: r[5] || '',
      learningActivity: r[6] || '',
      assessmentMethod: r[7] || '',
    });
  }

  return items;
}

export async function syncLessonPlansToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  lessonPlans: LessonPlanWeek[]
) {
  const rows = [
    [
      'สัปดาห์ที่ (Week)',
      'หน่วยการเรียนรู้ (Unit)',
      'หัวข้อเรื่อง (Topic)',
      'จุดประสงค์การเรียนรู้ (Learning Objectives)',
      'มาตรากฎหมายที่เกี่ยวข้อง (Key Laws)',
      'สถานการณ์จำลองตัวอย่าง (Suggested Scenario)',
      'กิจกรรมการเรียนรู้ Active Learning',
      'วิธีการวัดและประเมินผล (Assessment)',
    ],
    ...lessonPlans.map((lp) => [
      lp.weekNumber,
      lp.unitName,
      lp.topic,
      lp.learningObjectives,
      lp.keyLaws,
      lp.suggestedScenario,
      lp.learningActivity,
      lp.assessmentMethod,
    ]),
  ];

  const encodedRange = encodeURIComponent(`'${sheetTitle}'!A1:H${rows.length}`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'บันทึกแผนงานลงชีตไม่สำเร็จ');
  }

  return true;
}

export async function appendScenarioToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  sc: Scenario
) {
  const row = [
    sc.id,
    sc.title,
    sc.vocationalField,
    sc.workplace,
    sc.characters.map((c) => `${c.name} (${c.role})`).join(', '),
    sc.story,
    sc.dispute?.employeeClaim || '',
    sc.dispute?.employerClaim || '',
    sc.applicableLaws?.map((l) => `${l.article}: ${l.lawName}`).join('; ') || '',
    sc.verdict?.conclusion || '',
    sc.studentActivity?.questions?.join(' | ') || '',
    sc.verdict?.practicalAdvice || '',
  ];

  const encodedRange = encodeURIComponent(`'${sheetTitle}'!A:L`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'เพิ่มสถานการณ์ลงชีตไม่สำเร็จ');
  }

  return true;
}
