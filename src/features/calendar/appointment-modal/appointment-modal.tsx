"use client";

import { Maximize2, Minimize2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { api } from "@/features/booking/api";
import { isoWeekdayFromDate, minutesLabel, toMinute } from "@/features/calendar/calendar-date";
import { subscribeServiceCatalogUpdates } from "@/features/services/service-catalog-sync";
import { cn } from "@/lib/utils";

import { AppointmentNotes } from "./appointment-notes";
import { AppointmentServiceRow, type ServiceLine } from "./appointment-service-row";
import { AppointmentSummary } from "./appointment-summary";
import { availabilitySlots } from "./availability";
import { CalendarEventTabForm } from "./calendar-event-tab-form";
import { CustomerSearchPanel } from "./customer-search-panel";
import { DateTimeSection, type ExtraDateSlot } from "./date-time-section";
import type { BusyRange, ModalCustomer, ModalService, ModalStaff } from "./types";

const tabs = [
  { id: "appointment", label: "Termin", title: "Termin erstellen" },
  { id: "absence", label: "Abwesenheit", title: "Abwesenheit erstellen" },
  { id: "chore", label: "Aufgabe", title: "Aufgabe erstellen" },
  { id: "note", label: "Notiz", title: "Notiz erstellen" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function addDaysYmd(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  return dt.toISOString().slice(0, 10);
}

export function AppointmentModal({
  salonId,
  initialDate,
  initialStart,
  initialStaffId,
  initialStaff,
  services: initialServices,
  preselectedCustomer = null,
  onClose,
  onBooked,
}: {
  salonId: string;
  initialDate: string;
  initialStart: string;
  initialStaffId: string;
  initialStaff: ModalStaff[];
  services: ModalService[];
  preselectedCustomer?: ModalCustomer | null;
  onClose: () => void;
  onBooked: (message?: string) => Promise<void>;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [tab, setTab] = useState<TabId>("appointment");
  const [expanded, setExpanded] = useState(false);
  const [catalogServices, setCatalogServices] = useState<ModalService[]>(initialServices);
  const [serviceId, setServiceId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationManuallyEdited, setDurationManuallyEdited] = useState(false);
  const [staffId, setStaffId] = useState(initialStaffId);
  const [extraLines, setExtraLines] = useState<ServiceLine[]>([]);
  const [date, setDate] = useState(initialDate);
  const [start, setStart] = useState(initialStart);
  const [extraDates, setExtraDates] = useState<ExtraDateSlot[]>([]);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [staff, setStaff] = useState<ModalStaff[]>(initialStaff);
  const [busy, setBusy] = useState<BusyRange[]>([]);
  const [allCustomers, setAllCustomers] = useState<ModalCustomer[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ModalCustomer[]>([]);
  const [selected, setSelected] = useState<ModalCustomer | null>(preselectedCustomer);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [walkIn, setWalkIn] = useState(false);
  const [notes, setNotes] = useState("");
  const [openList, setOpenList] = useState<string | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogNotice, setCatalogNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCatalogServices(initialServices);
  }, [initialServices]);

  const service = catalogServices.find((item) => item.id === serviceId) ?? null;

  const refreshServiceCatalog = useCallback(
    async (notifyIfSelectionAffected = false) => {
      try {
        const res = await api<{ services: ModalService[] }>(
          `/api/services?salonId=${encodeURIComponent(salonId)}`,
        );
        const latest = res.services;
        setCatalogServices(latest);

        if (serviceId) {
          const updatedSelected = latest.find((item) => item.id === serviceId);
          if (!updatedSelected) {
            setServiceId("");
            setDurationMinutes(0);
            setCatalogNotice(
              "Die ausgewählte Leistung wurde in den Einstellungen deaktiviert. Bitte wählen Sie eine aktive Leistung.",
            );
          } else {
            if (!durationManuallyEdited && updatedSelected.durationMinutes !== durationMinutes) {
              setDurationMinutes(updatedSelected.durationMinutes);
            }
            if (!updatedSelected.staffIds.includes(staffId)) {
              const fallbackStaff = staff.find((member) =>
                updatedSelected.staffIds.includes(member.id),
              );
              setStaffId(fallbackStaff?.id ?? "");
              setCatalogNotice(
                `Die Mitarbeiter-Zuordnung für „${updatedSelected.name}“ wurde aktualisiert.`,
              );
            } else if (notifyIfSelectionAffected) {
              setCatalogNotice(
                `Leistungskatalog aktualisiert („${updatedSelected.name}“).`,
              );
            }
          }
        }
      } catch {
        // Ignore transient network errors during background catalog sync
      }
    },
    [salonId, serviceId, durationManuallyEdited, durationMinutes, staffId, staff],
  );

  // Fetch authoritative catalog on modal open and subscribe to cross-tab / cross-screen updates
  useEffect(() => {
    void refreshServiceCatalog(false);
    return subscribeServiceCatalogUpdates(salonId, () => {
      void refreshServiceCatalog(true);
    });
  }, [salonId, refreshServiceCatalog]);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const focusable = () =>
      [
        ...node.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), textarea, [href]",
        ),
      ].filter((element) => !element.hasAttribute("data-focus-skip"));
    focusable()[0]?.focus();
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{
      staff: ModalStaff[];
      appointments: { staffId: string; startMinute: number; endMinute: number }[];
    }>(`/api/calendar?salonId=${salonId}&date=${date}`)
      .then((body) => {
        if (cancelled) return;
        setStaff(body.staff.filter((member) => !member.displayName.startsWith("Archiv ")));
        setBusy(body.appointments);
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, [salonId, date]);

  useEffect(() => {
    let cancelled = false;
    api<{ customers: ModalCustomer[] }>(`/api/customers?salonId=${salonId}`)
      .then((body) => {
        if (!cancelled) {
          setAllCustomers(body.customers);
          setResults(body.customers);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [salonId]);

  useEffect(() => {
    const term = query.trim();
    if (selected && term === selected.displayName) {
      setResults([]);
      return;
    }
    if (term.length === 0) {
      setResults(allCustomers);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void api<{ customers: ModalCustomer[] }>(
        `/api/customers?salonId=${salonId}&q=${encodeURIComponent(term)}`,
      )
        .then((body) => {
          if (!cancelled) setResults(body.customers);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, salonId, selected, allCustomers]);

  const effectiveDuration = durationMinutes || service?.durationMinutes || 0;

  const slots = useMemo(
    () =>
      availabilitySlots({
        shifts: staff.find((member) => member.id === staffId)?.shifts ?? [],
        weekday: isoWeekdayFromDate(date),
        durationMinutes: effectiveDuration || 45,
        busy,
        staffId,
      }),
    [staff, staffId, date, effectiveDuration, busy],
  );

  const totalDuration =
    effectiveDuration + extraLines.reduce((sum, line) => sum + (line.durationMinutes || 0), 0);
  const totalPriceCents =
    (service?.priceCents ?? 0) +
    extraLines.reduce((sum, line) => {
      const extraSvc = catalogServices.find((item) => item.id === line.serviceId);
      return sum + (extraSvc?.priceCents ?? 0);
    }, 0);

  const end = totalDuration > 0 ? minutesLabel(toMinute(start) + totalDuration) : null;

  function chooseService(id: string) {
    setServiceId(id);
    setCatalogNotice(null);
    setDurationManuallyEdited(false);
    const next = catalogServices.find((item) => item.id === id);
    if (next) {
      setDurationMinutes(next.durationMinutes);
      if (!next.staffIds.includes(staffId)) {
        const fallback = staff.find((member) => next.staffIds.includes(member.id));
        setStaffId(fallback?.id ?? "");
      }
    }
  }

  async function resolveCustomerId(): Promise<string> {
    if (selected?.id) return selected.id;
    const typedName = (adding ? newName : query).trim();
    if (typedName.length > 0 && !walkIn) {
      const existingMatch = allCustomers.find(
        (c) => c.displayName.toLocaleLowerCase("de") === typedName.toLocaleLowerCase("de"),
      );
      if (existingMatch) return existingMatch.id;
      const created = await api<{ customerId: string }>("/api/customers", {
        method: "POST",
        body: JSON.stringify({ salonId, displayName: typedName }),
      });
      return created.customerId;
    }
    const existingWalkIn = allCustomers.find((customer) => customer.displayName === "Walk-in");
    if (existingWalkIn) return existingWalkIn.id;
    const found = await api<{ customers: ModalCustomer[] }>(
      `/api/customers?salonId=${salonId}&q=Walk-in`,
    );
    const match = found.customers.find((customer) => customer.displayName === "Walk-in");
    if (match) return match.id;
    const created = await api<{ customerId: string }>("/api/customers", {
      method: "POST",
      body: JSON.stringify({ salonId, displayName: "Walk-in" }),
    });
    return created.customerId;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (tab !== "appointment" || saving) return;

    const chosenServiceId =
      serviceId ||
      catalogServices.find((item) => item.staffIds.includes(staffId))?.id ||
      catalogServices[0]?.id ||
      "";
    const chosenService = catalogServices.find((item) => item.id === chosenServiceId);
    const chosenStaffId =
      (chosenService && chosenService.staffIds.includes(staffId)
        ? staffId
        : staff.find((member) => chosenService?.staffIds.includes(member.id))?.id) ||
      staffId ||
      staff[0]?.id ||
      "";

    if (!chosenServiceId || !chosenStaffId) {
      setError("Bitte eine Leistung und Mitarbeiterin auswählen.");
      return;
    }

    if (adding && !newName.trim()) {
      setError("Bitte den Namen der neuen Kundin eingeben.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const customerId = await resolveCustomerId();

      const datesToBook: { date: string; start: string }[] = [
        { date, start },
        ...extraDates.map((d) => ({ date: d.date, start: d.start })),
      ];
      if (repeatEnabled) {
        datesToBook.push({ date: addDaysYmd(date, repeatWeeks * 7), start });
      }

      for (const slotTarget of datesToBook) {
        await api("/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            salonId,
            staffId: chosenStaffId,
            customerId,
            serviceId: chosenServiceId,
            date: slotTarget.date,
            start: slotTarget.start,
            notes: notes.trim() || undefined,
            idempotencyKey: crypto.randomUUID(),
          }),
        });

        let cursorMinutes = toMinute(slotTarget.start) + (chosenService?.durationMinutes ?? 45);
        for (const extra of extraLines) {
          if (!extra.serviceId) continue;
          const extraSvc = catalogServices.find((item) => item.id === extra.serviceId);
          await api("/api/appointments", {
            method: "POST",
            body: JSON.stringify({
              salonId,
              staffId: extra.staffId || chosenStaffId,
              customerId,
              serviceId: extra.serviceId,
              date: slotTarget.date,
              start: minutesLabel(cursorMinutes),
              notes: notes.trim() || undefined,
              idempotencyKey: crypto.randomUUID(),
            }),
          });
          cursorMinutes += extraSvc?.durationMinutes ?? extra.durationMinutes ?? 45;
        }
      }

      await onBooked("Termin gespeichert.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Termin konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (openList) {
        setOpenList(null);
        return;
      }
      if (availabilityOpen) {
        setAvailabilityOpen(false);
        return;
      }
      onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openList, availabilityOpen]);

  if (typeof document === "undefined") return null;

  const activeTabMeta = tabs.find((item) => item.id === tab) ?? tabs[0];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1e21]/40 p-[10px]"
      onMouseDown={onClose}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="booking-form"
        onSubmit={save}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          height: expanded ? "calc(100vh - 12px)" : "calc(100vh - 20px)",
          width: expanded ? "calc(100vw - 20px)" : "min(1100px, 75.6vw)",
        }}
        className="flex min-w-0 flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_16px_50px_rgba(20,24,40,0.28)] motion-safe:transition-opacity motion-safe:duration-150"
      >
        <header className="flex h-[58px] shrink-0 items-center gap-3 border-b border-[#eef0f3] px-5">
          <h2
            id={titleId}
            className="shrink-0 text-[17px] font-semibold tracking-tight text-[#1c1e21]"
          >
            {activeTabMeta.title}
          </h2>
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="flex rounded-lg bg-[#eef0f3] p-0.5" role="tablist" aria-label="Terminart">
              {tabs.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-testid={`booking-tab-${item.id}`}
                    className={cn(
                      "h-7 rounded-md px-3 text-sm transition-colors",
                      active
                        ? "bg-white font-medium text-[#1c1e21] shadow-sm"
                        : "text-[#6d7480] hover:text-[#1c1e21]",
                    )}
                    onClick={() => {
                      setTab(item.id);
                      setError(null);
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#f4f5f7]"
              aria-label={expanded ? "Verkleinern" : "Vergrößern"}
              data-testid="booking-expand"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#f4f5f7]"
              aria-label="Schließen"
              data-testid="booking-close"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {tab === "appointment" ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(220px,28%)]">
            <div
              className="min-h-0 overflow-y-auto bg-[#f4f5f7] p-4"
              data-testid="booking-form-scroll"
            >
              <div className="flex flex-col gap-3">
                {catalogNotice ? (
                  <div
                    role="status"
                    data-testid="booking-catalog-notice"
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900"
                  >
                    {catalogNotice}
                  </div>
                ) : null}
                <AppointmentServiceRow
                  services={catalogServices}
                  staff={staff}
                  serviceId={serviceId}
                  staffId={staffId}
                  durationMinutes={effectiveDuration}
                  extraLines={extraLines}
                  openList={openList}
                  onOpenList={(next) => {
                    if (next === "service") {
                      void refreshServiceCatalog(false);
                    }
                    setOpenList(next);
                  }}
                  onService={chooseService}
                  onDuration={(mins) => {
                    setDurationManuallyEdited(true);
                    setDurationMinutes(mins);
                  }}
                  onStaff={setStaffId}
                  onAddServiceLine={() => {
                    const fallbackService = catalogServices[0];
                    setExtraLines((prev) => [
                      ...prev,
                      {
                        key: crypto.randomUUID(),
                        serviceId: fallbackService?.id ?? "",
                        staffId: staffId || staff[0]?.id || "",
                        durationMinutes: fallbackService?.durationMinutes ?? 45,
                      },
                    ]);
                  }}
                  onUpdateExtraLine={(key, patch) =>
                    setExtraLines((prev) =>
                      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
                    )
                  }
                  onRemoveExtraLine={(key) =>
                    setExtraLines((prev) => prev.filter((item) => item.key !== key))
                  }
                />
                <DateTimeSection
                  date={date}
                  start={start}
                  onDate={setDate}
                  onStart={setStart}
                  availabilityOpen={availabilityOpen}
                  onToggleAvailability={() => setAvailabilityOpen((open) => !open)}
                  slots={slots}
                  onPickSlot={(value) => {
                    setStart(value);
                    setAvailabilityOpen(false);
                  }}
                  extraDates={extraDates}
                  onAddExtraDate={() =>
                    setExtraDates((prev) => [
                      ...prev,
                      {
                        key: crypto.randomUUID(),
                        date: addDaysYmd(date, prev.length + 1),
                        start,
                      },
                    ])
                  }
                  onUpdateExtraDate={(key, patch) =>
                    setExtraDates((prev) =>
                      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
                    )
                  }
                  onRemoveExtraDate={(key) =>
                    setExtraDates((prev) => prev.filter((item) => item.key !== key))
                  }
                  repeatEnabled={repeatEnabled}
                  onToggleRepeat={() => setRepeatEnabled((prev) => !prev)}
                  repeatWeeks={repeatWeeks}
                  onRepeatWeeks={setRepeatWeeks}
                />
                <AppointmentNotes value={notes} onChange={setNotes} />
              </div>
            </div>
            <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-[#eef0f3] bg-white min-[900px]:border-l min-[900px]:border-t-0">
              <CustomerSearchPanel
                query={query}
                onQuery={(value) => {
                  setQuery(value);
                  if (selected && value !== selected.displayName) {
                    setSelected(null);
                  }
                  setWalkIn(false);
                  setAdding(false);
                }}
                results={adding || walkIn ? [] : results}
                selected={selected}
                onSelect={(customer) => {
                  setSelected(customer);
                  setQuery(customer.displayName);
                  setResults([]);
                  setAdding(false);
                  setWalkIn(false);
                }}
                adding={adding}
                onAdd={() => {
                  setAdding(true);
                  setWalkIn(false);
                  setSelected(null);
                  setQuery("");
                  setResults([]);
                }}
                newName={newName}
                onNewName={setNewName}
                walkIn={walkIn}
                onWalkIn={() => {
                  setWalkIn(true);
                  setAdding(false);
                  setSelected(null);
                  setQuery("");
                  setResults([]);
                }}
              />
              <AppointmentSummary
                date={date}
                start={start}
                end={end}
                priceCents={totalPriceCents}
                saving={saving}
                disabled={false}
                error={error}
              />
            </div>
          </div>
        ) : (
          <div
            className="min-h-0 flex-1 overflow-y-auto bg-[#f4f5f7] p-6"
            data-testid="booking-form-scroll"
          >
            <CalendarEventTabForm
              key={tab}
              kind={tab}
              salonId={salonId}
              initialDate={date}
              initialStart={start}
              initialStaffId={staffId}
              staff={staff}
              onSaved={async (msg) => {
                await onBooked(msg);
              }}
            />
          </div>
        )}
      </form>
    </div>,
    document.body,
  );
}
