// Format angka dan tanggal untuk situs Budget Rumah Tangga.
// Rupiah ditulis dengan pemisah ribuan titik: Rp 8.000.000.

// "Rp 8.650.000" — tanpa desimal, pemisah ribuan titik.
export function rupiah(n) {
  const value = Math.round(Number(n) || 0);
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// "Rp 8.650.000" singkat untuk label grafik: "Rp 8,65 jt".
export function rupiahShort(n) {
  const value = Number(n) || 0;
  if (value >= 1000000) {
    const jt = value / 1000000;
    return 'Rp ' + (Number.isInteger(jt) ? String(jt) : jt.toFixed(2).replace('.', ',')) + ' jt';
  }
  if (value >= 1000) return 'Rp ' + Math.round(value / 1000) + ' rb';
  return 'Rp ' + String(Math.round(value));
}

// "91%" dari spent / budget.
export function percent(spent, budget) {
  if (!budget) return 0;
  return Math.round((spent / budget) * 100);
}

// "2 Nov 2026" dari "2026-11-02".
export function shortDate(iso) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const parts = String(iso).split('-');
  if (parts.length !== 3) return String(iso);
  const day = Number(parts[2]);
  const month = months[Number(parts[1]) - 1] || '';
  return day + ' ' + month + ' ' + parts[0];
}

// "−5,9%" — selisih persen bulan ini dibanding bulan lalu.
export function deltaPercent(now, before) {
  if (!before) return '—';
  const d = ((now - before) / before) * 100;
  const sign = d > 0 ? '+' : d < 0 ? '−' : '';
  return sign + Math.abs(d).toFixed(1).replace('.', ',') + '%';
}

// Escape teks pengguna sebelum dimasukkan ke HTML.
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
}
