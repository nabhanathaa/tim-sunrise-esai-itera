// Asisten "Tanya" berbasis aturan: berjalan di perangkat (luring), menjawab dari data aplikasi.
// Tidak memakai model bahasa, jadi tidak mengarang angka; pertanyaan di luar cakupan diarahkan ke menu yang tepat.
import { APP } from '../config.js'
import { prakiraanTitik, kategori, siaga } from './cuaca.js'
import { fmt, fmtInt, nm, pct, compact } from './format.js'

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
const ada = (t, ...kata) => kata.some(k => t.includes(k))

let indeks = null
function cariKab(data, t) {
  if (!indeks) {
    indeks = []
    data.kab.forEach(k => {
      const n = norm(k.nama)
      indeks.push([k.jenis === 'Kota' ? `kota ${n}` : n, k.kode, k.jenis === 'Kota' ? 2 : 1])
      if (k.jenis === 'Kota') indeks.push([n, k.kode, 0])
      else indeks.push([`kabupaten ${n}`, k.kode, 3], [`kab ${n}`, k.kode, 3])
    })
    indeks.sort((a, b) => b[0].length - a[0].length || b[2] - a[2])
  }
  const tt = ` ${t} `
  const hit = indeks.find(([n]) => tt.includes(` ${n} `))
  return hit ? data.byKode[hit[1]] : null
}

export const SARAN_AWAL = ['Prioritas teratas', 'Hujan di wilayah saya', 'Kondisi Agam', 'Dari mana hulu Aceh Utara?', 'Cara melapor', 'Nomor darurat', 'Seberapa akurat modelnya?']

export async function jawab(teks, { data, profil }) {
  const t = norm(teks)
  const k = cariKab(data, t)
  const wil = profil.wilayah ? data.byKode[profil.wilayah] : null

  if (!t) return { teks: 'Tulis pertanyaan Anda.' }
  if (/^(halo|hai|hi|hallo|assalamualaikum|selamat (pagi|siang|sore|malam)|permisi)\b/.test(t) && t.split(' ').length <= 4)
    return { teks: `Halo, ${profil.nama.split(' ')[0]}. Saya asisten ${APP.nama}. Saya bisa menjelaskan risiko suatu kabupaten/kota, prakiraan hujan, prioritas pemulihan, asal tekanan hulu, dan cara melapor.`, saran: SARAN_AWAL }

  // Darurat lebih dulu
  if (ada(t, 'darurat', 'nomor', 'telepon', 'telpon', 'hubungi', 'tolong', 'sar', 'ambulans', 'bnpb', 'damkar'))
    return {
      teks: 'Bila ada ancaman jiwa, hubungi segera:',
      daftar: [['112', 'Panggilan darurat terpadu'], ['117', 'Pusdalops BNPB'], ['115', 'Basarnas (pencarian & pertolongan)'], ['119', 'Ambulans / PSC 119'], ['113', 'Pemadam kebakaran'], ['110', 'Polisi']].map(([a, b]) => ({ ikon: 'phone', l: b, v: a, tel: a })),
      aksi: [['Panduan evakuasi', 'panduan'], ['Lapor kejadian', 'lapor']]
    }

  if (ada(t, 'lapor', 'melapor', 'pelaporan', 'kirim laporan', 'foto', 'video'))
    return {
      teks: 'Cara melapor, kira-kira 1 menit:\n1. Tekan tombol kamera di tengah bawah.\n2. Ambil titik GPS (otomatis mendeteksi kab/kota).\n3. Ambil foto atau rekam video ±30 detik dari jarak aman.\n4. Pilih jenis, tingkat keparahan, dan kebutuhan mendesak.\n5. Kirim. Skor kepercayaan dihitung dari 6 cek, lalu petugas BPBD memverifikasi.',
      aksi: [['Mulai lapor', 'lapor'], ['Lihat laporan', 'laporan']]
    }

  if (ada(t, 'evakuasi', 'mengungsi', 'tas siaga', 'persiapan', 'apa yang harus', 'selamatkan', 'tanda'))
    return { teks: 'Tanda bahaya banjir bandang dan longsor: air sungai tiba-tiba keruh dan naik cepat, terdengar gemuruh dari hulu, muncul retakan tanah atau mata air baru di lereng, pohon atau tiang miring.\n\nBila muncul: segera menjauh dari bantaran dan kaki lereng menuju tempat tinggi, bawa tas siaga, jangan menyeberangi arus.', aksi: [['Daftar tas siaga', 'panduan'], ['Siaga hujan', 'siaga']] }

  // Hujan / cuaca
  if (ada(t, 'hujan', 'cuaca', 'prakiraan', 'ramalan', 'siaga', 'besok')) {
    const sasaran = k || wil
    if (!sasaran) return { teks: 'Untuk wilayah mana? Sebutkan nama kabupaten/kota, misalnya "hujan di Padang".', saran: ['Hujan di Kota Padang', 'Hujan di Aceh Utara'] }
    try {
      const d = await prakiraanTitik(sasaran.lat, sasaran.lon)
      const hr = (d.daily?.precipitation_sum || []).slice(1, 4)
      const mx = Math.max(0, ...hr)
      const v = data.kab.map(x => x.hulu_frak).sort((a, b) => a - b)
      const lv = siaga(mx, sasaran.hulu_frak >= v[Math.floor(v.length * 0.75)])
      return {
        teks: `Prakiraan ${nm(sasaran)} (Open-Meteo):\n• Hari ini ${fmt(hr[0], 0)} mm, besok ${fmt(hr[1], 0)} mm, lusa ${fmt(hr[2], 0)} mm.\n• Tertinggi ${fmt(mx, 0)} mm/hari (${kategori(mx).label.toLowerCase()} menurut kategori BMKG).\n• Tingkat siaga aplikasi: **${lv.label}**.\n\nIni indikasi dini, bukan peringatan resmi BMKG.`,
        aksi: [['Peta siaga', 'siaga'], ['Profil wilayah', `kab/${sasaran.kode}`]]
      }
    } catch {
      return { teks: 'Prakiraan belum bisa diambil karena perangkat luring atau layanan cuaca tidak terjangkau. Coba lagi saat ada sinyal.', aksi: [['Buka siaga', 'siaga']] }
    }
  }

  // Hulu
  if (ada(t, 'hulu', 'asal', 'dari mana', 'hutan', 'deforestasi', 'gundul')) {
    if (k) {
      const top = [[k.kode, k.lokal || 0], ...(k.hulu || [])].sort((a, b) => b[1] - a[1]).slice(0, 5)
      return {
        teks: `Tekanan hulu ${nm(k)}: ${pct(k.hulu_frak, 2)} DAS hulunya kehilangan hutan di lereng >15° pada 2015–2025 (urutan ${[...data.kab].sort((a, b) => b.hulu_frak - a.hulu_frak).findIndex(x => x.kode === k.kode) + 1} dari 154). Penyumbang terbesar (km²):`,
        daftar: top.map(([kd, v], i) => ({ n: i + 1, l: kd === k.kode ? `${nm(k)} (sendiri)` : nm(data.byKode[kd]), v: fmt(v, 1), ke: `kab/${kd}` })),
        aksi: [['Rantai hulu–hilir', `hulu/${k.kode}`]]
      }
    }
    const top = [...data.kab].sort((a, b) => b.hulu_frak - a.hulu_frak).slice(0, 5)
    return {
      teks: 'Lima wilayah dengan tekanan hulu tertinggi (persen DAS hulu yang kehilangan hutan lereng curam):',
      daftar: top.map((x, i) => ({ n: i + 1, l: nm(x), v: pct(x.hulu_frak, 2), ke: `hulu/${x.kode}` })),
      teks2: 'Wilayah di kuartil tertinggi rata-rata berdampak berat 0,315 per tahun, empat kali kuartil terendah (0,077).'
    }
  }

  // Prioritas
  if (ada(t, 'prioritas', 'peringkat', 'ranking', 'r3p', 'teratas', 'paling parah', 'pemulihan', 'rehabilitasi', 'topsis')) {
    if (ada(t, 'topsis', 'cara', 'bagaimana', 'rumus') && !k)
      return { teks: 'TOPSIS mengurutkan wilayah menurut jarak ke kondisi "paling perlu dipulihkan" dan "paling aman".\n\n1. Delapan kriteria dinormalisasi skor-z.\n2. Dikalikan bobot (versi esai 3,1,2,1,1,1,1,1).\n3. Skor = jarak ke anti-ideal ÷ (jarak ke ideal + jarak ke anti-ideal).\n\nKestabilan diuji dengan 1.000 bobot acak Dirichlet.', aksi: [['Coba atur bobot', 'prioritas'], ['Metode', 'metode']] }
    if (k) return { teks: `${nm(k)} berada di peringkat ${k.rank} dari 154 (skor ${fmt(k.prior, 3)}). Dari 1.000 simulasi bobot acak, peringkatnya ada di rentang ${fmt(k.rp5)}–${fmt(k.rp95)} (P5–P95).`, aksi: [['Prioritas R3P', 'prioritas'], ['Profil', `kab/${k.kode}`]] }
    const top = [...data.kab].sort((a, b) => a.rank - b.rank).slice(0, 5)
    return { teks: 'Lima prioritas pemulihan teratas (TOPSIS, bobot esai):', daftar: top.map(x => ({ n: x.rank, l: nm(x), v: fmt(x.prior, 3), ke: `kab/${x.kode}` })), aksi: [['Atur bobot sendiri', 'prioritas']] }
  }

  // Senyar
  if (ada(t, 'senyar', 'siklon', 'november 2025', 'desember 2025', 'bencana 2025', 'korban 2025', 'berapa korban')) {
    const ev = data.senyar
    const tot = ev.reduce((a, e) => a + e.m + e.hl, 0)
    const per = {}; ev.forEach(e => { per[e.k] = (per[e.k] || 0) + e.m + e.hl })
    const top = Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return {
      teks: `Siklon Tropis Senyar terbentuk di Selat Malaka (25 Nov 2025) dan mendarat di pesisir utara Sumatera pada 26 Nov. DIBI mencatat ${ev.length} kejadian banjir/longsor pada 20 Nov–6 Des dengan ${fmtInt(tot)} meninggal dan hilang. Terbanyak di:`,
      daftar: top.map(([kd, v], i) => ({ n: i + 1, l: nm(data.byKode[kd]), v: fmtInt(v), ke: `kab/${kd}` })),
      aksi: [['Putar ulang animasi', 'putar']]
    }
  }

  // Metode & model
  if (ada(t, 'akurat', 'akurasi', 'model', 'xgboost', 'auc', 'prediksi', 'valid'))
    return { teks: 'Model XGBoost dilatih pada data 2015–2024 dan diuji pada 2025:\n• ROC-AUC 0,71, AUC-PR 0,58.\n• Uji blok wilayah (wilayah belum pernah dilihat model): 0,57.\n\nArtinya model cukup membantu mengurutkan risiko, tetapi bukan alat prediksi kejadian. Karena itu aplikasi memakainya sebagai satu dari delapan kriteria prioritas.', aksi: [['Metode lengkap', 'metode']] }
  if (ada(t, 'shap', 'fitur penting', 'plasebo'))
    return { teks: 'Uji plasebo SHAP: fitur acak per kabupaten rata-rata berada di peringkat 21 dari 32. Hanya tiga fitur yang konsisten di atasnya: laju erosi RUSLE, hutan lereng curam tahun 2000, dan elevasi. Fitur lain belum bisa dibedakan dari kebetulan.', aksi: [['Metode', 'metode']] }
  if (ada(t, 'rusle', 'erosi'))
    return { teks: 'Erosi dihitung dengan RUSLE: A = R × K × LS × C × P per piksel 90 m.\n\nTemuan penting: RUSLE lokal lemah menjelaskan keparahan (ρ median 0,32), karena variasinya didominasi faktor tutupan C. Tekanan hulu lebih kuat (ρ 0,53).', aksi: [['Lapisan erosi di peta', 'peta'], ['Metode', 'metode']] }
  if (ada(t, 'data', 'sumber', 'satelit', 'sentinel', 'imerg', 'hansen'))
    return { teks: 'Sumber utama: DIBI BNPB (kejadian), BPS (penduduk, kemiskinan, IPM), CHIRPS dan GPM IMERG (hujan), Hansen GFC (hutan), Copernicus DEM dan MERIT Hydro (medan), HydroBASINS (sub-DAS), SoilGrids (tanah), MODIS NDVI, Sentinel-1 (genangan), OpenStreetMap (jalan). Prakiraan hujan langsung dari Open-Meteo.', aksi: [['Daftar lengkap', 'metode']] }

  // Profil wilayah
  if (k) {
    const v = [...data.kab].sort((a, b) => b.hulu_frak - a.hulu_frak).findIndex(x => x.kode === k.kode) + 1
    return {
      teks: `${nm(k)}, ${k.prov}:\n• Korban jiwa 2025: ${fmtInt(k.korban25)}; rumah rusak berat ${fmtInt(k.rrb25)}; terdampak ${compact(k.terdampak25)}.\n• Berdampak berat ${pct(k.freq, 0)} tahun pada 2015–2025.\n• Prioritas R3P: #${k.rank} dari 154.\n• Tekanan hulu: ${pct(k.hulu_frak, 2)} (urutan ${v}).\n• Penduduk ${compact(k.penduduk)}, kemiskinan ${fmt(k.p0, 1)}%.`,
      aksi: [['Profil lengkap', `kab/${k.kode}`], ['Hujan di sini', null, `hujan di ${nm(k)}`], ['Rantai hulu', `hulu/${k.kode}`]]
    }
  }

  if (ada(t, 'aplikasi', 'fitur', 'bisa apa', 'bantu', 'menu'))
    return { teks: `${APP.nama} punya: peta risiko 154 kab/kota (5 lapisan), siaga hujan 3 hari, lapor kejadian bergeotag dengan foto/video, antrean verifikasi BPBD, putar ulang Senyar 2025, prioritas R3P dengan bobot yang bisa diubah, rantai hulu–hilir, serta panduan dan kontak darurat.`, saran: SARAN_AWAL }

  return { teks: 'Maaf, saya belum memahami pertanyaan itu. Saya menjawab dari data aplikasi, jadi coba sebut nama kabupaten/kota atau salah satu topik berikut.', saran: SARAN_AWAL }
}
