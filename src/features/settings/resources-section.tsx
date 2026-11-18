"use client";

import { useCallback, useEffect, useState } from "react";

type FacilityType = "room" | "place" | "equipment";

interface FacilityResource {
  id: string;
  name: string;
  resourceType: FacilityType;
  active: boolean;
  upcomingBookings: number;
}

const TYPE_LABEL: Record<FacilityType, string> = {
  room: "Kabine",
  place: "Platz",
  equipment: "Gerät",
};

const SUGGESTIONS: { name: string; resourceType: FacilityType }[] = [
  { name: "Kabine 1", resourceType: "room" },
  { name: "Kabine 2", resourceType: "room" },
  { name: "Pediküre-Platz", resourceType: "place" },
];

export function ResourcesSettingsSection({ salonId }: { salonId: string }) {
  const [resources, setResources] = useState<FacilityResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [resourceType, setResourceType] = useState<FacilityType>("room");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/resources?salonId=${encodeURIComponent(salonId)}`);
    if (!response.ok) {
      setError("Ressourcen konnten nicht geladen werden.");
      setLoading(false);
      return;
    }
    const data = (await response.json()) as { resources?: FacilityResource[] };
    setResources(data.resources ?? []);
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createResource(nextName: string, nextType: FacilityType) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ salonId, name: nextName.trim(), resourceType: nextType }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Ressource konnte nicht angelegt werden.");
        return;
      }
      setName("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  const active = resources.filter((resource) => resource.active);
  const inactive = resources.filter((resource) => !resource.active);

  return (
    <div data-testid="settings-section-resources" className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Ressourcen</h2>
        <p className="mt-1 text-xs text-slate-500">
          Kabinen, Plätze und Geräte dieses Salons. Mitarbeiterinnen bleiben im Kalender ihre eigene Spalte.
          Eine hier gewählte Ressource sperrt die Booking Engine für denselben Zeitraum.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          void createResource(name, resourceType);
        }}
      >
        <label className="text-[11px] font-semibold text-slate-600">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="z. B. Kabine 1"
            className="mt-1 block w-52 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900"
          />
        </label>
        <label className="text-[11px] font-semibold text-slate-600">
          Typ
          <select
            value={resourceType}
            onChange={(event) => setResourceType(event.target.value as FacilityType)}
            className="mt-1 block rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
          >
            <option value="room">Kabine</option>
            <option value="place">Platz</option>
            <option value="equipment">Gerät</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-md bg-[#18202c] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          Hinzufügen
        </button>
        {error ? <p className="w-full text-[11px] text-rose-700">{error}</p> : null}
      </form>

      {active.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4 text-xs text-slate-600">
          <p>Noch keine Kabine oder kein Gerät. Typische Plätze für ein Nagelstudio:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.name}
                type="button"
                disabled={saving}
                onClick={() => void createResource(suggestion.name, suggestion.resourceType)}
                className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
              >
                {suggestion.name} anlegen
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Typ</th>
              <th className="px-4 py-2.5">Belegung</th>
              <th className="px-4 py-2.5 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  Ressourcen werden geladen…
                </td>
              </tr>
            ) : null}
            {active.map((resource) => (
              <ResourceRowEditor key={resource.id} resource={resource} salonId={salonId} onRefresh={load} />
            ))}
            {!loading && active.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  Keine aktive Ressource.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {inactive.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs">
          <p className="font-bold text-slate-900">Deaktiviert</p>
          <ul className="mt-2 space-y-2">
            {inactive.map((resource) => (
              <li key={resource.id} className="flex items-center justify-between gap-3">
                <span className="text-slate-600">
                  {resource.name} · {TYPE_LABEL[resource.resourceType]}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void fetch("/api/resources", {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        salonId,
                        id: resource.id,
                        name: resource.name,
                        resourceType: resource.resourceType,
                        active: true,
                      }),
                    }).then(() => load())
                  }
                  className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Wieder aktivieren
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ResourceRowEditor({
  resource,
  salonId,
  onRefresh,
}: {
  resource: FacilityResource;
  salonId: string;
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState(resource.name);
  const [resourceType, setResourceType] = useState<FacilityType>(resource.resourceType);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(resource.name);
    setResourceType(resource.resourceType);
  }, [resource.name, resource.resourceType]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/resources", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salonId,
          id: resource.id,
          name,
          resourceType,
          active: true,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`„${name}“ deaktivieren? Kommende Termine auf dieser Ressource bleiben bestehen, bis Sie sie verschieben.`)) {
      return;
    }
    const response = await fetch(
      `/api/resources?salonId=${encodeURIComponent(salonId)}&id=${encodeURIComponent(resource.id)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    await onRefresh();
  }

  return (
    <tr>
      <td className="px-4 py-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900"
        />
      </td>
      <td className="px-4 py-2">
        <select
          value={resourceType}
          onChange={(event) => setResourceType(event.target.value as FacilityType)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
        >
          <option value="room">Kabine</option>
          <option value="place">Platz</option>
          <option value="equipment">Gerät</option>
        </select>
      </td>
      <td className="px-4 py-2 text-slate-600">
        {resource.upcomingBookings > 0
          ? `${resource.upcomingBookings} kommende Termine`
          : "Frei"}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() => void save()}
            className="rounded-md bg-[#18202c] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
          >
            Löschen
          </button>
        </div>
        {error ? <p className="mt-1 text-[11px] text-rose-700">{error}</p> : null}
      </td>
    </tr>
  );
}
