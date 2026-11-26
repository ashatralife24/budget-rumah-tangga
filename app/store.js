// State Budget Rumah Tangga: transaksi, anggaran, dan target tabungan.
// Satu-satunya sumber kebenaran untuk semua angka di situs. Semua halaman
// (beranda, transaksi, anggaran, laporan, target) menghitung dari sini, jadi
// total, chart, dan progress bar tidak mungkin berbeda satu sama lain.
//
// Data awal berasal dari data.js; perubahan pengguna (tambah/edit/hapus
// transaksi, ubah anggaran, tambah tabungan) disimpan di localStorage dan
// dipakai lagi saat halaman dibuka berikutnya.

import { CATEGORIES, SEED_TRANSACTIONS, SEED_TARGETS } from './data.js';

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
  };
}

let state = loadStored() || freshState();

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

export function getTransactions() {
  return state.transactions.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
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

export function totals() {
  let income = 0;
  let expense = 0;
  for (const t of state.transactions) {
    if (t.kind === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, remaining: income - expense };
}

export function spentByCategory() {
  const spent = {};
  for (const c of CATEGORIES) spent[c.id] = 0;
  for (const t of state.transactions) {
    if (t.kind === 'expense' && t.category && spent[t.category] !== undefined) {
      spent[t.category] += t.amount;
    }
  }
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
