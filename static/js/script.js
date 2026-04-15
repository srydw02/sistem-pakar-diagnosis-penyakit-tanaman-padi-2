let knowledgeBase = {};
let currentGejalaIndex = 0;
let selectedGejala = [];
let gejalaKeys = [];

// 1. INI BAGIAN FETCH-NYA (Sudah pakai ../ biar foldernya kebaca)
fetch('../data/data.json')
  .then(response => response.json())
  .then(data => {
    knowledgeBase = data;
    gejalaKeys = Object.keys(knowledgeBase.gejala);
    tampilkanPertanyaan();
  })
  .catch(error => {
    console.error("Gagal memuat data.json:", error);
    alert("Data JSON tidak ditemukan! Cek console F12.");
  });

function tampilkanPertanyaan() {
  const gejalaContainer = document.getElementById('gejala-list');
  gejalaContainer.innerHTML = '';

  if (currentGejalaIndex < gejalaKeys.length) {
    const kode = gejalaKeys[currentGejalaIndex];
    const dataGejala = knowledgeBase.gejala[kode];

    const prevJawaban = selectedGejala.includes(kode) ? true : false;
    const prevTidak = !prevJawaban && selectedGejala.includes("!" + kode);

    gejalaContainer.innerHTML = `
      <div class="card p-3 text-center">
        <img src="${dataGejala.gambar}" alt="Gambar Gejala" class="img-fluid mb-3 rounded" style="max-height: 500px;">
        <h5 class="mb-2">${dataGejala.teks}</h5>
        <p class="text-muted">${dataGejala.keterangan}</p>
        <div class="d-flex justify-content-center gap-4" style="font-size: 1.1rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-right: 8px;">
            <input type="checkbox" id="jawab-ya" ${prevJawaban ? 'checked' : ''} onclick="toggleCheckbox(this, 'ya')" style="width: 18px; height: 18px;">
            Ya
          </label>
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="jawab-tidak" ${prevTidak ? 'checked' : ''} onclick="toggleCheckbox(this, 'tidak')" style="width: 18px; height: 18px;">
            Tidak
          </label>
        </div>
      </div>
      <div class="mt-3 d-flex justify-content-between">
        <button class="btn btn-secondary" onclick="prevQuestion()" ${currentGejalaIndex === 0 ? 'disabled' : ''}>Kembali</button>
        <button class="btn btn-primary" onclick="nextQuestion()">Next</button>
      </div>
    `;
  } else {
    prosesDiagnosa();
  }
}

function toggleCheckbox(clickedCheckbox, tipe) {
  const yaCheckbox = document.getElementById('jawab-ya');
  const tidakCheckbox = document.getElementById('jawab-tidak');

  if (tipe === 'ya' && clickedCheckbox.checked) {
    tidakCheckbox.checked = false;
  } else if (tipe === 'tidak' && clickedCheckbox.checked) {
    yaCheckbox.checked = false;
  }
}

function nextQuestion() {
  const yaCheckbox = document.getElementById('jawab-ya');
  const tidakCheckbox = document.getElementById('jawab-tidak');

  if (!yaCheckbox.checked && !tidakCheckbox.checked) {
    alert('Silakan pilih jawaban Ya atau Tidak sebelum melanjutkan.');
    return;
  }

  const kode = gejalaKeys[currentGejalaIndex];
  selectedGejala = selectedGejala.filter(g => g !== kode && g !== ("!" + kode));

  if (yaCheckbox.checked) {
    selectedGejala.push(kode);
  } else if (tidakCheckbox.checked) {
    selectedGejala.push("!" + kode);
  }

  currentGejalaIndex++;
  tampilkanPertanyaan();
}

function prevQuestion() {
  if (currentGejalaIndex > 0) {
    currentGejalaIndex--;
    tampilkanPertanyaan();
  }
}

// =========================================================
// 2. FUNGSI INI YANG DIROMBAK MENJADI FORWARD CHAINING (IF-ELSE)
// =========================================================
function prosesDiagnosa() {
  const nama = document.getElementById("nama").value.trim();
  if (!nama) {
    alert("Silakan masukkan nama terlebih dahulu.");
    currentGejalaIndex = 0;
    selectedGejala = [];
    tampilkanPertanyaan();
    return;
  }

  // Menyaring array, kita cuma butuh gejala yang dijawab "Ya"
  const gejalaDipilih = selectedGejala.filter(g => !g.startsWith('!'));

  // FUNGSI PEMBANTU (HELPER)
  function has(kode) {
    return gejalaDipilih.includes(kode);
  }

  // Siapkan variabel kosong untuk menampung hasil
  let hasilPenyakit = null;

  // ---------------------------------------------------------
  // AREA FORWARD CHAINING (RULE-BASED)
  // ---------------------------------------------------------
  // Rule 1: Jika gejalanya G01, G02, G04, dan G07 -> Penyakit Layu Fusarium (P01)
  if (has('G01') && has('G02') && has('G04') && has('G07')) {
    hasilPenyakit = knowledgeBase.penyakit["P01"];
  } 
  // Rule 2: Jika gejalanya G08, G09, dan G10 -> Penyakit Busuk Buah (P02)
  else if (has('G08') && has('G09') && has('G10')) {
    hasilPenyakit = knowledgeBase.penyakit["P02"];
  }
  // Rule 3: Jika gejalanya G05, G06, dan G07 -> Penyakit Virus Kuning (P03)
  else if (has('G05') && has('G06') && has('G07')) {
    hasilPenyakit = knowledgeBase.penyakit["P03"];
  }
  // Rule 4: Jika gejalanya G01, G07, tapi TIDAK ADA G02 -> Layu Bakteri (P04)
  else if (has('G01') && has('G07') && !has('G02')) {
    hasilPenyakit = knowledgeBase.penyakit["P04"];
  }
  // Rule 5: Jika gejalanya G05, G09, dan G10 -> Rebah Semai (P05)
  else if (has('G05') && has('G09') && has('G10')) {
    hasilPenyakit = knowledgeBase.penyakit["P05"];
  }

  // ---------------------------------------------------------
  // RENDER HASIL KE HTML
  // ---------------------------------------------------------
  const output = document.getElementById("hasil");
  
  // Tampilkan sapaan dan daftar gejala yang dipilih
  let htmlContent = `
    <h3>Hai, ${nama}!</h3>
    <h5>Gejala yang kamu pilih:</h5>
    <ul style="padding-left: 20px; margin-top: 10px;">
      ${gejalaDipilih.map(kode => `<li>${knowledgeBase.gejala[kode].teks}</li>`).join('')}
    </ul>
    <h4>Hasil Diagnosis Cabai (Forward Chaining):</h4>
  `;

// Tampilkan hasil penyakitnya
  if (hasilPenyakit !== null) {
    htmlContent += `
      <div class="card mb-2 p-3 border-success">
        <h5 class="text-success">${hasilPenyakit.nama}</h5>
        <p>Berdasarkan kecocokan aturan sistem pakar, tanaman cabai terindikasi penyakit ini.</p>
        <a href="${hasilPenyakit.link}" class="btn btn-danger btn-sm" target="_blank">Lihat informasi penanganan</a>
      </div>
      <button class="btn btn-success mt-3 w-100" onclick="unduhPDF()">📥 Download Hasil Diagnosis (PDF)</button>
    `;
  } else {
    htmlContent += `
      <div class="card mb-2 p-3 border-secondary">
        <h5 class="text-secondary">Penyakit Tidak Dikenali</h5>
        <p>Gejala yang dipilih tidak memenuhi aturan spesifik penyakit cabai manapun di sistem kami. Coba periksa kembali kondisi tanaman.</p>
      </div>
      <button class="btn btn-success mt-3 w-100" onclick="unduhPDF()">📥 Download Hasil Diagnosis (PDF)</button>
    `;
  }

  output.innerHTML = htmlContent;
  document.getElementById("diagnosaForm").style.display = "none";
}

// =========================================================
// FITUR TAMBAHAN: CETAK HASIL KE PDF (FIX FINAL)
// =========================================================
function unduhPDF() {
  const elemen = document.getElementById("hasil");
  
  // Sembunyikan sementara tombol download
  const tombolDownload = elemen.querySelector("button");
  if (tombolDownload) tombolDownload.style.display = "none";

  const opsi = {
    margin:       0.5, // Balikin ke margin wajar
    filename:     'Hasil_Diagnosis_Cabai.pdf',
    image:        { type: 'jpeg', quality: 1.0 },
    // KUNCI UTAMA: scrollY: 0 bikin screenshot-nya nggak peduli lu lagi scroll di mana
    html2canvas:  { scale: 2, scrollY: 0 }, 
    // Paksa semua elemen biar nggak kepisah beda halaman
    pagebreak:    { mode: 'avoid-all' }, 
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opsi).from(elemen).save().then(() => {
    // Munculkan kembali tombol download
    if (tombolDownload) tombolDownload.style.display = "block";
  });
}