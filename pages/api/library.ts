import type { NextApiRequest, NextApiResponse } from "next";
import { authenticatedSupabase, isSupabaseConfigured } from "@/lib/server/supabase";

const emptyState = { liked: [], saved: [], history: [], subscriptions: [] };
type Action = { kind: "like" | "save" | "history" | "subscribe"; id: string; active?: boolean };

function validAction(value: unknown): value is Action {
  if (!value || typeof value !== "object") return false;
  const action = value as Partial<Action>;
  return ["like", "save", "history", "subscribe"].includes(String(action.kind))
    && typeof action.id === "string" && action.id.trim().length > 0 && action.id.length <= 200
    && (action.kind === "history" || typeof action.active === "boolean");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).setHeader("Allow", "GET, POST").json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method === "POST" && !validAction(req.body)) return res.status(400).json({ error: "Aksi tidak valid" });
  if (!isSupabaseConfigured) return res.status(200).json(req.method === "GET" ? { source: "dummy", state: emptyState } : { source: "dummy", ok: true, persisted: false });

  try {
    const session = await authenticatedSupabase(req);
    if (!session) return res.status(401).json({ error: "Sesi Supabase tidak valid" });
    const { client, user } = session;

    if (req.method === "GET") {
      const [preferences, history, subscriptions] = await Promise.all([
        client.from("user_video_preferences").select("video_id,kind").eq("user_id", user.id),
        client.from("watch_history").select("video_id").eq("user_id", user.id).order("watched_at", { ascending: false }),
        client.from("subscriptions").select("channel").eq("user_id", user.id),
      ]);
      const error = preferences.error || history.error || subscriptions.error;
      if (error) throw error;
      return res.status(200).json({ source: "supabase", state: {
        liked: preferences.data?.filter((item) => item.kind === "like").map((item) => item.video_id) ?? [],
        saved: preferences.data?.filter((item) => item.kind === "save").map((item) => item.video_id) ?? [],
        history: history.data?.map((item) => item.video_id) ?? [],
        subscriptions: subscriptions.data?.map((item) => item.channel) ?? [],
      } });
    }

    const { kind, id, active } = req.body;
    if (kind === "history") {
      const { error } = await client.from("watch_history").upsert({ user_id: user.id, video_id: id, watched_at: new Date().toISOString() }, { onConflict: "user_id,video_id" });
      if (error) throw error;
    } else if (kind === "subscribe") {
      const query = active
        ? client.from("subscriptions").upsert({ user_id: user.id, channel: id }, { onConflict: "user_id,channel" })
        : client.from("subscriptions").delete().eq("user_id", user.id).eq("channel", id);
      const { error } = await query;
      if (error) throw error;
    } else {
      const query = active
        ? client.from("user_video_preferences").upsert({ user_id: user.id, video_id: id, kind }, { onConflict: "user_id,video_id,kind" })
        : client.from("user_video_preferences").delete().eq("user_id", user.id).eq("video_id", id).eq("kind", kind);
      const { error } = await query;
      if (error) throw error;
    }
    return res.status(200).json({ source: "supabase", ok: true });
  } catch (error) {
    console.error("Supabase library request failed:", error);
    return res.status(503).json({ error: "Aktivitas belum dapat disinkronkan ke Supabase" });
  }
}
