"use client";

import {
  AlertTriangle,
  Award,
  Cake,
  Calendar,
  Clock,
  Coins,
  Package,
  Scissors,
  Tag,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { ActiveCustomerFilter } from "@/features/customers/customer-types";

type FilterCategoryKey =
  | "age"
  | "appointments"
  | "birthday"
  | "customers"
  | "gender"
  | "labels"
  | "last_appointment"
  | "loyalty"
  | "money_spent"
  | "no_shows"
  | "products"
  | "services"
  | "treated_by";

const CATEGORIES: {
  key: FilterCategoryKey;
  label: string;
  icon: typeof Users;
}[] = [
  { key: "age", label: "Alter", icon: Users },
  { key: "appointments", label: "Termine", icon: Calendar },
  { key: "birthday", label: "Geburtstagswünsche", icon: Cake },
  { key: "customers", label: "Kunden", icon: Users },
  { key: "gender", label: "Geschlecht", icon: Users },
  { key: "labels", label: "Labels", icon: Tag },
  { key: "last_appointment", label: "Letzter Termin", icon: Clock },
  { key: "loyalty", label: "Treuepunkte", icon: Award },
  { key: "money_spent", label: "Umsatz", icon: Coins },
  { key: "no_shows", label: "Nicht erschienen", icon: AlertTriangle },
  { key: "products", label: "Produkte", icon: Package },
  { key: "services", label: "Leistungen", icon: Scissors },
  { key: "treated_by", label: "Behandelt von", icon: UserCheck },
];

type CustomerFilterPopoverProps = {
  open: boolean;
  onClose: () => void;
  onAddFilter: (filter: ActiveCustomerFilter) => void;
};

export function CustomerFilterPopover({
  open,
  onClose,
  onAddFilter,
}: CustomerFilterPopoverProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategoryKey>("gender");
  const [genderVal, setGenderVal] = useState<"male" | "female" | "non_binary" | "unknown">("female");
  const [ageFrom, setAgeFrom] = useState("1");
  const [ageTo, setAgeTo] = useState("100");
  const [birthdayMode, setBirthdayMode] = useState<"upcoming" | "period">("upcoming");
  const [lastDays, setLastDays] = useState("1");
  const [noShowFrom, setNoShowFrom] = useState("1");
  const [noShowTo, setNoShowTo] = useState("100");
  const [selectedService, setSelectedService] = useState("Shellac");
  const [selectedLabel, setSelectedLabel] = useState("Favorit");
  const [newsletterChoice, setNewsletterChoice] = useState<"yes" | "no">("yes");
  const [minAppointments, setMinAppointments] = useState("1");

  if (!open) return null;

  function applyCurrentCategory() {
    switch (selectedCategory) {
      case "gender": {
        const mapLabel: Record<string, string> = {
          male: "Männlich",
          female: "Weiblich",
          non_binary: "Divers",
          unknown: "Unbekannt",
        };
        onAddFilter({
          key: `gender_${genderVal}`,
          label: `Geschlecht: ${mapLabel[genderVal]}`,
          paramKey: "gender",
          paramValue: genderVal,
        });
        break;
      }
      case "labels": {
        onAddFilter({
          key: `label_${selectedLabel}`,
          label: `Label: ${selectedLabel}`,
          paramKey: "label",
          paramValue: selectedLabel,
        });
        break;
      }
      case "customers": {
        onAddFilter({
          key: `newsletter_${newsletterChoice}`,
          label: `Newsletter: ${newsletterChoice === "yes" ? "Abonniert" : "Nicht abonniert"}`,
          paramKey: "newsletter",
          paramValue: newsletterChoice,
        });
        break;
      }
      case "appointments": {
        onAddFilter({
          key: `appts_${minAppointments}`,
          label: `Mindestens ${minAppointments} Termin(e)`,
          paramKey: "minAppointments",
          paramValue: minAppointments,
        });
        break;
      }
      case "services": {
        onAddFilter({
          key: `service_${selectedService}`,
          label: `Leistung: ${selectedService}`,
          paramKey: "service",
          paramValue: selectedService,
        });
        break;
      }
      case "no_shows": {
        onAddFilter({
          key: `noshows_${noShowFrom}`,
          label: `Nicht erschienen: ${noShowFrom}–${noShowTo}`,
          paramKey: "minNoShows",
          paramValue: noShowFrom,
        });
        break;
      }
      default: {
        onAddFilter({
          key: `label_Favorit`,
          label: `Label: Favorit`,
          paramKey: "label",
          paramValue: "Favorit",
        });
        break;
      }
    }
  }

  return (
    <div
      data-testid="customer-filter-popover"
      className="absolute left-0 top-11 z-40 flex items-start gap-2"
    >
      {/* Left pane: Filter categories */}
      <div className="w-[235px] rounded-lg border border-[#d5d9e0] bg-white py-2 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#eceef2] px-3.5 pb-2 pt-1">
          <span className="text-[12.5px] font-bold text-[#1c1e21]">Kunden filtern</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Filter schließen"
            data-testid="customer-filter-close"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-[#6a6f76] hover:bg-[#f2f4f7]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <ul className="max-h-[420px] overflow-y-auto py-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.key;
            return (
              <li key={cat.key}>
                <button
                  type="button"
                  data-testid={`filter-category-${cat.key}`}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[12.5px] transition-none ${
                    active
                      ? "bg-[#f3f4f6] font-semibold text-[#1c1e21]"
                      : "font-medium text-[#4b5057] hover:bg-[#f9fafb]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#6a6f76]" />
                  <span>{cat.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right pane: Category configuration */}
      <div
        data-testid="customer-filter-subpane"
        className="w-[270px] rounded-lg border border-[#d5d9e0] bg-white p-4 shadow-xl transition-none"
      >
        {selectedCategory === "gender" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">Filtern nach: Geschlecht</p>
            <div className="mt-3 space-y-2">
              {(
                [
                  ["male", "Männlich"],
                  ["female", "Weiblich"],
                  ["non_binary", "Divers"],
                  ["unknown", "Unbekannt"],
                ] as const
              ).map(([val, label]) => {
                const checked = genderVal === val;
                return (
                  <label
                    key={val}
                    className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#1c1e21]"
                  >
                    <input
                      type="radio"
                      name="filter-gender"
                      checked={checked}
                      onChange={() => setGenderVal(val)}
                      data-testid={`filter-gender-${val}`}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        checked ? "border-[#e05a6d]" : "border-[#b8bec7]"
                      }`}
                    >
                      {checked ? <span className="h-2 w-2 rounded-full bg-[#e05a6d]" /> : null}
                    </span>
                    {label}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {selectedCategory === "age" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">Filtern nach: Alter</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#6a6f76]">Von</span>
                <input
                  value={ageFrom}
                  onChange={(e) => setAgeFrom(e.target.value)}
                  className="mt-1 h-9 w-full rounded border border-[#cfd4dc] px-2.5 text-[13px]"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#6a6f76]">Bis</span>
                <input
                  value={ageTo}
                  onChange={(e) => setAgeTo(e.target.value)}
                  className="mt-1 h-9 w-full rounded border border-[#cfd4dc] px-2.5 text-[13px]"
                />
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-[#e05a6d]/30">
              <div className="h-1.5 w-full rounded-full bg-[#e05a6d]" />
            </div>
          </div>
        ) : null}

        {selectedCategory === "birthday" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">
              Filtern nach: Geburtstagswünsche
            </p>
            <div className="mt-3 space-y-2 text-[13px]">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={birthdayMode === "upcoming"}
                  onChange={() => setBirthdayMode("upcoming")}
                />
                Anstehende Geburtstage
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={birthdayMode === "period"}
                  onChange={() => setBirthdayMode("period")}
                />
                Zeitraum wählen
              </label>
            </div>
          </div>
        ) : null}

        {selectedCategory === "last_appointment" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">Filtern nach: Letzter Termin</p>
            <div className="mt-3 space-y-2 text-[13px]">
              <label className="flex items-center gap-2">
                <input type="radio" checked readOnly />
                Anzahl der Tage wählen
              </label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  value={lastDays}
                  onChange={(e) => setLastDays(e.target.value)}
                  className="h-8 w-16 rounded border border-[#cfd4dc] px-2 text-[13px]"
                />
                <span className="text-[12.5px] text-[#5a6068]">Tag(e) her</span>
              </div>
            </div>
          </div>
        ) : null}

        {selectedCategory === "no_shows" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">
              Filtern nach: Nicht erschienen
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#6a6f76]">Von</span>
                <input
                  value={noShowFrom}
                  onChange={(e) => setNoShowFrom(e.target.value)}
                  className="mt-1 h-9 w-full rounded border border-[#cfd4dc] px-2.5 text-[13px]"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#6a6f76]">Bis</span>
                <input
                  value={noShowTo}
                  onChange={(e) => setNoShowTo(e.target.value)}
                  className="mt-1 h-9 w-full rounded border border-[#cfd4dc] px-2.5 text-[13px]"
                />
              </div>
            </div>
          </div>
        ) : null}

        {selectedCategory === "services" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">Filtern nach: Leistungen</p>
            <div className="mt-3 space-y-2.5">
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#6a6068]">Kategorie</span>
                <select className="mt-1 h-9 w-full rounded border border-[#cfd4dc] bg-white px-2 text-[12.5px]">
                  <option>Nagelpflege &amp; Modellage</option>
                </select>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#6a6068]">Leistung</span>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  data-testid="filter-service-select"
                  className="mt-1 h-9 w-full rounded border border-[#cfd4dc] bg-white px-2 text-[12.5px]"
                >
                  <option value="Shellac">Shellac</option>
                  <option value="Maniküre">Maniküre</option>
                  <option value="Pediküre">Pediküre</option>
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {selectedCategory === "labels" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">Filtern nach: Labels</p>
            <div className="mt-3">
              <select
                value={selectedLabel}
                onChange={(e) => setSelectedLabel(e.target.value)}
                data-testid="filter-label-select"
                className="h-9 w-full rounded border border-[#cfd4dc] bg-white px-2.5 text-[13px]"
              >
                <option value="Favorit">Favorit</option>
                <option value="Stammkundin">Stammkundin</option>
              </select>
            </div>
          </div>
        ) : null}

        {selectedCategory === "customers" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">Filtern nach: Newsletter</p>
            <div className="mt-3 space-y-2 text-[13px]">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={newsletterChoice === "yes"}
                  onChange={() => setNewsletterChoice("yes")}
                />
                Newsletter abonniert
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={newsletterChoice === "no"}
                  onChange={() => setNewsletterChoice("no")}
                />
                Kein Newsletter
              </label>
            </div>
          </div>
        ) : null}

        {selectedCategory === "appointments" ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">Filtern nach: Termine</p>
            <div className="mt-3">
              <label className="block text-[11px] font-semibold uppercase text-[#6a6f76]">
                Mindestanzahl Termine
              </label>
              <input
                type="number"
                min={0}
                value={minAppointments}
                onChange={(e) => setMinAppointments(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-[#cfd4dc] px-2.5 text-[13px]"
              />
            </div>
          </div>
        ) : null}

        {["loyalty", "money_spent", "products", "treated_by"].includes(selectedCategory) ? (
          <div>
            <p className="text-[12.5px] font-bold text-[#1c1e21]">
              Filtern nach: {CATEGORIES.find((c) => c.key === selectedCategory)?.label}
            </p>
            <p className="mt-2 text-[12px] text-[#5a6068]">
              Kriterium auswählen und zur aktiven Kundenliste hinzufügen.
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            data-testid="customer-filter-add"
            onClick={applyCurrentCategory}
            className="h-8 rounded-md bg-[#18202c] px-4 text-[12.5px] font-semibold text-white hover:bg-[#253142]"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}
