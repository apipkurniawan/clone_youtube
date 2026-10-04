import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff, RotateCcw, X } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type RecognitionResult = {
  readonly isFinal: boolean;
  readonly [index: number]: { readonly transcript: string } | undefined;
};

type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognition;
  webkitSpeechRecognition?: new () => BrowserRecognition;
};

type Phase = "waiting" | "listening" | "ended" | "error" | "unsupported";

const errorMessages: Record<string, string> = {
  "not-allowed": "Izin mikrofon ditolak. Izinkan akses mikrofon di pengaturan browser, lalu coba lagi.",
  "service-not-allowed": "Layanan pengenalan suara tidak diizinkan oleh browser ini.",
  "audio-capture": "Mikrofon tidak ditemukan. Periksa mikrofon perangkatmu lalu coba lagi.",
  "no-speech": "Suara belum terdengar. Coba bicara lebih dekat ke mikrofon.",
  network: "Pengenalan suara gagal terhubung. Periksa koneksi internet lalu coba lagi.",
  "language-not-supported": "Bahasa Indonesia belum didukung oleh layanan suara browser ini.",
};

export function VoiceSearch({ onSearch, variant = "secondary", className }: {
  onSearch: (query: string) => void;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");

  const close = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const start = () => {
    const previousRecognition = recognitionRef.current;
    recognitionRef.current = null;
    previousRecognition?.abort();
    const browser = window as RecognitionWindow;
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    setTranscript("");
    setMessage("");
    setOpen(true);

    if (!Recognition) {
      setPhase("unsupported");
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "id-ID";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    setPhase("waiting");

    recognition.onstart = () => {
      if (recognitionRef.current === recognition) setPhase("listening");
    };
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const results = Array.from(event.results);
      const query = results.map((result) => result[0]?.transcript ?? "").join(" ").trim();
      setTranscript(query);
      if (query && results.some((result) => result.isFinal)) {
        recognitionRef.current = null;
        recognition.stop();
        setOpen(false);
        onSearch(query);
      }
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      setPhase("error");
      setMessage(errorMessages[event.error] ?? "Pencarian suara gagal. Coba lagi atau gunakan kolom pencarian.");
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setPhase((current) => current === "error" ? current : "ended");
    };

    try {
      // Start within the click handler so the browser can request microphone access.
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setPhase("error");
      setMessage("Mikrofon tidak dapat dimulai. Periksa izin browser lalu coba lagi.");
    }
  };

  const submitTranscript = () => {
    const query = transcript.trim();
    if (!query) return;
    close();
    onSearch(query);
  };

  return <>
    <Button type="button" variant={variant} size="icon" className={className} aria-label="Pencarian suara" onClick={start}><Mic size={20} /></Button>
    {open && createPortal(<div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 px-4 pt-[min(18vh,140px)]" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="voice-search-title" aria-describedby="voice-search-status" className="w-full max-w-md rounded-3xl bg-white p-6 text-zinc-950 shadow-2xl dark:bg-zinc-900 dark:text-white sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><h2 id="voice-search-title" className="text-xl font-bold">Pencarian suara</h2><p id="voice-search-status" role="status" className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{phase === "waiting" ? "Menunggu izin mikrofon..." : phase === "listening" ? "Mendengarkan, silakan bicara..." : phase === "unsupported" ? "Browser ini belum mendukung pencarian suara." : phase === "error" ? message : "Perekaman selesai. Coba lagi atau cari teks yang tertangkap."}</p></div><Button type="button" variant="ghost" size="iconSm" aria-label="Tutup pencarian suara" onClick={close}><X size={20} /></Button></div>
        <div className="flex min-h-40 flex-col items-center justify-center gap-4 py-6 text-center"><div className={`flex h-20 w-20 items-center justify-center rounded-full ${phase === "listening" ? "animate-pulse bg-red-100 text-[#ff0033] dark:bg-red-950" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>{phase === "error" || phase === "unsupported" ? <MicOff size={32} /> : <Mic size={34} />}</div><p className="min-h-7 break-words text-lg font-medium">{transcript || (phase === "listening" ? "Ucapkan judul, channel, atau kategori video" : "")}</p></div>
        <div className="flex flex-wrap justify-end gap-2">{transcript && phase !== "listening" && <Button type="button" variant="secondary" onClick={submitTranscript}>Cari teks ini</Button>}{phase !== "listening" && phase !== "waiting" && phase !== "unsupported" && <Button type="button" onClick={start}><RotateCcw size={17} /> Coba lagi</Button>}{phase === "unsupported" && <Button type="button" onClick={close}>Gunakan kolom pencarian</Button>}</div>
      </div>
    </div>, document.body)}
  </>;
}
