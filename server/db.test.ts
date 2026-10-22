import { describe, expect, it } from 'bun:test'
import { createHandler } from './app.ts'
import { openDb } from './db.ts'
import type { SessionRecord } from '../src/types.ts'

const rec = (id: string, over: Partial<SessionRecord['biodata']> = {}, selesai = '2026-01-01T10:00:00+07:00'): SessionRecord => ({
  id,
  biodata: { nama: 'Ani', sekolah: 'SDN 1', kelas: '5', umur: 11, jenisKelamin: 'P', nis: '', ...over },
  calculations: [
    { id: `${id}-1`, kategori: 'luas', bentuk: 'persegi', input: { s: 4 }, satuanPanjang: 'cm', rumus: 'L = s²', hasil: 16, waktu: selesai },
    { id: `${id}-2`, kategori: 'volume', bentuk: 'kubus', input: { s: 2 }, satuanPanjang: 'cm', rumus: 'V = s³', hasil: 8, waktu: selesai },
  ],
  selesaiPada: selesai,
  sumber: 'aplikasi',
})

function setup() {
  const handler = createHandler(openDb(':memory:'), '/nonexistent')
  const call = (method: string, url: string, body?: unknown) =>
    handler(new Request(`http://x${url}`, { method, body: body === undefined ? undefined : JSON.stringify(body) }))
  return { call }
}

describe('API riwayat', () => {
  it('menyimpan dan membaca kembali sesi persis sama', async () => {
    const { call } = setup()
    const r = rec('a')
    expect((await call('POST', '/api/records', r)).status).toBe(201)
    expect(await (await call('GET', '/api/records')).json()).toEqual([r])
  })

  it('menolak data tidak valid', async () => {
    const { call } = setup()
    expect((await call('POST', '/api/records', rec('a', { umur: 3 }))).status).toBe(400)
    expect((await call('POST', '/api/records', { ...rec('b'), calculations: [{ ...rec('b').calculations[0], kategori: 'volume' }] })).status).toBe(400)
    expect((await call('POST', '/api/records/bulk', { records: [rec('c'), { id: 'x' }] })).status).toBe(400)
    expect(await (await call('GET', '/api/records')).json()).toEqual([])
  })

  it('melewati duplikat (id sama, atau nama + waktu selesai sama)', async () => {
    const { call } = setup()
    expect((await call('POST', '/api/records', rec('a'))).status).toBe(201)
    expect((await call('POST', '/api/records', rec('a'))).status).toBe(409)
    const res = await call('POST', '/api/records/bulk', { records: [rec('a'), rec('b'), rec('c', {}, '2026-01-02T10:00:00+07:00')] })
    expect(await res.json()).toEqual({ inserted: 1, skipped: 2 })
  })

  it('menghapus satu sesi beserta perhitungannya, dan semua', async () => {
    const { call } = setup()
    await call('POST', '/api/records/bulk', { records: [rec('a'), rec('b', {}, '2026-01-02T10:00:00+07:00')] })
    expect((await call('DELETE', '/api/records/a')).status).toBe(204)
    expect((await call('DELETE', '/api/records/a')).status).toBe(404)
    expect(((await (await call('GET', '/api/records')).json()) as SessionRecord[]).map(r => r.id)).toEqual(['b'])
    expect((await call('DELETE', '/api/records')).status).toBe(204)
    expect(await (await call('GET', '/api/records')).json()).toEqual([])
  })
})
