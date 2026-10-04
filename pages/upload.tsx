import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, CloudUpload, FileVideo2, HardDrive, LoaderCircle, Play, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAppState } from "@/components/app-state";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { saveLocalUpload } from "@/lib/client/local-uploads";
import { blobToDataUrl, MAX_VIDEO_BYTES, prepareVideo, uploadMedia } from "@/lib/client/video-upload";
import { categories, type Video } from "@/lib/videos";

type Prepared = { durationSeconds: number; thumbnail: Blob; thumbnailDataUrl: string };
type StorageMode = "supabase" | "local";
const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const fieldClass = "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-zinc-700 dark:bg-zinc-900";

export default function UploadPage() {
  const router = useRouter();
  const { addLocalVideo, refreshCatalog } = useAppState();
  const [storageMode, setStorageMode] = useState<StorageMode>(configured ? "supabase" : "local");
  const [creator, setCreator] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [channelName, setChannelName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Lifestyle");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const uploadControllerRef = useRef<AbortController | null>(null);
  const previewRef = useRef("");
  const selectionRef = useRef(0);
  const uploadIdRef = useRef("");

  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client) return;
    let active = true;
    void client.auth.getUser().then(({ data }) => { if (active) setCreator(data.user?.is_anonymous ? null : data.user); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setCreator(session?.user && !session.user.is_anonymous ? session.user : null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => () => {
    uploadControllerRef.current?.abort();
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    const selection = ++selectionRef.current;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setPreviewUrl("");
    setFile(null);
    setPrepared(null);
    setError("");
    uploadIdRef.current = "";
    if (!selected) return;
    if (selected.type !== "video/mp4" || selected.size === 0 || selected.size > MAX_VIDEO_BYTES) {
      setError("Pilih file MP4 berukuran maksimal 100 MB.");
      event.target.value = "";
      return;
    }
    setPreparing(true);
    try {
      const media = await prepareVideo(selected);
      const thumbnailDataUrl = await blobToDataUrl(media.thumbnail);
      if (selection !== selectionRef.current) return;
      const url = URL.createObjectURL(selected);
      previewRef.current = url;
      setPreviewUrl(url);
      setFile(selected);
      setPrepared({ ...media, thumbnailDataUrl });
      if (!title) setTitle(selected.name.replace(/\.mp4$/i, "").replaceAll(/[-_]/g, " ").slice(0, 120));
    } catch (cause) {
      if (selection === selectionRef.current) setError(cause instanceof Error ? cause.message : "Video tidak dapat dibaca.");
    } finally {
      if (selection === selectionRef.current) setPreparing(false);
    }
  };

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = getBrowserSupabase();
    if (!client) return;
    setAuthBusy(true);
    setError("");
    setMessage("");
    try {
      if (authMode === "register") {
        const { data, error: authError } = await client.auth.signUp({ email, password, options: { data: { display_name: channelName.trim() || email.split("@")[0] } } });
        if (authError) throw authError;
        if (!data.session) setMessage("Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.");
        else setCreator(data.user);
      } else {
        const { data, error: authError } = await client.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setCreator(data.user);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Autentikasi gagal."); }
    finally { setAuthBusy(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !prepared || preparing || busy) return;
    const cleanTitle = title.trim();
    if (cleanTitle.length < 3 || cleanTitle.length > 120 || description.trim().length > 5000) { setError("Judul harus 3–120 karakter dan deskripsi maksimal 5.000 karakter."); return; }
    setBusy(true);
    setProgress(0);
    setError("");
    setMessage("");
    try {
      const controller = new AbortController();
      uploadControllerRef.current = controller;
      const id = uploadIdRef.current || crypto.randomUUID();
      uploadIdRef.current = id;
      if (storageMode === "local") {
        setStage("Menyimpan video di browser...");
        const duration = `${Math.floor(prepared.durationSeconds / 60)}:${String(Math.floor(prepared.durationSeconds % 60)).padStart(2, "0")}`;
        const video: Video = {
          id: `local-${id}`, title: cleanTitle, description: description.trim(), category,
          channel: "Kanal Saya", handle: "@kanalsaya", avatar: "#6554cb",
          thumbnail: prepared.thumbnailDataUrl, duration, views: "0 x ditonton",
          uploaded: "baru saja", subscribers: "0", likes: "0", videoUrl: undefined,
        };
        await saveLocalUpload(video, file);
        addLocalVideo(video);
        setProgress(100);
        await router.push(`/watch/${video.id}`);
        return;
      }

      const client = getBrowserSupabase();
      if (!client || !creator) throw new Error("Masuk dengan akun kreator terlebih dahulu.");
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError || !session?.access_token || session.user.is_anonymous) throw new Error("Sesi kreator tidak tersedia. Silakan masuk lagi.");
      const prefix = `${session.user.id}/${id}`;
      const bucket = client.storage.from("video-public");
      setStage("Mengunggah video...");
      const { data: existingVideo } = await bucket.info(`${prefix}/video.mp4`);
      if (!existingVideo) await uploadMedia(file, `${prefix}/video.mp4`, session.access_token, controller.signal, (value) => setProgress(Math.round(value * 0.9)));
      if (controller.signal.aborted) throw new Error("Upload dibatalkan.");
      setProgress(90);
      setStage("Mengunggah thumbnail...");
      const { data: existingThumbnail } = await bucket.info(`${prefix}/thumbnail.jpg`);
      if (!existingThumbnail) await uploadMedia(prepared.thumbnail, `${prefix}/thumbnail.jpg`, session.access_token, controller.signal, (value) => setProgress(90 + Math.round(value * 0.09)));
      if (controller.signal.aborted) throw new Error("Upload dibatalkan.");
      setStage("Mempublikasikan video...");
      const response = await fetch("/api/uploads", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, title: cleanTitle, description: description.trim(), category, durationSeconds: prepared.durationSeconds }),
      });
      const result = await response.json() as { watchUrl?: string; error?: string };
      if (!response.ok || !result.watchUrl) throw new Error(result.error ?? "Publikasi video gagal.");
      setProgress(100);
      try { await refreshCatalog(); } catch (refreshError) { console.error("Catalog refresh failed:", refreshError); }
      await router.push(result.watchUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload gagal. Coba lagi.");
    } finally { uploadControllerRef.current = null; setBusy(false); setStage(""); }
  };

  return <AppShell active="upload" wide>
    <Head><title>Upload video - YouTube Clone</title><meta name="description" content="Unggah video ke kanal Anda." /></Head>
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-7 lg:px-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-white"><ArrowLeft size={17} /> Kembali ke beranda</Link>
      <div className="mt-7 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff0033]">CREATOR STUDIO</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Upload video</h1><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Pilih MP4, lengkapi detail, lalu terbitkan ke katalog.</p></div><div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold dark:bg-zinc-800">{storageMode === "local" ? <HardDrive size={16} /> : <ShieldCheck size={16} />}{storageMode === "local" ? "Mode demo lokal" : "Supabase Storage"}</div></div>

      {configured && <div className="mt-7 flex flex-wrap gap-2 rounded-2xl bg-zinc-100 p-1.5 dark:bg-zinc-800"><button type="button" disabled={busy} onClick={() => setStorageMode("supabase")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${storageMode === "supabase" ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"}`}>Publikasikan lewat Supabase</button><button type="button" disabled={busy} onClick={() => setStorageMode("local")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${storageMode === "local" ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"}`}>Coba di browser ini</button></div>}

      {storageMode === "supabase" && !creator && <div className="mt-7 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 sm:p-6"><h2 className="text-lg font-bold">Masuk sebagai kreator</h2><p className="mt-1 text-sm text-zinc-500">Akun permanen diperlukan untuk menerbitkan video. Sesi penonton anonim tidak dapat mengunggah.</p><form onSubmit={authenticate} className="mt-5 grid gap-3 sm:grid-cols-2">{authMode === "register" && <label className="text-sm font-medium sm:col-span-2">Nama kanal<input className={`${fieldClass} mt-1`} value={channelName} onChange={(event) => setChannelName(event.target.value)} maxLength={60} placeholder="Nama kanal Anda" /></label>}<label className="text-sm font-medium">Email<input type="email" required className={`${fieldClass} mt-1`} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label className="text-sm font-medium">Kata sandi<input type="password" required minLength={6} className={`${fieldClass} mt-1`} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={authMode === "register" ? "new-password" : "current-password"} /></label><div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Button type="submit" disabled={authBusy}>{authBusy ? "Memproses..." : authMode === "register" ? "Buat akun" : "Masuk"}</Button><button type="button" className="text-sm font-semibold text-blue-600 hover:underline" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>{authMode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}</button></div></form></div>}
      {storageMode === "supabase" && creator && <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30"><span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600" /> Masuk sebagai <strong>{creator.email}</strong></span><button type="button" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400" onClick={() => { void getBrowserSupabase()?.auth.signOut(); }}>Keluar</button></div>}

      <form onSubmit={submit} className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-6"><section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 sm:p-6"><h2 className="text-lg font-bold">1. Pilih video</h2><p className="mt-1 text-sm text-zinc-500">MP4 hingga 100 MB. Thumbnail dibuat otomatis dari video.</p><label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 text-center hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"><CloudUpload size={28} className="text-zinc-500" /><span className="text-sm font-semibold">{preparing ? "Menyiapkan video..." : file ? file.name : "Klik untuk memilih file video"}</span><span className="text-xs text-zinc-500">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "Video tersimpan di Supabase atau browser sesuai mode yang dipilih"}</span><input type="file" accept="video/mp4,.mp4" className="sr-only" onChange={chooseFile} disabled={busy} /></label></section>
          <section className="space-y-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 sm:p-6"><div><h2 className="text-lg font-bold">2. Detail video</h2><p className="mt-1 text-sm text-zinc-500">Judul dan kategori membantu penonton menemukan video Anda.</p></div><label className="block text-sm font-semibold">Judul<input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className={`${fieldClass} mt-1.5`} placeholder="Judul video" /></label><label className="block text-sm font-semibold">Deskripsi<textarea rows={5} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} className={`${fieldClass} mt-1.5 resize-y`} placeholder="Ceritakan isi video Anda" /></label><label className="block text-sm font-semibold">Kategori<select value={category} onChange={(event) => setCategory(event.target.value)} className={`${fieldClass} mt-1.5`}>{categories.filter((item) => item !== "Semua").map((item) => <option key={item}>{item}</option>)}</select></label></section>
          {message && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">{message}</p>}{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
          {busy && <div role="status" className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800"><div className="flex justify-between text-sm font-semibold"><span>{stage}</span><span>{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"><div className="h-full rounded-full bg-[#ff0033] transition-[width]" style={{ width: `${progress}%` }} /></div></div>}
          <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!file || !prepared || preparing || busy || (storageMode === "supabase" && !creator)} className="h-11 px-6">{busy ? <><LoaderCircle size={18} className="animate-spin" /> Mengunggah...</> : <><CloudUpload size={18} /> {storageMode === "local" ? "Simpan video demo" : "Upload dan publikasikan"}</>}</Button>{busy && storageMode === "supabase" && stage !== "Mempublikasikan video..." && <Button type="button" variant="outline" onClick={() => uploadControllerRef.current?.abort()}><X size={16} /> Batalkan</Button>}</div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start"><div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"><div className="aspect-video bg-zinc-100 dark:bg-zinc-800">{previewUrl ? <video src={previewUrl} poster={prepared?.thumbnailDataUrl} controls className="h-full w-full" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400"><FileVideo2 size={36} /><span className="text-xs">Pratinjau video</span></div>}</div><div className="p-4"><p className="line-clamp-2 font-semibold">{title || "Judul video Anda"}</p><p className="mt-1 text-xs text-zinc-500">{prepared ? `${Math.floor(prepared.durationSeconds / 60)}:${String(Math.floor(prepared.durationSeconds % 60)).padStart(2, "0")}` : "0:00"} · {category}</p><p className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-500">{storageMode === "local" ? <HardDrive size={16} className="shrink-0" /> : <Play size={16} className="shrink-0" />}{storageMode === "local" ? "Video demo hanya tersedia di browser ini dan bergantung pada ruang penyimpanan perangkat." : "Setelah unggah selesai, video langsung tampil di katalog publik."}</p></div></div></aside>
      </form>
    </div>
  </AppShell>;
}
