"use client";

export function AppointmentNotes({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
      <h3 className="text-[15px] font-semibold text-[#1c1e21]">Notiz</h3>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Notiz schreiben"
        aria-label="Notiz"
        data-testid="booking-notes"
        className="mt-3 w-full resize-y rounded-lg border border-[#e1e4ea] px-3 py-2 text-sm placeholder:text-[#98a0aa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
      />
    </section>
  );
}
