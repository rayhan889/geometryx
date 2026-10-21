import type { ShapeId } from '../types.ts'

/** Gaya garis bersama untuk semua ikon bentuk. */
const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinejoin: 'miter', strokeLinecap: 'butt' } as const

/** Gambar garis sederhana untuk tiap bentuk; ukuran bisa diatur lewat `size`. */
export function ShapeIcon({ id, size = 52 }: { id: ShapeId; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" {...common}>
      {id === 'persegi' && <rect x="9" y="9" width="30" height="30" />}
      {id === 'segitiga' && <path d="M24 7 L43 40 H5 Z" />}
      {id === 'lingkaran' && <circle cx="24" cy="24" r="16" />}
      {id === 'kubus' && <><rect x="6" y="18" width="24" height="24" /><path d="M6 18 L16 8 H40 V32 L30 42 M30 18 L40 8" /></>}
      {id === 'limas' && <><path d="M24 5 L43 34 L24 43 L5 34 Z" /><path d="M24 5 V43 M5 34 L43 34" strokeDasharray="4 3" /></>}
      {id === 'tabung' && <><ellipse cx="24" cy="12" rx="15" ry="6" /><path d="M9 12 V36 A15 6 0 0 0 39 36 V12" /></>}
    </svg>
  )
}
