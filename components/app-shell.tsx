import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ChevronDown, Clock3, Compass, Flame, History, Home, Menu, Moon, PlaySquare, Plus, Search, Settings, Sun, ThumbsUp, Video, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/app-state";
import { VoiceSearch } from "@/components/voice-search";
import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: typeof Home; href: string; key: string };
const primary: NavItem[] = [
  { label: "Beranda", icon: Home, href: "/", key: "home" },
  { label: "Shorts", icon: PlaySquare, href: "/?feed=shorts", key: "shorts" },
  { label: "Subscription", icon: Video, href: "/?feed=subscriptions", key: "subscriptions" },
];
const personal: NavItem[] = [
  { label: "Histori", icon: History, href: "/?feed=history", key: "history" },
  { label: "Tonton nanti", icon: Clock3, href: "/?feed=saved", key: "saved" },
  { label: "Video disukai", icon: ThumbsUp, href: "/?feed=liked", key: "liked" },
];
const explore: NavItem[] = [
  { label: "Trending", icon: Flame, href: "/?feed=trending", key: "trending" },
  { label: "Musik", icon: Compass, href: "/?category=Musik", key: "Musik" },
  { label: "Gaming", icon: PlaySquare, href: "/?category=Gaming", key: "Gaming" },
];
const settingsItem: NavItem = { label: "Pengaturan", icon: Settings, href: "/settings", key: "settings" };

function Logo() {
  return <Link href="/" aria-label="YouTube Beranda" className="flex shrink-0 items-center gap-1.5">
    <span className="relative flex h-[25px] w-[36px] items-center justify-center rounded-[8px] bg-[#ff0033] shadow-sm"><span className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-white" /></span>
    <span className="tracking-[-1.4px] text-[21px] font-extrabold leading-none text-zinc-950 dark:text-white">YouTube</span><sup className="-ml-1 self-start text-[10px] text-zinc-500">ID</sup>
  </Link>;
}

export function AppShell({ children, active = "home", wide = false }: { children: ReactNode; active?: string; wide?: boolean }) {
  const { syncMode, resolvedTheme, setTheme } = useAppState();
  const profileName = syncMode === "supabase" ? "Penonton" : "Raka Pratama";
  const router = useRouter();
  const [expanded, setExpanded] = useState(!wide);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const dark = resolvedTheme === "dark";
  const [notice, setNotice] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (query) { void router.push(`/?search=${encodeURIComponent(query)}`); setMobileSearch(false); }
  };
  const submitVoiceSearch = (query: string) => {
    setSearch(query);
    setMobileSearch(false);
    void router.push(`/?search=${encodeURIComponent(query)}`);
  };
  const toggleTheme = () => {
    setTheme(dark ? "light" : "dark");
  };
  const navLink = (item: NavItem, compact = false) => {
    const Icon = item.icon;
    return <Link key={item.key} href={item.href} onClick={() => setMobileMenu(false)} title={compact ? item.label : undefined} className={cn("flex items-center gap-5 rounded-lg text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800", active === item.key ? "bg-zinc-100 font-semibold dark:bg-zinc-800" : "font-medium", compact ? "mx-auto h-[68px] w-[68px] flex-col justify-center gap-1 text-[10px]" : "h-10 px-3")}><Icon size={compact ? 21 : 20} strokeWidth={active === item.key ? 2.3 : 1.8} /><span>{item.label}</span></Link>;
  };

  return <div className="min-h-screen bg-white text-zinc-950 dark:bg-[#0f0f0f] dark:text-white">
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-3 bg-white px-4 dark:bg-[#0f0f0f] sm:px-6">
      <div className="flex min-w-[168px] items-center gap-4 lg:min-w-[224px]">
        <Button variant="ghost" size="icon" aria-label="Buka atau tutup menu" onClick={() => { if (window.innerWidth < 1024) setMobileMenu(!mobileMenu); else setExpanded(!expanded); }}><Menu size={22} /></Button>
        <Logo />
      </div>
      <form onSubmit={submitSearch} className={cn("mx-auto w-full max-w-[730px] items-center gap-4", mobileSearch ? "absolute inset-x-0 top-0 flex h-16 bg-white px-4 dark:bg-[#0f0f0f]" : "hidden sm:flex")}>
        {mobileSearch && <Button type="button" variant="ghost" size="icon" aria-label="Tutup pencarian" onClick={() => setMobileSearch(false)}><X size={20} /></Button>}
        <div className="flex h-10 min-w-0 flex-1 overflow-hidden rounded-full border border-zinc-300 shadow-inner dark:border-zinc-700">
          <input aria-label="Cari video" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Telusuri video" className="min-w-0 flex-1 bg-transparent px-5 text-[15px] outline-none placeholder:text-zinc-500" />
          <button type="submit" aria-label="Cari" className="flex w-16 items-center justify-center border-l border-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"><Search size={20} /></button>
        </div>
        <VoiceSearch onSearch={submitVoiceSearch} className="shrink-0" />
      </form>
      <div className="flex min-w-[120px] items-center justify-end gap-1 sm:min-w-[170px] sm:gap-2">
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Buka pencarian" onClick={() => setMobileSearch(true)}><Search size={21} /></Button>
        <VoiceSearch onSearch={submitVoiceSearch} variant="ghost" className="sm:hidden" />
        <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="ghost" size="icon" aria-label="Buat konten"><Plus size={23} /></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content sideOffset={10} align="end" className="z-[70] min-w-48 rounded-xl border border-zinc-200 bg-white p-1.5 text-sm shadow-xl dark:border-zinc-700 dark:bg-zinc-900"><DropdownMenu.Item onSelect={() => { void router.push("/upload"); }} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800"><Video size={18} /> Upload video</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
        <Button variant="ghost" size="icon" aria-label="Notifikasi" className="hidden sm:inline-flex" onClick={() => setNotice("Belum ada notifikasi baru.")}><Bell size={21} /></Button>
        <DropdownMenu.Root><DropdownMenu.Trigger asChild><button aria-label="Menu profil" className="ml-1 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500"><Avatar name={profileName} color="#6554cb" className="h-8 w-8" /></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content sideOffset={12} align="end" className="z-[70] w-64 rounded-xl border border-zinc-200 bg-white p-2 text-sm shadow-xl dark:border-zinc-700 dark:bg-zinc-900"><div className="flex items-center gap-3 border-b border-zinc-100 px-2 py-3 dark:border-zinc-800"><Avatar name={profileName} color="#6554cb" className="h-10 w-10" /><div><p className="font-semibold">{profileName}</p><p className="text-xs text-zinc-500">{syncMode === "supabase" ? "Tersambung ke Supabase" : "Mode demo lokal"}</p></div></div><DropdownMenu.Item onSelect={toggleTheme} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800">{dark ? <Sun size={18} /> : <Moon size={18} />} Tampilan {dark ? "terang" : "gelap"}</DropdownMenu.Item><DropdownMenu.Item onSelect={() => { void router.push("/settings"); }} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800"><Settings size={18} /> Pengaturan</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
      </div>
    </header>

    <aside className={cn("fixed bottom-0 left-0 top-16 z-40 hidden overflow-y-auto bg-white pb-6 dark:bg-[#0f0f0f] lg:block", expanded ? "w-[232px] px-3" : "w-[76px] px-1")}>
      <nav aria-label="Navigasi utama" className="space-y-0.5">{primary.map((item) => navLink(item, !expanded))}</nav>
      {expanded && <><div className="my-3 border-t border-zinc-200 dark:border-zinc-800" /><p className="mb-1 flex items-center gap-1 px-3 py-2 text-sm font-bold">Anda <ChevronDown size={16} className="-rotate-90" /></p><nav aria-label="Koleksi Anda" className="space-y-0.5">{personal.map((item) => navLink(item))}{navLink(settingsItem)}</nav><div className="my-3 border-t border-zinc-200 dark:border-zinc-800" /><p className="px-3 py-2 text-sm font-bold">Eksplorasi</p><nav aria-label="Eksplorasi" className="space-y-0.5">{explore.map((item) => navLink(item))}</nav><div className="my-3 border-t border-zinc-200 dark:border-zinc-800" /><div className="px-3 text-[11px] leading-5 text-zinc-500">Tentang · Pers · Hak cipta<br />© 2026 YouTube Clone</div></>}
    </aside>

    {mobileMenu && <><button aria-label="Tutup menu" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileMenu(false)} /><aside className="fixed bottom-0 left-0 top-0 z-50 w-[260px] overflow-y-auto bg-white p-4 shadow-xl dark:bg-zinc-950 lg:hidden"><div className="mb-6 flex items-center gap-3"><Button variant="ghost" size="icon" aria-label="Tutup menu" onClick={() => setMobileMenu(false)}><X size={20} /></Button><Logo /></div><nav aria-label="Navigasi seluler" className="space-y-1">{[...primary, ...personal, ...explore, settingsItem].map((item) => navLink(item))}</nav></aside></>}

    <main className={cn("min-h-screen pt-16 transition-[margin]", expanded ? "lg:ml-[232px]" : "lg:ml-[76px]")}>{children}</main>
    <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-30 flex h-[60px] items-center justify-around border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0f0f0f] lg:hidden">{[primary[0], primary[1], primary[2], personal[0]].map((item) => { const Icon = item.icon; return <Link key={item.key} href={item.href} className={cn("flex min-w-16 flex-col items-center gap-1 text-[10px]", active === item.key ? "font-semibold" : "text-zinc-600 dark:text-zinc-300")}><Icon size={21} strokeWidth={active === item.key ? 2.4 : 1.8} />{item.label}</Link>; })}</nav>
    {notice && <div role="status" className="fixed bottom-20 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900">{notice}<button aria-label="Tutup pesan" onClick={() => setNotice("")}><X size={16} /></button></div>}
  </div>;
}
