"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getApiErrorMessage, openWhatsAppInvite } from "@/lib/client-api";
import { guestFormSchema, validateWithToast } from "@/lib/client-validation";
import {
  GUEST_GROUPS,
  GUEST_GROUP_LABELS,
  GUEST_TYPE_LABELS,
  GUEST_TYPES,
  MAX_INVITATION_DEVICES,
} from "@/lib/guest-options";
import { Search, Plus, Copy, RotateCcw, Edit2, Trash2, ShieldBan, ShieldCheck, LogOut, Images } from "lucide-react";
import { MediaManagerDialog } from "@/components/media-manager-dialog";
import { coupleCaps } from "@/lib/couple";

type Guest = {
  id: string;
  token: string;
  guest_name: string;
  guest_type: string | null;
  guest_group: string | null;
  max_guests: number;
  max_devices: number;
  status: "active" | "revoked";
  device_count: number;
  first_opened_at: string | null;
  attendance: "attending" | "declined" | null;
  guest_count: number | null;
  message: string | null;
};

type GuestGroup = (typeof GUEST_GROUPS)[number] | '';
type GuestType = (typeof GUEST_TYPES)[number] | '';
type EditForm = {
  guestName: string;
  guestType: GuestType;
  guestGroup: GuestGroup;
  maxGuests: number;
  maxDevices: number;
};

const DEVICE_LIMIT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 50, MAX_INVITATION_DEVICES] as const;

function guestTypeLabel(value: string | null) {
  return value ? GUEST_TYPE_LABELS[value as keyof typeof GUEST_TYPE_LABELS] ?? value : "Tanpa tipe";
}

function guestGroupLabel(value: string | null) {
  return value ? GUEST_GROUP_LABELS[value as keyof typeof GUEST_GROUP_LABELS] ?? value : "Tanpa kelompok";
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.986 2.89a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.893c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.9 11.9 0 0 0-3.471-8.413" />
    </svg>
  );
}

function AddDialog({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (notice: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<EditForm>({
    guestName: "",
    guestType: "",
    guestGroup: "",
    maxGuests: 1,
    maxDevices: 1,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = validateWithToast(guestFormSchema, form);
    if (!payload) return;
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Undangan gagal dibuat."));
      toast.success("Tamu dan link personal berhasil dibuat.", { position: "top-center" });
      onAdded("Tamu dan link personal berhasil dibuat.");
      onClose();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Undangan gagal dibuat.";
      setError(message);
      toast.error(message, { position: "top-center" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="edit-dialog" onClick={handleBackdrop}>
      <div className="edit-dialog-inner">
        <p className="eyebrow">TAMBAH TAMU</p>
        <h2>Buat link personal</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nama tamu
            <input
              required
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              placeholder="Keluarga Bapak Hadi"
            />
          </label>
          <label>
            Tipe tamu (opsional)
            <select
              value={form.guestType}
              onChange={(e) => setForm({ ...form, guestType: e.target.value as GuestType })}
            >
              <option value="">— pilih tipe —</option>
              {GUEST_TYPES.map((type) => (
                <option key={type} value={type}>{GUEST_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </label>
          <label>
            Kelompok (opsional)
            <select
              value={form.guestGroup}
              onChange={(e) => setForm({ ...form, guestGroup: e.target.value as GuestGroup })}
            >
              <option value="">— pilih kelompok —</option>
              {GUEST_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {GUEST_GROUP_LABELS[g]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Kuota tamu
            <select
              value={form.maxGuests}
              onChange={(e) =>
                setForm({ ...form, maxGuests: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} orang
                </option>
              ))}
            </select>
          </label>
          <label>
            Maksimal perangkat
            <select
              value={form.maxDevices}
              onChange={(e) => setForm({ ...form, maxDevices: Number(e.target.value) })}
            >
              {DEVICE_LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} perangkat</option>
              ))}
            </select>
            <small>Link dapat dibuka dari perangkat berbeda sampai batas ini.</small>
          </label>
          {error && <p className="admin-notice">{error}</p>}
          <div className="edit-dialog-actions">
            <button
              type="button"
              className="button button"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button className="button button-solid" disabled={saving}>
              {saving ? "Membuat…" : "Buat undangan"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function EditDialog({
  guest,
  onClose,
  onSaved,
}: {
  guest: Guest;
  onClose: () => void;
  onSaved: (notice: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<EditForm>({
    guestName: guest.guest_name,
    guestType: (guest.guest_type as GuestType) ?? "",
    guestGroup: (guest.guest_group as GuestGroup) ?? "",
    maxGuests: guest.max_guests,
    maxDevices: guest.max_devices,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = validateWithToast(guestFormSchema, form);
    if (!payload) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "update-guest", ...payload }),
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Gagal menyimpan."));
      toast.success("Data tamu berhasil diperbarui.", { position: "top-center" });
      onSaved("Data tamu berhasil diperbarui.");
      onClose();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Gagal menyimpan.";
      setError(message);
      toast.error(message, { position: "top-center" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="edit-dialog" onClick={handleBackdrop}>
      <div className="edit-dialog-inner">
        <p className="eyebrow">EDIT TAMU</p>
        <h2>{guest.guest_name}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nama tamu
            <input
              required
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              placeholder="Keluarga Bapak Hadi"
            />
          </label>
          <label>
            Tipe tamu (opsional)
            <select
              value={form.guestType}
              onChange={(e) => setForm({ ...form, guestType: e.target.value as GuestType })}
            >
              <option value="">— pilih tipe —</option>
              {GUEST_TYPES.map((type) => (
                <option key={type} value={type}>{GUEST_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </label>
          <label>
            Kelompok (opsional)
            <select
              value={form.guestGroup}
              onChange={(e) => setForm({ ...form, guestGroup: e.target.value as GuestGroup })}
            >
              <option value="">— pilih kelompok —</option>
              {GUEST_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {GUEST_GROUP_LABELS[g]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Kuota tamu
            <select
              className="no-divider"
              value={form.maxGuests}
              onChange={(e) =>
                setForm({ ...form, maxGuests: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n} orang
                </option>
              ))}
            </select>
          </label>
          <label>
            Maksimal perangkat
            <select
              className="no-divider"
              value={form.maxDevices}
              onChange={(e) => setForm({ ...form, maxDevices: Number(e.target.value) })}
            >
              {DEVICE_LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} perangkat</option>
              ))}
            </select>
            <small>Perangkat yang sudah terdaftar tetap dapat membuka link ini.</small>
          </label>
          {error && <p className="admin-notice">{error}</p>}
          <div className="edit-dialog-actions">
            <button
              type="button"
              className="button button"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button className="button button-solid" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function DeleteDialog({
  guest,
  onClose,
  onDeleted,
}: {
  guest: Guest;
  onClose: () => void;
  onDeleted: (notice: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Gagal menghapus."));
      toast.success("Tamu berhasil dihapus.", { position: "top-center" });
      onDeleted("Tamu berhasil dihapus.");
      onClose();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Gagal menghapus.";
      setError(message);
      toast.error(message, { position: "top-center" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="edit-dialog" onClick={handleBackdrop}>
      <div className="edit-dialog-inner">
        <p className="eyebrow">HAPUS TAMU</p>
        <h2>{guest.guest_name}</h2>
        <p>Apakah Anda yakin ingin menghapus tamu ini?</p>
        {error && <p className="admin-notice">{error}</p>}
        <div className="edit-dialog-actions">
          <button
            type="button"
            className="button button"
            onClick={onClose}
            disabled={deleting}
          >
            Batal
          </button>
          <button
            className="button button-solid danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Menghapus…" : "Hapus"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function ResetAccessDialog({
  count,
  error,
  resetting,
  onClose,
  onConfirm,
}: {
  count: number;
  error: string;
  resetting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleBackdrop(event: React.MouseEvent<HTMLDialogElement>) {
    if (!resetting && event.target === dialogRef.current) onClose();
  }

  return (
    <dialog ref={dialogRef} className="edit-dialog" onClick={handleBackdrop}>
      <div className="edit-dialog-inner">
        <p className="eyebrow">RESET AKSES</p>
        <h2>Reset akses undangan?</h2>
        <p>
          Ikatan perangkat untuk <b>{count} undangan</b> akan dihapus. Tamu
          dapat membuka kembali link undangannya dari perangkat baru.
        </p>
        {error && <p className="admin-notice">{error}</p>}
        <div className="edit-dialog-actions">
          <button
            type="button"
            className="button button"
            onClick={onClose}
            disabled={resetting}
          >
            Batal
          </button>
          <button
            type="button"
            className="button button-solid"
            onClick={onConfirm}
            disabled={resetting}
          >
            {resetting ? "Mereset…" : "Reset akses"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function AdminDashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [deleteGuest, setDeleteGuest] = useState<Guest | null>(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<GuestType | "all">("all");
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [resettingAccess, setResettingAccess] = useState(false);
  const [resetTargetIds, setResetTargetIds] = useState<string[] | null>(null);
  const [resetError, setResetError] = useState("");
  const [notice, setNotice] = useState("");
  const [showMediaManager, setShowMediaManager] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/guests");
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Daftar tamu tidak dapat dimuat."));
      const data = await response.json();
      const nextGuests: Guest[] = data.guests ?? [];
      setGuests(nextGuests);
      setSelectedGuestIds((current) =>
        current.filter((id) => nextGuests.some((guest) => guest.id === id)),
      );
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Daftar tamu tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: guests.length,
      opened: guests.filter((g) => g.first_opened_at).length,
      attending: guests
        .filter((g) => g.attendance === "attending")
        .reduce((sum, g) => sum + (g.guest_count ?? 0), 0),
    }),
    [guests],
  );

  const filteredGuests = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return guests.filter((g) => 
      (typeFilter === "all" || g.guest_type === typeFilter) &&
      (!lowerQuery ||
        g.guest_name.toLowerCase().includes(lowerQuery) ||
        (g.guest_type && g.guest_type.toLowerCase().includes(lowerQuery)) ||
        (g.guest_group && g.guest_group.toLowerCase().includes(lowerQuery)))
    );
  }, [guests, searchQuery, typeFilter]);

  const allFilteredSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((guest) => selectedGuestIds.includes(guest.id));

  async function action(id: string, actionName: "reset-device" | "toggle-status") {
    try {
      const response = await fetch(`/api/admin/guests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: actionName }),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Perubahan tidak dapat disimpan."));
      const successMessage = actionName === "reset-device" ? "Ikatan perangkat dihapus." : "Status link diperbarui.";
      setNotice(successMessage);
      toast.success(successMessage, { position: "top-center" });
      load();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Perubahan tidak dapat disimpan.", { position: "top-center" });
    }
  }

  function toggleGuestSelection(id: string) {
    setSelectedGuestIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function toggleAllFilteredGuests() {
    const filteredIds = filteredGuests.map((guest) => guest.id);
    const filteredIdSet = new Set(filteredIds);
    setSelectedGuestIds((current) => {
      if (filteredGuests.length > 0 && filteredGuests.every((guest) => current.includes(guest.id))) {
        return current.filter((id) => !filteredIdSet.has(id));
      }
      return Array.from(new Set([...current, ...filteredIds]));
    });
  }

  function requestResetSelectedDevices() {
    if (selectedGuestIds.length === 0) return;
    setResetError("");
    setResetTargetIds([...selectedGuestIds]);
  }

  async function resetSelectedDevices(ids: string[]) {
    setResettingAccess(true);
    setResetError("");
    try {
      const response = await fetch("/api/admin/guests/reset-device", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Akses undangan tidak dapat direset."));
      }
      const data = await response.json().catch(() => ({}));
      const resetCount = typeof data.resetCount === "number" ? data.resetCount : ids.length;
      const successMessage = `${resetCount} akses undangan berhasil direset.`;
      setSelectedGuestIds([]);
      setResetTargetIds(null);
      setNotice(successMessage);
      toast.success(successMessage, { position: "top-center" });
      await load();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Akses undangan tidak dapat direset.";
      setResetError(message);
      toast.error(
        message,
        { position: "top-center" },
      );
    } finally {
      setResettingAccess(false);
    }
  }

  async function copy(token: string) {
    try {
      const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
      if (!publicAppUrl) {
        toast.error("NEXT_PUBLIC_APP_URL belum diatur.", { position: "top-center" });
        return;
      }
      await navigator.clipboard.writeText(
        `${publicAppUrl}/invite/${token}`,
      );
      toast.info("Link personal sudah disalin.", { position: "top-center" });
    } catch {
      toast.error("Link tidak dapat disalin. Salin dari address bar.", { position: "top-center" });
    }
  }

  function sendWa(guest: Guest) {
    const result = openWhatsAppInvite(guest);
    if (!result.ok) toast.error(result.message, { position: "top-center" });
  }

  async function logout() {
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Gagal keluar."));
      location.assign("/admin/login");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Gagal keluar.");
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{coupleCaps.name} · ADMIN</p>
          <h1>Daftar yang hadir.</h1>
        </div>
        <div className="admin-header-actions">
          <button className="button button-quiet" onClick={() => setShowMediaManager(true)}>
            <Images size={16} /> Kelola foto undangan
          </button>
          <button className="text-button icon-text-button" onClick={logout}>
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </header>
      <section className="stat-grid">
        <div>
          <span>Total undangan</span>
          <b>{stats.total}</b>
        </div>
        <div>
          <span>Sudah dibuka</span>
          <b>{stats.opened}</b>
        </div>
        <div>
          <span>Konfirmasi hadir</span>
          <b>{stats.attending}</b>
        </div>
      </section>
      
      <section className="admin-main">
        <section className="guest-list">
          <div className="list-heading">
            <div className="list-heading-top">
              <div>
                <p className="eyebrow">DAFTAR TAMU</p>
                <h2>{loading ? "Memuat…" : `${guests.length} undangan`}</h2>
              </div>
              <button 
                className="button button-solid icon-text-button" 
                onClick={() => setShowAddGuest(true)}
              >
                <Plus size={16} /> Tambah Tamu
              </button>
            </div>
            
            <div className="guest-filters">
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Cari nama, tipe, atau kelompok..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <label className="type-filter">
                <span>Sortir tipe</span>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as GuestType | "all")}>
                  <option value="all">Semua tipe</option>
                  {GUEST_TYPES.map((type) => (
                    <option key={type} value={type}>{GUEST_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </label>
            </div>

            {!loading && guests.length > 0 && filteredGuests.length > 0 && (
              <div className="bulk-action-bar">
                <label className="bulk-select-all">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFilteredGuests}
                    aria-label={searchQuery.trim() ? "Pilih semua hasil pencarian" : "Pilih semua undangan"}
                  />
                  <span>{searchQuery.trim() ? "Pilih semua hasil pencarian" : "Pilih semua undangan"}</span>
                </label>
                <div className="bulk-action-controls">
                  <span className="bulk-count">{selectedGuestIds.length} dipilih</span>
                  <button
                    type="button"
                    className="button button-solid bulk-reset-button"
                    onClick={requestResetSelectedDevices}
                    disabled={selectedGuestIds.length === 0 || resettingAccess}
                  >
                    {resettingAccess ? "Mereset…" : "Reset akses"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!loading && guests.length === 0 && (
            <div className="empty-state">
              Belum ada tamu. Tambahkan tamu pertama Anda untuk membuat link undangan.
            </div>
          )}

          {!loading && guests.length > 0 && filteredGuests.length === 0 && (
            <div className="empty-state">
              Tidak ada tamu yang cocok dengan pencarian "{searchQuery}".
            </div>
          )}

          <div className="guest-grid">
            {filteredGuests.map((guest) => (
              <article
                className={`guest-row${selectedGuestIds.includes(guest.id) ? " is-selected" : ""}`}
                key={guest.id}
              >
                <div className="guest-identity">
                  <label className="guest-select">
                    <input
                      type="checkbox"
                      checked={selectedGuestIds.includes(guest.id)}
                      onChange={() => toggleGuestSelection(guest.id)}
                      aria-label={`Pilih undangan ${guest.guest_name}`}
                    />
                  </label>
                  <div className="guest-name">
                    <b>{guest.guest_name}</b>
                    <span>
                      {guestTypeLabel(guest.guest_type)} · {guestGroupLabel(guest.guest_group)} · {guest.max_guests} orang
                    </span>
                  </div>
                </div>
                <div className="guest-state">
                  <span className={`pill ${guest.status}`}>
                    {guest.status === "active" ? "Aktif" : "Dicabut"}
                  </span>
                  <span>
                    {guest.attendance === "attending"
                      ? `Hadir · ${guest.guest_count}`
                      : guest.attendance === "declined"
                        ? "Tidak hadir"
                        : guest.first_opened_at
                          ? `${guest.device_count}/${guest.max_devices} perangkat`
                          : "Belum dibuka"}
                  </span>
                </div>
                <div className="guest-actions">
                  <button className="action-icon whatsapp" onClick={() => sendWa(guest)} title="Kirim ke WhatsApp">
                    <WhatsAppIcon />
                  </button>
                  <button className="action-icon" onClick={() => copy(guest.token)} title="Salin link">
                    <Copy size={16} />
                  </button>
                  <button className="action-icon" onClick={() => action(guest.id, "reset-device")} title="Reset perangkat">
                    <RotateCcw size={16} />
                  </button>
                  <button className="action-icon" onClick={() => setEditGuest(guest)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button
                    className={`action-icon ${guest.status === "active" ? "danger" : "success"}`}
                    onClick={() => action(guest.id, "toggle-status")}
                    title={guest.status === "active" ? "Cabut akses" : "Aktifkan"}
                  >
                    {guest.status === "active" ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
                  </button>
                  <button className="action-icon danger" onClick={() => setDeleteGuest(guest)} title="Hapus">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {showAddGuest && (
        <AddDialog
          onClose={() => setShowAddGuest(false)}
          onAdded={(msg) => {
            setNotice(msg);
            load();
            setTimeout(() => setNotice(""), 4000);
          }}
        />
      )}

      {showMediaManager && <MediaManagerDialog onClose={() => setShowMediaManager(false)} />}

      {resetTargetIds && (
        <ResetAccessDialog
          count={resetTargetIds.length}
          error={resetError}
          resetting={resettingAccess}
          onClose={() => setResetTargetIds(null)}
          onConfirm={() => resetSelectedDevices(resetTargetIds)}
        />
      )}

      {editGuest && (
        <EditDialog
          guest={editGuest}
          onClose={() => setEditGuest(null)}
          onSaved={(msg) => {
            setNotice(msg);
            load();
            setTimeout(() => setNotice(""), 4000);
          }}
        />
      )}
      
      {deleteGuest && (
        <DeleteDialog
          guest={deleteGuest}
          onClose={() => setDeleteGuest(null)}
          onDeleted={(msg) => {
            setNotice(msg);
            load();
            setTimeout(() => setNotice(""), 4000);
          }}
        />
      )}
    </main>
  );
}
