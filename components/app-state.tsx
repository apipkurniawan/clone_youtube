import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/client/supabase";
import { videos as demoVideos, type Video } from "@/lib/videos";

type StoredState = { liked: string[]; saved: string[]; history: string[]; subscriptions: string[] };
type ActionKind = "like" | "save" | "history" | "subscribe";
type AppState = StoredState & {
  catalog: Video[];
  catalogSource: "dummy" | "supabase";
  catalogReady: boolean;
  stateReady: boolean;
  syncMode: "local" | "supabase";
  toggleLiked: (id: string) => void;
  toggleSaved: (id: string) => void;
  toggleSubscription: (channel: string) => void;
  addHistory: (id: string) => void;
};

const initialState: StoredState = { liked: [], saved: [], history: [], subscriptions: [] };
const StateContext = createContext<AppState | null>(null);
const storageKey = "youtube-clone-state";
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

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      let local = initialState;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) local = { ...initialState, ...JSON.parse(stored) };
      } catch { /* Ignore invalid local data. */ }
      if (!cancelled) setState(local);

      try {
        const catalogResponse = await fetch("/api/videos", { signal: AbortSignal.timeout(10000) });
        if (!catalogResponse.ok) throw new Error("Katalog tidak tersedia");
        const result = await catalogResponse.json() as { videos: Video[]; source: "dummy" | "supabase" };
        if (cancelled) return;
        setCatalog(result.videos);
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
          const next = alreadySynced ? remote : mergeState(transferableLocal, remote);
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
    setState((current) => ({ ...current, history: [id, ...current.history.filter((item) => item !== id)].slice(0, 30) }));
    sync("history", id);
  }, [sync]);

  return <StateContext.Provider value={{
    ...state, catalog, catalogSource, catalogReady, stateReady, syncMode,
    toggleLiked, toggleSaved, toggleSubscription, addHistory,
  }}>{children}</StateContext.Provider>;
}

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
