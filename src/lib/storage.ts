/**
 * Klien API riwayat. Sumber kebenaran data adalah SQLite di server (lihat `server/`);
 * semua fungsi di sini melempar `Error` bila server tidak bisa dihubungi atau menolak permintaan,
 * supaya UI bisa menampilkan kegagalan alih-alih diam-diam kehilangan data.
 */
import type { SessionRecord } from '../types.ts'
import { isRecord } from './validate.ts'

/** Kunci localStorage lama, sebelum riwayat dipindah ke SQLite. */
const LEGACY_KEY = 'geometryx:records'

async function request(method: string, url: string, body?: unknown): Promise<Response> {
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Server tidak dapat dihubungi.')
  }
  if (!res.ok) {
    const msg = ((await res.json().catch(() => null)) as { error?: string } | null)?.error
    throw new Error(msg ?? `Permintaan gagal (${res.status}).`)
  }
  return res
}

export async function loadRecords(): Promise<SessionRecord[]> {
  return (await request('GET', '/api/records')).json()
}

export async function addRecord(r: SessionRecord): Promise<void> {
  await request('POST', '/api/records', r)
}

/** Simpan banyak sesi sekaligus; duplikat dilewati oleh server. */
export async function importRecords(records: SessionRecord[]): Promise<{ inserted: number; skipped: number }> {
  return (await request('POST', '/api/records/bulk', { records })).json()
}

export async function removeRecord(id: string): Promise<void> {
  await request('DELETE', `/api/records/${encodeURIComponent(id)}`)
}

export async function clearRecords(): Promise<void> {
  await request('DELETE', '/api/records')
}

/** Riwayat lama di localStorage (entri tidak valid dibuang). Kosong bila tidak ada atau tidak bisa dibaca. */
export function readLegacyRecords(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isRecord) : []
  } catch {
    return []
  }
}

/**
 * Pindahkan riwayat localStorage ke SQLite sekali saja. Kunci lama dihapus hanya setelah
 * server mengonfirmasi bahwa semua sesi tersimpan atau sudah ada (inserted + skipped = jumlah kirim).
 */
export async function migrateLegacyRecords(): Promise<void> {
  const legacy = readLegacyRecords()
  try {
    if (legacy.length) {
      const { inserted, skipped } = await importRecords(legacy)
      if (inserted + skipped !== legacy.length) return
    }
    if (localStorage.getItem(LEGACY_KEY) !== null) localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Server belum siap atau localStorage diblokir: coba lagi pada pemuatan berikutnya
  }
}
