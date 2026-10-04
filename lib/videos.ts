export type Video = {
  id: string;
  title: string;
  channel: string;
  handle: string;
  avatar: string;
  thumbnail: string;
  category: string;
  views: string;
  uploaded: string;
  duration: string;
  description: string;
  videoUrl?: string;
  subscribers: string;
  likes: string;
  verified?: boolean;
  short?: boolean;
};

const photo = (id: string) => `/thumbnails/${id}.jpg`;

export const categories = ["Semua", "Musik", "Teknologi", "Gaming", "Kuliner", "Travel", "Desain", "Podcast", "Belajar", "Lifestyle"];

export const videos: Video[] = [
  { id: "v1", title: "30 hari hidup lebih produktif: kebiasaan kecil yang mengubah segalanya", channel: "Ruang Tumbuh", handle: "@ruangtumbuh", avatar: "#8759c8", thumbnail: photo("v1"), category: "Lifestyle", views: "1,2 jt x ditonton", uploaded: "2 hari lalu", duration: "18:24", description: "Aku mencoba rutinitas baru selama 30 hari. Dari bangun pagi sampai mengatur waktu kerja, ini hal-hal kecil yang ternyata membuat perbedaan besar. Semoga perjalanan ini bisa jadi inspirasi buat kamu juga!", subscribers: "842 rb", likes: "34 rb", verified: true },
  { id: "v2", title: "Setup meja kerja impian 2026 — minimalis, nyaman, dan rapi", channel: "Naufal Tech", handle: "@naufaltech", avatar: "#375a94", thumbnail: photo("v2"), category: "Teknologi", views: "486 rb x ditonton", uploaded: "5 hari lalu", duration: "14:08", description: "Tour lengkap meja kerja terbaru! Kita bahas monitor, keyboard, pencahayaan, dan beberapa aksesori favorit yang bikin kerja lebih nyaman.", subscribers: "312 rb", likes: "12 rb", verified: true },
  { id: "v3", title: "Jelajah Jepang sendirian: 7 hari yang nggak akan terlupakan", channel: "Jalan Bareng Aya", handle: "@jalanbarengaya", avatar: "#e68a68", thumbnail: photo("v3"), category: "Travel", views: "928 rb x ditonton", uploaded: "1 minggu lalu", duration: "24:16", description: "Dari jalanan Tokyo yang ramai sampai sudut kecil yang tenang. Ini cerita perjalanan solo pertamaku di Jepang.", subscribers: "576 rb", likes: "27 rb", verified: true },
  { id: "v4", title: "Masak pasta creamy cuma 15 menit, rasanya seperti di restoran!", channel: "Dapur Naya", handle: "@dapurnaya", avatar: "#c57842", thumbnail: photo("v4"), category: "Kuliner", views: "2,4 jt x ditonton", uploaded: "3 minggu lalu", duration: "12:35", description: "Resep pasta creamy yang gampang banget dibuat di rumah. Bahan sederhana, hasilnya spesial. Semua takaran dan langkah ada di video ini.", subscribers: "1,8 jt", likes: "86 rb", verified: true },
  { id: "v5", title: "Playlist buat nemenin kerja dan belajar ☕ lofi & chill beats", channel: "Sore Sounds", handle: "@soresounds", avatar: "#b98155", thumbnail: photo("v5"), category: "Musik", views: "3,7 jt x ditonton", uploaded: "1 bulan lalu", duration: "1:02:45", description: "Satu jam musik santai untuk menemani fokus, belajar, atau sekadar menikmati sore. Pakai headphone untuk pengalaman terbaik.", subscribers: "224 rb", likes: "94 rb" },
  { id: "v6", title: "Aku coba game paling ditunggu tahun ini... worth it nggak?", channel: "Raka Plays", handle: "@rakaplays", avatar: "#584cbb", thumbnail: photo("v6"), category: "Gaming", views: "734 rb x ditonton", uploaded: "4 hari lalu", duration: "28:12", description: "First impression, gameplay, dan pendapat jujur setelah beberapa jam bermain. Tulis game favorit kalian di komentar ya!", subscribers: "653 rb", likes: "21 rb", verified: true },
  { id: "v7", title: "Belajar UI design dari nol: prinsip yang wajib kamu tahu", channel: "Studio Karya", handle: "@studiokarya", avatar: "#df6685", thumbnail: photo("v7"), category: "Desain", views: "193 rb x ditonton", uploaded: "2 minggu lalu", duration: "21:47", description: "Panduan singkat dan praktis untuk mulai memahami UI design. Kita bahas hierarki visual, warna, tipografi, dan layout.", subscribers: "147 rb", likes: "8,4 rb" },
  { id: "v8", title: "Ngobrol soal karier, keberanian mulai lagi, dan menemukan arah", channel: "Cerita Kita", handle: "@ceritakita", avatar: "#537a73", thumbnail: photo("v8"), category: "Podcast", views: "654 rb x ditonton", uploaded: "6 hari lalu", duration: "58:31", description: "Episode kali ini ngobrol santai tentang karier, rasa takut memulai, dan bagaimana menemukan arah di tengah perubahan.", subscribers: "481 rb", likes: "18 rb", verified: true },
  { id: "v9", title: "Hidden gems di Bali yang masih sepi wisatawan", channel: "Jalan Bareng Aya", handle: "@jalanbarengaya", avatar: "#e68a68", thumbnail: photo("v9"), category: "Travel", views: "312 rb x ditonton", uploaded: "2 minggu lalu", duration: "19:54", description: "Beberapa tempat cantik di Bali yang belum banyak orang tahu. Simpan videonya untuk rencana perjalananmu berikutnya!", subscribers: "576 rb", likes: "9,8 rb", verified: true },
  { id: "v10", title: "Bikin website portfolio yang bikin recruiter berhenti scroll", channel: "Naufal Tech", handle: "@naufaltech", avatar: "#375a94", thumbnail: photo("v10"), category: "Teknologi", views: "245 rb x ditonton", uploaded: "1 minggu lalu", duration: "32:18", description: "Kita bikin portfolio sederhana yang cepat, responsif, dan punya detail visual yang memorable.", subscribers: "312 rb", likes: "11 rb", verified: true },
  { id: "v11", title: "Rutinitas pagi yang realistis (tanpa bangun jam 5!)", channel: "Ruang Tumbuh", handle: "@ruangtumbuh", avatar: "#8759c8", thumbnail: photo("v11"), category: "Lifestyle", views: "854 rb x ditonton", uploaded: "3 hari lalu", duration: "16:09", description: "Rutinitas pagi sederhana yang bisa disesuaikan dengan ritme hidup kamu sendiri. Nggak harus sempurna, yang penting konsisten.", subscribers: "842 rb", likes: "25 rb", verified: true },
  { id: "v12", title: "Cara belajar skill baru lebih cepat menurut sains", channel: "Satu Persen Lagi", handle: "@satupersenlagi", avatar: "#bd645c", thumbnail: photo("v12"), category: "Belajar", views: "1,1 jt x ditonton", uploaded: "1 bulan lalu", duration: "22:42", description: "Strategi belajar yang didukung riset dan bisa langsung dicoba. Mulai dari active recall sampai membuat jadwal latihan yang masuk akal.", subscribers: "1,2 jt", likes: "39 rb", verified: true },
  { id: "s1", title: "Momen paling cantik di jalanan Tokyo 🌸", channel: "Jalan Bareng Aya", handle: "@jalanbarengaya", avatar: "#e68a68", thumbnail: photo("v3"), category: "Travel", views: "1,8 jt x ditonton", uploaded: "1 hari lalu", duration: "0:42", description: "Sekilas perjalanan sore yang tidak terlupakan di Tokyo.", subscribers: "576 rb", likes: "62 rb", short: true, verified: true },
  { id: "s2", title: "Pasta creamy anti gagal dalam 40 detik 🍝", channel: "Dapur Naya", handle: "@dapurnaya", avatar: "#c57842", thumbnail: photo("v4"), category: "Kuliner", views: "3,2 jt x ditonton", uploaded: "2 hari lalu", duration: "0:38", description: "Resep super cepat untuk makan malam yang istimewa.", subscribers: "1,8 jt", likes: "104 rb", short: true, verified: true },
  { id: "s3", title: "Detail kecil yang bikin setup meja makin nyaman", channel: "Naufal Tech", handle: "@naufaltech", avatar: "#375a94", thumbnail: photo("v2"), category: "Teknologi", views: "874 rb x ditonton", uploaded: "3 hari lalu", duration: "0:55", description: "Satu perubahan sederhana untuk ruang kerja yang lebih nyaman.", subscribers: "312 rb", likes: "27 rb", short: true, verified: true },
  { id: "s4", title: "Pagi pelan-pelan juga boleh ☕", channel: "Ruang Tumbuh", handle: "@ruangtumbuh", avatar: "#8759c8", thumbnail: photo("v11"), category: "Lifestyle", views: "521 rb x ditonton", uploaded: "5 hari lalu", duration: "0:31", description: "Pengingat kecil untuk menikmati pagi tanpa terburu-buru.", subscribers: "842 rb", likes: "19 rb", short: true, verified: true },
];

export const getVideo = (id: string) => videos.find((video) => video.id === id);
