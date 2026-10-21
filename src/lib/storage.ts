/**
 * Penyimpanan riwayat di localStorage browser.
 * Data tersimpan per browser dan tetap ada setelah tab ditutup.
 * Semua akses dibungkus try/catch karena localStorage bisa diblokir
 * (mode privat, data situs dihapus); aplikasi tetap jalan tanpa penyimpanan.
 */
import type { SessionRecord } from '../types.ts'
import { SHAPES, SATUAN } from './shapes.ts'

/** Kunci localStorage tempat seluruh riwayat disimpan sebagai JSON. */
const KEY = 'geometryx:records'

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Periksa satu perhitungan: bentuk dikenal, ukuran sesuai `fields` bentuknya, semua angka terhingga. */
function isCalculation(v: unknown): boolean {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.rumus) || !isStr(v.waktu) || !isNum(v.hasil)) return false
  if (v.kategori !== 'luas' && v.kategori !== 'volume') return false
  if (!(SATUAN as unknown[]).includes(v.satuanPanjang)) return false
  const shape = SHAPES.find(s => s.id === v.bentuk)
  if (!shape || !isObj(v.input)) return false
  const input = v.input
  return shape.fields.every(f => isNum(input[f.key]))
}

/** Periksa satu sesi siswa. localStorage bisa diubah sembarang orang, jadi isinya tidak dipercaya begitu saja. */
function isRecord(v: unknown): v is SessionRecord {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.selesaiPada) || Number.isNaN(Date.parse(v.selesaiPada))) return false
  if (v.sumber !== 'aplikasi' && v.sumber !== 'impor') return false
  const b = v.biodata
  if (!isObj(b) || !isStr(b.nama) || !isStr(b.sekolah) || !isStr(b.kelas) || !isStr(b.nis) || !isNum(b.umur)) return false
  if (b.jenisKelamin !== 'L' && b.jenisKelamin !== 'P') return false
  return Array.isArray(v.calculations) && v.calculations.every(isCalculation)
}

/** Baca riwayat. Mengembalikan array kosong bila belum ada, rusak, atau tidak bisa dibaca; entri tidak valid dibuang. */
export function loadRecords(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isRecord) : []
  } catch {
    return []
  }
}

/** Simpan seluruh riwayat. Dipanggil setiap kali riwayat berubah (simpan, impor, hapus). */
export function saveRecords(records: SessionRecord[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(records))
  } catch {
    // Penyimpanan tidak tersedia (mode privat / kuota penuh): data hanya ada di memori
  }
}
