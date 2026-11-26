// State Budget Rumah Tangga: transaksi, anggaran, dan target tabungan.
// Satu-satunya sumber kebenaran untuk semua angka di situs. Semua halaman
// (beranda, transaksi, anggaran, laporan, target) menghitung dari sini, jadi
// total, chart, dan progress bar tidak mungkin berbeda satu sama lain.
//
// Data awal berasal dari data.js; perubahan pengguna (tambah/edit/hapus
// transaksi, ubah anggaran, tambah tabungan) disimpan di localStorage dan
// dipakai lagi saat halaman dibuka berikutnya.

import { CATEGORIES, SEED_TRANSACTIONS, SEED_TARGETS, MONTHLY_HISTORY, LAST_MONTH_BY_CATEGORY } from './data.js';

const STORAGE_KEY = 'brt-state-v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.transactions) || !Array.isArray(parsed.budgets)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function freshState() {
  return {
    transactions: clone(SEED_TRANSACTIONS),
    budgets: CATEGORIES.map((c) => ({ id: c.id, budget: c.budget })),
    targets: clone(SEED_TARGETS),
    nextId: 100,
    month: '2026-11',
  };
}

let state = loadStored() || freshState();
if (!state.month) state.month = '2026-11';

// ---- Bulan yang sedang ditampilkan ("2026-11"). Semua hitungan hanya
// memakai transaksi dari bulan ini, supaya transaksi bulan lain tidak
// menggelembungkan total bulan yang ditampilkan.
export function getMonth() {
  return state.month;
}

export function setMonth(month) {
  if (/^\d{4}-\d{2}$/.test(month)) {
    state.month = month;
    saveState();
  }
}

export function monthsAvailable() {
  const set = new Set(state.transactions.map((t) => t.date.slice(0, 7)));
  set.add('2026-11');
  return [...set].sort().reverse();
}

export function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
}

// Total bulan tertentu. Dihitung dari transaksi bila bulan itu punya
// transaksi (jadi edit pengguna langsung terlihat); bila tidak ada, pakai
// MONTHLY_HISTORY (Jul–Okt 2026, yang transaksinya tidak disimpan).
export function monthTotals(ym) {
  let income = 0;
  let expense = 0;
  for (const t of state.transactions) {
    if (t.date.slice(0, 7) !== ym) continue;
    if (t.kind === 'income') income += t.amount;
    else expense += t.amount;
  }
  if (income || expense) return { income, expense };
  const short = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const label = short[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4);
  const found = MONTHLY_HISTORY.find((h) => h.label === label);
  if (found) return { income: found.income, expense: found.expense };
  return { income: 0, expense: 0 };
}

// Pengeluaran satu kategori di satu bulan. Untuk Oktober 2026 pakai data
// per kategori yang memang dicatat (LAST_MONTH_BY_CATEGORY); selebihnya
// dihitung dari transaksi.
export function categorySpentInMonth(categoryId, ym) {
  if (ym === '2026-10') {
    const row = LAST_MONTH_BY_CATEGORY.find((x) => x.id === categoryId);
    return row ? row.spent : 0;
  }
  let spent = 0;
  for (const t of state.transactions) {
    if (t.kind === 'expense' && t.category === categoryId && t.date.slice(0, 7) === ym) spent += t.amount;
  }
  return spent;
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Penyimpanan penuh atau dimatikan: situs tetap jalan untuk sesi ini.
  }
}

// Kembalikan state ke data contoh (dipakai tombol "Reset contoh" di Transaksi).
export function resetState() {
  state = freshState();
  saveState();
  return state;
}

export function getTransactions(month) {
  const list = month
    ? state.transactions.filter((t) => t.date.slice(0, 7) === month)
    : state.transactions.slice();
  return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getBudgets() {
  const map = {};
  for (const b of state.budgets) map[b.id] = b.budget;
  return map;
}

export function setBudget(categoryId, amount) {
  const entry = state.budgets.find((b) => b.id === categoryId);
  if (entry) entry.budget = Math.max(0, Math.round(amount) || 0);
  saveState();
}

export function getTargets() {
  return state.targets;
}

export function addToTarget(targetId, amount) {
  const target = state.targets.find((t) => t.id === targetId);
  if (!target) return;
  target.saved = Math.min(target.target, target.saved + (Math.round(amount) || 0));
  saveState();
}

export function addTransaction(tx) {
  const id = 'u' + state.nextId;
  state.nextId += 1;
  state.transactions.push({
    id,
    date: tx.date,
    kind: tx.kind,
    category: tx.kind === 'expense' ? tx.category : null,
    note: tx.note,
    amount: Math.round(tx.amount),
  });
  saveState();
  return id;
}

export function updateTransaction(id, tx) {
  const found = state.transactions.find((t) => t.id === id);
  if (!found) return false;
  found.date = tx.date;
  found.kind = tx.kind;
  found.category = tx.kind === 'expense' ? tx.category : null;
  found.note = tx.note;
  found.amount = Math.round(tx.amount);
  saveState();
  return true;
}

export function deleteTransaction(id) {
  const before = state.transactions.length;
  state.transactions = state.transactions.filter((t) => t.id !== id);
  if (state.transactions.length !== before) saveState();
  return state.transactions.length !== before;
}

// ---- Hitungan: semua halaman memakai fungsi-fungsi ini. ----
// totals() dan spentByCategory() memakai bulan yang sedang dipilih
// (state.month); bulan lain tidak ikut menghitung.

export function totals() {
  const { income, expense } = monthTotals(state.month);
  return { income, expense, remaining: income - expense };
}

export function spentByCategory() {
  const spent = {};
  for (const c of CATEGORIES) spent[c.id] = categorySpentInMonth(c.id, state.month);
  return spent;
}

export function categorySummary() {
  const budgets = getBudgets();
  const spent = spentByCategory();
  return CATEGORIES.map((c) => {
    const used = spent[c.id];
    const budget = budgets[c.id];
    const left = budget - used;
    const pct = budget ? Math.round((used / budget) * 100) : 0;
    const status = pct >= 95 ? 'hampir' : pct >= 80 ? 'waspada' : 'aman';
    return { ...c, spent: used, budget, left, pct, status };
  });
}

// Sisa setelah alokasi tabungan bulanan (Rp 1.000.000 dari data contoh).
export function savingsPlan() {
  const { remaining } = totals();
  const monthly = state.targets.reduce((sum, t) => sum + t.monthly, 0);
  return { monthly, freeAfterSaving: remaining - monthly };
}
