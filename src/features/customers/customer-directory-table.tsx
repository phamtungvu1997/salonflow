"use client";

import { Check, MoreHorizontal, Pencil, Phone, Trash2 } from "lucide-react";

import { CustomerRecord } from "@/features/customers/customer-types";

type CustomerDirectoryTableProps = {
  customers: CustomerRecord[];
  loading: boolean;
  selectedIds: string[];
  rowMenuId: string | null;
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onToggleRowMenu: (id: string | null) => void;
  onCallCustomer: (customer: CustomerRecord) => void;
  onEditCustomer: (customer: CustomerRecord) => void;
  onArchiveCustomer: (customer: CustomerRecord) => void;
};

export function CustomerDirectoryTable({
  customers,
  loading,
  selectedIds,
  rowMenuId,
  onToggleSelectAll,
  onToggleSelectRow,
  onOpenProfile,
  onToggleRowMenu,
  onCallCustomer,
  onEditCustomer,
  onArchiveCustomer,
}: CustomerDirectoryTableProps) {
  return (
    <div className="overflow-x-auto border-t border-[#e5e7eb]">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-white text-[11px] font-bold uppercase tracking-wider text-[#8a9099]">
            <th className="w-10 py-2.5 pl-6 pr-2">
              <input
                type="checkbox"
                aria-label="Alle Kundinnen auswählen"
                checked={customers.length > 0 && selectedIds.length === customers.length}
                onChange={onToggleSelectAll}
                className="h-3.5 w-3.5 rounded border-[#cfd4dc]"
              />
            </th>
            <th className="px-3 py-2.5">NAME</th>
            <th className="px-3 py-2.5">MOBIL</th>
            <th className="px-3 py-2.5">E-MAIL</th>
            <th className="px-3 py-2.5">NEWSLETTER</th>
            <th className="px-3 py-2.5">ADRESSE</th>
            <th className="w-12 py-2.5 pl-2 pr-6 text-right" />
          </tr>
        </thead>
        <tbody data-testid="customer-list" className="divide-y divide-[#eef0f3]">
          {customers.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                data-testid="customer-empty-state"
                className="px-6 py-12 text-center text-[13.5px] text-[#6a6f76]"
              >
                {loading ? "Kundinnen werden geladen…" : "Keine Ergebnisse gefunden."}
              </td>
            </tr>
          ) : (
            customers.map((customer, index) => {
              const isSelected = selectedIds.includes(customer.id);
              const menuOpen = rowMenuId === customer.id;
              return (
                <tr
                  key={customer.id}
                  data-testid={`customer-row-${customer.id}`}
                  className={`group transition-colors hover:bg-[#f1f3f6] ${
                    isSelected
                      ? "bg-[#eff6ff]"
                      : index % 2 === 1
                        ? "bg-[#fafafa]"
                        : "bg-white"
                  }`}
                >
                  <td className="py-2.5 pl-6 pr-2">
                    <input
                      type="checkbox"
                      aria-label={`Kundin ${customer.displayName} auswählen`}
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(customer.id)}
                      className="h-3.5 w-3.5 rounded border-[#cfd4dc]"
                    />
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid={`customer-open-${customer.id}`}
                        onClick={() => onOpenProfile(customer.id)}
                        className="text-left font-semibold text-[#1c1e21] hover:text-[#2563eb] hover:underline"
                      >
                        {customer.displayName}
                      </button>
                      {customer.labels.includes("Favorit") ? (
                        <span className="rounded-full bg-[#dbeafe] px-2 py-0.2 text-[10px] font-semibold text-[#1d4ed8]">
                          Favorit
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-[#4b5057]">{customer.phone ?? "-"}</td>

                  <td className="px-3 py-2.5 text-[#4b5057]">{customer.email ?? "-"}</td>

                  <td className="px-3 py-2.5 text-[#4b5057]">
                    {customer.newsletterOptIn ? (
                      <Check
                        aria-label="Newsletter abonniert"
                        className="h-4 w-4 text-[#4b5057]"
                      />
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-[#5a6068]">
                    {customer.formattedAddress ?? "-"}
                  </td>

                  <td
                    className="relative py-2.5 pl-2 pr-6 text-right"
                    data-row-menu-container
                  >
                    <button
                      type="button"
                      aria-label={`Aktionen für ${customer.displayName}`}
                      data-testid={`customer-row-menu-${customer.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRowMenu(menuOpen ? null : customer.id);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-[#6a6f76] hover:bg-[#e5e7eb] hover:text-[#1c1e21]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {menuOpen ? (
                      <div
                        data-testid="customer-row-context-menu"
                        className="absolute right-6 top-9 z-30 w-48 rounded-lg border border-[#d5d9e0] bg-white py-1.5 text-left shadow-xl"
                      >
                        <button
                          type="button"
                          data-testid="context-menu-call"
                          onClick={() => onCallCustomer(customer)}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-[#1c1e21] hover:bg-[#f3f4f6]"
                        >
                          <Phone className="h-3.5 w-3.5 text-[#5a6068]" />
                          Anrufen
                        </button>
                        <button
                          type="button"
                          data-testid="context-menu-edit"
                          onClick={() => onEditCustomer(customer)}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-[#1c1e21] hover:bg-[#f3f4f6]"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#5a6068]" />
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          data-testid="context-menu-archive"
                          onClick={() => onArchiveCustomer(customer)}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Kundin archivieren
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
