import type { ShapeId, SessionRecord } from '../types.ts'
import { SHAPES } from './shapes.ts'

export interface Stats {
  totalRecord: number
  totalHitung: number
  totalLuas: number
  totalVolume: number
  persenLuas: number
  persenVolume: number
  perBentuk: { id: ShapeId; nama: string; kategori: 'luas' | 'volume'; jumlah: number; persen: number }[]
}

const pct = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100)

export function hitungStats(records: SessionRecord[]): Stats {
  const calcs = records.flatMap(r => r.calculations)
  const totalHitung = calcs.length
  const totalLuas = calcs.filter(c => c.kategori === 'luas').length
  const totalVolume = totalHitung - totalLuas
  return {
    totalRecord: records.length,
    totalHitung, totalLuas, totalVolume,
    persenLuas: pct(totalLuas, totalHitung),
    persenVolume: pct(totalVolume, totalHitung),
    perBentuk: SHAPES.map(s => {
      const jumlah = calcs.filter(c => c.bentuk === s.id).length
      return { id: s.id, nama: s.nama, kategori: s.kategori, jumlah, persen: pct(jumlah, totalHitung) }
    }),
  }
}
