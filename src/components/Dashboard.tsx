import { Fragment, useMemo, useRef, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { SessionRecord } from "../types.ts";
import {
  SORT_LABELS,
  sortRecords,
  type SortDir,
  type SortKey,
} from "../lib/sort.ts";
import { hitungStats } from "../lib/stats.ts";
import { download, stamp, toCsv, toTxt } from "../lib/export.ts";
import { XLSX_MIME, toXlsx } from "../lib/xlsx.ts";
import { ImportError, mergeRecords, parseCsv } from "../lib/import.ts";
import { formatAngka, formatTanggalJam } from "../lib/format.ts";
import { getShape, satuanHasil } from "../lib/shapes.ts";
import { Pilih } from "./Pilih.tsx";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Halaman dashboard: statistik, porsi perhitungan, dan riwayat sesi.
 *
 * Fitur riwayat: cari, urutkan (dropdown atau klik judul kolom), lihat rincian hitungan,
 * hapus satu sesi atau semua (dengan konfirmasi), ekspor ke .txt/.csv (sesuai hasil pencarian
 * dan urutan), dan impor file .csv (data digabung tanpa duplikat).
 */
interface Props {
  records: SessionRecord[];
  onChange: (r: SessionRecord[]) => void;
}

/** Format persen dengan satu desimal, mis. "33,3%". */
const pct = (x: number) => `${formatAngka(x, 1)}%`;
const short = (n: string) => n.replace(" (alas persegi panjang)", "");

/** Kartu angka statistik; `sub` menampilkan persentase bila ada. */
function Tile({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: number;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 border-[3px] border-black bg-white p-4 shadow-hard-sm",
        className,
      )}
    >
      <span className="font-bold">{label}</span>
      <strong className="text-6xl leading-none font-black [font-variation-settings:'wdth'_125]">
        {value}
      </strong>
      {sub && <span className="font-extrabold">{sub} dari semua hitungan</span>}
    </div>
  );
}

/** `records` adalah seluruh riwayat dari App; `onChange` menyimpan perubahan (hapus / impor). */
export function Dashboard({ records, onChange }: Props) {
  // Pengaturan urutan, pencarian, baris yang dibuka, konfirmasi hapus, pesan impor
  const [key, setKey] = useState<SortKey>("selesaiPada");
  const [dir, setDir] = useState<SortDir>("desc");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null); // ID sesi atau 'all' yang sedang menunggu konfirmasi hapus
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Statistik dihitung ulang hanya saat riwayat berubah
  const stats = useMemo(() => hitungStats(records), [records]);
  // Baris tabel: saring berdasarkan kata pencarian (nama/sekolah/kelas), lalu urutkan
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = t
      ? records.filter((r) =>
          `${r.biodata.nama} ${r.biodata.sekolah} ${r.biodata.kelas}`
            .toLowerCase()
            .includes(t),
        )
      : records;
    return sortRecords(f, key, dir);
  }, [records, q, key, dir]);

  // Klik judul kolom: kolom sama membalik arah, kolom baru mulai dari naik
  function headSort(k: SortKey) {
    if (k === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setKey(k);
      setDir("asc");
    }
  }
  // Penanda panah dan atribut aria-sort untuk kolom yang sedang dipakai mengurutkan
  const arrow = (k: SortKey) =>
    k === key ? (dir === "asc" ? " ▲" : " ▼") : "";
  const ariaSort = (k: SortKey) =>
    k === key ? (dir === "asc" ? "ascending" : "descending") : "none";

  // Impor satu atau beberapa file .csv, gabungkan ke riwayat, lalu tampilkan ringkasan atau pesan error
  async function impor(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    let all = records,
      tambah = 0,
      dup = 0;
    try {
      for (const f of files) {
        const r = mergeRecords(all, parseCsv(await f.text()));
        all = r.merged;
        tambah += r.ditambah;
        dup += r.duplikat;
      }
      onChange(all);
      setMsg({
        ok: true,
        text: `${tambah} record diimpor, ${dup} duplikat dilewati.`,
      });
    } catch (err) {
      setMsg({
        ok: false,
        text:
          err instanceof ImportError ? err.message : "Gagal membaca file CSV.",
      });
    }
  }

  // Tombol judul kolom yang bisa diklik untuk mengurutkan
  const sortBtn = (k: SortKey, label: string) => (
    <button
      className="font-extrabold underline-offset-4 hover:underline"
      onClick={() => headSort(k)}
    >
      {label}
      {arrow(k)}
    </button>
  );

  return (
    <div className="grid gap-8">
      <section
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Statistik"
      >
        <Tile label="Sesi siswa" value={stats.totalRecord} />
        <Tile label="Total hitungan" value={stats.totalHitung} />
        <Tile
          label="Luas bangun datar"
          value={stats.totalLuas}
          sub={pct(stats.persenLuas)}
          className="bg-luas"
        />
        <Tile
          label="Volume bangun ruang"
          value={stats.totalVolume}
          sub={pct(stats.persenVolume)}
          className="bg-volume text-white"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Porsi hitungan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          {stats.totalHitung === 0 ? (
            <p className="font-bold">
              Belum ada data. Selesaikan satu sesi di Kalkulator untuk mengisi
              grafik ini.
            </p>
          ) : (
            <>
              <div
                className="flex h-12 border-[3px] border-black"
                role="img"
                aria-label={`Luas ${pct(stats.persenLuas)}, volume ${pct(stats.persenVolume)}`}
              >
                <div
                  className="grid place-items-center bg-luas font-black"
                  style={{ width: `${stats.persenLuas}%` }}
                >
                  {stats.persenLuas >= 12 && pct(stats.persenLuas)}
                </div>
                <div
                  className="grid place-items-center border-l-[3px] border-black bg-volume font-black text-white"
                  style={{
                    width: `${stats.persenVolume}%`,
                    borderLeftWidth:
                      stats.persenLuas === 0 || stats.persenVolume === 0
                        ? 0
                        : 3,
                  }}
                >
                  {stats.persenVolume >= 12 && pct(stats.persenVolume)}
                </div>
              </div>
              <ul className="grid gap-3">
                {stats.perBentuk.map((b) => (
                  <li
                    key={b.id}
                    className="grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3 text-sm font-bold"
                  >
                    <span>{short(b.nama)}</span>
                    <div className="h-6 border-[3px] border-black bg-white">
                      <div
                        className={cn(
                          "h-full",
                          b.kategori === "luas" ? "bg-luas" : "bg-volume",
                        )}
                        style={{ width: `${b.persen}%` }}
                      />
                    </div>
                    <span className="text-right">
                      {b.jumlah} ({pct(b.persen)})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-[1fr_14rem_auto]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Cari nama, sekolah, atau kelas"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Cari"
                className="pl-10"
              />
            </div>
            <Pilih
              label="Urutkan berdasarkan"
              value={key}
              onChange={setKey}
              options={(Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({
                value: k,
                label: `Urut: ${SORT_LABELS[k]}`,
              }))}
            />
            <Button
              onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={dir === "asc" ? "Urutan naik" : "Urutan turun"}
            >
              {dir === "asc" ? (
                <>
                  <ArrowUpAZ /> Naik
                </>
              ) : (
                <>
                  <ArrowDownAZ /> Turun
                </>
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!rows.length}
              onClick={() =>
                download(
                  `geometryx-riwayat-${stamp()}.txt`,
                  toTxt(rows),
                  "text/plain",
                )
              }
            >
              <FileText /> Ekspor .txt
            </Button>
            <Button
              disabled={!rows.length}
              onClick={() =>
                download(
                  `geometryx-riwayat-${stamp()}.csv`,
                  toCsv(rows),
                  "text/csv",
                )
              }
            >
              <FileDown /> Ekspor .csv
            </Button>
            <Button
              disabled={!rows.length}
              onClick={async () =>
                download(
                  `geometryx-riwayat-${stamp()}.xlsx`,
                  await toXlsx(rows),
                  XLSX_MIME,
                )
              }
            >
              <FileSpreadsheet /> Ekspor .xlsx
            </Button>
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            >
              <Upload /> Impor .csv
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              hidden
              onChange={impor}
            />
            {confirm === "all" ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onChange([]);
                    setConfirm(null);
                    setMsg(null);
                  }}
                >
                  Ya, hapus semua
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(null)}>
                  Batal
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                disabled={!records.length}
                onClick={() => setConfirm("all")}
              >
                <Trash2 /> Hapus semua
              </Button>
            )}
          </div>
          {msg && (
            <Alert variant={msg.ok ? "default" : "destructive"}>
              {msg.text}
            </Alert>
          )}

          {rows.length === 0 ? (
            <p className="border-[3px] border-dashed border-black p-4 font-bold">
              {records.length
                ? "Tidak ada riwayat yang cocok dengan pencarian."
                : "Belum ada riwayat. Simpan sesi pertama atau impor file .csv."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-black hover:bg-black">
                  <TableHead aria-sort={ariaSort("nama")}>
                    {sortBtn("nama", "Nama")}
                  </TableHead>
                  <TableHead aria-sort={ariaSort("sekolah")}>
                    {sortBtn("sekolah", "Sekolah")}
                  </TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead aria-sort={ariaSort("umur")}>
                    {sortBtn("umur", "Umur")}
                  </TableHead>
                  <TableHead>Luas</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead aria-sort={ariaSort("selesaiPada")}>
                    {sortBtn("selesaiPada", "Selesai")}
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const l = r.calculations.filter(
                    (c) => c.kategori === "luas",
                  ).length;
                  return (
                    <Fragment key={r.id}>
                      <TableRow>
                        <TableCell>
                          <button
                            className="inline-flex items-center gap-1 font-extrabold"
                            onClick={() => setOpen(open === r.id ? null : r.id)}
                            aria-expanded={open === r.id}
                          >
                            {open === r.id ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                            {r.biodata.nama}
                          </button>
                        </TableCell>
                        <TableCell>{r.biodata.sekolah}</TableCell>
                        <TableCell>{r.biodata.kelas}</TableCell>
                        <TableCell>{r.biodata.umur}</TableCell>
                        <TableCell>
                          <Badge variant="luas">{l}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="volume">
                            {r.calculations.length - l}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTanggalJam(r.selesaiPada)}</TableCell>
                        <TableCell className="text-right">
                          {confirm === r.id ? (
                            <span className="inline-flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  onChange(
                                    records.filter((x) => x.id !== r.id),
                                  );
                                  setConfirm(null);
                                }}
                              >
                                Hapus
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirm(null)}
                              >
                                Batal
                              </Button>
                            </span>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setConfirm(r.id)}
                              aria-label={`Hapus ${r.biodata.nama}`}
                            >
                              <X />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {open === r.id && (
                        <TableRow className="bg-muted hover:bg-muted">
                          <TableCell colSpan={8} className="whitespace-normal">
                            {r.calculations.length === 0 ? (
                              "Tidak ada hitungan."
                            ) : (
                              <ul className="grid gap-1">
                                {r.calculations.map((c) => (
                                  <li key={c.id}>
                                    {short(getShape(c.bentuk).nama)}:{" "}
                                    {getShape(c.bentuk).substitusi(c.input)} ={" "}
                                    <strong>
                                      {formatAngka(c.hasil)}{" "}
                                      {satuanHasil(c.kategori, c.satuanPanjang)}
                                    </strong>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
