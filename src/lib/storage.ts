import type { SessionRecord } from '../types.ts'

const KEY = 'geometryx:records'

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

export function saveRecords(records: SessionRecord[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(records))
  } catch {
    // storage unavailable (private mode / quota); state stays in memory only
  }
}
