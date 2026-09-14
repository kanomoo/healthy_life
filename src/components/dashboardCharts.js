// Chart.js visualizations for Health30D Dashboard
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const FONT_THAI = "'IBM Plex Sans Thai', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";
const COLOR_GRID = "rgba(255, 255, 255, 0.07)";
const COLOR_TEXT = "#94a3b8";

export class DashboardCharts {
  constructor() {
    this.painChart = null;
    this.breaksChart = null;
    this.anglesChart = null;
  }

  renderPainChart(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.painChart) {
      this.painChart.destroy();
    }

    const labels = entries.map(e => `D${e.day}`);
    const prePain = entries.map(e => e.painPreMassage);
    const postPain = entries.map(e => e.painPostMassage);

    this.painChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'ก่อนนวด (Pre-massage NRS)',
            data: prePain,
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            fill: false,
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#f43f5e'
          },
          {
            label: 'หลังนวด (Post-massage NRS)',
            data: postPain,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: false,
            tension: 0.3,
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'top', 
            labels: { 
              font: { family: FONT_THAI, size: 12 },
              color: '#e2e8f0',
              usePointStyle: true,
              boxWidth: 8
            } 
          },
          tooltip: {
            backgroundColor: '#151823',
            borderColor: '#242938',
            borderWidth: 1,
            titleFont: { family: FONT_THAI },
            bodyFont: { family: FONT_THAI },
            callbacks: {
              afterLabel: (ctx) => {
                const idx = ctx.dataIndex;
                const e = entries[idx];
                return e.immediatePainRelief ? `ลดทันที: ${e.immediatePainRelief}%` : '';
              }
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 10,
            grid: { color: COLOR_GRID },
            title: { display: true, text: 'คะแนนความปวด (NRS 0-10)', font: { family: FONT_THAI }, color: COLOR_TEXT },
            ticks: { stepSize: 1, font: { family: FONT_MONO, size: 11 }, color: COLOR_TEXT }
          },
          x: {
            grid: { color: COLOR_GRID },
            ticks: {
              font: { family: FONT_MONO, size: 10 },
              color: COLOR_TEXT,
              maxRotation: 45
            }
          }
        }
      }
    });
  }

  renderBreaksChart(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.breaksChart) {
      this.breaksChart.destroy();
    }

    const labels = entries.map(e => `D${e.day}`);
    const actualBreaks = entries.map(e => e.breaksActual);
    const targetBreaks = entries.map(e => e.breaksTarget);
    const breakRates = entries.map(e => e.breakRate);

    this.breaksChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'อัตราการพักจริง (% Rate)',
            data: breakRates,
            borderColor: '#06b6d4',
            borderWidth: 2.5,
            yAxisID: 'y1',
            tension: 0.25,
            pointRadius: 3,
            pointBackgroundColor: '#06b6d4'
          },
          {
            type: 'bar',
            label: 'พักจริง (ครั้ง)',
            data: actualBreaks,
            backgroundColor: '#10b981',
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'ควรพัก (ครั้ง = นาที ÷ 45)',
            data: targetBreaks,
            backgroundColor: 'rgba(148, 163, 184, 0.45)',
            borderRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'top', 
            labels: { 
              font: { family: FONT_THAI, size: 12 },
              color: '#e2e8f0',
              usePointStyle: true,
              boxWidth: 8
            } 
          },
          tooltip: {
            backgroundColor: '#151823',
            borderColor: '#242938',
            borderWidth: 1,
            titleFont: { family: FONT_THAI },
            bodyFont: { family: FONT_THAI }
          }
        },
        scales: {
          y: {
            grid: { color: COLOR_GRID },
            title: { display: true, text: 'จำนวนครั้งการพัก', font: { family: FONT_THAI }, color: COLOR_TEXT },
            ticks: { stepSize: 1, font: { family: FONT_MONO, size: 11 }, color: COLOR_TEXT }
          },
          y1: {
            position: 'right',
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'อัตราการพัก (%)', font: { family: FONT_THAI }, color: COLOR_TEXT },
            ticks: { callback: v => `${v}%`, font: { family: FONT_MONO, size: 11 }, color: COLOR_TEXT }
          },
          x: {
            grid: { color: COLOR_GRID },
            ticks: { font: { family: FONT_MONO, size: 10 }, color: COLOR_TEXT }
          }
        }
      }
    });
  }

  renderAnglesChart(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.anglesChart) {
      this.anglesChart.destroy();
    }

    const milestones = entries.filter(e => e.isMilestone);
    const labels = milestones.map(m => `D${m.day}`);
    const elbowAngles = milestones.map(m => m.elbowAngle);
    const hipAngles = milestones.map(m => m.hipAngle);
    const kneeAngles = milestones.map(m => m.kneeAngle);
    const posturePcts = milestones.map(m => m.posturePercentage);

    this.anglesChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'ข้อศอก (เป้าหมาย 90-100°)',
            data: elbowAngles,
            backgroundColor: '#3b82f6',
            borderRadius: 4
          },
          {
            label: 'สะโพก (เป้าหมาย 90-100°)',
            data: hipAngles,
            backgroundColor: '#f59e0b',
            borderRadius: 4
          },
          {
            label: 'เข่า (เป้าหมาย 85-100°)',
            data: kneeAngles,
            backgroundColor: '#ec4899',
            borderRadius: 4
          },
          {
            type: 'line',
            label: '% ความถูกต้องของท่าทาง',
            data: posturePcts,
            borderColor: '#10b981',
            borderWidth: 3,
            tension: 0.2,
            pointRadius: 5,
            pointBackgroundColor: '#10b981',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'top', 
            labels: { 
              font: { family: FONT_THAI, size: 12 },
              color: '#e2e8f0',
              usePointStyle: true,
              boxWidth: 8
            } 
          },
          tooltip: {
            backgroundColor: '#151823',
            borderColor: '#242938',
            borderWidth: 1,
            titleFont: { family: FONT_THAI },
            bodyFont: { family: FONT_THAI }
          }
        },
        scales: {
          y: {
            grid: { color: COLOR_GRID },
            title: { display: true, text: 'องศา (°)', font: { family: FONT_THAI }, color: COLOR_TEXT },
            min: 50,
            max: 160,
            ticks: { font: { family: FONT_MONO, size: 11 }, color: COLOR_TEXT }
          },
          y1: {
            position: 'right',
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false },
            title: { display: true, text: '% ท่าทางถูกต้อง', font: { family: FONT_THAI }, color: COLOR_TEXT },
            ticks: { callback: v => `${v}%`, font: { family: FONT_MONO, size: 11 }, color: COLOR_TEXT }
          },
          x: {
            grid: { color: COLOR_GRID },
            ticks: { font: { family: FONT_MONO, size: 12, weight: 'bold' }, color: '#e2e8f0' }
          }
        }
      }
    });
  }
}
