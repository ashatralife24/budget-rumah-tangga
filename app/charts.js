// Chart canvas polos untuk Budget Rumah Tangga — tanpa library.
// Tiga gambar: donat pembagian pengeluaran, batang perbandingan bulan ini
// vs bulan lalu, dan tren bulanan pemasukan vs pengeluaran.

import { rupiahShort } from './format.js';

// Siapkan canvas agar tajam di layar retina maupun biasa.
function setup(canvas, height) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.font = (weight || 400) + ' ' + size + 'px system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// Donat: porsi tiap kategori dari total pengeluaran, total di tengah.
export function drawDonut(canvas, slices) {
  const { ctx, width, height } = setup(canvas, 220);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = width / 2;
  const cy = height / 2;
  const outer = 92;
  const inner = 58;
  if (!total) {
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
    ctx.fillStyle = '#e5ddd0';
    ctx.fill();
    text(ctx, 'Belum ada pengeluaran', cx, cy, 13, '#6b7280', 'center');
    return;
  }
  let angle = -Math.PI / 2;
  for (const slice of slices) {
    const sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, angle, angle + sweep);
    ctx.arc(cx, cy, inner, angle + sweep, angle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    angle += sweep;
  }
  text(ctx, 'Total', cx, cy - 12, 12, '#6b7280', 'center');
  text(ctx, rupiahShort(total), cx, cy + 10, 16, '#1f2937', 'center', 700);
}

// Batang horizontal: bulan ini vs bulan lalu, per kategori.
export function drawCompareBars(canvas, rows) {
  const rowH = 44;
  const { ctx, width, height } = setup(canvas, rows.length * rowH + 34);
  const max = Math.max(1, ...rows.flatMap((r) => [r.now, r.before]));
  const labelW = 118;
  const barW = width - labelW - 90;
  rows.forEach((row, i) => {
    const y = 18 + i * rowH;
    text(ctx, row.name, 0, y + 7, 12, '#1f2937', 'left', 600);
    const nowW = Math.max(2, (row.now / max) * barW);
    const beforeW = Math.max(2, (row.before / max) * barW);
    ctx.fillStyle = row.color;
    ctx.fillRect(labelW, y, nowW, 12);
    ctx.fillStyle = '#d6cdbb';
    ctx.fillRect(labelW, y + 15, beforeW, 12);
    text(ctx, rupiahShort(row.now), labelW + nowW + 6, y + 6, 11, '#1f2937', 'left', 600);
    text(ctx, rupiahShort(row.before), labelW + beforeW + 6, y + 21, 11, '#6b7280', 'left');
  });
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, height - 16, 10, 10);
  text(ctx, 'Bulan ini', 14, height - 11, 11, '#374151', 'left');
  ctx.fillStyle = '#d6cdbb';
  ctx.fillRect(90, height - 16, 10, 10);
  text(ctx, 'Bulan lalu', 104, height - 11, 11, '#374151', 'left');
}

// Batang vertikal berkelompok: pemasukan vs pengeluaran per bulan.
export function drawTrend(canvas, months) {
  const { ctx, width, height } = setup(canvas, 258);
  const padL = 52;
  const padB = 48;
  const plotW = width - padL - 8;
  const plotH = height - padB - 26;
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const step = plotW / months.length;
  const barW = Math.min(26, step / 3);
  // Garis grid + label sumbu.
  ctx.strokeStyle = '#e7dfd0';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g += 1) {
    const y = 8 + (plotH * g) / 4;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(width - 8, y);
    ctx.stroke();
    text(ctx, rupiahShort((max * (4 - g)) / 4), padL - 6, y, 10, '#6b7280', 'right');
  }
  months.forEach((m, i) => {
    const x = padL + i * step + step / 2;
    const inH = (m.income / max) * plotH;
    const exH = (m.expense / max) * plotH;
    ctx.fillStyle = '#166534';
    ctx.fillRect(x - barW - 2, 8 + plotH - inH, barW, inH);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + 2, 8 + plotH - exH, barW, exH);
    text(ctx, m.label.replace(' 2026', ''), x, height - 30, 11, '#374151', 'center', 600);
  });
  ctx.fillStyle = '#166534';
  ctx.fillRect(padL, height - 14, 10, 10);
  text(ctx, 'Pemasukan', padL + 14, height - 9, 11, '#374151', 'left');
  ctx.fillStyle = '#d97706';
  ctx.fillRect(padL + 92, height - 14, 10, 10);
  text(ctx, 'Pengeluaran', padL + 106, height - 9, 11, '#374151', 'left');
}
