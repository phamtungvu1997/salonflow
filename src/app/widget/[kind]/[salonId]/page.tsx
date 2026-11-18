"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type PublicWidget = {
  salon: { name: string; city: string; email: string };
  services: { name: string; category: string; minutes: number; cents: number }[];
  site: { title: string; subtitle: string; body: string };
  feedback: { prompt: string; color: string };
  gift: { amounts: number[] };
};

export default function PublicWidgetPage() {
  const params = useParams<{ kind: string; salonId: string }>();
  const [data, setData] = useState<PublicWidget | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [gift, setGift] = useState({ amount: 5000, buyerName: "", buyerEmail: "", recipientName: "" });

  useEffect(() => {
    void fetch(`/api/widgets/public?salonId=${encodeURIComponent(params.salonId)}`)
      .then((response) => response.json())
      .then((body: PublicWidget) => setData(body));
  }, [params.salonId]);

  if (!data) return <p className="p-6 text-sm">Wird geladen…</p>;
  const euro = (cents: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

  if (params.kind === "preise") {
    let last = "";
    return (
      <main className="space-y-2 p-4 text-sm">
        <h1 className="text-lg font-semibold">{data.salon.name}</h1>
        {data.services.map((service) => {
          const show = service.category !== last;
          last = service.category;
          return (
            <div key={`${service.category}-${service.name}`}>
              {show ? <p className="mt-3 inline-block rounded-full bg-[#5c345f] px-2 py-0.5 text-[11px] text-white">{service.category}</p> : null}
              <div className="flex justify-between border-b py-2">
                <span>{service.name}</span>
                <span>{service.minutes} Min. · {euro(service.cents)}</span>
              </div>
            </div>
          );
        })}
      </main>
    );
  }

  if (params.kind === "feedback") {
    return (
      <main className="mx-auto max-w-md space-y-3 p-6">
        <h1 className="text-xl font-semibold">{data.salon.name}</h1>
        <p>{data.feedback.prompt}</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} className={`h-10 w-10 rounded-full ${rating === star ? "bg-[#5c345f] text-white" : "bg-[#efe4dc]"}`}>
              {star}
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="w-full rounded-xl border p-2" rows={3} />
        <button
          type="button"
          onClick={() =>
            void fetch("/api/widgets/public", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ kind: "feedback", salonId: params.salonId, rating, comment }),
            }).then(() => setDone("Danke, Ihre Bewertung ist gespeichert."))
          }
          className="rounded-full bg-[#5c345f] px-4 py-2 text-sm text-white"
        >
          Senden
        </button>
        {done ? <p>{done}</p> : null}
      </main>
    );
  }

  if (params.kind === "gutschein") {
    return (
      <main className="mx-auto max-w-md space-y-3 p-6">
        <h1 className="text-xl font-semibold">Gutschein für {data.salon.name}</h1>
        <p className="text-sm text-amber-900">Der Betrag wird nicht abgebucht. Der Salon erhält eine offene Anfrage.</p>
        <div className="flex gap-2">
          {data.gift.amounts.map((amount) => (
            <button key={amount} type="button" onClick={() => setGift({ ...gift, amount: amount * 100 })} className="rounded-full border px-3 py-1 text-sm">
              {amount} €
            </button>
          ))}
        </div>
        <input placeholder="Ihr Name" value={gift.buyerName} onChange={(event) => setGift({ ...gift, buyerName: event.target.value })} className="w-full rounded-xl border px-3 py-2" />
        <input placeholder="Ihre E-Mail" value={gift.buyerEmail} onChange={(event) => setGift({ ...gift, buyerEmail: event.target.value })} className="w-full rounded-xl border px-3 py-2" />
        <input placeholder="Name der Empfängerin" value={gift.recipientName} onChange={(event) => setGift({ ...gift, recipientName: event.target.value })} className="w-full rounded-xl border px-3 py-2" />
        <button
          type="button"
          onClick={() =>
            void fetch("/api/widgets/public", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ kind: "gift", salonId: params.salonId, amountCents: gift.amount, buyerName: gift.buyerName, buyerEmail: gift.buyerEmail, recipientName: gift.recipientName }),
            }).then((response) => setDone(response.ok ? "Anfrage gespeichert. Es wurde nichts bezahlt." : "Bitte alle Felder prüfen."))
          }
          className="rounded-full bg-[#5c345f] px-4 py-2 text-sm text-white"
        >
          Anfragen
        </button>
        {done ? <p>{done}</p> : null}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-3 p-8">
      <p className="text-xs uppercase tracking-wider text-[#6d5d68]">{data.salon.city}</p>
      <h1 className="font-serif text-4xl">{data.site.title || data.salon.name}</h1>
      <p>{data.site.subtitle}</p>
      <p className="whitespace-pre-wrap text-sm">{data.site.body}</p>
      <p className="text-sm">{data.salon.email}</p>
    </main>
  );
}
