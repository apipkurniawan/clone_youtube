export type VideoComment = {
  id: string;
  name: string;
  color: string;
  when: string;
  text: string;
  likes: number;
};

export const demoComments: VideoComment[] = [
  { id: "demo-1", name: "Dina Maharani", color: "#d97770", when: "2 hari lalu", text: "Kontennya selalu bikin semangat. Terima kasih sudah berbagi! ✨", likes: 128 },
  { id: "demo-2", name: "Fajar Akbar", color: "#618b87", when: "3 hari lalu", text: "Penjelasannya enak diikuti dan visualnya juga keren banget. Ditunggu video berikutnya!", likes: 86 },
  { id: "demo-3", name: "Nisa Putri", color: "#856dc4", when: "5 hari lalu", text: "Baru nemu channel ini dan langsung subscribe. Suka banget pembahasannya!", likes: 43 },
];
