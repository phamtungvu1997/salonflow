"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function AnmeldenPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Anmeldung fehlgeschlagen");
      return;
    }
    router.push("/kalender");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-panel" data-testid="page-anmelden">
      <h1 className="font-display text-3xl tracking-tight">Anmelden</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Lokale Entwicklungszugänge. Passwort für alle Seed-Konten: salonflow-dev
      </p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          E-Mail
          <input
            name="email"
            type="email"
            required
            defaultValue="empfang.jeannie@salonflow.example"
            className="mt-1 h-10 w-full rounded-md border border-input px-3"
            data-testid="login-email"
          />
        </label>
        <label className="block text-sm">
          Passwort
          <input
            name="password"
            type="password"
            required
            defaultValue="salonflow-dev"
            className="mt-1 h-10 w-full rounded-md border border-input px-3"
            data-testid="login-password"
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" data-testid="login-submit">Anmelden</Button>
      </form>
    </div>
  );
}
