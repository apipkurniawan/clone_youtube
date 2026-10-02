import { createContext, useCallback, useContext, useEffect, useState } from "react";

type StoredState = { liked: string[]; saved: string[]; history: string[]; subscriptions: string[] };
type AppState = StoredState & {
  toggleLiked: (id: string) => void;
  toggleSaved: (id: string) => void;
  toggleSubscription: (channel: string) => void;
  addHistory: (id: string) => void;
};

const initialState: StoredState = { liked: [], saved: [], history: [], subscriptions: [] };
const StateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("youtube-clone-state");
        if (stored) setState({ ...initialState, ...JSON.parse(stored) });
      } catch { /* Corrupt local data should not prevent the app from loading. */ }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("youtube-clone-state", JSON.stringify(state));
  }, [ready, state]);

  const toggle = useCallback((key: "liked" | "saved" | "subscriptions", id: string) => {
    setState((current) => ({
      ...current,
      [key]: current[key].includes(id) ? current[key].filter((value) => value !== id) : [...current[key], id],
    }));
  }, []);

  const addHistory = useCallback((id: string) => {
    setState((current) => ({ ...current, history: [id, ...current.history.filter((value) => value !== id)].slice(0, 30) }));
  }, []);

  return (
    <StateContext.Provider value={{ ...state, toggleLiked: (id) => toggle("liked", id), toggleSaved: (id) => toggle("saved", id), toggleSubscription: (channel) => toggle("subscriptions", channel), addHistory }}>
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
