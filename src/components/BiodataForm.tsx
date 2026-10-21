import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Biodata, JenisKelamin } from '../types.ts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Pilih } from './Pilih.tsx'

/** Gaya label yang dipakai semua isian pada form. */
const lbl = 'text-sm font-extrabold'

/**
 * Form biodata siswa; langkah pertama sebelum bisa menghitung.
 * Validasi: nama, sekolah, kelas wajib diisi; umur bilangan bulat 4-99; NIS boleh kosong.
 * Bila valid, biodata dikirim ke App lewat `onSubmit`.
 */
export function BiodataForm({ onSubmit }: { onSubmit: (b: Biodata) => void }) {
  // Nilai semua isian disimpan sebagai teks sampai tombol ditekan
  const [f, setF] = useState({ nama: '', sekolah: '', kelas: '', umur: '', jenisKelamin: 'L' as JenisKelamin, nis: '' })
  const [err, setErr] = useState('')
  // Pembuat handler onChange untuk satu isian
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(p => ({ ...p, [k]: e.target.value }))

  // Validasi isian lalu kirim biodata yang sudah dirapikan (spasi di tepi dibuang)
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const umur = Number(f.umur)
    if (!f.nama.trim() || !f.sekolah.trim() || !f.kelas.trim()) return setErr('Nama, sekolah, dan kelas wajib diisi.')
    if (!Number.isInteger(umur) || umur < 4 || umur > 99) return setErr('Umur harus berupa bilangan bulat antara 4 dan 99.')
    setErr('')
    onSubmit({ nama: f.nama.trim(), sekolah: f.sekolah.trim(), kelas: f.kelas.trim(), umur, jenisKelamin: f.jenisKelamin, nis: f.nis.trim() })
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Isi biodata dulu</CardTitle></CardHeader>
      <form onSubmit={submit} noValidate>
        <CardContent className="grid gap-5">
          <p className="font-medium">Biodata ikut tersimpan bersama hasil hitungmu.</p>
          <div className="grid gap-2"><Label htmlFor="nama" className={lbl}>Nama lengkap</Label><Input id="nama" value={f.nama} onChange={set('nama')} autoComplete="name" /></div>
          <div className="grid gap-2"><Label htmlFor="sekolah" className={lbl}>Sekolah</Label><Input id="sekolah" value={f.sekolah} onChange={set('sekolah')} /></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="kelas" className={lbl}>Kelas</Label><Input id="kelas" value={f.kelas} onChange={set('kelas')} placeholder="mis. 8A" /></div>
            <div className="grid gap-2"><Label htmlFor="umur" className={lbl}>Umur (tahun)</Label><Input id="umur" type="number" inputMode="numeric" value={f.umur} onChange={set('umur')} /></div>
            <div className="grid gap-2"><span className={lbl}>Jenis kelamin</span>
              <Pilih label="Jenis kelamin" value={f.jenisKelamin} onChange={v => setF(p => ({ ...p, jenisKelamin: v }))}
                options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
            </div>
            <div className="grid gap-2"><Label htmlFor="nis" className={lbl}>NIS (boleh kosong)</Label><Input id="nis" value={f.nis} onChange={set('nis')} /></div>
          </div>
          {err && <Alert variant="destructive">{err}</Alert>}
          <Button type="submit" variant="secondary" size="lg" className="justify-between">Mulai menghitung <ArrowRight /></Button>
        </CardContent>
      </form>
    </Card>
  )
}
