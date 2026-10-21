import type { Kategori, ShapeId, Satuan } from '../types.ts'

export interface ShapeField {
  key: string
  label: string
}

export interface ShapeDef {
  id: ShapeId
  kategori: Kategori
  nama: string
  fields: ShapeField[]
  rumusTeks: string
  /** Formula with the entered values substituted in. */
  substitusi: (v: Record<string, number>) => string
  compute: (v: Record<string, number>) => number
}

const n = (x: number) => String(x).replace('.', ',')

export const SHAPES: ShapeDef[] = [
  {
    id: 'persegi', kategori: 'luas', nama: 'Persegi',
    fields: [{ key: 's', label: 'Sisi (s)' }],
    rumusTeks: 'L = s × s',
    substitusi: v => `L = ${n(v.s)} × ${n(v.s)}`,
    compute: v => v.s * v.s,
  },
  {
    id: 'segitiga', kategori: 'luas', nama: 'Segitiga',
    fields: [{ key: 'a', label: 'Alas (a)' }, { key: 't', label: 'Tinggi (t)' }],
    rumusTeks: 'L = ½ × a × t',
    substitusi: v => `L = ½ × ${n(v.a)} × ${n(v.t)}`,
    compute: v => 0.5 * v.a * v.t,
  },
  {
    id: 'lingkaran', kategori: 'luas', nama: 'Lingkaran',
    fields: [{ key: 'r', label: 'Jari-jari (r)' }],
    rumusTeks: 'L = π × r²',
    substitusi: v => `L = π × ${n(v.r)}²`,
    compute: v => Math.PI * v.r * v.r,
  },
  {
    id: 'kubus', kategori: 'volume', nama: 'Kubus',
    fields: [{ key: 's', label: 'Rusuk (s)' }],
    rumusTeks: 'V = s³',
    substitusi: v => `V = ${n(v.s)}³`,
    compute: v => v.s ** 3,
  },
  {
    id: 'limas', kategori: 'volume', nama: 'Limas (alas persegi panjang)',
    fields: [
      { key: 'p', label: 'Panjang alas (p)' },
      { key: 'l', label: 'Lebar alas (l)' },
      { key: 't', label: 'Tinggi (t)' },
    ],
    rumusTeks: 'V = ⅓ × p × l × t',
    substitusi: v => `V = ⅓ × ${n(v.p)} × ${n(v.l)} × ${n(v.t)}`,
    compute: v => (v.p * v.l * v.t) / 3,
  },
  {
    id: 'tabung', kategori: 'volume', nama: 'Tabung',
    fields: [{ key: 'r', label: 'Jari-jari (r)' }, { key: 't', label: 'Tinggi (t)' }],
    rumusTeks: 'V = π × r² × t',
    substitusi: v => `V = π × ${n(v.r)}² × ${n(v.t)}`,
    compute: v => Math.PI * v.r * v.r * v.t,
  },
]

export const SATUAN: Satuan[] = ['mm', 'cm', 'm']

export function getShape(id: ShapeId): ShapeDef {
  const s = SHAPES.find(x => x.id === id)
  if (!s) throw new Error(`Bentuk tidak dikenal: ${id}`)
  return s
}

export function satuanHasil(kategori: Kategori, satuan: Satuan): string {
  return `${satuan}${kategori === 'luas' ? '²' : '³'}`
}

/** Returns null if all fields are positive finite numbers, else an error message. */
export function validateInput(shape: ShapeDef, v: Record<string, number>): string | null {
  for (const f of shape.fields) {
    const x = v[f.key]
    if (!Number.isFinite(x) || x <= 0) return `${f.label} harus berupa angka lebih dari 0.`
  }
  return null
}

export function computeShape(id: ShapeId, v: Record<string, number>): number {
  return getShape(id).compute(v)
}
