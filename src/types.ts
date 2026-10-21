export type Kategori = 'luas' | 'volume'
export type ShapeId = 'persegi' | 'segitiga' | 'lingkaran' | 'kubus' | 'limas' | 'tabung'
export type JenisKelamin = 'L' | 'P'
export type Satuan = 'mm' | 'cm' | 'm'

export interface Biodata {
  nama: string
  sekolah: string
  kelas: string
  umur: number
  jenisKelamin: JenisKelamin
  nis: string
}

export interface Calculation {
  id: string
  kategori: Kategori
  bentuk: ShapeId
  input: Record<string, number>
  satuanPanjang: Satuan
  rumus: string
  hasil: number
  waktu: string // ISO with offset
}

export interface SessionRecord {
  id: string
  biodata: Biodata
  calculations: Calculation[]
  selesaiPada: string // ISO with offset
  sumber: 'aplikasi' | 'impor'
}
