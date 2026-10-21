/**
 * Tipe data yang dipakai bersama di seluruh aplikasi.
 * Alur data: Biodata + daftar Calculation -> digabung menjadi satu SessionRecord
 * saat siswa menekan "Selesai dan simpan".
 */

/** Jenis perhitungan: luas (bangun datar) atau volume (bangun ruang). */
export type Kategori = 'luas' | 'volume'
/** ID bentuk. Harus sama dengan `id` pada tabel SHAPES di lib/shapes.ts. */
export type ShapeId = 'persegi' | 'segitiga' | 'lingkaran' | 'kubus' | 'limas' | 'tabung'
/** L = laki-laki, P = perempuan. */
export type JenisKelamin = 'L' | 'P'
/** Satuan panjang yang boleh dipilih siswa. */
export type Satuan = 'mm' | 'cm' | 'm'

/** Data diri siswa yang diisi sebelum mulai menghitung. */
export interface Biodata {
  nama: string
  sekolah: string
  kelas: string
  umur: number
  jenisKelamin: JenisKelamin
  nis: string
}

/** Satu hasil perhitungan (satu bentuk, satu set ukuran). */
export interface Calculation {
  id: string
  kategori: Kategori
  bentuk: ShapeId
  /** Ukuran yang diisi siswa, kuncinya sesuai `fields` bentuk (mis. { r: 7, t: 10 }). */
  input: Record<string, number>
  satuanPanjang: Satuan
  rumus: string
  hasil: number
  /** Waktu hitung, format ISO 8601 dengan zona waktu. */
  waktu: string
}

/** Satu sesi siswa: biodata + semua perhitungan, disimpan ke localStorage. */
export interface SessionRecord {
  id: string
  biodata: Biodata
  calculations: Calculation[]
  /** Waktu sesi disimpan, format ISO 8601 dengan zona waktu. */
  selesaiPada: string
  /** Asal data: dibuat di aplikasi atau diimpor dari file .csv. */
  sumber: 'aplikasi' | 'impor'
}
