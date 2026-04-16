let dataKB = {}, gejalaList = [], currentIndex = 0, jawaban = {};

// ─── 1. AMBIL DATA DARI JSON ────────────────────────────────────────────────
fetch('/data/data.json')
  .then(res => res.json())
  .then(data => {
    dataKB = data;
    gejalaList = Object.keys(data.gejala);
    renderPertanyaan();
  });

// ─── 2. MESIN INFERENSI (FORWARD CHAINING) ──────────────────────────────────
const forwardChaining = (fakta) => {
  const hasil = {};
  dataKB.aturan.forEach(({ id, kondisi, kesimpulan }) => {
    // Jika semua kondisi dalam aturan ada di daftar fakta gejala user
    if (kondisi.every(g => fakta.includes(g))) {
      hasil[kesimpulan] = hasil[kesimpulan] || [];
      hasil[kesimpulan].push(id); // Simpan ID aturan yang memicu penyakit
    }
  });
  return hasil;
};

// ─── 3. TAMPILAN & NAVIGASI ─────────────────────────────────────────────────
const renderPertanyaan = () => {
  // Jika soal habis, langsung tampilkan hasil
  if (currentIndex >= gejalaList.length) return prosesDiagnosis();

  const kode = gejalaList[currentIndex];
  const gejala = dataKB.gejala[kode];
  const progress = Math.round((currentIndex / gejalaList.length) * 100);

  document.getElementById('gejala-list').innerHTML = `
    <div class="progress mb-3" style="height: 6px;">
      <div class="progress-bar bg-success" style="width: ${progress}%"></div>
    </div>
    <p class="text-muted mb-2 small">Pertanyaan ${currentIndex + 1} dari ${gejalaList.length}</p>
    
    <div class="card p-3 text-center mb-4 shadow-sm">
      <img src="${gejala.gambar}" alt="Gejala" class="img-fluid mb-3 rounded mx-auto" style="max-height: 250px; object-fit: cover;">
      <h5 class="mb-2">${gejala.teks}</h5>
      <p class="text-muted small mb-0">${gejala.keterangan}</p>
    </div>

    <div class="d-flex justify-content-between">
      <button type="button" class="btn btn-secondary" onclick="navigasi(-1)" ${currentIndex === 0 ? 'disabled' : ''}>Kembali</button>
      <div>
        <button type="button" class="btn btn-outline-danger px-4 mr-2" onclick="jawab('${kode}', false)">Tidak</button>
        <button type="button" class="btn btn-primary px-4" onclick="jawab('${kode}', true)">Ya</button>
      </div>
    </div>
  `;
};

const navigasi = (arah) => {
  currentIndex += arah;
  renderPertanyaan();
};

const jawab = (kode, val) => {
  jawaban[kode] = val; // Simpan nilai true/false
  navigasi(1);         // Lanjut ke soal berikutnya otomatis
};

// ─── 4. PROSES HASIL DIAGNOSIS ──────────────────────────────────────────────
const prosesDiagnosis = () => {
  document.getElementById('diagnosisForm').style.display = 'none';
  const output = document.getElementById('hasil');
  
  // Ambil kode gejala yang nilainya true (dijawab "Ya")
  const fakta = Object.keys(jawaban).filter(k => jawaban[k]); 
  const hasilFC = forwardChaining(fakta);
  
  // Format hasil dan urutkan dari probabilitas/aturan terbanyak
  const hasilArray = Object.entries(hasilFC)
    .map(([kode, aturan]) => ({ ...dataKB.penyakit[kode], aturan }))
    .sort((a, b) => b.aturan.length - a.aturan.length);

  const listFakta = fakta.length 
    ? fakta.map(k => `<li>${dataKB.gejala[k].teks}</li>`).join('') 
    : '<li><em>Tidak ada gejala yang dipilih</em></li>';

  let htmlPenyakit = '<div class="alert alert-warning">Tidak ada penyakit yang cocok dengan gejala Anda.</div>';
  
  if (hasilArray.length > 0) {
    htmlPenyakit = hasilArray.map((p, i) => `
      <div class="card mb-3 p-3 border-${i === 0 ? 'danger' : 'light'} shadow-sm">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0">${p.nama}</h5>
          <span class="badge ${i === 0 ? 'badge-danger' : 'badge-secondary'}">${i === 0 ? 'Diagnosis Utama' : 'Kemungkinan Lain'}</span>
        </div>
        <small class="text-muted mb-3 d-block">Aturan Terpenuhi: <b>${p.aturan.join(', ')}</b></small>
        <a href="${p.link}" class="btn btn-sm btn-outline-danger" target="_blank">Lihat Detail Penyakit</a>
      </div>
    `).join('');
  }

  output.innerHTML = `
    <h3 class="mb-4">Hasil Diagnosis</h3>
    <h5>Gejala yang dialami:</h5>
    <ul class="mb-4 text-muted">${listFakta}</ul>
    <h5>Detail Penyakit:</h5>
    ${htmlPenyakit}
    <button type="button" class="btn btn-secondary mt-3 btn-block" onclick="location.reload()">Ulangi Diagnosis</button>
  `;
};