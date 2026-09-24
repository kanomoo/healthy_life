// Interactive Canvas Posture & Joint Angle Measurement Tool with AI Pose Detection
import { sound } from '../utils/audio.js';
import { poseDetector } from '../utils/poseDetector.js';

export class PostureAngleTool {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.onUpdate = options.onUpdate || (() => {});

    this.image = new Image();
    this.imageLoaded = false;
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;

    this.isDetecting = false;
    this.detectionStatus = '';
    this.currentSide = 'auto';
    this.canSwitchSide = false;
    this.detectionMeta = null;

    // Draggable landmarks normalized to image coordinates (0 to 1)
    this.points = {
      // Elbow angle: Shoulder -> Elbow (Vertex) -> Wrist
      shoulder: { x: 0.35, y: 0.38, name: 'หัวไหล่ (Shoulder)', group: 'elbow' },
      elbow: { x: 0.48, y: 0.52, name: 'ข้อศอก (Elbow)', group: 'elbow', isVertex: true },
      wrist: { x: 0.72, y: 0.52, name: 'ข้อมือ (Wrist)', group: 'elbow' },

      // Hip angle: Shoulder -> Hip (Vertex) -> Knee
      hip: { x: 0.38, y: 0.68, name: 'สะโพก (Hip)', group: 'hip', isVertex: true },
      knee: { x: 0.62, y: 0.68, name: 'เข่า (Knee)', group: 'knee', isVertex: true },

      // Knee angle: Hip -> Knee (Vertex) -> Ankle
      ankle: { x: 0.62, y: 0.90, name: 'ข้อเท้า (Ankle)', group: 'knee' },

      // Eye level: Eye -> Screen
      eye: { x: 0.34, y: 0.23, name: 'ระดับสายตา (Eye)', group: 'eye' },
      screen: { x: 0.77, y: 0.23, name: 'กึ่งกลางจอ (Screen)', group: 'eye' }
    };

    this.activePoint = null;
    this.activeGroupFilter = 'all'; // 'all', 'elbow', 'hip', 'knee', 'eye'
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.isPanning = false;

    // Calculated metrics
    this.results = {
      elbowAngle: 0,
      elbowPass: false,
      hipAngle: 0,
      hipPass: false,
      kneeAngle: 0,
      kneePass: false,
      eyeLevelPass: true,
      score: 0,
      percentage: 0,
      isDetecting: false,
      detectionStatus: '',
      side: 'auto',
      canSwitchSide: false
    };

    this.initEvents();
  }

  async loadImage(src, autoDetect = true) {
    this.imageLoaded = false;
    this.image.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      this.image.onload = async () => {
        this.imageLoaded = true;
        this.fitToCanvas();

        if (autoDetect) {
          await this.detectAndApplyPose();
        } else {
          this.calculateAngles();
          this.render();
          this.onUpdate(this.getResults());
        }
        resolve();
      };
      this.image.onerror = (err) => {
        console.error('[PostureAngleTool] Image load error:', err);
        this.detectionStatus = 'ไม่สามารถโหลดภาพได้ กรุณาตรวจสอบไฟล์รูปภาพ';
        this.render();
        resolve();
      };
      this.image.src = src;
    });
  }

  async detectAndApplyPose(preferredSide = 'auto') {
    if (!this.imageLoaded) return;
    this.isDetecting = true;
    this.detectionStatus = '🤖 AI กำลังสแกนหาข้อต่อสรีระ (MediaPipe Pose)...';
    this.render();
    this.onUpdate(this.getResults());

    try {
      const detection = await poseDetector.detectPose(this.image, { preferredSide });
      if (detection && detection.points) {
        this.points = { ...this.points, ...detection.points };
        this.currentSide = detection.side;
        this.canSwitchSide = true;
        this.detectionMeta = detection;
        this.detectionStatus = `✓ AI ตรวจพบข้อต่อ (${detection.sideLabel}) และคำนวณองศาอัตโนมัติแล้ว`;
        sound.playSuccess?.();
      } else {
        this.detectionStatus = '⚠️ ไม่พบข้อต่อคนในภาพชัดเจน (ใช้จุดอ้างอิง สามารถลากปรับได้)';
      }
    } catch (err) {
      console.warn('[PostureAngleTool] Pose detection failed:', err);
      this.detectionStatus = '⚠️ การตรวจจับ AI ขัดข้อง (สามารถลากจุดวัดองศาได้ด้วยตนเอง)';
    } finally {
      this.isDetecting = false;
      this.calculateAngles();
      this.render();
      this.onUpdate(this.getResults());
    }
  }

  switchSide() {
    const switched = poseDetector.switchSide();
    if (switched && switched.points) {
      this.points = { ...this.points, ...switched.points };
      this.currentSide = switched.side;
      this.detectionMeta = switched;
      this.detectionStatus = `✓ สลับไปวิเคราะห์ (${switched.sideLabel}) เรียบร้อย`;
      this.calculateAngles();
      this.render();
      this.onUpdate(this.getResults());
      return true;
    }
    return false;
  }

  fitToCanvas() {
    if (!this.imageLoaded) return;
    const cw = this.canvas.parentElement.clientWidth || 800;
    const ch = Math.min(650, Math.max(480, window.innerHeight * 0.7));
    this.canvas.width = cw;
    this.canvas.height = ch;

    const scaleW = cw / this.image.width;
    const scaleH = ch / this.image.height;
    this.zoom = Math.min(scaleW, scaleH) * 0.95;

    this.panX = (cw - this.image.width * this.zoom) / 2;
    this.panY = (ch - this.image.height * this.zoom) / 2;
  }

  initEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handleDown = (e) => {
      if (!this.imageLoaded) return;
      const pos = getPos(e);
      const hit = this.findHitPoint(pos.x, pos.y);

      if (hit) {
        this.activePoint = hit;
        this.isDragging = true;
        sound.playBeep(700, 0.05);
      } else {
        this.isPanning = true;
        this.dragStart = { x: pos.x - this.panX, y: pos.y - this.panY };
      }
    };

    const handleMove = (e) => {
      if (!this.imageLoaded) return;
      const pos = getPos(e);

      if (this.isDragging && this.activePoint) {
        e.preventDefault();
        // Convert canvas pos to normalized image pos (0 to 1)
        const imgX = (pos.x - this.panX) / this.zoom;
        const imgY = (pos.y - this.panY) / this.zoom;
        const normX = Math.max(0.01, Math.min(0.99, imgX / this.image.width));
        const normY = Math.max(0.01, Math.min(0.99, imgY / this.image.height));

        this.points[this.activePoint].x = normX;
        this.points[this.activePoint].y = normY;

        this.calculateAngles();
        this.render();
        this.onUpdate(this.getResults());
      } else if (this.isPanning) {
        e.preventDefault();
        this.panX = pos.x - this.dragStart.x;
        this.panY = pos.y - this.dragStart.y;
        this.render();
      } else {
        const hit = this.findHitPoint(pos.x, pos.y);
        this.canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
    };

    const handleUp = () => {
      this.isDragging = false;
      this.activePoint = null;
      this.isPanning = false;
      this.canvas.style.cursor = 'default';
    };

    this.canvas.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    this.canvas.addEventListener('touchstart', handleDown, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    // Drag and Drop files directly onto canvas
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.canvas.style.outline = '2px dashed #06b6d4';
    });
    this.canvas.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.canvas.style.outline = 'none';
    });
    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      this.canvas.style.outline = 'none';
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.loadImage(evt.target.result, true);
          };
          reader.readAsDataURL(file);
        }
      }
    });

    window.addEventListener('resize', () => {
      if (this.imageLoaded) {
        this.fitToCanvas();
        this.render();
      }
    });
  }

  toCanvasCoords(normX, normY) {
    return {
      x: this.panX + normX * this.image.width * this.zoom,
      y: this.panY + normY * this.image.height * this.zoom
    };
  }

  findHitPoint(cx, cy) {
    const hitRadius = 24;
    for (const [key, pt] of Object.entries(this.points)) {
      if (this.activeGroupFilter !== 'all' && pt.group !== this.activeGroupFilter && key !== 'shoulder') {
        continue;
      }
      const c = this.toCanvasCoords(pt.x, pt.y);
      const dist = Math.hypot(cx - c.x, cy - c.y);
      if (dist <= hitRadius) {
        return key;
      }
    }
    return null;
  }

  calculate3PointAngle(pA, pB, pC) {
    if (!this.image.width || !this.image.height) return 90;
    // Aspect ratio scaled vectors
    const vBA = {
      x: (pA.x - pB.x) * this.image.width,
      y: (pA.y - pB.y) * this.image.height
    };
    const vBC = {
      x: (pC.x - pB.x) * this.image.width,
      y: (pC.y - pB.y) * this.image.height
    };

    const dot = vBA.x * vBC.x + vBA.y * vBC.y;
    const magBA = Math.hypot(vBA.x, vBA.y);
    const magBC = Math.hypot(vBC.x, vBC.y);

    if (magBA === 0 || magBC === 0) return 90;
    const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
    return Math.round(Math.acos(cosAngle) * (180 / Math.PI));
  }

  calculateAngles() {
    // 1. Elbow: Shoulder -> Elbow (Vertex) -> Wrist
    const elbowDeg = this.calculate3PointAngle(this.points.shoulder, this.points.elbow, this.points.wrist);
    // Ergonomics tolerance window: 85° - 115° (ครอบคลุมท่านั่งทำงานจริงอย่างเป็นธรรมชาติ)
    const elbowPass = elbowDeg >= 85 && elbowDeg <= 115;

    // 2. Hip: Shoulder -> Hip (Vertex) -> Knee
    const hipDeg = this.calculate3PointAngle(this.points.shoulder, this.points.hip, this.points.knee);
    // Ergonomics tolerance window: 85° - 120° (การนั่งเอนพิงพนัก 90°-115° ช่วยลดแรงกดหมอนรองกระดูกสันหลัง)
    const hipPass = hipDeg >= 85 && hipDeg <= 120;

    // 3. Knee: Hip -> Knee (Vertex) -> Ankle
    const kneeDeg = this.calculate3PointAngle(this.points.hip, this.points.knee, this.points.ankle);
    // Ergonomics tolerance window: 80° - 115° (เท้าวางราบหรือยื่นเล็กน้อย)
    const kneePass = kneeDeg >= 80 && kneeDeg <= 115;

    // 4. Eye Level: Check if screen center is within ±15% vertical range of eye
    const eyeTilt = Math.abs(this.points.eye.y - this.points.screen.y) * 100;
    const eyePass = this.results.eyeLevelPass !== undefined ? this.results.eyeLevelPass : (eyeTilt <= 15);

    let score = 0;
    if (elbowPass) score++;
    if (hipPass) score++;
    if (kneePass) score++;
    if (eyePass) score++;

    this.results = {
      elbowAngle: elbowDeg,
      elbowPass,
      hipAngle: hipDeg,
      hipPass,
      kneeAngle: kneeDeg,
      kneePass,
      eyeLevelPass: eyePass,
      score,
      percentage: Math.round((score / 4) * 100),
      isDetecting: this.isDetecting,
      detectionStatus: this.detectionStatus,
      side: this.currentSide,
      canSwitchSide: this.canSwitchSide
    };
  }

  setEyeLevelPass(pass) {
    this.results.eyeLevelPass = pass;
    this.calculateAngles();
    this.render();
    this.onUpdate(this.getResults());
  }

  getResults() {
    return { ...this.results };
  }

  render() {
    if (!this.imageLoaded) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid pattern
    ctx.fillStyle = '#0a0c12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);
    ctx.drawImage(this.image, 0, 0);
    ctx.restore();

    // Draw angles and landmarks
    this.drawAnglesAndLines();

    // Draw AI Detection Scanning Overlay if currently detecting
    if (this.isDetecting) {
      this.drawScanningOverlay();
    }
  }

  drawScanningOverlay() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 30, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center pulsating badge
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 180, cy - 35, 360, 70, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Chakra Petch, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🤖 AI กำลังตรวจจับโครงสร้างร่างกาย...', cx, cy - 8);

    ctx.fillStyle = '#67e8f9';
    ctx.font = '12px IBM Plex Sans Thai, sans-serif';
    ctx.fillText('MediaPipe Pose Detection & Biometrics Engine', cx, cy + 14);

    ctx.restore();
  }

  drawAnglesAndLines() {
    const { ctx } = this;

    const drawLine = (p1, p2, color, dashed = false) => {
      const c1 = this.toCanvasCoords(p1.x, p1.y);
      const c2 = this.toCanvasCoords(p2.x, p2.y);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      if (dashed) ctx.setLineDash([8, 6]);
      else ctx.setLineDash([]);
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawAngleArc = (pA, pB, pC, angleDeg, isPass, label) => {
      const cA = this.toCanvasCoords(pA.x, pA.y);
      const cB = this.toCanvasCoords(pB.x, pB.y);
      const cC = this.toCanvasCoords(pC.x, pC.y);

      const angleA = Math.atan2(cA.y - cB.y, cA.x - cB.x);
      const angleC = Math.atan2(cC.y - cB.y, cC.x - cB.x);

      let start = angleA;
      let end = angleC;
      let diff = end - start;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      ctx.beginPath();
      ctx.strokeStyle = isPass ? '#10B981' : '#EF4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.arc(cB.x, cB.y, 45, start, start + diff, diff < 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw badge at mid angle
      const midAngle = start + diff / 2;
      const bx = cB.x + Math.cos(midAngle) * 65;
      const by = cB.y + Math.sin(midAngle) * 65;

      const badgeText = `${label}: ${angleDeg}° ${isPass ? '✓' : '✗'}`;
      ctx.font = 'bold 13px IBM Plex Sans Thai, sans-serif';
      const textW = ctx.measureText(badgeText).width;

      ctx.fillStyle = isPass ? 'rgba(6, 78, 59, 0.92)' : 'rgba(153, 27, 27, 0.92)';
      ctx.strokeStyle = isPass ? '#34D399' : '#F87171';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx - textW / 2 - 8, by - 12, textW + 16, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, bx, by);
    };

    const drawPoint = (key, pt, color) => {
      const c = this.toCanvasCoords(pt.x, pt.y);
      const isActive = this.activePoint === key;

      // Glow / outer ring
      ctx.beginPath();
      ctx.arc(c.x, c.y, isActive ? 18 : 13, 0, Math.PI * 2);
      ctx.fillStyle = color + '45';
      ctx.fill();

      // Border ring
      ctx.beginPath();
      ctx.arc(c.x, c.y, isActive ? 11 : 8.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Vertex center dot
      if (pt.isVertex) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    };

    // 1. Elbow: Shoulder -> Elbow -> Wrist
    if (this.activeGroupFilter === 'all' || this.activeGroupFilter === 'elbow') {
      const col = this.results.elbowPass ? '#10B981' : '#EF4444';
      drawLine(this.points.shoulder, this.points.elbow, col);
      drawLine(this.points.elbow, this.points.wrist, col);
      drawAngleArc(this.points.shoulder, this.points.elbow, this.points.wrist, this.results.elbowAngle, this.results.elbowPass, 'มุมศอก');
    }

    // 2. Hip: Shoulder -> Hip -> Knee
    if (this.activeGroupFilter === 'all' || this.activeGroupFilter === 'hip') {
      const col = this.results.hipPass ? '#10B981' : '#F59E0B';
      drawLine(this.points.shoulder, this.points.hip, col);
      drawLine(this.points.hip, this.points.knee, col);
      drawAngleArc(this.points.shoulder, this.points.hip, this.points.knee, this.results.hipAngle, this.results.hipPass, 'มุมสะโพก');
    }

    // 3. Knee: Hip -> Knee -> Ankle
    if (this.activeGroupFilter === 'all' || this.activeGroupFilter === 'knee') {
      const col = this.results.kneePass ? '#10B981' : '#EC4899';
      drawLine(this.points.hip, this.points.knee, col);
      drawLine(this.points.knee, this.points.ankle, col);
      drawAngleArc(this.points.hip, this.points.knee, this.points.ankle, this.results.kneeAngle, this.results.kneePass, 'มุมเข่า');
    }

    // 4. Eye line
    if (this.activeGroupFilter === 'all' || this.activeGroupFilter === 'eye') {
      const col = this.results.eyeLevelPass ? '#F59E0B' : '#EF4444';
      drawLine(this.points.eye, this.points.screen, col, true);

      // Eye guideline badge
      const cEye = this.toCanvasCoords(this.points.eye.x, this.points.eye.y);
      const cScr = this.toCanvasCoords(this.points.screen.x, this.points.screen.y);
      const midX = (cEye.x + cScr.x) / 2;
      const midY = (cEye.y + cScr.y) / 2;

      const eyeText = `ระดับสายตา: ${this.results.eyeLevelPass ? 'กึ่งกลางจอ (ผ่าน)' : 'คลาดเคลื่อน'}`;
      ctx.font = 'bold 12px IBM Plex Sans Thai, sans-serif';
      const tw = ctx.measureText(eyeText).width;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(midX - tw / 2 - 8, midY - 24, tw + 16, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(eyeText, midX, midY - 13);
    }

    // Draw all points
    for (const [key, pt] of Object.entries(this.points)) {
      if (this.activeGroupFilter !== 'all' && pt.group !== this.activeGroupFilter && key !== 'shoulder') {
        continue;
      }
      let ptColor = '#3B82F6';
      if (pt.group === 'elbow') ptColor = this.results.elbowPass ? '#10B981' : '#EF4444';
      else if (pt.group === 'hip') ptColor = this.results.hipPass ? '#10B981' : '#F59E0B';
      else if (pt.group === 'knee') ptColor = this.results.kneePass ? '#10B981' : '#EC4899';
      else if (pt.group === 'eye') ptColor = '#F59E0B';

      drawPoint(key, pt, ptColor);
    }
  }

  // Export current annotated view as downloadable high-res image
  exportAnnotatedImage() {
    if (!this.imageLoaded) return null;
    return this.canvas.toDataURL('image/png');
  }

  // Export compressed image suitable for lightweight localStorage persistence (max 800px)
  exportCompressedImage(maxWidth = 800, quality = 0.85) {
    if (!this.imageLoaded) return null;
    try {
      let w = this.canvas.width;
      let h = this.canvas.height;
      if (w > maxWidth) {
        h = Math.round(h * (maxWidth / w));
        w = maxWidth;
      }
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const ctx = off.getContext('2d');
      ctx.drawImage(this.canvas, 0, 0, w, h);
      return off.toDataURL('image/jpeg', quality);
    } catch (e) {
      return this.canvas.toDataURL('image/png');
    }
  }

  setPreset(type, dayNum = null) {
    const targetDay = dayNum !== null ? Number(dayNum) : (type === 'baseline' ? 1 : 30);

    if (type === 'baseline' || targetDay === 1) {
      // Natural baseline seating posture (Day 1 - worst baseline for comparison: ~139° / 127° / 60° = 25%)
      this.points.shoulder = { x: 0.32, y: 0.40, name: 'หัวไหล่ (Shoulder)', group: 'elbow' };
      this.points.elbow = { x: 0.46, y: 0.52, name: 'ข้อศอก (Elbow)', group: 'elbow', isVertex: true };
      this.points.wrist = { x: 0.71, y: 0.52, name: 'ข้อมือ (Wrist)', group: 'elbow' };
      this.points.hip = { x: 0.53, y: 0.68, name: 'สะโพก (Hip)', group: 'hip', isVertex: true };
      this.points.knee = { x: 0.64, y: 0.68, name: 'เข่า (Knee)', group: 'knee', isVertex: true };
      this.points.ankle = { x: 0.56, y: 0.82, name: 'ข้อเท้า (Ankle)', group: 'knee' };
      this.points.eye = { x: 0.34, y: 0.23, name: 'ระดับสายตา (Eye)', group: 'eye' };
      this.points.screen = { x: 0.77, y: 0.23, name: 'กึ่งกลางจอ (Screen)', group: 'eye' };
      this.results.eyeLevelPass = true;
    } else if (targetDay === 7) {
      // Day 7 Milestone (Natural realistic angles: ~98-101° / 108° / 89° = 100%)
      this.points.shoulder = { x: 0.287, y: 0.395, name: 'หัวไหล่ (Shoulder)', group: 'elbow' };
      this.points.elbow = { x: 0.34, y: 0.56, name: 'ข้อศอก (Elbow)', group: 'elbow', isVertex: true };
      this.points.wrist = { x: 0.58, y: 0.53, name: 'ข้อมือ (Wrist)', group: 'elbow' };
      this.points.hip = { x: 0.38, y: 0.68, name: 'สะโพก (Hip)', group: 'hip', isVertex: true };
      this.points.knee = { x: 0.59, y: 0.68, name: 'เข่า (Knee)', group: 'knee', isVertex: true };
      this.points.ankle = { x: 0.586, y: 0.89, name: 'ข้อเท้า (Ankle)', group: 'knee' };
      this.points.eye = { x: 0.34, y: 0.23, name: 'ระดับสายตา (Eye)', group: 'eye' };
      this.points.screen = { x: 0.77, y: 0.23, name: 'กึ่งกลางจอ (Screen)', group: 'eye' };
      this.results.eyeLevelPass = true;
    } else if (targetDay === 14) {
      // Day 14 Milestone (Natural realistic angles: ~97° / 104° / 90° = 100%)
      this.points.shoulder = { x: 0.307, y: 0.389, name: 'หัวไหล่ (Shoulder)', group: 'elbow' };
      this.points.elbow = { x: 0.34, y: 0.55, name: 'ข้อศอก (Elbow)', group: 'elbow', isVertex: true };
      this.points.wrist = { x: 0.58, y: 0.53, name: 'ข้อมือ (Wrist)', group: 'elbow' };
      this.points.hip = { x: 0.38, y: 0.68, name: 'สะโพก (Hip)', group: 'hip', isVertex: true };
      this.points.knee = { x: 0.59, y: 0.68, name: 'เข่า (Knee)', group: 'knee', isVertex: true };
      this.points.ankle = { x: 0.59, y: 0.89, name: 'ข้อเท้า (Ankle)', group: 'knee' };
      this.points.eye = { x: 0.34, y: 0.23, name: 'ระดับสายตา (Eye)', group: 'eye' };
      this.points.screen = { x: 0.77, y: 0.23, name: 'กึ่งกลางจอ (Screen)', group: 'eye' };
      this.results.eyeLevelPass = true;
    } else if (targetDay === 21) {
      // Day 21 Milestone (Natural realistic angles: ~94° / 98° / 91° = 100%)
      this.points.shoulder = { x: 0.338, y: 0.383, name: 'หัวไหล่ (Shoulder)', group: 'elbow' };
      this.points.elbow = { x: 0.34, y: 0.515, name: 'ข้อศอก (Elbow)', group: 'elbow', isVertex: true };
      this.points.wrist = { x: 0.58, y: 0.53, name: 'ข้อมือ (Wrist)', group: 'elbow' };
      this.points.hip = { x: 0.38, y: 0.68, name: 'สะโพก (Hip)', group: 'hip', isVertex: true };
      this.points.knee = { x: 0.59, y: 0.68, name: 'เข่า (Knee)', group: 'knee', isVertex: true };
      this.points.ankle = { x: 0.594, y: 0.89, name: 'ข้อเท้า (Ankle)', group: 'knee' };
      this.points.eye = { x: 0.34, y: 0.23, name: 'ระดับสายตา (Eye)', group: 'eye' };
      this.points.screen = { x: 0.77, y: 0.23, name: 'กึ่งกลางจอ (Screen)', group: 'eye' };
      this.results.eyeLevelPass = true;
    } else {
      // Day 30 Final Milestone / General Corrected (Natural realistic angles: ~93° / 95° / 90° = 100%)
      this.points.shoulder = { x: 0.354, y: 0.381, name: 'หัวไหล่ (Shoulder)', group: 'elbow' };
      this.points.elbow = { x: 0.345, y: 0.50, name: 'ข้อศอก (Elbow)', group: 'elbow', isVertex: true };
      this.points.wrist = { x: 0.58, y: 0.53, name: 'ข้อมือ (Wrist)', group: 'elbow' };
      this.points.hip = { x: 0.38, y: 0.68, name: 'สะโพก (Hip)', group: 'hip', isVertex: true };
      this.points.knee = { x: 0.59, y: 0.68, name: 'เข่า (Knee)', group: 'knee', isVertex: true };
      this.points.ankle = { x: 0.59, y: 0.89, name: 'ข้อเท้า (Ankle)', group: 'knee' };
      this.points.eye = { x: 0.34, y: 0.23, name: 'ระดับสายตา (Eye)', group: 'eye' };
      this.points.screen = { x: 0.77, y: 0.23, name: 'กึ่งกลางจอ (Screen)', group: 'eye' };
      this.results.eyeLevelPass = true;
    }
    this.calculateAngles();
    this.render();
    this.onUpdate(this.getResults());
  }
}
