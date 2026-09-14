// Timers: Screen Time / 45-min Break Reminder, 6-min Self-Massage, and 6 Exercises Guided Routine
import { sound } from '../utils/audio.js';
import confetti from 'canvas-confetti';
import { getThailandTime, getThailandDate } from '../data/storage.js';

const TIMER_STORAGE_KEY = 'health30d_screen_timer_session';

export class ScreenTimer {
  constructor(options = {}) {
    this.totalSeconds = 0; // Cumulative screen time
    this.breakCountdown = 45 * 60; // 45 minutes in seconds
    this.isRunning = false;
    this.timerId = null;
    this.breaksActual = 0;
    this.startTime = null;
    this.targetDay = options.targetDay || 1;
    this.onTick = options.onTick || (() => {});
    this.onBreakTrigger = options.onBreakTrigger || (() => {});
    this.onAutoSave = options.onAutoSave || (() => {});

    // 2-minute break countdown timer
    this.breakTimerRunning = false;
    this.breakTimerSeconds = 120;
    this.breakTimerId = null;
    this.onBreakTick = options.onBreakTick || (() => {});

    // Load any saved active session for today (prevents data loss on computer shutdown/refresh)
    this.hasRestoredSession = this.loadSavedSession();

    // Auto-save on window close or beforeunload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveState();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.saveState();
        }
      });
    }
  }

  loadSavedSession() {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      const today = getThailandDate();

      // Only restore if from the same calendar day in Thailand time
      if (saved && saved.date === today) {
        this.totalSeconds = typeof saved.totalSeconds === 'number' ? Math.max(0, saved.totalSeconds) : 0;
        this.breakCountdown = typeof saved.breakCountdown === 'number' ? Math.max(0, saved.breakCountdown) : (45 * 60);
        this.breaksActual = typeof saved.breaksActual === 'number' ? Math.max(0, saved.breaksActual) : 0;
        this.startTime = saved.startTime || null;
        this.targetDay = saved.targetDay || this.targetDay;
        return true;
      }
    } catch (e) {
      console.warn('Failed to restore screen timer session:', e);
    }
    return false;
  }

  saveState() {
    try {
      const today = getThailandDate();
      const payload = {
        date: today,
        totalSeconds: this.totalSeconds,
        breakCountdown: this.breakCountdown,
        breaksActual: this.breaksActual,
        startTime: this.startTime,
        targetDay: this.targetDay,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(payload));
      this.onAutoSave(this.getState());
    } catch (e) {
      console.warn('Failed to save screen timer session:', e);
    }
  }

  clearSavedSession() {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (e) {}
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (!this.startTime) {
      this.startTime = getThailandTime();
    }
    sound.playBeep(520, 0.1);
    this.saveState();

    this.timerId = setInterval(() => {
      this.totalSeconds++;
      this.breakCountdown--;

      if (this.breakCountdown <= 0) {
        this.breakCountdown = 45 * 60; // reset next 45 min interval
        sound.playBreakAlert();
        this.onBreakTrigger();
      }

      // Auto-save every 5 seconds while running to survive sudden power cuts or browser crashes
      if (this.totalSeconds % 5 === 0) {
        this.saveState();
      }

      this.onTick(this.getState());
    }, 1000);

    this.onTick(this.getState());
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.saveState();
    this.onTick(this.getState());
  }

  reset() {
    this.pause();
    this.totalSeconds = 0;
    this.breakCountdown = 45 * 60;
    this.breaksActual = 0;
    this.startTime = null;
    this.clearSavedSession();
    this.onTick(this.getState());
  }

  addMinutes(mins) {
    this.totalSeconds = Math.max(0, this.totalSeconds + mins * 60);
    this.saveState();
    this.onTick(this.getState());
  }

  setMinutes(mins) {
    this.totalSeconds = Math.max(0, mins * 60);
    this.saveState();
    this.onTick(this.getState());
  }

  logBreak() {
    this.breaksActual++;
    sound.playSuccess();
    this.saveState();
    this.onTick(this.getState());
  }

  loadFromDayEntry(entry) {
    if (!entry) return;
    this.pause();
    this.totalSeconds = (entry.screenTimeMins || 0) * 60;
    this.breakCountdown = 45 * 60;
    this.breaksActual = entry.breaksActual || 0;
    this.startTime = entry.screenStartTime || getThailandTime();
    this.targetDay = entry.day;
    this.saveState();
    this.onTick(this.getState());
  }

  start2MinBreak() {
    this.breakTimerRunning = true;
    this.breakTimerSeconds = 120;
    if (this.breakTimerId) clearInterval(this.breakTimerId);

    this.breakTimerId = setInterval(() => {
      this.breakTimerSeconds--;
      if (this.breakTimerSeconds <= 0) {
        clearInterval(this.breakTimerId);
        this.breakTimerRunning = false;
        sound.playSuccess();
      }
      this.onBreakTick({
        secondsLeft: this.breakTimerSeconds,
        running: this.breakTimerRunning
      });
    }, 1000);

    this.onBreakTick({
      secondsLeft: this.breakTimerSeconds,
      running: this.breakTimerRunning
    });
  }

  stop2MinBreak() {
    if (this.breakTimerId) clearInterval(this.breakTimerId);
    this.breakTimerRunning = false;
    this.onBreakTick({ secondsLeft: this.breakTimerSeconds, running: false });
  }

  getState() {
    const totalMinutes = Math.floor(this.totalSeconds / 60);
    const targetBreaks = Math.floor(totalMinutes / 45);
    const rate = targetBreaks > 0 ? Math.min(100, Math.round((this.breaksActual / targetBreaks) * 100)) : (this.breaksActual > 0 ? 100 : 0);

    return {
      totalSeconds: this.totalSeconds,
      totalMinutes,
      breakCountdown: this.breakCountdown,
      isRunning: this.isRunning,
      targetBreaks,
      breaksActual: this.breaksActual,
      rate,
      startTime: this.startTime,
      targetDay: this.targetDay,
      hasRestoredSession: this.hasRestoredSession
    };
  }
}

// 6-Minute Self-Massage Guided Routine
// 3 Areas x 2 Sides (Left/Right 30s) x 2 Rounds = 6 mins (360s)
export const MASSAGE_STEPS = [
  { area: 1, name: 'บีบคลึงกล้ามเนื้อระหว่างคอกับหัวไหล่', side: 'ข้างซ้าย', dur: 30, round: 1, desc: 'ใช้นิ้วมือขวาบีบคลึงเบาๆ บริเวณบ่าซ้าย ระดับความปวดต้องไม่เกิน 3/10' },
  { area: 1, name: 'บีบคลึงกล้ามเนื้อระหว่างคอกับหัวไหล่', side: 'ข้างขวา', dur: 30, round: 1, desc: 'ใช้นิ้วมือซ้ายบีบคลึงเบาๆ บริเวณบ่าขวา ห้ามบีบหรือกดกระแทกรุนแรง' },
  { area: 2, name: 'ปลายนิ้วนวดวนบนกล้ามเนื้อด้านหลังหัวไหล่', side: 'ข้างซ้าย', dur: 30, round: 1, desc: 'ใช้ปลายนิ้วมือขวานวดวนกลมๆ บริเวณหลังหัวไหล่ซ้าย ผ่อนคลายกล้ามเนื้อสะบัก' },
  { area: 2, name: 'ปลายนิ้วนวดวนบนกล้ามเนื้อด้านหลังหัวไหล่', side: 'ข้างขวา', dur: 30, round: 1, desc: 'ใช้ปลายนิ้วมือซ้ายนวดวนกลมๆ บริเวณหลังหัวไหล่ขวา' },
  { area: 3, name: 'นวดวนบนกล้ามเนื้อหน้าอกส่วนบนใกล้หัวไหล่', side: 'ข้างซ้าย', dur: 30, round: 1, desc: 'นวดวนเบาๆ ใต้กระดูกไหปลาร้าใกล้หัวไหล่ซ้าย คลายกล้ามเนื้ออกที่ตึงจากการเอื้อม' },
  { area: 3, name: 'นวดวนบนกล้ามเนื้อหน้าอกส่วนบนใกล้หัวไหล่', side: 'ข้างขวา', dur: 30, round: 1, desc: 'นวดวนเบาๆ ใต้กระดูกไหปลาร้าใกล้หัวไหล่ขวา' },

  // Round 2
  { area: 1, name: 'บีบคลึงกล้ามเนื้อระหว่างคอกับหัวไหล่', side: 'ข้างซ้าย', dur: 30, round: 2, desc: 'รอบที่ 2: บีบคลึงบ่าซ้าย นุ่มนวล ไม่เกร็งคอ' },
  { area: 1, name: 'บีบคลึงกล้ามเนื้อระหว่างคอกับหัวไหล่', side: 'ข้างขวา', dur: 30, round: 2, desc: 'รอบที่ 2: บีบคลึงบ่าขวา หายใจเข้าออกสม่ำเสมอ' },
  { area: 2, name: 'ปลายนิ้วนวดวนบนกล้ามเนื้อด้านหลังหัวไหล่', side: 'ข้างซ้าย', dur: 30, round: 2, desc: 'รอบที่ 2: นวดวนหลังไหล่ซ้าย' },
  { area: 2, name: 'ปลายนิ้วนวดวนบนกล้ามเนื้อด้านหลังหัวไหล่', side: 'ข้างขวา', dur: 30, round: 2, desc: 'รอบที่ 2: นวดวนหลังไหล่ขวา' },
  { area: 3, name: 'นวดวนบนกล้ามเนื้อหน้าอกส่วนบนใกล้หัวไหล่', side: 'ข้างซ้าย', dur: 30, round: 2, desc: 'รอบที่ 2: นวดวนกล้ามเนื้อหน้าอกซ้าย' },
  { area: 3, name: 'นวดวนบนกล้ามเนื้อหน้าอกส่วนบนใกล้หัวไหล่', side: 'ข้างขวา', dur: 30, round: 2, desc: 'รอบที่ 2: นวดวนกล้ามเนื้อหน้าอกขวา' }
];

export class MassageRoutineRunner {
  constructor(options = {}) {
    this.stepIndex = 0;
    this.secondsLeft = 30;
    this.isRunning = false;
    this.timerId = null;
    this.onUpdate = options.onUpdate || (() => {});
    this.onComplete = options.onComplete || (() => {});
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    sound.playBeep(660, 0.2);

    this.timerId = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 3 && this.secondsLeft > 0) {
        sound.playCountdownTick();
      }

      if (this.secondsLeft <= 0) {
        this.stepIndex++;
        if (this.stepIndex >= MASSAGE_STEPS.length) {
          this.pause();
          this.stepIndex = MASSAGE_STEPS.length - 1;
          this.secondsLeft = 0;
          sound.playSuccess();
          this.onComplete();
        } else {
          sound.playBeep(880, 0.25);
          this.secondsLeft = MASSAGE_STEPS[this.stepIndex].dur;
        }
      }
      this.onUpdate(this.getState());
    }, 1000);

    this.onUpdate(this.getState());
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.onUpdate(this.getState());
  }

  reset() {
    this.pause();
    this.stepIndex = 0;
    this.secondsLeft = MASSAGE_STEPS[0].dur;
    this.onUpdate(this.getState());
  }

  next() {
    if (this.stepIndex < MASSAGE_STEPS.length - 1) {
      this.stepIndex++;
      this.secondsLeft = MASSAGE_STEPS[this.stepIndex].dur;
      sound.playBeep(700, 0.1);
      this.onUpdate(this.getState());
    }
  }

  prev() {
    if (this.stepIndex > 0) {
      this.stepIndex--;
      this.secondsLeft = MASSAGE_STEPS[this.stepIndex].dur;
      sound.playBeep(500, 0.1);
      this.onUpdate(this.getState());
    }
  }

  getState() {
    const currentStep = MASSAGE_STEPS[this.stepIndex] || MASSAGE_STEPS[0];
    const totalElapsed = (this.stepIndex * 30) + (30 - this.secondsLeft);
    const progressPct = Math.round((totalElapsed / 360) * 100);

    return {
      currentStep,
      stepIndex: this.stepIndex,
      totalSteps: MASSAGE_STEPS.length,
      secondsLeft: this.secondsLeft,
      isRunning: this.isRunning,
      progressPct: Math.min(100, progressPct),
      isFinished: this.stepIndex >= MASSAGE_STEPS.length - 1 && this.secondsLeft === 0
    };
  }
}

// 6 Non-Equipment Exercises Defined in Proposal
export const EXERCISE_LIST = [
  {
    id: 1,
    name: '1. ดึงคางกลับ (Chin Tuck)',
    type: 'reps_hold',
    holdSeconds: 5,
    restSeconds: 2,
    targetReps: 10,
    desc: 'นั่งหลังตรงและมองไปข้างหน้า เลื่อนศีรษะตรงไปข้างหลังจนคางร่นเข้า คล้ายทำคางสองชั้น โดยไม่ก้มและไม่เงย',
    target: 'ค้าง 5 วินาที × 10 ครั้ง',
    benefit: 'เพิ่มความแข็งแรงกล้ามเนื้องอคอด้านลึก (Deep Neck Flexors) ลดศีรษะยื่น'
  },
  {
    id: 2,
    name: '2. บีบสะบัก (Scapular Retraction)',
    type: 'reps_hold',
    holdSeconds: 5,
    restSeconds: 2,
    targetReps: 10,
    desc: 'นั่งหรือยืนตรง ปล่อยแขนข้างลำตัว ดึงสะบักเข้าหากันและลงเล็กน้อย ระวังไม่ยักไหล่และไม่แอ่นหลัง',
    target: 'ค้าง 5 วินาที × 10 ครั้ง',
    benefit: 'ฝึกความแข็งแรงกล้ามเนื้อรอบสะบัก (Rhomboids / Mid Trapezius)'
  },
  {
    id: 3,
    name: '3. เลื่อนแขนบนผนัง (Wall Slide)',
    type: 'reps_dynamic',
    cadenceSeconds: 6, // 3s up, 3s down
    targetReps: 10,
    desc: 'ยืนหันหน้าเข้าผนัง งอข้อศอกประมาณ 90° วางท่อนแขนทั้งสองบนผนังโดยเว้นระยะเท่าความกว้างหัวไหล่ เลื่อนแขนขึ้นช้าๆ เท่าที่ไม่เจ็บและไม่ยักไหล่ แล้วเลื่อนกลับลง',
    target: '10 ครั้ง (ช้าและไม่ยักไหล่)',
    benefit: 'ฝึกการเคลื่อนไหวสะบักและ Serratus anterior'
  },
  {
    id: 4,
    name: '4. ยืดบ่าด้านข้าง (Side Neck / Upper Trap Stretch)',
    type: 'bilateral_timed',
    holdSeconds: 20,
    targetReps: 2,
    desc: 'มือซ้ายจับขอบเก้าอี้เพื่อยึดไหล่ซ้ายไม่ให้ยกขึ้น แล้วเอียงศีรษะไปทางขวาจนตึงบ่าด้านซ้าย ทำสลับอีกข้าง โดยไม่ใช้มือดึงศีรษะ',
    target: 'ข้างละ 20 วินาที × 2 ครั้ง',
    benefit: 'ยืดคลาย Upper Trapezius โดยไม่กระชากหรือดึงคอแรง'
  },
  {
    id: 5,
    name: '5. ยืดกล้ามเนื้อยกสะบัก (Levator Scapulae Stretch)',
    type: 'bilateral_timed',
    holdSeconds: 20,
    targetReps: 2,
    desc: 'หันหน้าไปทางขวาประมาณ 45° แล้วก้มศีรษะเฉียงลงคล้ายมองรักแร้ขวาจนตึงหลังคอด้านซ้าย กลับมาตรงและทำสลับอีกข้าง โดยไม่ใช้มือกดหรือดึงศีรษะ',
    target: 'ข้างละ 20 วินาที × 2 ครั้ง',
    benefit: 'ยืดคลายกล้ามเนื้อยกสะบัก (Levator Scapulae) บริเวณมุมคอด้านหลัง'
  },
  {
    id: 6,
    name: '6. ยืดหน้าอกกับผนัง (Chest Wall Stretch)',
    type: 'bilateral_timed',
    holdSeconds: 20,
    targetReps: 2,
    desc: 'ยืนหันข้างเข้าผนัง วางฝ่ามือและท่อนแขนบนผนัง ให้ข้อศอกอยู่ระดับเดียวกับหัวไหล่ ค่อยๆ หมุนลำตัวออกจากผนังจนตึงหน้าอกแต่ไม่เจ็บหัวไหล่ ทำสลับข้าง',
    target: 'ข้างละ 20 วินาที × 2 ครั้ง',
    benefit: 'เปิดหน้าอก ยืด Pectoralis Major/Minor ลดอาการไหล่ห่อ'
  }
];

export class WorkoutPlayer {
  constructor(options = {}) {
    this.exerciseIndex = 0;
    this.currentRep = 1;
    this.currentSide = 'left'; // for bilateral exercises: 'left' or 'right'
    this.phase = 'ready'; // 'ready', 'hold', 'rest', 'completed'
    this.secondsLeft = 5;
    this.isRunning = false;
    this.timerId = null;
    this.onUpdate = options.onUpdate || (() => {});
    this.onComplete = options.onComplete || (() => {});
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.setupExercisePhase();
    sound.playBeep(600, 0.15);

    this.timerId = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 3 && this.secondsLeft > 0) {
        sound.playCountdownTick();
      }

      if (this.secondsLeft <= 0) {
        this.nextPhase();
      }
      this.onUpdate(this.getState());
    }, 1000);

    this.onUpdate(this.getState());
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.onUpdate(this.getState());
  }

  setupExercisePhase() {
    const ex = EXERCISE_LIST[this.exerciseIndex];
    if (ex.type === 'reps_hold') {
      this.phase = 'hold';
      this.secondsLeft = ex.holdSeconds;
    } else if (ex.type === 'reps_dynamic') {
      this.phase = 'hold';
      this.secondsLeft = ex.cadenceSeconds;
    } else if (ex.type === 'bilateral_timed') {
      this.phase = 'hold';
      this.secondsLeft = ex.holdSeconds;
    }
  }

  nextPhase() {
    const ex = EXERCISE_LIST[this.exerciseIndex];

    if (ex.type === 'reps_hold') {
      if (this.phase === 'hold') {
        sound.playBeep(880, 0.15);
        if (this.currentRep >= ex.targetReps) {
          this.advanceExercise();
        } else {
          this.phase = 'rest';
          this.secondsLeft = ex.restSeconds;
        }
      } else {
        // rest ended -> next rep
        this.currentRep++;
        this.phase = 'hold';
        this.secondsLeft = ex.holdSeconds;
        sound.playBeep(550, 0.1);
      }
    } else if (ex.type === 'reps_dynamic') {
      sound.playBeep(750, 0.1);
      if (this.currentRep >= ex.targetReps) {
        this.advanceExercise();
      } else {
        this.currentRep++;
        this.phase = 'hold';
        this.secondsLeft = ex.cadenceSeconds;
      }
    } else if (ex.type === 'bilateral_timed') {
      sound.playBeep(880, 0.15);
      if (this.currentSide === 'left') {
        this.currentSide = 'right';
        this.secondsLeft = ex.holdSeconds;
      } else {
        // right side finished
        if (this.currentRep >= ex.targetReps) {
          this.advanceExercise();
        } else {
          this.currentRep++;
          this.currentSide = 'left';
          this.secondsLeft = ex.holdSeconds;
        }
      }
    }
  }

  advanceExercise() {
    if (this.exerciseIndex >= EXERCISE_LIST.length - 1) {
      this.pause();
      this.phase = 'completed';
      sound.playSuccess();
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
      this.onComplete();
    } else {
      this.exerciseIndex++;
      this.currentRep = 1;
      this.currentSide = 'left';
      sound.playSuccess();
      this.setupExercisePhase();
    }
  }

  skipExercise() {
    this.advanceExercise();
    this.onUpdate(this.getState());
  }

  prevExercise() {
    if (this.exerciseIndex > 0) {
      this.exerciseIndex--;
      this.currentRep = 1;
      this.currentSide = 'left';
      this.setupExercisePhase();
      this.onUpdate(this.getState());
    }
  }

  reset() {
    this.pause();
    this.exerciseIndex = 0;
    this.currentRep = 1;
    this.currentSide = 'left';
    this.phase = 'ready';
    this.setupExercisePhase();
    this.onUpdate(this.getState());
  }

  getState() {
    const currentEx = EXERCISE_LIST[this.exerciseIndex] || EXERCISE_LIST[0];
    const overallProgress = Math.round((this.exerciseIndex / EXERCISE_LIST.length) * 100);

    return {
      currentEx,
      exerciseIndex: this.exerciseIndex,
      totalExercises: EXERCISE_LIST.length,
      currentRep: this.currentRep,
      currentSide: this.currentSide,
      phase: this.phase,
      secondsLeft: this.secondsLeft,
      isRunning: this.isRunning,
      overallProgress,
      isFinished: this.phase === 'completed'
    };
  }
}
