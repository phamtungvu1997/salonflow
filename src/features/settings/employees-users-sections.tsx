"use client";

import { useMemo, useState } from "react";

import {
  type ActivityLogRow,
  type ResourceRow,
  type ServiceCategoryRecord,
  type ServiceRecord,
  type StaffMemberRecord,
  type UserAccountRow,
  SETTINGS_COLOR_SWATCHES,
  formatEuroPrice,
} from "./settings-types";

const ROLE_LABELS: Record<UserAccountRow["role"], { title: string; subtitle: string }> = {
  owner: {
    title: "Vollzugriff (Inhaber)",
    subtitle: "Zugriff auf alle Salons, Einstellungen, Dienstpläne und Berichte.",
  },
  manager: {
    title: "Salonleitung (Manager)",
    subtitle: "Zugriff auf Kalender, Kunden, Mitarbeiter, Leistungen und Dienstplan.",
  },
  receptionist: {
    title: "Empfang (Basiszugriff)",
    subtitle: "Termine und Kunden verwalten ohne Zugriff auf kritische Systemeinstellungen.",
  },
  technician: {
    title: "Kalenderansicht (Mitarbeiter)",
    subtitle: "Eigene Termine und Tagesplan einsehen.",
  },
};

export function UserAccountsSection({
  salonId,
  userAccounts,
  activityLogs,
  onRefresh,
}: {
  salonId: string;
  userAccounts: UserAccountRow[];
  activityLogs: ActivityLogRow[];
  onRefresh: () => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("SalonFlow!2026");
  const [repeatPassword, setRepeatPassword] = useState("SalonFlow!2026");
  const [role, setRole] = useState<UserAccountRow["role"]>("manager");
  const [autoSignOut15Min, setAutoSignOut15Min] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");

  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (activityFilter !== "all" && !log.action.toLowerCase().includes(activityFilter)) {
        return false;
      }
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        return (
          log.action.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.customerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activityLogs, activityFilter, activitySearch]);

  async function handleCreateUser() {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Bitte Vorname, Nachname und E-Mail-Adresse ausfüllen.");
      return;
    }
    if (password !== repeatPassword) {
      setError("Die eingegebenen Passwörter stimmen nicht überein.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salonId,
          firstName,
          lastName,
          email,
          password,
          role,
          autoSignOut15Min,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Benutzerkonto konnte nicht angelegt werden.");
        return;
      }
      setModalOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="settings-section-users" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Benutzerkonten</h2>
          <p className="text-xs text-slate-500">
            Zugänge, Rollenberechtigungen und das Sicherheits-Aktivitätsprotokoll verwalten.
          </p>
        </div>
        <button
          type="button"
          data-testid="users-add-button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
        >
          + Benutzerkonto hinzufügen
        </button>
      </div>

      {/* User Account Cards matching video 00:45 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {userAccounts.map((account) => (
          <div
            key={`${account.id}_${account.role}`}
            data-testid={`user-account-card-${account.email}`}
            className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">{account.displayName}</p>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span>🔒</span>
                <span>{ROLE_LABELS[account.role]?.title ?? account.role}</span>
              </p>
              <p className="text-xs text-slate-500">{account.email}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Aktiv
            </span>
          </div>
        ))}
      </div>

      {/* Activity Logs Section matching video 00:45 & 00:65 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">Aktivitätsprotokoll</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input
              type="search"
              placeholder="Suchen…"
              value={activitySearch}
              onChange={(event) => setActivitySearch(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
            />
            <select
              value={activityFilter}
              onChange={(event) => setActivityFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
            >
              <option value="all">Alle Aktivitäten</option>
              <option value="created">Termin angelegt</option>
              <option value="rescheduled">Termin verschoben</option>
              <option value="cancelled">Termin storniert</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-2.5">DATUM</th>
                <th className="px-5 py-2.5">AKTIVITÄT</th>
                <th className="px-5 py-2.5">BENUTZER</th>
                <th className="px-5 py-2.5">KUNDIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-500">
                    Keine protokollierten Aktivitäten für den gewählten Filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-2.5 font-mono text-[11px] text-slate-600">
                      {new Date(log.createdAt).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-2.5 font-semibold text-slate-900">
                      {log.action === "created"
                        ? "Termin erstellt"
                        : log.action === "rescheduled"
                          ? "Termin verschoben / aktualisiert"
                          : log.action === "cancelled"
                            ? "Termin storniert"
                            : log.action}
                    </td>
                    <td className="px-5 py-2.5 text-slate-700">{log.userName}</td>
                    <td className="px-5 py-2.5 text-slate-700">{log.customerName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Account Two-Column Modal matching video 00:50 – 00:60 */}
      {modalOpen ? (
        <div
          data-testid="create-user-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Benutzerkonto erstellen</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
              {/* Left Column: Account Details */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    VORNAME *
                  </label>
                  <input
                    type="text"
                    data-testid="new-user-firstname"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    NACHNAME *
                  </label>
                  <input
                    type="text"
                    data-testid="new-user-lastname"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    E-MAIL-ADRESSE *
                  </label>
                  <input
                    type="email"
                    data-testid="new-user-email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    PASSWORT *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    PASSWORT WIEDERHOLEN *
                  </label>
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(event) => setRepeatPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>

                <ul className="space-y-1 text-[11px] text-slate-600">
                  <li className={hasMinLen ? "text-emerald-700 font-semibold" : ""}>
                    ✓ Mindestens 8 Zeichen
                  </li>
                  <li className={hasUpper ? "text-emerald-700 font-semibold" : ""}>
                    ✓ Mindestens 1 Großbuchstabe
                  </li>
                  <li className={hasLower ? "text-emerald-700 font-semibold" : ""}>
                    ✓ Mindestens 1 Kleinbuchstabe
                  </li>
                  <li className={hasNumber ? "text-emerald-700 font-semibold" : ""}>
                    ✓ Mindestens 1 Ziffer
                  </li>
                </ul>

                <label className="flex items-center gap-2 pt-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSignOut15Min}
                    onChange={(event) => setAutoSignOut15Min(event.target.checked)}
                    className="h-4 w-4 rounded accent-[#f28b82]"
                  />
                  <span>Nach 15 Minuten Inaktivität automatisch abmelden</span>
                </label>
              </div>

              {/* Right Column: Permissions matching video 00:50 */}
              <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Berechtigungen</h4>
                {(["owner", "manager", "receptionist", "technician"] as const).map((rKey) => (
                  <label
                    key={rKey}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                      role === rKey
                        ? "border-[#f28b82] bg-white shadow-xs"
                        : "border-slate-200 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      data-testid={`new-user-role-${rKey}`}
                      checked={role === rKey}
                      onChange={() => setRole(rKey)}
                      className="mt-0.5 h-4 w-4 accent-[#f28b82]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {ROLE_LABELS[rKey].title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                        {ROLE_LABELS[rKey].subtitle}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error ? (
              <div className="px-6 pb-3 text-xs font-semibold text-rose-700">{error}</div>
            ) : null}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                data-testid="new-user-save"
                disabled={submitting}
                onClick={() => void handleCreateUser()}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EmployeesSettingsSection({
  salonId,
  staff,
  categories,
  services,
  onRefresh,
}: {
  salonId: string;
  staff: StaffMemberRecord[];
  categories: ServiceCategoryRecord[];
  services: ServiceRecord[];
  onRefresh: () => Promise<void>;
}) {
  const [filterMode, setFilterMode] = useState<"active" | "all" | "online">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState<StaffMemberRecord | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);

  // Employee modal state
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "unknown">("female");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState("#f4b6c2");
  const [bookableOnline, setBookableOnline] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      if (filterMode === "active" && !member.active) return false;
      if (filterMode === "online" && !member.bookableOnline) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          member.displayName.toLowerCase().includes(q) ||
          member.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [staff, filterMode, searchQuery]);

  function openNewEmployeeModal() {
    setEditingMember(null);
    setIsNewModal(true);
    setDisplayName("");
    setGender("female");
    setPhone("+49 151 ");
    setEmail("");
    setColor(SETTINGS_COLOR_SWATCHES[0] ?? "#f9a8d4");
    setBookableOnline(true);
    setSelectedServiceIds(services.map((s) => s.id));
  }

  function openEditEmployeeModal(member: StaffMemberRecord) {
    setEditingMember(member);
    setIsNewModal(false);
    setDisplayName(member.displayName);
    setGender(member.gender || "female");
    setPhone(member.phone || "");
    setEmail(member.email || "");
    setColor(member.color || "#f4b6c2");
    setBookableOnline(member.bookableOnline ?? true);
    setSelectedServiceIds(member.serviceIds);
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  function toggleAllServices() {
    if (selectedServiceIds.length === services.length) {
      setSelectedServiceIds([]);
    } else {
      setSelectedServiceIds(services.map((s) => s.id));
    }
  }

  function toggleCategoryServices(catId: string) {
    const catServiceIds = services
      .filter((s) => s.categoryId === catId)
      .map((s) => s.id);
    const allSelected = catServiceIds.every((id) => selectedServiceIds.includes(id));
    if (allSelected) {
      setSelectedServiceIds((current) =>
        current.filter((id) => !catServiceIds.includes(id)),
      );
    } else {
      setSelectedServiceIds((current) =>
        Array.from(new Set([...current, ...catServiceIds])),
      );
    }
  }

  async function handleSaveEmployee() {
    if (!displayName.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      if (isNewModal) {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            salonId,
            displayName: displayName.trim(),
            gender,
            phone,
            email,
            color,
            bookableOnline,
            serviceIds: selectedServiceIds,
          }),
        });
        if (res.ok) {
          setFeedback(`Mitarbeiterin „${displayName.trim()}“ wurde angelegt.`);
        }
      } else if (editingMember) {
        const res = await fetch(`/api/staff/${editingMember.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            salonId,
            displayName: displayName.trim(),
            gender,
            phone,
            email,
            color,
            bookableOnline,
            serviceIds: selectedServiceIds,
          }),
        });
        if (res.ok) {
          setFeedback(`Änderungen für „${displayName.trim()}“ wurden gespeichert.`);
        }
      }
      setIsNewModal(false);
      setEditingMember(null);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  const modalOpen = isNewModal || Boolean(editingMember);

  return (
    <div data-testid="settings-section-employees" className="space-y-5">
      {/* Header matching video 01:25 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mitarbeiter</h2>
          <p className="text-xs text-slate-500">
            Mitarbeiterverzeichnis, Kalenderfarben, Online-Buchbarkeit und freigeschaltete Leistungen.
          </p>
        </div>
        <button
          type="button"
          data-testid="settings-new-employee-btn"
          onClick={openNewEmployeeModal}
          className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
        >
          Neuer Mitarbeiter
        </button>
      </div>

      {feedback ? (
        <div
          data-testid="employees-settings-feedback"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {feedback}
        </div>
      ) : null}

      {/* Filter & Search Toolbar matching video 01:25 */}
      <div className="grid gap-3 sm:grid-cols-[240px_1fr]">
        <select
          data-testid="employees-filter-select"
          value={filterMode}
          onChange={(event) =>
            setFilterMode(event.target.value as "active" | "all" | "online")
          }
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800"
        >
          <option value="active">Aktive Mitarbeiter</option>
          <option value="all">Alle Mitarbeiter</option>
          <option value="online">Online buchbar</option>
        </select>
        <input
          type="search"
          data-testid="employees-search-input"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Mitarbeiter suchen…"
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900"
        />
      </div>

      {/* Employee Cards List matching video 01:25 – 01:35 */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          AKTIVE MITARBEITER ({filteredStaff.length})
        </p>
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            data-testid={`settings-employee-row-${member.displayName}`}
            onClick={() => openEditEmployeeModal(member)}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs transition hover:border-slate-300 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-slate-800 border border-black/10"
                style={{ backgroundColor: member.color }}
              >
                {member.displayName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <span
                className="rounded-md px-3 py-1 text-xs font-bold text-slate-900 border border-black/5"
                style={{ backgroundColor: member.color }}
              >
                {member.displayName}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span
                data-testid={`settings-employee-service-count-${member.displayName}`}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700"
                title="Zugewiesene Leistungen"
              >
                <span>📋</span>
                <span>{member.serviceCount}</span>
              </span>
              {member.bookableOnline ? (
                <span title="Online buchbar" className="text-slate-500">
                  🌐
                </span>
              ) : null}
              <button
                type="button"
                data-testid={`settings-employee-edit-${member.displayName}`}
                onClick={(event) => {
                  event.stopPropagation();
                  openEditEmployeeModal(member);
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Bearbeiten
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Create / Edit Modal matching video 01:05 – 01:18 */}
      {modalOpen ? (
        <div
          data-testid="employee-editor-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {isNewModal ? "Mitarbeiter hinzufügen" : "Mitarbeiter bearbeiten"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewModal(false);
                  setEditingMember(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Top Row: Basic Info (Left) + Visual Appearance (Right) matching video 01:05 */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3.5">
                  <h4 className="text-sm font-bold text-slate-900">Basisinformationen</h4>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      NAME *
                    </label>
                    <input
                      type="text"
                      data-testid="employee-modal-name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="z. B. Sofia Lindner"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      GESCHLECHT
                    </label>
                    <select
                      value={gender}
                      onChange={(event) =>
                        setGender(event.target.value as "female" | "male" | "unknown")
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="female">Weiblich</option>
                      <option value="male">Männlich</option>
                      <option value="unknown">Keine Angabe</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      TELEFONNUMMER
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+49 151 ..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      E-MAIL-ADRESSE
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@jeannie-nagelstudio.de"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3.5">
                    <h4 className="text-sm font-bold text-slate-900">Optische Darstellung</h4>
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-slate-900 border border-black/10"
                        style={{ backgroundColor: color }}
                      >
                        {(displayName || "MA")
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Kalenderfarbe wählen</p>
                        <p className="text-[11px] text-slate-500">
                          Bestimmt die Spalten- und Terminfarbe im Kalender.
                        </p>
                      </div>
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
                            data-testid={`employee-color-swatch-${swatch}`}
                            onClick={() => setColor(swatch)}
                            className={`h-7 w-7 rounded-full border transition ${
                              color.toLowerCase() === swatch.toLowerCase()
                                ? "scale-110 border-slate-900 ring-2 ring-slate-900/20"
                                : "border-black/15 hover:scale-105"
                            }`}
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h5 className="text-xs font-bold text-slate-900">Online-Buchungen</h5>
                      <label className="mt-2 flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bookableOnline}
                          onChange={(event) => setBookableOnline(event.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded accent-[#f28b82]"
                        />
                        <span>Mitarbeiterin ist online buchbar</span>
                      </label>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h5 className="text-xs font-bold text-slate-900">Dienstplan-Optionen</h5>
                      <label className="mt-2 flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="mt-0.5 h-4 w-4 rounded accent-[#f28b82]"
                        />
                        <span>Arbeitszeiten im Dienstplan verwalten</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card: Assigned Services by Category Accordion matching video 01:05 – 01:15 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Dieser Mitarbeiter ist für folgende Leistungen verfügbar
                  </h4>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="employee-modal-all-services"
                      checked={
                        services.length > 0 && selectedServiceIds.length === services.length
                      }
                      onChange={toggleAllServices}
                      className="h-4 w-4 rounded accent-[#f28b82]"
                    />
                    <span>
                      Alle Behandlungen ({selectedServiceIds.length} / {services.length})
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  {categories.map((cat) => {
                    const catServices = services.filter((s) => s.categoryId === cat.id);
                    if (catServices.length === 0) return null;
                    const selectedInCat = catServices.filter((s) =>
                      selectedServiceIds.includes(s.id),
                    ).length;
                    const isExpanded = Boolean(expandedCategoryIds[cat.id]);
                    return (
                      <div
                        key={cat.id}
                        className="overflow-hidden rounded-lg border border-slate-200"
                      >
                        <div
                          className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-900"
                          style={{ backgroundColor: `${cat.color}66` }}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedInCat === catServices.length}
                              onChange={() => toggleCategoryServices(cat.id)}
                              className="h-4 w-4 rounded accent-[#f28b82]"
                            />
                            <span>{cat.name}</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-semibold text-slate-700">
                              {selectedInCat} / {catServices.length}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCategoryIds((prev) => ({
                                  ...prev,
                                  [cat.id]: !prev[cat.id],
                                }))
                              }
                              className="text-slate-700 hover:text-slate-900"
                            >
                              {isExpanded ? "▴" : "▾"}
                            </button>
                          </div>
                        </div>
                        {isExpanded ? (
                          <div className="divide-y divide-slate-100 bg-white px-4 py-2">
                            {catServices.map((svc) => (
                              <label
                                key={svc.id}
                                className="flex items-center justify-between py-1.5 text-xs text-slate-800 cursor-pointer"
                              >
                                <span className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    data-testid={`employee-service-checkbox-${svc.name}`}
                                    checked={selectedServiceIds.includes(svc.id)}
                                    onChange={() => toggleService(svc.id)}
                                    className="h-4 w-4 rounded accent-[#f28b82]"
                                  />
                                  <span>{svc.name}</span>
                                </span>
                                <span className="text-slate-500">
                                  {svc.durationMinutes} Min. · {formatEuroPrice(svc.priceCents)}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3.5">
              <button
                type="button"
                onClick={() => {
                  setIsNewModal(false);
                  setEditingMember(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Schließen
              </button>
              <button
                type="button"
                data-testid="employee-modal-save"
                disabled={saving || !displayName.trim()}
                onClick={() => void handleSaveEmployee()}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ResourcesSettingsSection({
  resources,
}: {
  resources: ResourceRow[];
}) {
  return (
    <div data-testid="settings-section-resources" className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ressourcen</h2>
          <p className="text-xs text-slate-500">
            Aktive Kabinen-, Platz- und Mitarbeiter-Ressourcen in der PostgreSQL-Belegungsprüfung.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs divide-y divide-slate-100">
        {resources.map((res) => (
          <div key={res.id} className="flex items-center justify-between px-5 py-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-800">
                {res.displayName.slice(0, 2)}
              </span>
              <div>
                <p className="font-bold text-slate-900">{res.displayName}</p>
                <p className="text-[11px] text-slate-500">Typ: {res.resourceType}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              Aktiv
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
