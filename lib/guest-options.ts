export const GUEST_TYPES = [
  "mama",
  "papa",
  "ibu",
  "ayah",
  "ade",
  "alvita",
] as const;

export const GUEST_GROUPS = [
  "kerabat_teman",
  "keluarga",
  "kantor",
  "lainnya",
] as const;

export const GUEST_TYPE_LABELS: Record<(typeof GUEST_TYPES)[number], string> = {
  mama: "Mama",
  papa: "Papa",
  ibu: "Ibu",
  ayah: "Ayah",
  ade: "Ade",
  alvita: "Alvita",
};

export const GUEST_GROUP_LABELS: Record<(typeof GUEST_GROUPS)[number], string> = {
  kerabat_teman: "Kerabat/Teman",
  keluarga: "Keluarga",
  kantor: "Kantor",
  lainnya: "Lainnya",
};

export const MAX_INVITATION_DEVICES = 100;
