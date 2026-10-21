/**
 * Pengurutan riwayat berdasarkan nama, sekolah, umur, atau waktu simpan.
 */
import type { SessionRecord } from '../types.ts'

/** Kolom yang bisa dipakai untuk mengurutkan. */
export type SortKey = 'nama' | 'sekolah' | 'umur' | 'selesaiPada'
/** Arah urutan: naik (asc) atau turun (desc). */
export type SortDir = 'asc' | 'desc'

/** Label kolom untuk dropdown urutan di dashboard. */
export const SORT_LABELS: Record<SortKey, string> = {
  nama: 'Nama', sekolah: 'Sekolah', umur: 'Umur', selesaiPada: 'Waktu simpan',
}

/**
 * Urutkan riwayat tanpa mengubah array asli.
 * Teks dibandingkan dengan aturan bahasa Indonesia dan tidak membedakan huruf besar/kecil;
 * umur dan waktu dibandingkan sebagai angka.
 */
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
