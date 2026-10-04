import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/client/supabase";
import { getLocalUploads } from "@/lib/client/local-uploads";
import { videos as demoVideos, type Video } from "@/lib/videos";

type StoredState = { liked: string[]; saved: string[]; history: string[]; subscriptions: string[] };
type ActionKind = "like" | "save" | "history" | "subscribe";
export type ThemePreference = "system" | "light" | "dark";
export type PlaybackRate = 0.75 | 1 | 1.25 | 1.5 | 2;
type Preferences = { theme: ThemePreference; playbackRate: PlaybackRate; saveHistory: boolean };
type AppState = StoredState & {
  catalog: Video[];
  catalogSource: "dummy" | "supabase";
  catalogReady: boolean;
  stateReady: boolean;
  syncMode: "local" | "supabase";
  preferences: Preferences;
  resolvedTheme: "light" | "dark";
  preferencesReady: boolean;
  setTheme: (theme: ThemePreference) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  setSaveHistory: (enabled: boolean) => void;
  clearHistory: () => Promise<void>;
  toggleLiked: (id: string) => void;
  toggleSaved: (id: string) => void;
  toggleSubscription: (channel: string) => void;
  addHistory: (id: string) => void;
  addLocalVideo: (video: Video) => void;
  refreshCatalog: () => Promise<void>;
};

const initialState: StoredState = { liked: [], saved: [], history: [], subscriptions: [] };
const initialPreferences: Preferences = { theme: "system", playbackRate: 1, saveHistory: true };
const StateContext = createContext<AppState | null>(null);
const storageKey = "youtube-clone-state";
const preferencesKey = "youtube-clone-preferences";
const syncedKey = `youtube-clone-state-synced:${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "local"}`;

function mergeState(local: StoredState, remote: StoredState): StoredState {
  return {
    liked: [...new Set([...local.liked, ...remote.liked])],
    saved: [...new Set([...local.saved, ...remote.saved])],
    history: [...new Set([...local.history, ...remote.history])].slice(0, 30),
    subscriptions: [...new Set([...local.subscriptions, ...remote.subscriptions])],
  };
}

async function sendAction(kind: ActionKind, id: string, active = true) {
  const token = await getAccessToken();
  if (!token) throw new Error("Sesi Supabase tidak tersedia");
  const response = await fetch("/api/library", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ kind, id, active }),
  });
  if (!response.ok) throw new Error(`Gagal menyinkronkan aktivitas (${response.status})`);
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredState>(initialState);
  const [catalog, setCatalog] = useState<Video[]>(demoVideos);
  const [catalogSource, setCatalogSource] = useState<"dummy" | "supabase">("dummy");
  const [catalogReady, setCatalogReady] = useState(false);
  const [stateReady, setStateReady] = useState(false);
  const [syncMode, setSyncMode] = useState<"local" | "supabase">("local");
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [systemDark, setSystemDark] = useState(false);
  const resolvedTheme = preferences.theme === "system" ? (systemDark ? "dark" : "light") : preferences.theme;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    const timer = window.setTimeout(() => {
      onChange();
      try {
        const stored = JSON.parse(localStorage.getItem(preferencesKey) ?? "{}") as Partial<Preferences>;
        setPreferences({
          theme: stored.theme === "dark" || stored.theme === "light" ? stored.theme : "system",
          playbackRate: [0.75, 1, 1.25, 1.5, 2].includes(Number(stored.playbackRate)) ? Number(stored.playbackRate) as PlaybackRate : 1,
          saveHistory: typeof stored.saveHistory === "boolean" ? stored.saveHistory : true,
        });
      } catch { setPreferences(initialPreferences); }
      setPreferencesReady(true);
    }, 0);
    return () => { media.removeEventListener("change", onChange); window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  }, [preferences, preferencesReady, resolvedTheme]);

  const setTheme = useCallback((theme: ThemePreference) => setPreferences((current) => ({ ...current, theme })), []);
  const setPlaybackRate = useCallback((playbackRate: PlaybackRate) => setPreferences((current) => ({ ...current, playbackRate })), []);
  const setSaveHistory = useCallback((saveHistory: boolean) => setPreferences((current) => ({ ...current, saveHistory })), []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      let local = initialState;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) local = { ...initialState, ...JSON.parse(stored) };
      } catch { /* Ignore invalid local data. */ }
      if (!cancelled) setState(local);
      if (!cancelled) setCatalog([...getLocalUploads(), ...demoVideos]);

      try {
        const catalogResponse = await fetch("/api/videos", { signal: AbortSignal.timeout(10000) });
        if (!catalogResponse.ok) throw new Error("Katalog tidak tersedia");
        const result = await catalogResponse.json() as { videos: Video[]; source: "dummy" | "supabase" };
        if (cancelled) return;
        setCatalog([...getLocalUploads(), ...result.videos]);
        setCatalogSource(result.source);
        setCatalogReady(true);

        if (result.source === "supabase") {
          const token = await getAccessToken();
          if (!token) throw new Error("Sesi anonim tidak tersedia");
          const response = await fetch("/api/library", { headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) throw new Error("Aktivitas Supabase tidak tersedia");
          const remote = (await response.json() as { state: StoredState }).state;
          const validIds = new Set(result.videos.map((video) => video.id));
          const validChannels = new Set(result.videos.map((video) => video.channel));
          const transferableLocal: StoredState = {
            liked: local.liked.filter((id) => validIds.has(id)),
            saved: local.saved.filter((id) => validIds.has(id)),
            history: local.history.filter((id) => validIds.has(id)),
            subscriptions: local.subscriptions.filter((channel) => validChannels.has(channel)),
          };
          const alreadySynced = localStorage.getItem(syncedKey) === "true";
          const localOnly: StoredState = {
            liked: local.liked.filter((id) => id.startsWith("local-")),
            saved: local.saved.filter((id) => id.startsWith("local-")),
            history: local.history.filter((id) => id.startsWith("local-")),
            subscriptions: [],
          };
          const next = mergeState(localOnly, alreadySynced ? remote : mergeState(transferableLocal, remote));
          if (!alreadySynced) {
            const missing: Array<Promise<void>> = [];
            for (const id of transferableLocal.liked.filter((id) => !remote.liked.includes(id))) missing.push(sendAction("like", id));
            for (const id of transferableLocal.saved.filter((id) => !remote.saved.includes(id))) missing.push(sendAction("save", id));
            for (const id of transferableLocal.history.filter((id) => !remote.history.includes(id))) missing.push(sendAction("history", id));
            for (const channel of transferableLocal.subscriptions.filter((item) => !remote.subscriptions.includes(item))) missing.push(sendAction("subscribe", channel));
            await Promise.all(missing);
          }
          if (cancelled) return;
          setState(next);
          setSyncMode("supabase");
          localStorage.setItem(syncedKey, "true");
        }
      } catch (error) {
        console.error("Using local demo state:", error);
        if (!cancelled) setCatalogReady(true);
      } finally {
        if (!cancelled) setStateReady(true);
      }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (stateReady) localStorage.setItem(storageKey, JSON.stringify(state));
  }, [stateReady, state]);

  const sync = useCallback((kind: ActionKind, id: string, active = true) => {
    if (id.startsWith("local-")) return;
    if (syncMode !== "supabase") {
      localStorage.removeItem(syncedKey);
      return;
    }
    void sendAction(kind, id, active).catch((error) => {
      console.error("Switching activity storage to local mode:", error);
      setSyncMode("local");
      localStorage.removeItem(syncedKey);
    });
  }, [syncMode]);

  const toggleLiked = useCallback((id: string) => {
    const active = !state.liked.includes(id);
    setState((current) => ({ ...current, liked: active ? [...current.liked, id] : current.liked.filter((item) => item !== id) }));
    sync("like", id, active);
  }, [state.liked, sync]);

  const toggleSaved = useCallback((id: string) => {
    const active = !state.saved.includes(id);
    setState((current) => ({ ...current, saved: active ? [...current.saved, id] : current.saved.filter((item) => item !== id) }));
    sync("save", id, active);
  }, [state.saved, sync]);

  const toggleSubscription = useCallback((channel: string) => {
    const active = !state.subscriptions.includes(channel);
    setState((current) => ({ ...current, subscriptions: active ? [...current.subscriptions, channel] : current.subscriptions.filter((item) => item !== channel) }));
    sync("subscribe", channel, active);
  }, [state.subscriptions, sync]);

  const addHistory = useCallback((id: string) => {
    if (!preferencesReady || !preferences.saveHistory) return;
    setState((current) => ({ ...current, history: [id, ...current.history.filter((item) => item !== id)].slice(0, 30) }));
    sync("history", id);
  }, [preferencesReady, preferences.saveHistory, sync]);

  const clearHistory = useCallback(async () => {
    if (syncMode === "supabase") {
      const token = await getAccessToken();
      if (!token) throw new Error("Sesi Supabase tidak tersedia. Coba lagi.");
      const response = await fetch("/api/library?kind=history", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Histori Supabase belum dapat dihapus. Coba lagi.");
    }
    setState((current) => ({ ...current, history: [] }));
  }, [syncMode]);

  const addLocalVideo = useCallback((video: Video) => {
    setCatalog((current) => [video, ...current.filter((item) => item.id !== video.id)]);
  }, []);

  const refreshCatalog = useCallback(async () => {
    const response = await fetch("/api/videos", { cache: "no-store" });
    if (!response.ok) throw new Error("Katalog tidak dapat dimuat");
    const result = await response.json() as { videos: Video[]; source: "dummy" | "supabase" };
    setCatalog([...getLocalUploads(), ...result.videos]);
    setCatalogSource(result.source);
  }, []);

  return <StateContext.Provider value={{
    ...state, catalog, catalogSource, catalogReady, stateReady, syncMode,
    preferences, resolvedTheme, preferencesReady, setTheme, setPlaybackRate, setSaveHistory, clearHistory,
    toggleLiked, toggleSaved, toggleSubscription, addHistory, addLocalVideo, refreshCatalog,
  }}>{children}</StateContext.Provider>;
}

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
