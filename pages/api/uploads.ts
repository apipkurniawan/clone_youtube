import type { NextApiRequest, NextApiResponse } from "next";
import { authenticatedSupabase, isSupabaseConfigured } from "@/lib/server/supabase";
import { categories } from "@/lib/videos";

type UploadBody = { id?: unknown; title?: unknown; description?: unknown; category?: unknown; durationSeconds?: unknown };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed" });
  if (!isSupabaseConfigured) return res.status(503).json({ error: "Supabase belum dikonfigurasi" });

  const auth = await authenticatedSupabase(req);
  if (!auth || auth.user.is_anonymous) return res.status(401).json({ error: "Masuk dengan akun kreator untuk mengunggah video" });

  const body = (req.body ?? {}) as UploadBody;
  const id = typeof body.id === "string" ? body.id : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const durationSeconds = typeof body.durationSeconds === "number" ? body.durationSeconds : NaN;
  if (!uuidPattern.test(id) || title.length < 3 || title.length > 120 || description.length > 5000 || !categories.includes(category) || category === "Semua" || !Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 21600) {
    return res.status(400).json({ error: "Metadata video tidak valid" });
  }

  const videoPath = `${auth.user.id}/${id}/video.mp4`;
  const thumbnailPath = `${auth.user.id}/${id}/thumbnail.jpg`;
  const bucket = auth.client.storage.from("video-public");
  const [{ data: videoObject, error: videoError }, { data: thumbnailObject, error: thumbnailError }] = await Promise.all([
    bucket.info(videoPath), bucket.info(thumbnailPath),
  ]);
  if (videoError || thumbnailError || !videoObject || !thumbnailObject) return res.status(400).json({ error: "File video atau thumbnail belum selesai diunggah" });
  if (!videoObject.size || videoObject.size > 104857600 || videoObject.contentType !== "video/mp4" || !thumbnailObject.size || thumbnailObject.size > 2097152 || thumbnailObject.contentType !== "image/jpeg") {
    return res.status(400).json({ error: "Jenis atau ukuran media tidak valid" });
  }

  const avatarColors = ["#5b67b7", "#bb6f62", "#4c8b81", "#9e72aa"];
  const channel = String(auth.user.user_metadata?.display_name ?? auth.user.email?.split("@")[0] ?? "Kreator").trim().slice(0, 60) || "Kreator";
  const videoUrl = bucket.getPublicUrl(videoPath).data.publicUrl;
  const thumbnailUrl = bucket.getPublicUrl(thumbnailPath).data.publicUrl;
  const duration = `${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, "0")}`;
  const { error } = await auth.client.from("videos").insert({
    id, title, description, category, channel, handle: `@${auth.user.id.slice(0, 8)}`,
    avatar: avatarColors[parseInt(auth.user.id[0], 16) % avatarColors.length],
    thumbnail: thumbnailUrl, video_url: videoUrl, duration,
    views: "0 x ditonton", uploaded: "baru saja", subscribers: "0", likes: "0",
    verified: false, is_short: false, sort_order: -1, owner_id: auth.user.id, status: "published",
  });
  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Video ini sudah dipublikasikan" });
    console.error("Video publish failed:", error);
    return res.status(500).json({ error: "Gagal menyimpan metadata video. Coba publikasikan ulang." });
  }
  return res.status(201).json({ id, watchUrl: `/watch/${id}` });
}
