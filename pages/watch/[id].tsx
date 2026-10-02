import { useEffect, useState, type FormEvent } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { Bookmark, Check, ChevronDown, ChevronUp, MessageCircle, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAppState } from "@/components/app-state";
import { VideoCard } from "@/components/video-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getVideo, videos, type Video } from "@/lib/videos";

type Props = { video: Video };

const starterComments = [
  { name: "Dina Maharani", color: "#d97770", when: "2 hari lalu", text: "Kontennya selalu bikin semangat. Terima kasih sudah berbagi! ✨", likes: 128 },
  { name: "Fajar Akbar", color: "#618b87", when: "3 hari lalu", text: "Penjelasannya enak diikuti dan visualnya juga keren banget. Ditunggu video berikutnya!", likes: 86 },
  { name: "Nisa Putri", color: "#856dc4", when: "5 hari lalu", text: "Baru nemu channel ini dan langsung subscribe. Suka banget pembahasannya!", likes: 43 },
];

export default function WatchPage({ video }: Props) {
  const { liked, saved, subscriptions, toggleLiked, toggleSaved, toggleSubscription, addHistory } = useAppState();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(starterComments);
  const [message, setMessage] = useState("");
  const recommendations = videos.filter((item) => item.id !== video.id && !item.short).sort((a, b) => Number(b.category === video.category) - Number(a.category === video.category)).slice(0, 9);

  useEffect(() => { addHistory(video.id); }, [video.id, addHistory]);

  const addComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setComments([{ name: "Raka Pratama", color: "#6554cb", when: "baru saja", text: comment.trim(), likes: 0 }, ...comments]);
    setComment("");
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setMessage("Link video disalin."); }
    catch { setMessage("Tidak dapat menyalin link saat ini."); }
    window.setTimeout(() => setMessage(""), 3500);
  };

  return <AppShell active="watch" wide>
    <Head><title>{video.title} - YouTube Clone</title><meta name="description" content={video.description} /></Head>
    <div className="mx-auto grid max-w-[1740px] grid-cols-1 gap-6 px-4 pb-24 pt-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-7 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black"><video key={video.id} className="h-full w-full" controls playsInline poster={video.thumbnail} preload="none" aria-label={`Pemutar video ${video.title}`}><source src="/demo-video.mp4" type="video/mp4" />Browser Anda tidak mendukung pemutaran video.</video><span className="pointer-events-none absolute left-3 top-3 rounded bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">Video demo</span></div>
        <h1 className="mt-4 text-xl font-bold leading-snug">{video.title}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Link href={`/?channel=${encodeURIComponent(video.channel)}`}><Avatar name={video.channel} color={video.avatar} className="h-10 w-10" /></Link><div className="min-w-0"><Link href={`/?channel=${encodeURIComponent(video.channel)}`} className="flex items-center gap-1 text-sm font-bold hover:underline">{video.channel}{video.verified && <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-500 text-white"><Check size={9} strokeWidth={3} /></span>}</Link><p className="text-xs text-zinc-500 dark:text-zinc-400">{video.subscribers} subscriber</p></div><Button size="sm" variant={subscriptions.includes(video.channel) ? "secondary" : "default"} className="ml-2" onClick={() => toggleSubscription(video.channel)}>{subscriptions.includes(video.channel) ? "Subscribed" : "Subscribe"}</Button></div>
          <div className="flex flex-wrap items-center gap-2"><div className="flex overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><button aria-label={liked.includes(video.id) ? "Batal suka" : "Sukai video"} aria-pressed={liked.includes(video.id)} onClick={() => toggleLiked(video.id)} className="flex h-9 items-center gap-2 border-r border-zinc-300 px-4 text-sm font-semibold hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700"><ThumbsUp size={18} fill={liked.includes(video.id) ? "currentColor" : "none"} />{video.likes}</button><button aria-label="Tidak suka" onClick={() => setMessage("Masukan kamu telah dicatat.")} className="flex h-9 w-12 items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><ThumbsDown size={18} /></button></div><Button size="sm" variant="secondary" onClick={share}><Share2 size={17} /> Bagikan</Button><Button size="sm" variant="secondary" onClick={() => toggleSaved(video.id)}><Bookmark size={17} fill={saved.includes(video.id) ? "currentColor" : "none"} /> {saved.includes(video.id) ? "Tersimpan" : "Simpan"}</Button></div>
        </div>
        <div className="mt-5 rounded-xl bg-zinc-100 p-4 text-sm dark:bg-zinc-800"><p className="font-semibold">{video.views} · {video.uploaded} <span className="ml-2 text-blue-600 dark:text-blue-400">#{video.category.toLowerCase().replaceAll(" ", "")}</span></p><p className={`mt-2 whitespace-pre-line leading-6 ${expanded ? "" : "line-clamp-2"}`}>{video.description}</p><button onClick={() => setExpanded(!expanded)} className="mt-1 flex items-center gap-1 font-semibold hover:underline">{expanded ? <>Lebih sedikit <ChevronUp size={16} /></> : <>Selengkapnya <ChevronDown size={16} /></>}</button></div>
        <section className="mt-8"><div className="mb-6 flex items-center gap-3"><h2 className="text-xl font-bold">{comments.length} Komentar</h2><MessageCircle size={20} className="text-zinc-500" /></div><form onSubmit={addComment} className="mb-8 flex items-start gap-3"><Avatar name="Raka" color="#6554cb" className="h-9 w-9" /><div className="flex-1"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tulis komentar..." aria-label="Tulis komentar" className="w-full border-b border-zinc-300 bg-transparent pb-2 text-sm outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-white" /><div className="mt-2 flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setComment("")}>Batal</Button><Button type="submit" size="sm" disabled={!comment.trim()}>Komentar</Button></div></div></form><div className="space-y-7">{comments.map((item, index) => <div key={`${item.name}-${index}`} className="flex gap-3"><Avatar name={item.name} color={item.color} className="h-9 w-9" /><div><div className="flex items-center gap-2"><span className="text-sm font-bold">{item.name}</span><span className="text-xs text-zinc-500">{item.when}</span></div><p className="mt-1 text-sm leading-6">{item.text}</p><div className="mt-2 flex items-center gap-1 text-xs text-zinc-500"><ThumbsUp size={15} /> {item.likes || ""}</div></div></div>)}</div></section>
      </div>
      <aside aria-label="Video berikutnya" className="min-w-0"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold">Berikutnya</h2><Link href="/" className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">Lihat semua</Link></div><div className="space-y-3">{recommendations.map((item) => <VideoCard key={item.id} video={item} compact />)}</div></aside>
    </div>
    {message && <div role="status" className="fixed bottom-20 left-1/2 z-[80] -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900">{message}</div>}
  </AppShell>;
}

export const getStaticPaths: GetStaticPaths = async () => ({ paths: videos.map((video) => ({ params: { id: video.id } })), fallback: false });
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const video = getVideo(String(params?.id));
  return video ? { props: { video } } : { notFound: true };
};
