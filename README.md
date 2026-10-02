# YouTube Clone

Clone antarmuka YouTube berbasis Next.js Pages Router, React, TypeScript, Tailwind CSS 4, dan komponen bergaya shadcn/ui (Radix UI, CVA, serta Lucide). Seluruh data video masih berupa data contoh lokal.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Fitur demo

- Beranda responsif, kategori, Shorts, trending, dan pencarian video atau channel.
- Halaman tonton dengan video contoh lokal, rekomendasi, deskripsi, serta komentar lokal.
- Suka, Tonton nanti, subscription, dan histori disimpan di `localStorage` browser.
- Tampilan gelap dan terang.

Thumbnail dan video contoh berada di `public/`, sehingga pemutaran dan tampilan dasar tidak perlu koneksi ke layanan media eksternal. Thumbnail berasal dari Unsplash. Video contoh berasal dari [MDN interactive examples](https://github.com/mdn/interactive-examples) (CC0). Untuk mengambil ulang thumbnail, jalankan `node scripts/download-thumbnails.mjs` dengan koneksi internet.

## Pemeriksaan

```bash
npm run lint
npm run build
```
