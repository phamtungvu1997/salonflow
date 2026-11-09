"use client";

import { useMemo, useState } from "react";

import { notifyServiceCatalogUpdated } from "@/features/services/service-catalog-sync";

import {
  type ServiceCategoryRecord,
  type ServiceRecord,
  type StaffMemberRecord,
  SETTINGS_COLOR_SWATCHES,
  formatEuroPrice,
} from "./settings-types";

export function ServicesSettingsSection({
  salonId,
  categories,
  services,
  staff,
  onRefresh,
}: {
  salonId: string;
  categories: ServiceCategoryRecord[];
  services: ServiceRecord[];
  staff: StaffMemberRecord[];
  onRefresh: () => Promise<void>;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"service" | "package">("service");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Category Modal State (matching video 02:25 – 02:35 & 02:55)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryRecord | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#f9a8d4");
  const [deleteConfirmCategory, setDeleteConfirmCategory] =
    useState<ServiceCategoryRecord | null>(null);

  // Service Modal State (matching video 00:08 – 00:18 & 01:80 – 01:88)
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [svcCategoryId, setSvcCategoryId] = useState("");
  const [svcName, setSvcName] = useState("");
  const [svcDuration, setSvcDuration] = useState(60);
  const [svcPriceEuro, setSvcPriceEuro] = useState("45,00");
  const [svcActive, setSvcActive] = useState(true);
  const [svcStaffIds, setSvcStaffIds] = useState<string[]>([]);
  const [showStaffSelectorInModal, setShowStaffSelectorInModal] = useState(false);

  // Package Modal State (matching video 00:20 – 00:26)
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgCategoryId, setPkgCategoryId] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgServiceIds, setPkgServiceIds] = useState<string[]>([""]);
  const [pkgPriceMode, setPkgPriceMode] = useState<"sum" | "custom" | "discount">("sum");
  const [pkgBookableOnline, setPkgBookableOnline] = useState(true);

  // Update Prices Modal State (matching video 01:95)
  const [pricesModalOpen, setPricesModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<"percent" | "euro">("percent");
  const [bulkAmount, setBulkAmount] = useState("10");
  const [draftPricesCents, setDraftPricesCents] = useState<Record<string, number>>({});

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (selectedCategoryId !== "all" && cat.id !== selectedCategoryId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catMatches = cat.name.toLowerCase().includes(q);
        const svcMatches = services.some(
          (s) => s.categoryId === cat.id && s.name.toLowerCase().includes(q),
        );
        return catMatches || svcMatches;
      }
      return true;
    });
  }, [categories, services, selectedCategoryId, searchQuery]);

  function openNewCategoryModal() {
    setCreateMenuOpen(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryColor(SETTINGS_COLOR_SWATCHES[0] ?? "#f9a8d4");
    setCategoryModalOpen(true);
  }

  function openEditCategoryModal(cat: ServiceCategoryRecord) {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryColor(cat.color || "#f9a8d4");
    setCategoryModalOpen(true);
  }

  async function handleSaveCategory() {
    if (!categoryName.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      if (editingCategory) {
        await fetch("/api/services/categories", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            salonId,
            categoryId: editingCategory.id,
            name: categoryName.trim(),
            color: categoryColor,
          }),
        });
        setFeedback(`Kategorie „${categoryName.trim()}“ wurde aktualisiert.`);
      } else {
        await fetch("/api/services/categories", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            salonId,
            name: categoryName.trim(),
            color: categoryColor,
          }),
        });
        setFeedback(`Kategorie „${categoryName.trim()}“ wurde erstellt.`);
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      notifyServiceCatalogUpdated(salonId, { action: "category" });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(cat: ServiceCategoryRecord) {
    setSaving(true);
    try {
      await fetch(
        `/api/services/categories?salonId=${encodeURIComponent(salonId)}&categoryId=${encodeURIComponent(cat.id)}`,
        { method: "DELETE" },
      );
      setDeleteConfirmCategory(null);
      setCategoryModalOpen(false);
      setFeedback(`Kategorie „${cat.name}“ wurde gelöscht.`);
      notifyServiceCatalogUpdated(salonId, { action: "category" });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  function openNewServiceModal(defaultCatId?: string) {
    setCreateMenuOpen(false);
    setEditingService(null);
    setSvcCategoryId(defaultCatId ?? categories[0]?.id ?? "");
    setSvcName("");
    setSvcDuration(60);
    setSvcPriceEuro("45,00");
    setSvcActive(true);
    setSvcStaffIds(staff.filter((s) => s.active).map((s) => s.id));
    setShowStaffSelectorInModal(false);
    setServiceModalOpen(true);
  }

  function openEditServiceModal(svc: ServiceRecord) {
    setEditingService(svc);
    setSvcCategoryId(svc.categoryId ?? categories[0]?.id ?? "");
    setSvcName(svc.name);
    setSvcDuration(svc.durationMinutes);
    setSvcPriceEuro((svc.priceCents / 100).toFixed(2).replace(".", ","));
    setSvcActive(svc.active !== false);
    setSvcStaffIds(svc.staffIds);
    setShowStaffSelectorInModal(false);
    setServiceModalOpen(true);
  }

  function parseEuroToCents(input: string): number {
    const normalized = input.replace(/[^0-9,.-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100);
  }

  async function handleSaveService() {
    if (!svcName.trim() || svcStaffIds.length === 0) return;
    setSaving(true);
    setFeedback(null);
    const priceCents = parseEuroToCents(svcPriceEuro);
    try {
      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            salonId,
            name: svcName.trim(),
            categoryId: svcCategoryId || null,
            durationMinutes: svcDuration,
            priceCents,
            active: svcActive,
            staffIds: svcStaffIds,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          futureAppointmentCount?: number;
        };
        const futureNote =
          !svcActive && (body.futureAppointmentCount ?? 0) > 0
            ? ` Hinweis: ${body.futureAppointmentCount} bestehende zukünftige Termine bleiben unverändert erhalten.`
            : "";
        setFeedback(
          `Leistung „${svcName.trim()}“ wurde aktualisiert (bestehende Termin-Snapshots bleiben unverändert).${futureNote}`,
        );
        notifyServiceCatalogUpdated(salonId, {
          serviceId: editingService.id,
          action: svcActive ? "updated" : "deactivated",
        });
      } else {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            salonId,
            categoryId: svcCategoryId || undefined,
            name: svcName.trim(),
            durationMinutes: svcDuration,
            priceCents,
            staffIds: svcStaffIds,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as { serviceId?: string };
        setFeedback(`Leistung „${svcName.trim()}“ wurde angelegt.`);
        if (svcCategoryId) {
          setExpandedCategories((prev) => ({ ...prev, [svcCategoryId]: true }));
        }
        notifyServiceCatalogUpdated(salonId, {
          serviceId: body.serviceId,
          action: "created",
        });
      }
      setServiceModalOpen(false);
      setEditingService(null);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateService() {
    if (!editingService) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/services/${encodeURIComponent(editingService.id)}?salonId=${encodeURIComponent(salonId)}`,
        { method: "DELETE" },
      );
      const body = (await res.json().catch(() => ({}))) as {
        futureAppointmentCount?: number;
      };
      const futureMsg =
        (body.futureAppointmentCount ?? 0) > 0
          ? ` ${body.futureAppointmentCount} zukünftige Termine bleiben im Kalender bestehen.`
          : "";
      setFeedback(
        `Leistung „${editingService.name}“ wurde deaktiviert (historische Termine und Snapshots bleiben unverändert).${futureMsg}`,
      );
      setServiceModalOpen(false);
      setEditingService(null);
      notifyServiceCatalogUpdated(salonId, {
        serviceId: editingService.id,
        action: "deactivated",
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  function openUpdatePricesModal() {
    const map: Record<string, number> = {};
    services.forEach((s) => {
      map[s.id] = s.priceCents;
    });
    setDraftPricesCents(map);
    setPricesModalOpen(true);
  }

  function applyBulkPriceAdjustment() {
    const val = Number.parseFloat(bulkAmount.replace(",", "."));
    if (Number.isNaN(val)) return;
    const next: Record<string, number> = {};
    services.forEach((s) => {
      const base = s.priceCents;
      if (bulkMode === "percent") {
        next[s.id] = Math.max(0, Math.round(base * (1 + val / 100)));
      } else {
        next[s.id] = Math.max(0, Math.round(base + val * 100));
      }
    });
    setDraftPricesCents(next);
  }

  async function handleCommitBulkPrices() {
    setSaving(true);
    try {
      const updates = Object.entries(draftPricesCents).map(([serviceId, priceCents]) => ({
        serviceId,
        priceCents,
      }));
      await fetch("/api/services/prices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ salonId, updates }),
      });
      setPricesModalOpen(false);
      setFeedback("Leistungspreise wurden erfolgreich aktualisiert.");
      notifyServiceCatalogUpdated(salonId, { action: "prices" });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="settings-section-services" className="space-y-5">
      {/* Header matching video 00:00 – 00:08 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leistungen</h2>
          <p className="text-xs text-slate-500">
            Farbcodierte Behandlungskategorien, Preise, Dauer und qualifizierte Mitarbeiter.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-testid="services-update-prices-btn"
            onClick={openUpdatePricesModal}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50"
          >
            Preise aktualisieren
          </button>

          <div className="relative">
            <button
              type="button"
              data-testid="services-create-new-dropdown-btn"
              onClick={() => setCreateMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
            >
              <span>Neu erstellen</span>
              <span>▾</span>
            </button>

            {createMenuOpen ? (
              <div
                data-testid="services-create-new-menu"
                className="absolute right-0 z-30 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
              >
                <button
                  type="button"
                  data-testid="services-menu-add-category"
                  onClick={openNewCategoryModal}
                  className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Kategorie hinzufügen
                </button>
                <button
                  type="button"
                  data-testid="services-menu-add-service"
                  onClick={() => openNewServiceModal()}
                  className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Leistung hinzufügen
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {feedback ? (
        <div
          data-testid="services-settings-feedback"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {feedback}
        </div>
      ) : null}

      {/* Filter & Search Toolbar with Service | Package (NEU) switcher matching video 00:00 – 00:26 */}
      <div className="grid gap-3 sm:grid-cols-[auto_220px_1fr]">
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
          <button
            type="button"
            data-testid="services-subtab-service"
            onClick={() => setActiveSubTab("service")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeSubTab === "service"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Leistung ({services.length})
          </button>
          <button
            type="button"
            data-testid="services-subtab-package"
            onClick={() => setActiveSubTab("package")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeSubTab === "package"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Paket</span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-emerald-800">
              NEU
            </span>
          </button>
        </div>

        <select
          data-testid="services-category-filter"
          value={selectedCategoryId}
          onChange={(event) => setSelectedCategoryId(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800"
        >
          <option value="all">Alle Kategorien</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="search"
          data-testid="services-search-input"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Leistung suchen…"
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900"
        />
      </div>

      {activeSubTab === "package" ? (
        /* Package Empty State matching video 00:18 – 00:26 */
        <div
          data-testid="services-package-empty-state"
          className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-xs"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100 text-2xl">
            🎁
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Leistungen zu einem Paket bündeln
          </h3>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
            Gruppieren Sie Leistungen, die Kundinnen häufig zusammen buchen, und legen Sie einen Paketpreis fest. Pakete werden als ein zusammenhängender Termin im Kalender gebucht.
          </p>
          <button
            type="button"
            data-testid="services-create-package-btn"
            onClick={() => {
              setPkgName("");
              setPkgCategoryId(categories[0]?.id ?? "");
              setPkgDescription("");
              setPkgServiceIds([services[0]?.id ?? ""]);
              setPkgPriceMode("sum");
              setPkgBookableOnline(true);
              setPackageModalOpen(true);
            }}
            className="mt-5 rounded-lg bg-[#18202c] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
          >
            Paket erstellen
          </button>
        </div>
      ) : (
        /* Color-Coded Category Accordion Bars matching video 00:00 – 00:17 */
        <div className="space-y-3">
          {filteredCategories.map((cat) => {
            const catServices = services.filter(
              (s) => s.categoryId === cat.id && !/^Shellac \d{10,}$/.test(s.name),
            );
            const isExpanded =
              Boolean(expandedCategories[cat.id]) || Boolean(searchQuery.trim());
            return (
              <div
                key={cat.id}
                data-testid={`service-category-bar-${cat.name}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                <div
                  onClick={() =>
                    setExpandedCategories((prev) => ({
                      ...prev,
                      [cat.id]: !prev[cat.id],
                    }))
                  }
                  className="flex cursor-pointer items-center justify-between px-4 py-3 transition"
                  style={{ backgroundColor: `${cat.color}88` }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-600 select-none">⋮⋮</span>
                    <span className="text-sm font-bold text-slate-900">
                      {cat.name} ({catServices.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid={`service-category-edit-${cat.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditCategoryModal(cat);
                      }}
                      className="rounded-md bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-white"
                    >
                      Kategorie bearbeiten
                    </button>
                    <button
                      type="button"
                      data-testid={`service-category-add-service-${cat.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openNewServiceModal(cat.id);
                      }}
                      className="rounded-md bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-white"
                    >
                      + Leistung
                    </button>
                    <span className="ml-1 text-xs font-bold text-slate-800">
                      {isExpanded ? "▴" : "▾"}
                    </span>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="divide-y divide-slate-100 bg-white">
                    {catServices.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-slate-500">
                        Noch keine Leistungen in dieser Kategorie.
                      </div>
                    ) : (
                      catServices.map((svc) => {
                        const isInactive = svc.active === false;
                        return (
                          <div
                            key={svc.id}
                            data-testid={`settings-service-row-${svc.name}`}
                            onClick={() => openEditServiceModal(svc)}
                            className={`flex cursor-pointer items-center justify-between px-4 py-3 text-xs hover:bg-slate-50 ${
                              isInactive ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 shrink-0 rounded-full border border-black/15"
                                style={{ backgroundColor: cat.color }}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900">{svc.name}</p>
                                  {isInactive ? (
                                    <span
                                      data-testid={`settings-service-inactive-badge-${svc.name}`}
                                      className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700"
                                    >
                                      Deaktiviert
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {svc.staffIds.length} qualifizierte Mitarbeiterinnen
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-5">
                              <span className="text-slate-600">{svc.durationMinutes} Min.</span>
                              <span className="w-20 text-right font-bold text-slate-900">
                                {formatEuroPrice(svc.priceCents)}
                              </span>
                              <button
                                type="button"
                                data-testid={`settings-service-edit-${svc.name}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditServiceModal(svc);
                                }}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Bearbeiten
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {/* Inline "+ Create new service for this category" link matching video 00:04 / 00:06 */}
                    <div className="bg-slate-50/40 px-4 py-2.5">
                      <button
                        type="button"
                        data-testid={`inline-create-service-${cat.name}`}
                        onClick={() => openNewServiceModal(cat.id)}
                        className="text-xs font-bold text-sky-700 hover:underline"
                      >
                        + Neue Leistung für diese Kategorie erstellen
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* Dashed "+ Create category" button matching video 00:02 & 02:20 */}
          <button
            type="button"
            data-testid="services-create-category-dashed-btn"
            onClick={openNewCategoryModal}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 py-3 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-white"
          >
            <span>+</span>
            <span>Kategorie erstellen</span>
          </button>
        </div>
      )}

      {/* Create Package Modal matching video 00:20 – 00:24 */}
      {packageModalOpen ? (
        <div
          data-testid="package-editor-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Paket erstellen</h3>
              <button
                type="button"
                onClick={() => setPackageModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Details</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                      PAKETNAME *
                    </label>
                    <input
                      type="text"
                      data-testid="package-modal-name"
                      value={pkgName}
                      onChange={(e) => setPkgName(e.target.value)}
                      placeholder="z. B. Maniküre & Pediküre Kombi"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                      KATEGORIE *
                    </label>
                    <select
                      data-testid="package-modal-category"
                      value={pkgCategoryId}
                      onChange={(e) => setPkgCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                    BESCHREIBUNG
                  </label>
                  <textarea
                    rows={2}
                    value={pkgDescription}
                    onChange={(e) => setPkgDescription(e.target.value)}
                    placeholder="Wird Kundinnen in der Online-Buchung angezeigt"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Leistungen</h4>
                {pkgServiceIds.map((selectedId, idx) => (
                  <select
                    key={idx}
                    value={selectedId}
                    onChange={(e) =>
                      setPkgServiceIds((prev) =>
                        prev.map((item, i) => (i === idx ? e.target.value : item)),
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">Leistung auswählen…</option>
                    {services
                      .filter((s) => s.active !== false)
                      .map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} ({svc.durationMinutes} Min. · {formatEuroPrice(svc.priceCents)})
                        </option>
                      ))}
                  </select>
                ))}
                <button
                  type="button"
                  onClick={() => setPkgServiceIds((prev) => [...prev, services[0]?.id ?? ""])}
                  className="text-xs font-bold text-sky-700 hover:underline"
                >
                  + Weitere Leistung hinzufügen
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">Preisgestaltung</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={pkgPriceMode === "sum"}
                    onChange={() => setPkgPriceMode("sum")}
                  />
                  <span>Einzelpreise der Leistungen summieren</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={pkgPriceMode === "custom"}
                    onChange={() => setPkgPriceMode("custom")}
                  />
                  <span>Festen Paketpreis festlegen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={pkgPriceMode === "discount"}
                    onChange={() => setPkgPriceMode("discount")}
                  />
                  <span>Prozentualer Rabatt auf den Gesamtpreis</span>
                </label>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Online buchbar</p>
                  <p className="text-[11px] text-slate-500">
                    Kundinnen buchen das Paket als eine kombinierte Einheit.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={pkgBookableOnline}
                  onChange={(e) => setPkgBookableOnline(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#f28b82]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-white px-6 py-3.5">
              <button
                type="button"
                data-testid="package-modal-cancel"
                onClick={() => setPackageModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  setPackageModalOpen(false);
                  setActiveSubTab("service");
                }}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Category Create / Edit Modal with Live Appointment Card Preview matching video 02:25 – 02:35 */}
      {categoryModalOpen ? (
        <div
          data-testid="category-editor-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? "Kategorie bearbeiten" : "Kategorie"}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1fr_240px]">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    NAME *
                  </label>
                  <input
                    type="text"
                    data-testid="category-modal-name"
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    placeholder="z. B. Spa Maniküre"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    FARBE
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SETTINGS_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        data-testid={`category-color-swatch-${swatch}`}
                        onClick={() => setCategoryColor(swatch)}
                        className={`h-7 w-7 rounded-full border transition ${
                          categoryColor.toLowerCase() === swatch.toLowerCase()
                            ? "scale-110 border-slate-900 ring-2 ring-slate-900/20"
                            : "border-black/15 hover:scale-105"
                        }`}
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Live Preview Card matching video 02:25 – 02:35 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2.5 text-[11px] font-semibold text-slate-500">
                  So werden Ihre Termine dargestellt:
                </p>
                <div
                  data-testid="category-modal-live-preview"
                  className="rounded-lg border-l-4 border-slate-900/40 p-3 text-xs text-slate-900 shadow-xs"
                  style={{ backgroundColor: categoryColor }}
                >
                  <p className="font-bold">19:24 - 20:24</p>
                  <p className="mt-0.5 font-semibold">Walk-in</p>
                  <p className="text-[11px] opacity-85">
                    {categoryName.trim() || "Beispiel-Leistung"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <div>
                {editingCategory ? (
                  <button
                    type="button"
                    data-testid="category-modal-delete-btn"
                    onClick={() => setDeleteConfirmCategory(editingCategory)}
                    className="rounded-lg bg-rose-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-600"
                  >
                    Kategorie löschen
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Schließen
                </button>
                <button
                  type="button"
                  data-testid="category-modal-save"
                  disabled={saving || !categoryName.trim()}
                  onClick={() => void handleSaveCategory()}
                  className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Category Confirmation Dialog matching video 02:55 */}
      {deleteConfirmCategory ? (
        <div
          data-testid="delete-category-confirm-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
        >
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">
              {deleteConfirmCategory.name} löschen?
            </h4>
            <p className="text-xs leading-relaxed text-slate-600">
              Möchten Sie die Kategorie <strong>{deleteConfirmCategory.name}</strong> wirklich löschen? Bestehende Leistungen und vergangene Termine bleiben erhalten.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCategory(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                data-testid="confirm-delete-category-btn"
                onClick={() => void handleDeleteCategory(deleteConfirmCategory)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Kategorie löschen
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Create / Edit Service Two-Column Modal matching video 00:08 – 00:17 & 01:80 */}
      {serviceModalOpen ? (
        <div
          data-testid="service-editor-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingService ? "Leistung bearbeiten" : "Leistung erstellen"}
              </h3>
              <button
                type="button"
                data-testid="service-modal-close"
                onClick={() => setServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid flex-1 overflow-y-auto md:grid-cols-[240px_1fr]">
              {/* Left Summary Sidebar matching video 00:10 – 00:15 */}
              <div className="space-y-5 border-r border-slate-200 bg-slate-50/70 p-5 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Allgemein</p>
                  <div className="mt-2 space-y-1.5 text-slate-600">
                    <p className="font-medium text-slate-800">
                      🏷️ {svcName.trim() || "Neue Leistung"}
                    </p>
                    <p>💶 € {svcPriceEuro}</p>
                    <p>⏱️ {svcDuration} Min.</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">Ressourcen</p>
                    <button
                      type="button"
                      onClick={() => setShowStaffSelectorInModal((prev) => !prev)}
                      className="text-[11px] font-bold text-sky-700 hover:underline"
                    >
                      Bearbeiten
                    </button>
                  </div>
                  <p className="mt-1.5 text-slate-600">
                    👩‍🎨{" "}
                    {svcStaffIds.length === staff.filter((s) => s.active).length
                      ? "Alle Mitarbeiter"
                      : `${svcStaffIds.length} Mitarbeiter ausgewählt`}
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="font-bold text-slate-900">Einstellungen</p>
                  <p className="mt-1.5 text-slate-600">
                    {svcActive ? "🌐 Aktiv & Buchbar" : "⏸️ Deaktiviert (nur Historie)"}
                  </p>
                </div>
              </div>

              {/* Right Form Pane matching video 00:10 – 00:15 */}
              <div className="space-y-4 p-6">
                {/* Snapshot / Historical Integrity Info Banner */}
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-950">
                  Änderungen an Name, Preis, Dauer oder Mitarbeiter-Zuordnung gelten sofort für{" "}
                  <strong>neue Buchungen</strong> im Kalender. Bestehende Termine behalten ihren historischen Leistungs-Snapshot unverändert.
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    KATEGORIE *
                  </label>
                  <select
                    data-testid="service-modal-category"
                    value={svcCategoryId}
                    onChange={(event) => setSvcCategoryId(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    LEISTUNGSNAME *
                  </label>
                  <input
                    type="text"
                    data-testid="service-modal-name"
                    value={svcName}
                    onChange={(event) => setSvcName(event.target.value)}
                    placeholder="z. B. BIAB French Refill"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      PREIS (€)
                    </label>
                    <input
                      type="text"
                      data-testid="service-modal-price"
                      value={svcPriceEuro}
                      onChange={(event) => setSvcPriceEuro(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      DAUER
                    </label>
                    <select
                      data-testid="service-modal-duration"
                      value={svcDuration}
                      onChange={(event) => setSvcDuration(Number(event.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
                    >
                      {[15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 105, 120].map(
                        (mins) => (
                          <option key={mins} value={mins}>
                            {mins} Min.
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                {/* Active / Deactivated Status Toggle */}
                {editingService ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">Für neue Buchungen aktiv</p>
                      <p className="text-[11px] text-slate-500">
                        Wenn deaktiviert, erscheint die Leistung nicht mehr im Termin-Erstellen-Dialog. Bestehende Termine bleiben erhalten.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      data-testid="service-modal-active-toggle"
                      checked={svcActive}
                      onChange={(e) => setSvcActive(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#f28b82]"
                    />
                  </div>
                ) : null}

                {/* Qualified Staff Selector */}
                <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Verfügbare Mitarbeiterinnen ({svcStaffIds.length})
                    </span>
                    <button
                      type="button"
                      data-testid="service-modal-toggle-all-staff"
                      onClick={() =>
                        setSvcStaffIds(
                          svcStaffIds.length === staff.filter((s) => s.active).length
                            ? []
                            : staff.filter((s) => s.active).map((s) => s.id),
                        )
                      }
                      className="text-[11px] font-semibold text-sky-700 hover:underline"
                    >
                      Alle umschalten
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {staff
                      .filter(
                        (s) =>
                          s.active &&
                          !s.displayName.startsWith("Test ") &&
                          !s.displayName.startsWith("Archiv "),
                      )
                      .map((member) => (
                        <label
                          key={member.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                        >
                          <input
                            type="checkbox"
                            data-testid={`service-modal-staff-${member.displayName}`}
                            checked={svcStaffIds.includes(member.id)}
                            onChange={() =>
                              setSvcStaffIds((current) =>
                                current.includes(member.id)
                                  ? current.filter((id) => id !== member.id)
                                  : [...current, member.id],
                              )
                            }
                            className="h-3.5 w-3.5 rounded accent-[#f28b82]"
                          />
                          <span className="truncate font-medium">{member.displayName}</span>
                        </label>
                      ))}
                  </div>
                </div>

                {showStaffSelectorInModal ? null : null}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <div>
                {editingService && svcActive ? (
                  <button
                    type="button"
                    data-testid="service-modal-deactivate-btn"
                    disabled={saving}
                    onClick={() => void handleDeactivateService()}
                    className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50"
                  >
                    Leistung deaktivieren
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="service-modal-cancel"
                  onClick={() => setServiceModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  data-testid="service-modal-save"
                  disabled={saving || !svcName.trim() || svcStaffIds.length === 0}
                  onClick={() => void handleSaveService()}
                  className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Speichert…" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Update Prices Bulk Modal matching video 01:95 */}
      {pricesModalOpen ? (
        <div
          data-testid="update-prices-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Preise aktualisieren</h3>
              <button
                type="button"
                onClick={() => setPricesModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {/* Bulk adjustment bar matching video 01:95 */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700">Preisanpassung:</span>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setBulkMode("percent")}
                      className={`rounded-md px-2.5 py-1 font-bold ${
                        bulkMode === "percent"
                          ? "bg-slate-900 text-white"
                          : "text-slate-700"
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMode("euro")}
                      className={`rounded-md px-2.5 py-1 font-bold ${
                        bulkMode === "euro"
                          ? "bg-slate-900 text-white"
                          : "text-slate-700"
                      }`}
                    >
                      €
                    </button>
                  </div>
                  <input
                    type="text"
                    data-testid="bulk-price-input"
                    value={bulkAmount}
                    onChange={(event) => setBulkAmount(event.target.value)}
                    className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900"
                  />
                </div>
                <button
                  type="button"
                  data-testid="bulk-price-apply-btn"
                  onClick={applyBulkPriceAdjustment}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
                >
                  Auf Liste anwenden
                </button>
              </div>

              {/* Per-service price table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">LEISTUNG</th>
                      <th className="px-4 py-2.5">AKTUELLER PREIS</th>
                      <th className="px-4 py-2.5">NEUER PREIS (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {services.map((svc) => {
                      const nextCents = draftPricesCents[svc.id] ?? svc.priceCents;
                      return (
                        <tr key={svc.id}>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {svc.name}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {formatEuroPrice(svc.priceCents)}
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              step="0.5"
                              value={(nextCents / 100).toFixed(2)}
                              onChange={(event) => {
                                const parsed = Number.parseFloat(event.target.value);
                                if (!Number.isNaN(parsed) && parsed >= 0) {
                                  setDraftPricesCents((prev) => ({
                                    ...prev,
                                    [svc.id]: Math.round(parsed * 100),
                                  }));
                                }
                              }}
                              className="w-28 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-900"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setPricesModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Schließen
              </button>
              <button
                type="button"
                data-testid="update-prices-commit-btn"
                disabled={saving}
                onClick={() => void handleCommitBulkPrices()}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Aktualisiert…" : "Jetzt aktualisieren"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
