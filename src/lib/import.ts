import type { Calculation, Kategori, SessionRecord, ShapeId, Satuan } from '../types.ts'
import { SHAPES, SATUAN } from './shapes.ts'
import { newId } from './format.ts'
import { HEAD_BIODATA, HEAD_HASIL, SEC_BIODATA, SEC_HASIL, unsafeText } from './export.ts'

/** Minimal RFC-4180 parser: quoted fields, escaped quotes, newlines inside quotes. */
export function parseRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let q = false
  const src = text.replace(/^\ufeff/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (q) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++ } else q = false
      } else cur += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cur); cur = ''
      rows.push(row); row = []
    } else cur += ch
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows
}

export class ImportError extends Error {}

function table(rows: string[][], section: string, head: string[]): Record<string, string>[] {
  const start = rows.findIndex(r => r[0]?.trim() === section)
  if (start < 0) throw new ImportError(`Bagian ${section} tidak ditemukan. Gunakan file CSV hasil ekspor GeometryX.`)
  const header = rows[start + 1]
  if (!header || head.some(h => !header.includes(h))) throw new ImportError(`Kolom pada bagian ${section} tidak sesuai.`)
  const out: Record<string, string>[] = []
  for (let i = start + 2; i < rows.length; i++) {
    const r = rows[i]
    if (r.length === 1 && r[0].trim() === '') break
    if (r[0]?.trim().startsWith('[')) break
    out.push(Object.fromEntries(header.map((h, j) => [h, r[j] ?? ''])))
  }
  return out
}

const shapeIds = new Set<string>(SHAPES.map(s => s.id))

export function parseCsv(text: string): SessionRecord[] {
  const rows = parseRows(text)
  const bio = table(rows, SEC_BIODATA, HEAD_BIODATA)
  const hasil = table(rows, SEC_HASIL, HEAD_HASIL)

  const kunci = (nama: string, waktu: string) => `${nama}\u0000${waktu}`
  const calcs = new Map<string, Calculation[]>()
  for (const h of hasil) {
    if (!shapeIds.has(h.bentuk)) throw new ImportError(`Bentuk tidak dikenal: ${h.bentuk}`)
    if (h.kategori !== 'luas' && h.kategori !== 'volume') throw new ImportError(`Kategori tidak dikenal: ${h.kategori}`)
    const nilai = Number(h.hasil)
    if (!Number.isFinite(nilai)) throw new ImportError(`Nilai hasil tidak valid: ${h.hasil}`)
    const input: Record<string, number> = {}
    for (const part of h.input.split(';').filter(Boolean)) {
      const [k, v] = part.split('=')
      input[k] = Number(v)
    }
    const satuan = (SATUAN as string[]).includes(h.satuan_panjang) ? (h.satuan_panjang as Satuan) : 'cm'
    const c: Calculation = {
      id: newId(), kategori: h.kategori as Kategori, bentuk: h.bentuk as ShapeId,
      input, satuanPanjang: satuan, rumus: h.rumus, hasil: nilai, waktu: h.timestamp_hitung,
    }
    const k = kunci(h.nama, h.timestamp_selesai)
    const list = calcs.get(k) ?? []
    list.push(c)
    calcs.set(k, list)
  }

  return bio.map(b => {
    const umur = Number(b.umur)
    if (!b.nama || !Number.isFinite(umur) || Number.isNaN(Date.parse(b.timestamp_iso))) {
      throw new ImportError(`Baris biodata tidak valid (nama: ${b.nama || '-'}).`)
    }
    return {
      id: newId(),
      biodata: {
        nama: unsafeText(b.nama), sekolah: unsafeText(b.sekolah), kelas: unsafeText(b.kelas),
        umur, jenisKelamin: b.jenis_kelamin === 'P' ? 'P' : 'L', nis: unsafeText(b.nis),
      },
      calculations: calcs.get(kunci(b.nama, b.timestamp_iso)) ?? [],
      selesaiPada: b.timestamp_iso,
      sumber: 'impor' as const,
    }
  })
}

/** Merge imported records into existing ones, skipping a student + completion time already present. */
export function mergeRecords(existing: SessionRecord[], incoming: SessionRecord[]) {
  const key = (r: SessionRecord) => `${r.biodata.nama}\u0000${r.selesaiPada}`
  const ada = new Set(existing.map(key))
  const baru = incoming.filter(r => !ada.has(key(r)))
  return { merged: [...existing, ...baru], ditambah: baru.length, duplikat: incoming.length - baru.length }
}
