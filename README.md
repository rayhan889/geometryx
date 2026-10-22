# GeometryX

Aplikasi web untuk membantu siswa belajar menghitung luas bangun datar dan volume bangun ruang.

Siswa mengisi biodata (nama, sekolah, kelas, umur, jenis kelamin, dan NIS bila ada), memilih bentuk, memasukkan ukurannya, lalu melihat hasil beserta rumusnya. Sesi yang selesai disimpan di database SQLite di server dan bisa diekspor ke `.txt`, `.csv`, atau `.xlsx`. Dashboard menampilkan total dan persentase, sedangkan riwayat bisa dicari, diurutkan, dan diimpor kembali dari `.csv`.

- **Luas (2D):** persegi, segitiga, lingkaran
- **Volume (3D):** kubus, limas (alas persegi panjang), tabung
- **Ekspor:** biodata dan hasil perhitungan di bagian terpisah, lengkap dengan tanggal dan timestamp selesai
- **Pengurutan:** berdasarkan nama, sekolah, umur, atau waktu simpan
- **Bahasa:** Bahasa Indonesia

## Menjalankan

```
bun install
bun run build && bun run start   # server + aplikasi di http://127.0.0.1:3001
bun run dev:server               # pengembangan: API di :3001 (database: data/geometryx.db)
bun run dev                      # pengembangan: Vite, /api diteruskan ke :3001
bun run test                     # vitest + bun test (server)
```

Env server: `PORT` (3001), `HOST` (127.0.0.1), `DB_PATH` (`data/geometryx.db`). Berkas database (dan `-wal`/`-shm`) perlu disimpan di volume permanen dan dicadangkan.

## Privasi data

Semua data (termasuk nama dan NIS siswa) disimpan di SQLite pada server, tanpa enkripsi. Aplikasi hanya mendengarkan `127.0.0.1` secara bawaan karena API belum punya autentikasi; jangan membukanya ke jaringan umum tanpa menambahkan autentikasi. Server memvalidasi semua data sebelum disimpan. Riwayat lama di `localStorage` dipindahkan ke database sekali saat aplikasi dibuka, lalu dihapus dari browser.

Dibangun dengan React, TypeScript, Vite, Tailwind CSS, dan shadcn/ui.

## Struktur proyek

```
.
├── index.html              Kerangka halaman dan metadata SEO
├── public/                 Favicon dan robots.txt
├── server/                 API riwayat (Bun) dan SQLite
│   ├── index.ts            Titik masuk server
│   ├── app.ts              Rute /api dan file statis dist/
│   ├── db.ts               Skema dan query SQLite
│   └── db.test.ts          Pengujian API (bun test)
└── src/
    ├── main.tsx            Titik masuk aplikasi
    ├── App.tsx             Tata letak, tab, dan state sesi/riwayat
    ├── index.css           Pengaturan Tailwind dan tema
    ├── types.ts            Tipe data bersama (biodata, perhitungan, sesi)
    ├── components/
    │   ├── BiodataForm.tsx     Form biodata siswa
    │   ├── Calculator.tsx      Pilihan bentuk, isian ukuran, dan hasil
    │   ├── SessionPanel.tsx    Sesi berjalan dan tombol ekspor
    │   ├── Dashboard.tsx       Statistik, tabel riwayat, impor/ekspor
    │   ├── ShapeIcon.tsx       Ilustrasi bentuk
    │   ├── Pilih.tsx           Pembungkus dropdown
    │   └── ui/                 Komponen shadcn/ui
    └── lib/
        ├── shapes.ts       Definisi bentuk, rumus, dan validasi
        ├── format.ts       Format angka, tanggal, dan timestamp
        ├── storage.ts      Klien API riwayat dan migrasi localStorage
        ├── validate.ts     Validasi data riwayat (klien dan server)
        ├── sort.ts         Pengurutan riwayat
        ├── stats.ts        Total dan persentase
        ├── export.ts       Ekspor .txt dan .csv
        ├── xlsx.ts         Ekspor .xlsx (Excel)
        ├── import.ts       Pembacaan dan penggabungan .csv
        ├── utils.ts        Helper nama class
        └── lib.test.ts     Pengujian unit
```
