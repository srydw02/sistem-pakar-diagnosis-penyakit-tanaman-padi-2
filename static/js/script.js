// ============================================================
// script.js — Sistem Pakar Diagnosis Penyakit Tanaman
// Algoritma: Forward Chaining (penelusuran maju)
// Dibuat oleh: Anggota 6 / srydw02
//
// CARA BACA KODE INI (untuk yang baru dari C++):
//   - "let"      = seperti deklarasi variabel di C++ (int, string, dll.)
//   - "function" = seperti fungsi di C++
//   - Tidak perlu tulis tipe data — JS otomatis mengenali
//   - Array  []  = seperti vector<string> di C++
//   - Object {}  = seperti struct di C++ (kumpulan data bernama)
// ============================================================


// ── VARIABEL GLOBAL ───────────────────────────────────────────────────────────
// Seperti variabel global di atas main() pada C++.
// Variabel ini diingat selama halaman web masih terbuka.

let knowledgeBase = {};     // tempat menyimpan seluruh isi data.json setelah dimuat
let currentGejalaIndex = 0; // nomor pertanyaan yang sedang tampil, mulai dari 0
let selectedGejala = [];    // daftar jawaban user, contoh: ["G01", "!G02", "G06"]
let gejalaKeys = [];        // daftar kode gejala dari JSON, contoh: ["G01","G02",...,"G10"]


// ── MEMUAT DATA JSON ──────────────────────────────────────────────────────────
// fetch() = minta file data.json dari server.
// Ini ASYNC — artinya program tidak berhenti menunggu, melanjutkan dulu,
// lalu ketika file sudah siap, baru kode di dalam .then() dijalankan.
// Analogi C++: seperti memanggil callback setelah file selesai dibaca.

fetch('/data/data.json')                 // kirim permintaan ambil file ke server
  .then(function(response) {             // ketika respons HTTP datang dari server...
    return response.json();              // ubah teks JSON menjadi objek JavaScript
  })
  .then(function(data) {                 // ketika data sudah siap dipakai...
    knowledgeBase = data;                // simpan semua isi JSON ke variabel global

    gejalaKeys = Object.keys(data.gejala); // ambil semua kode gejala: ["G01","G02",...]
                                           // Object.keys() = ambil semua nama properti objek

    tampilkanPertanyaan();               // mulai tampilkan pertanyaan pertama ke layar
  });


// ── FUNGSI 1: forwardChaining() ───────────────────────────────────────────────
// TUGAS: Memeriksa gejala yang dipilih user terhadap semua aturan IF-THEN.
//
// Cara kerja:
//   for setiap aturan di daftar aturan:
//     if SEMUA kondisi aturan ada di gejala user → aturan terpenuhi → catat penyakitnya
//
// Parameter: faktaTerpilih = array gejala yang dijawab YA oleh user, contoh: ["G01","G06"]

function forwardChaining(faktaTerpilih) {

  // Buat "Working Memory" berisi fakta yang diketahui
  // Set = seperti set<string> di C++, efisien untuk mengecek apakah nilai ada di dalamnya
  let workingMemory = new Set(faktaTerpilih);

  // Objek kosong untuk menyimpan hasil — penyakit mana saja yang terdiagnosis
  // Format: { "P01": ["R01", "R02"], "P04": ["R09"] }
  let hasil = {};

  // Loop semua aturan IF-THEN satu per satu
  // Sama seperti: for (int i = 0; i < daftarAturan.size(); i++) di C++
  for (let i = 0; i < knowledgeBase.aturan.length; i++) {

    let aturan = knowledgeBase.aturan[i];
    // aturan berisi: { id:"R01", kondisi:["G01","G06"], kesimpulan:"P01" }

    // Cek apakah SEMUA kondisi aturan ini ada di Working Memory
    let semuaTerpenuhi = true;           // asumsi awal: semua kondisi terpenuhi

    for (let j = 0; j < aturan.kondisi.length; j++) { // loop setiap syarat di aturan ini
      let syarat = aturan.kondisi[j];                  // ambil satu syarat, contoh: "G01"

      if (!workingMemory.has(syarat)) {                // jika syarat ini TIDAK ada di fakta user...
        semuaTerpenuhi = false;                        // tandai: aturan ini gagal
        break;                                         // berhenti cek, tidak perlu lanjut
      }
    }

    // Jika semua kondisi terpenuhi, aturan ini berhasil
    if (semuaTerpenuhi) {
      let kodePenyakit = aturan.kesimpulan;            // ambil kode penyakit, contoh: "P01"

      if (hasil[kodePenyakit] === undefined) {         // jika penyakit ini belum pernah muncul...
        hasil[kodePenyakit] = [];                      // buat array kosong untuk menyimpan aturan
      }

      hasil[kodePenyakit].push(aturan.id);             // catat aturan yang berhasil, contoh: ["R01"]
                                                       // .push() = seperti push_back() di C++ vector
    }
  }

  return hasil; // kembalikan hasil: penyakit apa saja yang terdiagnosis
}


// ── FUNGSI 2: tampilkanPertanyaan() ──────────────────────────────────────────
// TUGAS: Menggambar satu kartu pertanyaan gejala ke layar.
// Dipanggil setiap kali user berpindah soal (maju atau mundur).

function tampilkanPertanyaan() {

  // Cari elemen <div id="gejala-list"> di HTML
  // Ini adalah tempat kartu pertanyaan akan ditulis
  let gejalaContainer = document.getElementById('gejala-list');

  gejalaContainer.innerHTML = ''; // kosongkan isi div (hapus pertanyaan sebelumnya)

  // Cek apakah masih ada pertanyaan yang belum ditampilkan
  if (currentGejalaIndex < gejalaKeys.length) {

    let kode       = gejalaKeys[currentGejalaIndex]; // kode gejala saat ini, contoh: "G01"
    let dataGejala = knowledgeBase.gejala[kode];     // data gejala dari JSON (teks, gambar, keterangan)
    let nomorSoal  = currentGejalaIndex + 1;         // nomor soal untuk ditampilkan (mulai dari 1)
    let total      = gejalaKeys.length;              // total jumlah soal (10)

    // Cek apakah user sudah pernah menjawab soal ini (untuk fitur tombol Kembali)
    let sudahJawabYa    = selectedGejala.includes(kode);       // true jika "G01" ada di array jawaban
    let sudahJawabTidak = selectedGejala.includes('!' + kode); // true jika "!G01" ada di array jawaban

    // Tentukan apakah checkbox perlu dicentang otomatis
    let atributYa    = '';                           // default: tidak tercentang
    let atributTidak = '';                           // default: tidak tercentang
    if (sudahJawabYa)    atributYa    = 'checked';  // jika pernah jawab Ya → centang
    if (sudahJawabTidak) atributTidak = 'checked';  // jika pernah jawab Tidak → centang

    // Tentukan label tombol kanan
    let labelTombol = 'Selanjutnya';                 // default
    if (nomorSoal === total) labelTombol = 'Lihat Hasil'; // di soal terakhir, ganti label

    // Tentukan apakah tombol Kembali di-disable
    let disableKembali = '';                         // default: aktif
    if (currentGejalaIndex === 0) disableKembali = 'disabled'; // soal pertama → Kembali di-disable

    // Hitung lebar progress bar dalam persen
    let persenProgress = Math.round((currentGejalaIndex / total) * 100);

    // Tulis HTML kartu pertanyaan ke dalam div#gejala-list
    // Penggabungan string dengan + seperti di C++: "teks" + variabel + "teks"
    gejalaContainer.innerHTML =
      '<div class="progress mb-3" style="height:6px;">' +
        '<div class="progress-bar bg-success" style="width:' + persenProgress + '%"></div>' +
      '</div>' +
      '<p class="text-muted mb-2" style="font-size:0.85rem;">Pertanyaan ' + nomorSoal + ' dari ' + total + '</p>' +
      '<div class="card p-3 text-center">' +
        '<img src="' + dataGejala.gambar + '" class="img-fluid mb-3 rounded" style="max-height:500px;">' +
        '<h5 class="mb-2">' + dataGejala.teks + '</h5>' +
        '<p class="text-muted">' + dataGejala.keterangan + '</p>' +
        '<div class="d-flex justify-content-center gap-4" style="font-size:1.1rem;">' +
          '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;margin-right:8px;">' +
            '<input type="checkbox" id="jawab-ya" ' + atributYa + ' onclick="toggleCheckbox(this,\'ya\')" style="width:18px;height:18px;"> Ya' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">' +
            '<input type="checkbox" id="jawab-tidak" ' + atributTidak + ' onclick="toggleCheckbox(this,\'tidak\')" style="width:18px;height:18px;"> Tidak' +
          '</label>' +
        '</div>' +
      '</div>' +
      '<div class="mt-3 d-flex justify-content-between">' +
        '<button type="button" class="btn btn-secondary" onclick="prevQuestion()" ' + disableKembali + '>Kembali</button>' +
        '<button type="button" class="btn btn-primary" onclick="nextQuestion()">' + labelTombol + '</button>' +
      '</div>';

  } else {
    prosesDiagnosis(); // semua soal sudah dijawab → jalankan diagnosis
  }
}


// ── FUNGSI 3: toggleCheckbox() ────────────────────────────────────────────────
// TUGAS: Memastikan hanya satu pilihan yang aktif (Ya ATAU Tidak, tidak keduanya).
// Dipanggil otomatis saat user mengklik checkbox.

function toggleCheckbox(clicked, tipe) {
  let ya    = document.getElementById('jawab-ya');    // elemen checkbox "Ya"
  let tidak = document.getElementById('jawab-tidak'); // elemen checkbox "Tidak"

  if (tipe === 'ya' && clicked.checked) {    // jika yang diklik "Ya" dan sekarang tercentang...
    tidak.checked = false;                   // paksa "Tidak" menjadi tidak tercentang
  }
  if (tipe === 'tidak' && clicked.checked) { // jika yang diklik "Tidak" dan sekarang tercentang...
    ya.checked = false;                      // paksa "Ya" menjadi tidak tercentang
  }
}


// ── FUNGSI 4: nextQuestion() ──────────────────────────────────────────────────
// TUGAS: Simpan jawaban user untuk soal ini, lalu maju ke soal berikutnya.
// Dipanggil saat tombol "Selanjutnya" / "Lihat Hasil" ditekan.

function nextQuestion() {
  let ya    = document.getElementById('jawab-ya');    // status checkbox "Ya"
  let tidak = document.getElementById('jawab-tidak'); // status checkbox "Tidak"

  // Validasi: user harus memilih salah satu sebelum lanjut
  if (ya.checked === false && tidak.checked === false) {
    alert('Silakan pilih jawaban Ya atau Tidak sebelum melanjutkan.');
    return; // hentikan fungsi di sini, jangan lanjut (seperti return; di C++)
  }

  let kode = gejalaKeys[currentGejalaIndex]; // kode gejala soal ini, contoh: "G01"

  // Hapus jawaban lama untuk soal ini (kalau user kembali dan ganti jawaban)
  // Buat array baru yang tidak berisi jawaban lama untuk soal ini
  let jawabanBersih = [];
  for (let i = 0; i < selectedGejala.length; i++) {           // loop semua jawaban tersimpan
    if (selectedGejala[i] !== kode && selectedGejala[i] !== '!' + kode) { // kalau bukan soal ini...
      jawabanBersih.push(selectedGejala[i]);                   // masukkan ke array baru
    }
  }
  selectedGejala = jawabanBersih; // ganti dengan array yang sudah bersih

  // Simpan jawaban baru
  if (ya.checked) {
    selectedGejala.push(kode);       // jawaban Ya → simpan "G01"
  } else {
    selectedGejala.push('!' + kode); // jawaban Tidak → simpan "!G01"
  }

  currentGejalaIndex++;  // maju ke soal berikutnya (seperti i++ di C++)
  tampilkanPertanyaan(); // render ulang tampilan dengan soal berikutnya
}


// ── FUNGSI 5: prevQuestion() ──────────────────────────────────────────────────
// TUGAS: Kembali ke soal sebelumnya tanpa menghapus jawaban yang sudah ada.
// Dipanggil saat tombol "Kembali" ditekan.

function prevQuestion() {
  if (currentGejalaIndex > 0) {    // pastikan bukan di soal pertama
    currentGejalaIndex--;          // mundur satu soal (seperti i-- di C++)
    tampilkanPertanyaan();         // render ulang soal sebelumnya
                                   // jawaban lama muncul kembali otomatis karena
                                   // masih tersimpan di selectedGejala
  }
}


// ── FUNGSI 6: prosesDiagnosis() ───────────────────────────────────────────────
// TUGAS: Kumpulkan fakta YA, jalankan Forward Chaining, tampilkan hasil.
// Dipanggil otomatis setelah soal terakhir dijawab.

function prosesDiagnosis() {

  // Langkah 1: Saring jawaban — ambil HANYA yang dijawab YA
  // Tandanya: tidak ada "!" di karakter pertama
  let faktaTerpilih = [];
  for (let i = 0; i < selectedGejala.length; i++) {   // loop semua jawaban
    if (selectedGejala[i][0] !== '!') {                // jika karakter pertama BUKAN "!"...
      faktaTerpilih.push(selectedGejala[i]);            // masukkan ke daftar fakta YA
    }
  }
  // Contoh hasil: faktaTerpilih = ["G01", "G06"]

  // Langkah 2: Jalankan algoritma Forward Chaining
  let hasilFC = forwardChaining(faktaTerpilih);
  // Contoh hasil: { "P01": ["R01"], "P04": ["R09"] } atau {} jika tidak ada yang cocok

  // Langkah 3: Susun array hasil yang siap untuk ditampilkan
  let hasilArray = []; // array kosong untuk penyakit yang terdiagnosis

  let daftarKode = Object.keys(knowledgeBase.penyakit); // ["P01","P02","P03","P04","P05"]
  for (let i = 0; i < daftarKode.length; i++) {
    let kode = daftarKode[i];                           // ambil kode penyakit, contoh: "P01"

    if (hasilFC[kode] !== undefined) {                  // hanya penyakit yang terdiagnosis
      hasilArray.push({
        nama         : knowledgeBase.penyakit[kode].nama,   // "Penyakit Layu Fusarium"
        jumlahAturan : hasilFC[kode].length,                // berapa aturan yang memicu penyakit ini
        link         : knowledgeBase.penyakit[kode].link    // URL halaman detail
      });
    }
  }

  // Langkah 4: Urutkan — penyakit dengan lebih banyak aturan terpenuhi tampil pertama
  // Menggunakan bubble sort agar mudah dipahami (seperti yang dipelajari di C++)
  for (let i = 0; i < hasilArray.length - 1; i++) {
    for (let j = 0; j < hasilArray.length - 1 - i; j++) {
      if (hasilArray[j].jumlahAturan < hasilArray[j + 1].jumlahAturan) { // jika urutan salah...
        let temp          = hasilArray[j];       // tukar posisi (swap)
        hasilArray[j]     = hasilArray[j + 1];
        hasilArray[j + 1] = temp;
      }
    }
  }

  // Langkah 5: Buat daftar HTML gejala yang dipilih
  let htmlGejala = '';
  if (faktaTerpilih.length === 0) {
    htmlGejala = '<li><em>Tidak ada gejala yang dipilih</em></li>'; // fallback jika kosong
  } else {
    for (let i = 0; i < faktaTerpilih.length; i++) {
      let kodeGejala = faktaTerpilih[i];                         // contoh: "G01"
      let teksGejala = knowledgeBase.gejala[kodeGejala].teks;   // contoh: "Tanaman layu siang hari"
      htmlGejala += '<li>' + teksGejala + '</li>';               // tambah baris daftar
    }
  }

  // Langkah 6: Tulis hasil ke halaman web
  let output = document.getElementById('hasil'); // elemen <div id="hasil"> di HTML

  // Tulis header
  output.innerHTML =
    '<h5 class="mt-3">Fakta yang dimasukkan:</h5>' +
    '<ul style="padding-left:20px;margin-top:8px;">' + htmlGejala + '</ul>' +
    '<h4 class="mt-4">Hasil Diagnosis (Forward Chaining):</h4>';

  // Tampilkan kartu hasil
  if (hasilArray.length === 0) {
    // Tidak ada penyakit yang terdiagnosis
    output.innerHTML +=
      '<div class="alert alert-warning mt-2">' +
        '<strong>Tidak terdiagnosis.</strong> Gejala yang dipilih tidak memenuhi kondisi ' +
        'aturan manapun dalam basis pengetahuan. Silakan ulangi dan periksa gejala lebih teliti.' +
      '</div>';

  } else {
    // Tampilkan setiap penyakit sebagai kartu
    for (let i = 0; i < hasilArray.length; i++) {
      let item = hasilArray[i]; // ambil satu data penyakit

      // Tentukan warna badge berdasarkan urutan
      let warnaBadge;
      if (i === 0)      { warnaBadge = 'badge-danger';    } // merah = utama
      else if (i === 1) { warnaBadge = 'badge-warning';   } // kuning = kedua
      else              { warnaBadge = 'badge-secondary';  } // abu = lainnya

      // Tentukan label badge
      let labelUrutan;
      if (i === 0) { labelUrutan = 'Diagnosis Utama';    }
      else         { labelUrutan = 'Kemungkinan ' + (i + 1); }

      // Tulis kartu hasil ke halaman
      output.innerHTML +=
        '<div class="card mb-3 p-3">' +
          '<div class="d-flex align-items-center justify-content-between mb-2">' +
            '<h5 class="mb-0">' + item.nama + '</h5>' +
            '<span class="badge ' + warnaBadge + '">' + labelUrutan + '</span>' +
          '</div>' +
          '<a href="' + item.link + '" class="btn btn-danger btn-sm mt-2" target="_blank">Lihat informasi</a>' +
        '</div>';
    }
  }

  // Langkah 7: Sembunyikan form pertanyaan
  document.getElementById('diagnosisForm').style.display = 'none'; // tidak perlu ditampilkan lagi
}