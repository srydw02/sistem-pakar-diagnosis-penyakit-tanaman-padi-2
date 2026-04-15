let knowledgeBase = {};
let currentGejalaIndex = 0;
let selectedGejala = [];
let gejalaKeys = [];

fetch('/data/data.json')
  .then(response => response.json())
  .then(data => {
    knowledgeBase = data;
    gejalaKeys = Object.keys(knowledgeBase.gejala);
    tampilkanPertanyaan();
  });

// ─── MESIN INFERENSI FORWARD CHAINING ───────────────────────────────────────

/**
 * Menjalankan forward chaining berdasarkan fakta (gejala) yang dipilih.
 *
 * Langkah:
 *  1. Masukkan semua gejala terpilih ke Working Memory.
 *  2. Iterasi seluruh aturan (rule base).
 *  3. Jika SEMUA kondisi aturan ada di Working Memory → aturan dinyatakan TERPENUHI.
 *  4. Kombinasikan Certainty Factor (CF) jika beberapa aturan menuju penyakit yang sama.
 *     Rumus: CF_baru = CF_lama + CF_aturan × (1 − CF_lama)
 *  5. Kembalikan hasil berupa map { kode_penyakit → { cf, aturanFired[] } }.
 */
function forwardChaining(faktaTerpilih) {
  const workingMemory = new Set(faktaTerpilih);
  const hasil = {};

  for (const aturan of knowledgeBase.aturan) {
    const kondisiTerpenuhi = aturan.kondisi.every(g => workingMemory.has(g));

    if (kondisiTerpenuhi) {
      const kode = aturan.kesimpulan;

      if (!hasil[kode]) {
        hasil[kode] = { cf: 0, aturanFired: [] };
      }

      const cfLama = hasil[kode].cf;
      hasil[kode].cf = cfLama + aturan.cf * (1 - cfLama);
      hasil[kode].aturanFired.push(aturan.id);
    }
  }

  return hasil;
}

// ─── TAMPILAN PERTANYAAN ─────────────────────────────────────────────────────

function tampilkanPertanyaan() {
  const gejalaContainer = document.getElementById('gejala-list');
  gejalaContainer.innerHTML = '';

  if (currentGejalaIndex < gejalaKeys.length) {
    const kode = gejalaKeys[currentGejalaIndex];
    const dataGejala = knowledgeBase.gejala[kode];
    const nomorSoal = currentGejalaIndex + 1;
    const total = gejalaKeys.length;

    const prevYa = selectedGejala.includes(kode);
    const prevTidak = selectedGejala.includes('!' + kode);

    gejalaContainer.innerHTML = `
      <div class="progress mb-3" style="height: 6px;">
        <div class="progress-bar bg-success" role="progressbar"
          style="width: ${Math.round((currentGejalaIndex / total) * 100)}%"></div>
      </div>
      <p class="text-muted mb-2" style="font-size:0.85rem;">
        Pertanyaan ${nomorSoal} dari ${total}
      </p>
      <div class="card p-3 text-center">
        <img src="${dataGejala.gambar}" alt="Gambar Gejala"
          class="img-fluid mb-3 rounded" style="max-height: 500px;">
        <h5 class="mb-2">${dataGejala.teks}</h5>
        <p class="text-muted">${dataGejala.keterangan}</p>
        <div class="d-flex justify-content-center gap-4" style="font-size: 1.1rem;">
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;margin-right:8px;">
            <input type="checkbox" id="jawab-ya"
              ${prevYa ? 'checked' : ''}
              onclick="toggleCheckbox(this,'ya')"
              style="width:18px;height:18px;">
            Ya
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
            <input type="checkbox" id="jawab-tidak"
              ${prevTidak ? 'checked' : ''}
              onclick="toggleCheckbox(this,'tidak')"
              style="width:18px;height:18px;">
            Tidak
          </label>
        </div>
      </div>
      <div class="mt-3 d-flex justify-content-between">
        <button class="btn btn-secondary"
          onclick="prevQuestion()"
          ${currentGejalaIndex === 0 ? 'disabled' : ''}>Kembali</button>
        <button class="btn btn-primary" onclick="nextQuestion()">
          ${nomorSoal === total ? 'Lihat Hasil' : 'Selanjutnya'}
        </button>
      </div>
    `;
  } else {
    prosesDiagnosa();
  }
}

function toggleCheckbox(clicked, tipe) {
  const ya = document.getElementById('jawab-ya');
  const tidak = document.getElementById('jawab-tidak');
  if (tipe === 'ya' && clicked.checked) tidak.checked = false;
  else if (tipe === 'tidak' && clicked.checked) ya.checked = false;
}

function nextQuestion() {
  const ya = document.getElementById('jawab-ya');
  const tidak = document.getElementById('jawab-tidak');

  if (!ya.checked && !tidak.checked) {
    alert('Silakan pilih jawaban Ya atau Tidak sebelum melanjutkan.');
    return;
  }

  const kode = gejalaKeys[currentGejalaIndex];
  selectedGejala = selectedGejala.filter(g => g !== kode && g !== ('!' + kode));

  if (ya.checked) selectedGejala.push(kode);
  else selectedGejala.push('!' + kode);

  currentGejalaIndex++;
  tampilkanPertanyaan();
}

function prevQuestion() {
  if (currentGejalaIndex > 0) {
    currentGejalaIndex--;
    tampilkanPertanyaan();
  }
}

// ─── PROSES DIAGNOSA ─────────────────────────────────────────────────────────

function prosesDiagnosa() {
  const nama = document.getElementById('nama').value.trim();
  if (!nama) {
    alert('Silakan masukkan nama terlebih dahulu.');
    currentGejalaIndex = 0;
    selectedGejala = [];
    tampilkanPertanyaan();
    return;
  }

  const faktaTerpilih = selectedGejala.filter(g => !g.startsWith('!'));
  const hasilFC = forwardChaining(faktaTerpilih);

  // Susun hasil hanya untuk penyakit yang minimal 1 aturannya terpenuhi
  const hasilArray = Object.keys(knowledgeBase.penyakit)
    .filter(kode => hasilFC[kode])
    .map(kode => ({
      kode,
      nama: knowledgeBase.penyakit[kode].nama,
      cf: hasilFC[kode].cf,
      aturanFired: hasilFC[kode].aturanFired,
      link: knowledgeBase.penyakit[kode].link
    }))
    .sort((a, b) => b.cf - a.cf);

  const output = document.getElementById('hasil');

  // Tampilkan fakta yang dimasukkan
  const labelGejala = faktaTerpilih.length > 0
    ? faktaTerpilih.map(k => `<li>${knowledgeBase.gejala[k].teks}</li>`).join('')
    : '<li><em>Tidak ada gejala yang dipilih</em></li>';

  output.innerHTML = `
    <h3>Hai, ${nama}!</h3>
    <h5 class="mt-3">Fakta yang dimasukkan:</h5>
    <ul style="padding-left:20px;margin-top:8px;">${labelGejala}</ul>
    <h4 class="mt-4">Hasil Diagnosa (Forward Chaining):</h4>
  `;

  if (hasilArray.length === 0) {
    output.innerHTML += `
      <div class="alert alert-warning mt-2">
        <strong>Tidak terdiagnosa.</strong> Gejala yang dipilih tidak memenuhi kondisi
        aturan manapun dalam basis pengetahuan. Silakan ulangi dan periksa gejala lebih teliti.
      </div>`;
  } else {
    hasilArray.forEach((item, index) => {
      const cfPersen = (item.cf * 100).toFixed(2);
      const labelAturan = item.aturanFired.join(', ');

      // Warna badge berdasarkan urutan
      const badgeKelas = index === 0 ? 'badge-danger' : index === 1 ? 'badge-warning' : 'badge-secondary';
      const labelUrutan = index === 0 ? 'Diagnosa Utama' : `Kemungkinan ${index + 1}`;

      output.innerHTML += `
        <div class="card mb-3 p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h5 class="mb-0">${item.nama}</h5>
            <span class="badge ${badgeKelas}">${labelUrutan}</span>
          </div>
          <div class="mb-2">
            <small class="text-muted">Aturan yang terpenuhi:</small>
            <span class="ml-1" style="font-family:monospace;font-size:0.85rem;">${labelAturan}</span>
          </div>
          <div class="mb-2">
            <small class="text-muted">Tingkat Keyakinan (CF):</small>
            <strong class="ml-1">${cfPersen}%</strong>
          </div>
          <div class="progress mb-3" style="height:8px;">
            <div class="progress-bar ${index === 0 ? 'bg-danger' : 'bg-warning'}"
              role="progressbar" style="width:${cfPersen}%"></div>
          </div>
          <a href="${item.link}" class="btn btn-danger btn-sm" target="_blank">Lihat informasi</a>
        </div>
      `;
    });
  }

  document.getElementById('diagnosaForm').style.display = 'none';
}