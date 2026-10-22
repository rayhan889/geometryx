import { useEffect, useState } from "react";
import type { Biodata, Calculation, SessionRecord } from "./types.ts";
import {
  addRecord,
  clearRecords,
  importRecords,
  loadRecords,
  migrateLegacyRecords,
  removeRecord,
} from "./lib/storage.ts";
import { BiodataForm } from "./components/BiodataForm.tsx";
import { Calculator } from "./components/Calculator.tsx";
import { SessionPanel } from "./components/SessionPanel.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Dua halaman utama: kalkulator untuk siswa, dashboard untuk melihat riwayat dan statistik. */
type Tab = "kalkulator" | "dashboard";

/**
 * Komponen utama dan pemegang state aplikasi.
 *
 * Alur penggunaan:
 * 1. Siswa mengisi biodata (BiodataForm)  -> state `biodata` terisi.
 * 2. Siswa menghitung (Calculator) dan menambahkan hasil ke sesi -> state `calcs` bertambah.
 * 3. Siswa menekan "Selesai dan simpan" (SessionPanel) -> sesi disimpan ke SQLite lewat API lalu masuk ke `records`,
 *    form kembali ke biodata untuk siswa berikutnya.
 * 4. Dashboard membaca `records` untuk statistik, riwayat, ekspor, dan impor.
 *
 * `biodata` dan `calcs` adalah sesi yang sedang berjalan (hilang bila halaman dimuat ulang);
 * hanya `records` yang disimpan permanen (di SQLite; state `records` hanyalah salinan dari server).
 */
export default function App() {
  // Halaman yang sedang dibuka
  const [tab, setTab] = useState<Tab>("kalkulator");
  // Salinan riwayat dari server (SQLite); null = belum selesai dimuat
  const [records, setRecords] = useState<SessionRecord[] | null>(null);
  // Sesi berjalan: biodata siswa (null = belum mengisi) dan perhitungannya
  const [biodata, setBiodata] = useState<Biodata | null>(null);
  const [calcs, setCalcs] = useState<Calculation[]>([]);
  // Pesan konfirmasi setelah sesi tersimpan, dan pesan error dari server
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Muat riwayat dari server; riwayat lama di localStorage dipindahkan lebih dulu (sekali saja)
  useEffect(() => {
    migrateLegacyRecords()
      .then(loadRecords)
      .then(setRecords)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Jalankan perubahan di server; state hanya diubah bila server berhasil, agar tampilan tidak menyimpang dari database
  async function run(action: () => Promise<void>, onOk: () => void) {
    try {
      await action();
      setError("");
      onOk();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
  }

  // Dipanggil saat siswa menekan "Selesai dan simpan": simpan sesi lalu reset form
  function finish(r: SessionRecord) {
    return run(
      () => addRecord(r),
      () => {
        setRecords((p) => [...(p ?? []), r]);
        setBiodata(null);
        setCalcs([]);
        setNotice(
          `Sesi ${r.biodata.nama} tersimpan. Lihat di Dashboard dan riwayat.`,
        );
      },
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-8 grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="border-[3px] border-black bg-secondary px-4 py-2 text-3xl leading-none shadow-hard sm:text-7xl">
            GeometryX
          </h1>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList aria-label="Menu utama">
            <TabsTrigger value="kalkulator">Kalkulator</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard dan riwayat</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      <main>
        {/* Tampilan dipilih dari state: dashboard, form biodata, atau kalkulator + panel sesi */}
        {tab === "dashboard" ? (
          records === null ? (
            <Alert variant={error ? "destructive" : "default"}>
              {error || "Memuat riwayat..."}
            </Alert>
          ) : (
            <div className="grid gap-5">
              {error && <Alert variant="destructive">{error}</Alert>}
              <Dashboard
                records={records}
                onImport={async (incoming) => {
                  const res = await importRecords(incoming);
                  setRecords(await loadRecords());
                  setError("");
                  return res;
                }}
                onRemove={(id) =>
                  run(
                    () => removeRecord(id),
                    () => setRecords((p) => p?.filter((x) => x.id !== id) ?? p),
                  )
                }
                onClear={() => run(clearRecords, () => setRecords([]))}
              />
            </div>
          )
        ) : !biodata ? (
          <div className="grid gap-5">
            {error && <Alert variant="destructive">{error}</Alert>}
            {notice && <Alert>{notice}</Alert>}
            <BiodataForm
              onSubmit={(b) => {
                setBiodata(b);
                setNotice("");
              }}
            />
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
            <Calculator onAdd={(c) => setCalcs((p) => [...p, c])} />
            <SessionPanel
              biodata={biodata}
              calcs={calcs}
              onRemove={(id) => setCalcs((p) => p.filter((c) => c.id !== id))}
              onFinish={finish}
              onReset={() => {
                setBiodata(null);
                setCalcs([]);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
