/**
 * API riwayat dan file statis hasil build (`dist/`).
 * Dipisah dari `index.ts` agar bisa diuji tanpa membuka port.
 */
import type { Database } from 'bun:sqlite'
import path from 'node:path'
import { isRecord } from '../src/lib/validate.ts'
import { deleteAllRecords, deleteRecord, insertRecords, listRecords } from './db.ts'

const json = (body: unknown, status = 200) => Response.json(body, { status })
const fail = (status: number, error: string) => json({ error }, status)

/** Baca body JSON; `undefined` bila bukan JSON yang valid. */
async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

async function api(req: Request, url: URL, db: Database): Promise<Response> {
  const { pathname } = url
  const method = req.method

  if (pathname === '/api/records') {
    if (method === 'GET') return json(listRecords(db))
    if (method === 'POST') {
      const body = await readJson(req)
      if (!isRecord(body)) return fail(400, 'Data sesi tidak valid.')
      try {
        const { inserted } = insertRecords(db, [body])
        return inserted ? json(body, 201) : fail(409, 'Sesi ini sudah tersimpan.')
      } catch {
        return fail(409, 'Sesi ini bertabrakan dengan data yang sudah ada.')
      }
    }
    if (method === 'DELETE') {
      deleteAllRecords(db)
      return new Response(null, { status: 204 })
    }
    return fail(405, 'Metode tidak didukung.')
  }

  if (pathname === '/api/records/bulk' && method === 'POST') {
    const body = await readJson(req)
    const records = (body as { records?: unknown } | undefined)?.records
    if (!Array.isArray(records) || !records.every(isRecord)) return fail(400, 'Data sesi tidak valid.')
    try {
      return json(insertRecords(db, records))
    } catch {
      return fail(409, 'Data bertabrakan dengan data yang sudah ada.')
    }
  }

  const one = pathname.match(/^\/api\/records\/([^/]+)$/)
  if (one && method === 'DELETE') {
    return deleteRecord(db, decodeURIComponent(one[1])) ? new Response(null, { status: 204 }) : fail(404, 'Sesi tidak ditemukan.')
  }

  return fail(404, 'Tidak ditemukan.')
}

/** Layani file dari `dist/`; rute lain jatuh ke index.html (SPA). */
async function serveStatic(pathname: string, dist: string): Promise<Response> {
  const file = path.join(dist, pathname === '/' ? 'index.html' : pathname)
  if (file.startsWith(dist + path.sep)) {
    const f = Bun.file(file)
    if (await f.exists()) return new Response(f)
  }
  const index = Bun.file(path.join(dist, 'index.html'))
  return (await index.exists()) ? new Response(index) : fail(404, 'Jalankan `bun run build` dulu.')
}

export function createHandler(db: Database, dist: string) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url)
    if (url.pathname.startsWith('/api/')) {
      try {
        return await api(req, url, db)
      } catch {
        return fail(500, 'Kesalahan server.')
      }
    }
    return serveStatic(url.pathname, dist)
  }
}
