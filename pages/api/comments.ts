import type { NextApiRequest, NextApiResponse } from "next";
import { demoComments, type VideoComment } from "@/lib/comments";
import { authenticatedSupabase, isSupabaseConfigured, publicSupabase } from "@/lib/server/supabase";
import { listVideos } from "@/lib/server/videos";

type CommentRow = { id: string; author_name: string; body: string; created_at: string };

function toComment(row: CommentRow): VideoComment {
  return { id: row.id, name: row.author_name, color: "#6554cb", when: new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), text: row.body, likes: 0 };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).setHeader("Allow", "GET, POST").json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method === "GET") {
    const videoId = typeof req.query.videoId === "string" ? req.query.videoId : "";
    if (!videoId) return res.status(400).json({ error: "videoId diperlukan" });
    const catalog = await listVideos();
    if (catalog.source === "dummy") return res.status(200).json({ comments: demoComments, source: "dummy" });
    try {
      const client = publicSupabase();
      if (!client) return res.status(200).json({ comments: demoComments, source: "dummy" });
      const { data, error } = await client.from("comments").select("id,author_name,body,created_at").eq("video_id", videoId).order("created_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json({ comments: (data as CommentRow[]).map(toComment), source: "supabase" });
    } catch (error) {
      console.error("Supabase comments query failed:", error);
      return res.status(200).json({ comments: demoComments, source: "dummy", warning: "Komentar Supabase belum dapat diakses." });
    }
  }

  const { videoId, text } = req.body ?? {};
  if (typeof videoId !== "string" || !videoId || videoId.length > 200 || typeof text !== "string" || !text.trim() || text.trim().length > 1000) return res.status(400).json({ error: "Komentar tidak valid" });
  const catalog = await listVideos();
  if (!isSupabaseConfigured || catalog.source === "dummy") return res.status(200).json({ source: "dummy", comment: { id: crypto.randomUUID(), name: "Raka Pratama", color: "#6554cb", when: "baru saja", text: text.trim(), likes: 0 } });

  try {
    const session = await authenticatedSupabase(req);
    if (!session) return res.status(401).json({ error: "Sesi Supabase tidak valid" });
    const authorName = typeof session.user.user_metadata?.full_name === "string" ? session.user.user_metadata.full_name.slice(0, 80) : "Penonton";
    const { data, error } = await session.client.from("comments").insert({ user_id: session.user.id, video_id: videoId, author_name: authorName, body: text.trim() }).select("id,author_name,body,created_at").single();
    if (error) throw error;
    return res.status(201).json({ source: "supabase", comment: { ...toComment(data as CommentRow), when: "baru saja" } });
  } catch (error) {
    console.error("Supabase comment insert failed:", error);
    return res.status(503).json({ error: "Komentar belum dapat disimpan ke Supabase" });
  }
}
