"use client";

import {
  CalendarDays,
  LifeBuoy,
  MessageCircle,
  Search,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSalon } from "@/features/salons/salon-context";

import {
  articlesFor,
  SUPPORT_ARTICLES,
  SUPPORT_TOPICS,
  type SupportArticle,
  type SupportTopicId,
} from "./support-content";

type Entry = { id: string; kind: "idea" | "message"; title: string; body: string; createdAt: string };

const TOPIC_ICON = {
  kalender: CalendarDays,
  kunden: Users,
  buchung: Search,
  dialog: MessageCircle,
} as const;

export function SupportCenter() {
  const { activeSalon } = useSalon();
  const salonId = activeSalon?.id ?? null;
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<SupportTopicId | null>(null);
  const [article, setArticle] = useState<SupportArticle | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaBody, setIdeaBody] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!salonId) return;
    let active = true;
    void fetch(`/api/support?salonId=${encodeURIComponent(salonId)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body: { entries?: Entry[] }) => {
        if (active) setEntries(body.entries ?? []);
      })
      .catch(() => {
        if (active) setError("Die gespeicherten Nachrichten konnten nicht geladen werden.");
      });
    return () => {
      active = false;
    };
  }, [salonId]);

  const articles = useMemo(() => articlesFor(query ? null : topic, query), [query, topic]);
  const ideas = entries.filter((entry) => entry.kind === "idea");
  const messages = entries.filter((entry) => entry.kind === "message");

  async function save(kind: "idea" | "message", title: string, body: string) {
    if (!salonId) return false;
    setError(null);
    setNotice(null);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ salonId, kind, title, body }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; entries?: Entry[] };
    if (!response.ok) {
      setError(payload.error ?? "Das konnte nicht gespeichert werden.");
      return false;
    }
    setEntries(payload.entries ?? []);
    setNotice(
      kind === "idea"
        ? "Der Wunsch ist für diesen Salon gespeichert. Er wird nicht nach außen geschickt."
        : "Die Nachricht ist für diesen Salon gespeichert. Es geht nichts an einen externen Dienst.",
    );
    return true;
  }

  return (
    <div className="relative min-h-full bg-background" data-testid="page-support">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <LifeBuoy className="size-4 text-primary" />
          Support-Zentrum
        </div>
      </header>

      <section className="bg-muted/40 px-6 py-10">
        <h1 className="text-center font-display text-3xl text-foreground">Hallo, wobei können wir helfen?</h1>
        <label className="mx-auto mt-5 block max-w-xl">
          <span className="sr-only">Artikel suchen</span>
          <span className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setArticle(null);
              }}
              placeholder="Begriff oder Thema suchen"
              className="w-full bg-transparent text-sm outline-none"
              data-testid="support-search"
            />
          </span>
        </label>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {article ? (
          <article className="rounded-2xl border border-border bg-card p-6">
            <button
              type="button"
              className="text-sm font-medium text-primary"
              onClick={() => setArticle(null)}
            >
              Zurück zur Übersicht
            </button>
            <h2 className="mt-3 font-display text-2xl">{article.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-foreground/90">
              {article.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <Link href={article.href} className="mt-5 inline-flex text-sm font-semibold text-primary">
              {article.hrefLabel}
            </Link>
          </article>
        ) : (
          <>
            {!query ? (
              <section>
                <h2 className="text-sm font-semibold">Themen</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {SUPPORT_TOPICS.map((item) => {
                    const Icon = TOPIC_ICON[item.id];
                    const selected = topic === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTopic(selected ? null : item.id)}
                        className={`rounded-2xl border p-4 text-left ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                        data-testid={`support-topic-${item.id}`}
                      >
                        <Icon className="size-5 text-primary" />
                        <div className="mt-6 text-sm font-semibold">{item.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-border bg-muted/50 p-5">
              <h2 className="text-sm font-semibold">Die nächste Funktion mitentscheiden</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Schreiben Sie einen Wunsch für diesen Salon. Er bleibt hier gespeichert und wird nicht an einen externen Dienst gesendet.
              </p>
              <form
                className="mt-4 grid gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save("idea", ideaTitle, ideaBody).then((saved) => {
                    if (!saved) return;
                    setIdeaTitle("");
                    setIdeaBody("");
                  });
                }}
              >
                <input
                  value={ideaTitle}
                  onChange={(event) => setIdeaTitle(event.target.value)}
                  placeholder="Kurzer Titel"
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  data-testid="support-idea-title"
                />
                <textarea
                  value={ideaBody}
                  onChange={(event) => setIdeaBody(event.target.value)}
                  placeholder="Was soll SalonFlow können?"
                  rows={3}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  data-testid="support-idea-body"
                />
                <button
                  type="submit"
                  disabled={!ideaTitle.trim() || !ideaBody.trim()}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Wunsch speichern
                </button>
              </form>
              {ideas.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {ideas.map((idea) => (
                    <li key={idea.id} className="rounded-xl bg-card px-3 py-2">
                      <div className="font-medium">{idea.title}</div>
                      <div className="text-muted-foreground">{idea.body}</div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section>
              <h2 className="text-sm font-semibold">{query || topic ? "Passende Artikel" : "Häufige Artikel"}</h2>
              {articles.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Kein Artikel dazu. Schreiben Sie uns über die Nachricht unten rechts.</p>
              ) : (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {(query || topic ? articles : SUPPORT_ARTICLES.slice(0, 6)).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setArticle(item)}
                      className="flex items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-muted"
                      data-testid={`support-article-${item.id}`}
                    >
                      <span>
                        <span className="block font-medium">{item.title}</span>
                        <span className="block text-xs text-muted-foreground">{item.summary}</span>
                      </span>
                      <span aria-hidden>›</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <p className="text-sm">
              <Link href="/einstellungen" className="font-medium text-primary">
                Willkommen im Support-Zentrum. Widgets und Integrationen finden Sie in den Einstellungen.
              </Link>
            </p>
          </>
        )}

        {notice ? <p className="text-sm text-primary">{notice}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {messages.length > 0 && !article ? (
          <section>
            <h2 className="text-sm font-semibold">Gespeicherte Nachrichten</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {messages.map((item) => (
                <li key={item.id} className="rounded-xl border border-border px-3 py-2">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-muted-foreground">{item.body}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        onClick={() => setMessageOpen(true)}
        aria-label="Nachricht schreiben"
        data-testid="support-message-open"
      >
        <MessageCircle className="size-5" />
      </button>

      {messageOpen ? (
        <form
          className="fixed bottom-20 right-6 z-20 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl"
          onSubmit={(event) => {
            event.preventDefault();
            void save("message", messageTitle, messageBody).then((saved) => {
              if (!saved) return;
              setMessageTitle("");
              setMessageBody("");
              setMessageOpen(false);
            });
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Nachricht an den Salon</h2>
            <button type="button" aria-label="Schließen" onClick={() => setMessageOpen(false)}>
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Bleibt in SalonFlow. Kein externer Chat.</p>
          <input
            value={messageTitle}
            onChange={(event) => setMessageTitle(event.target.value)}
            placeholder="Betreff"
            className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
            data-testid="support-message-title"
          />
          <textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="Was ist passiert?"
            rows={4}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
            data-testid="support-message-body"
          />
          <button
            type="submit"
            disabled={!messageTitle.trim() || !messageBody.trim()}
            className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Speichern
          </button>
        </form>
      ) : null}
    </div>
  );
}
