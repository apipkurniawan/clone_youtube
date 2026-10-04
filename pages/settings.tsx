import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Check, ChevronRight, Clock3, Cloud, HardDrive, History, Monitor, Moon, Play, Settings2, Shield, Sun, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAppState, type PlaybackRate, type ThemePreference } from "@/components/app-state";

const themeOptions: Array<{ value: ThemePreference; label: string; description: string; icon: typeof Sun }> = [
  { value: "system", label: "Ikuti sistem", description: "Sesuai pengaturan perangkat", icon: Monitor },
  { value: "light", label: "Terang", description: "Latar terang sepanjang waktu", icon: Sun },
  { value: "dark", label: "Gelap", description: "Nyaman saat cahaya redup", icon: Moon },
];

export default function SettingsPage() {
  const { catalogSource, syncMode, history, stateReady, preferences, preferencesReady, setTheme, setPlaybackRate, setSaveHistory, clearHistory } = useAppState();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const removeHistory = async () => {
    setClearing(true);
    setError("");
    setFeedback("");
    try {
      await clearHistory();
      setConfirmClear(false);
      setFeedback("Histori tontonan berhasil dihapus.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Histori belum dapat dihapus.");
    } finally { setClearing(false); }
  };

  return <AppShell active="settings">
    <Head><title>Pengaturan - YouTube Clone</title><meta name="description" content="Atur tampilan, pemutaran, dan histori tontonan." /></Head>
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-7 lg:px-10">
      <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800"><Settings2 size={24} /></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff0033]">PREFERENSI ANDA</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Pengaturan</h1><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Perubahan disimpan otomatis di browser ini.</p></div></div>
      <div className="mt-8 grid gap-7 md:grid-cols-[180px_minmax(0,1fr)]">
        <nav aria-label="Bagian pengaturan" className="flex gap-2 overflow-x-auto pb-1 text-sm md:flex-col"><a href="#tampilan" className="whitespace-nowrap rounded-lg px-3 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">Tampilan</a><a href="#pemutaran" className="whitespace-nowrap rounded-lg px-3 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">Pemutaran</a><a href="#privasi" className="whitespace-nowrap rounded-lg px-3 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">Privasi</a><a href="#akun" className="whitespace-nowrap rounded-lg px-3 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">Akun & data</a></nav>
        <div className="space-y-6">
          <section id="tampilan" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"><div className="flex items-center gap-3"><Sun size={20} className="text-zinc-500" /><div><h2 className="text-lg font-bold">Tampilan</h2><p className="text-sm text-zinc-500">Pilih tema yang nyaman untuk menonton.</p></div></div><div role="radiogroup" aria-label="Tema tampilan" className="mt-5 grid gap-3 sm:grid-cols-3">{themeOptions.map((option) => { const Icon = option.icon; const selected = preferences.theme === option.value; return <button key={option.value} type="button" role="radio" aria-checked={selected} disabled={!preferencesReady} onClick={() => setTheme(option.value)} className={`rounded-xl border p-4 text-left transition-colors ${selected ? "border-zinc-950 bg-zinc-50 dark:border-white dark:bg-zinc-800" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"}`}><div className="flex items-center justify-between"><Icon size={20} /><span className={`flex h-5 w-5 items-center justify-center rounded-full ${selected ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "border border-zinc-300 dark:border-zinc-600"}`}>{selected && <Check size={13} />}</span></div><p className="mt-4 text-sm font-semibold">{option.label}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{option.description}</p></button>; })}</div></section>

          <section id="pemutaran" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"><div className="flex items-center gap-3"><Play size={20} className="text-zinc-500" /><div><h2 className="text-lg font-bold">Pemutaran</h2><p className="text-sm text-zinc-500">Kecepatan awal untuk setiap video yang dibuka.</p></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800"><div><label htmlFor="playback-rate" className="text-sm font-semibold">Kecepatan default</label><p className="mt-1 text-xs text-zinc-500">Berlaku juga saat pengaturan diubah ketika video sedang terbuka.</p></div><select id="playback-rate" value={preferences.playbackRate} disabled={!preferencesReady} onChange={(event) => setPlaybackRate(Number(event.target.value) as PlaybackRate)} className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900">{[0.75, 1, 1.25, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate}×{rate === 1 ? " (Normal)" : ""}</option>)}</select></div></section>

          <section id="privasi" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"><div className="flex items-center gap-3"><Shield size={20} className="text-zinc-500" /><div><h2 className="text-lg font-bold">Privasi & histori</h2><p className="text-sm text-zinc-500">Kontrol riwayat video yang dibuka.</p></div></div><div className="mt-5 flex items-center justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800"><div><p id="save-history-label" className="text-sm font-semibold">Simpan histori tontonan</p><p id="save-history-description" className="mt-1 text-xs leading-5 text-zinc-500">Jika dimatikan, video yang dibuka berikutnya tidak masuk ke histori.</p></div><button type="button" role="switch" aria-checked={preferences.saveHistory} aria-labelledby="save-history-label" aria-describedby="save-history-description" disabled={!preferencesReady} onClick={() => setSaveHistory(!preferences.saveHistory)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${preferences.saveHistory ? "bg-zinc-950 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-600"}`}><span className={`absolute left-1 top-1 h-5 w-5 rounded-full shadow-sm transition-transform ${preferences.saveHistory ? "translate-x-5 bg-white dark:bg-zinc-950" : "bg-white"}`} /></button></div><div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800"><div className="flex items-start gap-3"><Clock3 size={18} className="mt-0.5 text-zinc-500" /><div><p className="text-sm font-semibold">Hapus histori tontonan</p><p className="mt-1 text-xs text-zinc-500">{stateReady ? `${history.length} video dalam histori${syncMode === "supabase" ? " tersinkron ke Supabase" : " di browser ini"}.` : "Memuat histori..."}</p></div></div><Button type="button" variant="outline" size="sm" disabled={!stateReady || history.length === 0 || clearing} onClick={() => setConfirmClear(true)}><Trash2 size={16} /> Hapus histori</Button></div>{confirmClear && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30"><p className="text-sm font-semibold">Hapus seluruh histori tontonan?</p><p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Tindakan ini tidak dapat dibatalkan.</p><div className="mt-3 flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setConfirmClear(false)} disabled={clearing}>Batal</Button><Button type="button" size="sm" onClick={() => { void removeHistory(); }} disabled={clearing}>{clearing ? "Menghapus..." : "Ya, hapus"}</Button></div></div>}{feedback && <p role="status" className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">{feedback}</p>}{error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}</section>

          <section id="akun" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"><div className="flex items-center gap-3"><Cloud size={20} className="text-zinc-500" /><div><h2 className="text-lg font-bold">Akun & data</h2><p className="text-sm text-zinc-500">Tempat katalog dan aktivitas Anda disimpan.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900"><div className="flex items-center gap-2 text-sm font-semibold">{catalogSource === "supabase" ? <Cloud size={17} /> : <HardDrive size={17} />} Katalog video</div><p className="mt-2 text-xs leading-5 text-zinc-500">{catalogSource === "supabase" ? "Video publik berasal dari Supabase." : "Data contoh dipakai sampai katalog Supabase tersedia."}</p></div><div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900"><div className="flex items-center gap-2 text-sm font-semibold"><History size={17} /> Aktivitas</div><p className="mt-2 text-xs leading-5 text-zinc-500">{syncMode === "supabase" ? "Suka, simpan, dan histori disinkronkan ke akun Supabase aktif." : "Suka, simpan, dan histori disimpan di browser ini."}</p></div></div><Link href="/upload" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">Kelola akun kreator lewat halaman upload <ChevronRight size={16} /></Link></section>
        </div>
      </div>
    </div>
  </AppShell>;
}
