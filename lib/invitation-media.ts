export const invitationMediaSlots = [
  { slot: "hero_1", group: "Pembuka", label: "Hero 1 · kiri atas", caption: "A quiet beginning", defaultUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=88" },
  { slot: "hero_2", group: "Pembuka", label: "Hero 2 · kanan atas", caption: "The one who stayed", defaultUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=88" },
  { slot: "hero_3", group: "Pembuka", label: "Hero 3 · foto fokus", caption: "A day to remember", defaultUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1500&q=90" },
  { slot: "hero_4", group: "Pembuka", label: "Hero 4 · kiri tengah", caption: "Soft light", defaultUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88" },
  { slot: "hero_5", group: "Pembuka", label: "Hero 5 · kiri bawah", caption: "A familiar face", defaultUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=88" },
  { slot: "hero_6", group: "Pembuka", label: "Hero 6 · kanan tengah", caption: "Before the music", defaultUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=88" },
  { slot: "hero_7", group: "Pembuka", label: "Hero 7 · kanan bawah", caption: "The afterglow", defaultUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=88" },
  { slot: "couple_bride_portrait", group: "Mempelai", label: "Potret Alvita · bagian Putri", caption: "Alvita · Putri", defaultUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=88" },
  { slot: "couple_groom_portrait", group: "Mempelai", label: "Potret Ade · bagian Putra", caption: "Ade · Putra", defaultUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=88" },
  { slot: "journey_school_portrait", group: "Perjalanan · sekolah", label: "Foto utama masa sekolah", caption: "Surabaya · 2016", defaultUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=88" },
  { slot: "journey_school_mark", group: "Perjalanan · sekolah", label: "Foto sekolah tambahan", caption: "XI MIPA 4", defaultUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=86" },
  { slot: "journey_school_detail", group: "Perjalanan · sekolah", label: "Foto pendamping masa sekolah", caption: "Suasana sekolah", defaultUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=86" },
  { slot: "journey_campus_wide", group: "Perjalanan · kuliah", label: "Foto utama masa kuliah", caption: "Still in Surabaya", defaultUrl: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1200&q=88" },
  { slot: "journey_campus_small_a", group: "Perjalanan · kuliah", label: "Foto kuliah kecil A", caption: "Kelulusan kuliah", defaultUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=86" },
  { slot: "journey_campus_small_b", group: "Perjalanan · kuliah", label: "Foto kuliah kecil B", caption: "Perjalanan selama kuliah", defaultUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=86" },
  { slot: "journey_distance_city", group: "Perjalanan · dua kota", label: "Foto Jakarta", caption: "Jakarta", defaultUrl: "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=900&q=86" },
  { slot: "journey_distance_graduate", group: "Perjalanan · dua kota", label: "Foto Yogyakarta", caption: "Yogyakarta", defaultUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=86" },
  { slot: "journey_engagement_main", group: "Perjalanan · lamaran", label: "Foto utama lamaran", caption: "30 · 05 · 2026", defaultUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=90" },
  { slot: "journey_engagement_ring", group: "Perjalanan · lamaran", label: "Foto detail lamaran", caption: "Cincin lamaran", defaultUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=88" },
  { slot: "journey_wedding", group: "Perjalanan · pernikahan", label: "Foto penutup perjalanan", caption: "Hari pernikahan", defaultUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=90" },
] as const;

export type InvitationMediaSlot = (typeof invitationMediaSlots)[number]["slot"];
export type InvitationMediaFit = "cover" | "contain";
export type InvitationMediaDisplay = {
  url: string;
  fit: InvitationMediaFit;
  scale: number;
  positionX: number;
  positionY: number;
};

export const invitationMediaSlotValues = invitationMediaSlots.map((item) => item.slot) as [
  InvitationMediaSlot,
  ...InvitationMediaSlot[],
];

export const heroMediaSlots = invitationMediaSlots.slice(0, 7);

export const invitationMediaBySlot = Object.fromEntries(
  invitationMediaSlots.map((item) => [item.slot, item]),
) as Record<InvitationMediaSlot, (typeof invitationMediaSlots)[number]>;
