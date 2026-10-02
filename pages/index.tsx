import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, Bookmark, History, Search, ThumbsUp, Video } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAppState } from "@/components/app-state";
import { VideoCard } from "@/components/video-card";
import { categories, videos, type Video as VideoType } from "@/lib/videos";
import { cn } from "@/lib/utils";

const feedTitles: Record<string, { title: string; description: string }> = {
  shorts: { title: "Shorts", description: "Pilihan video singkat untukmu" },
  subscriptions: { title: "Subscription", description: "Video terbaru dari channel favoritmu" },
  history: { title: "Histori tontonan", description: "Lanjutkan video yang pernah kamu tonton" },
  saved: { title: "Tonton nanti", description: "Video yang kamu simpan untuk nanti" },
  liked: { title: "Video disukai", description: "Semua video yang kamu sukai" },
  trending: { title: "Trending", description: "Video yang sedang ramai ditonton" },
};

export default function Home() {
  const router = useRouter();
  const { liked, saved, history, subscriptions } = useAppState();
  const feed = typeof router.query.feed === "string" ? router.query.feed : "home";
  const category = typeof router.query.category === "string" ? router.query.category : "Semua";
  const search = typeof router.query.search === "string" ? router.query.search : "";
  const channel = typeof router.query.channel === "string" ? router.query.channel : "";

  let filtered: VideoType[] = videos.filter((video) => !video.short);
  if (feed === "saved") filtered = videos.filter((video) => saved.includes(video.id));
  if (feed === "liked") filtered = videos.filter((video) => liked.includes(video.id));
  if (feed === "history") filtered = history.map((id) => videos.find((video) => video.id === id)).filter((video): video is VideoType => Boolean(video));
  if (feed === "subscriptions") filtered = videos.filter((video) => subscriptions.includes(video.channel));
  if (feed === "shorts") filtered = videos.filter((video) => video.short);
  if (feed === "trending") filtered = [videos[4], videos[3], videos[0], videos[11], videos[2], videos[10]];
  if (category !== "Semua") filtered = filtered.filter((video) => video.category === category);
  if (search) filtered = filtered.filter((video) => `${video.title} ${video.channel} ${video.category}`.toLowerCase().includes(search.toLowerCase()));
  if (channel) filtered = filtered.filter((video) => video.channel === channel);

  const title = search ? `Hasil pencarian: ${search}` : channel ? channel : feedTitles[feed]?.title ?? (category === "Semua" ? "Rekomendasi untukmu" : category);
  const subtitle = search ? `${filtered.length} video ditemukan` : channel ? `${filtered.length} video dari channel ini` : feedTitles[feed]?.description ?? (category === "Semua" ? "Temukan video menarik, dipilih khusus untukmu" : `Pilihan video ${category.toLowerCase()} untukmu`);
  const EmptyIcon = feed === "saved" ? Bookmark : feed === "liked" ? ThumbsUp : feed === "history" ? History : search ? Search : Video;

  return <AppShell active={feed === "home" ? (category === "Semua" ? "home" : category) : feed}>
    <Head><title>{title} - YouTube Clone</title><meta name="description" content="Temukan video menarik dari kreator favoritmu." /></Head>
    <div className="sticky top-16 z-20 overflow-x-auto border-b border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-[#0f0f0f]/95 sm:px-7 lg:px-8"><div className="flex min-w-max gap-2">{categories.map((item) => <Link key={item} href={item === "Semua" ? "/" : `/?category=${encodeURIComponent(item)}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors", category === item && feed === "home" && !search && !channel ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700")}>{item}</Link>)}</div></div>
    <div className="mx-auto max-w-[1720px] px-4 pb-24 pt-8 sm:px-7 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.15em] text-[#ff0033]">{feed === "home" && !search && !channel ? "UNTUK KAMU" : "JELAJAHI"}</p><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p></div>{(search || category !== "Semua" || feed !== "home" || channel) && <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">Lihat semua video <ArrowRight size={16} /></Link>}</div>
      {filtered.length ? <div className={cn("grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2", feed === "shorts" ? "max-w-6xl md:grid-cols-3 xl:grid-cols-4" : "xl:grid-cols-3 2xl:grid-cols-4")}>{filtered.map((video) => <VideoCard key={video.id} video={video} />)}</div> : <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"><EmptyIcon size={32} strokeWidth={1.5} /></div><h2 className="text-xl font-bold">{search ? "Tidak ada video yang cocok" : "Belum ada video di sini"}</h2><p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{search ? "Coba kata kunci lain untuk menemukan video yang kamu cari." : feed === "subscriptions" ? "Subscribe channel favoritmu dari halaman video untuk melihatnya di sini." : "Jelajahi video, lalu simpan atau sukai yang menarik buatmu."}</p><Link href="/" className="mt-6 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">Jelajahi video</Link></div>}
    </div>
  </AppShell>;
}
