import { formatEuro } from "./parser";
import type { CatalogService } from "./types";

export type ConsultNeed =
  | "everyday"
  | "long_lasting"
  | "natural"
  | "extension"
  | "feet"
  | "hands"
  | "sensitive"
  | "unknown";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ß/g, "ss");
}

function findByKeywords(services: CatalogService[], patterns: RegExp[]): CatalogService[] {
  return services.filter((sv) => patterns.some((p) => p.test(normalize(sv.name))));
}

function pickOne(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)] ?? options[0]!;
}

export function detectConsultNeed(text: string): ConsultNeed {
  const n = normalize(text);
  if (/\b(fusse|fuss|pedi|pediku|feet)\b/.test(n)) return "feet";
  if (/\b(hande|hand|mani|maniku)\b/.test(n)) return "hands";
  if (/\b(empfind|allerg|sensib|aceton)\b/.test(n)) return "sensitive";
  if (/\b(verlanger|lange|extension|acryl)\b/.test(n)) return "extension";
  if (/\b(natur|dunne nagel|verstark|biab|aufbau)\b/.test(n)) return "natural";
  if (/\b(langlebig|haltbar|lange halten|wochen)\b/.test(n)) return "long_lasting";
  if (/\b(alltag|einfach|schnell|everyday|schick)\b/.test(n)) return "everyday";
  return "unknown";
}

export function recommendServices(
  services: CatalogService[],
  need: ConsultNeed,
): CatalogService[] {
  if (need === "feet") return findByKeywords(services, [/pedi/]);
  if (need === "hands") return findByKeywords(services, [/mani/, /shellac/, /biab/]).slice(0, 4);
  if (need === "extension") return findByKeywords(services, [/acryl/, /verlanger/, /gel/]);
  if (need === "natural") return findByKeywords(services, [/biab/, /shellac/, /mani/]);
  if (need === "long_lasting") return findByKeywords(services, [/gel/, /biab/, /shellac/, /acryl/]);
  if (need === "sensitive") return findByKeywords(services, [/mani/, /biab/, /shellac/]);
  if (need === "everyday") return findByKeywords(services, [/shellac/, /mani/, /biab/]);
  return services.slice(0, 5);
}

function methodBlurb(service: CatalogService): string {
  const n = normalize(service.name);
  if (n.includes("shellac")) {
    return "hält meist 2-3 Wochen, sieht schön gepflegt aus und ist im Alltag super entspannt.";
  }
  if (n.includes("biab")) {
    return "verstärkt den Naturnagel dezent - ideal, wenn die Nägel eher dünn oder brüchig sind.";
  }
  if (n.includes("gel")) {
    return "gibt mehr Halt und Aufbau; zum Auffüllen alle paar Wochen sinnvoll.";
  }
  if (n.includes("acryl")) {
    return "sehr stabil und gut für Länge/Form - etwas aufwendiger, dafür richtig robust.";
  }
  if (n.includes("spa") && n.includes("pedi")) {
    return "Pflege plus Wellness - wenn Sie die Füße verwöhnen wollen.";
  }
  if (n.includes("pedi")) {
    return "gründliche Fußpflege, klar und pflegend.";
  }
  if (n.includes("mani")) {
    return "klassische Pflege und Form - schön leicht, wenn Sie keine lange Modellage möchten.";
  }
  return "passt gut, wenn Ihnen diese Richtung sympathisch ist.";
}

export function describeServiceDetails(service: CatalogService): string {
  return `${service.name} machen wir so: ${methodBlurb(service)} Bei uns kostet das ${formatEuro(service.priceCents)} und dauert ungefähr ${service.durationMinutes} Minuten.`;
}

export function compareMethods(services: CatalogService[]): string {
  const shellac = findByKeywords(services, [/shellac/])[0];
  const biab = findByKeywords(services, [/biab/])[0];
  const gel =
    findByKeywords(services, [/gel auffullen|gel /])[0] ?? findByKeywords(services, [/gel/])[0];
  const acryl = findByKeywords(services, [/acryl/])[0];

  const lines: string[] = [];

  if (shellac) {
    lines.push(
      `Wenn Sie vor allem eine schöne Farbe für den Alltag möchten, nehmen die meisten Shellac. Das bleibt auf dem eigenen Nagel, hält ungefähr zwei bis drei Wochen und kostet ${formatEuro(shellac.priceCents)}.`,
    );
  }
  if (biab) {
    lines.push(
      `BIAB ist etwas anderes. Da kommt eine dünne Gelschicht auf den eigenen Nagel, damit er stabiler wird, ohne gleich viel länger auszusehen. Das nehmen wir, wenn die Nägel dünn sind oder leicht einreißen. Kostet ${formatEuro(biab.priceCents)}.`,
    );
  } else if (gel) {
    lines.push(
      `Wenn der Nagel mehr Halt braucht, wäre Gel die Richtung. Das kostet ${formatEuro(gel.priceCents)} und wird alle paar Wochen aufgefüllt.`,
    );
  }
  if (acryl) {
    lines.push(
      `Acryl machen wir erst, wenn Sie wirklich Länge und eine feste Form wollen. Das ist am stabilsten, dafür auch der größere Termin, ${formatEuro(acryl.priceCents)}.`,
    );
  }

  lines.push(
    "Was ist Ihnen wichtiger: die Farbe, dass der eigene Nagel stabiler wird, oder dass er länger wird?",
  );

  return lines.join("\n\n");
}

export function buildCatalogOverview(services: CatalogService[]): string {
  const groups = new Map<string, CatalogService[]>();
  for (const service of services) {
    const key = service.categoryName || "Leistungen";
    const list = groups.get(key) ?? [];
    list.push(service);
    groups.set(key, list);
  }

  const sections = [...groups.entries()].map(([category, items]) => {
    const lines = items
      .map((service) => `${service.name}: ${formatEuro(service.priceCents)}, etwa ${service.durationMinutes} Minuten`)
      .join("\n");
    return `${category}\n${lines}`;
  });

  return [
    "Das sind die Leistungen, die wir in diesem Salon anbieten. Preise und Dauer kommen aus dem aktuellen Katalog.",
    sections.join("\n\n"),
    "Nennen Sie einfach eine Behandlung, dann erkläre ich sie genauer oder suche einen Termin.",
  ].join("\n\n");
}

export function buildRecommendationReply(
  services: CatalogService[],
  need: ConsultNeed,
  focusedService?: CatalogService | null,
): { text: string; suggestions: CatalogService[] } {
  if (focusedService) {
    return {
      text: `${describeServiceDetails(focusedService)}\n\n${pickOne([
        "Wenn das gut klingt: sagen Sie einfach einen Tag, dann schaue ich nach freien Zeiten.",
        "Passt das so? Dann nennen Sie mir gern einen Wunschtag.",
        "Möchten Sie das buchen, oder lieber noch eine Alternative hören?",
      ])}`,
      suggestions: [focusedService],
    };
  }

  const suggestions = recommendServices(services, need);
  if (need === "unknown" || suggestions.length === 0) {
    return {
      text: compareMethods(services),
      suggestions: recommendServices(services, "everyday"),
    };
  }

  const top = suggestions[0]!;
  const alt = suggestions[1];

  const needLine =
    need === "feet"
      ? "Für die Füße würde ich Ihnen"
      : need === "extension"
        ? "Wenn die Nägel länger werden sollen, würde ich Ihnen"
        : need === "natural"
          ? "Wenn die eigenen Nägel etwas Halt brauchen, würde ich Ihnen"
          : need === "long_lasting"
            ? "Wenn es länger halten soll, würde ich Ihnen"
            : need === "sensitive"
              ? "Wenn es möglichst schonend sein soll, würde ich Ihnen"
              : "Für den Alltag würde ich Ihnen";

  let text = `${needLine} ${top.name} empfehlen. ${methodBlurb(top)} Das kostet ${formatEuro(top.priceCents)} und dauert ungefähr ${top.durationMinutes} Minuten.`;
  if (alt) {
    text += ` ${alt.name} wäre die andere Richtung, das kostet ${formatEuro(alt.priceCents)}.`;
  }
  text += " Soll ich dazu einen Termin suchen?";

  return { text, suggestions };
}

export function buildSalonInfoReply(): string {
  return pickOne([
    "Wir sind in Hamburg (Jeannie und Juliet), Heide kommt später dazu. Hier im Chat kann ich beraten und echte Termine prüfen. Wonach ist Ihnen?",
    "Kurz gesagt: zwei Salons in Hamburg, Preise und Zeiten aus dem echten Katalog. Soll ich eher beraten oder gleich schauen, wann Sie kommen können?",
  ]);
}
