import type { Video } from "@/lib/videos";

const metadataKey = "youtube-clone-local-uploads";
const databaseName = "youtube-clone-media";
const storeName = "videos";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getLocalUploads(): Video[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(metadataKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is Video => typeof item?.id === "string" && item.id.startsWith("local-") && typeof item.title === "string") : [];
  } catch { return []; }
}

export async function saveLocalUpload(video: Video, file: File): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put(file, video.id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    localStorage.setItem(metadataKey, JSON.stringify([video, ...getLocalUploads().filter((item) => item.id !== video.id)]));
  } finally { database.close(); }
}

export async function getLocalVideoFile(id: string): Promise<Blob | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}
