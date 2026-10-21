/**
 * Ekspor riwayat ke file .txt dan .csv, serta fungsi untuk mengunduhnya.
 *
 * Format .csv (pemisah kolom koma) terdiri dari dua bagian yang dipisahkan satu baris kosong:
 *   [BIODATA SISWA]       satu baris per siswa
 *   [HASIL PERHITUNGAN]   satu baris per perhitungan, terhubung ke siswa lewat Nama + Timestamp Selesai
 * Format ini sama dengan yang dibaca lib/import.ts, jadi ubah keduanya bersamaan.
 */
import type { Calculation, SessionRecord } from '../types.ts'
import { getShape, satuanHasil } from './shapes.ts'
import { formatAngka, formatJam, formatTanggal, formatZona, labelJK } from './format.ts'

/** Judul bagian pada file .csv; dipakai juga saat impor untuk mencari bagiannya. */
export const SEC_BIODATA = '[BIODATA SISWA]'
export const SEC_HASIL = '[HASIL PERHITUNGAN]'
/** Nama kolom bagian biodata. */
export const HEAD_BIODATA = ['No', 'Nama', 'Sekolah', 'Kelas', 'Umur', 'Jenis Kelamin', 'NIS', 'Tanggal Selesai', 'Waktu Selesai', 'Timestamp Selesai']
/**
 * Kolom ukuran pada bagian hasil: satu kolom per jenis ukuran.
 * Sel dikosongkan bila bentuknya tidak memakai ukuran itu.
 */
export const UKURAN_COLS: { key: string; head: string }[] = [
  { key: 's', head: 'Sisi/Rusuk' },
  { key: 'a', head: 'Alas' },
  { key: 'p', head: 'Panjang Alas' },
  { key: 'l', head: 'Lebar Alas' },
  { key: 'r', head: 'Jari-jari' },
  { key: 't', head: 'Tinggi' },
]
/** Nama kolom bagian hasil perhitungan. */
export const HEAD_HASIL = ['No', 'Nama', 'Timestamp Selesai', 'Kategori', 'Bentuk', 'Rumus', ...UKURAN_COLS.map(c => c.head), 'Satuan Panjang', 'Hasil', 'Satuan Hasil', 'Waktu Hitung']

/** Garis judul bagian pada file .txt. */
const hr = (t: string) => `===== ${t} =====`

/** Ukuran dalam satu baris teks, mis. "r=7 cm, t=10 cm". */
function inputTeks(c: Calculation, sep = ', '): string {
  return getShape(c.bentuk).fields
    .map(f => `${f.key}=${formatAngka(c.input[f.key], 2).replace(/,00$/, '')} ${c.satuanPanjang}`)
    .join(sep)
}

/** Satu baris hasil di file .txt: nomor, bentuk, ukuran, rumus, hasil, jam hitung. */
function calcLine(c: Calculation, i: number): string {
  const s = getShape(c.bentuk)
  return `${i + 1}. ${s.nama} | ${inputTeks(c)} | ${s.rumusTeks} | ${formatAngka(c.hasil)} ${satuanHasil(c.kategori, c.satuanPanjang)} | ${formatJam(c.waktu)}`
}

/**
 * Buat isi file .txt. Tiap siswa punya tiga bagian: biodata,
 * hasil luas bangun datar, dan hasil volume bangun ruang.
 */
export function toTxt(records: SessionRecord[]): string {
  return records.map(r => {
    const b = r.biodata
    const luas = r.calculations.filter(c => c.kategori === 'luas')
    const vol = r.calculations.filter(c => c.kategori === 'volume')
    const lines = [
      hr('BIODATA SISWA'),
      `Nama            : ${b.nama}`,
      `Sekolah         : ${b.sekolah}`,
      `Kelas           : ${b.kelas}`,
      `Umur            : ${b.umur} tahun`,
      `Jenis Kelamin   : ${labelJK(b.jenisKelamin)}`,
      `NIS             : ${b.nis || '-'}`,
      `Tanggal Selesai : ${formatTanggal(r.selesaiPada)}`,
      `Waktu Selesai   : ${formatJam(r.selesaiPada)} ${formatZona(r.selesaiPada)}`,
      `Timestamp (ISO) : ${r.selesaiPada}`,
      '',
      hr('HASIL PERHITUNGAN - LUAS BANGUN DATAR'),
      ...(luas.length ? luas.map(calcLine) : ['(tidak ada)']),
      '',
      hr('HASIL PERHITUNGAN - VOLUME BANGUN RUANG'),
      ...(vol.length ? vol.map(calcLine) : ['(tidak ada)']),
      '',
      `Ringkasan: ${luas.length} luas, ${vol.length} volume, total ${r.calculations.length}`,
    ]
    return lines.join('\n')
  }).join('\n\n' + '#'.repeat(60) + '\n\n') + '\n'
}

/**
 * Cegah injeksi rumus di Excel/Sheets: teks yang diawali = + - @ diberi tanda kutip di depan
 * supaya tidak dijalankan sebagai rumus. Saat impor tanda ini dihapus lagi.
 */
function safeText(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

/** Pemisah kolom: koma (format CSV standar). */
export const DELIM = ','

/** Bungkus sel dengan tanda kutip bila berisi pemisah, kutip, atau baris baru (aturan CSV). */
function cell(v: string | number): string {
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Gabungkan sel menjadi satu baris CSV. */
const row = (cells: (string | number)[]) => cells.map(cell).join(DELIM)

/**
 * Buat isi file .csv dengan dua bagian (biodata dan hasil).
 * Diawali BOM agar Excel membaca UTF-8 dengan benar.
 * Kolom dipisah koma; hasil dan ukuran ditulis sebagai angka mentah dengan titik desimal
 * supaya tidak berubah saat diimpor.
 */
export function toCsv(records: SessionRecord[]): string {
  const bio = records.map((r, i) => row([
    i + 1, safeText(r.biodata.nama), safeText(r.biodata.sekolah), safeText(r.biodata.kelas),
    r.biodata.umur, labelJK(r.biodata.jenisKelamin), safeText(r.biodata.nis),
    formatTanggal(r.selesaiPada), `${formatJam(r.selesaiPada)} ${formatZona(r.selesaiPada)}`, r.selesaiPada,
  ]))
  const hasil = records.flatMap(r => r.calculations.map(c => ({ r, c }))).map(({ r, c }, i) => row([
    i + 1, safeText(r.biodata.nama), r.selesaiPada, c.kategori === 'luas' ? 'Luas' : 'Volume',
    getShape(c.bentuk).nama, c.rumus,
    ...UKURAN_COLS.map(u => c.input[u.key] ?? ''),
    c.satuanPanjang, c.hasil, satuanHasil(c.kategori, c.satuanPanjang), c.waktu,
  ]))
  return '\ufeff' + [SEC_BIODATA, row(HEAD_BIODATA), ...bio, '', SEC_HASIL, row(HEAD_HASIL), ...hasil].join('\r\n') + '\r\n'
}

/** Kebalikan safeText: hapus tanda kutip pelindung saat membaca file .csv. */
export function unsafeText(s: string): string {
  return /^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s
}

/** Unduh isi (teks atau data biner) sebagai file lewat browser (Blob + tautan sementara). */
export function download(filename: string, content: BlobPart, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime.startsWith('text/') ? `${mime};charset=utf-8` : mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Penanda waktu untuk nama file, mis. "20261021-1432". */
export function stamp(d = new Date()): string {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}
