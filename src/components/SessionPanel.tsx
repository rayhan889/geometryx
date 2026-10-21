import { Check, FileDown, FileSpreadsheet, FileText, UserRoundX, X } from 'lucide-react'
import type { Biodata, Calculation, SessionRecord } from '../types.ts'
import { getShape, satuanHasil } from '../lib/shapes.ts'
import { formatAngka, formatJam, isoLokal, newId } from '../lib/format.ts'
import { download, stamp, toCsv, toTxt } from '../lib/export.ts'
import { XLSX_MIME, toXlsx } from '../lib/xlsx.ts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Panel sesi siswa yang sedang berjalan (di samping kalkulator).
 * Menampilkan daftar hitungan, dan tombol: simpan sesi, ekspor sesi ini (.txt/.csv), ganti siswa.
 */
interface Props {
  biodata: Biodata
  calcs: Calculation[]
  onRemove: (id: string) => void
  onFinish: (r: SessionRecord) => void
  onReset: () => void
}

export function SessionPanel({ biodata, calcs, onRemove, onFinish, onReset }: Props) {
  // Susun sesi dari biodata + hitungan saat ini; waktu selesai diambil saat tombol ditekan
  const buat = (): SessionRecord => ({ id: newId(), biodata, calculations: calcs, selesaiPada: isoLokal(), sumber: 'aplikasi' })
  // Nama file ekspor: geometryx-<nama>-<tanggal-jam>.<ekstensi>
  const file = (ext: string) => `geometryx-${biodata.nama.trim().replace(/[^\p{L}\p{N}]+/gu, '_')}-${stamp()}.${ext}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{biodata.nama}</CardTitle>
        <p className="text-sm font-medium text-white/80">{biodata.sekolah}, kelas {biodata.kelas}, {biodata.umur} tahun</p>
      </CardHeader>
      <CardContent>
        {calcs.length === 0 ? (
          <p className="border-[3px] border-dashed border-black p-4 font-bold">Belum ada hitungan. Pilih bentuk, isi ukuran, lalu tambahkan ke sesi.</p>
        ) : (
          <ol className="grid gap-3">
            {calcs.map(c => (
              <li key={c.id} className="flex items-start justify-between gap-3 border-[3px] border-black p-3">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={c.kategori}>{c.kategori === 'luas' ? 'Luas' : 'Volume'}</Badge>
                    <strong>{getShape(c.bentuk).nama.replace(' (alas persegi panjang)', '')}</strong>
                    <span className="text-sm text-muted-foreground">{formatJam(c.waktu)}</span>
                  </div>
                  <span className="text-xl font-black">{formatAngka(c.hasil)} {satuanHasil(c.kategori, c.satuanPanjang)}</span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => onRemove(c.id)} aria-label="Hapus hitungan"><X /></Button>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="secondary" disabled={!calcs.length} onClick={() => onFinish(buat())}><Check /> Selesai dan simpan</Button>
        <Button disabled={!calcs.length} onClick={() => download(file('txt'), toTxt([buat()]), 'text/plain')}><FileText /> .txt</Button>
        <Button disabled={!calcs.length} onClick={() => download(file('csv'), toCsv([buat()]), 'text/csv')}><FileDown /> .csv</Button>
        <Button disabled={!calcs.length} onClick={async () => download(file('xlsx'), await toXlsx([buat()]), XLSX_MIME)}><FileSpreadsheet /> .xlsx</Button>
        <Button variant="ghost" onClick={onReset}><UserRoundX /> Ganti siswa</Button>
      </CardFooter>
    </Card>
  )
}
