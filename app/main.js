// Router dan wiring Budget Rumah Tangga.
//
//   #/            Beranda / ringkasan
//   #/transaksi   Catat transaksi (tambah / ubah / hapus)
//   #/anggaran    Anggaran per kategori
//   #/laporan     Laporan & chart
//   #/target      Target tabungan
//   #/tips        Tips hemat
//
// window.__shotReady bernilai false selama halaman dirender dan true setelah
// selesai, supaya skrip screenshot tahu kapan menangkap layar.

import { home, transaksiPage, anggaranPage, laporanPage, targetPage, tipsPage, notFound } from './views.js';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, setBudget, addToTarget, resetState, categorySummary } from './store.js';
import { rupiah } from './format.js';
import { drawDonut, drawCompareBars, drawTrend } from './charts.js';
import { CATEGORIES, MONTHLY_HISTORY, LAST_MONTH_BY_CATEGORY } from './data.js';

const app = document.getElementById('app');
let editingId = null;

function drawCharts(route) {
  if (route === '#/') {
    const donut = document.getElementById('donut');
    if (donut) {
      const cats = categorySummary();
      drawDonut(donut, cats.map((c) => ({ value: c.spent, color: c.color })));
    }
  }
  if (route === '#/laporan') {
    const trend = document.getElementById('trend');
    if (trend) drawTrend(trend, MONTHLY_HISTORY);
    const compare = document.getElementById('compare');
    if (compare) {
      const cats = categorySummary();
      drawCompareBars(compare, cats.map((c) => {
        const last = LAST_MONTH_BY_CATEGORY.find((x) => x.id === c.id);
        return { name: c.name, now: c.spent, before: last ? last.spent : 0, color: c.color };
      }));
    }
  }
}

function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const route = hash.split('?')[0];
  let html;
  if (route === '#/' || route === '#') {
    document.title = 'Budget Rumah Tangga — Keuangan Keluarga November 2026';
    html = home();
  } else if (route === '#/transaksi') {
    document.title = 'Catat Transaksi | Budget Rumah Tangga';
    const editing = editingId ? getTransactions().find((t) => t.id === editingId) || null : null;
    html = transaksiPage(editing);
  } else if (route === '#/anggaran') {
    document.title = 'Anggaran | Budget Rumah Tangga';
    html = anggaranPage();
  } else if (route === '#/laporan') {
    document.title = 'Laporan | Budget Rumah Tangga';
    html = laporanPage();
  } else if (route === '#/target') {
    document.title = 'Target Tabungan | Budget Rumah Tangga';
    html = targetPage();
  } else if (route === '#/tips') {
    document.title = 'Tips Hemat | Budget Rumah Tangga';
    html = tipsPage();
  } else {
    document.title = 'Tidak ditemukan | Budget Rumah Tangga';
    html = notFound();
  }
  app.innerHTML = html;
  drawCharts(route);
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function readForm(form) {
  const data = new FormData(form);
  const out = {};
  for (const [key, value] of data.entries()) out[key] = String(value).trim();
  return out;
}

app.addEventListener('submit', (event) => {
  const form = event.target;
  event.preventDefault();
  if (form.id === 'tx-form') {
    const fields = readForm(form);
    const amount = Number(fields.amount);
    if (!fields.date || !fields.note || !(amount > 0)) return;
    const tx = { date: fields.date, kind: fields.kind, category: fields.category, note: fields.note, amount };
    if (fields.id) updateTransaction(fields.id, tx);
    else addTransaction(tx);
    editingId = null;
    render();
    return;
  }
  if (form.classList.contains('budget-form')) {
    const fields = readForm(form);
    const amount = Number(fields.budget);
    if (amount >= 0) setBudget(form.dataset.category, amount);
    render();
    return;
  }
  if (form.classList.contains('save-form')) {
    const fields = readForm(form);
    const amount = Number(fields.amount);
    if (amount > 0) addToTarget(form.dataset.target, amount);
    render();
  }
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.edit) {
    editingId = button.dataset.edit;
    render();
    const form = document.getElementById('tx-form');
    if (form) form.scrollIntoView();
    return;
  }
  if (button.dataset.delete) {
    const tx = getTransactions().find((t) => t.id === button.dataset.delete);
    if (tx && window.confirm('Hapus transaksi "' + tx.note + '" (' + rupiah(tx.amount) + ')?')) {
      deleteTransaction(tx.id);
      render();
    }
    return;
  }
  if (button.hasAttribute('data-cancel-edit')) {
    editingId = null;
    render();
    return;
  }
  if (button.hasAttribute('data-reset')) {
    if (window.confirm('Kembalikan semua data ke contoh awal? Perubahan Anda akan hilang.')) {
      resetState();
      editingId = null;
      render();
    }
  }
});

window.addEventListener('hashchange', () => {
  editingId = null;
  render();
});

render();
