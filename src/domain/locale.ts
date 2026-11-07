/** German operational defaults for future booking/domain work. */
export const APP_LOCALE = "de-DE" as const;
export const APP_TIME_ZONE = "Europe/Berlin" as const;
export const WEEK_STARTS_ON = 1 as const; // Monday

export function formatGermanDate(date: Date): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatGermanTime(date: Date): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatEuro(amountCents: number): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}
