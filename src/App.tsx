import { useState } from "react";
import type { Biodata, Calculation, SessionRecord } from "./types.ts";
import { loadRecords, saveRecords } from "./lib/storage.ts";
import { BiodataForm } from "./components/BiodataForm.tsx";
import { Calculator } from "./components/Calculator.tsx";
import { SessionPanel } from "./components/SessionPanel.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Tab = "kalkulator" | "dashboard";

export default function App() {
  const [tab, setTab] = useState<Tab>("kalkulator");
  const [records, setRecords] = useState<SessionRecord[]>(loadRecords);
  const [biodata, setBiodata] = useState<Biodata | null>(null);
  const [calcs, setCalcs] = useState<Calculation[]>([]);
  const [notice, setNotice] = useState("");

  function update(next: SessionRecord[]) {
    setRecords(next);
    saveRecords(next);
  }

  function finish(r: SessionRecord) {
    update([...records, r]);
    setBiodata(null);
    setCalcs([]);
    setNotice(
      `Sesi ${r.biodata.nama} tersimpan. Lihat di Dashboard dan riwayat.`,
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
        {tab === "dashboard" ? (
          <Dashboard records={records} onChange={update} />
        ) : !biodata ? (
          <div className="grid gap-5">
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
