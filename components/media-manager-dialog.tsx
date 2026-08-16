"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Minus, Plus, RefreshCw, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/client-api";
import { invitationMediaSlots, type InvitationMediaFit, type InvitationMediaSlot } from "@/lib/invitation-media";

type UploadedMedia = {
  slot: InvitationMediaSlot;
  public_url: string;
  original_name: string;
  byte_size: number;
  object_fit: InvitationMediaFit;
  scale: number;
  position_x: number;
  position_y: number;
  updated_at: string;
};

type DragState = {
  slot: InvitationMediaSlot;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPositionX: number;
  startPositionY: number;
  currentPositionX: number;
  currentPositionY: number;
  original: UploadedMedia;
};

function clampPosition(value: number) {
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

export function MediaManagerDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [media, setMedia] = useState<Partial<Record<InvitationMediaSlot, UploadedMedia>>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<InvitationMediaSlot | null>(null);
  const [savingSlot, setSavingSlot] = useState<InvitationMediaSlot | null>(null);
  const groups = useMemo(() => [...new Set(invitationMediaSlots.map((item) => item.group))], []);

  useEffect(() => {
    dialogRef.current?.showModal();
    void fetch("/api/admin/media")
      .then(async (response) => {
        if (!response.ok) throw new Error(await getApiErrorMessage(response, "Daftar foto tidak dapat dimuat."));
        return response.json() as Promise<{ media?: UploadedMedia[] }>;
      })
      .then((data) => setMedia(Object.fromEntries((data.media ?? []).map((item) => [item.slot, item]))))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Daftar foto tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, []);

  async function upload(slot: InvitationMediaSlot, file: File) {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 8 MB.", { position: "top-center" });
      return;
    }
    const formData = new FormData();
    formData.set("slot", slot);
    formData.set("file", file);
    setUploadingSlot(slot);
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Upload gambar gagal."));
      const data = (await response.json()) as { media: UploadedMedia };
      setMedia((current) => ({ ...current, [slot]: data.media }));
      const label = invitationMediaSlots.find((item) => item.slot === slot)?.label ?? "Foto";
      toast.success(`${label} berhasil diperbarui untuk semua tamu.`, { position: "top-center" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gambar gagal.", { position: "top-center" });
    } finally {
      setUploadingSlot(null);
    }
  }

  async function saveDisplay(
    slot: InvitationMediaSlot,
    fit: InvitationMediaFit,
    scale: number,
    positionX?: number,
    positionY?: number,
    rollback?: UploadedMedia,
  ) {
    const current = media[slot];
    if (!current) return;
    const previous = rollback ?? current;
    const next = {
      ...current,
      object_fit: fit,
      scale,
      position_x: positionX ?? current.position_x,
      position_y: positionY ?? current.position_y,
    };
    setMedia((current) => ({ ...current, [slot]: next }));
    setSavingSlot(slot);
    try {
      const response = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slot,
          fit,
          scale,
          positionX: next.position_x,
          positionY: next.position_y,
        }),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Pengaturan foto gagal disimpan."));
      const data = (await response.json()) as { media: UploadedMedia };
      setMedia((current) => ({ ...current, [slot]: data.media }));
    } catch (error) {
      setMedia((current) => ({ ...current, [slot]: previous }));
      toast.error(error instanceof Error ? error.message : "Pengaturan foto gagal disimpan.", { position: "top-center" });
    } finally {
      setSavingSlot(null);
    }
  }

  function adjustZoom(slot: InvitationMediaSlot, direction: -1 | 1) {
    const current = media[slot];
    if (!current) return;
    const scale = Math.min(2.5, Math.max(0.5, Math.round((current.scale + direction * 0.1) * 10) / 10));
    void saveDisplay(slot, current.object_fit, scale);
  }

  function startPositioning(event: React.PointerEvent<HTMLDivElement>, slot: InvitationMediaSlot) {
    const current = media[slot];
    if (!current || savingSlot || uploadingSlot) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      slot,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: current.position_x,
      startPositionY: current.position_y,
      currentPositionX: current.position_x,
      currentPositionY: current.position_y,
      original: current,
    };
  }

  function movePosition(event: React.PointerEvent<HTMLDivElement>, slot: InvitationMediaSlot) {
    const drag = dragRef.current;
    if (!drag || drag.slot !== slot || drag.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const positionX = clampPosition(drag.startPositionX - ((event.clientX - drag.startClientX) / bounds.width) * 100);
    const positionY = clampPosition(drag.startPositionY - ((event.clientY - drag.startClientY) / bounds.height) * 100);
    drag.currentPositionX = positionX;
    drag.currentPositionY = positionY;
    setMedia((current) => {
      const item = current[slot];
      return item ? { ...current, [slot]: { ...item, position_x: positionX, position_y: positionY } } : current;
    });
  }

  function finishPositioning(event: React.PointerEvent<HTMLDivElement>, slot: InvitationMediaSlot) {
    const drag = dragRef.current;
    if (!drag || drag.slot !== slot || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    if (drag.currentPositionX === drag.startPositionX && drag.currentPositionY === drag.startPositionY) return;
    void saveDisplay(
      slot,
      drag.original.object_fit,
      drag.original.scale,
      drag.currentPositionX,
      drag.currentPositionY,
      drag.original,
    );
  }

  function nudgePosition(slot: InvitationMediaSlot, changeX: number, changeY: number) {
    const current = media[slot];
    if (!current || savingSlot || uploadingSlot) return;
    void saveDisplay(
      slot,
      current.object_fit,
      current.scale,
      clampPosition(current.position_x + changeX),
      clampPosition(current.position_y + changeY),
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="edit-dialog media-manager-dialog"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}
    >
      <div className="edit-dialog-inner media-manager-inner">
        <button className="dialog-close" onClick={onClose} aria-label="Tutup pengelola foto"><X size={18} /></button>
        <div className="media-manager-heading">
          <div><p className="eyebrow">FOTO UNDANGAN</p><h2>Ganti foto di tempatnya.</h2></div>
          <p>Drag foto untuk memilih area yang terlihat, lalu gunakan fit dan zoom. Perubahan berlaku untuk seluruh link tamu.</p>
        </div>

        {loading ? (
          <div className="media-manager-loading"><RefreshCw size={18} /> Memuat foto…</div>
        ) : (
          <div className="media-manager-content">
            {groups.map((group) => (
              <section className="media-slot-group" key={group}>
                <div className="media-slot-group-title"><span>{group}</span><i /></div>
                <div className="media-slot-grid">
                  {invitationMediaSlots.filter((item) => item.group === group).map((item) => {
                    const uploaded = media[item.slot];
                    const uploading = uploadingSlot === item.slot;
                    const saving = savingSlot === item.slot;
                    return (
                      <article className="media-slot-card" key={item.slot}>
                        <div
                          className={`media-slot-preview ${uploaded ? "is-adjustable" : ""}`}
                          role={uploaded ? "group" : undefined}
                          aria-label={uploaded ? `Atur area ${item.label}. Geser foto atau gunakan tombol panah.` : undefined}
                          tabIndex={uploaded ? 0 : -1}
                          onPointerDown={(event) => startPositioning(event, item.slot)}
                          onPointerMove={(event) => movePosition(event, item.slot)}
                          onPointerUp={(event) => finishPositioning(event, item.slot)}
                          onPointerCancel={(event) => finishPositioning(event, item.slot)}
                          onKeyDown={(event) => {
                            const changes = {
                              ArrowLeft: [-5, 0],
                              ArrowRight: [5, 0],
                              ArrowUp: [0, -5],
                              ArrowDown: [0, 5],
                            } as const;
                            const change = changes[event.key as keyof typeof changes];
                            if (!change) return;
                            event.preventDefault();
                            nudgePosition(item.slot, change[0], change[1]);
                          }}
                        >
                          <img
                            src={uploaded?.public_url ?? item.defaultUrl}
                            alt={`Pratinjau ${item.label}`}
                            draggable={false}
                            style={uploaded ? {
                              objectFit: uploaded.object_fit,
                              objectPosition: `${uploaded.position_x}% ${uploaded.position_y}%`,
                              transform: `scale(${uploaded.scale})`,
                              transformOrigin: `${uploaded.position_x}% ${uploaded.position_y}%`,
                            } : undefined}
                          />
                          <span className={uploaded ? "is-uploaded" : ""}>{uploaded ? "R2" : "Default"}</span>
                          {uploaded && <><i className="media-focus-point" style={{ left: `${uploaded.position_x}%`, top: `${uploaded.position_y}%` }} /><em>Geser untuk pilih area</em></>}
                        </div>
                        <div className="media-slot-copy">
                          <div><b>{item.label}</b><small>{uploaded?.original_name ?? "Belum diganti"}</small></div>
                          <label className={uploading ? "is-uploading" : ""}>
                            {uploading ? <RefreshCw size={14} /> : uploaded ? <ImageIcon size={14} /> : <Upload size={14} />}
                            {uploading ? "Mengunggah…" : uploaded ? "Ganti" : "Upload"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              disabled={uploadingSlot !== null}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) void upload(item.slot, file);
                              }}
                            />
                          </label>
                        </div>
                        {uploaded ? (
                          <div className={`media-slot-controls ${saving ? "is-saving" : ""}`}>
                            <div className="media-fit-options" aria-label={`Mode tampilan ${item.label}`}>
                              <button
                                type="button"
                                className={uploaded.object_fit === "contain" ? "is-active" : ""}
                                disabled={savingSlot !== null || uploadingSlot !== null}
                                onClick={() => void saveDisplay(item.slot, "contain", 1)}
                              >Auto fit</button>
                              <button
                                type="button"
                                className={uploaded.object_fit === "cover" ? "is-active" : ""}
                                disabled={savingSlot !== null || uploadingSlot !== null}
                                onClick={() => void saveDisplay(item.slot, "cover", 1)}
                              >Fill frame</button>
                            </div>
                            <div className="media-zoom-control" aria-label={`Zoom ${item.label}`}>
                              <button type="button" aria-label="Zoom out" disabled={savingSlot !== null || uploaded.scale <= 0.5} onClick={() => adjustZoom(item.slot, -1)}><Minus size={13} /></button>
                              <output aria-live="polite">{Math.round(uploaded.scale * 100)}%</output>
                              <button type="button" aria-label="Zoom in" disabled={savingSlot !== null || uploaded.scale >= 2.5} onClick={() => adjustZoom(item.slot, 1)}><Plus size={13} /></button>
                            </div>
                          </div>
                        ) : (
                          <p className="media-slot-hint">Upload foto untuk mengatur fit dan zoom.</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        <p className="media-manager-footnote">Format JPG, PNG, WebP, atau GIF. Maksimal 8 MB per foto.</p>
      </div>
    </dialog>
  );
}
