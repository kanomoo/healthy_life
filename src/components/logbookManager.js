// Logbook Manager: Table renderer, filters, modal editor, and inline updates
import { MILESTONE_DAYS, getThailandTime, getExercisesCompletedCount } from '../data/storage.js';

export class LogbookManager {
  constructor(options = {}) {
    this.tableBody = document.getElementById('logbookTableBody');
    this.onDataChange = options.onDataChange || (() => {});
    this.onViewPhoto = options.onViewPhoto || (() => {});
    this.onGotoAngle = options.onGotoAngle || (() => {});
    this.currentFilter = 'all';
    this.entries = [];
    this.editingDayIndex = -1;

    this.initModalEvents();
  }

  setEntries(entries) {
    this.entries = entries;
    this.render();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  }

  render() {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = '';

    const filtered = this.entries.filter(e => {
      if (this.currentFilter === 'w1') return e.day >= 1 && e.day <= 7;
      if (this.currentFilter === 'w2') return e.day >= 8 && e.day <= 14;
      if (this.currentFilter === 'w3') return e.day >= 15 && e.day <= 21;
      if (this.currentFilter === 'w4') return e.day >= 22 && e.day <= 30;
      if (this.currentFilter === 'milestones') return MILESTONE_DAYS.includes(e.day);
      if (this.currentFilter === 'missingPhoto') return !(e.annotatedPhoto || e.photoUrl);
      return true;
    });

    if (filtered.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.innerHTML = `
        <td colspan="15" class="py-8 text-center text-emerald-400 bg-emerald-950/20 text-xs font-medium">
          ${this.currentFilter === 'missingPhoto' ? '✨ ยอดเยี่ยม! มีภาพถ่ายหลักฐานครบถ้วนทั้ง 30 วันแล้ว (ไม่มีวันที่ขาดภาพ)' : 'ไม่พบข้อมูลในตัวกรองที่เลือก'}
        </td>
      `;
      this.tableBody.appendChild(emptyTr);
      return;
    }

    filtered.forEach(e => {
      const tr = document.createElement('tr');
      const isM = MILESTONE_DAYS.includes(e.day);
      tr.className = `hover:bg-slate-800/60 transition border-b border-slate-800/70 text-xs ${isM ? 'bg-amber-950/20' : ''}`;

      // Rate color
      const breakColor = e.breakRate >= 80 ? 'text-emerald-400' : (e.breakRate > 0 ? 'text-amber-400' : 'text-slate-500');
      const exCount = getExercisesCompletedCount(e);
      const exBadgeColor = exCount === 6 
        ? 'bg-cyan-950 text-cyan-300 border-cyan-800' 
        : (exCount > 0 ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' : 'bg-slate-800 text-slate-500 border-slate-700');

      // Evidence photo column (Required for every day D1 to D30)
      const hasPhoto = !!(e.annotatedPhoto || e.photoUrl);
      let photoCell = '';
      if (hasPhoto) {
        photoCell = `
          <td class="py-3 px-2 text-center whitespace-nowrap">
            <button type="button" data-day="${e.day}" class="btn-view-milestone-photo px-2.5 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-medium transition inline-flex items-center gap-1 cursor-pointer shadow-sm hover:scale-105" title="คลิกเพื่อดูภาพถ่ายพร้อมมุมข้อต่อ D${e.day}">
              <span>📷</span> ดูรูป D${e.day}
            </button>
          </td>
        `;
      } else {
        photoCell = `
          <td class="py-3 px-2 text-center whitespace-nowrap">
            <button type="button" data-day="${e.day}" class="btn-goto-angle-day px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] font-medium transition inline-flex items-center gap-1 cursor-pointer shadow-sm animate-pulse" title="ต้องใส่ภาพถ่ายท่านั่งประจำวัน D${e.day} (คลิกเพื่อถ่าย/วัดมุม)">
              <span>⚠️</span> + ใส่รูป D${e.day}
            </button>
          </td>
        `;
      }

      // Status badge (Requires massage + 6 exercises + posture photo)
      const isComplete3 = !!(e.massageCompleted && e.exercisesCompleted && hasPhoto);
      let statusBadge = '';
      if (isComplete3) {
        statusBadge = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-950/80 text-emerald-300 border-emerald-800" title="ครบทั้ง 3 กิจกรรม: นวด 6 นาที + บริหาร 6 ท่า + ภาพถ่ายท่านั่ง">
            ครบ 3/3 ✓
          </span>
        `;
      } else if (e.massageCompleted && e.exercisesCompleted && !hasPhoto) {
        statusBadge = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-950 text-amber-300 border-amber-800" title="นวดและบริหารครบแล้ว แต่ยังขาดภาพถ่ายท่านั่งประจำวัน">
            ขาดภาพ ⚠️
          </span>
        `;
      } else {
        const doneCount = (e.massageCompleted ? 1 : 0) + (e.exercisesCompleted ? 1 : 0) + (hasPhoto ? 1 : 0);
        statusBadge = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-800 text-slate-500 border-slate-700" title="เสร็จสิ้น ${doneCount} จาก 3 กิจกรรม">
            ${doneCount}/3
          </span>
        `;
      }

      tr.innerHTML = `
        <td class="py-3 px-3 font-bold text-white flex items-center gap-1 font-mono">
          <span class="text-sm text-cyan-300">D${e.day}</span>
          ${isM ? '<span class="text-[9px] px-1 py-0.5 rounded-full bg-amber-950 text-amber-300 font-semibold border border-amber-800/80">วันหลัก</span>' : ''}
        </td>
        <td class="py-3 px-2.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">${e.date}</td>
        <td class="py-3 px-2.5 font-mono text-cyan-300 text-[11px] whitespace-nowrap">🕒 ${e.screenStartTime || '09:00'}</td>
        <td class="py-3 px-2.5 font-medium text-slate-200 font-mono">${e.screenTimeMins || 0} <span class="text-[11px] text-slate-400">น.</span></td>
        <td class="py-3 px-2 text-slate-400 font-mono">${e.breaksTarget || 0}</td>
        <td class="py-3 px-2 font-bold text-emerald-400 font-mono">${e.breaksActual || 0}</td>
        <td class="py-3 px-2.5 font-bold ${breakColor} font-mono">${e.breakRate !== null ? e.breakRate + '%' : '-'}</td>
        <td class="py-3 px-2 font-bold text-rose-400 font-mono">${e.painPreMassage !== null ? e.painPreMassage : '-'}</td>
        <td class="py-3 px-2 font-bold text-emerald-400 font-mono">${e.painPostMassage !== null ? e.painPostMassage : '-'}</td>
        <td class="py-3 px-2.5 text-cyan-300 font-mono">${e.immediatePainRelief !== null ? e.immediatePainRelief + '%' : '-'}</td>
        
        <!-- Interactive Checkbox: Massage -->
        <td class="py-3 px-2 text-center">
          <input type="checkbox" data-day="${e.day}" data-field="massageCompleted" ${e.massageCompleted ? 'checked' : ''} class="inline-checkbox w-4 h-4 rounded border-slate-700 text-cyan-500 cursor-pointer accent-cyan-500" title="นวดด้วยตนเองครบ 3 บริเวณ (6 นาที)" />
        </td>

        <!-- 6 Exercises status & quick checkbox -->
        <td class="py-3 px-2.5 text-center whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5 justify-center">
            <input type="checkbox" data-day="${e.day}" data-field="exercisesCompleted" ${e.exercisesCompleted ? 'checked' : ''} class="inline-checkbox w-4 h-4 rounded border-slate-700 text-cyan-500 cursor-pointer accent-cyan-500" title="ติ๊กครบ/ไม่ครบ ทั้ง 6 ท่า" />
            <button type="button" data-day="${e.day}" class="btn-edit-row px-1.5 py-0.5 rounded text-[10px] font-mono border ${exBadgeColor} hover:brightness-125 transition cursor-pointer" title="คลิกเพื่อแก้ไขทั้ง 6 ท่า">
              ${exCount}/6 ท่า
            </button>
          </div>
        </td>

        <td class="py-3 px-2 text-center">
          ${statusBadge}
        </td>

        <!-- Photo Evidence Column -->
        ${photoCell}

        <td class="py-3 px-2.5 text-center">
          <button data-day="${e.day}" class="btn-edit-row px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 text-[11px] font-medium transition flex items-center gap-1 mx-auto cursor-pointer">
            <span>✏️</span> แก้
          </button>
        </td>
      `;

      this.tableBody.appendChild(tr);
    });

    this.bindRowEvents();
  }

  bindRowEvents() {
    // Inline checkboxes
    const checkboxes = this.tableBody.querySelectorAll('.inline-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const day = parseInt(e.target.getAttribute('data-day'), 10);
        const field = e.target.getAttribute('data-field');
        const checked = e.target.checked;

        const entry = this.entries.find(item => item.day === day);
        if (entry) {
          entry[field] = checked;
          if (field === 'exercisesCompleted') {
            entry.exercisesList = checked
              ? [true, true, true, true, true, true]
              : [false, false, false, false, false, false];
          }
          const hasPhoto = !!(entry.annotatedPhoto || entry.photoUrl);
          entry.programCompleted = entry.massageCompleted && entry.exercisesCompleted && hasPhoto;
          this.onDataChange(this.entries);
          this.render();
        }
      });
    });

    // View milestone photo buttons
    const viewPhotoBtns = this.tableBody.querySelectorAll('.btn-view-milestone-photo');
    viewPhotoBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const day = parseInt(e.currentTarget.getAttribute('data-day'), 10);
        this.onViewPhoto(day);
      });
    });

    // Goto angle tool buttons
    const gotoAngleBtns = this.tableBody.querySelectorAll('.btn-goto-angle-day');
    gotoAngleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const day = parseInt(e.currentTarget.getAttribute('data-day'), 10);
        this.onGotoAngle(day);
      });
    });

    // Edit button opens modal
    const editBtns = this.tableBody.querySelectorAll('.btn-edit-row');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const day = parseInt(e.currentTarget.getAttribute('data-day'), 10);
        this.openModal(day);
      });
    });
  }

  initModalEvents() {
    this.modal = document.getElementById('modalEditDay');
    this.btnSaveModal = document.getElementById('btnSaveModal');
    this.btnCancelModal = document.getElementById('btnCancelModal');
    this.btnCloseModal = document.getElementById('btnCloseModal');

    const closeModal = () => {
      if (this.modal) this.modal.classList.add('hidden');
    };

    if (this.btnCancelModal) this.btnCancelModal.addEventListener('click', closeModal);
    if (this.btnCloseModal) this.btnCloseModal.addEventListener('click', closeModal);

    // Live calculate shouldBreak when screen mins changed
    const inputMins = document.getElementById('modalScreenMins');
    const inputTarget = document.getElementById('modalTargetBreaks');
    if (inputMins && inputTarget) {
      inputMins.addEventListener('input', () => {
        const mins = parseInt(inputMins.value, 10) || 0;
        inputTarget.value = Math.floor(mins / 45);
      });
    }

    // Button: Set modalStartTime to Thailand Real-Time
    const btnSetNowTh = document.getElementById('btnModalSetNowThTime');
    if (btnSetNowTh) {
      btnSetNowTh.addEventListener('click', () => {
        const startTimeInput = document.getElementById('modalStartTime');
        if (startTimeInput) {
          startTimeInput.value = getThailandTime();
        }
      });
    }

    // Modal Live Thailand Clock ticker
    const modalLiveThClock = document.getElementById('modalLiveThClock');
    if (modalLiveThClock) {
      setInterval(() => {
        modalLiveThClock.textContent = new Date().toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      }, 1000);
    }

    // 6 Exercise Checkboxes in Modal
    const updateModalExBadge = () => {
      let count = 0;
      for (let i = 0; i < 6; i++) {
        const cb = document.getElementById(`modalEx${i}`);
        if (cb && cb.checked) count++;
      }
      const badge = document.getElementById('modalExerciseCountBadge');
      if (badge) {
        badge.textContent = `${count}/6 ท่า`;
        badge.className = `text-[10px] px-1.5 py-0.5 rounded font-mono border font-semibold ${
          count === 6
            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
            : (count > 0 ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-800 text-slate-500 border-slate-700')
        }`;
      }
      const hiddenComp = document.getElementById('modalCheckExercises');
      if (hiddenComp) hiddenComp.checked = (count === 6);
    };

    for (let i = 0; i < 6; i++) {
      const cb = document.getElementById(`modalEx${i}`);
      if (cb) {
        cb.addEventListener('change', updateModalExBadge);
      }
    }

    const btnCheckAllEx = document.getElementById('btnModalCheckAllEx');
    if (btnCheckAllEx) {
      btnCheckAllEx.addEventListener('click', () => {
        for (let i = 0; i < 6; i++) {
          const cb = document.getElementById(`modalEx${i}`);
          if (cb) cb.checked = true;
        }
        updateModalExBadge();
      });
    }

    const btnUncheckAllEx = document.getElementById('btnModalUncheckAllEx');
    if (btnUncheckAllEx) {
      btnUncheckAllEx.addEventListener('click', () => {
        for (let i = 0; i < 6; i++) {
          const cb = document.getElementById(`modalEx${i}`);
          if (cb) cb.checked = false;
        }
        updateModalExBadge();
      });
    }

    // Direct posture photo upload within modal
    const modalPhotoInput = document.getElementById('modalPhotoUploadInput');
    if (modalPhotoInput) {
      modalPhotoInput.addEventListener('change', (e) => {
        if (this.editingDayIndex < 0) return;
        const entry = this.entries[this.editingDayIndex];
        if (!entry) return;
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const img = new Image();
          img.onload = () => {
            const maxW = 900;
            let w = img.width;
            let h = img.height;
            if (w > maxW) {
              h = Math.round((h * maxW) / w);
              w = maxW;
            }
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = c.toDataURL('image/jpeg', 0.85);

            entry.annotatedPhoto = compressed;
            entry.photoUrl = compressed;
            entry.photoFileName = `Posture_D${entry.day}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            entry.photoDate = new Date().toISOString();
            entry.hasPhoto = true;
            entry.programCompleted = entry.massageCompleted && entry.exercisesCompleted;

            this.updateModalPhotoSection(entry);
            this.onDataChange(this.entries);
            this.render();
          };
          img.src = loadEvt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (this.btnSaveModal) {
      this.btnSaveModal.addEventListener('click', () => {
        if (this.editingDayIndex < 0) return;
        const entry = this.entries[this.editingDayIndex];
        if (!entry) return;

        entry.screenStartTime = document.getElementById('modalStartTime').value || '09:00';
        entry.screenTimeMins = parseInt(document.getElementById('modalScreenMins').value, 10) || 0;
        entry.breaksTarget = Math.floor(entry.screenTimeMins / 45);
        entry.breaksActual = parseInt(document.getElementById('modalActualBreaks').value, 10) || 0;
        entry.breakRate = entry.breaksTarget > 0 
          ? Number(((entry.breaksActual / entry.breaksTarget) * 100).toFixed(1))
          : 0;

        const pre = document.getElementById('modalPrePain').value;
        const post = document.getElementById('modalPostPain').value;
        entry.painPreMassage = pre !== '' ? parseInt(pre, 10) : null;
        entry.painPostMassage = post !== '' ? parseInt(post, 10) : null;

        if (entry.painPreMassage !== null && entry.painPreMassage > 0 && entry.painPostMassage !== null) {
          entry.immediatePainRelief = Number((((entry.painPreMassage - entry.painPostMassage) / entry.painPreMassage) * 100).toFixed(1));
        } else {
          entry.immediatePainRelief = 0;
        }

        entry.massageCompleted = document.getElementById('modalCheckMassage').checked;

        // Save 6 individual exercises
        const exList = [];
        for (let i = 0; i < 6; i++) {
          const cb = document.getElementById(`modalEx${i}`);
          exList.push(cb ? cb.checked : false);
        }
        entry.exercisesList = exList;
        const exCount = exList.filter(Boolean).length;
        entry.exercisesCompleted = (exCount === 6);

        const hasPhoto = !!(entry.annotatedPhoto || entry.photoUrl);
        entry.programCompleted = entry.massageCompleted && entry.exercisesCompleted && hasPhoto;
        entry.notes = document.getElementById('modalNotes').value || '';

        closeModal();
        this.onDataChange(this.entries);
        this.render();
      });
    }
  }

  updateModalPhotoSection(e) {
    const photoSection = document.getElementById('modalMilestonePhotoSection');
    if (!photoSection) return;
    photoSection.classList.remove('hidden');

    const hasPhoto = !!(e.annotatedPhoto || e.photoUrl);
    const photoSrc = e.annotatedPhoto || e.photoUrl || '/sample_baseline.png';

    const imgEl = document.getElementById('modalMilestoneImgPreview');
    const emptyNotice = document.getElementById('modalNoPhotoNotice');
    const anglesEl = document.getElementById('modalMilestoneAnglesText');
    const scoreBadge = document.getElementById('modalMilestoneScoreBadge');
    const btnJump = document.getElementById('btnModalJumpToAngle');

    if (imgEl) {
      if (hasPhoto) {
        imgEl.src = photoSrc;
        imgEl.classList.remove('hidden');
        if (emptyNotice) emptyNotice.classList.add('hidden');
        imgEl.onclick = () => {
          if (this.modal) this.modal.classList.add('hidden');
          this.onViewPhoto(e.day);
        };
      } else {
        imgEl.classList.add('hidden');
        if (emptyNotice) emptyNotice.classList.remove('hidden');
      }
    }

    if (anglesEl) {
      if (e.elbowAngle !== null || e.hipAngle !== null || e.kneeAngle !== null) {
        anglesEl.textContent = `ศอก: ${e.elbowAngle !== null ? e.elbowAngle + '°' : '-'} | สะโพก: ${e.hipAngle !== null ? e.hipAngle + '°' : '-'} | เข่า: ${e.kneeAngle !== null ? e.kneeAngle + '°' : '-'}`;
      } else {
        anglesEl.textContent = hasPhoto ? 'มีภาพแล้ว (ยังไม่ได้ลากจุดวัดมุม)' : '⚠️ ยังไม่มีภาพถ่าย (ต้องมีภาพทุกวันตามข้อกำหนดวิจัย)';
      }
    }

    if (scoreBadge) {
      if (e.postureScore !== null) {
        scoreBadge.textContent = `เกณฑ์ 90-90-90: ผ่าน ${e.postureScore}/4 (${e.posturePercentage}%)`;
        scoreBadge.className = `text-[10px] px-1.5 py-0.5 rounded font-mono border ${e.posturePercentage >= 75 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`;
      } else {
        scoreBadge.textContent = hasPhoto ? 'มีภาพแล้ว' : '⚠️ ขาดภาพหลักฐาน';
        scoreBadge.className = `text-[10px] px-1.5 py-0.5 rounded font-mono border ${hasPhoto ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-rose-950 text-rose-300 border-rose-800'}`;
      }
    }

    if (btnJump) {
      btnJump.onclick = () => {
        if (this.modal) this.modal.classList.add('hidden');
        this.onGotoAngle(e.day);
      };
    }
  }

  openModal(dayNum) {
    const idx = this.entries.findIndex(e => e.day === dayNum);
    if (idx === -1) return;
    this.editingDayIndex = idx;
    const e = this.entries[idx];

    document.getElementById('modalDayTitle').textContent = `แก้ไขบันทึกประจำวัน D${e.day}`;
    document.getElementById('modalDayDate').textContent = e.date;
    document.getElementById('modalStartTime').value = e.screenStartTime || '09:00';
    document.getElementById('modalScreenMins').value = e.screenTimeMins || 0;
    document.getElementById('modalTargetBreaks').value = Math.floor((e.screenTimeMins || 0) / 45);
    document.getElementById('modalActualBreaks').value = e.breaksActual || 0;
    document.getElementById('modalPrePain').value = e.painPreMassage !== null ? e.painPreMassage : '';
    document.getElementById('modalPostPain').value = e.painPostMassage !== null ? e.painPostMassage : '';
    document.getElementById('modalCheckMassage').checked = !!e.massageCompleted;

    // Populate 6 individual exercises
    const exList = Array.isArray(e.exercisesList) && e.exercisesList.length === 6
      ? e.exercisesList
      : (e.exercisesCompleted ? [true, true, true, true, true, true] : [false, false, false, false, false, false]);

    let count = 0;
    for (let i = 0; i < 6; i++) {
      const cb = document.getElementById(`modalEx${i}`);
      if (cb) {
        cb.checked = !!exList[i];
        if (cb.checked) count++;
      }
    }

    const badge = document.getElementById('modalExerciseCountBadge');
    if (badge) {
      badge.textContent = `${count}/6 ท่า`;
      badge.className = `text-[10px] px-1.5 py-0.5 rounded font-mono border font-semibold ${
        count === 6
          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
          : (count > 0 ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-800 text-slate-500 border-slate-700')
      }`;
    }

    const hiddenComp = document.getElementById('modalCheckExercises');
    if (hiddenComp) hiddenComp.checked = (count === 6);

    // Daily posture photo preview in modal (Applies to all 30 days)
    this.updateModalPhotoSection(e);

    document.getElementById('modalNotes').value = e.notes || '';

    this.modal.classList.remove('hidden');
  }
}
