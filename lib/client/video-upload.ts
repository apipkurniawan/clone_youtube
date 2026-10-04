import * as tus from "tus-js-client";

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export async function prepareVideo(file: File): Promise<{ durationSeconds: number; thumbnail: Blob }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    return await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Video tidak dapat dibaca. Gunakan MP4 yang dapat diputar di browser.")), 15000);
      const fail = () => { window.clearTimeout(timeout); reject(new Error("Video tidak dapat dibaca. Gunakan MP4 yang dapat diputar di browser.")); };
      video.onerror = fail;
      video.onloadedmetadata = () => {
        if (!Number.isFinite(video.duration) || video.duration < 1 || video.duration > 21600) { fail(); return; }
        video.currentTime = Math.min(1, video.duration / 2);
      };
      video.onseeked = () => {
        const width = 640;
        const height = 360;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) { fail(); return; }
        const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
        const drawnWidth = video.videoWidth * scale;
        const drawnHeight = video.videoHeight * scale;
        context.drawImage(video, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
        canvas.toBlob((thumbnail) => {
          window.clearTimeout(timeout);
          if (thumbnail) resolve({ durationSeconds: video.duration, thumbnail });
          else reject(new Error("Thumbnail video tidak dapat dibuat."));
        }, "image/jpeg", 0.82);
      };
    });
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function uploadMedia(file: Blob, path: string, token: string, signal: AbortSignal, onProgress: (percent: number) => void): Promise<void> {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) throw new Error("URL Supabase belum tersedia.");
  const directUrl = projectUrl.replace(/\.supabase\.co\/?$/, ".storage.supabase.co");
  const endpoint = `${directUrl.replace(/\/$/, "")}/storage/v1/upload/resumable`;
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error("Upload dibatalkan.")); return; }
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      if (error) reject(error); else resolve();
    };
    const upload = new tus.Upload(file, {
      endpoint,
      headers: { authorization: `Bearer ${token}` },
      metadata: { bucketName: "video-public", objectName: path, contentType: file.type },
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      onProgress: (sent, total) => onProgress(Math.round(sent / total * 100)),
      onError: (error) => finish(error),
      onSuccess: () => finish(),
    });
    const onAbort = () => { void upload.abort(); finish(new Error("Upload dibatalkan.")); };
    signal.addEventListener("abort", onAbort, { once: true });
    void upload.findPreviousUploads().then((previous) => {
      if (signal.aborted) return;
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }).catch((error) => finish(error instanceof Error ? error : new Error("Upload gagal.")));
  });
}
