import { Kepala, Label, Masuk as Muncul } from '../components/ui.jsx'

const SUMBER = [
  ['Kejadian dan dampak', 'DIBI BNPB', 'kab/kota', '2015–2025'],
  ['Penduduk, kemiskinan, IPM', 'BPS', 'kab/kota', '2015–2025'],
  ['Hujan harian', 'CHIRPS', '~5,5 km', '2015–2025'],
  ['Hujan kejadian', 'GPM IMERG V07', '~10 km, 30 mnt', 'Nov–Des 2025'],
  ['Kehilangan hutan', 'Hansen GFC v1.13', '30 m', '2000–2025'],
  ['Elevasi dan lereng', 'Copernicus DEM', '30 m', 'statis'],
  ['Aliran dan LS', 'MERIT Hydro', '90 m', 'statis'],
  ['Sub-DAS', 'HydroBASINS lv 8', '693 poligon', 'statis'],
  ['Tanah (K)', 'SoilGrids 2.0', '250 m', 'statis'],
  ['Vegetasi (C)', 'MODIS MOD13Q1', '250 m', '2015–2025'],
  ['Genangan', 'Sentinel-1 VH', '10 m', 'Sep–Des 2025'],
  ['Jalan', 'OpenStreetMap', 'vektor', '2026'],
  ['Prakiraan hujan', 'Open-Meteo', '~9–25 km', 'langsung']
]

export default function Metode() {
  return (
    <div className="halaman">
      <Kepala judul="Metode & data" sub="Bagaimana setiap angka dihitung" />
      <div className="tumpuk">
        <Muncul>
          <div className="kartu">
            <div className="kartu-j"><h3>Label angka</h3></div>
            <div style={{ display: 'grid', gap: 8 }} className="kecil">
              <div><Label jenis="resmi" /> dicatat lembaga (BNPB, BPS) atau diukur satelit.</div>
              <div><Label jenis="model" /> dihitung dari analisis tim (RUSLE, XGBoost, TOPSIS).</div>
              <div><Label jenis="langsung" /> diambil saat aplikasi dibuka (Open-Meteo).</div>
              <div><Label jenis="contoh" /> dibuat untuk demo alur, bisa dihapus.</div>
            </div>
          </div>
        </Muncul>
        <Muncul i={1}>
          <div className="kartu">
            <div className="kartu-j"><h3>1. Erosi permukaan (RUSLE)</h3></div>
            <div className="rumus"><em>A</em> = R × K × LS × C × P{'\n'}R  = Renard–Freimund (P ≤ 850: 0,0483·P^1,61){'\n'}K  = EPIC × 0,1317 (SoilGrids){'\n'}LS = Moore–Burch, panjang lereng ≤ 300 m{'\n'}C  = exp(−2·NDVI / (1 − NDVI)){'\n'}P  = 1</div>
            <p className="kecil muted" style={{ marginTop: 8 }}>Dihitung per piksel 90 m, diringkas median per kab/kota. Temuan: korelasi lokal dengan keparahan lemah (ρ median 0,32) karena variasinya didominasi tutupan C.</p>
          </div>
        </Muncul>
        <Muncul i={2}>
          <div className="kartu">
            <div className="kartu-j"><h3>2. Tekanan hulu</h3></div>
            <div className="rumus">hulu(s) = Σ hilang_curam(u) / Σ luas(u){'\n'}  untuk u ∈ hulu(s) ∪ {'{'}s{'}'} via NEXT_DOWN{'\n'}<em>tekanan_kab</em> = Σ hulu(s)·irisan(s,kab) / luas_kab</div>
            <p className="kecil muted" style={{ marginTop: 8 }}>Hutan lereng &gt;15° yang hilang 2015–2025 (Hansen) dijumlahkan dari setiap sub-DAS ke semua sub-DAS hilirnya. ρ 0,53 dengan frekuensi kejadian berat (setara indikator lereng) dan 0,38 dengan rumah rusak berat 2025.</p>
          </div>
        </Muncul>
        <Muncul i={3}>
          <div className="kartu">
            <div className="kartu-j"><h3>3. Model peluang dampak berat</h3></div>
            <p className="teks">Target: tahun dengan korban ≥ 1 atau rumah rusak berat ≥ 13 (P75 data latih). XGBoost dilatih 2015–2024, diuji 2025.</p>
            <table className="tabel" style={{ marginTop: 8 }}><tbody>
              <tr><td>ROC-AUC uji 2025</td><td className="r">0,71</td></tr>
              <tr><td>AUC-PR uji 2025</td><td className="r">0,58</td></tr>
              <tr><td>ROC-AUC blok wilayah</td><td className="r">0,57</td></tr>
              <tr><td>Fitur lolos uji plasebo SHAP</td><td className="r">3 dari 32</td></tr>
            </tbody></table>
          </div>
        </Muncul>
        <Muncul i={4}>
          <div className="kartu">
            <div className="kartu-j"><h3>4. Prioritas R3P (TOPSIS)</h3></div>
            <div className="rumus">z_ij = (x_ij − μ_j) / σ_j{'\n'}v_ij = w_j · z_ij{'\n'}D⁺ = ‖v_i − ideal‖,  D⁻ = ‖v_i − anti‖{'\n'}<em>skor</em> = D⁻ / (D⁺ + D⁻)</div>
            <p className="kecil muted" style={{ marginTop: 8 }}>Delapan kriteria: peluang dampak berat (3), tekanan hulu (1), penduduk (2), kemiskinan (1), IPM (1), rumah sakit (1), puskesmas (1), kerapatan jalan (1). Kestabilan: 1.000 bobot acak Dirichlet (P5–P95).</p>
          </div>
        </Muncul>
        <Muncul i={5}>
          <div className="kartu">
            <div className="kartu-j"><h3>5. Siaga hujan dan verifikasi laporan</h3><Label jenis="asumsi" /></div>
            <p className="teks">Siaga memakai hujan harian maksimum 3 hari dari Open-Meteo dengan kategori BMKG; wilayah 25% teratas tekanan hulu naik satu tingkat lebih awal. Skor kepercayaan laporan = identitas (20) + GPS ≤ 100 m (15) + titik di dalam kab/kota (20) + lokasi &lt; 30 menit (10) + bukti ≤ 24 jam (25) + laporan pendukung ≤ 10 km (10).</p>
          </div>
        </Muncul>
        <Muncul i={6}>
          <div className="kartu">
            <div className="kartu-j"><h3>Sumber data</h3></div>
            <table className="tabel"><thead><tr><th>Data</th><th>Sumber</th><th className="r">Resolusi</th></tr></thead><tbody>
              {SUMBER.map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td className="r">{r[2]}</td></tr>)}
            </tbody></table>
          </div>
        </Muncul>
        <div className="kartu">
          <div className="kartu-j"><h3>Keterbatasan</h3></div>
          <ul className="teks" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li>Tingkat kab/kota menyamarkan variasi di dalam wilayah.</li>
            <li>DIBI mencatat tanggal laporan, bukan selalu tanggal kejadian.</li>
            <li>Hansen dapat mencatat bekas longsor sebagai kehilangan hutan; karena itu tekanan hulu tidak dipakai sebagai fitur model.</li>
            <li>Masuk, OTP, dan laporan pada prototipe disimpan di perangkat; versi produksi butuh server dan akun instansi.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
