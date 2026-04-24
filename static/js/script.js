let knowledgeBase = {};
let currentGejalaIndex = 0;
let selectedGejala = [];
let gejalaKeys = [];

fetch('/data/data.json')
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    knowledgeBase = data;
    gejalaKeys = Object.keys(data.gejala);
    tampilkanPertanyaan();
  });

function forwardChaining(faktaTerpilih) {
  let workingMemory = new Set(faktaTerpilih);
  let hasil = {};

  for (let i = 0; i < knowledgeBase.aturan.length; i++) {
    let aturan = knowledgeBase.aturan[i];
    let semuaTerpenuhi = true;

    for (let j = 0; j < aturan.kondisi.length; j++) {
      let syarat = aturan.kondisi[j];
      if (!workingMemory.has(syarat)) {
        semuaTerpenuhi = false;
        break;
      }
    }

    if (semuaTerpenuhi) {
      let kodePenyakit = aturan.kesimpulan;
      if (hasil[kodePenyakit] === undefined) {
        hasil[kodePenyakit] = [];
      }
      hasil[kodePenyakit].push(aturan.id);
    }
  }

  return hasil;
}

function tampilkanPertanyaan() {
  let gejalaContainer = document.getElementById('gejala-list');
  gejalaContainer.innerHTML = '';

  if (currentGejalaIndex < gejalaKeys.length) {
    let kode       = gejalaKeys[currentGejalaIndex];
    let dataGejala = knowledgeBase.gejala[kode];
    let nomorSoal  = currentGejalaIndex + 1;
    let total      = gejalaKeys.length;

    let sudahJawabYa    = selectedGejala.includes(kode);
    let sudahJawabTidak = selectedGejala.includes('!' + kode);

    let atributYa    = '';
    let atributTidak = '';
    if (sudahJawabYa)    atributYa    = 'checked';
    if (sudahJawabTidak) atributTidak = 'checked';

    let labelTombol = 'Selanjutnya';
    if (nomorSoal === total) labelTombol = 'Lihat Hasil';

    let disableKembali = '';
    if (currentGejalaIndex === 0) disableKembali = 'disabled';

    let persenProgress = Math.round((currentGejalaIndex / total) * 100);

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
    prosesDiagnosis();
  }
}

function toggleCheckbox(clicked, tipe) {
  let ya    = document.getElementById('jawab-ya');
  let tidak = document.getElementById('jawab-tidak');

  if (tipe === 'ya' && clicked.checked) {
    tidak.checked = false;
  }
  if (tipe === 'tidak' && clicked.checked) {
    ya.checked = false;
  }
}

function nextQuestion() {
  let ya    = document.getElementById('jawab-ya');
  let tidak = document.getElementById('jawab-tidak');

  if (ya.checked === false && tidak.checked === false) {
    alert('Silakan pilih jawaban Ya atau Tidak sebelum melanjutkan!');
    return;
  }

  let kode = gejalaKeys[currentGejalaIndex];
  let jawabanBersih = [];
  
  for (let i = 0; i < selectedGejala.length; i++) {
    if (selectedGejala[i] !== kode && selectedGejala[i] !== '!' + kode) {
      jawabanBersih.push(selectedGejala[i]);
    }
  }
  selectedGejala = jawabanBersih;

  if (ya.checked) {
    selectedGejala.push(kode);
  } else {
    selectedGejala.push('!' + kode);
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

function prosesDiagnosis() {
  let faktaTerpilih = [];
  for (let i = 0; i < selectedGejala.length; i++) {
    if (selectedGejala[i][0] !== '!') {
      faktaTerpilih.push(selectedGejala[i]);
    }
  }

  let hasilFC = forwardChaining(faktaTerpilih);
  let hasilArray = [];

  let daftarKode = Object.keys(knowledgeBase.penyakit);
  for (let i = 0; i < daftarKode.length; i++) {
    let kode = daftarKode[i];

    if (hasilFC[kode] !== undefined) {
      hasilArray.push({
        nama         : knowledgeBase.penyakit[kode].nama,
        jumlahAturan : hasilFC[kode].length,
        link         : knowledgeBase.penyakit[kode].link
      });
    }
  }

  for (let i = 0; i < hasilArray.length - 1; i++) {
    for (let j = 0; j < hasilArray.length - 1 - i; j++) {
      if (hasilArray[j].jumlahAturan < hasilArray[j + 1].jumlahAturan) {
        let temp          = hasilArray[j];
        hasilArray[j]     = hasilArray[j + 1];
        hasilArray[j + 1] = temp;
      }
    }
  }

  let htmlGejala = '';
  if (faktaTerpilih.length === 0) {
    htmlGejala = '<li><em>Tidak ada gejala yang dipilih</em></li>';
  } else {
    for (let i = 0; i < faktaTerpilih.length; i++) {
      let kodeGejala = faktaTerpilih[i];
      let teksGejala = knowledgeBase.gejala[kodeGejala].teks;
      htmlGejala += '<li>' + teksGejala + '</li>';
    }
  }

  let output = document.getElementById('hasil');

  output.innerHTML =
    '<h5 class="mt-3">Fakta yang dimasukkan:</h5>' +
    '<ul style="padding-left:20px;margin-top:8px;">' + htmlGejala + '</ul>' +
    '<h4 class="mt-4">Hasil Diagnosis (Forward Chaining):</h4>';

  if (hasilArray.length === 0) {
    output.innerHTML +=
      '<div class="alert alert-warning mt-2">' +
        '<strong>Tidak terdiagnosis.</strong> Gejala yang dipilih tidak memenuhi kondisi ' +
        'aturan manapun dalam basis pengetahuan. Silakan ulangi dan periksa gejala lebih teliti.' +
      '</div>';
  } else {
    for (let i = 0; i < hasilArray.length; i++) {
      let item = hasilArray[i];
      let warnaBadge;
      
      if (i === 0)      { warnaBadge = 'badge-danger';  }
      else if (i === 1) { warnaBadge = 'badge-warning'; }
      else              { warnaBadge = 'badge-secondary'; }

      let labelUrutan;
      if (i === 0) { labelUrutan = 'Diagnosis Utama';  }
      else         { labelUrutan = 'Kemungkinan ' + (i + 1); }

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

  document.getElementById('diagnosisForm').style.display = 'none';
}