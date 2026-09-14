// Export to Excel 6806021612037_Health30D.xlsx matching proposal specification
import * as XLSX from 'xlsx';
import { calculateResearchStats } from '../data/storage.js';

export function exportToExcel(projectData) {
  const { info, entries } = projectData;
  const stats = calculateResearchStats(entries);

  const wb = XLSX.utils.book_new();

  // --- Sheet 1: บันทึกรายวัน ---
  const sheet1Data = [
    ['โครงการวิจัยและปรับเปลี่ยนพฤติกรรมสุขภาพส่วนบุคคล (30 วัน)'],
    [`ผู้วิจัย: ${info.studentName} | รหัสนักศึกษา: ${info.studentId} | Section: ${info.section}`],
    [`หัวข้อ: ${info.projectTitle}`],
    [],
    [
      'วัน',
      'วันที่',
      'เริ่มใช้จอ',
      'นาทีใช้จอ',
      'ควรพัก (ครั้ง)',
      'พักจริง (ครั้ง)',
      '% การพัก',
      'ปวดก่อนนวด (NRS)',
      'ปวดหลังนวด (NRS)',
      '% ลดทันที',
      'นวดครบ 6 นาที',
      'บริหารครบ 6 ท่า',
      'ทำครบโปรแกรม',
      'หมายเหตุ'
    ]
  ];

  entries.forEach(e => {
    sheet1Data.push([
      `D${e.day}`,
      e.date,
      e.screenStartTime || '-',
      e.screenTimeMins || 0,
      e.breaksTarget || 0,
      e.breaksActual || 0,
      e.breakRate !== null ? `${e.breakRate}%` : '-',
      e.painPreMassage !== null ? e.painPreMassage : '-',
      e.painPostMassage !== null ? e.painPostMassage : '-',
      e.immediatePainRelief !== null ? `${e.immediatePainRelief}%` : '-',
      e.massageCompleted ? 'ผ่าน' : 'ไม่ผ่าน',
      e.exercisesCompleted ? 'ผ่าน' : 'ไม่ผ่าน',
      e.programCompleted ? 'ผ่าน' : 'ไม่ผ่าน',
      e.notes || ''
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'บันทึกรายวัน');

  // --- Sheet 2: ภาพและมุม ---
  const milestones = entries.filter(e => e.isMilestone);
  const sheet2Data = [
    ['ตารางบันทึกการวัดมุมท่านั่งทำงานด้านข้าง (Ergonomics 90-90-90)'],
    ['เครื่องมือวัด: ImageMeter / Web Canvas Angle Tool'],
    [],
    [
      'วันประเมิน',
      'วันที่',
      'มุมข้อศอก (°)',
      'เกณฑ์ศอก (90-100°)',
      'มุมสะโพก (°)',
      'เกณฑ์สะโพก (90-100°)',
      'มุมเข่า (°)',
      'เกณฑ์เข่า (85-100°)',
      'ระดับสายตากึ่งกลางจอ',
      'ข้อที่ผ่าน (เต็ม 4)',
      '% ท่าทางถูกต้อง',
      'สถานะการประเมิน'
    ]
  ];

  milestones.forEach(m => {
    sheet2Data.push([
      `D${m.day}`,
      m.date,
      m.elbowAngle !== null ? m.elbowAngle : '-',
      m.elbowPass === null ? '-' : (m.elbowPass ? 'ผ่าน' : 'ไม่ผ่าน'),
      m.hipAngle !== null ? m.hipAngle : '-',
      m.hipPass === null ? '-' : (m.hipPass ? 'ผ่าน' : 'ไม่ผ่าน'),
      m.kneeAngle !== null ? m.kneeAngle : '-',
      m.kneePass === null ? '-' : (m.kneePass ? 'ผ่าน' : 'ไม่ผ่าน'),
      m.eyeLevelPass === null ? '-' : (m.eyeLevelPass ? 'ผ่าน' : 'ไม่ผ่าน'),
      m.postureScore !== null ? `${m.postureScore} / 4` : '-',
      m.posturePercentage !== null ? `${m.posturePercentage}%` : '-',
      (m.posturePercentage >= 75) ? 'ผ่านเกณฑ์เป้าหมาย' : 'ต่ำกว่าเป้าหมาย'
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'ภาพและมุม');

  // --- Sheet 3: สรุปผล ---
  const sheet3Data = [
    ['สรุปผลการวิจัยและตัวชี้วัดความสำเร็จ 5 ด้าน (Key Results Summary)'],
    [`ชื่อโครงร่าง: ${info.projectTitle}`],
    [],
    ['ตัวชี้วัด', 'สูตรการคำนวณ', 'ค่าตั้งต้น (Baseline)', 'ผลลัพธ์โครงการ (Final)', 'เป้าหมาย', 'ผลการประเมิน'],
    [
      '1. อาการปวด (NRS 0-10)',
      '(D1 - ค่าเฉลี่ย D28-D30) ÷ D1 × 100',
      `D1 = ${stats.pain.d1Pain} คะแนน`,
      `D28-D30 เฉลี่ย = ${stats.pain.lateAvgPain} (ลดลง ${stats.pain.reductionPct}%)`,
      'ลดลง ≥ 30%',
      stats.pain.pass ? 'บรรลุเป้าหมาย ✓' : 'ไม่บรรลุเป้าหมาย ✗'
    ],
    [
      '2. ท่านั่งทำงานถูกต้อง',
      'จำนวนข้อที่ผ่าน ÷ 4 × 100',
      `D1 = ${stats.posture.d1Pct}% (1 ใน 4 ข้อ)`,
      `D30 = ${stats.posture.d30Pct}%`,
      '≥ 75%',
      stats.posture.pass ? 'บรรลุเป้าหมาย ✓' : 'ไม่บรรลุเป้าหมาย ✗'
    ],
    [
      '3. การพักขยับตัวทุก 45 นาที',
      'เฉลี่ย (พักจริง ÷ ควรพัก × 100) D2-D30',
      '-',
      `เฉลี่ย ${stats.breaks.avgBreakRate}%`,
      '≥ 80%',
      stats.breaks.pass ? 'บรรลุเป้าหมาย ✓' : 'ไม่บรรลุเป้าหมาย ✗'
    ],
    [
      '4. การทำโปรแกรมครบ',
      'จำนวนวันที่ทำครบ ÷ 30 × 100',
      '-',
      `${stats.adherence.completedDays} วัน (${stats.adherence.adherencePct}%)`,
      '≥ 85% (≥ 26 วัน)',
      stats.adherence.pass ? 'บรรลุเป้าหมาย ✓' : 'ไม่บรรลุเป้าหมาย ✗'
    ],
    [
      '5. ผลทันทีจากการนวด (สำรวจ)',
      'เฉลี่ย (ก่อนนวด - หลังนวด) ÷ ก่อนนวด × 100',
      '-',
      `ลดทันทีเฉลี่ย ${stats.immediateRelief.avgRelief}%`,
      '≥ 20%',
      stats.immediateRelief.pass ? 'บรรลุเป้าหมาย ✓' : 'ไม่บรรลุเป้าหมาย ✗'
    ]
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'สรุปผล');

  // Trigger download
  const fileName = info.excelFileName || `${info.studentId}_Health30D.xlsx`;
  XLSX.writeFile(wb, fileName);
}
