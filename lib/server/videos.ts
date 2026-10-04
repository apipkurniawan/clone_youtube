import { videos as demoVideos, type Video } from "@/lib/videos";
import { publicSupabase } from "@/lib/server/supabase";

type VideoRow = {
  id: string; title: string; channel: string; handle: string; avatar: string;
  thumbnail: string; category: string; views: string; uploaded: string;
  duration: string; description: string; subscribers: string; likes: string;
  verified: boolean; is_short: boolean; video_url: string | null;
};

function toVideo(row: VideoRow): Video {
  return {
    id: row.id, title: row.title, channel: row.channel, handle: row.handle,
    avatar: row.avatar, thumbnail: row.thumbnail, category: row.category,
    views: row.views, uploaded: row.uploaded, duration: row.duration,
    description: row.description, subscribers: row.subscribers, likes: row.likes,
    verified: row.verified, short: row.is_short, videoUrl: row.video_url ?? undefined,
  };
}

export async function listVideos(): Promise<{ videos: Video[]; source: "supabase" | "dummy"; warning?: string }> {
  try {
    const client = publicSupabase();
    if (!client) return { videos: demoVideos, source: "dummy" };
    const { data, error } = await client.from("videos").select("*").eq("status", "published").order("sort_order", { ascending: true });
    if (error) throw error;
    if (!data?.length) return { videos: demoVideos, source: "dummy", warning: "Tabel videos belum berisi data." };
    return { videos: (data as VideoRow[]).map(toVideo), source: "supabase" };
  } catch (error) {
    console.error("Supabase video query failed:", error);
    return { videos: demoVideos, source: "dummy", warning: "Supabase belum dapat diakses; data dummy digunakan." };
  }
}
