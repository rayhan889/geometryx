/**
 * Fungsi format angka, tanggal, dan waktu (lokal Indonesia), plus pembuat ID.
 * Dipakai oleh tampilan UI dan ekspor .txt/.csv agar format konsisten.
 */

/** Lokal untuk semua format. */
const LOCALE = 'id-ID'

/** Format angka ke gaya Indonesia, mis. 1539.38 -> "1.539,38". */
export function formatAngka(x: number, digits = 2): string {
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(x)
}

/** Tanggal lengkap, mis. "Rabu, 21 Oktober 2026". */
export function formatTanggal(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'full' }).format(new Date(iso))
}

/** Jam 24 jam dengan titik dua, mis. "14:32:05". */
export function formatJam(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso)).replace(/\./g, ':')
}

/** Singkatan zona waktu, mis. "WIB". */
export function formatZona(iso: string): string {
  const part = new Intl.DateTimeFormat(LOCALE, { timeZoneName: 'short' })
    .formatToParts(new Date(iso)).find(p => p.type === 'timeZoneName')
  return part?.value ?? ''
}

/** Tanggal singkat + jam, dipakai di tabel riwayat. */
export function formatTanggalJam(iso: string): string {
  return `${new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' }).format(new Date(iso))} ${formatJam(iso)}`
}

/** Tambah nol di depan, mis. 5 -> "05". */
const pad = (x: number, w = 2) => String(x).padStart(w, '0')

/**
 * Timestamp ISO 8601 waktu lokal, lengkap dengan milidetik dan selisih UTC,
 * mis. "2026-10-21T14:32:05.123+07:00". Dipakai sebagai waktu hitung dan waktu selesai.
 */
export function isoLokal(d = new Date()): string {
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const a = Math.abs(off)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`
}

/** ID unik untuk sesi dan perhitungan. */
export function newId(): string {
  return crypto.randomUUID()
}

/** Ubah kode jenis kelamin (L/P) menjadi teks yang mudah dibaca. */
export function labelJK(jk: 'L' | 'P'): string {
  return jk === 'L' ? 'Laki-laki' : 'Perempuan'
}
