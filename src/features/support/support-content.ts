export type SupportTopicId = "kalender" | "kunden" | "buchung" | "dialog";

export type SupportArticle = {
  id: string;
  topic: SupportTopicId;
  title: string;
  summary: string;
  paragraphs: string[];
  href: string;
  hrefLabel: string;
};

export const SUPPORT_TOPICS: { id: SupportTopicId; label: string; hint: string }[] = [
  { id: "kalender", label: "Kalender", hint: "Termine, Feiertage, Ressourcen" },
  { id: "kunden", label: "Kunden", hint: "Akte, Archiv, Treuepunkte" },
  { id: "buchung", label: "Online-Buchung", hint: "Link, Preise, Widgets" },
  { id: "dialog", label: "Kundendialog", hint: "Freigabe, Angebot, Beschwerde" },
];

export const SUPPORT_ARTICLES: SupportArticle[] = [
  {
    id: "termin",
    topic: "kalender",
    title: "Termin anlegen",
    summary: "Ein Termin wird nur gespeichert, wenn die Buchungsmaschine ihn annimmt.",
    paragraphs: [
      "Öffnen Sie den Kalender und wählen Sie Termin erstellen. Salon, Mitarbeiterin, Kundin, Leistung, Tag und Uhrzeit gehören zusammen.",
      "Die Oberfläche entscheidet nicht, ob die Zeit frei ist. Der Server prüft Schicht, Abwesenheit, Feiertag und Überschneidung. Erst eine erfolgreiche Antwort erscheint im Kalender.",
      "Der gespeicherte Preis und die Dauer bleiben so, wie sie in diesem Moment waren. Eine spätere Preisänderung schreibt alte Termine nicht um.",
    ],
    href: "/kalender",
    hrefLabel: "Zum Kalender",
  },
  {
    id: "feiertag",
    topic: "kalender",
    title: "Feiertag sperrt den Tag",
    summary: "Ein aktiver Feiertag legt für jede aktive Mitarbeiterin eine Abwesenheit.",
    paragraphs: [
      "Unter Einstellungen, Abwesenheiten stehen die Hamburger Feiertage. Name, Datum und Sperre lassen sich ändern.",
      "Ist Sperren an, liegt von 08:00 bis 20:00 eine Abwesenheit auf jeder aktiven Mitarbeiterin. Der Kalender zeigt den Grund, und neue Termine in dieser Zeit werden abgelehnt.",
      "Sperren aus oder die Zeile löschen öffnet den Tag wieder.",
    ],
    href: "/einstellungen",
    hrefLabel: "Zu den Einstellungen",
  },
  {
    id: "ressource",
    topic: "kalender",
    title: "Kabine oder Platz mitbuchen",
    summary: "Eine Ressource blockiert dieselbe Zeit wie die Mitarbeiterin.",
    paragraphs: [
      "Einstellungen, Ressourcen verwaltet Kabinen, Plätze und Geräte. Die Spalten im Kalender bleiben die Mitarbeiterinnen.",
      "Wählen Sie beim internen Termin optional eine Ressource. Die Buchungsmaschine schreibt dann eine zweite Belegung. Ist der Platz schon belegt, wird der Termin nicht gespeichert.",
    ],
    href: "/einstellungen",
    hrefLabel: "Zu den Ressourcen",
  },
  {
    id: "kunde",
    topic: "kunden",
    title: "Kundenakte",
    summary: "Entfernen archiviert die Kundin. Alte Termine bleiben lesbar.",
    paragraphs: [
      "Die Kundensuche findet Name und Kontakt im aktiven Salon. Ein anderer Salon sieht diese Akte nicht.",
      "Löschen setzt nur ein Archivdatum. Historische Termine behalten den gespeicherten Namen und Preis.",
    ],
    href: "/kunden",
    hrefLabel: "Zu den Kunden",
  },
  {
    id: "treue",
    topic: "kunden",
    title: "Treuepunkte",
    summary: "Punkte entstehen, wenn ein Termin auf Erledigt gesetzt wird.",
    paragraphs: [
      "Unter Einstellungen, Treuepunkte wählen Sie aus: aus, ein Punkt je Besuch, oder ein Punkt je eingestelltem Eurobetrag des gespeicherten Preises.",
      "Punkte sind kein Guthaben und keine Zahlung. Derselbe Termin vergibt die Punkte nur einmal.",
    ],
    href: "/einstellungen",
    hrefLabel: "Zu den Treuepunkten",
  },
  {
    id: "online",
    topic: "buchung",
    title: "Online-Buchung",
    summary: "Der öffentliche Link folgt den Regeln unter Online-Buchungen.",
    paragraphs: [
      "Sprache, direkte Buchung oder Anfrage, Kundenkreis, Mitarbeiterwahl, Abstand, Vorlauf und Zusatzfelder stehen in den Einstellungen.",
      "Eine Anfrage bleibt liegen, bis jemand im Salon Freigeben oder Ablehnen wählt. Freigeben schreibt den Termin über dieselbe Buchungsmaschine wie der Kalender.",
      "Kartenzahlung ist nicht angeschlossen. Der Gast bezahlt im Salon.",
    ],
    href: "/einstellungen",
    hrefLabel: "Zu den Online-Buchungen",
  },
  {
    id: "preis",
    topic: "buchung",
    title: "Preis bei einer neuen Online-Buchung",
    summary: "Katalog, dann Zeitfenster oder Last-Minute, dann Gutscheincode.",
    paragraphs: [
      "Zuerst gilt der Katalogpreis. Liegt der Beginn in einem aktiven Preisänderungsfenster, gilt dieses Prozent. Sonst gilt der Last-Minute-Rabatt, wenn der Termin nah genug liegt.",
      "Ein gültiger Code kommt danach. Ein ungültiger Code wird abgelehnt, der Termin wird dann nicht angelegt.",
      "Der Hinweis am Termin nennt die angewendete Regel. Alte Termine bleiben unverändert.",
    ],
    href: "/marketing",
    hrefLabel: "Zum Marketing",
  },
  {
    id: "warteliste",
    topic: "buchung",
    title: "Warteliste",
    summary: "Ein Eintrag reserviert keinen Stuhl.",
    paragraphs: [
      "Die Warteliste merkt sich Wunsch und Leistung. Sie blockiert keine Mitarbeiterin und ändert keinen Preis.",
      "Ein freier Platz entsteht erst, wenn jemand daraus einen echten Termin anlegt.",
    ],
    href: "/marketing",
    hrefLabel: "Zur Warteliste",
  },
  {
    id: "widget",
    topic: "buchung",
    title: "Preislisten- und Gutschein-Widget",
    summary: "Die Preisliste zeigt aktive Leistungen. Ein Gutschein ist nur eine Anfrage.",
    paragraphs: [
      "Das Preislisten-Widget liest Name, Dauer und Katalogpreis der aktiven Leistungen. Die Einstellungen liefern Größe und einen Einbettungscode.",
      "Das Gutschein-Widget speichert Betrag und Namen. Es zieht kein Geld ein und verschickt keinen Gutschein, weil kein Zahlungsanbieter verbunden ist.",
      "Widgets und Integrationen liegen in den Einstellungen, nicht in diesem Hilfeartikel.",
    ],
    href: "/einstellungen",
    hrefLabel: "Zu den Widgets",
  },
  {
    id: "freigabe",
    topic: "dialog",
    title: "Buchung im Kundendialog freigeben",
    summary: "Der Entwurf bucht nichts, bis Sie Freigeben und buchen wählen.",
    paragraphs: [
      "WhatsApp, Instagram, TikTok und E-Mail laufen hier als Simulator. Es wird keine Nachricht nach außen gesendet.",
      "Ein Terminvorschlag wartet auf die Kundin und danach auf Ihre Freigabe. Erst die Freigabe legt den Termin an.",
    ],
    href: "/ki-rezeption",
    hrefLabel: "Zum Kundendialog",
  },
  {
    id: "angebot",
    topic: "dialog",
    title: "Angebot und Beschwerde",
    summary: "Sie setzen den Preis oder die Antwort. Der Text geht in denselben Verlauf.",
    paragraphs: [
      "Ein Nagelbild erzeugt keinen Preis von selbst. Tragen Sie den Betrag ein und senden Sie das Angebot. Es erscheint im selben Kanal des Verlaufs.",
      "Bei einer Beschwerde wählen Sie Entschuldigung, neuer Termin, ein Versprechen über 10 € oder einen Rückruf. Auch das ist ein Text im Verlauf, keine Zahlung und kein neuer Termin, bis Sie einen buchen.",
    ],
    href: "/ki-rezeption",
    hrefLabel: "Zum Kundendialog",
  },
  {
    id: "abrechnung",
    topic: "buchung",
    title: "Software-Abrechnung",
    summary: "Abrechnung ist die SalonFlow-Mitgliedschaft, nicht die Kasse der Kundin.",
    paragraphs: [
      "Der Studio-Tarif und zusätzliche Mitarbeiterplätze ergeben die Monatsrechnung. Zahlung vermerken setzt sie auf bezahlt.",
      "Es wird keine Karte und keine Bank belastet. PDF ist nur ein Überweisungshinweis mit der Rechnungsnummer.",
    ],
    href: "/einstellungen",
    hrefLabel: "Zur Abrechnung",
  },
];

export function articlesFor(topic: SupportTopicId | null, query: string): SupportArticle[] {
  const needle = query.trim().toLowerCase();
  return SUPPORT_ARTICLES.filter((article) => {
    if (topic && article.topic !== topic) return false;
    if (!needle) return true;
    const haystack = `${article.title} ${article.summary} ${article.paragraphs.join(" ")}`.toLowerCase();
    return haystack.includes(needle);
  });
}
