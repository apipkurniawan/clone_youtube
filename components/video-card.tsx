import Link from "next/link";
import Image from "next/image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bookmark, Check, MoreVertical, ThumbsUp } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAppState } from "@/components/app-state";
import type { Video } from "@/lib/videos";

export function VideoThumbnail({ video, className = "", vertical = false }: { video: Video; className?: string; vertical?: boolean }) {
  return <div className={`group relative overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800 ${vertical ? "aspect-[9/16]" : "aspect-video"} ${className}`}>
    <Image src={video.thumbnail} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
    <span className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-xs font-semibold text-white">{video.duration}</span>
  </div>;
}

export function VideoCard({ video, compact = false }: { video: Video; compact?: boolean }) {
  const { saved, liked, toggleSaved, toggleLiked } = useAppState();
  return <article className={compact ? "flex gap-2.5" : "min-w-0"}>
    <Link href={`/watch/${video.id}`} className={compact ? "w-[45%] shrink-0" : "block"} aria-label={`Tonton ${video.title}`}><VideoThumbnail video={video} vertical={video.short && !compact} className={compact ? "rounded-lg" : ""} /></Link>
    <div className={compact ? "flex min-w-0 flex-1 gap-1 pt-0.5" : "mt-3 flex gap-3"}>
      {!compact && <Link href={`/?channel=${encodeURIComponent(video.channel)}`} aria-label={`Lihat video dari ${video.channel}`}><Avatar name={video.channel} color={video.avatar} className="h-9 w-9" /></Link>}
      <div className="min-w-0 flex-1">
        <Link href={`/watch/${video.id}`} className={`line-clamp-2 font-semibold leading-snug hover:text-zinc-700 dark:hover:text-zinc-200 ${compact ? "text-sm" : "text-[15px]"}`}>{video.title}</Link>
        <div className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400 sm:text-[13px]">
          <Link href={`/?channel=${encodeURIComponent(video.channel)}`} className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white">{video.channel}{video.verified && <span title="Terverifikasi" className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-500 text-[9px] text-white"><Check size={9} strokeWidth={3} /></span>}</Link>
          <p>{video.views} · {video.uploaded}</p>
        </div>
      </div>
      <DropdownMenu.Root><DropdownMenu.Trigger asChild><button aria-label={`Opsi video ${video.title}`} className="flex h-8 w-7 shrink-0 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><MoreVertical size={19} /></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content sideOffset={4} align="end" className="z-[60] min-w-52 rounded-xl border border-zinc-200 bg-white p-1.5 text-sm shadow-xl dark:border-zinc-700 dark:bg-zinc-900"><DropdownMenu.Item onSelect={() => toggleSaved(video.id)} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800"><Bookmark size={18} />{saved.includes(video.id) ? "Hapus dari Tonton nanti" : "Simpan ke Tonton nanti"}</DropdownMenu.Item><DropdownMenu.Item onSelect={() => toggleLiked(video.id)} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800"><ThumbsUp size={18} />{liked.includes(video.id) ? "Batal suka" : "Sukai video"}</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
    </div>
  </article>;
}
