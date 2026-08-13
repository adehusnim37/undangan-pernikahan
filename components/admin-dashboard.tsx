"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/client-api";
import { guestFormSchema, validateWithToast } from "@/lib/client-validation";

type Guest = {
  id: string;
  token: string;
  guest_name: string;
  guest_group: string | null;
  max_guests: number;
  status: "active" | "revoked";
  device_id: string | null;
  first_opened_at: string | null;
  attendance: "attending" | "declined" | null;
  guest_count: number | null;
  message: string | null;
};

const GUEST_GROUPS = ['keluarga', 'kantor', 'kerabat'] as const;
type GuestGroup = (typeof GUEST_GROUPS)[number] | '';
type EditForm = { guestName: string; guestGroup: GuestGroup; maxGuests: number };

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
    guestGroup: (guest.guest_group as GuestGroup) ?? "",
    maxGuests: guest.max_guests,
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
            Kelompok (opsional)
            <select
              value={form.guestGroup}
              onChange={(e) => setForm({ ...form, guestGroup: e.target.value as GuestGroup })}
            >
              <option value="">— pilih kelompok —</option>
              {GUEST_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
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
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} orang
                </option>
              ))}
            </select>
          </label>
          {error && <p className="admin-notice">{error}</p>}
          <div className="edit-dialog-actions">
            <button
              type="button"
              className="text-button"
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
            className="text-button"
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

export function AdminDashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [deleteGuest, setDeleteGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState<{ guestName: string; guestGroup: GuestGroup; maxGuests: number }>({
    guestName: "",
    guestGroup: "",
    maxGuests: 1,
  });
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/guests");
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Daftar tamu tidak dapat dimuat."));
      const data = await response.json();
      setGuests(data.guests ?? []);
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

  async function addGuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateWithToast(guestFormSchema, form);
    if (!payload) return;
    setNotice("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Undangan gagal dibuat."));
      setForm({ guestName: "", guestGroup: "", maxGuests: 1 } as { guestName: string; guestGroup: GuestGroup; maxGuests: number });
      setNotice("Tamu dan link personal berhasil dibuat.");
      toast.success("Tamu dan link personal berhasil dibuat.", { position: "top-center" });
      load();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Undangan gagal dibuat.";
      setNotice(message);
      toast.error(message, { position: "top-center" });
    }
  }

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

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/invite/${token}`,
      );
      setNotice("Link personal sudah disalin.");
      toast.info("Link personal sudah disalin.", { position: "top-center" });
    } catch {
      toast.error("Link tidak dapat disalin. Salin dari address bar.", { position: "top-center" });
    }
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
          <p className="eyebrow">ARUNA &amp; BIMA · ADMIN</p>
          <h1>Daftar yang hadir.</h1>
        </div>
        <button className="text-button" onClick={logout}>
          Keluar
        </button>
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
        <aside className="add-panel">
          <p className="eyebrow">TAMBAH TAMU</p>
          <h2>Buat link personal</h2>
          <form onSubmit={addGuest}>
            <label>
              Nama tamu
              <input
                required
                value={form.guestName}
                onChange={(e) =>
                  setForm({ ...form, guestName: e.target.value })
                }
                placeholder="Keluarga Bapak Hadi"
              />
            </label>
            <label>
              Kelompok (opsional)
              <select
                value={form.guestGroup}
                onChange={(e) =>
                  setForm({ ...form, guestGroup: e.target.value as GuestGroup })
                }
              >
                <option value="">— pilih kelompok —</option>
                {GUEST_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
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
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count} orang
                  </option>
                ))}
              </select>
            </label>
            <button className="button button-solid">Buat undangan</button>
          </form>
          {notice && <p className="admin-notice">{notice}</p>}
        </aside>
        <section className="guest-list">
          <div className="list-heading">
            <div>
              <p className="eyebrow">DAFTAR TAMU</p>
              <h2>{loading ? "Memuat…" : `${guests.length} undangan`}</h2>
            </div>
          </div>
          {!loading && guests.length === 0 && (
            <div className="empty-state">
              Belum ada tamu. Buat link personal pertama di panel kiri.
            </div>
          )}
          {guests.map((guest) => (
            <article className="guest-row" key={guest.id}>
              <div className="guest-name">
                <b>{guest.guest_name}</b>
                <span>
                  {guest.guest_group || "Tanpa kelompok"} · {guest.max_guests}{" "}
                  orang
                </span>
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
                        ? "Sudah dibuka"
                        : "Belum dibuka"}
                </span>
              </div>
              <div className="guest-actions">
                <button onClick={() => copy(guest.token)}>Salin link</button>
                <button onClick={() => action(guest.id, "reset-device")}>
                  Reset perangkat
                </button>
                <button
                  className="danger"
                  onClick={() => setDeleteGuest(guest)}
                >
                  Hapus
                </button>
                <button onClick={() => setEditGuest(guest)}>Edit</button>
                <button
                  className="danger"
                  onClick={() => action(guest.id, "toggle-status")}
                >
                  {guest.status === "active" ? "Cabut" : "Aktifkan"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </section>
      {editGuest && (
        <EditDialog
          guest={editGuest}
          onClose={() => setEditGuest(null)}
          onSaved={(msg) => {
            setNotice(msg);
            load();
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
          }}
        />
      )}
    </main>
  )
}
