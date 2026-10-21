/**
 * Penyimpanan riwayat di localStorage browser.
 * Data tersimpan per browser dan tetap ada setelah tab ditutup.
 * Semua akses dibungkus try/catch karena localStorage bisa diblokir
 * (mode privat, data situs dihapus); aplikasi tetap jalan tanpa penyimpanan.
 */
import type { SessionRecord } from '../types.ts'

/** Kunci localStorage tempat seluruh riwayat disimpan sebagai JSON. */
const KEY = 'geometryx:records'

/** Baca riwayat. Mengembalikan array kosong bila belum ada, rusak, atau tidak bisa dibaca. */
export function loadRecords(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? (data as SessionRecord[]) : []
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
