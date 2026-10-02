import { mkdir, writeFile } from "node:fs/promises";

const photos = [
  "photo-1484627147104-f5197bcd6651",
  "photo-1498050108023-c5249f4df085",
  "photo-1540959733332-eab4deabeeaf",
  "photo-1473093295043-cdd812d0e601",
  "photo-1516280440614-37939bbacd81",
  "photo-1493711662062-fa541adb3fc8",
  "photo-1507238691740-187a5b1d37b8",
  "photo-1590602847861-f357a9332bbc",
  "photo-1537996194471-e657df975ab4",
  "photo-1519389950473-47ba0277781c",
  "photo-1445116572660-236099ec97a0",
  "photo-1481627834876-b7833e8f5570",
];

await mkdir("public/thumbnails", { recursive: true });
for (const [index, id] of photos.entries()) {
  const response = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=960&q=80`);
  if (!response.ok) throw new Error(`Thumbnail ${index + 1}: HTTP ${response.status}`);
  await writeFile(`public/thumbnails/v${index + 1}.jpg`, Buffer.from(await response.arrayBuffer()));
  console.log(`Downloaded thumbnail ${index + 1}/${photos.length}`);
}
