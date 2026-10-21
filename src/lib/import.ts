/**
 * Impor file .csv hasil ekspor GeometryX.
 *
 * Alur: parseRows (teks -> baris) -> table (ambil satu bagian) -> parseCsv (susun SessionRecord)
 * -> mergeRecords (gabung ke riwayat tanpa duplikat).
 * Bila file tidak sesuai format, ImportError dilempar dengan pesan yang bisa ditampilkan ke pengguna.
 */
import type { Calculation, Kategori, SessionRecord, Satuan } from '../types.ts'
import { SHAPES, SATUAN } from './shapes.ts'
import { newId } from './format.ts'
import { HEAD_BIODATA, HEAD_HASIL, SEC_BIODATA, SEC_HASIL, UKURAN_COLS, unsafeText } from './export.ts'

/**
 * Parser CSV sederhana (RFC 4180): mendukung sel bertanda kutip,
 * kutip ganda di dalam sel (""), dan baris baru di dalam sel.
 * Menghapus BOM di awal file bila ada.
 */
export function parseRows(text: string, delim = ';'): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let q = false
  const src = text.replace(/^\ufeff/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (q) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++ } else q = false
      } else cur += ch
    } else if (ch === '"') q = true
    else if (ch === delim) { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cur); cur = ''
      rows.push(row); row = []
    } else cur += ch
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows
}

/** Error khusus impor; pesannya aman ditampilkan langsung ke pengguna. */
export class ImportError extends Error {}

/**
 * Ambil satu bagian dari file: cari judul bagian, periksa nama kolom,
 * lalu baca baris sampai baris kosong atau judul bagian berikutnya.
 * Mengembalikan baris sebagai objek { namaKolom: nilai }.
 */
function table(rows: string[][], section: string, head: string[]): Record<string, string>[] {
  const start = rows.findIndex(r => r[0]?.trim() === section)
  if (start < 0) throw new ImportError(`Bagian ${section} tidak ditemukan. Gunakan file CSV hasil ekspor GeometryX.`)
  const header = rows[start + 1]
  if (!header || head.some(h => !header.includes(h))) throw new ImportError(`Kolom pada bagian ${section} tidak sesuai.`)
  const out: Record<string, string>[] = []
  for (let i = start + 2; i < rows.length; i++) {
    const r = rows[i]
    if (r.length === 1 && r[0].trim() === '') break
    if (r[0]?.trim().startsWith('[')) break
    out.push(Object.fromEntries(header.map((h, j) => [h, r[j] ?? ''])))
  }
  return out
}

/** Cari bentuk dari nama yang tertulis di file (tidak membedakan huruf besar/kecil). */
/** Baca angka dengan koma atau titik desimal. */
const angka = (s: string) => Number(s.trim().replace(',', '.'))

const shapeByName = new Map(SHAPES.map(sh => [sh.nama.toLowerCase(), sh]))

/**
 * Ubah isi file .csv menjadi daftar sesi.
 * 1. Baca bagian hasil, kelompokkan perhitungan per (Nama + Timestamp Selesai).
 * 2. Baca bagian biodata, tempelkan perhitungan yang cocok ke tiap siswa.
 * ID dibuat baru karena file tidak menyimpan ID.
 */
export function parseCsv(text: string): SessionRecord[] {
  // Pemisah: dari baris `sep=` bila ada, kalau tidak tebak dari baris pertama (titik koma atau koma)
  const src = text.replace(/^\ufeff/, '')
  const sep = /^sep=(.)/i.exec(src)
  const first = src.split(/\r?\n/).find(l => l.trim() !== '' && !/^sep=/i.test(l)) ?? ''
  const delim = sep ? sep[1] : first.includes(';') ? ';' : ','
  const rows = parseRows(src, delim).filter(r => !/^sep=/i.test(r[0] ?? ''))
  const bio = table(rows, SEC_BIODATA, HEAD_BIODATA)
  const hasil = table(rows, SEC_HASIL, HEAD_HASIL)

  // Kunci penghubung antara bagian hasil dan bagian biodata
  const kunci = (nama: string, waktu: string) => `${nama}\u0000${waktu}`
  const calcs = new Map<string, Calculation[]>()
  // Langkah 1: baca setiap baris hasil, validasi, lalu kelompokkan per siswa
  for (const h of hasil) {
    const shape = shapeByName.get(h['Bentuk'].trim().toLowerCase())
    if (!shape) throw new ImportError(`Bentuk tidak dikenal: ${h['Bentuk']}`)
    const kategori = h['Kategori'].trim().toLowerCase()
    if (kategori !== 'luas' && kategori !== 'volume') throw new ImportError(`Kategori tidak dikenal: ${h['Kategori']}`)
    const nilai = angka(h['Hasil'])
    if (h['Hasil'].trim() === '' || !Number.isFinite(nilai)) throw new ImportError(`Nilai hasil tidak valid: ${h['Hasil']}`)
    const input: Record<string, number> = {}
    for (const f of shape.fields) {
      const col = UKURAN_COLS.find(u => u.key === f.key)!
      const v = angka(h[col.head])
      if (h[col.head].trim() === '' || !Number.isFinite(v)) throw new ImportError(`Ukuran ${col.head} tidak valid untuk ${shape.nama}.`)
      input[f.key] = v
    }
    const satuan = (SATUAN as string[]).includes(h['Satuan Panjang']) ? (h['Satuan Panjang'] as Satuan) : 'cm'
    const c: Calculation = {
      id: newId(), kategori: kategori as Kategori, bentuk: shape.id,
      input, satuanPanjang: satuan, rumus: h['Rumus'], hasil: nilai, waktu: h['Waktu Hitung'],
    }
    const k = kunci(h['Nama'], h['Timestamp Selesai'])
    const list = calcs.get(k) ?? []
    list.push(c)
    calcs.set(k, list)
  }

  // Langkah 2: susun sesi siswa dari bagian biodata
  return bio.map(b => {
    const umur = Number(b['Umur'])
    if (!b['Nama'] || !Number.isFinite(umur) || Number.isNaN(Date.parse(b['Timestamp Selesai']))) {
      throw new ImportError(`Baris biodata tidak valid (nama: ${b['Nama'] || '-'}).`)
    }
    return {
      id: newId(),
      biodata: {
        nama: unsafeText(b['Nama']), sekolah: unsafeText(b['Sekolah']), kelas: unsafeText(b['Kelas']),
        umur, jenisKelamin: b['Jenis Kelamin'].trim().toLowerCase().startsWith('p') ? 'P' : 'L', nis: unsafeText(b['NIS']),
      },
      calculations: calcs.get(kunci(b['Nama'], b['Timestamp Selesai'])) ?? [],
      selesaiPada: b['Timestamp Selesai'],
      sumber: 'impor' as const,
    }
  })
}

/**
 * Gabungkan data impor ke riwayat yang ada. Sesi dianggap duplikat bila
 * Nama dan Timestamp Selesai sama, dan akan dilewati.
 * Mengembalikan daftar gabungan beserta jumlah yang ditambah dan yang duplikat.
 */
export function mergeRecords(existing: SessionRecord[], incoming: SessionRecord[]) {
  const key = (r: SessionRecord) => `${r.biodata.nama}\u0000${r.selesaiPada}`
  const ada = new Set(existing.map(key))
  const baru = incoming.filter(r => !ada.has(key(r)))
  return { merged: [...existing, ...baru], ditambah: baru.length, duplikat: incoming.length - baru.length }
}
