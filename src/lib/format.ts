const LOCALE = 'id-ID'

export function formatAngka(x: number, digits = 2): string {
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(x)
}

export function formatTanggal(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'full' }).format(new Date(iso))
}

export function formatJam(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso)).replace(/\./g, ':')
}

export function formatZona(iso: string): string {
  const part = new Intl.DateTimeFormat(LOCALE, { timeZoneName: 'short' })
    .formatToParts(new Date(iso)).find(p => p.type === 'timeZoneName')
  return part?.value ?? ''
}

export function formatTanggalJam(iso: string): string {
  return `${new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' }).format(new Date(iso))} ${formatJam(iso)}`
}

const pad = (x: number, w = 2) => String(x).padStart(w, '0')

/** Local-time ISO 8601 string with milliseconds and numeric UTC offset. */
export function isoLokal(d = new Date()): string {
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const a = Math.abs(off)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`
}

export function newId(): string {
  return crypto.randomUUID()
}

export function labelJK(jk: 'L' | 'P'): string {
  return jk === 'L' ? 'Laki-laki' : 'Perempuan'
}
