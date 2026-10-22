/**
 * Penyimpanan riwayat di SQLite (sumber kebenaran data).
 * Satu sesi siswa = satu baris `records`; hasil hitungnya di `calculations`.
 */
import { Database } from 'bun:sqlite'
import type { Calculation, SessionRecord } from '../src/types.ts'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  sekolah TEXT NOT NULL,
  kelas TEXT NOT NULL,
  umur INTEGER NOT NULL CHECK (umur BETWEEN 4 AND 100),
  jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('L','P')),
  nis TEXT NOT NULL,
  selesai_pada TEXT NOT NULL,
  sumber TEXT NOT NULL CHECK (sumber IN ('aplikasi','impor')),
  UNIQUE (nama, selesai_pada)
);
CREATE TABLE IF NOT EXISTS calculations (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  kategori TEXT NOT NULL,
  bentuk TEXT NOT NULL,
  satuan_panjang TEXT NOT NULL,
  rumus TEXT NOT NULL,
  hasil REAL NOT NULL,
  waktu TEXT NOT NULL,
  input_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS calculations_record ON calculations(record_id, position);
`

export function openDb(path: string): Database {
  const db = new Database(path, { create: true })
  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')
  db.run(SCHEMA)
  return db
}

interface RecordRow {
  id: string; nama: string; sekolah: string; kelas: string; umur: number
  jenis_kelamin: 'L' | 'P'; nis: string; selesai_pada: string; sumber: 'aplikasi' | 'impor'
}
interface CalcRow {
  id: string; record_id: string; kategori: Calculation['kategori']; bentuk: Calculation['bentuk']
  satuan_panjang: Calculation['satuanPanjang']; rumus: string; hasil: number; waktu: string; input_json: string
}

/** Seluruh riwayat, urut sesuai waktu masuk, dalam bentuk yang sama dengan `SessionRecord`. */
export function listRecords(db: Database): SessionRecord[] {
  const calcs = new Map<string, Calculation[]>()
  for (const c of db.query<CalcRow, []>('SELECT * FROM calculations ORDER BY record_id, position').all()) {
    const list = calcs.get(c.record_id) ?? []
    list.push({
      id: c.id, kategori: c.kategori, bentuk: c.bentuk, input: JSON.parse(c.input_json),
      satuanPanjang: c.satuan_panjang, rumus: c.rumus, hasil: c.hasil, waktu: c.waktu,
    })
    calcs.set(c.record_id, list)
  }
  return db.query<RecordRow, []>('SELECT * FROM records ORDER BY rowid').all().map(r => ({
    id: r.id,
    biodata: { nama: r.nama, sekolah: r.sekolah, kelas: r.kelas, umur: r.umur, jenisKelamin: r.jenis_kelamin, nis: r.nis },
    calculations: calcs.get(r.id) ?? [],
    selesaiPada: r.selesai_pada,
    sumber: r.sumber,
  }))
}

/**
 * Simpan sesi dalam satu transaksi. Sesi yang id-nya sudah ada, atau yang Nama + Timestamp Selesai-nya
 * sama dengan sesi lain, dilewati (bukan error) sehingga migrasi dan impor aman diulang.
 */
export function insertRecords(db: Database, records: SessionRecord[]): { inserted: number; skipped: number } {
  const insRecord = db.prepare(
    `INSERT OR IGNORE INTO records (id, nama, sekolah, kelas, umur, jenis_kelamin, nis, selesai_pada, sumber)
     VALUES ($id, $nama, $sekolah, $kelas, $umur, $jk, $nis, $selesai, $sumber)`,
  )
  const insCalc = db.prepare(
    `INSERT INTO calculations (id, record_id, position, kategori, bentuk, satuan_panjang, rumus, hasil, waktu, input_json)
     VALUES ($id, $record, $pos, $kategori, $bentuk, $satuan, $rumus, $hasil, $waktu, $input)`,
  )
  let inserted = 0
  db.transaction(() => {
    for (const r of records) {
      const b = r.biodata
      const res = insRecord.run({
        $id: r.id, $nama: b.nama, $sekolah: b.sekolah, $kelas: b.kelas, $umur: b.umur,
        $jk: b.jenisKelamin, $nis: b.nis, $selesai: r.selesaiPada, $sumber: r.sumber,
      })
      if (res.changes === 0) continue
      inserted++
      r.calculations.forEach((c, i) => insCalc.run({
        $id: c.id, $record: r.id, $pos: i, $kategori: c.kategori, $bentuk: c.bentuk, $satuan: c.satuanPanjang,
        $rumus: c.rumus, $hasil: c.hasil, $waktu: c.waktu, $input: JSON.stringify(c.input),
      }))
    }
  })()
  return { inserted, skipped: records.length - inserted }
}

export function deleteRecord(db: Database, id: string): boolean {
  return db.run('DELETE FROM records WHERE id = ?', [id]).changes > 0
}

export function deleteAllRecords(db: Database): void {
  db.run('DELETE FROM records')
}
