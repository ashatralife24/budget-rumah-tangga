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

// Donat: porsi tiap kategori dari total pengeluaran, total di tengah,
// tiap irisan berlabel nama + persentase di luar lingkaran supaya donat
// tetap terbaca sebagai gambar (juga saat diperkecil di contact sheet).
export function drawDonut(canvas, slices) {
  const { ctx, width, height } = setup(canvas, 190);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = width / 2;
  const cy = height / 2 + 4;
  const outer = 70;
  const inner = 44;
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
    const share = slice.value / total;
    if (share >= 0.04) {
      const mid = angle + sweep / 2;
      const dx = Math.cos(mid);
      const dy = Math.sin(mid);
      const x1 = cx + dx * (outer + 2);
      const y1 = cy + dy * (outer + 2);
      const x2 = cx + dx * (outer + 8);
      const y2 = cy + dy * (outer + 8);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const align = dx > 0.25 ? 'left' : dx < -0.25 ? 'right' : 'center';
      const lx = cx + dx * (outer + 12);
      const ly = cy + dy * (outer + 12);
      text(ctx, slice.name || '', lx, ly - 7, 11, '#374151', align, 600);
      text(ctx, Math.round(share * 100) + '%', lx, ly + 7, 11, '#1f2937', align, 700);
    }
    angle += sweep;
  }
  text(ctx, 'Total', cx, cy - 12, 12, '#6b7280', 'center');
  text(ctx, rupiahShort(total), cx, cy + 10, 16, '#1f2937', 'center', 700);
}

// Batang horizontal: bulan ini vs bulan lalu, per kategori.
export function drawCompareBars(canvas, rows) {
  const rowH = 50;
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
