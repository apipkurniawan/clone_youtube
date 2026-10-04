import type { NextApiRequest, NextApiResponse } from "next";
import { listVideos } from "@/lib/server/videos";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).setHeader("Allow", "GET").json({ error: "Method not allowed" });
  const { videos, source, warning } = await listVideos();
  const video = videos.find((item) => item.id === req.query.id);
  if (!video) return res.status(404).json({ error: "Video tidak ditemukan", source });
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ video, source, warning });
}
