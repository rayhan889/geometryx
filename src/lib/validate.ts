/**
 * Validasi bentuk data riwayat. Dipakai server (sebelum menulis ke SQLite)
 * dan klien (menyaring data localStorage lama sebelum dimigrasikan).
 * Isi dari luar tidak pernah dipercaya begitu saja.
 */
import type { SessionRecord } from '../types.ts'
import { SHAPES, SATUAN } from './shapes.ts'

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isDate = (v: unknown): v is string => isStr(v) && !Number.isNaN(Date.parse(v))
/** String tidak kosong sepanjang-panjangnya `max` karakter. */
const text = (v: unknown, max: number): v is string => isStr(v) && v.length > 0 && v.length <= max

/** Periksa satu perhitungan: bentuk dikenal, ukuran sesuai `fields` bentuknya, semua angka terhingga. */
export function isCalculation(v: unknown): boolean {
  if (!isObj(v) || !text(v.id, 64) || !text(v.rumus, 200) || !isDate(v.waktu) || !isNum(v.hasil)) return false
  if (v.kategori !== 'luas' && v.kategori !== 'volume') return false
  if (!(SATUAN as unknown[]).includes(v.satuanPanjang)) return false
  const shape = SHAPES.find(s => s.id === v.bentuk)
  if (!shape || shape.kategori !== v.kategori || !isObj(v.input)) return false
  const input = v.input
  return shape.fields.every(f => isNum(input[f.key]))
}

/** Periksa satu sesi siswa beserta perhitungannya. */
export function isRecord(v: unknown): v is SessionRecord {
  if (!isObj(v) || !text(v.id, 64) || !isDate(v.selesaiPada)) return false
  if (v.sumber !== 'aplikasi' && v.sumber !== 'impor') return false
  const b = v.biodata
  if (!isObj(b) || !text(b.nama, 100) || !text(b.sekolah, 100) || !text(b.kelas, 50)) return false
  if (!isStr(b.nis) || b.nis.length > 50) return false
  if (!Number.isInteger(b.umur) || (b.umur as number) < 4 || (b.umur as number) > 100) return false
  if (b.jenisKelamin !== 'L' && b.jenisKelamin !== 'P') return false
  return Array.isArray(v.calculations) && v.calculations.length <= 500 && v.calculations.every(isCalculation)
}
