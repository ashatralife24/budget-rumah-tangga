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
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, setBudget, addToTarget, resetState, categorySummary, getMonth, setMonth, prevMonth, categorySpentInMonth, getTargets } from './store.js';
import { rupiah, escapeHtml, monthName } from './format.js';
import { drawDonut, drawCompareBars, drawTrend } from './charts.js';
import { CATEGORIES, MONTHLY_HISTORY } from './data.js';

const app = document.getElementById('app');
let editingId = null;
let flash = null;

function showError(form, message, field) {
  const box = form.querySelector('.form-error');
  if (box) {
    box.textContent = message;
    box.hidden = false;
  }
  if (field) field.focus();
}

function drawCharts(route) {
  if (route === '#/') {
    const donut = document.getElementById('donut');
    if (donut) {
      const cats = categorySummary();
      drawDonut(donut, cats.map((c) => ({ name: c.name, value: c.spent, color: c.color })));
    }
  }
  if (route === '#/laporan') {
    const trend = document.getElementById('trend');
    if (trend) drawTrend(trend, MONTHLY_HISTORY);
    const compare = document.getElementById('compare');
    if (compare) {
      const cats = categorySummary();
      const prev = prevMonth(getMonth());
      drawCompareBars(compare, cats.map((c) => ({
        name: c.name, now: c.spent, before: categorySpentInMonth(c.id, prev), color: c.color,
      })));
    }
  }
}

function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const route = hash.split('?')[0];
  let html;
  if (route === '#/' || route === '#') {
    document.title = 'Budget Rumah Tangga — Keuangan Keluarga ' + monthName(getMonth());
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
  const notice = flash ? '<div class="flash" role="status">' + escapeHtml(flash) + '</div>' : '';
  flash = null;
  app.innerHTML = notice + html;
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
    const dateInput = form.querySelector('input[name="date"]');
    const noteInput = form.querySelector('input[name="note"]');
    const amountInput = form.querySelector('input[name="amount"]');
    if (!fields.date || !/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) {
      showError(form, 'Pilih tanggal yang valid (format YYYY-MM-DD).', dateInput);
      return;
    }
    if (!fields.note) {
      showError(form, 'Isi dulu catatannya — mis. "Belanja pasar mingguan".', noteInput);
      return;
    }
    if (!(amount > 0)) {
      showError(form, 'Jumlah harus lebih dari Rp 0.', amountInput);
      return;
    }
    if (amount > 100000000) {
      showError(form, 'Jumlah di atas Rp 100.000.000 — periksa lagi angkanya.', amountInput);
      return;
    }
    const tx = { date: fields.date, kind: fields.kind, category: fields.category, note: fields.note, amount };
    if (fields.id) {
      updateTransaction(fields.id, tx);
      flash = 'Transaksi "' + fields.note + '" berhasil diubah.';
    } else {
      addTransaction(tx);
      flash = 'Transaksi "' + fields.note + '" (' + rupiah(amount) + ') berhasil ditambahkan.';
    }
    editingId = null;
    render();
    return;
  }
  if (form.classList.contains('budget-form')) {
    const fields = readForm(form);
    const amount = Number(fields.budget);
    const input = form.querySelector('input[name="budget"]');
    if (!Number.isFinite(amount) || amount < 0) {
      showError(form, 'Batas anggaran harus angka Rp 0 atau lebih.', input);
      return;
    }
    setBudget(form.dataset.category, amount);
    flash = 'Batas anggaran berhasil disimpan.';
    render();
    return;
  }
  if (form.classList.contains('save-form')) {
    const fields = readForm(form);
    const amount = Number(fields.amount);
    const input = form.querySelector('input[name="amount"]');
    if (!(amount > 0)) {
      showError(form, 'Isi jumlah tabungan yang mau ditambahkan (lebih dari Rp 0).', input);
      return;
    }
    addToTarget(form.dataset.target, amount);
    flash = rupiah(amount) + ' berhasil ditambahkan ke tabungan.';
    render();
  }
});

// Dropdown kategori tidak berlaku untuk pemasukan: sembunyikan saat
// Jenis = Pemasukan; pemilih bulan mengganti bulan yang ditampilkan.
app.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'kind-select') {
    const field = document.getElementById('category-field');
    if (field) field.hidden = target.value === 'income';
    return;
  }
  if (target.id === 'month-select') {
    setMonth(target.value);
    editingId = null;
    render();
  }
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.allocate) {
    const target = button.dataset.allocate;
    const amount = Number(button.dataset.amount);
    const goal = getTargets().find((g) => g.id === target);
    addToTarget(target, amount);
    flash = rupiah(amount) + ' dialokasikan ke ' + (goal ? goal.name : 'tabungan') + '.';
    render();
    return;
  }
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
      flash = 'Transaksi "' + tx.note + '" dihapus.';
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
      flash = 'Data contoh sudah dikembalikan.';
      render();
    }
  }
});

window.addEventListener('hashchange', () => {
  editingId = null;
  render();
});

render();
