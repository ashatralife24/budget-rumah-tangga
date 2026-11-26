// Halaman-halaman Budget Rumah Tangga, masing-masing satu hash route.
// Semua angka di halaman ini dihitung dari store.js, bukan ditulis tangan.

import { rupiah, rupiahShort, percent, shortDate, deltaPercent, escapeHtml, monthName, shortMonth } from './format.js';
import { totals, categorySummary, getTransactions, getTargets, savingsPlan, getMonth, monthsAvailable, monthTotals, prevMonth, categorySpentInMonth } from './store.js';
import { CATEGORIES, TIPS } from './data.js';

function statusBadge(status) {
  if (status === 'hampir') return '<span class="badge warn">Hampir habis</span>';
  if (status === 'waspada') return '<span class="badge watch">Waspada</span>';
  return '<span class="badge ok">Aman</span>';
}

function progressBar(pct, status) {
  const cls = status === 'hampir' ? 'bar-fill danger' : status === 'waspada' ? 'bar-fill warn' : 'bar-fill ok';
  const capped = Math.min(100, pct);
  return '<div class="bar"><div class="' + cls + '" style="width:' + capped + '%"></div></div>';
}

function nav(active) {
  const links = [
    ['#/', 'Beranda'],
    ['#/transaksi', 'Catat Transaksi'],
    ['#/anggaran', 'Anggaran'],
    ['#/laporan', 'Laporan'],
    ['#/target', 'Target Tabungan'],
    ['#/tips', 'Tips Hemat'],
  ];
  return '<nav class="tabs">' + links.map(([href, label]) =>
    '<a href="' + href + '" class="' + (href === active ? 'active' : '') + '">' + label + '</a>').join('') + '</nav>';
}

// ---- Beranda ----
export function home() {
  const month = getMonth();
  const t = totals();
  const cats = categorySummary();
  const plan = savingsPlan();
  const spent = t.expense;
  const alerts = cats.filter((c) => c.status === 'hampir');
  const recent = getTransactions(month).slice(0, 3);
  const savedPct = Math.round((t.remaining / Math.max(1, t.income)) * 100);
  // Rincian pemasukan dihitung dari transaksi bulan ini, bukan ditulis tangan.
  const incomes = getTransactions(month).filter((x) => x.kind === 'income');
  const gaji = incomes.filter((x) => /gaji/i.test(x.note)).reduce((s, x) => s + x.amount, 0);
  const jualan = incomes.filter((x) => /jualan/i.test(x.note)).reduce((s, x) => s + x.amount, 0);
  const lain = t.income - gaji - jualan;
  const sources = [];
  if (gaji > 0) sources.push('gaji');
  if (jualan > 0) sources.push('jualan online');
  if (lain > 0) sources.push('pemasukan lain');
  const incomeSub = gaji > 0 && jualan > 0
    ? 'Gaji ' + rupiah(gaji) + ' + jualan online ' + rupiah(jualan)
    : incomes.length + ' pemasukan tercatat';
  const legend = cats.map((c) => {
    const share = spent ? Math.round((c.spent / spent) * 100) : 0;
    return '<li><span class="dot" style="background:' + c.color + '"></span>' +
      '<span class="leg-name">' + c.name + '</span>' +
      '<span class="leg-val">' + rupiahShort(c.spent) + ' · ' + share + '%</span></li>';
  }).join('');
  const rows = recent.map((tx) => {
    const cat = CATEGORIES.find((c) => c.id === tx.category);
    return '<tr><td>' + shortDate(tx.date) + '</td><td>' + escapeHtml(tx.note) + '</td>' +
      '<td>' + (cat ? cat.name : 'Pemasukan') + '</td>' +
      '<td class="num ' + (tx.kind === 'income' ? 'in' : 'out') + '">' +
      (tx.kind === 'income' ? '+' : '−') + rupiah(tx.amount) + '</td></tr>';
  }).join('');
  // Aturan 50/30/20: kebutuhan = 5 kategori pokok, keinginan = Hiburan,
  // tabungan = sisa. Keluarga ini menabung 36% — jauh di atas target 20%.
  const needs = cats.filter((c) => c.id !== 'hiburan').reduce((s, c) => s + c.spent, 0);
  const wants = cats.find((c) => c.id === 'hiburan').spent;
  const needsPct = t.income ? Math.round((needs / t.income) * 100) : 0;
  const wantsPct = t.income ? Math.round((wants / t.income) * 100) : 0;
  const targets = getTargets();
  return nav('#/') +
    '<section class="hero"><h1>Keuangan keluarga, ' + monthName(month) + '</h1>' +
    '<p>Pemasukan ' + rupiah(t.income) + (sources.length ? ' dari ' + sources.join(' dan ') : '') + '.</p></section>' +
    '<section class="cards">' +
    '<div class="card big"><span class="label">Pemasukan bulan ini</span><strong>' + rupiah(t.income) + '</strong><span class="sub">' + incomeSub + '</span></div>' +
    '<div class="card big"><span class="label">Pengeluaran bulan ini</span><strong>' + rupiah(t.expense) + '</strong><span class="sub">' + percent(t.expense, t.income) + '% dari pemasukan · ' + getTransactions(month).length + ' transaksi tercatat</span></div>' +
    '<div class="card big highlight"><span class="label">Sisa / tabungan</span><strong>' + rupiah(t.remaining) + '</strong><span class="sub">' + savedPct + '% dari pemasukan · ' + rupiah(plan.monthly) + ' masuk target tabungan, sisa bebas ' + rupiah(plan.freeAfterSaving) + '</span></div>' +
    '</section>' +
    '<section class="card strip"><h2>Aturan 50/30/20 — ke mana perginya pemasukan?</h2>' +
    '<div class="strip-bar"><div class="seg needs" style="width:' + needsPct + '%"></div><div class="seg wants" style="width:' + Math.max(2, wantsPct) + '%"></div><div class="seg save" style="width:' + savedPct + '%"></div></div>' +
    '<div class="strip-legend"><span><span class="dot" style="background:#166534"></span>Kebutuhan ' + needsPct + '% (' + rupiah(needs) + ') · target 50%</span><span><span class="dot" style="background:#d97706"></span>Keinginan ' + wantsPct + '% (' + rupiah(wants) + ') · target 30%</span><span><span class="dot" style="background:#0369a1"></span>Tabungan ' + savedPct + '% (' + rupiah(t.remaining) + ') · target 20%</span></div>' +
    '<p class="strip-note">Keluarga ini menabung <strong>' + savedPct + '%</strong> — di atas target 20%. Sisa bebas ' + rupiah(plan.freeAfterSaving) + ' belum punya tugas; beri tugas sekarang:</p>' +
    '<div class="allocate-row">' + targets.map((g) =>
      '<button data-allocate="' + g.id + '" data-amount="' + g.monthly + '">＋ ' + rupiah(g.monthly) + ' ke ' + g.name + '</button>').join('') + '</div>' +
    '</section>' +
    (alerts.length ? '<section class="alert"><strong>Perhatian:</strong> ' + alerts.map((c) =>
      c.name + ' sudah ' + c.pct + '% dari anggaran').join(' dan ') +
      ' — tunda belanja besar.</section>' : '') +
    '<section class="grid2">' +
    '<div class="card"><h2>Pengeluaran per kategori</h2><canvas id="donut" width="600" height="190"></canvas><ul class="legend cols2">' + legend + '</ul></div>' +
    '<div class="card"><h2>Anggaran per kategori</h2>' + cats.slice().sort((a, b) => b.pct - a.pct).slice(0, 3).map((c) =>
      '<div class="cat-row"><div class="cat-head"><span>' + c.name + '</span><span>' + rupiah(c.spent) + ' / ' + rupiah(c.budget) + '</span></div>' +
      progressBar(c.pct, c.status) +
      '<div class="cat-foot"><span>' + c.pct + '% terpakai</span><span>Sisa ' + rupiah(c.left) + '</span>' + statusBadge(c.status) + '</div></div>').join('') +
      '<p class="more"><a href="#/anggaran">Lihat semua anggaran &rarr;</a></p></div>' +
    '</section>' +
    '<section class="card"><h2>Transaksi terbaru</h2><table class="tx"><thead><tr><th>Tanggal</th><th>Catatan</th><th>Kategori</th><th class="num">Jumlah</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<p class="more"><a href="#/transaksi">Lihat &amp; catat semua transaksi &rarr;</a></p></section>';
}

// ---- Catat Transaksi ----
export function transaksiPage(editing) {
  const month = getMonth();
  const txs = getTransactions(month);
  const monthOptions = monthsAvailable().map((m) =>
    '<option value="' + m + '"' + (m === month ? ' selected' : '') + '>' + monthName(m) + '</option>').join('');
  const options = CATEGORIES.map((c) => '<option value="' + c.id + '">' + c.name + '</option>').join('');
  const rows = txs.map((tx) => {
    const cat = CATEGORIES.find((c) => c.id === tx.category);
    return '<tr><td>' + shortDate(tx.date) + '</td><td>' + escapeHtml(tx.note) + '</td>' +
      '<td>' + (cat ? cat.name : 'Pemasukan') + '</td>' +
      '<td class="num ' + (tx.kind === 'income' ? 'in' : 'out') + '">' +
      (tx.kind === 'income' ? '+' : '−') + rupiah(tx.amount) + '</td>' +
      '<td class="actions"><button data-edit="' + tx.id + '">Ubah</button> <button data-delete="' + tx.id + '" class="danger-btn">Hapus</button></td></tr>';
  }).join('');
  return nav('#/transaksi') +
    '<section class="hero"><h1>Catat transaksi</h1><p>Setiap pemasukan dan pengeluaran dicatat di sini. Total di beranda, chart, dan progress anggaran langsung mengikuti — tidak ada angka yang perlu dihitung manual.</p></section>' +
    '<section class="card"><h2>' + (editing ? 'Ubah transaksi' : 'Transaksi baru') + '</h2>' +
    '<form id="tx-form">' +
    (editing ? '<input type="hidden" name="id" value="' + editing.id + '">' : '') +
    '<div class="form-grid">' +
    '<label>Tanggal<input type="date" name="date" value="' + (editing ? editing.date : month + '-26') + '" required></label>' +
    '<label>Jenis<select name="kind" id="kind-select"><option value="expense"' + (!editing || editing.kind === 'expense' ? ' selected' : '') + '>Pengeluaran</option><option value="income"' + (editing && editing.kind === 'income' ? ' selected' : '') + '>Pemasukan</option></select></label>' +
    '<label id="category-field"' + (editing && editing.kind === 'income' ? ' hidden' : '') + '>Kategori<select name="category">' + options + '</select></label>' +
    '<label>Jumlah (Rp)<input type="number" name="amount" min="1000" step="500" placeholder="150000" value="' + (editing ? editing.amount : '') + '" required></label>' +
    '<label class="wide">Catatan<input type="text" name="note" maxlength="80" placeholder="cth. Belanja pasar mingguan" value="' + (editing ? escapeHtml(editing.note) : '') + '" required></label>' +
    '</div>' +
    '<p class="form-error" id="tx-error" role="alert" hidden></p>' +
    '<div class="form-actions"><button type="submit" class="primary">' + (editing ? 'Simpan perubahan' : 'Tambah transaksi') + '</button>' +
    (editing ? '<button type="button" data-cancel-edit>Batal</button>' : '') +
    '<span class="hint">Tersimpan di perangkat ini (localStorage).</span></div>' +
    '</form></section>' +
    '<section class="card"><h2>Transaksi ' + monthName(month) + ' (' + txs.length + ')</h2>' +
    '<div class="month-filter"><label for="month-select">Bulan</label><select id="month-select">' + monthOptions + '</select><span class="hint">Hanya transaksi bulan ini yang dihitung di beranda dan laporan.</span></div>' +
    '<table class="tx"><thead><tr><th>Tanggal</th><th>Catatan</th><th>Kategori</th><th class="num">Jumlah</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<p class="more"><button data-reset class="link-btn">Kembalikan ke data contoh</button> — menghapus semua perubahan yang pernah dibuat.</p></section>';
}

// ---- Anggaran ----
export function anggaranPage() {
  const cats = categorySummary();
  const totalBudget = cats.reduce((s, c) => s + c.budget, 0);
  const totalSpent = cats.reduce((s, c) => s + c.spent, 0);
  return nav('#/anggaran') +
    '<section class="hero"><h1>Anggaran per kategori</h1><p>Total anggaran bulan ini ' + rupiah(totalBudget) + ', sudah terpakai ' + rupiah(totalSpent) + ' (' + percent(totalSpent, totalBudget) + '%). Ubah batasnya di bawah — progress bar dan peringatan langsung menyesuaikan.</p></section>' +
    '<section class="grid3">' + cats.map((c) =>
      '<div class="card"><div class="cat-head"><h2>' + c.name + '</h2>' + statusBadge(c.status) + '</div>' +
      '<p class="big-num">' + rupiah(c.spent) + ' <span class="muted">dari ' + rupiah(c.budget) + '</span></p>' +
      progressBar(c.pct, c.status) +
      '<p class="cat-foot"><span>' + c.pct + '% terpakai</span><span>' + (c.left >= 0 ? 'Sisa ' + rupiah(c.left) : 'Lebih ' + rupiah(-c.left)) + '</span></p>' +
      '<form class="budget-form" data-category="' + c.id + '"><label>Batas anggaran (Rp)<input type="number" name="budget" min="0" step="50000" value="' + c.budget + '" required></label><button type="submit" class="primary">Simpan batas</button></form>' +
      '<p class="form-error" role="alert" hidden></p>' +
      '<p class="hint">' + (c.status === 'hampir' ? 'Sudah di atas 95% — tunda belanja kategori ini sampai bulan depan.' : c.status === 'waspada' ? 'Di atas 80% — hati-hati, sisakan untuk kebutuhan mendesak.' : 'Masih aman, ada ruang untuk kebutuhan tak terduga.') + '</p></div>').join('') +
    '</section>';
}

// ---- Laporan ----
export function laporanPage() {
  const month = getMonth();
  const prev = prevMonth(month);
  const t = totals();
  const cats = categorySummary();
  const lastTotal = monthTotals(prev).expense;
  const hiburan = cats.find((c) => c.id === 'hiburan');
  const hiburanLast = categorySpentInMonth('hiburan', prev);
  const rows = cats.map((c) => {
    const before = categorySpentInMonth(c.id, prev);
    const diff = c.spent - before;
    return { ...c, before, diff };
  });
  const table = rows.map((r) =>
    '<tr><td><span class="dot" style="background:' + r.color + '"></span> ' + r.name + '</td>' +
    '<td class="num">' + rupiah(r.spent) + '</td><td class="num">' + rupiah(r.before) + '</td>' +
    '<td class="num ' + (r.diff <= 0 ? 'in' : 'out') + '">' + (r.diff <= 0 ? '−' : '+') + rupiah(Math.abs(r.diff)) + '</td></tr>').join('');
  const biggest = getTransactions(month).filter((x) => x.kind === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5);
  const monthOptions = monthsAvailable().map((m) =>
    '<option value="' + m + '"' + (m === month ? ' selected' : '') + '>' + monthName(m) + '</option>').join('');
  const direction = t.expense <= lastTotal ? 'turun' : 'naik';
  const biggestDrop = rows.slice().sort((a, b) => a.diff - b.diff)[0];
  const dropText = biggestDrop && biggestDrop.diff < 0
    ? ' Penurunan terbesar dari ' + biggestDrop.name + ': dari ' + rupiah(biggestDrop.before) + ' menjadi ' + rupiah(biggestDrop.spent) + '.'
    : '';
  return nav('#/laporan') +
    '<section class="hero"><h1>Laporan ' + monthName(month) + '</h1><p>Pengeluaran bulan ini ' + rupiah(t.expense) + ', ' + direction + ' ' + rupiah(Math.abs(lastTotal - t.expense)) + ' (' + deltaPercent(t.expense, lastTotal) + ') dibanding ' + monthName(prev) + ' ' + rupiah(lastTotal) + '.' + dropText + '</p>' +
    '<div class="month-filter"><label for="month-select">Bulan</label><select id="month-select">' + monthOptions + '</select></div></section>' +
    '<section class="card"><h2>Tren 5 bulan terakhir</h2><canvas id="trend" width="600" height="258"></canvas>' +
    '<p class="hint">Pemasukan stabil di Rp 8,4–8,65 jt; pengeluaran sempat naik empat bulan berturut-turut sampai Oktober, lalu turun di November.</p></section>' +
    '<section class="grid2">' +
    '<div class="card"><h2>Bulan ini vs bulan lalu</h2><canvas id="compare" width="600" height="300"></canvas></div>' +
    '<div class="card"><h2>Per kategori</h2><table class="tx"><thead><tr><th>Kategori</th><th class="num">' + shortMonth(month) + '</th><th class="num">' + shortMonth(prev) + '</th><th class="num">Selisih</th></tr></thead><tbody>' + table + '</tbody></table></div>' +
    '</section>' +
    '<section class="card"><h2>Pengeluaran terbesar bulan ini</h2><ol class="ranked">' + biggest.map((tx) =>
      '<li><span>' + escapeHtml(tx.note) + ' · ' + shortDate(tx.date) + '</span><strong>' + rupiah(tx.amount) + '</strong></li>').join('') + '</ol>' +
    (biggest.length ? '<p class="hint">' + escapeHtml(biggest[0].note) + ' (' + rupiah(biggest[0].amount) + ') adalah pengeluaran tunggal terbesar bulan ini.</p>' : '<p class="hint">Belum ada pengeluaran tercatat bulan ini.</p>') + '</section>';
}

// ---- Target Tabungan ----
export function targetPage() {
  const targets = getTargets();
  const plan = savingsPlan();
  const totalSaved = targets.reduce((s, x) => s + x.saved, 0);
  const totalTarget = targets.reduce((s, x) => s + x.target, 0);
  return nav('#/target') +
    '<section class="hero"><h1>Target tabungan</h1><p>Sudah terkumpul ' + rupiah(totalSaved) + ' dari total target ' + rupiah(totalTarget) + ' (' + percent(totalSaved, totalTarget) + '%). Setoran rutin ' + rupiah(plan.monthly) + '/bulan diambil dari sisa bulan ini (' + rupiah(plan.freeAfterSaving) + ' tetap bebas setelah menabung).</p></section>' +
    '<section class="grid3">' + targets.map((g) => {
      const pct = percent(g.saved, g.target);
      const left = g.target - g.saved;
      const months = Math.ceil(left / Math.max(1, g.monthly));
      return '<div class="card"><h2>' + g.name + '</h2><p class="muted">' + g.detail + '</p>' +
        '<p class="big-num">' + rupiah(g.saved) + ' <span class="muted">dari ' + rupiah(g.target) + '</span></p>' +
        progressBar(pct, pct >= 80 ? 'waspada' : 'aman') +
        '<p class="cat-foot"><span>' + pct + '% tercapai</span><span>Sisa ' + rupiah(left) + '</span></p>' +
        '<p>Setoran ' + rupiah(g.monthly) + '/bulan · kira-kira ' + months + ' bulan lagi tercapai.</p>' +
        '<form class="save-form" data-target="' + g.id + '"><label>Tambah tabungan (Rp)<input type="number" name="amount" min="1000" step="10000" placeholder="100000" required></label><button type="submit" class="primary">Tambah</button></form>' +
        '<p class="form-error" role="alert" hidden></p></div>';
    }).join('') + '</section>';
}

// ---- Tips ----
export function tipsPage() {
  return nav('#/tips') +
    '<section class="hero"><h1>Tips hemat untuk keluarga</h1><p>Enam kebiasaan kecil yang, bila dijalankan bersama, bisa memangkas pengeluaran Rp 300.000–500.000 per bulan tanpa mengurangi kualitas hidup keluarga.</p></section>' +
    '<section class="grid2">' + TIPS.map((tip) =>
      '<div class="card"><h2>' + tip.title + '</h2><p>' + tip.body + '</p></div>').join('') + '</section>' +
    '<section class="card"><h2>Cek bulanan — 5 menit saja</h2><ol class="checklist">' +
    '<li>Catat semua pengeluaran minggu ini di <a href="#/transaksi">Catat Transaksi</a>.</li>' +
    '<li>Buka <a href="#/anggaran">Anggaran</a>: ada kategori yang sudah di atas 90%?</li>' +
    '<li>Pindahkan setoran tabungan begitu gajian masuk — lihat <a href="#/target">Target Tabungan</a>.</li>' +
    '<li>Bandingkan dengan bulan lalu di <a href="#/laporan">Laporan</a>.</li></ol></section>';
}

export function notFound() {
  return nav('#/') + '<section class="hero"><h1>Halaman tidak ditemukan</h1><p>Tidak ada halaman di alamat ini. <a href="#/">Kembali ke Beranda</a>.</p></section>';
}
