import { useState } from "react";
import { Plus } from "lucide-react";
import type { Calculation, Kategori, Satuan, ShapeId } from "../types.ts";
import {
  SATUAN,
  SHAPES,
  computeShape,
  getShape,
  satuanHasil,
  validateInput,
} from "../lib/shapes.ts";
import { formatAngka, isoLokal, newId } from "../lib/format.ts";
import { ShapeIcon } from "./ShapeIcon.tsx";
import { Pilih } from "./Pilih.tsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Nama bentuk tanpa keterangan tambahan, untuk label yang sempit. */
const short = (n: string) => n.replace(" (alas persegi panjang)", "");

/** Buang huruf, tanda minus, dan simbol lain; sisakan angka dan satu pemisah desimal (titik/koma). */
const bersihkanUkuran = (s: string) => {
  const t = s.replace(/[^\d.,]/g, "");
  const i = t.search(/[.,]/);
  return i < 0 ? t : t.slice(0, i + 1) + t.slice(i + 1).replace(/[.,]/g, "");
};

/** Ubah isian teks jadi angka; kosong atau tidak valid menjadi NaN. */
const parseUkuran = (s = "") =>
  /\d/.test(s) ? Number(s.replace(",", ".")) : NaN;

/**
 * Kalkulator luas dan volume.
 *
 * Alur:
 * 1. Pilih kategori (luas / volume) dan bentuk.
 * 2. Isi ukuran dan satuan, tekan "Hitung" -> input divalidasi lalu hasil ditampilkan beserta rumusnya.
 * 3. Tekan "Tambahkan ke sesi" -> hasil dikirim ke App lewat `onAdd`.
 * Semua rumus dan nama kolom diambil dari tabel SHAPES (lib/shapes.ts).
 */
export function Calculator({
  onAdd,
}: Readonly<{ onAdd: (c: Calculation) => void }>) {
  // kategori & bentuk: pilihan aktif; satuan: satuan panjang; vals: isian ukuran (teks)
  // err: pesan error validasi; hasil: perhitungan terakhir yang belum ditambahkan ke sesi
  const [kategori, setKategori] = useState<Kategori>("luas");
  const [bentuk, setBentuk] = useState<ShapeId>("persegi");
  const [satuan, setSatuan] = useState<Satuan>("cm");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [hasil, setHasil] = useState<Calculation | null>(null);

  const shape = getShape(bentuk);

  // Ganti kategori dan otomatis pilih bentuk pertama pada kategori itu
  function pilihKategori(k: Kategori) {
    setKategori(k);
    pilihBentuk(SHAPES.find((s) => s.kategori === k)!.id);
  }
  // Ganti bentuk dan kosongkan isian, error, serta hasil sebelumnya
  function pilihBentuk(id: ShapeId) {
    setBentuk(id);
    setVals({});
    setErr("");
    setHasil(null);
  }

  // Validasi ukuran; bila valid hitung dan tampilkan hasil, bila tidak tampilkan pesan error
  function hitung(e: React.FormEvent) {
    e.preventDefault();
    const input = Object.fromEntries(
      shape.fields.map((f) => [f.key, parseUkuran(vals[f.key])]),
    );
    const msg = validateInput(shape, input);
    if (msg) {
      setErr(msg);
      setHasil(null);
      return;
    }
    setErr("");
    setHasil({
      id: newId(),
      kategori,
      bentuk,
      input,
      satuanPanjang: satuan,
      rumus: shape.rumusTeks,
      hasil: computeShape(bentuk, input),
      waktu: isoLokal(),
    });
  }

  // Kirim hasil ke sesi lalu kosongkan isian agar siap untuk hitungan berikutnya
  function tambah() {
    if (!hasil) return;
    onAdd(hasil);
    setHasil(null);
    setVals({});
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kalkulator</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 p-4 sm:gap-6 sm:p-5">
        <Tabs
          value={kategori}
          onValueChange={(v) => pilihKategori(v as Kategori)}
        >
          <TabsList className="w-full flex-col sm:flex-row">
            <TabsTrigger value="luas" className="h-auto min-h-11 border-r-0 border-b-[3px] py-2 whitespace-normal last:border-b-0 sm:border-r-[3px] sm:border-b-0 sm:last:border-r-0">Luas bangun datar</TabsTrigger>
            <TabsTrigger value="volume" className="h-auto min-h-11 border-r-0 border-b-[3px] py-2 whitespace-normal last:border-b-0 sm:border-r-[3px] sm:border-b-0 sm:last:border-r-0">Volume bangun ruang</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {SHAPES.filter((s) => s.kategori === kategori).map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={bentuk === s.id}
              onClick={() => pilihBentuk(s.id)}
              className={cn(
                "grid min-w-0 content-start justify-items-center gap-2 border-[3px] border-black bg-white px-1 py-3 text-xs font-extrabold sm:px-2 sm:py-4 sm:text-sm transition-[transform,box-shadow] hover:bg-muted",
                bentuk === s.id &&
                  (kategori === "luas" ? "bg-luas" : "bg-volume text-white") +
                    " translate-x-[-2px] translate-y-[-2px] shadow-hard-sm hover:bg-inherit",
                bentuk === s.id && kategori === "luas" && "hover:bg-luas",
                bentuk === s.id && kategori === "volume" && "hover:bg-volume",
              )}
            >
              <ShapeIcon id={s.id} />
              <span className="text-center leading-tight break-words">{short(s.nama)}</span>
            </button>
          ))}
        </div>

        <form onSubmit={hitung} noValidate className="grid gap-5">
          <p className="border-l-8 border-black pl-3 text-xl font-black break-words sm:text-2xl [font-variation-settings:'wdth'_125]">
            {shape.rumusTeks}
          </p>
          <div className="grid gap-4 min-[480px]:grid-cols-2">
            {shape.fields.map((f) => (
              <div key={f.key} className="grid gap-2">
                <Label
                  htmlFor={`f-${f.key}`}
                  className="text-sm font-extrabold"
                >
                  {f.label}
                </Label>
                <Input
                  id={`f-${f.key}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={vals[f.key] ?? ""}
                  onChange={(e) =>
                    setVals((p) => ({
                      ...p,
                      [f.key]: bersihkanUkuran(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
            <div className="grid gap-2">
              <span className="text-sm font-extrabold">Satuan panjang</span>
              <Pilih
                label="Satuan panjang"
                value={satuan}
                onChange={setSatuan}
                options={SATUAN.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>
          {err && <Alert variant="destructive">{err}</Alert>}
          <Button type="submit" variant="default" size="lg">
            Hitung
          </Button>
        </form>

        {hasil && (
          <div
            aria-live="polite"
            className={cn(
              "grid gap-3 border-[3px] border-black p-4 shadow-hard sm:p-5",
              kategori === "luas"
                ? "bg-luas text-black"
                : "bg-volume text-white",
            )}
          >
            <p className="font-bold">{shape.substitusi(hasil.input)}</p>
            <p className="text-4xl leading-none font-black break-all [font-variation-settings:'wdth'_125] min-[480px]:text-5xl sm:text-6xl">
              {formatAngka(hasil.hasil)}{" "}
              <span className="text-2xl">{satuanHasil(kategori, satuan)}</span>
            </p>
            <Button
              onClick={tambah}
              variant="outline"
              className="w-full text-black sm:w-fit"
            >
              <Plus /> Tambahkan ke sesi
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
