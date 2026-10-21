import { describe, expect, it } from 'vitest'
import { computeShape } from './shapes.ts'
import { sortRecords } from './sort.ts'
import { hitungStats } from './stats.ts'
import { toCsv, toTxt } from './export.ts'
import { mergeRecords, parseCsv } from './import.ts'
import type { Calculation, SessionRecord } from '../types.ts'

describe('rumus', () => {
  it('menghitung luas dan volume', () => {
    expect(computeShape('persegi', { s: 4 })).toBe(16)
    expect(computeShape('segitiga', { a: 6, t: 4 })).toBe(12)
    expect(computeShape('lingkaran', { r: 7 })).toBeCloseTo(153.938, 3)
    expect(computeShape('kubus', { s: 3 })).toBe(27)
    expect(computeShape('limas', { p: 3, l: 4, t: 5 })).toBe(20)
    expect(computeShape('tabung', { r: 7, t: 10 })).toBeCloseTo(1539.38, 2)
  })
})

const calc = (id: string, bentuk: 'segitiga' | 'tabung'): Calculation => bentuk === 'segitiga'
  ? { id, kategori: 'luas', bentuk, input: { a: 6.5, t: 4 }, satuanPanjang: 'cm', rumus: 'L = ½ × a × t', hasil: 13, waktu: '2026-10-21T14:30:11.000+07:00' }
  : { id, kategori: 'volume', bentuk, input: { r: 7, t: 10 }, satuanPanjang: 'm', rumus: 'V = π × r² × t', hasil: computeShape('tabung', { r: 7, t: 10 }), waktu: '2026-10-21T14:31:40.000+07:00' }

const rec = (id: string, nama: string, sekolah: string, umur: number, t: string, calcs: Calculation[]): SessionRecord => ({
  id, biodata: { nama, sekolah, kelas: '8A', umur, jenisKelamin: 'L', nis: '' },
  calculations: calcs, selesaiPada: t, sumber: 'aplikasi',
})

const data = [
  rec('1', 'Budi, "Si" Santoso', 'SMPN 2', 14, '2026-10-21T14:32:05.123+07:00', [calc('c1', 'segitiga'), calc('c2', 'tabung')]),
  rec('2', 'Ani', 'SMPN 1', 12, '2026-10-20T09:00:00.000+07:00', [calc('c3', 'tabung')]),
  rec('3', '=SUM(A1)', 'SMPN 3', 13, '2026-10-22T10:00:00.000+07:00', []),
]

describe('sort', () => {
  it('mengurutkan per kunci', () => {
    expect(sortRecords(data, 'nama', 'asc').map(r => r.id)).toEqual(['3', '2', '1'])
    expect(sortRecords(data, 'sekolah', 'asc').map(r => r.id)).toEqual(['2', '1', '3'])
    expect(sortRecords(data, 'umur', 'desc').map(r => r.id)).toEqual(['1', '3', '2'])
    expect(sortRecords(data, 'selesaiPada', 'asc').map(r => r.id)).toEqual(['2', '1', '3'])
  })
})

describe('stats', () => {
  it('menghitung total dan persen', () => {
    const s = hitungStats(data)
    expect(s).toMatchObject({ totalRecord: 3, totalHitung: 3, totalLuas: 1, totalVolume: 2 })
    expect(s.persenLuas).toBeCloseTo(33.33, 1)
    expect(s.persenVolume).toBeCloseTo(66.67, 1)
    expect(hitungStats([]).persenLuas).toBe(0)
  })
})

describe('ekspor/impor', () => {
  it('CSV round-trip', () => {
    const csv = toCsv(data)
    expect(csv).not.toMatch(/record_id|calc_id/)
    const strip = (rs: SessionRecord[]) => rs.map(r => ({ ...r, id: '', sumber: 'aplikasi', calculations: r.calculations.map(c => ({ ...c, id: '' })) }))
    expect(strip(parseCsv(csv))).toEqual(strip(data))
  })
  it('TXT memuat bagian biodata dan hasil', () => {
    const t = toTxt(data)
    expect(t).toContain('BIODATA SISWA')
    expect(t).toContain('LUAS BANGUN DATAR')
    expect(t).toContain('VOLUME BANGUN RUANG')
  })
  it('melewati duplikat saat merge', () => {
    const r = mergeRecords(data, parseCsv(toCsv(data)))
    expect(r.ditambah).toBe(0)
    expect(r.duplikat).toBe(3)
  })
  it('menolak file bukan GeometryX', () => {
    expect(() => parseCsv('a,b\n1,2')).toThrow()
  })
})
