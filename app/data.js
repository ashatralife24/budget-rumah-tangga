// Data contoh Budget Rumah Tangga — satu keluarga Indonesia, November 2026.
// Semua angka di sini konsisten satu sama lain: total pemasukan, total
// pengeluaran per kategori, dan sisa dihitung dari transaksi yang sama di
// bawah ini (lihat store.js). Ubah satu angka di sini, semua halaman ikut
// berubah, karena tidak ada total yang ditulis tangan di tempat lain.

// Bulan yang sedang berjalan di situs ini.
export const CURRENT_MONTH = { year: 2026, month: 11, label: 'November 2026' };

// Kategori pengeluaran. `budget` adalah batas bulanan tiap kategori.
export const CATEGORIES = [
  { id: 'belanja', name: 'Belanja Harian', budget: 2400000, color: '#16a34a' },
  { id: 'transport', name: 'Transport', budget: 800000, color: '#0284c7' },
  { id: 'tagihan', name: 'Tagihan & Listrik', budget: 950000, color: '#b45309' },
  { id: 'pendidikan', name: 'Pendidikan', budget: 1200000, color: '#7c3aed' },
  { id: 'kesehatan', name: 'Kesehatan', budget: 500000, color: '#db2777' },
  { id: 'hiburan', name: 'Hiburan', budget: 400000, color: '#ea580c' },
];

// Pemasukan bulan ini: gaji Rp 8.000.000 + jualan online Rp 650.000 = Rp 8.650.000.
export const SEED_TRANSACTIONS = [
  { id: 't01', date: '2026-11-01', kind: 'income', category: null, note: 'Gaji bulanan', amount: 8000000 },
  { id: 't02', date: '2026-11-01', kind: 'expense', category: 'hiburan', note: 'Langganan streaming', amount: 79000 },
  { id: 't03', date: '2026-11-02', kind: 'expense', category: 'belanja', note: 'Belanja pasar mingguan', amount: 425000 },
  { id: 't04', date: '2026-11-03', kind: 'expense', category: 'transport', note: 'Bensin motor', amount: 150000 },
  { id: 't05', date: '2026-11-04', kind: 'expense', category: 'pendidikan', note: 'SPP anak', amount: 750000 },
  { id: 't06', date: '2026-11-05', kind: 'expense', category: 'belanja', note: 'Belanja bulanan supermarket', amount: 685000 },
  { id: 't07', date: '2026-11-06', kind: 'expense', category: 'tagihan', note: 'Listrik PLN', amount: 385000 },
  { id: 't08', date: '2026-11-06', kind: 'expense', category: 'tagihan', note: 'Air PDAM', amount: 145000 },
  { id: 't09', date: '2026-11-07', kind: 'expense', category: 'transport', note: 'Ojek online', amount: 85000 },
  { id: 't10', date: '2026-11-08', kind: 'expense', category: 'tagihan', note: 'Iuran RT & sampah', amount: 75000 },
  { id: 't11', date: '2026-11-09', kind: 'expense', category: 'belanja', note: 'Belanja pasar & sayur', amount: 380000 },
  { id: 't12', date: '2026-11-10', kind: 'expense', category: 'tagihan', note: 'Internet rumah', amount: 299000 },
  { id: 't13', date: '2026-11-11', kind: 'expense', category: 'pendidikan', note: 'Buku & alat tulis', amount: 185000 },
  { id: 't14', date: '2026-11-12', kind: 'expense', category: 'transport', note: 'Bensin motor', amount: 150000 },
  { id: 't15', date: '2026-11-13', kind: 'expense', category: 'kesehatan', note: 'Obat & vitamin', amount: 165000 },
  { id: 't16', date: '2026-11-14', kind: 'expense', category: 'pendidikan', note: 'Les matematika', amount: 200000 },
  { id: 't17', date: '2026-11-15', kind: 'income', category: null, note: 'Jualan online', amount: 650000 },
  { id: 't18', date: '2026-11-15', kind: 'expense', category: 'hiburan', note: 'Nonton bioskop keluarga', amount: 180000 },
  { id: 't19', date: '2026-11-16', kind: 'expense', category: 'belanja', note: 'Belanja pasar mingguan', amount: 410000 },
  { id: 't20', date: '2026-11-18', kind: 'expense', category: 'transport', note: 'Parkir & tol', amount: 120000 },
  { id: 't21', date: '2026-11-19', kind: 'expense', category: 'kesehatan', note: 'Periksa gigi anak', amount: 250000 },
  { id: 't22', date: '2026-11-21', kind: 'expense', category: 'belanja', note: 'Sayur, lauk & buah', amount: 295000 },
  { id: 't23', date: '2026-11-22', kind: 'expense', category: 'transport', note: 'Bensin motor', amount: 150000 },
];

// Jumlah pengeluaran per kategori (dihitung dari transaksi di atas):
// Belanja 2.195.000 (91% dari 2.400.000) · Transport 655.000 (82% dari 800.000)
// Tagihan 904.000 (95% dari 950.000) · Pendidikan 1.135.000 (95% dari 1.200.000)
// Kesehatan 415.000 (83% dari 500.000) · Hiburan 259.000 (65% dari 400.000)
// Total pengeluaran Rp 5.563.000; sisa Rp 8.650.000 − Rp 5.563.000 = Rp 3.087.000.

// Riwayat bulanan untuk halaman Laporan (tren + perbandingan bulan lalu).
// Oktober 2026 dirinci per kategori; bulan sebelumnya hanya totalnya.
export const MONTHLY_HISTORY = [
  { label: 'Jul 2026', income: 8400000, expense: 5240000 },
  { label: 'Agu 2026', income: 8400000, expense: 5480000 },
  { label: 'Sep 2026', income: 8500000, expense: 5705000 },
  { label: 'Okt 2026', income: 8500000, expense: 5912000 },
  { label: 'Nov 2026', income: 8650000, expense: 5563000 },
];

// Rincian pengeluaran Oktober 2026 (bulan lalu) per kategori.
export const LAST_MONTH_BY_CATEGORY = [
  { id: 'belanja', spent: 2310000 },
  { id: 'transport', spent: 720000 },
  { id: 'tagihan', spent: 890000 },
  { id: 'pendidikan', spent: 1050000 },
  { id: 'kesehatan', spent: 380000 },
  { id: 'hiburan', spent: 562000 },
];

// Target tabungan. Setoran bulanan ketiganya Rp 1.000.000 — diambil dari sisa
// bulan ini (Rp 3.087.000), jadi sisa bebas setelah menabung Rp 2.087.000.
export const SEED_TARGETS = [
  { id: 'g1', name: 'Dana Darurat', detail: 'Untuk keadaan tak terduga, target 6x pengeluaran bulanan', target: 12000000, saved: 7250000, monthly: 500000 },
  { id: 'g2', name: 'Liburan Keluarga', detail: 'Liburan akhir tahun ke Yogyakarta, 4 orang', target: 5000000, saved: 2400000, monthly: 300000 },
  { id: 'g3', name: 'Dana Pendidikan', detail: 'Biaya masuk sekolah lanjutan tahun depan', target: 10000000, saved: 6000000, monthly: 200000 },
];

// Tips hemat yang realistis untuk rumah tangga Indonesia.
export const TIPS = [
  { title: 'Belanja pasar seminggu sekali', body: 'Satu kali belanja besar di pasar (sekitar Rp 400.000) lebih murah daripada jajan harian di minimarket. Buat daftar dulu, dan masak bekal dari bahan yang sama untuk 2–3 hari.' },
  { title: 'Pisahkan uang begitu gajian masuk', body: 'Saat gaji Rp 8.000.000 masuk, langsung pindahkan Rp 1.000.000 ke rekening tabungan terpisah. Sisa Rp 7.650.000 (gaji + jualan online Rp 650.000, setelah tabungan) itulah yang boleh dibelanjakan — bukan sebaliknya.' },
  { title: 'Cek meteran listrik tiap minggu', body: 'Tagihan listrik keluarga ini Rp 385.000/bulan. Matikan dispenser dan kipas saat tidak dipakai, dan ganti lampu ke LED: hematnya bisa Rp 50.000–80.000 per bulan.' },
  { title: 'Atur batas ojek online', body: 'Ojek online mudah membengkak tanpa terasa. Batas Rp 200.000/bulan dan naik motor sendiri untuk jarak dekat bisa memangkas pengeluaran transport sampai sepertiga.' },
  { title: 'Satu hari tanpa belanja tiap minggu', body: 'Tetapkan satu hari “tanpa belanja” — masak dari stok kulkas dan pantry. Keluarga ini bisa menghemat sekitar Rp 150.000–200.000 per bulan dari kebiasaan ini saja.' },
  { title: 'Bandingkan harga sebelum beli', body: 'Untuk belanja bulanan di atas Rp 500.000, bandingkan harga di dua tempat (pasar dan supermarket). Selisih 5–10% untuk kebutuhan pokok berarti Rp 100.000 lebih per bulan.' },
];
