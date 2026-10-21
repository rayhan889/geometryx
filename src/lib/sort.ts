import type { SessionRecord } from '../types.ts'

export type SortKey = 'nama' | 'sekolah' | 'umur' | 'selesaiPada'
export type SortDir = 'asc' | 'desc'

export const SORT_LABELS: Record<SortKey, string> = {
  nama: 'Nama', sekolah: 'Sekolah', umur: 'Umur', selesaiPada: 'Waktu simpan',
}

export function sortRecords(records: SessionRecord[], key: SortKey, dir: SortDir): SessionRecord[] {
  const m = dir === 'asc' ? 1 : -1
  const val = (r: SessionRecord): string | number => {
    switch (key) {
      case 'nama': return r.biodata.nama
      case 'sekolah': return r.biodata.sekolah
      case 'umur': return r.biodata.umur
      case 'selesaiPada': return new Date(r.selesaiPada).getTime()
    }
  }
  return [...records].sort((a, b) => {
    const x = val(a), y = val(b)
    const c = typeof x === 'string' && typeof y === 'string'
      ? x.localeCompare(y, 'id', { sensitivity: 'base' })
      : (x as number) - (y as number)
    return c * m
  })
}
