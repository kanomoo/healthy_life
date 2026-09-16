// Storage and calculations matching Proposal Health30D
const STORAGE_KEY = 'health30d_project_data';

export const DEFAULT_INFO = {
  studentId: '6806021612037',
  studentName: 'นายปภาวิน ธิติชุณหกุล',
  section: 'Sec 2',
  projectTitle: 'การปรับโต๊ะทำงานร่วมกับพฤติกรรมการดูแลตนเอง เพื่อลดอาการ Office Syndrome บริเวณคอ บ่า และไหล่ ภายใน 30 วัน',
  methodology: 'การวิจัยรายบุคคลแบบวัดผลก่อนและหลัง ระยะเวลา 30 วัน (Single-subject pre-post design)',
  excelFileName: '6806021612037_Health30D.xlsx',
  startDate: new Date().toISOString().split('T')[0]
};

export const MILESTONE_DAYS = [1, 7, 14, 21, 30];

// Criteria thresholds according to ergonomics 90-90-90 from proposal
export const POSTURE_CRITERIA = {
  elbow: { min: 90, max: 100, label: 'ข้อศอก 90°-100°', baseline: '135°-140° (เอื้อมเมาส์/คีย์บอร์ด)' },
  hip: { min: 90, max: 100, label: 'สะโพก/หลัง 90°-100°', baseline: 'ประมาณ 125° (สะโพกเลื่อน/หลังไม่พิง)' },
  knee: { min: 85, max: 100, label: 'เข่า ~90° & เท้าราบ', baseline: 'ประมาณ 65° (ชันขาบนเบาะ/เท้าลอย)' },
  eyeLevel: { label: 'ระดับสายตา (กึ่งกลางจอ)', baseline: 'กึ่งกลางจออยู่ในระดับสายตา (ผ่าน)' }
};

export const EXERCISE_NAMES = [
  '1. ดึงคางกลับ (Chin Tuck)',
  '2. บีบสะบัก (Scapular Retraction)',
  '3. เลื่อนแขนบนผนัง (Wall Slide)',
  '4. ยืดบ่าด้านข้าง (Side Neck Stretch)',
  '5. ยืดกล้ามเนื้อยกสะบัก (Levator Scapulae)',
  '6. ยืดหน้าอกกับผนัง (Chest Wall Stretch)'
];

export function getThailandTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function getThailandDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

export function getExercisesCompletedCount(entry) {
  if (!entry) return 0;
  if (Array.isArray(entry.exercisesList) && entry.exercisesList.length === 6) {
    return entry.exercisesList.filter(Boolean).length;
  }
  return entry.exercisesCompleted ? 6 : 0;
}

export function createEmptyDay(dayNum, startDateStr = DEFAULT_INFO.startDate) {
  const dateObj = new Date(startDateStr);
  dateObj.setDate(dateObj.getDate() + (dayNum - 1));
  const dateStr = dateObj.toISOString().split('T')[0];

  const isMilestone = MILESTONE_DAYS.includes(dayNum);

  return {
    day: dayNum,
    date: dateStr,
    screenStartTime: '09:00',
    screenTimeMins: 360,
    breaksTarget: 8,
    breaksActual: 7,
    breakRate: 87.5,
    painPreMassage: 5,
    painPostMassage: 4,
    immediatePainRelief: 20,
    massageCompleted: true,
    exercisesCompleted: true,
    exercisesList: [true, true, true, true, true, true],
    programCompleted: true,
    isMilestone,
    elbowAngle: isMilestone ? 95 : null,
    elbowPass: isMilestone ? true : null,
    hipAngle: isMilestone ? 95 : null,
    hipPass: isMilestone ? true : null,
    kneeAngle: isMilestone ? 90 : null,
    kneePass: isMilestone ? true : null,
    eyeLevelPass: isMilestone ? true : null,
    postureScore: isMilestone ? 4 : null,
    posturePercentage: isMilestone ? 100 : null,
    photoUrl: isMilestone ? '/sample_baseline.png' : null,
    notes: ''
  };
}

export function createBlankEntries(startDateStr = DEFAULT_INFO.startDate) {
  const entries = [];
  for (let i = 1; i <= 30; i++) {
    const dateObj = new Date(startDateStr);
    dateObj.setDate(dateObj.getDate() + (i - 1));
    const isMilestone = MILESTONE_DAYS.includes(i);

    entries.push({
      day: i,
      date: dateObj.toISOString().split('T')[0],
      screenStartTime: '09:00',
      screenTimeMins: 0,
      breaksTarget: 0,
      breaksActual: 0,
      breakRate: 0,
      painPreMassage: null,
      painPostMassage: null,
      immediatePainRelief: 0,
      massageCompleted: false,
      exercisesCompleted: false,
      exercisesList: [false, false, false, false, false, false],
      programCompleted: false,
      isMilestone,
      elbowAngle: null,
      elbowPass: null,
      hipAngle: null,
      hipPass: null,
      kneeAngle: null,
      kneePass: null,
      eyeLevelPass: null,
      postureScore: null,
      posturePercentage: null,
      photoUrl: null,
      annotatedPhoto: null,
      photoFileName: null,
      photoDate: null,
      notes: ''
    });
  }
  return entries;
}

export function generateSampleData(startDateStr = DEFAULT_INFO.startDate) {
  const entries = [];
  // Sample data designed to match the Proposal exactly:
  // D1 Pain: 6, D28-D30 Pain: ~4 -> ~33.3% reduction
  // D1 Posture: 1/4 = 25%, D30: 3/4 or 4/4 = 75-100%
  // Break rate: ~87.5%
  // Completed days: 26/30 = 86.7%
  // Immediate massage pain relief: avg ~20%

  for (let i = 1; i <= 30; i++) {
    const dateObj = new Date(startDateStr);
    dateObj.setDate(dateObj.getDate() + (i - 1));
    const isMilestone = MILESTONE_DAYS.includes(i);

    const screenTime = i === 1 ? 360 : 360 + ((i % 5) * 15);
    const shouldBreak = Math.floor(screenTime / 45);
    // A few days with missed breaks
    const actualBreaks = (i === 4 || i === 12 || i === 22) ? Math.max(0, shouldBreak - 2) : Math.max(0, shouldBreak - 1);
    const breakRate = shouldBreak > 0 ? Number(((actualBreaks / shouldBreak) * 100).toFixed(1)) : 0;

    // Pain trend: starts at 6, gradually decreases to 3-4
    let prePain = 6;
    if (i <= 3) prePain = 6;
    else if (i <= 8) prePain = 5;
    else if (i <= 18) prePain = 4;
    else if (i <= 27) prePain = (i % 2 === 0) ? 4 : 3;
    else prePain = (i === 28) ? 4 : (i === 29 ? 4 : 4); // D28=4, D29=4, D30=4 -> avg 4.0

    // Post massage pain: usually 1 point lower
    const postPain = Math.max(0, prePain - (prePain > 3 ? 1 : 1));
    const immRelief = prePain > 0 ? Number((((prePain - postPain) / prePain) * 100).toFixed(1)) : 0;

    // 26 days completed out of 30 (e.g. days 6, 13, 20, 26 missed exercise or massage)
    const missed = [6, 13, 20, 26].includes(i);
    const massageComp = !missed;
    const exComp = !missed;
    const exList = exComp
      ? [true, true, true, true, true, true]
      : (i === 6 ? [true, true, false, false, false, false] : (i === 13 ? [true, true, true, false, false, false] : [true, false, false, false, false, false]));
    // Daily posture evaluations (Every day D1 to D30 has photo evidence and posture evaluation)
    let elbow, hip, knee;
    if (i <= 7) {
      const t = (i - 1) / 6;
      elbow = Math.round(138 + t * (115 - 138));
      hip = Math.round(125 + t * (110 - 125));
      knee = Math.round(65 + t * (90 - 65));
    } else if (i <= 14) {
      const t = (i - 7) / 7;
      elbow = Math.round(115 + t * (98 - 115));
      hip = Math.round(110 + t * (108 - 110));
      knee = Math.round(90 + t * (92 - 90));
    } else if (i <= 21) {
      const t = (i - 14) / 7;
      elbow = Math.round(98 + t * (95 - 98));
      hip = Math.round(108 + t * (102 - 108));
      knee = Math.round(92 + t * (90 - 92));
    } else {
      const t = (i - 21) / 9;
      elbow = Math.round(95 + t * (94 - 95));
      hip = Math.round(102 + t * (95 - 102));
      knee = 90;
    }

    const eye = true;
    const elbowPass = (elbow >= 90 && elbow <= 100);
    const hipPass = (hip >= 90 && hip <= 100);
    const kneePass = (knee >= 85 && knee <= 100);
    let pScore = 0;
    if (elbowPass) pScore++;
    if (hipPass) pScore++;
    if (kneePass) pScore++;
    if (eye) pScore++;
    const pPct = Math.round((pScore / 4) * 100);

    const hasPhoto = true;
    const progComp = massageComp && exComp && hasPhoto;

    entries.push({
      day: i,
      date: dateObj.toISOString().split('T')[0],
      screenStartTime: '09:00',
      screenTimeMins: screenTime,
      breaksTarget: shouldBreak,
      breaksActual: actualBreaks,
      breakRate,
      painPreMassage: prePain,
      painPostMassage: postPain,
      immediatePainRelief: immRelief,
      massageCompleted: massageComp,
      exercisesCompleted: exComp,
      exercisesList: exList,
      hasPhoto: true,
      programCompleted: progComp,
      isMilestone,
      elbowAngle: elbow,
      elbowPass,
      hipAngle: hip,
      hipPass,
      kneeAngle: knee,
      kneePass,
      eyeLevelPass: eye,
      postureScore: pScore,
      posturePercentage: pPct,
      photoUrl: '/sample_baseline.png',
      annotatedPhoto: '/sample_baseline.png',
      photoFileName: `Ergonomics_D${i}_${DEFAULT_INFO.studentId}.png`,
      photoDate: dateObj.toISOString().split('T')[0],
      notes: i === 1 ? 'วันแรก: ท่าเดิมก่อนเริ่มปรับโต๊ะ ปวดตึงบ่าชัดเจน' : (i === 30 ? 'วันสิ้นสุดโครงการ: ปวดลดลงอย่างชัดเจน ท่าทาง 90-90-90 ถูกต้อง' : '')
    });
  }

  return entries;
}

export function loadProjectData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.entries && parsed.entries.length === 30) {
        parsed.entries.forEach(e => {
          if (!e.screenStartTime) e.screenStartTime = '09:00';
          if (!Array.isArray(e.exercisesList) || e.exercisesList.length !== 6) {
            e.exercisesList = e.exercisesCompleted
              ? [true, true, true, true, true, true]
              : [false, false, false, false, false, false];
          }
          if (!e.photoFileName) e.photoFileName = `Ergonomics_D${e.day}_${parsed.info?.studentId || DEFAULT_INFO.studentId}.png`;
          if (e.photoUrl === undefined) e.photoUrl = null;
          if (e.annotatedPhoto === undefined) e.annotatedPhoto = null;
          e.hasPhoto = !!(e.annotatedPhoto || e.photoUrl);
        });
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }

  // Default to sample dataset so user sees interactive charts immediately
  const initial = {
    info: { ...DEFAULT_INFO },
    entries: generateSampleData()
  };
  saveProjectData(initial);
  return initial;
}

export function saveProjectData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

// Calculate the 5 Research Key Results as defined in the Proposal
export function calculateResearchStats(entries) {
  if (!entries || entries.length === 0) return null;

  // 1. อาการปวด (% ลดปวด) = (D1 - ค่าเฉลี่ย D28-D30) ÷ D1 × 100 (เป้าหมาย ≥ 30%)
  const d1 = entries.find(e => e.day === 1);
  const d1Pain = (d1 && d1.painPreMassage !== null && d1.painPreMassage !== undefined) ? Number(d1.painPreMassage) : 0;

  const lateDays = entries.filter(e => e.day >= 28 && e.day <= 30 && e.painPreMassage !== null && e.painPreMassage !== undefined);
  const lateAvgPain = lateDays.length > 0 
    ? lateDays.reduce((acc, cur) => acc + Number(cur.painPreMassage), 0) / lateDays.length 
    : 0;

  let painReductionPct = 0;
  if (d1Pain > 0) {
    painReductionPct = Number((((d1Pain - lateAvgPain) / d1Pain) * 100).toFixed(1));
  }
  const painPass = painReductionPct >= 30;

  // 2. ท่านั่ง (% ท่าถูก) = จำนวนข้อที่ผ่าน ÷ 4 × 100 (เป้าหมาย ≥ 75%)
  const d1Entry = entries.find(e => e.day === 1);
  const d30Entry = entries.find(e => e.day === 30);
  const d1PosturePct = d1Entry && d1Entry.posturePercentage !== null ? d1Entry.posturePercentage : 25;
  const d30PosturePct = d30Entry && d30Entry.posturePercentage !== null ? d30Entry.posturePercentage : 0;
  const posturePass = d30PosturePct >= 75;

  // 3. การพัก (% การพักเฉลี่ย D2-D30) (เป้าหมาย ≥ 80%)
  const breakDays = entries.filter(e => e.day >= 2 && e.breaksTarget > 0);
  const avgBreakRate = breakDays.length > 0
    ? Number((breakDays.reduce((acc, cur) => acc + (cur.breakRate || 0), 0) / breakDays.length).toFixed(1))
    : 0;
  const breakPass = avgBreakRate >= 80;

  // 4. การทำโปรแกรม (% ทำครบ) = จำนวนวันที่ทำครบ ÷ 30 × 100 (เป้าหมาย ≥ 85%, คือ ≥ 26 วัน)
  const completedDaysCount = entries.filter(e => e.programCompleted).length;
  const programAdherencePct = Number(((completedDaysCount / 30) * 100).toFixed(1));
  const adherencePass = programAdherencePct >= 85;

  // 5. ผลทันทีจากการนวด (% ลดทันทีเฉลี่ย) = เฉลี่ยของ (ก่อน - หลัง) ÷ ก่อน × 100 (เป้าหมาย ≥ 20%)
  const massageDays = entries.filter(e => e.painPreMassage !== null && e.painPreMassage > 0 && e.painPostMassage !== null);
  const avgImmediateRelief = massageDays.length > 0
    ? Number((massageDays.reduce((acc, cur) => acc + (cur.immediatePainRelief || 0), 0) / massageDays.length).toFixed(1))
    : 0;
  const immediatePass = avgImmediateRelief >= 20;

  return {
    pain: {
      d1Pain,
      lateAvgPain: Number(lateAvgPain.toFixed(1)),
      reductionPct: painReductionPct,
      pass: painPass,
      target: 30,
      unit: '%'
    },
    posture: {
      d1Pct: d1PosturePct,
      d30Pct: d30PosturePct,
      pass: posturePass,
      target: 75,
      unit: '%'
    },
    breaks: {
      avgBreakRate,
      pass: breakPass,
      target: 80,
      unit: '%'
    },
    adherence: {
      completedDays: completedDaysCount,
      adherencePct: programAdherencePct,
      pass: adherencePass,
      target: 85,
      requiredDays: 26,
      unit: '%'
    },
    immediateRelief: {
      avgRelief: avgImmediateRelief,
      pass: immediatePass,
      target: 20,
      unit: '%'
    },
    allPass: painPass && posturePass && breakPass && adherencePass
  };
}
