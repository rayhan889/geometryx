/**
 * Pengingat agar siswa menghapus riwayatnya bila sudah tidak diperlukan.
 * Data hanya ada di browser perangkat ini, jadi siswa berikutnya di komputer yang sama bisa melihatnya.
 * Garis hitam-kuning di sisi kiri meniru pita peringatan; hanya itu yang dibuat mencolok.
 */
export function PengingatHapus() {
  return (
    <aside
      aria-label="Pengingat menghapus riwayat"
      className="flex border-[3px] border-black bg-white shadow-hard-sm"
    >
      <div
        aria-hidden
        className="w-4 shrink-0 border-r-[3px] border-black sm:w-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #000 0 8px, #ffe600 8px 16px)",
        }}
      />
      <div className="grid gap-1 p-4">
        <p className="font-extrabold">
          Hapus riwayatmu kalau sudah tidak dipakai
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          Nama dan NIS tersimpan di browser komputer ini, jadi orang berikutnya
          yang memakainya bisa melihatnya. Ekspor dulu bila perlu, lalu tekan{" "}
          <b>Hapus semua</b>.
        </p>
      </div>
    </aside>
  );
}
