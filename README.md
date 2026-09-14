# โครงการวิจัยและปรับเปลี่ยนพฤติกรรมสุขภาพส่วนบุคคล (Health30D Research App)

เว็บแอปพลิเคชันสนับสนุนการวิจัยรายบุคคลแบบวัดผลก่อนและหลัง 30 วัน (Single-subject Pre-Post Design)  
**หัวข้อ:** การปรับโต๊ะทำงานร่วมกับพฤติกรรมการดูแลตนเอง เพื่อลดอาการ Office Syndrome บริเวณคอ บ่า และไหล่ ภายใน 30 วัน  
**ผู้วิจัย:** นายปภาวิน ธิติชุณหกุล (รหัสนักศึกษา: 6806021612037, Sec 2)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
healthy_life/
├── docs/                                 # เอกสารข้อเสนอและภาพถ่ายอ้างอิง
│   ├── proposal/                         # ไฟล์ Proposal PDF และเนื้อหาเกณฑ์การประเมิน
│   │   ├── 6806021612037_ปภาวิน_Proposal_Health30D.pdf
│   │   ├── main.txt                      # ข้อกำหนดและเกณฑ์ Rubric
│   │   ├── pdf_text.txt                  # ข้อความสกัดจาก Proposal
│   │   ├── page-1.png                    # ภาพหน้า 1 ของ Proposal
│   │   └── page-2.png                    # ภาพหน้า 2 ของ Proposal
│   └── screenshots/                      # ภาพบันทึกหน้าจอการทำงาน/ผลการทดสอบระบบ
│       ├── redesign-tab1-dashboard.png
│       ├── redesign-tab2-angle.png
│       ├── redesign-tab3-timers.png
│       ├── redesign-tab4-logbook.png
│       └── ...
├── public/                               # Static Assets สำหรับเว็บแอป
│   └── sample_baseline.png               # ภาพตัวอย่างท่านั่งทำงาน Baseline D1
├── src/                                  # Source Code หลักของแอปพลิเคชัน
│   ├── components/                       # โมดูล UI และเครื่องมือคำนวณ
│   │   ├── canvasAngleTool.js            # เครื่องมือ Canvas ลากจุดวัดมุมสรีระ 90-90-90
│   │   ├── dashboardCharts.js            # กราฟแสดงแนวโน้ม Chart.js (ปวด, การพัก, มุม)
│   │   ├── excelExport.js                # ระบบส่งออกข้อมูลรายงานวิจัยเป็นไฟล์ Excel (.xlsx)
│   │   ├── logbookManager.js             # ตัวจัดการตารางบันทึกประจำวัน 30 วันและ Modal
│   │   └── timerManager.js               # ตัวจับเวลาหน้าจอ 45 นาที, นวด 6 นาที, กายบริหาร 6 ท่า
│   ├── data/
│   │   └── storage.js                    # Mock Data, LocalStorage และสูตรประเมิน KPI 5 ด้าน
│   ├── utils/
│   │   └── audio.js                      # เสียงแจ้งเตือน Web Audio API และระบบออกเสียงไทย
│   ├── main.js                           # Controller หลักเชื่อมต่อทุกแท็บและ Event Handlers
│   └── style.css                         # Tailwind CSS & Custom Styles
├── index.html                            # HTML หลักของระบบ (Glassmorphism Dark Mode)
├── vite.config.js                        # กำหนดค่า Vite Build & Tailwind v4
├── package.json                          # รายการ Dependencies และ Script
└── .gitignore                            # ไฟล์ยกเว้นสำหรับ Git
```

---

## 🌟 ฟังก์ชันหลักของระบบ (Core Features)

1. **Dashboard & Research Metrics (แท็บ 1):**
   - คำนวณความก้าวหน้าตามตัวชี้วัดความสำเร็จ 5 ด้าน (ลดปวด ≥ 30%, ท่าถูกต้อง ≥ 75%, พักตามเกณฑ์ ≥ 80%, ทำโปรแกรมครบ ≥ 85%, บรรเทาทันที ≥ 20%)
   - กราฟแนวโน้มระดับความปวด, อัตราการพัก และพัฒนาการของมุมสรีระ

2. **Ergonomics 90-90-90 Angle Tool (แท็บ 2):**
   - Canvas แบบ Interactive ลากจุดวัดมุมข้อศอก สะโพก เข่า และประเมินระดับสายตา
   - สามารถอัปโหลดภาพตนเอง หรือโหลดภาพ Baseline มาทดสอบ
   - บันทึกผลมุมลงสู่วันประเมินสำคัญ (D1, D7, D14, D21, D30) ได้ทันที
   - ส่งออกภาพพร้อมการวาดมุม (Annotated Image) เป็น PNG

3. **Smart Timers & Thai Voice Guidance (แท็บ 3):**
   - ตัวจับเวลาใช้จอ 45 นาที พร้อมแจ้งเตือนให้ลุกพัก 2 นาที
   - ตัวจับเวลานวดจุด Trigger Points 6 ท่า รวม 6 นาที พร้อมภาพและคำแนะนำ
   - ตัวจับเวลากายบริหารกล้ามเนื้อ 6 ท่า มีภาพสาธิตและเช็คลิสต์
   - ระบบบันทึกเวลาจริงประเทศไทย (Asia/Bangkok) ลง Logbook อัตโนมัติ

4. **Daily Logbook & Modal Entry (แท็บ 4):**
   - ตารางบันทึก 30 วัน พร้อมสถานะตัวชี้วัดในแต่ละวัน
   - ระบบค้นหา/ฟิลเตอร์ (ทั้งหมด, วันสำคัญ Milestone, วันที่ปวดสูง)
   - ป๊อปอัป Modal สำหรับกรอก/แก้ไขข้อมูลรายวัน พร้อมเช็คลิสต์กายบริหาร 6 ท่า

5. **Research Protocol (แท็บ 5):**
   - ข้อมูลรายละเอียดโครงการ สมมติฐาน และขั้นตอนการทดลอง 30 วัน

6. **Excel Export (.xlsx):**
   - ส่งออกรายงานการวิจัยอย่างเป็นทางการ 3 แผ่นงาน (บันทึกรายวัน, ภาพและมุม, สรุปผลการประเมิน)

---

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)
- [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป แนะนำเวอร์ชัน LTS)
- npm หรือ pnpm / yarn

### คำสั่งใช้งาน (Commands)

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

2. **เริ่มเซิร์ฟเวอร์สำหรับพัฒนา (Development Server):**
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่ลิงก์ที่แสดงบน Terminal เช่น `http://localhost:5173/`

3. **ทดสอบ Build สำหรับ Production:**
   ```bash
   npm run build
   ```

4. **พรีวิวเวอร์ชัน Build:**
   ```bash
   npm run preview
   ```
