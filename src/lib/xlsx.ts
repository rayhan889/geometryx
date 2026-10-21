import type { SessionRecord } from '../types.ts'
import { getShape, satuanHasil } from './shapes.ts'
import { formatJam, formatTanggal, formatZona, labelJK } from './format.ts'
import { HEAD_BIODATA, HEAD_HASIL, UKURAN_COLS } from './export.ts'

/** Tipe MIME file Excel (.xlsx). */
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

type Sel = string | number | null

/**
 * Buat file Excel (.xlsx) berisi dua lembar: "Biodata Siswa" dan "Hasil Perhitungan".
 * Kolomnya sama dengan ekspor .csv, tetapi sudah dirapikan: judul kolom hitam-putih tebal,
 * garis tabel, lebar kolom menyesuaikan isi, baris judul dibekukan, dan ada filter.
 * Hasil dan ukuran disimpan sebagai angka sungguhan sehingga bisa dijumlah atau diurutkan.
 * Pustaka exceljs dimuat saat dibutuhkan agar halaman awal tetap ringan.
 */
export async function toXlsx(records: SessionRecord[]): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GeometryX'
  wb.created = new Date()

  const bio: Sel[][] = records.map((r, i) => [
    i + 1, r.biodata.nama, r.biodata.sekolah, r.biodata.kelas, r.biodata.umur,
    labelJK(r.biodata.jenisKelamin), r.biodata.nis || null,
    formatTanggal(r.selesaiPada), `${formatJam(r.selesaiPada)} ${formatZona(r.selesaiPada)}`, r.selesaiPada,
  ])
  const hasil: Sel[][] = records.flatMap(r => r.calculations.map(c => ({ r, c }))).map(({ r, c }, i) => [
    i + 1, r.biodata.nama, r.selesaiPada, c.kategori === 'luas' ? 'Luas' : 'Volume',
    getShape(c.bentuk).nama, c.rumus,
    ...UKURAN_COLS.map(u => c.input[u.key] ?? null),
    c.satuanPanjang, c.hasil, satuanHasil(c.kategori, c.satuanPanjang), c.waktu,
  ])

  // Kolom angka: Umur (biodata), serta ukuran dan Hasil (hasil)
  const kolomHasil = HEAD_HASIL.indexOf('Hasil')
  const tambahLembar = (nama: string, head: string[], rows: Sel[][], angka: number[], desimal: boolean) => {
    const ws = wb.addWorksheet(nama, { views: [{ state: 'frozen', ySplit: 1 }] })
    ws.addRow(head)
    rows.forEach(r => ws.addRow(r))

    const border = { style: 'thin' as const, color: { argb: 'FF000000' } }
    head.forEach((h, i) => {
      const lebar = Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length))
      ws.getColumn(i + 1).width = Math.min(Math.max(lebar + 3, 8), 42)
    })
    ws.eachRow((row, n) => {
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.border = { top: border, left: border, bottom: border, right: border }
        cell.alignment = { vertical: 'middle', horizontal: angka.includes(col - 1) && n > 1 ? 'right' : 'left' }
        if (n === 1) {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }
        }
      })
    })
    ws.getRow(1).height = 24
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: head.length } }
    // Hasil dan ukuran tampil dengan 2-4 desimal tanpa mengubah nilai aslinya (nomor urut tetap bulat)
    if (desimal) angka.slice(1).forEach(i => { ws.getColumn(i + 1).numFmt = '#,##0.00##' })
  }

  tambahLembar('Biodata Siswa', HEAD_BIODATA, bio, [0, 4], false)
  const ukuran = UKURAN_COLS.map((_, i) => HEAD_HASIL.indexOf('Rumus') + 1 + i)
  tambahLembar('Hasil Perhitungan', HEAD_HASIL, hasil, [0, ...ukuran, kolomHasil], true)

  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>
}
