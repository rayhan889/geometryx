/** Helper shadcn/ui. */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gabungkan nama class Tailwind; class yang bentrok diselesaikan (yang terakhir menang). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
