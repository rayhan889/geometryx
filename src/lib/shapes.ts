/**
 * Tabel bentuk bangun datar dan bangun ruang.
 * Satu tabel (SHAPES) menggerakkan semuanya: form input, tampilan rumus,
 * perhitungan, dan ekspor. Untuk menambah bentuk baru, cukup tambah satu entri di sini
 * (dan satu ikon di components/ShapeIcon.tsx).
 */
import type { Kategori, ShapeId, Satuan } from '../types.ts'

/** Satu kolom ukuran pada form, mis. jari-jari. `key` dipakai di rumus (v.r). */
export interface ShapeField {
  key: string
  label: string
}

/** Definisi lengkap satu bentuk. */
export interface ShapeDef {
  id: ShapeId
  kategori: Kategori
  nama: string
  fields: ShapeField[]
  /** Rumus dalam bentuk teks, mis. "L = ½ × a × t". */
  rumusTeks: string
  /** Rumus dengan ukuran siswa sudah dimasukkan, mis. "L = ½ × 6 × 4". */
  substitusi: (v: Record<string, number>) => string
  /** Rumus perhitungan. Dipanggil setelah input lolos validateInput. */
  compute: (v: Record<string, number>) => number
}

/** Angka untuk tampilan rumus: koma sebagai pemisah desimal, gaya Indonesia. */
const n = (x: number) => String(x).replace('.', ',')

/** Daftar semua bentuk: 3 bangun datar (luas) dan 3 bangun ruang (volume). */
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

/** Pilihan satuan panjang pada dropdown. */
export const SATUAN: Satuan[] = ['mm', 'cm', 'm']

/** Ambil definisi bentuk berdasarkan ID. Error bila ID tidak dikenal. */
export function getShape(id: ShapeId): ShapeDef {
  const s = SHAPES.find(x => x.id === id)
  if (!s) throw new Error(`Bentuk tidak dikenal: ${id}`)
  return s
}

/** Satuan hasil: luas dipangkat dua (cm²), volume dipangkat tiga (cm³). */
export function satuanHasil(kategori: Kategori, satuan: Satuan): string {
  return `${satuan}${kategori === 'luas' ? '²' : '³'}`
}

/**
 * Validasi input: semua ukuran harus angka valid lebih dari 0.
 * Mengembalikan null bila valid, atau pesan error untuk ditampilkan ke siswa.
 */
export function validateInput(shape: ShapeDef, v: Record<string, number>): string | null {
  for (const f of shape.fields) {
    const x = v[f.key]
    if (!Number.isFinite(x) || x <= 0) return `${f.label} harus berupa angka lebih dari 0.`
  }
  return null
}

/** Hitung luas/volume mentah (tanpa pembulatan) untuk bentuk dan ukuran tertentu. */
export function computeShape(id: ShapeId, v: Record<string, number>): number {
  return getShape(id).compute(v)
}
