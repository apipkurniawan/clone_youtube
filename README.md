# YouTube Clone

Clone antarmuka YouTube dengan Next.js Pages Router, TypeScript, Tailwind CSS 4, komponen bergaya shadcn/ui, API Routes, dan Supabase. Katalog, komentar, serta aktivitas pengguna dapat memakai Supabase. Tanpa konfigurasi atau saat katalog Supabase belum tersedia, aplikasi tetap berjalan dengan data dummy lokal.

## Menjalankan mode dummy

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Tidak perlu database untuk mencoba beranda, pencarian, Shorts, halaman tonton, komentar demo, suka, simpan, subscribe, dan histori. Aktivitas dalam mode dummy tersimpan di `localStorage`; komentar baru hanya bertahan selama halaman tonton masih terbuka.

## Menghubungkan Supabase

1. Buat project Supabase dan aktifkan **Authentication → Providers → Anonymous Sign-Ins**.
2. Jalankan [supabase/schema.sql](supabase/schema.sql) di SQL Editor, lalu [supabase/seed.sql](supabase/seed.sql) untuk mengisi 16 video contoh. Seed bisa dibuat ulang dari `lib/videos.ts` dengan `node scripts/generate-supabase-seed.mjs`.
3. Salin `.env.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dengan URL project serta publishable/anon key Supabase. Jangan gunakan service role key.
4. Jalankan ulang `npm run dev`. Untuk deployment, set variabel yang sama sebelum build.

Ketika katalog Supabase berisi data, aplikasi membuat sesi anonim untuk menyimpan suka, Tonton nanti, histori, subscription, dan komentar dengan Row Level Security. Data aktivitas lokal yang cocok dengan katalog akan diimpor saat pertama kali tersambung. Sesi anonim melekat pada browser; bila data browser dihapus, akun anonim itu tidak bisa dipulihkan tanpa menautkan metode login permanen.

Jika variabel lingkungan belum diisi, tabel belum dibuat, tabel video kosong, atau Supabase tidak dapat dijangkau, katalog dummy tetap muncul. Bila sinkronisasi aktivitas gagal, aktivitas berikutnya disimpan di browser sampai koneksi diperbaiki.

## API

Rincian perilaku saat ini dan rancangan fitur upload ada di [dokumentasi flow upload dan watch](docs/video-upload-watch-flow.md).

| Endpoint | Metode | Fungsi |
| --- | --- | --- |
| `/api/videos` | GET | Daftar video dan sumber data (`supabase` atau `dummy`) |
| `/api/videos/:id` | GET | Detail video |
| `/api/comments?videoId=:id` | GET | Komentar video |
| `/api/comments` | POST | Kirim komentar; memakai bearer token saat Supabase aktif |
| `/api/library` | GET, POST | Baca atau ubah suka, simpan, histori, dan subscription |

Thumbnail dan video contoh berada di `public/`, sehingga mode dummy tidak bergantung pada layanan media eksternal. Thumbnail berasal dari Unsplash. Video contoh berasal dari [MDN interactive examples](https://github.com/mdn/interactive-examples) (CC0).

## Pemeriksaan

```bash
npm run lint
npm run build
```
