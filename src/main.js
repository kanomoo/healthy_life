// Main entry point coordinating application state and UI components
import './style.css';
import { 
  loadProjectData, 
  saveProjectData, 
  generateSampleData, 
  createBlankEntries, 
  calculateResearchStats, 
  MILESTONE_DAYS,
  getThailandTime
} from './data/storage.js';
import { PostureAngleTool } from './components/canvasAngleTool.js';
import { 
  ScreenTimer, 
  MassageRoutineRunner, 
  MASSAGE_STEPS, 
  WorkoutPlayer, 
  EXERCISE_LIST,
  requestNotificationPermission,
  showDesktopNotification
} from './components/timerManager.js';
import { LogbookManager } from './components/logbookManager.js';
import { DashboardCharts } from './components/dashboardCharts.js';
import { exportToExcel } from './components/excelExport.js';
import { sound } from './utils/audio.js';
import confetti from 'canvas-confetti';

// App State
let projectData = loadProjectData();

// Component Instances
let charts = null;
let angleTool = null;
let screenTimer = null;
let massageRunner = null;
let workoutPlayer = null;
let logbookMgr = null;

// Toast Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600' : (type === 'warn' ? 'bg-amber-600' : 'bg-cyan-600');
  toast.className = `${bg} text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// -------------------------------------------------------------
// UI Updates & KPI Calculation
// -------------------------------------------------------------
function refreshKPIs() {
  const stats = calculateResearchStats(projectData.entries);
  if (!stats) return;

  // KPI 1: อาการปวด (NRS)
  const kpi1Val = document.getElementById('kpi1-value');
  const kpi1Status = document.getElementById('kpi1-status');
  const kpi1Sub = document.getElementById('kpi1-sub');
  if (kpi1Val) kpi1Val.textContent = `${stats.pain.reductionPct}%`;
  if (kpi1Sub) kpi1Sub.textContent = `D1: ${stats.pain.d1Pain} ➔ ปลาย: ${stats.pain.lateAvgPain}`;
  if (kpi1Status) {
    kpi1Status.textContent = stats.pain.pass ? 'ผ่านเกณฑ์ (≥30%)' : 'ต่ำกว่าเกณฑ์';
    kpi1Status.className = `px-2 py-0.5 rounded text-[11px] font-medium border ${stats.pain.pass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }

  // KPI 2: ท่านั่ง
  const kpi2Val = document.getElementById('kpi2-value');
  const kpi2Status = document.getElementById('kpi2-status');
  const kpi2Sub = document.getElementById('kpi2-sub');
  if (kpi2Val) kpi2Val.textContent = `${stats.posture.d30Pct}%`;
  if (kpi2Sub) kpi2Sub.textContent = `ฐาน ${stats.posture.d1Pct}% ➔ สิ้นสุด ${stats.posture.d30Pct}%`;
  if (kpi2Status) {
    kpi2Status.textContent = stats.posture.pass ? 'ผ่านเกณฑ์ (≥75%)' : 'ต่ำกว่าเกณฑ์';
    kpi2Status.className = `px-2 py-0.5 rounded text-[11px] font-medium border ${stats.posture.pass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }

  // KPI 3: การพัก
  const kpi3Val = document.getElementById('kpi3-value');
  const kpi3Status = document.getElementById('kpi3-status');
  if (kpi3Val) kpi3Val.textContent = `${stats.breaks.avgBreakRate}%`;
  if (kpi3Status) {
    kpi3Status.textContent = stats.breaks.pass ? 'ผ่านเกณฑ์ (≥80%)' : 'ต่ำกว่าเกณฑ์';
    kpi3Status.className = `px-2 py-0.5 rounded text-[11px] font-medium border ${stats.breaks.pass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }

  // KPI 4: ทำโปรแกรมครบ
  const kpi4Val = document.getElementById('kpi4-value');
  const kpi4Status = document.getElementById('kpi4-status');
  const kpi4Sub = document.getElementById('kpi4-sub');
  if (kpi4Val) kpi4Val.textContent = `${stats.adherence.adherencePct}%`;
  if (kpi4Sub) kpi4Sub.textContent = `ครบ ${stats.adherence.completedDays} / 30 วัน`;
  if (kpi4Status) {
    kpi4Status.textContent = stats.adherence.pass ? 'ผ่านเกณฑ์ (≥85%)' : 'ต่ำกว่าเกณฑ์';
    kpi4Status.className = `px-2 py-0.5 rounded text-[11px] font-medium border ${stats.adherence.pass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }

  // KPI 5: ผลทันทีจากการนวด
  const kpi5Val = document.getElementById('kpi5-value');
  const kpi5Status = document.getElementById('kpi5-status');
  if (kpi5Val) kpi5Val.textContent = `${stats.immediateRelief.avgRelief}%`;
  if (kpi5Status) {
    kpi5Status.textContent = stats.immediateRelief.pass ? 'ผ่านเกณฑ์ (≥20%)' : 'ต่ำกว่าเกณฑ์';
    kpi5Status.className = `px-2 py-0.5 rounded text-[11px] font-medium border ${stats.immediateRelief.pass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }

  // Overall Goal Badge
  const overall = document.getElementById('overallGoalBadge');
  if (overall) {
    if (stats.allPass) {
      overall.textContent = '🌟 บรรลุสมมติฐานครบทุกข้อ';
      overall.className = 'text-sm font-semibold text-emerald-400';
    } else {
      overall.textContent = '📊 อยู่ระหว่างการดำเนินการ';
      overall.className = 'text-sm font-semibold text-cyan-300';
    }
  }

  // Refresh Charts
  if (charts) {
    charts.renderPainChart('chartPain', projectData.entries);
    charts.renderBreaksChart('chartBreaks', projectData.entries);
    charts.renderAnglesChart('chartAngles', projectData.entries);
  }
}

// -------------------------------------------------------------
// Navigation & Tab Switching
// -------------------------------------------------------------
function initNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  function switchTab(target) {
    tabs.forEach(t => {
      const isTarget = t.getAttribute('data-tab') === target;
      if (isTarget) {
        t.classList.add('active', 'bg-cyan-500/15', 'border-cyan-400', 'text-cyan-300', 'shadow-[0_0_14px_rgba(6,182,212,0.25)]');
        t.classList.remove('border-transparent', 'text-slate-400');
      } else {
        t.classList.remove('active', 'bg-cyan-500/15', 'border-cyan-400', 'text-cyan-300', 'shadow-[0_0_14px_rgba(6,182,212,0.25)]');
        t.classList.add('border-transparent', 'text-slate-400');
      }
    });

    contents.forEach(c => {
      if (c.id === target) {
        c.classList.remove('hidden');
        c.classList.add('block');
      } else {
        c.classList.add('hidden');
        c.classList.remove('block');
      }
    });

    if (target === 'tab-dashboard') {
      refreshKPIs();
    } else if (target === 'tab-angle' && angleTool) {
      setTimeout(() => {
        angleTool.fitToCanvas();
        angleTool.render();
      }, 50);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });

  // Jump buttons on dashboard (e.g. data-jump-tab="tab-angle" and btnJumpToAngleTool)
  document.querySelectorAll('[data-jump-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-jump-tab');
      const subtab = btn.getAttribute('data-subtab');
      switchTab(target);

      if (subtab) {
        if (subtab === 'massage') {
          const mBtn = document.getElementById('subtab-massage-btn');
          if (mBtn) mBtn.click();
        } else if (subtab === 'exercise') {
          const exBtn = document.getElementById('subtab-exercise-btn');
          if (exBtn) exBtn.click();
        } else if (subtab === 'screen') {
          const scBtn = document.getElementById('subtab-screen-btn');
          if (scBtn) scBtn.click();
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  const btnJumpAngle = document.getElementById('btnJumpToAngleTool');
  if (btnJumpAngle) {
    btnJumpAngle.addEventListener('click', () => {
      switchTab('tab-angle');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Timer Subtabs
  const subBtns = document.querySelectorAll('.subtab-btn');
  const screenPane = document.getElementById('timer-screen-pane');
  const massagePane = document.getElementById('timer-massage-pane');
  const exercisePane = document.getElementById('timer-exercise-pane');

  subBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subBtns.forEach(b => {
        b.classList.remove('active', 'bg-cyan-950', 'text-cyan-300', 'border', 'border-cyan-800');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      btn.classList.add('active', 'bg-cyan-950', 'text-cyan-300', 'border', 'border-cyan-800');
      btn.classList.remove('bg-slate-800', 'text-slate-300');

      if (btn.id === 'subtab-screen-btn') {
        screenPane.classList.remove('hidden');
        massagePane.classList.add('hidden');
        exercisePane.classList.add('hidden');
      } else if (btn.id === 'subtab-massage-btn') {
        screenPane.classList.add('hidden');
        massagePane.classList.remove('hidden');
        exercisePane.classList.add('hidden');
      } else if (btn.id === 'subtab-exercise-btn') {
        screenPane.classList.add('hidden');
        massagePane.classList.add('hidden');
        exercisePane.classList.remove('hidden');
      }
    });
  });

  // Logbook filter buttons
  const logFilters = document.querySelectorAll('.log-filter-btn');
  logFilters.forEach(fb => {
    fb.addEventListener('click', () => {
      logFilters.forEach(b => {
        b.classList.remove('active', 'bg-cyan-950', 'text-cyan-300', 'border-cyan-800');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      fb.classList.add('active', 'bg-cyan-950', 'text-cyan-300', 'border-cyan-800');
      fb.classList.remove('bg-slate-800', 'text-slate-300');

      const filter = fb.getAttribute('data-log-filter');
      if (logbookMgr) logbookMgr.setFilter(filter);
    });
  });
}

// -------------------------------------------------------------
// Interactive Image Posture Angle Tool Initialization
// -------------------------------------------------------------
function initAngleTool() {
  angleTool = new PostureAngleTool('postureCanvas', {
    onUpdate: (res) => {
      updateAngleScoreCard(res);
    }
  });

  // Load sample baseline photo
  angleTool.loadImage('/sample_baseline.png', false);
  angleTool.setPreset('baseline');

  // File Upload - automatically runs AI pose detection on ANY uploaded photo
  const fileInput = document.getElementById('imageUploadInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        showToast('กำลังโหลดภาพและตรวจจับโครงสร้างร่างกายด้วย AI (MediaPipe)...', 'info');
        await angleTool.loadImage(evt.target.result, true);
        showToast('วิเคราะห์องศาท่านั่งสำเร็จ สามารถลากปรับจุดข้อต่อได้ทันที', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  // Quick Test Buttons for images in the pic folder
  const testButtons = [
    { id: 'btnTestPic1', path: '/pic/IMG_20260921_175952_180.jpg', label: 'ภาพจริง 1 (IMG_175952)' },
    { id: 'btnTestPic2', path: '/pic/IMG_20260921_180340_368.jpg', label: 'ภาพจริง 2 (IMG_180340)' },
    { id: 'btnTestPic3', path: '/pic/Gemini_Generated_Image_6uge86uge86uge86.jpg', label: 'ภาพ 3 (Ergonomic Chair)' }
  ];

  testButtons.forEach(({ id, path, label }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', async () => {
        showToast(`กำลังโหลด ${label} และตรวจจับองศาด้วย AI...`, 'info');
        await angleTool.loadImage(path, true);
        showToast(`ตรวจจับข้อต่อและวัดองศา ${label} เรียบร้อย`, 'success');
      });
    }
  });

  // Re-detect AI button
  const btnReDetect = document.getElementById('btnReDetectPose');
  if (btnReDetect) {
    btnReDetect.addEventListener('click', async () => {
      showToast('กำลังรัน AI ตรวจจับข้อต่อร่างกายซ้ำ...', 'info');
      await angleTool.detectAndApplyPose();
      showToast('ตรวจจับข้อต่อและคำนวณองศาใหม่เรียบร้อย', 'success');
    });
  }

  // Switch Side button
  const btnSwitchSide = document.getElementById('btnSwitchPoseSide');
  if (btnSwitchSide) {
    btnSwitchSide.addEventListener('click', () => {
      const ok = angleTool.switchSide();
      if (ok) {
        showToast(`สลับไปวิเคราะห์ด้าน (${angleTool.currentSide === 'right' ? 'ขวา' : 'ซ้าย'}) เรียบร้อย`, 'info');
      } else {
        showToast('ไม่สามารถสลับข้างได้ (ไม่มีข้อมูลข้อต่ออีกด้าน หรือยังไม่ได้ตรวจจับด้วย AI)', 'warning');
      }
    });
  }

  // Presets
  const btnBaseline = document.getElementById('btnLoadSampleImg');
  if (btnBaseline) {
    btnBaseline.addEventListener('click', () => {
      angleTool.loadImage('/sample_baseline.png', false);
      angleTool.setPreset('baseline');
      showToast('โหลดภาพตัวอย่างและตำแหน่ง Baseline เรียบร้อย', 'info');
    });
  }

  const btnPreset90 = document.getElementById('btnResetPosture90');
  if (btnPreset90) {
    btnPreset90.addEventListener('click', () => {
      angleTool.setPreset('corrected_90');
      showToast('ปรับจุดอ้างอิงเป็นเกณฑ์ 90-90-90', 'success');
    });
  }

  // Eye level checkbox
  const checkEye = document.getElementById('checkEyeLevelPass');
  if (checkEye) {
    checkEye.addEventListener('change', (e) => {
      angleTool.setEyeLevelPass(e.target.checked);
    });
  }

  // Filter angle buttons
  const angleFilterBtns = document.querySelectorAll('.filter-angle-btn');
  angleFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      angleFilterBtns.forEach(b => {
        b.classList.remove('active', 'text-cyan-400');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active', 'text-cyan-400');
      btn.classList.remove('text-slate-400');

      const filter = btn.getAttribute('data-filter');
      angleTool.activeGroupFilter = filter;
      angleTool.render();
    });
  });

  // Download annotated image
  const btnDownload = document.getElementById('btnDownloadAnnotated');
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const dataUrl = angleTool.exportAnnotatedImage();
      if (!dataUrl) return;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Ergonomics_Angle_Measurement_${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      showToast('ดาวน์โหลดภาพพร้อมองศาเรียบร้อย', 'success');
    });
  }

  // Save Angle to Milestone Day
  const btnSaveAngle = document.getElementById('btnSaveAngleToDay');
  const selectDay = document.getElementById('selectMilestoneDay');
  if (btnSaveAngle && selectDay) {
    btnSaveAngle.addEventListener('click', () => {
      const dayNum = parseInt(selectDay.value, 10);
      const entry = projectData.entries.find(e => e.day === dayNum);
      if (!entry) return;

      const res = angleTool.getResults();
      entry.isMilestone = true;
      entry.elbowAngle = res.elbowAngle;
      entry.elbowPass = res.elbowPass;
      entry.hipAngle = res.hipAngle;
      entry.hipPass = res.hipPass;
      entry.kneeAngle = res.kneeAngle;
      entry.kneePass = res.kneePass;
      entry.eyeLevelPass = res.eyeLevelPass;
      entry.postureScore = res.score;
      entry.posturePercentage = res.percentage;

      // Export and save compressed annotated image from canvas
      const annotatedImg = angleTool.exportCompressedImage(900, 0.85);
      if (annotatedImg) {
        entry.annotatedPhoto = annotatedImg;
        entry.photoUrl = annotatedImg;
        entry.photoFileName = `Ergonomics_D${dayNum}_${projectData.info.studentId}.png`;
        entry.photoDate = new Date().toISOString();
      }

      saveProjectData(projectData);
      if (logbookMgr) logbookMgr.setEntries(projectData.entries);
      refreshKPIs();
      renderMilestoneGallery();

      const notice = document.getElementById('saveAngleNotice');
      if (notice) {
        notice.textContent = `✓ บันทึกภาพถ่ายและค่าองศาลงในวัน D${dayNum} เรียบร้อยแล้ว (สามารถดูภาพได้ในคลังภาพด้านล่าง)`;
        notice.classList.remove('hidden');
        setTimeout(() => notice.classList.add('hidden'), 4000);
      }
      showToast(`บันทึกภาพถ่ายและค่าองศาลงในวัน D${dayNum} เรียบร้อยแล้ว (ดูภาพได้ที่คลังภาพ)`, 'success');
    });
  }
}

function updateAngleScoreCard(res) {
  // Score badge
  const scoreBadge = document.getElementById('postureTotalScoreBadge');
  if (scoreBadge) {
    scoreBadge.textContent = `ผ่าน ${res.score} / 4 (${res.percentage}%)`;
    scoreBadge.className = `text-xs px-2.5 py-1 rounded-full font-bold border ${res.percentage >= 75 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }

  // Elbow
  const elVal = document.getElementById('angleElbowVal');
  const elBadge = document.getElementById('badgeElbow');
  const elFeedback = document.getElementById('feedbackElbow');
  if (elVal) elVal.textContent = `${res.elbowAngle}°`;
  if (elBadge) {
    elBadge.textContent = res.elbowPass ? 'ผ่าน' : 'ไม่ผ่าน';
    elBadge.className = `px-1.5 py-0.5 rounded text-[10px] font-semibold border ${res.elbowPass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }
  if (elFeedback) {
    elFeedback.textContent = res.elbowPass 
      ? 'ศอกอยู่ในมุม 90°-100° เหมาะสม ไม่เกร็งบ่า' 
      : (res.elbowAngle > 100 ? 'ศอกเหยียดเกินไป ควรดึงเมาส์และคีย์บอร์ดเข้าหาตัว' : 'ศอกงอชิดลำตัวเกินไป');
  }

  // Hip
  const hipVal = document.getElementById('angleHipVal');
  const hipBadge = document.getElementById('badgeHip');
  const hipFeedback = document.getElementById('feedbackHip');
  if (hipVal) hipVal.textContent = `${res.hipAngle}°`;
  if (hipBadge) {
    hipBadge.textContent = res.hipPass ? 'ผ่าน' : 'ไม่ผ่าน';
    hipBadge.className = `px-1.5 py-0.5 rounded text-[10px] font-semibold border ${res.hipPass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }
  if (hipFeedback) {
    hipFeedback.textContent = res.hipPass 
      ? 'สะโพกและหลังพิงพนักพิงชิด ไม่เอนหรือไถล' 
      : (res.hipAngle > 100 ? 'สะโพกเลื่อนไปข้างหน้า หลังล่างไม่พิงพนักพิง' : 'หลังค่อมงอเกินไป');
  }

  // Knee
  const kneeVal = document.getElementById('angleKneeVal');
  const kneeBadge = document.getElementById('badgeKnee');
  const kneeFeedback = document.getElementById('feedbackKnee');
  if (kneeVal) kneeVal.textContent = `${res.kneeAngle}°`;
  if (kneeBadge) {
    kneeBadge.textContent = res.kneePass ? 'ผ่าน' : 'ไม่ผ่าน';
    kneeBadge.className = `px-1.5 py-0.5 rounded text-[10px] font-semibold border ${res.kneePass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }
  if (kneeFeedback) {
    kneeFeedback.textContent = res.kneePass 
      ? 'มุมเข่าประมาณ 90° และวางเท้าราบกับพื้น' 
      : 'มุมเข่าผิดเกณฑ์ ชันขาบนเบาะ หรือเท้าไม่แตะพื้นราบ';
  }

  // Eye
  const eyeBadge = document.getElementById('badgeEye');
  if (eyeBadge) {
    eyeBadge.textContent = res.eyeLevelPass ? 'ผ่าน' : 'ไม่ผ่าน';
    eyeBadge.className = `px-1.5 py-0.5 rounded text-[10px] font-semibold border ${res.eyeLevelPass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
  }

  // AI Pose Status
  const statusEl = document.getElementById('poseAiStatusText');
  if (statusEl && res.detectionStatus) {
    statusEl.textContent = res.detectionStatus;
  }
}

// -------------------------------------------------------------
// Timer 1: Screen Time & 45-Min Break
// -------------------------------------------------------------
function initScreenTimer() {
  const clockDisplay = document.getElementById('screenClockDisplay');
  const minutesText = document.getElementById('screenTimeMinutesText');
  const breakCountdown = document.getElementById('breakCountdownDisplay');
  const breakProgress = document.getElementById('breakProgressBar');
  const statusBadge = document.getElementById('screenTimerStatus');

  const btnStart = document.getElementById('btnStartScreenTimer');
  const btnPause = document.getElementById('btnPauseScreenTimer');
  const btnReset = document.getElementById('btnResetScreenTimer');
  const btnAdd15 = document.getElementById('btnAdd15m');
  const btnAdd45 = document.getElementById('btnAdd45m');

  const targetBreaksEl = document.getElementById('targetBreaksText');
  const actualBreaksEl = document.getElementById('actualBreaksText');
  const breakRateBadge = document.getElementById('breakRateBadge');
  const btnLogBreak = document.getElementById('btnLogBreakNow');

  // Populate days select
  const selectDay = document.getElementById('selectDayForTimer');
  if (selectDay) {
    selectDay.innerHTML = '';
    projectData.entries.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.day;
      opt.textContent = `D${e.day} (${e.date})`;
      selectDay.appendChild(opt);
    });
  }

  screenTimer = new ScreenTimer({
    onTick: (st) => {
      const hrs = String(Math.floor(st.totalSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((st.totalSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(st.totalSeconds % 60).padStart(2, '0');
      if (clockDisplay) clockDisplay.textContent = `${hrs}:${mins}:${secs}`;
      if (minutesText) minutesText.textContent = st.totalMinutes;

      // 45 min countdown
      const cMins = String(Math.floor(st.breakCountdown / 60)).padStart(2, '0');
      const cSecs = String(st.breakCountdown % 60).padStart(2, '0');
      if (breakCountdown) breakCountdown.textContent = `${cMins}:${cSecs}`;

      const pct = Math.min(100, Math.round(((45 * 60 - st.breakCountdown) / (45 * 60)) * 100));
      if (breakProgress) breakProgress.style.width = `${pct}%`;

      if (statusBadge) {
        statusBadge.textContent = st.isRunning ? 'กำลังจับเวลา' : 'หยุดชั่วคราว';
        statusBadge.className = `text-xs px-2.5 py-1 rounded-full font-medium border ${st.isRunning ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-800 text-slate-300 border-slate-700'}`;
      }

      if (btnStart && btnPause) {
        if (st.isRunning) {
          btnStart.classList.add('hidden');
          btnPause.classList.remove('hidden');
        } else {
          btnStart.classList.remove('hidden');
          btnPause.classList.add('hidden');
        }
      }

      if (targetBreaksEl) targetBreaksEl.textContent = st.targetBreaks;
      if (actualBreaksEl) actualBreaksEl.textContent = st.breaksActual;
      if (breakRateBadge) {
        breakRateBadge.textContent = `${st.rate}%`;
        breakRateBadge.className = `text-xs px-2.5 py-0.5 rounded-full font-bold border ${st.rate >= 80 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`;
      }
    },
    onBreakTrigger: () => {
      showToast('🔔 ครบ 45 นาทีแล้ว! ได้เวลาลุกเดิน 2 นาที และหมุนไหล่ 10 ครั้ง', 'warn');
      screenTimer.start2MinBreak();
    },
    onBreakTick: (bt) => {
      const bDisp = document.getElementById('breakTimerCountdown');
      if (bDisp) {
        const bm = String(Math.floor(bt.secondsLeft / 60)).padStart(2, '0');
        const bs = String(bt.secondsLeft % 60).padStart(2, '0');
        bDisp.textContent = `${bm}:${bs}`;
      }
    },
    onAutoSave: (st) => {
      // Auto-save live timer progress to selected day entry in projectData
      const dayNum = parseInt(selectDay ? selectDay.value : '1', 10);
      const entry = projectData.entries.find(e => e.day === dayNum);
      if (entry && st.totalMinutes > 0) {
        entry.screenTimeMins = st.totalMinutes;
        entry.breaksTarget = st.targetBreaks;
        entry.breaksActual = Math.max(entry.breaksActual || 0, st.breaksActual);
        entry.breakRate = st.rate;
        if (st.startTime) entry.screenStartTime = st.startTime;
        saveProjectData(projectData);
        if (logbookMgr) logbookMgr.setEntries(projectData.entries);
        refreshKPIs();
      }
    }
  });

  let recordedStartTime = null;
  const updateStartTimeDisplay = (val) => {
    recordedStartTime = val;
    screenTimer.startTime = val;
    const disp = document.getElementById('screenTimerStartTimeDisplay');
    if (disp) disp.textContent = val || '--:--';
  };

  // Restore saved session for today if user refreshed or restarted computer
  const restoredSession = screenTimer.getState();
  if (restoredSession.startTime) {
    updateStartTimeDisplay(restoredSession.startTime);
  }
  if (restoredSession.totalSeconds > 0) {
    screenTimer.onTick(restoredSession);
    const autoNotice = document.getElementById('timerAutoSaveNotice');
    if (autoNotice) {
      autoNotice.textContent = `✓ กู้คืนเวลาสำหรับวันนี้ ${restoredSession.totalMinutes} นาที (เริ่ม ${restoredSession.startTime || '-'}) พร้อมนับต่อ`;
      autoNotice.classList.remove('hidden');
    }
  }

  const btnSetStartTime = document.getElementById('btnSetTimerStartTimeNow');
  if (btnSetStartTime) {
    btnSetStartTime.addEventListener('click', () => {
      const nowTh = getThailandTime();
      updateStartTimeDisplay(nowTh);
      screenTimer.saveState();
      showToast(`บันทึกเวลาเริ่มใช้จอ: ${nowTh} น. (เวลาจริงประเทศไทย)`, 'info');
    });
  }

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      if (!recordedStartTime) {
        updateStartTimeDisplay(getThailandTime());
      }
      screenTimer.start();
    });
  }
  if (btnPause) btnPause.addEventListener('click', () => screenTimer.pause());
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      screenTimer.reset();
      updateStartTimeDisplay(null);
      const autoNotice = document.getElementById('timerAutoSaveNotice');
      if (autoNotice) autoNotice.classList.add('hidden');
    });
  }
  if (btnAdd15) btnAdd15.addEventListener('click', () => screenTimer.addMinutes(15));
  if (btnAdd45) btnAdd45.addEventListener('click', () => screenTimer.addMinutes(45));

  if (btnLogBreak) {
    btnLogBreak.addEventListener('click', () => {
      screenTimer.logBreak();
      showToast('บันทึกการพักขยับตัวสำเร็จ (+1)', 'success');
    });
  }

  // 2-min Break Buttons
  const btnStartBreak = document.getElementById('btnStart2MinBreak');
  const btnStopBreak = document.getElementById('btnStop2MinBreak');
  if (btnStartBreak) btnStartBreak.addEventListener('click', () => screenTimer.start2MinBreak());
  if (btnStopBreak) btnStopBreak.addEventListener('click', () => screenTimer.stop2MinBreak());

  // Load from Selected Day to continue counting
  const btnLoadDay = document.getElementById('btnLoadFromSelectedDay');
  if (btnLoadDay && selectDay) {
    btnLoadDay.addEventListener('click', () => {
      const dayNum = parseInt(selectDay.value, 10);
      const entry = projectData.entries.find(e => e.day === dayNum);
      if (!entry) return;
      screenTimer.loadFromDayEntry(entry);
      updateStartTimeDisplay(entry.screenStartTime || getThailandTime());
      showToast(`ดึงเวลา ${entry.screenTimeMins || 0} นาที จากวัน D${dayNum} มานับต่อเรียบร้อย`, 'info');
    });
  }

  // Sync to Selected Day
  const btnSync = document.getElementById('btnSyncTimerToDay');
  if (btnSync && selectDay) {
    btnSync.addEventListener('click', () => {
      const dayNum = parseInt(selectDay.value, 10);
      const entry = projectData.entries.find(e => e.day === dayNum);
      if (!entry) return;

      const st = screenTimer.getState();
      entry.screenStartTime = recordedStartTime || st.startTime || getThailandTime();
      entry.screenTimeMins = st.totalMinutes;
      entry.breaksTarget = st.targetBreaks;
      entry.breaksActual = st.breaksActual;
      entry.breakRate = st.rate;

      saveProjectData(projectData);
      if (logbookMgr) logbookMgr.setEntries(projectData.entries);
      refreshKPIs();

      const notice = document.getElementById('timerSyncNotice');
      if (notice) {
        notice.classList.remove('hidden');
        setTimeout(() => notice.classList.add('hidden'), 3000);
      }
      showToast(`บันทึกเริ่ม ${entry.screenStartTime} น. ใช้จอ ${st.totalMinutes} นาที และพัก ${st.breaksActual} ครั้ง ลงวัน D${dayNum} แล้ว`, 'success');
    });
  }
}

// -------------------------------------------------------------
// Timer 2: Guided Self-Massage (6 mins)
// -------------------------------------------------------------
function initMassageRunner() {
  const stepNumEl = document.getElementById('massageStepNumber');
  const areaNameEl = document.getElementById('massageAreaName');
  const sideBadgeEl = document.getElementById('massageSideBadge');
  const descEl = document.getElementById('massageDesc');
  const secEl = document.getElementById('massageSecondsDisplay');
  const barEl = document.getElementById('massageOverallBar');
  const roundEl = document.getElementById('massageRoundBadge');

  const btnStart = document.getElementById('btnStartMassage');
  const btnPause = document.getElementById('btnPauseMassage');
  const btnPrev = document.getElementById('btnPrevMassage');
  const btnNext = document.getElementById('btnNextMassage');
  const btnReset = document.getElementById('btnResetMassage');

  massageRunner = new MassageRoutineRunner({
    onUpdate: (st) => {
      if (stepNumEl) stepNumEl.textContent = `ขั้นตอนที่ ${st.stepIndex + 1} จาก ${st.totalSteps}`;
      if (areaNameEl) areaNameEl.textContent = st.currentStep.name;
      if (sideBadgeEl) sideBadgeEl.textContent = `${st.currentStep.side} (${st.currentStep.dur} วินาที)`;
      if (descEl) descEl.textContent = st.currentStep.desc;
      if (secEl) secEl.textContent = st.secondsLeft;
      if (barEl) barEl.style.width = `${st.progressPct}%`;
      if (roundEl) roundEl.textContent = `${st.currentStep.round} / 2`;

      if (btnStart && btnPause) {
        if (st.isRunning) {
          btnStart.classList.add('hidden');
          btnPause.classList.remove('hidden');
        } else {
          btnStart.classList.remove('hidden');
          btnPause.classList.add('hidden');
        }
      }
    },
    onComplete: () => {
      showToast('🎉 นวดผ่อนคลายครบทั้ง 3 บริเวณ 6 นาทีเรียบร้อย!', 'success');
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }
  });

  if (btnStart) btnStart.addEventListener('click', () => massageRunner.start());
  if (btnPause) btnPause.addEventListener('click', () => massageRunner.pause());
  if (btnPrev) btnPrev.addEventListener('click', () => massageRunner.prev());
  if (btnNext) btnNext.addEventListener('click', () => massageRunner.next());
  if (btnReset) btnReset.addEventListener('click', () => massageRunner.reset());

  // Pain Rating Sliders
  const preSlider = document.getElementById('massagePrePainSlider');
  const preDisp = document.getElementById('massagePrePainDisplay');
  const postSlider = document.getElementById('massagePostPainSlider');
  const postDisp = document.getElementById('massagePostPainDisplay');
  const immDisp = document.getElementById('massageImmReliefDisplay');

  const updateImmRelief = () => {
    const pre = parseInt(preSlider.value, 10);
    const post = parseInt(postSlider.value, 10);
    preDisp.textContent = `${pre} / 10`;
    postDisp.textContent = `${post} / 10`;

    if (pre > 0) {
      const relief = Math.round(((pre - post) / pre) * 100);
      immDisp.textContent = `ลดลง ${relief}% (${relief >= 20 ? 'ผ่านเกณฑ์เป้าหมาย ≥ 20%' : 'ต่ำกว่าเกณฑ์'})`;
      immDisp.className = `font-bold ${relief >= 20 ? 'text-emerald-400' : 'text-amber-400'}`;
    } else {
      immDisp.textContent = 'ไม่มีอาการปวดก่อนนวด (ไม่คำนวณร้อยละ)';
      immDisp.className = 'font-bold text-slate-400';
    }
  };

  if (preSlider && postSlider) {
    preSlider.addEventListener('input', updateImmRelief);
    postSlider.addEventListener('input', updateImmRelief);
    updateImmRelief();
  }

  // Save Massage to Today
  const btnSaveMassage = document.getElementById('btnSaveMassageToToday');
  if (btnSaveMassage) {
    btnSaveMassage.addEventListener('click', () => {
      const selectDay = document.getElementById('selectDayForTimer');
      const dayNum = selectDay ? parseInt(selectDay.value, 10) : 1;
      const entry = projectData.entries.find(e => e.day === dayNum);
      if (!entry) return;

      const pre = parseInt(preSlider.value, 10);
      const post = parseInt(postSlider.value, 10);
      entry.painPreMassage = pre;
      entry.painPostMassage = post;
      entry.immediatePainRelief = pre > 0 ? Number((((pre - post) / pre) * 100).toFixed(1)) : 0;
      entry.massageCompleted = true;
      entry.programCompleted = entry.massageCompleted && entry.exercisesCompleted;

      saveProjectData(projectData);
      if (logbookMgr) logbookMgr.setEntries(projectData.entries);
      refreshKPIs();
      showToast(`บันทึกผลการนวดและติ๊กนวดครบลงในวัน D${dayNum} แล้ว`, 'success');
    });
  }
}

// -------------------------------------------------------------
// Timer 3: Guided 6 Non-Equipment Exercises Routine
// -------------------------------------------------------------
function initWorkoutPlayer() {
  const nameEl = document.getElementById('exerciseNameDisplay');
  const repEl = document.getElementById('exerciseRepBadge');
  const sideEl = document.getElementById('exerciseSideBadge');
  const descEl = document.getElementById('exerciseDescDisplay');
  const secEl = document.getElementById('exerciseSecondsDisplay');
  const phaseLabel = document.getElementById('exercisePhaseLabel');
  const barEl = document.getElementById('exerciseOverallBar');
  const progText = document.getElementById('exerciseProgressText');
  const typeBadge = document.getElementById('exerciseTypeBadge');

  const btnStart = document.getElementById('btnStartEx');
  const btnPause = document.getElementById('btnPauseEx');
  const btnPrev = document.getElementById('btnPrevEx');
  const btnNext = document.getElementById('btnNextEx');
  const btnReset = document.getElementById('btnResetEx');

  workoutPlayer = new WorkoutPlayer({
    onUpdate: (st) => {
      if (nameEl) nameEl.textContent = st.currentEx.name;
      if (descEl) descEl.textContent = st.currentEx.desc;
      if (secEl) secEl.textContent = st.secondsLeft;
      if (barEl) barEl.style.width = `${st.overallProgress}%`;
      if (progText) progText.textContent = `ท่าที่ ${st.exerciseIndex + 1} จาก ${st.totalExercises}`;

      if (repEl) {
        if (st.currentEx.targetReps) {
          repEl.textContent = `ครั้งที่ ${st.currentRep} / ${st.currentEx.targetReps}`;
        }
      }

      if (sideEl) {
        if (st.currentEx.type === 'bilateral_timed') {
          sideEl.classList.remove('hidden');
          sideEl.textContent = st.currentSide === 'left' ? 'ข้างซ้าย' : 'ข้างขวา';
        } else {
          sideEl.classList.add('hidden');
        }
      }

      if (phaseLabel) {
        if (st.phase === 'hold') phaseLabel.textContent = 'ค้างไว้ (HOLD)';
        else if (st.phase === 'rest') phaseLabel.textContent = 'ผ่อนคลาย (REST)';
        else phaseLabel.textContent = 'เตรียมพร้อม';
      }

      if (typeBadge) {
        typeBadge.textContent = st.currentEx.benefit || 'เพิ่มความแข็งแรง & ยืดเหยียด';
      }

      if (btnStart && btnPause) {
        if (st.isRunning) {
          btnStart.classList.add('hidden');
          btnPause.classList.remove('hidden');
        } else {
          btnStart.classList.remove('hidden');
          btnPause.classList.add('hidden');
        }
      }
    },
    onComplete: () => {
      showToast('🏆 ยินดีด้วย! ทำท่าบริหารครบทั้ง 6 ท่าเรียบร้อยแล้ว', 'success');
      // Auto check exercises completed for selected day
      const selectDay = document.getElementById('selectDayForTimer');
      const dayNum = selectDay ? parseInt(selectDay.value, 10) : 1;
      const entry = projectData.entries.find(e => e.day === dayNum);
      if (entry) {
        entry.exercisesCompleted = true;
        entry.programCompleted = entry.massageCompleted && entry.exercisesCompleted;
        saveProjectData(projectData);
        if (logbookMgr) logbookMgr.setEntries(projectData.entries);
        refreshKPIs();
      }
    }
  });

  if (btnStart) btnStart.addEventListener('click', () => workoutPlayer.start());
  if (btnPause) btnPause.addEventListener('click', () => workoutPlayer.pause());
  if (btnPrev) btnPrev.addEventListener('click', () => workoutPlayer.prevExercise());
  if (btnNext) btnNext.addEventListener('click', () => workoutPlayer.skipExercise());
  if (btnReset) btnReset.addEventListener('click', () => workoutPlayer.reset());

  // Save to Today
  const btnSaveEx = document.getElementById('btnSaveExercisesToToday');
  if (btnSaveEx) {
    btnSaveEx.addEventListener('click', () => {
      const selectDay = document.getElementById('selectDayForTimer');
      const dayNum = selectDay ? parseInt(selectDay.value, 10) : 1;
      const entry = projectData.entries.find(e => e.day === dayNum);
      if (!entry) return;

      entry.exercisesCompleted = true;
      entry.programCompleted = entry.massageCompleted && entry.exercisesCompleted;

      saveProjectData(projectData);
      if (logbookMgr) logbookMgr.setEntries(projectData.entries);
      refreshKPIs();
      showToast(`ติ๊กทำท่าบริหารครบ 6 ท่า ลงในวัน D${dayNum} เรียบร้อยแล้ว`, 'success');
    });
  }
}

// -------------------------------------------------------------
// Milestone Posture Evidence Gallery & Photo Preview
// -------------------------------------------------------------
let activePreviewDay = 1;

function downloadSinglePhoto(dayNum) {
  const entry = projectData.entries.find(e => e.day === dayNum);
  if (!entry) return;
  const src = entry.annotatedPhoto || entry.photoUrl || '/sample_baseline.png';
  const a = document.createElement('a');
  a.href = src;
  a.download = entry.photoFileName || `Ergonomics_D${dayNum}_${projectData.info.studentId}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`ดาวน์โหลดรูปภาพวัน D${dayNum} (${a.download}) เรียบร้อย นำไปแทรกใน Excel ชีตภาพและมุมได้ทันที`, 'success');
}

function loadMilestoneIntoCanvas(dayNum) {
  const entry = projectData.entries.find(e => e.day === dayNum);
  if (!entry || !angleTool) return;
  const src = entry.annotatedPhoto || entry.photoUrl || '/sample_baseline.png';
  angleTool.loadImage(src);
  if (dayNum === 1) {
    angleTool.setPreset('baseline');
  } else if (dayNum === 30) {
    angleTool.setPreset('corrected_90');
  }
  const selectDay = document.getElementById('selectMilestoneDay');
  if (selectDay) selectDay.value = dayNum;
  window.scrollTo({ top: 400, behavior: 'smooth' });
  showToast(`โหลดภาพและตั้งค่าสำหรับวัน D${dayNum} เข้าสู่ Canvas เรียบร้อย`, 'info');
}

function openPhotoPreview(dayNum) {
  const entry = projectData.entries.find(e => e.day === dayNum);
  if (!entry) return;
  activePreviewDay = dayNum;

  const modal = document.getElementById('modalPhotoPreview');
  const badgeEl = document.getElementById('previewModalDayBadge');
  const dateEl = document.getElementById('previewModalDate');
  const titleEl = document.getElementById('previewModalTitle');
  const imgEl = document.getElementById('previewModalImg');

  const elEl = document.getElementById('previewElbowVal');
  const hipEl = document.getElementById('previewHipVal');
  const kneeEl = document.getElementById('previewKneeVal');
  const scoreEl = document.getElementById('previewScoreVal');

  if (badgeEl) badgeEl.textContent = `วัน D${entry.day} (Milestone Day)`;
  if (dateEl) dateEl.textContent = `วันที่ประเมิน: ${entry.date}`;
  if (titleEl) titleEl.textContent = `ภาพถ่ายประเมินมุมการยศาสตร์ 90-90-90 (วัน D${entry.day})`;

  const photoSrc = entry.annotatedPhoto || entry.photoUrl || '/sample_baseline.png';
  if (imgEl) imgEl.src = photoSrc;

  if (elEl) elEl.textContent = `${entry.elbowAngle !== null ? entry.elbowAngle + '°' : '-'} (${entry.elbowPass ? 'ผ่าน ✓' : 'ไม่ผ่าน ✗'})`;
  if (hipEl) hipEl.textContent = `${entry.hipAngle !== null ? entry.hipAngle + '°' : '-'} (${entry.hipPass ? 'ผ่าน ✓' : 'ไม่ผ่าน ✗'})`;
  if (kneeEl) kneeEl.textContent = `${entry.kneeAngle !== null ? entry.kneeAngle + '°' : '-'} (${entry.kneePass ? 'ผ่าน ✓' : 'ไม่ผ่าน ✗'})`;
  if (scoreEl) scoreEl.textContent = `ผ่าน ${entry.postureScore !== null ? entry.postureScore : 0}/4 ข้อ (${entry.posturePercentage !== null ? entry.posturePercentage : 0}%)`;

  if (modal) modal.classList.remove('hidden');
}

let currentGalleryFilter = 'all';

function renderMilestoneGallery(filter = currentGalleryFilter) {
  currentGalleryFilter = filter;
  const container = document.getElementById('milestoneGalleryCards');
  if (!container) return;
  container.innerHTML = '';

  // Stats badge
  const withPhotoCount = projectData.entries.filter(e => !!(e.annotatedPhoto || e.photoUrl)).length;
  const statsCountEl = document.getElementById('galleryStatsCount');
  if (statsCountEl) {
    statsCountEl.textContent = `${withPhotoCount} / 30 วัน (${Math.round((withPhotoCount / 30) * 100)}%)`;
  }

  const dayLabels = {
    1: 'D1 (Baseline ⭐)',
    7: 'D7 (สัปดาห์ 1 ⭐)',
    14: 'D14 (สัปดาห์ 2 ⭐)',
    21: 'D21 (สัปดาห์ 3 ⭐)',
    30: 'D30 (สิ้นสุดโครงการ ⭐)'
  };

  const targetEntries = projectData.entries.filter(e => {
    if (filter === 'w1') return e.day >= 1 && e.day <= 7;
    if (filter === 'w2') return e.day >= 8 && e.day <= 14;
    if (filter === 'w3') return e.day >= 15 && e.day <= 21;
    if (filter === 'w4') return e.day >= 22 && e.day <= 30;
    if (filter === 'milestones') return MILESTONE_DAYS.includes(e.day);
    if (filter === 'missing') return !(e.annotatedPhoto || e.photoUrl);
    return true;
  });

  if (targetEntries.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center space-y-2 bg-[#0c0e14] rounded-2xl border border-[#242938]">
        <span class="text-3xl block">🎉</span>
        <p class="text-sm font-medium text-emerald-400">
          ${filter === 'missing' ? 'ยอดเยี่ยม! มีภาพถ่ายหลักฐานครบถ้วนทั้ง 30 วันแล้ว (100%)' : 'ไม่พบข้อมูลในหมวดที่เลือก'}
        </p>
      </div>
    `;
    return;
  }

  targetEntries.forEach(entry => {
    const dayNum = entry.day;
    const card = document.createElement('div');
    const isM = MILESTONE_DAYS.includes(dayNum);
    const hasPhoto = !!(entry.annotatedPhoto || entry.photoUrl);
    const photoSrc = entry.annotatedPhoto || entry.photoUrl || '/sample_baseline.png';
    const isPassing = (entry.posturePercentage || 0) >= 75;

    card.className = `bg-[#0f121d] rounded-2xl border ${isM ? 'border-amber-800/60' : 'border-[#242938]'} hover:border-cyan-500/50 p-3.5 flex flex-col justify-between space-y-3 transition shadow-lg group`;

    const labelText = dayLabels[dayNum] || `D${dayNum}`;
    const badgeHtml = hasPhoto
      ? `<span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold border ${isPassing ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'}">
          ${entry.postureScore !== null ? `${entry.postureScore}/4 (${entry.posturePercentage}%)` : 'มีภาพ'}
         </span>`
      : `<span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold border bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse">
          ⚠️ ขาดภาพ
         </span>`;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold text-white font-mono flex items-center gap-1">
            ${labelText}
          </span>
          ${badgeHtml}
        </div>
        <div class="text-[10px] text-slate-400 font-mono mb-2">${entry.date}</div>

        <!-- Thumbnail Image -->
        <div class="relative rounded-xl overflow-hidden bg-[#07080d] border border-[#1e2330] aspect-[4/3] flex items-center justify-center cursor-pointer group-hover:border-cyan-500/40 transition">
          ${hasPhoto 
            ? `<img src="${photoSrc}" alt="D${dayNum} Posture" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
               <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                 <span>🔍 ดูภาพขยาย</span>
               </div>`
            : `<div class="text-center p-3 text-slate-500 space-y-1">
                 <span class="text-2xl block">📷</span>
                 <span class="text-[10px] block text-rose-300">ยังไม่มีภาพ D${dayNum}</span>
                 <span class="text-[9px] block text-slate-500">คลิกเพื่อใส่ภาพ</span>
               </div>`
          }
        </div>

        <!-- Angles Quick Summary -->
        <div class="mt-2.5 space-y-1 text-[10px] text-slate-300 bg-[#07080d] p-2 rounded-lg border border-[#181c28] font-mono">
          <div class="flex justify-between">
            <span class="text-slate-400">ศอก:</span>
            <span class="${entry.elbowPass ? 'text-emerald-400 font-bold' : (entry.elbowAngle ? 'text-rose-400' : 'text-slate-500')}">${entry.elbowAngle !== null ? `${entry.elbowAngle}° ${entry.elbowPass ? '✓' : '✗'}` : '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">สะโพก:</span>
            <span class="${entry.hipPass ? 'text-emerald-400 font-bold' : (entry.hipAngle ? 'text-rose-400' : 'text-slate-500')}">${entry.hipAngle !== null ? `${entry.hipAngle}° ${entry.hipPass ? '✓' : '✗'}` : '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">เข่า:</span>
            <span class="${entry.kneePass ? 'text-emerald-400 font-bold' : (entry.kneeAngle ? 'text-rose-400' : 'text-slate-500')}">${entry.kneeAngle !== null ? `${entry.kneeAngle}° ${entry.kneePass ? '✓' : '✗'}` : '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">สายตา:</span>
            <span class="${entry.eyeLevelPass ? 'text-emerald-400' : 'text-slate-500'}">${entry.eyeLevelPass !== null ? (entry.eyeLevelPass ? 'ผ่าน ✓' : 'ปรับปรุง') : '-'}</span>
          </div>
        </div>
      </div>

      <!-- Card Action Buttons -->
      <div class="pt-2 border-t border-[#1e2330] space-y-1.5 text-[11px]">
        ${hasPhoto ? `
          <div class="grid grid-cols-2 gap-1.5">
            <button type="button" class="btn-preview-card py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-medium transition text-center cursor-pointer" data-day="${dayNum}">
              🔍 ดูภาพ
            </button>
            <button type="button" class="btn-download-card py-1.5 px-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-medium transition text-center cursor-pointer" data-day="${dayNum}">
              💾 โหลดรูป
            </button>
          </div>
          <button type="button" class="btn-load-canvas-card w-full py-1.5 px-2 rounded-lg bg-[#141723] hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-[#242938] hover:border-cyan-800 font-medium transition text-center cursor-pointer" data-day="${dayNum}">
            ✏️ โหลดเข้า Canvas เพื่อวัดมุม
          </button>
        ` : `
          <button type="button" class="btn-load-canvas-card w-full py-2 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition text-center cursor-pointer shadow flex items-center justify-center gap-1" data-day="${dayNum}">
            <span>📷</span> + ใส่ภาพท่านั่ง D${dayNum}
          </button>
        `}
      </div>
    `;

    // Click on thumbnail
    const thumbBox = card.querySelector('.relative');
    if (thumbBox) {
      thumbBox.addEventListener('click', () => {
        if (hasPhoto) {
          openPhotoPreview(dayNum);
        } else {
          loadMilestoneIntoCanvas(dayNum);
        }
      });
    }

    const btnPrev = card.querySelector('.btn-preview-card');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => openPhotoPreview(dayNum));
    }

    const btnDown = card.querySelector('.btn-download-card');
    if (btnDown) {
      btnDown.addEventListener('click', () => {
        downloadSinglePhoto(dayNum);
      });
    }

    const btnLoad = card.querySelector('.btn-load-canvas-card');
    if (btnLoad) {
      btnLoad.addEventListener('click', () => {
        loadMilestoneIntoCanvas(dayNum);
      });
    }

    container.appendChild(card);
  });
}

function initMilestoneGalleryEvents() {
  // Gallery filter buttons
  const galleryFilters = document.querySelectorAll('.gallery-filter-btn');
  galleryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryFilters.forEach(b => {
        b.classList.remove('active', 'bg-cyan-950', 'text-cyan-300', 'border-cyan-800');
        b.classList.add('bg-[#161923]', 'text-slate-300', 'border-[#242938]');
      });
      btn.classList.add('active', 'bg-cyan-950', 'text-cyan-300', 'border-cyan-800');
      btn.classList.remove('bg-[#161923]', 'text-slate-300', 'border-[#242938]');
      const f = btn.getAttribute('data-gallery-filter');
      renderMilestoneGallery(f);
    });
  });

  const btnDownloadAll = document.getElementById('btnDownloadAllMilestones');
  if (btnDownloadAll) {
    btnDownloadAll.addEventListener('click', () => {
      let count = 0;
      projectData.entries.forEach((entry) => {
        if (entry && (entry.annotatedPhoto || entry.photoUrl)) {
          setTimeout(() => {
            downloadSinglePhoto(entry.day);
          }, count * 300);
          count++;
        }
      });
      if (count > 0) {
        showToast(`กำลังดาวน์โหลดรูปภาพหลักฐาน ${count} ภาพสำหรับแทรกใน Excel...`, 'info');
      } else {
        showToast('ยังไม่มีภาพถ่ายหลักฐานที่บันทึกไว้ในระบบ', 'warn');
      }
    });
  }

  const btnClosePreview = document.getElementById('btnClosePhotoModal');
  const photoModal = document.getElementById('modalPhotoPreview');
  if (btnClosePreview && photoModal) {
    btnClosePreview.addEventListener('click', () => photoModal.classList.add('hidden'));
    photoModal.addEventListener('click', (e) => {
      if (e.target === photoModal) photoModal.classList.add('hidden');
    });
  }

  const btnDownloadPreview = document.getElementById('btnDownloadPreviewImg');
  if (btnDownloadPreview) {
    btnDownloadPreview.addEventListener('click', () => {
      downloadSinglePhoto(activePreviewDay);
    });
  }

  const btnLoadPreviewCanvas = document.getElementById('btnLoadPreviewIntoCanvas');
  if (btnLoadPreviewCanvas) {
    btnLoadPreviewCanvas.addEventListener('click', () => {
      if (photoModal) photoModal.classList.add('hidden');
      const tabBtn = document.querySelector('[data-tab="tab-angle"]');
      if (tabBtn) tabBtn.click();
      loadMilestoneIntoCanvas(activePreviewDay);
    });
  }
}

// -------------------------------------------------------------
// Initialize App
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // Sound unlock on first interaction & notification permission
  document.addEventListener('click', () => {
    sound.init();
    requestNotificationPermission();
  }, { once: true });

  // Charts
  charts = new DashboardCharts();

  // Logbook with photo viewer and angle navigation callbacks
  logbookMgr = new LogbookManager({
    onDataChange: (newEntries) => {
      projectData.entries = newEntries;
      saveProjectData(projectData);
      refreshKPIs();
      renderMilestoneGallery();
    },
    onViewPhoto: (dayNum) => {
      openPhotoPreview(dayNum);
    },
    onGotoAngle: (dayNum) => {
      const tabBtn = document.querySelector('[data-tab="tab-angle"]');
      if (tabBtn) tabBtn.click();
      const selectDay = document.getElementById('selectMilestoneDay');
      if (selectDay) selectDay.value = dayNum;
      loadMilestoneIntoCanvas(dayNum);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  });
  logbookMgr.setEntries(projectData.entries);
  window.projectData = projectData;
  window.logbookMgr = logbookMgr;

  // Initialize Angle Tool
  initAngleTool();

  // Initialize Timers
  initScreenTimer();
  initMassageRunner();
  initWorkoutPlayer();

  // Navigation
  initNavigation();

  // Initialize Milestone Gallery and Modal Events
  renderMilestoneGallery();
  initMilestoneGalleryEvents();

  // Thailand Live Clock (Real-time UTC+7 Asia/Bangkok)
  function initThailandClocks() {
    const update = () => {
      const timeStr = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const navClock = document.getElementById('navThailandClock');
      if (navClock) navClock.textContent = timeStr;
      const screenClock = document.getElementById('screenLiveThailandClock');
      if (screenClock) screenClock.textContent = `${timeStr} น.`;
    };
    update();
    setInterval(update, 1000);
  }
  initThailandClocks();

  // Top Buttons
  const btnDemo = document.getElementById('btnLoadDemo');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      if (confirm('คุณต้องการโหลดข้อมูลตัวอย่าง 30 วันตามเอกสารวิจัยใช่หรือไม่? (ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูล Proposal)')) {
        projectData.entries = generateSampleData();
        saveProjectData(projectData);
        logbookMgr.setEntries(projectData.entries);
        refreshKPIs();
        renderMilestoneGallery();
        showToast('โหลดข้อมูลตัวอย่าง 30 วันตาม Proposal เรียบร้อยแล้ว', 'success');
      }
    });
  }

  const btnReset = document.getElementById('btnResetData');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด และเริ่มบันทึกใหม่ 30 วัน?')) {
        projectData.entries = createBlankEntries();
        saveProjectData(projectData);
        logbookMgr.setEntries(projectData.entries);
        refreshKPIs();
        renderMilestoneGallery();
        showToast('ล้างข้อมูลเรียบร้อย พร้อมเริ่มบันทึกข้อมูลจริง', 'info');
      }
    });
  }

  const btnExport = document.getElementById('btnExportExcel');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportToExcel(projectData);
      showToast('สร้างไฟล์ Excel 3 ชีตเรียบร้อยแล้ว กำลังดาวน์โหลด...', 'success');
    });
  }

  // Initial KPIs & Charts render
  refreshKPIs();
});
