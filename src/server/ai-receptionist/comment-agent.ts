import { formatEuro, parseCustomerMessage } from "./parser";
import type { CatalogService, CatalogStaff } from "./types";

export type CommentChannel = "instagram" | "tiktok";

export function buildCommentPrivateReply(
  comment: string,
  catalog: { services: CatalogService[]; staff: CatalogStaff[] },
  bookingUrl: string,
): string {
  const intent = parseCustomerMessage(comment, catalog);
  const service = intent.serviceId
    ? catalog.services.find((item) => item.id === intent.serviceId)
    : undefined;
  const asksPrice =
    intent.consultIntent === "price" ||
    intent.consultIntent === "service_details" ||
    /preis|kostet|kosten|how much|wieviel|wie viel/i.test(comment);
  const asksBooking =
    intent.bookingIntent ||
    intent.consultIntent === "salon_info" ||
    /termin|buchen|buchung|appointment|how can i|wie kann ich/i.test(comment);

  const thanks = "Danke für Ihren Kommentar.";
  const link = `Hier können Sie direkt online einen Termin buchen: ${bookingUrl}`;
  const follow =
    "Wenn Sie lieber hier weiterschreiben, sagen Sie mir einfach Leistung und Wunschtag.";

  if (service && asksPrice) {
    return `${thanks} ${service.name} kostet ${formatEuro(service.priceCents)} und dauert ${service.durationMinutes} Minuten. ${link}\n\n${follow}`;
  }
  if (asksBooking || asksPrice) {
    return `${thanks} ${link}\n\n${follow}`;
  }
  return `${thanks} ${link}\n\nWobei darf ich Ihnen helfen, Preis oder Termin?`;
}
