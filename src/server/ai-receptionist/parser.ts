import { APP_TIME_ZONE, addDays } from "@/server/time";

import { detectConsultNeed, type ConsultNeed } from "./consultation";
import type { CatalogService, CatalogStaff } from "./types";

export type ConsultIntent =
  | "recommend"
  | "compare"
  | "price"
  | "duration"
  | "catalog"
  | "salon_info"
  | "service_details"
  | null;

export type ParsedIntent = {
  confirmation: boolean | null;
  rejection: boolean;
  staffAny: boolean;
  serviceId: string | null;
  staffId: string | null;
  date: string | null;
  start: string | null;
  preferAfternoon: boolean;
  preferMorning: boolean;
  bookingIntent: boolean;
  consultIntent: ConsultIntent;
  consultNeed: ConsultNeed;
};

function berlinTodayStr(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ß/g, "ss");
}

function parseTimeToken(text: string): string | null {
  const normalized = normalize(text);

  const hhmm = normalized.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (hhmm) {
    return `${hhmm[1]!.padStart(2, "0")}:${hhmm[2]}`;
  }

  const uhr = normalized.match(/\b([01]?\d|2[0-3])\s*uhr\b/);
  if (uhr) {
    return `${uhr[1]!.padStart(2, "0")}:00`;
  }

  const english = normalized.match(/\b([01]?\d|2[0-3])\s*(am|pm)\b/);
  if (english) {
    let hour = Number(english[1]);
    if (english[2] === "pm" && hour < 12) hour += 12;
    if (english[2] === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:00`;
  }

  return null;
}

function parseDateToken(text: string, now = new Date()): string | null {
  const normalized = normalize(text);
  const today = berlinTodayStr(now);

  if (/\bheute\b|\btoday\b/.test(normalized)) return today;
  if (/\bmorgen\b|\btomorrow\b/.test(normalized)) return addDays(today, 1);
  if (/\bubermorgen\b|\bübermorgen\b/.test(normalize(text))) return addDays(today, 2);

  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const de = text.match(/\b(\d{1,2})\.(\d{1,2})\.?(20\d{2})?\b/);
  if (de) {
    const day = de[1]!.padStart(2, "0");
    const month = de[2]!.padStart(2, "0");
    const year = de[3] ?? today.slice(0, 4);
    return `${year}-${month}-${day}`;
  }

  return null;
}

function matchService(text: string, services: CatalogService[]): string | null {
  const normalized = normalize(text);
  const ranked = services
    .map((sv) => {
      const name = normalize(sv.name);
      if (normalized.includes(name)) return { id: sv.id, score: name.length + 10 };
      const tokens = name.split(/\s+/).filter((t) => t.length >= 3);
      const hit = tokens.some((t) => normalized.includes(t));
      return hit ? { id: sv.id, score: Math.max(...tokens.map((t) => t.length)) } : null;
    })
    .filter((x): x is { id: string; score: number } => Boolean(x))
    .sort((a, b) => b.score - a.score);

  if (!ranked[0]) {
    if (/\bshellac\b/.test(normalized)) {
      return services.find((s) => normalize(s.name).includes("shellac"))?.id ?? null;
    }
    if (/\bbiab\b/.test(normalized)) {
      return services.find((s) => /biab/i.test(s.name))?.id ?? null;
    }
    if (/\bacryl\b/.test(normalized)) {
      return services.find((s) => /acryl/i.test(s.name))?.id ?? null;
    }
    if (/\bgel\b|\bgelnagel\b/.test(normalized)) {
      return (
        services.find((s) => /gel auffullen|gel /i.test(s.name))?.id ??
        services.find((s) => /gel|biab/i.test(s.name))?.id ??
        null
      );
    }
    if (/\bmaniku?re\b|\bmani\b/.test(normalized)) {
      return services.find((s) => /mani/i.test(s.name))?.id ?? null;
    }
    if (/\bpediku?re\b|\bpedi\b/.test(normalized)) {
      return services.find((s) => /pedi/i.test(s.name))?.id ?? null;
    }
  }

  return ranked[0]?.id ?? null;
}

function matchStaff(text: string, staff: CatalogStaff[]): string | null {
  const normalized = normalize(text);
  for (const member of staff) {
    const full = normalize(member.displayName);
    const first = full.split(/\s+/)[0] ?? full;
    if (normalized.includes(full) || (first.length >= 3 && normalized.includes(first))) {
      return member.id;
    }
  }
  return null;
}

function detectConsultIntent(text: string, hasService: boolean): ConsultIntent {
  const n = normalize(text);

  if (
    /\b(offnungszeit|adresse|wo seid ihr|standort|telefon|salon info|uber euch|uber sie)\b/.test(n)
  ) {
    return "salon_info";
  }
  if (
    /\b(vergleich|unterschied|besser|welche methode|was ist besser|shellac oder|gel oder|acryl oder)\b/.test(
      n,
    )
  ) {
    return "compare";
  }
  if (/\b(was kostet|preis|preise|wie teuer|kosten)\b/.test(n)) {
    return hasService ? "price" : "catalog";
  }
  if (/\b(wie lange|dauer|dauert|minuten)\b/.test(n)) {
    return hasService ? "duration" : "catalog";
  }
  if (/\b(leistungen|katalog|angebot|was bietet|welche behandlungen|alle leistungen|service list|menu)\b/.test(n)) {
    return "catalog";
  }
  if (
    /\b(empfehl|empfieh|raten|welche behandlung|was passt|beratung|beraten|unsicher|fur den alltag|für den alltag)\b/.test(
      n,
    ) ||
    /\bwas (soll|kann) ich\b/.test(n)
  ) {
    return "recommend";
  }
  if (hasService && /\b(was ist|erklar|erkläre|info zu|mehr zu|details)\b/.test(n)) {
    return "service_details";
  }
  if (hasService && !/\b(termin|buchen|morgen|heute|uhr|nachmittag|vormittag)\b/.test(n)) {
    return "service_details";
  }
  return null;
}

export function parseCustomerMessage(
  text: string,
  catalog: { services: CatalogService[]; staff: CatalogStaff[] },
  now = new Date(),
): ParsedIntent {
  const normalized = normalize(text);
  const serviceId = matchService(text, catalog.services);

  const confirmation =
    /\b(ja|yes|bitte buchen|buchen|bestaetigen|bestatigen|confirm|ok|okay|gerne)\b/.test(
      normalized,
    ) && !/\b(nein|no|nicht|abbrechen|cancel)\b/.test(normalized)
      ? true
      : /\b(nein|no|nicht buchen|abbrechen|cancel)\b/.test(normalized)
        ? false
        : null;

  const rejection = confirmation === false;
  const staffAny = /\b(egal|anyone|anybody|keine praferenz|keinen wunsch|wurscht|irgendwem)\b/.test(
    normalized,
  );
  const preferAfternoon = /\b(nachmittag|afternoon|nachmittags)\b/.test(normalized);
  const preferMorning = /\b(vormittag|morgenfruh|morning|vormittags)\b/.test(normalized);
  const bookingIntent =
    /\b(termin|book|booking|appointment|buchen|verfugbar|verfugbarkeit|frei)\b/.test(normalized) ||
    Boolean(parseDateToken(text, now)) ||
    Boolean(parseTimeToken(text));

  return {
    confirmation,
    rejection,
    staffAny,
    serviceId,
    staffId: matchStaff(text, catalog.staff),
    date: parseDateToken(text, now),
    start: parseTimeToken(text),
    preferAfternoon,
    preferMorning,
    bookingIntent,
    consultIntent: detectConsultIntent(text, Boolean(serviceId)),
    consultNeed: detectConsultNeed(text),
  };
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatGermanDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}
