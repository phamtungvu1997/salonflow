"use client";

import {
  Download,
  Mail,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/features/booking/api";
import { AppointmentModal } from "@/features/calendar/appointment-modal/appointment-modal";
import type { ModalService, ModalStaff } from "@/features/calendar/appointment-modal/types";
import { CustomerDirectoryTable } from "@/features/customers/customer-directory-table";
import { CustomerFilterPopover } from "@/features/customers/customer-filter-popover";
import { CustomerFormModal } from "@/features/customers/customer-form-modal";
import { CustomerGroupsPanel } from "@/features/customers/customer-groups-panel";
import { CustomerProfileView } from "@/features/customers/customer-profile-view";
import {
  ActiveCustomerFilter,
  CustomerRecord,
} from "@/features/customers/customer-types";
import { useCustomersDirectory } from "@/features/customers/use-customers-directory";
import { useSalon } from "@/features/salons/salon-context";

export function CustomerAdmin() {
  const { activeSalon } = useSalon();
  const salonId = activeSalon?.id ?? "salon_jeannie";

  const {
    customers,
    totalCount,
    segments,
    loading,
    query,
    setQuery,
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,
    tab,
    setTab,
    groupSegment,
    setGroupSegment,
    message,
    setMessage,
    reload,
    archiveCustomer,
  } = useCustomersDirectory(salonId);

  const [filterOpen, setFilterOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  // Booking modal state when "Termin erstellen" is clicked inside Customer Profile
  const [bookingCustomer, setBookingCustomer] = useState<CustomerRecord | null>(null);
  const [modalStaff, setModalStaff] = useState<ModalStaff[]>([]);
  const [modalServices, setModalServices] = useState<ModalService[]>([]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest("[data-row-menu-container]")) {
        setRowMenuId(null);
      }
      if (!target.closest("[data-more-menu-container]")) {
        setMoreMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function openBookingForCustomer(customer: CustomerRecord) {
    try {
      const cal = await api<{
        staff: ModalStaff[];
        services: ModalService[];
      }>(`/api/calendar?salonId=${encodeURIComponent(salonId)}&date=2026-11-09`);
      setModalStaff(cal.staff.filter((s) => !s.displayName.startsWith("Archiv ")));
      setModalServices(cal.services);
    } catch {
      // Fallback empty if calendar metadata fails
    }
    setBookingCustomer(customer);
  }

  async function handleArchiveCustomer(customer: CustomerRecord) {
    await archiveCustomer(customer);
    setRowMenuId(null);
    setActiveProfileId(null);
  }

  function handleAddFilter(filter: ActiveCustomerFilter) {
    addFilter(filter);
    setFilterOpen(false);
  }

  function toggleSelectAll() {
    if (selectedIds.length === customers.length && customers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  const activeProfileCustomer =
    customers.find((c) => c.id === activeProfileId) ?? undefined;

  return (
    <div data-testid="customer-admin" className="space-y-4">
      {/* Top Bar matching Salonized Customers Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold tracking-tight text-[#1c1e21]">Kunden</h1>
          <span className="hidden rounded bg-[#f2f4f7] px-2 py-0.5 text-[11px] font-semibold text-[#5a6068] sm:inline-block">
            {activeSalon?.name ?? "Jeannie Nagelstudio"} · PostgreSQL
          </span>
        </div>
      </div>

      {message ? (
        <div
          data-testid="customer-message"
          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-medium text-emerald-950"
        >
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Either Customer Profile View OR Customer Directory / Customer Groups */}
      {activeProfileId ? (
        <CustomerProfileView
          customerId={activeProfileId}
          salonId={salonId}
          refreshKey={profileRefreshKey}
          initialCustomer={activeProfileCustomer}
          onBack={() => setActiveProfileId(null)}
          onEditCustomer={(cust) => {
            setEditingCustomer(cust);
            setFormOpen(true);
          }}
          onArchiveCustomer={handleArchiveCustomer}
          onBookAppointmentForCustomer={openBookingForCustomer}
          onCustomerUpdated={() => reload(query, activeFilters, tab, groupSegment)}
        />
      ) : (
        <div className="overflow-visible rounded-xl border border-[#e2e5ea] bg-white shadow-xs">
          {/* Sub-Navigation Tabs: Kundenliste | Kundengruppen */}
          <div className="flex items-center gap-7 border-b border-[#e5e7eb] px-6">
            <button
              type="button"
              data-testid="customers-tab-list"
              onClick={() => setTab("list")}
              className={`h-11 border-b-2 text-[13.5px] transition-colors ${
                tab === "list"
                  ? "border-[#e05a6d] font-bold text-[#1c1e21]"
                  : "border-transparent font-medium text-[#5a6068] hover:text-[#1c1e21]"
              }`}
            >
              Kundenliste
            </button>
            <button
              type="button"
              data-testid="customers-tab-groups"
              onClick={() => setTab("groups")}
              className={`h-11 border-b-2 text-[13.5px] transition-colors ${
                tab === "groups"
                  ? "border-[#e05a6d] font-bold text-[#1c1e21]"
                  : "border-transparent font-medium text-[#5a6068] hover:text-[#1c1e21]"
              }`}
            >
              Kundengruppen
            </button>
          </div>

          {tab === "groups" ? (
            <CustomerGroupsPanel
              customers={customers}
              groupSegment={groupSegment}
              segments={segments}
              onSelectSegment={setGroupSegment}
              onOpenProfile={(id) => setActiveProfileId(id)}
              onBookCustomer={openBookingForCustomer}
            />
          ) : (
            <>
              {/* Toolbar Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3">
                <div className="relative flex flex-1 items-center gap-2">
                  {/* Search Input */}
                  <div className="relative w-full max-w-[340px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9099]" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Suchen…"
                      aria-label="Kundinnen suchen"
                      data-testid="customer-search-input"
                      className="h-9 w-full rounded-md border border-[#cfd4dc] bg-white pl-9 pr-8 text-[13px] text-[#1c1e21] outline-none transition-colors focus:border-[#18202c]"
                    />
                    {query ? (
                      <button
                        type="button"
                        aria-label="Suche löschen"
                        data-testid="customer-search-clear"
                        onClick={() => setQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a9099] hover:text-[#1c1e21]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {/* Filter Slider Button */}
                  <button
                    type="button"
                    aria-label="Kunden filtern"
                    aria-expanded={filterOpen}
                    data-testid="customer-filter-button"
                    onClick={() => setFilterOpen((v) => !v)}
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      filterOpen || activeFilters.length > 0
                        ? "border-[#18202c] bg-[#18202c] text-white"
                        : "border-[#cfd4dc] bg-white text-[#4b5057] hover:bg-[#f3f4f6]"
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>

                  {/* Two-Pane Filter Popover */}
                  <CustomerFilterPopover
                    open={filterOpen}
                    onClose={() => setFilterOpen(false)}
                    onAddFilter={handleAddFilter}
                  />
                </div>

                {/* Right Toolbar Actions: "..." Import/Export + "Kundin erstellen" */}
                <div className="flex items-center gap-2">
                  <div className="relative" data-more-menu-container>
                    <button
                      type="button"
                      aria-label="Import und Export Optionen"
                      data-testid="customer-more-menu-button"
                      onClick={() => setMoreMenuOpen((v) => !v)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#cfd4dc] bg-white text-[#4b5057] hover:bg-[#f3f4f6]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {moreMenuOpen ? (
                      <div
                        data-testid="customer-more-menu"
                        className="absolute right-0 top-10 z-30 w-48 rounded-lg border border-[#d5d9e0] bg-white py-1.5 shadow-xl"
                      >
                        <button
                          type="button"
                          data-testid="customer-import-option"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setMessage(
                              "CSV/XLS-Kundenimport (SF-040) ist für einen späteren Meilenstein vorgesehen.",
                            );
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium text-[#1c1e21] hover:bg-[#f3f4f6]"
                        >
                          <Upload className="h-3.5 w-3.5 text-[#5a6068]" />
                          Importieren
                        </button>
                        <button
                          type="button"
                          data-testid="customer-export-option"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setMessage(
                              "Datenexport ist aus Datenschutzgründen nur mit Owner-Freigabe verfügbar.",
                            );
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium text-[#1c1e21] hover:bg-[#f3f4f6]"
                        >
                          <Download className="h-3.5 w-3.5 text-[#5a6068]" />
                          Exportieren
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    data-testid="customer-create-open"
                    onClick={() => {
                      setEditingCustomer(null);
                      setFormOpen(true);
                    }}
                    className="h-9 rounded-md bg-[#18202c] px-4 text-[13px] font-semibold text-white hover:bg-[#253142]"
                  >
                    Kundin erstellen
                  </button>
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeFilters.length > 0 ? (
                <div
                  data-testid="customer-active-filters"
                  className="flex flex-wrap items-center gap-2 px-6 pb-2"
                >
                  {activeFilters.map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#cbd5e1] bg-[#f1f5f9] px-3 py-1 text-[12px] font-semibold text-[#1e293b]"
                    >
                      {f.label}
                      <button
                        type="button"
                        aria-label={`Filter ${f.label} entfernen`}
                        onClick={() => removeFilter(f.paramKey)}
                        className="text-[#64748b] hover:text-[#0f172a]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[12px] font-semibold text-[#2563eb] hover:underline"
                  >
                    Filter zurücksetzen
                  </button>
                </div>
              ) : null}

              {/* Results Count & Envelope Icon Row */}
              <div className="flex items-center justify-between px-6 pb-2.5 text-[12.5px] text-[#5a6068]">
                <p data-testid="customer-results-count">
                  Gefundene Ergebnisse:{" "}
                  <strong className="font-bold text-[#1c1e21]">{totalCount}</strong>
                </p>
                <button
                  type="button"
                  title="Sammelnachricht senden (in V1 deaktiviert)"
                  aria-label="Sammelnachricht senden"
                  data-testid="customer-bulk-message-button"
                  onClick={() =>
                    setMessage(
                      "Sammel-E-Mails und SMS-Kampagnen sind in SalonFlow V1 deaktiviert.",
                    )
                  }
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#e2e5ea] bg-white text-[#6a6f76] hover:bg-[#f3f4f6]"
                >
                  <Mail className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Full-Width Dense Customer Directory Table */}
              <CustomerDirectoryTable
                customers={customers}
                loading={loading}
                selectedIds={selectedIds}
                rowMenuId={rowMenuId}
                onToggleSelectAll={toggleSelectAll}
                onToggleSelectRow={toggleSelectRow}
                onOpenProfile={(id) => setActiveProfileId(id)}
                onToggleRowMenu={setRowMenuId}
                onCallCustomer={(customer) => {
                  setRowMenuId(null);
                  if (customer.phone) {
                    setMessage(
                      `Telefonnummer für ${customer.displayName}: ${customer.phone}`,
                    );
                  } else {
                    setMessage(
                      `Keine Telefonnummer für ${customer.displayName} hinterlegt.`,
                    );
                  }
                }}
                onEditCustomer={(customer) => {
                  setRowMenuId(null);
                  setEditingCustomer(customer);
                  setFormOpen(true);
                }}
                onArchiveCustomer={(customer) => void handleArchiveCustomer(customer)}
              />
            </>
          )}
        </div>
      )}

      {/* Create / Edit Customer Modal */}
      <CustomerFormModal
        open={formOpen}
        salonId={salonId}
        initialCustomer={editingCustomer}
        onClose={() => {
          setFormOpen(false);
          setEditingCustomer(null);
        }}
        onSaved={async (savedId) => {
          const wasEditing = Boolean(editingCustomer);
          setFormOpen(false);
          setEditingCustomer(null);
          setMessage(wasEditing ? "Kundin aktualisiert." : "Kundin gespeichert.");
          await reload(query, activeFilters, tab, groupSegment);
          setProfileRefreshKey((k) => k + 1);
          if (wasEditing) {
            setActiveProfileId(savedId);
          }
        }}
      />

      {/* Appointment Booking Modal pre-filled with selected customer */}
      {bookingCustomer ? (
        <AppointmentModal
          salonId={salonId}
          initialDate="2026-11-09"
          initialStart="11:00"
          initialStaffId={modalStaff[0]?.id ?? "staff_lena"}
          initialStaff={modalStaff}
          services={modalServices}
          preselectedCustomer={{
            id: bookingCustomer.id,
            displayName: bookingCustomer.displayName,
            phone: bookingCustomer.phone,
            email: bookingCustomer.email,
          }}
          onClose={() => setBookingCustomer(null)}
          onBooked={async (msg) => {
            const bookedCustomerId = bookingCustomer.id;
            setBookingCustomer(null);
            setMessage(msg ?? "Termin für Kundin wurde im Kalender gespeichert.");
            await reload(query, activeFilters, tab, groupSegment);
            setProfileRefreshKey((k) => k + 1);
            setActiveProfileId(bookedCustomerId);
          }}
        />
      ) : null}
    </div>
  );
}
