import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile("lib/videos.ts", "utf8");
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { videos } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const rows = videos.map((video, index) => `  (${[
  quote(video.id), quote(video.title), quote(video.channel), quote(video.handle),
  quote(video.avatar), quote(video.thumbnail), quote(video.category), quote(video.views),
  quote(video.uploaded), quote(video.duration), quote(video.description),
  quote(video.subscribers), quote(video.likes), Boolean(video.verified), Boolean(video.short),
  quote(video.videoUrl ?? "/demo-video.mp4"), index,
].join(", ")})`);

const sql = `-- Generated from lib/videos.ts. Run after schema.sql. Existing IDs are preserved.\n` +
  `insert into public.videos (id,title,channel,handle,avatar,thumbnail,category,views,uploaded,duration,description,subscribers,likes,verified,is_short,video_url,sort_order) values\n` +
  rows.join(",\n") + `\non conflict (id) do nothing;\n`;

await writeFile("supabase/seed.sql", sql);
console.log(`Generated supabase/seed.sql with ${videos.length} videos.`);
