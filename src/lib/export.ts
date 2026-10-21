import type { Calculation, SessionRecord } from '../types.ts'
import { getShape, satuanHasil } from './shapes.ts'
import { formatAngka, formatJam, formatTanggal, formatZona, labelJK } from './format.ts'

export const SEC_BIODATA = '[BIODATA SISWA]'
export const SEC_HASIL = '[HASIL PERHITUNGAN]'
export const HEAD_BIODATA = ['nama', 'sekolah', 'kelas', 'umur', 'jenis_kelamin', 'nis', 'tanggal_selesai', 'waktu_selesai', 'timestamp_iso']
// Hasil rows point at their student by nama + timestamp_selesai (same as biodata's timestamp_iso).
export const HEAD_HASIL = ['nama', 'timestamp_selesai', 'kategori', 'bentuk', 'input', 'satuan_panjang', 'rumus', 'hasil', 'satuan', 'timestamp_hitung']

const hr = (t: string) => `===== ${t} =====`

function inputTeks(c: Calculation, sep = ', '): string {
  return getShape(c.bentuk).fields
    .map(f => `${f.key}=${formatAngka(c.input[f.key], 2).replace(/,00$/, '')} ${c.satuanPanjang}`)
    .join(sep)
}

function calcLine(c: Calculation, i: number): string {
  const s = getShape(c.bentuk)
  return `${i + 1}. ${s.nama} | ${inputTeks(c)} | ${s.rumusTeks} | ${formatAngka(c.hasil)} ${satuanHasil(c.kategori, c.satuanPanjang)} | ${formatJam(c.waktu)}`
}

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

/** Neutralise spreadsheet formula injection; import strips the marker again. */
function safeText(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

function cell(v: string | number): string {
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const row = (cells: (string | number)[]) => cells.map(cell).join(',')

export function toCsv(records: SessionRecord[]): string {
  const bio = records.map(r => row([
    safeText(r.biodata.nama), safeText(r.biodata.sekolah), safeText(r.biodata.kelas),
    r.biodata.umur, r.biodata.jenisKelamin, safeText(r.biodata.nis),
    formatTanggal(r.selesaiPada), `${formatJam(r.selesaiPada)} ${formatZona(r.selesaiPada)}`, r.selesaiPada,
  ]))
  const hasil = records.flatMap(r => r.calculations.map(c => row([
    safeText(r.biodata.nama), r.selesaiPada, c.kategori, c.bentuk,
    Object.entries(c.input).map(([k, v]) => `${k}=${v}`).join(';'),
    c.satuanPanjang, c.rumus, c.hasil, satuanHasil(c.kategori, c.satuanPanjang), c.waktu,
  ])))
  return '﻿' + [SEC_BIODATA, row(HEAD_BIODATA), ...bio, '', SEC_HASIL, row(HEAD_HASIL), ...hasil].join('\r\n') + '\r\n'
}

export function unsafeText(s: string): string {
  return /^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s
}

export function download(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function stamp(d = new Date()): string {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}
