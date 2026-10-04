import type { NextApiRequest, NextApiResponse } from "next";
import { listVideos } from "@/lib/server/videos";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).setHeader("Allow", "GET").json({ error: "Method not allowed" });
  const result = await listVideos();
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json(result);
}
