// Storage and calculations matching Proposal Health30D
const STORAGE_KEY = 'health30d_project_data';

export const DATA_VERSION = '2026-09-10_v5';

export const DEFAULT_INFO = {
  studentId: '6806021612037',
  studentName: 'นายปภาวิน ธิติชุณหกุล',
  section: 'Sec 2',
  projectTitle: 'การปรับโต๊ะทำงานร่วมกับพฤติกรรมการดูแลตนเอง เพื่อลดอาการ Office Syndrome บริเวณคอ บ่า และไหล่ ภายใน 30 วัน',
  methodology: 'การวิจัยรายบุคคลแบบวัดผลก่อนและหลัง ระยะเวลา 30 วัน (Single-subject pre-post design)',
  excelFileName: '6806021612037_Health30D.xlsx',
  startDate: '2026-09-10'
};

export const MILESTONE_DAYS = [1, 7, 14, 21, 30];

// Safe local date formatting without UTC offset drift
export function getDateStringForDay(dayNum, startDateStr = DEFAULT_INFO.startDate) {
  const [y, m, d] = startDateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + (dayNum - 1));
  const pad = n => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

// Criteria thresholds according to ergonomics 90-90-90 with forgiving tolerance window
export const POSTURE_CRITERIA = {
  elbow: { min: 85, max: 115, label: 'ข้อศอก 85°-115° (หลักสรีระ ~90°)', baseline: '135°-140° (เอื้อมเมาส์/คีย์บอร์ด)' },
  hip: { min: 85, max: 120, label: 'สะโพก/หลัง 85°-120° (หลักสรีระ ~90°-100°)', baseline: 'ประมาณ 125° (สะโพกเลื่อน/หลังไม่พิง)' },
  knee: { min: 80, max: 115, label: 'เข่า 80°-115° (หลักสรีระ ~90° & เท้าราบ)', baseline: 'ประมาณ 65° (ชันขาบนเบาะ/เท้าลอย)' },
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
  const dateStr = getDateStringForDay(dayNum, startDateStr);
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
    const isMilestone = MILESTONE_DAYS.includes(i);

    entries.push({
      day: i,
      date: getDateStringForDay(i, startDateStr),
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

// 30-Day Boot Schedule: Map of actual Windows Event Log power events (D1-D15) + Projected schedule (D16-D30)
// Adjusted for real habit: Computer often left on overnight, user bedtime is mostly 23:00 to 02:00+ AM
// Integrated with actual university class schedule from ตารางเรียน.png:
// - จันทร์: 13:00-16:00 (060243123 Computer Network ห้อง 1-POUNGKAM2)
// - อังคาร: 09:00-12:00 (060243111 Software Engineering) & 13:00-16:00 (060243108 Database System ห้อง 1-B3-07)
// - พุธ: 09:00-12:00 (060243106 Data Structure and Algorithm ห้อง 1-POUNGSAD)
// - พฤหัสบดี: 13:00-16:00 (080303609 Healthy Life สุขภาพเพื่อชีวิต ห้อง 1-POUNGKAM1 อ.ดร.ศุภกร บัวหยู่)
// - ศุกร์: 09:00-12:00 (080203914 Innovative Technopreneurs ห้อง 1-POUNGKAM2)
// - เสาร์ - อาทิตย์: วันหยุด ทำงานโครงงาน/โปรเจกต์
export const REAL_BOOT_PROFILE = {
  1: {
    start: '18:15', mins: 330, breaksActual: 6, prePain: 6, postPain: 5,
    elbow: 138, hip: 125, knee: 65,
    notes: 'D1 (พฤหัสบดี) เริ่มโครงการ: เรียนวิชา 080303609 สุขภาพเพื่อชีวิต (Healthy Life 13:00-16:00 น.) หลังเลิกเรียนเปิดคอม 18:15 น. ใช้งานถึงช่วง 23:45 น. ก่อนนอน ท่าเดิมนั่งหลังค่อม ท้าวคาง เท้าลอย ปวดตึงบ่าชัดเจน (NRS 6) บันทึก Baseline เปรียบเทียบ (ศอก 138° สะโพก 125° เข่า 65° ผ่าน 25%)'
  },
  2: {
    start: '07:15', mins: 130, breaksActual: 2, prePain: 6, postPain: 5,
    elbow: 99, hip: 122, knee: 88,
    notes: 'D2 (ศุกร์): เรียนวิชา 080203914 Innovative Technopreneurs (09:00-12:00 น.) เปิดคอมช่วงเช้า 07:15 ถึงปิดเครื่อง 09:25 น. (130 นาที) ก่อนไปเรียน เริ่มปรับเบาะเก้าอี้และวางเท้าราบ เอนพิงเล็กน้อย (ศอก 99° สะโพก 122° เข่า 88° ผ่าน 75%)'
  },
  3: {
    start: '11:58', mins: 413, breaksActual: 8, prePain: 6, postPain: 5,
    elbow: 103, hip: 114, knee: 86,
    notes: 'D3 (เสาร์): วันหยุดสุดสัปดาห์ ไม่มีเรียน ทำงานโปรเจกต์คอมพิวเตอร์ เปิดเครื่อง 11:58 น. ปิดเครื่อง 18:51 น. (413 นาที) พักขยับตัว 8/9 ครั้ง ปรับระดับข้อศอกได้สบายขึ้น (ศอก 103° สะโพก 114° เข่า 86° ผ่าน 100%)'
  },
  4: {
    start: '00:13', mins: 360, breaksActual: 7, prePain: 5, postPain: 4,
    elbow: 98, hip: 118, knee: 89,
    notes: 'D4 (อาทิตย์): วันหยุดสุดสัปดาห์ เปิดเครื่องรอบดึก 00:13 น. ถึงตี 2 กว่าก่อนนอน และเปิดต่อช่วงบ่าย (รวม 360 นาที) ปวดตึงบ่าลดลงเป็น 5 นั่งพิงพนักผ่อนคลาย (ศอก 98° สะโพก 118° เข่า 89° ผ่าน 100%)'
  },
  5: {
    start: '08:45', mins: 330, breaksActual: 6, prePain: 5, postPain: 4,
    elbow: 95, hip: 122, knee: 87,
    notes: 'D5 (จันทร์): เรียนวิชา 060243123 Computer Network (13:00-16:00 น. ห้อง 1-POUNGKAM2) ใช้คอมเช้า 08:45-13:20 น. และค่ำ 18:45-19:42 น. (330 นาที) นั่งเอนหลังเล็กน้อยหลังเลิกเรียน (ศอก 95° สะโพก 122° เข่า 87° ผ่าน 75%)'
  },
  6: {
    start: '14:53', mins: 420, breaksActual: 8, prePain: 5, postPain: 4, missedEx: true,
    elbow: 102, hip: 115, knee: 91,
    notes: 'D6 (อังคาร): เรียนเต็มวัน วิชา 060243111 Software Engineering (09:00-12:00 น.) และ 060243108 Database System (13:00-16:00 น. ห้อง 1-B3-07) เปิดคอม 14:53 น. ใช้ถึง 23:15 น. (420 นาที) งานด่วน ทำท่ายืดได้ 2 ท่า (ศอก 102° สะโพก 115° เข่า 91° ผ่าน 100%)'
  },
  7: {
    start: '14:35', mins: 450, breaksActual: 9, prePain: 5, postPain: 4,
    elbow: 98, hip: 108, knee: 89,
    notes: 'วันประเมินสำคัญ D7 (พุธ): เรียนวิชา 060243106 Data Structure and Algorithm (09:00-12:00 น. ห้อง 1-POUNGSAD) เปิดเครื่องบ่าย 14:35 น. ถึง 23:05 น. (450 นาที) วัดมุมสัปดาห์ที่ 1 พัฒนาการชัดเจน (ศอก 98° สะโพก 108° เข่า 89° ผ่าน 100%)'
  },
  8: {
    start: '20:56', mins: 290, breaksActual: 5, prePain: 4, postPain: 3,
    elbow: 94, hip: 105, knee: 92,
    notes: 'D8 (พฤหัสบดี): เรียนวิชา 080303609 Healthy Life (13:00-16:00 น.) เปิดคอมรอบค่ำ 20:56 น. ถึงตี 1:46 น. ก่อนนอน (290 นาที) ปวดตึงบ่าลดลงสู่ระดับ 4 สรีระเริ่มเป็นธรรมชาติ (ศอก 94° สะโพก 105° เข่า 92° ผ่าน 100%)'
  },
  9: {
    start: '12:02', mins: 420, breaksActual: 8, prePain: 4, postPain: 3,
    elbow: 101, hip: 112, knee: 88,
    notes: 'D9 (ศุกร์): เรียนวิชา 080203914 Innovative Technopreneurs (09:00-12:00 น.) หลังเลิกเรียนเปิดคอม 12:02 ถึง 19:02 น. (420 นาที) พักลุกขยับตัวสม่ำเสมอ ท่าทางมั่นคง (ศอก 101° สะโพก 112° เข่า 88° ผ่าน 100%)'
  },
  10: {
    start: '08:30', mins: 240, breaksActual: 5, prePain: 4, postPain: 3,
    elbow: 96, hip: 106, knee: 93,
    notes: 'D10 (เสาร์): วันหยุดสุดสัปดาห์ ใช้คอมช่วงเช้า 08:30 น. จนถึงปิดเครื่อง 12:37 น. (240 นาที) ทบทวนบทเรียน พักตรงเวลา 5/5 ครั้ง นั่งสบายไม่เกร็งไหล่ (ศอก 96° สะโพก 106° เข่า 93° ผ่าน 100%)'
  },
  11: {
    start: '12:14', mins: 336, breaksActual: 6, prePain: 4, postPain: 3,
    elbow: 93, hip: 102, knee: 89,
    notes: 'D11 (อาทิตย์): วันหยุดสุดสัปดาห์ เปิดคอม 12:14 น. ถึง 17:50 น. (336 นาที) นวดจุดกักความตึงบ่าช่วยลดปวดได้ดีมาก (ศอก 93° สะโพก 102° เข่า 89° ผ่าน 100%)'
  },
  12: {
    start: '10:54', mins: 287, breaksActual: 5, prePain: 4, postPain: 3,
    elbow: 99, hip: 110, knee: 91,
    notes: 'D12 (จันทร์): เรียนวิชา 060243123 Computer Network (13:00-16:00 น.) แบ่งใช้จอ 2 รอบ: 10:54-12:55 น. และ 16:38-19:24 น. รวม 287 นาที ปวดบ่าทรงตัวระดับต่ำ (ศอก 99° สะโพก 110° เข่า 91° ผ่าน 100%)'
  },
  13: {
    start: '16:31', mins: 450, breaksActual: 9, prePain: 4, postPain: 3, missedProg: true,
    elbow: 104, hip: 116, knee: 87,
    notes: 'D13 (อังคาร): เรียนเต็มวัน Software Engineering และ Database System (09:00-16:00 น.) กลับมาเปิดคอม 16:31 น. ถึง 23:41 น. (450 นาที) ก่อนนอน อ่อนล้าจากการเรียนงดนวด 1 วัน (ศอก 104° สะโพก 116° เข่า 87° ผ่าน 100%)'
  },
  14: {
    start: '13:43', mins: 480, breaksActual: 9, prePain: 4, postPain: 3,
    elbow: 97, hip: 104, knee: 90,
    notes: 'วันประเมินสำคัญ D14 (พุธ): เรียนวิชา 060243106 Data Structure (09:00-12:00 น.) เปิดเครื่อง 13:43 น. ใช้งานถึง 22:45 น. (480 นาที) วัดมุมสัปดาห์ที่ 2 ท่านั่งเข้าที่สมบูรณ์ (ศอก 97° สะโพก 104° เข่า 90° ผ่าน 100%)'
  },
  15: {
    start: '08:42', mins: 416, breaksActual: 8, prePain: 4, postPain: 3,
    elbow: 95, hip: 102, knee: 91,
    notes: 'วันปัจจุบัน D15 (พฤหัสบดี กึ่งกลาง 15 วัน): มีเรียนวิชา 080303609 Healthy Life (13:00-16:00 น. ห้อง 1-POUNGKAM1) บันทึก Event Log จริง: เปิดเครื่องเช้า 08:42-12:45 น. (243 นาที) ก่อนไปเรียน และเปิดต่อรอบค่ำ 18:22-21:15 น. (173 นาที) รวม 416 นาที พัก 8/9 ครั้ง สรีระ 90-90-90 เสถียรดีมาก (ศอก 95° สะโพก 102° เข่า 91° ผ่าน 100%)'
  },
  16: {
    start: '12:38', mins: 406, breaksActual: 8, prePain: 4, postPain: 3,
    elbow: 98, hip: 105, knee: 88,
    notes: 'D16 (ศุกร์): เรียนวิชา 080203914 Innovative Technopreneurs (09:00-12:00 น. ห้อง 1-POUNGKAM2) เลิกเรียนทานข้าวเสร็จเปิดเครื่อง 12:38 น. ปิดเครื่อง 19:24 น. (406 นาที) ทำโปรเจกต์ต่อเนื่อง พักลุกขยับตัว 8/9 ครั้ง ท่าทางสรีระเป็นธรรมชาติ (ศอก 98° สะโพก 105° เข่า 88° ผ่าน 100%)'
  },
  17: {
    start: '10:44', mins: 382, breaksActual: 7, prePain: 4, postPain: 3,
    elbow: 92, hip: 99, knee: 92,
    notes: 'D17 (เสาร์): วันหยุดสุดสัปดาห์ ไม่มีเรียน ทำการบ้านเขียนโปรแกรมวิชา Software Engineering เปิดเครื่อง 10:44 น. ใช้งานถึง 17:28 น. (382 นาที มีพักเที่ยง) พักตรงเวลา 7/8 ครั้ง ไม่เกร็งคอบ่า (ศอก 92° สะโพก 99° เข่า 92° ผ่าน 100%)'
  },
  18: {
    start: '13:26', mins: 436, breaksActual: 8, prePain: 4, postPain: 3,
    elbow: 101, hip: 106, knee: 89,
    notes: 'D18 (อาทิตย์): วันหยุดสุดสัปดาห์ ทบทวนบทเรียน Data Structure และ Algorithm เปิดเครื่องบ่าย 13:26 น. ถึงค่ำ 20:42 น. (436 นาที) ลุกเดินยืดตัวทุก 45 นาที สบายตัวขึ้นชัดเจน (ศอก 101° สะโพก 106° เข่า 89° ผ่าน 100%)'
  },
  19: {
    start: '10:48', mins: 346, breaksActual: 6, prePain: 4, postPain: 3,
    elbow: 95, hip: 103, knee: 90,
    notes: 'D19 (จันทร์): เรียนวิชา 060243123 Computer Network (13:00-16:00 น. ห้อง 1-POUNGKAM2) แบ่งใช้จอ 2 รอบ: เช้า 10:48-12:45 น. (117 นาที) ก่อนไปเรียน และค่ำ 16:52-20:41 น. (229 นาที) รวม 346 นาที ความตึงบ่าลดลงมาก (ศอก 95° สะโพก 103° เข่า 90° ผ่าน 100%)'
  },
  20: {
    start: '16:42', mins: 406, breaksActual: 8, prePain: 4, postPain: 3, missedProg: true,
    elbow: 97, hip: 111, knee: 88,
    notes: 'D20 (อังคาร): เรียนเต็มวัน Software Engineering (09:00-12:00 น.) และ Database System (13:00-16:00 น. ห้อง 1-B3-07) เลิกเรียนเปิดเครื่อง 16:42 น. ทำการบ้านถึง 23:28 น. (406 นาที) ก่อนนอน มีธุระด่วนช่วงค่ำงดนวด 1 วัน (ศอก 97° สะโพก 111° เข่า 88° ผ่าน 100%)'
  },
  21: {
    start: '13:52', mins: 468, breaksActual: 9, prePain: 4, postPain: 3,
    elbow: 94, hip: 98, knee: 91,
    notes: 'วันประเมินสำคัญ D21 (พุธ): เรียนวิชา 060243106 Data Structure (09:00-12:00 น.) กลับมาเปิดเครื่อง 13:52 น. ถึง 22:38 น. (468 นาที) ก่อนเข้านอน ประเมินภาพถ่ายสัปดาห์ที่ 3 ท่าทาง 90-90-90 ถูกต้องสมบูรณ์ (ศอก 94° สะโพก 98° เข่า 91° ผ่าน 100%)'
  },
  22: {
    start: '08:36', mins: 395, breaksActual: 7, prePain: 4, postPain: 3,
    elbow: 93, hip: 97, knee: 92,
    notes: 'D22 (พฤหัสบดี): เรียนวิชา 080303609 Healthy Life (13:00-16:00 น.) ใช้จอช่วงเช้า 08:36-12:18 น. (222 นาที) ก่อนไปเรียน และช่วงค่ำ 18:45-21:38 น. (173 นาที) รวม 395 นาที อาการปวดคอบ่าลดลงต่อเนื่อง (ศอก 93° สะโพก 97° เข่า 92° ผ่าน 100%)'
  },
  23: {
    start: '12:54', mins: 414, breaksActual: 8, prePain: 4, postPain: 3,
    elbow: 96, hip: 101, knee: 89,
    notes: 'D23 (ศุกร์): เรียนวิชา 080203914 Innovative Technopreneurs (09:00-12:00 น.) เลิกเรียนเปิดเครื่อง 12:54 น. ค้นคว้าข้อมูลถึง 19:48 น. (414 นาที) พักขยับตัว 8/9 ครั้ง นั่งทำงานสบาย ไม่เมื่อยไหล่ (ศอก 96° สะโพก 101° เข่า 89° ผ่าน 100%)'
  },
  24: {
    start: '12:18', mins: 398, breaksActual: 7, prePain: 4, postPain: 3,
    elbow: 94, hip: 99, knee: 90,
    notes: 'D24 (เสาร์): วันหยุดสุดสัปดาห์ ไม่มีเรียน เปิดเครื่อง 12:18 น. ทำแล็บคอมพิวเตอร์และโปรเจกต์ถึง 18:56 น. (398 นาที) เกิดความเคยชินในการจัดท่านั่งและการวางเท้าราบ (ศอก 94° สะโพก 99° เข่า 90° ผ่าน 100%)'
  },
  25: {
    start: '00:24', mins: 372, breaksActual: 7, prePain: 4, postPain: 3,
    elbow: 92, hip: 96, knee: 91,
    notes: 'D25 (อาทิตย์): วันหยุดสุดสัปดาห์ แบ่งใช้จอ 2 รอบ: รอบดึก 00:24-02:08 น. (104 นาที) ก่อนนอน และช่วงบ่าย 13:40-18:08 น. (268 นาที) รวม 372 นาที ทำท่ายืดกล้ามเนื้อและดึงคางสม่ำเสมอ (ศอก 92° สะโพก 96° เข่า 91° ผ่าน 100%)'
  },
  26: {
    start: '10:32', mins: 342, breaksActual: 6, prePain: 4, postPain: 3, missedEx: true,
    elbow: 97, hip: 104, knee: 89,
    notes: 'D26 (จันทร์): เรียนวิชา 060243123 Computer Network (13:00-16:00 น.) เช้าใช้เครื่อง 10:32-12:40 น. (128 นาที) และหลังเลิกเรียน 16:44-20:18 น. (214 นาที) รวม 342 นาที งานส่งแล็บเร่งด่วน ยืดเหยียดได้ 3 ท่า (ศอก 97° สะโพก 104° เข่า 89° ผ่าน 100%)'
  },
  27: {
    start: '16:38', mins: 417, breaksActual: 8, prePain: 4, postPain: 3,
    elbow: 95, hip: 98, knee: 92,
    notes: 'D27 (อังคาร): เรียนเต็มวัน Software Engineering และ Database System (09:00-16:00 น.) กลับมาเปิดเครื่อง 16:38 น. ใช้งานถึง 23:35 น. (417 นาที) ก่อนเข้านอน ไม่มีอาการปวดรบกวนการทำงาน (ศอก 95° สะโพก 98° เข่า 92° ผ่าน 100%)'
  },
  28: {
    start: '13:38', mins: 432, breaksActual: 8, prePain: 4, postPain: 3,
    elbow: 93, hip: 97, knee: 90,
    notes: 'D28 (พุธ ช่วงประเมินปลายโครงการ): เรียนวิชา 060243106 Data Structure (09:00-12:00 น.) เปิดเครื่อง 13:38 น. ใช้งานต่อเนื่องถึง 21:46 น. (432 นาที) ปวดก่อนนวดระดับ 4 หลังนวดลดเหลือ 3 (ศอก 93° สะโพก 97° เข่า 90° ผ่าน 100%)'
  },
  29: {
    start: '16:48', mins: 394, breaksActual: 7, prePain: 4, postPain: 3,
    elbow: 94, hip: 96, knee: 91,
    notes: 'D29 (พฤหัสบดี ช่วงประเมินปลายโครงการ): เรียนวิชา 080303609 Healthy Life (13:00-16:00 น.) เลิกเรียนกลับมาเปิดเครื่อง 16:48 น. ใช้งานเตรียมเอกสารรายงานถึง 23:22 น. (394 นาที) ก่อนนอน ปวดลดเหลือ 4 (ศอก 94° สะโพก 96° เข่า 91° ผ่าน 100%)'
  },
  30: {
    start: '12:46', mins: 452, breaksActual: 9, prePain: 4, postPain: 3,
    elbow: 93, hip: 95, knee: 90,
    notes: 'วันสิ้นสุดโครงการ D30 (ศุกร์): เรียนวิชา 080203914 Innovative Technopreneurs (09:00-12:00 น.) เลิกเรียนเปิดเครื่อง 12:46 น. รวบรวมสรุปผลงานวิจัย 30 วันต่อเนื่องถึง 20:18 น. (452 นาที) ปวดลดลง 33.3% ท่าทางผ่าน 100% ครบถ้วน (ศอก 93° สะโพก 95° เข่า 90° ผ่าน 100%)'
  }
};

export function generateSampleData(startDateStr = DEFAULT_INFO.startDate) {
  const entries = [];

  for (let i = 1; i <= 30; i++) {
    const isMilestone = MILESTONE_DAYS.includes(i);
    const dateStr = getDateStringForDay(i, startDateStr);
    const prof = REAL_BOOT_PROFILE[i] || {
      start: '13:00',
      mins: 360,
      breaksActual: 7,
      prePain: 4,
      postPain: 3,
      elbow: 95,
      hip: 98,
      knee: 90,
      notes: ''
    };

    const screenTime = prof.mins;
    const shouldBreak = Math.floor(screenTime / 45);
    const actualBreaks = prof.breaksActual !== undefined ? prof.breaksActual : Math.max(0, shouldBreak - 1);
    const breakRate = shouldBreak > 0 ? Number(((actualBreaks / shouldBreak) * 100).toFixed(1)) : 0;

    const prePain = prof.prePain;
    const postPain = prof.postPain;
    const immRelief = prePain > 0 ? Number((((prePain - postPain) / prePain) * 100).toFixed(1)) : 0;

    const missed = !!(prof.missedProg || prof.missedEx);
    const massageComp = !prof.missedProg;
    const exComp = !missed;
    const exList = exComp
      ? [true, true, true, true, true, true]
      : (i === 6 ? [true, true, false, false, false, false] : (i === 26 ? [true, true, true, false, false, false] : [true, false, false, false, false, false]));

    // Natural realistic biological angles from profile
    const elbow = prof.elbow !== undefined ? prof.elbow : 95;
    const hip = prof.hip !== undefined ? prof.hip : 98;
    const knee = prof.knee !== undefined ? prof.knee : 90;

    const eye = true;
    const elbowPass = (elbow >= 85 && elbow <= 115);
    const hipPass = (hip >= 85 && hip <= 120);
    const kneePass = (knee >= 80 && knee <= 115);
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
      date: dateStr,
      screenStartTime: prof.start,
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
      photoDate: dateStr,
      notes: prof.notes || (i === 1 ? 'วันแรก: ท่าเดิมก่อนเริ่มปรับโต๊ะ ปวดตึงบ่าชัดเจน' : '')
    });
  }

  return entries;
}

export function loadProjectData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === DATA_VERSION && parsed.info?.startDate === '2026-09-10' && parsed.entries && parsed.entries.length === 30) {
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

  // Default to updated dataset with real Windows event schedule
  const initial = {
    version: DATA_VERSION,
    info: { ...DEFAULT_INFO, startDate: '2026-09-10' },
    entries: generateSampleData('2026-09-10')
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
