/**
 * Server GeometryX: API riwayat (SQLite) + file statis `dist/`.
 * Env: PORT (3001), HOST (127.0.0.1), DB_PATH (data/geometryx.db).
 * HOST sengaja hanya localhost: API belum punya autentikasi.
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { createHandler } from './app.ts'
import { openDb } from './db.ts'

const dbPath = process.env.DB_PATH ?? path.resolve('data/geometryx.db')
mkdirSync(path.dirname(dbPath), { recursive: true })

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3001),
  hostname: process.env.HOST ?? '127.0.0.1',
  maxRequestBodySize: 20 * 1024 * 1024,
  fetch: createHandler(openDb(dbPath), path.resolve('dist')),
})
console.log(`GeometryX di ${server.url} (DB: ${dbPath})`)
