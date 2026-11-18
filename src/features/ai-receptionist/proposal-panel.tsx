"use client";

import Link from "next/link";

import { STATE_LABELS, type ConversationPublicView } from "./types";

function formatEuro(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

type ProposalPanelProps = {
  conversation: ConversationPublicView | null;
  approving?: boolean;
  onApprove?: () => void;
};

export function AiProposalPanel({ conversation, approving, onApprove }: ProposalPanelProps) {
  return (
    <aside
      data-testid="ai-proposal-panel"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Gesprächsstatus</h2>
        <p className="mt-1 text-xs text-slate-600">
          {conversation
            ? STATE_LABELS[conversation.state]
            : "Kein aktives Gespräch"}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Buchungsvorschlag
        </h3>
        {conversation?.proposal ? (
          <dl className="mt-2 space-y-1.5 text-sm text-slate-800">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Leistung</dt>
              <dd className="font-medium">{conversation.proposal.serviceName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Mitarbeiterin</dt>
              <dd className="font-medium">{conversation.proposal.staffName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Datum</dt>
              <dd className="font-medium">{conversation.proposal.date}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Zeit</dt>
              <dd className="font-medium">
                {conversation.proposal.start}–{conversation.proposal.end}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Preis</dt>
              <dd className="font-medium">{formatEuro(conversation.proposal.priceCents)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Noch kein Vorschlag.</p>
        )}
        {conversation?.state === "AWAITING_STAFF_APPROVAL" ? (
          <button
            type="button"
            data-testid="ai-staff-approve"
            disabled={approving}
            onClick={onApprove}
            className="mt-3 w-full rounded-md bg-[#075e54] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {approving ? "Bucht…" : "Freigeben und buchen"}
          </button>
        ) : null}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Booking-Engine-Ergebnis
        </h3>
        {conversation?.lastBookingResult ? (
          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            <p className="font-semibold">Termin gespeichert</p>
            <p className="mt-1">ID: {conversation.lastBookingResult.appointmentId}</p>
            <p>
              {conversation.lastBookingResult.serviceName} ·{" "}
              {conversation.lastBookingResult.date} {conversation.lastBookingResult.start}
            </p>
            {conversation.lastBookingResult.reused ? (
              <p className="mt-1">Idempotent wiederverwendet</p>
            ) : null}
            {conversation.calendarHref ? (
              <Link href={conversation.calendarHref} className="mt-2 inline-block font-semibold underline">
                Im Kalender öffnen
              </Link>
            ) : null}
          </div>
        ) : conversation?.lastError ? (
          <p className="mt-2 text-xs text-rose-700">{conversation.lastError}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Noch keine Buchung. Bestätigung der Kundin ist erforderlich.
          </p>
        )}
      </div>

      {conversation?.offeredSlots?.length ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Angebotene Startzeiten
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {conversation.offeredSlots.map((slot) => (
              <span
                key={`${slot.start}-${slot.end}`}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
              >
                {slot.start}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
