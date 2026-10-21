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

const short = (n: string) => n.replace(" (alas persegi panjang)", "");

export function Calculator({
  onAdd,
}: Readonly<{ onAdd: (c: Calculation) => void }>) {
  const [kategori, setKategori] = useState<Kategori>("luas");
  const [bentuk, setBentuk] = useState<ShapeId>("persegi");
  const [satuan, setSatuan] = useState<Satuan>("cm");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [hasil, setHasil] = useState<Calculation | null>(null);

  const shape = getShape(bentuk);

  function pilihKategori(k: Kategori) {
    setKategori(k);
    pilihBentuk(SHAPES.find((s) => s.kategori === k)!.id);
  }
  function pilihBentuk(id: ShapeId) {
    setBentuk(id);
    setVals({});
    setErr("");
    setHasil(null);
  }

  function hitung(e: React.FormEvent) {
    e.preventDefault();
    const input = Object.fromEntries(
      shape.fields.map((f) => [f.key, Number(vals[f.key])]),
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
      <CardContent className="grid gap-6">
        <Tabs
          value={kategori}
          onValueChange={(v) => pilihKategori(v as Kategori)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="luas">Luas bangun datar</TabsTrigger>
            <TabsTrigger value="volume">Volume bangun ruang</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-3 gap-3">
          {SHAPES.filter((s) => s.kategori === kategori).map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={bentuk === s.id}
              onClick={() => pilihBentuk(s.id)}
              className={cn(
                "grid justify-items-center gap-2 border-[3px] border-black bg-white px-2 py-4 text-sm font-extrabold transition-[transform,box-shadow] hover:bg-muted",
                bentuk === s.id &&
                  (kategori === "luas" ? "bg-luas" : "bg-volume text-white") +
                    " translate-x-[-2px] translate-y-[-2px] shadow-hard-sm hover:bg-inherit",
                bentuk === s.id && kategori === "luas" && "hover:bg-luas",
                bentuk === s.id && kategori === "volume" && "hover:bg-volume",
              )}
            >
              <ShapeIcon id={s.id} />
              <span className="text-center leading-tight">{short(s.nama)}</span>
            </button>
          ))}
        </div>

        <form onSubmit={hitung} noValidate className="grid gap-5">
          <p className="border-l-8 border-black pl-3 text-2xl font-black [font-variation-settings:'wdth'_125]">
            {shape.rumusTeks}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
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
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={vals[f.key] ?? ""}
                  onChange={(e) =>
                    setVals((p) => ({ ...p, [f.key]: e.target.value }))
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
              "grid gap-3 border-[3px] border-black p-5 shadow-hard",
              kategori === "luas"
                ? "bg-luas text-black"
                : "bg-volume text-white",
            )}
          >
            <p className="font-bold">{shape.substitusi(hasil.input)}</p>
            <p className="text-5xl leading-none font-black break-all [font-variation-settings:'wdth'_125] sm:text-6xl">
              {formatAngka(hasil.hasil)}{" "}
              <span className="text-2xl">{satuanHasil(kategori, satuan)}</span>
            </p>
            <Button
              onClick={tambah}
              variant="outline"
              className="w-fit text-black"
            >
              <Plus /> Tambahkan ke sesi
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
