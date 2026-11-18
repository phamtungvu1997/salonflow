import type { CatalogService, CatalogStaff } from "./types";

export type LlmHint = {
  serviceName: string | null;
  staffName: string | null;
  staffAny: boolean;
  date: string | null;
  start: string | null;
  preferAfternoon: boolean;
  preferMorning: boolean;
  confirmation: boolean | null;
  consult:
    | "recommend"
    | "compare"
    | "price"
    | "duration"
    | "catalog"
    | "salon_info"
    | "service_details"
    | null;
  language: "de" | "en" | "vi" | "other";
};

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Optional multilingual NLU. Returns null when no provider is configured.
 * The model may only propose names/times — IDs are resolved against the catalog later.
 */
export async function interpretWithLlm(
  text: string,
  catalog: { services: CatalogService[]; staff: CatalogStaff[] },
): Promise<LlmHint | null> {
  const apiKey = process.env.AI_RECEPTIONIST_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const base = process.env.AI_RECEPTIONIST_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_RECEPTIONIST_MODEL ?? "gpt-4o-mini";
  const serviceNames = catalog.services.map((s) => s.name).join(", ");
  const staffNames = catalog.staff.map((s) => s.displayName).slice(0, 16).join(", ");

  const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You interpret salon booking chats in German, English, or Vietnamese. Reply with JSON only. Never invent service or staff names outside the lists. Never output database IDs. Fields: serviceName|null, staffName|null, staffAny boolean, date YYYY-MM-DD|null, start HH:MM|null, preferAfternoon, preferMorning, confirmation true|false|null, consult recommend|compare|price|duration|catalog|salon_info|service_details|null, language de|en|vi|other.",
        },
        {
          role: "user",
          content: `Services: ${serviceNames}\nStaff: ${staffNames}\nToday is the server date context.\nCustomer: ${text}`,
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const parsed = extractJson(body.choices?.[0]?.message?.content ?? "");
  if (!parsed || typeof parsed !== "object") return null;
  const row = parsed as Record<string, unknown>;
  return {
    serviceName: typeof row.serviceName === "string" ? row.serviceName : null,
    staffName: typeof row.staffName === "string" ? row.staffName : null,
    staffAny: row.staffAny === true,
    date: typeof row.date === "string" ? row.date : null,
    start: typeof row.start === "string" ? row.start : null,
    preferAfternoon: row.preferAfternoon === true,
    preferMorning: row.preferMorning === true,
    confirmation:
      row.confirmation === true ? true : row.confirmation === false ? false : null,
    consult:
      row.consult === "recommend" ||
      row.consult === "compare" ||
      row.consult === "price" ||
      row.consult === "duration" ||
      row.consult === "catalog" ||
      row.consult === "salon_info" ||
      row.consult === "service_details"
        ? row.consult
        : null,
    language:
      row.language === "de" || row.language === "en" || row.language === "vi"
        ? row.language
        : "other",
  };
}
