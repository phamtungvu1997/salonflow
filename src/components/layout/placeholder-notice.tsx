export function PlaceholderNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-4 rounded-lg border border-dashed border-salon-sand/80 bg-salon-sand/15 px-4 py-3 text-sm text-foreground/80"
      role="note"
      data-testid="placeholder-notice"
    >
      {children}
    </div>
  );
}
