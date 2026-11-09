"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { minutesLabel } from "@/features/calendar/calendar-date";

export type DragAvailabilityWarningState = {
  appointmentId: string;
  customerName: string;
  serviceName: string;
  targetStaffId: string;
  targetStaffName: string;
  targetStartMinute: number;
  targetEndMinute: number;
  unavailableReason: string;
  expectedVersion: number;
};

export function DragAvailabilityConfirmModal({
  warning,
  saving,
  onCancel,
  onConfirm,
}: {
  warning: DragAvailabilityWarningState;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      } else if (event.key === "Tab") {
        // Trap focus inside the confirmation modal
        const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(
          Boolean,
        ) as HTMLElement[];
        if (focusable.length === 2) {
          event.preventDefault();
          if (document.activeElement === focusable[0]) {
            focusable[1]!.focus();
          } else {
            focusable[0]!.focus();
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onCancel, saving]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4 backdrop-blur-[1px]"
      role="presentation"
      data-testid="drag-availability-modal-backdrop"
      onMouseDown={() => {
        if (!saving) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drag-availability-modal-title"
        aria-describedby="drag-availability-modal-desc"
        data-testid="drag-availability-modal"
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-[440px] rounded-xl border border-[#e6e8ee] bg-white px-6 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.28)]"
      >
        <p
          id="drag-availability-modal-title"
          data-testid="drag-availability-modal-message"
          className="text-center text-[15px] font-medium leading-relaxed text-[#1c1e21]"
        >
          Diese Zeit ist nicht verfügbar, möchtest du wirklich speichern?
        </p>
        <p
          id="drag-availability-modal-desc"
          data-testid="drag-availability-modal-detail"
          className="mt-1.5 text-center text-xs text-[#6d7480]"
        >
          {warning.customerName} · {minutesLabel(warning.targetStartMinute)} -{" "}
          {minutesLabel(warning.targetEndMinute)} ({warning.targetStaffName}) —{" "}
          <span className="font-medium text-[#b42318]">{warning.unavailableReason}</span>
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={saving}
            data-testid="drag-availability-cancel"
            onClick={onCancel}
            className="h-9 min-w-[92px] rounded-lg border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#1c1e21] shadow-2xs transition hover:bg-[#f4f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:opacity-50"
          >
            Nein
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={saving}
            data-testid="drag-availability-confirm"
            onClick={() => void onConfirm()}
            className="h-9 min-w-[92px] rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1f2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:opacity-50"
          >
            {saving ? "Speichert…" : "Ja"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
