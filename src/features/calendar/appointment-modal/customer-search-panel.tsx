"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ModalCustomer } from "./types";

export function CustomerSearchPanel({
  query,
  onQuery,
  results,
  selected,
  onSelect,
  adding,
  onAdd,
  newName,
  onNewName,
  walkIn,
  onWalkIn,
}: {
  query: string;
  onQuery: (value: string) => void;
  results: ModalCustomer[];
  selected: ModalCustomer | null;
  onSelect: (customer: ModalCustomer) => void;
  adding: boolean;
  onAdd: () => void;
  newName: string;
  onNewName: (value: string) => void;
  walkIn: boolean;
  onWalkIn: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (!listOpen) return;
    function onDocMouseDown(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setListOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [listOpen]);

  const showResults = (listOpen || query.trim().length > 0) && results.length > 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
      <h3 className="text-[15px] font-semibold text-[#1c1e21]">Kundin</h3>
      <div ref={boxRef} className="relative mt-3">
        <div
          onClick={() => {
            setListOpen(true);
            inputRef.current?.focus();
          }}
          className="relative flex h-9 w-full cursor-pointer items-center rounded-lg border border-[#e1e4ea] bg-white pl-8 pr-2 text-sm hover:border-[#c5cad3] focus-within:ring-2 focus-within:ring-[var(--brand-ring)]"
        >
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#8b919a]" />
          <input
            ref={inputRef}
            value={query}
            onFocus={() => setListOpen(true)}
            onClick={() => setListOpen(true)}
            onChange={(event) => {
              setListOpen(true);
              onQuery(event.target.value);
            }}
            placeholder="Kundin suchen"
            aria-label="Kundin suchen"
            data-testid="booking-customer-search"
            autoComplete="off"
            className="h-full w-full bg-transparent text-sm placeholder:text-[#98a0aa] focus:outline-none"
          />
        </div>
        {showResults ? (
          <ul
            className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-[#e1e4ea] bg-white shadow-sm"
            data-testid="booking-customer-results"
          >
            {results.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  aria-label={customer.displayName}
                  className="flex w-full flex-col px-3 py-1.5 text-left text-sm hover:bg-[#f4f5f7] focus-visible:bg-[#f4f5f7] focus-visible:outline-none"
                  onClick={() => {
                    onSelect(customer);
                    setListOpen(false);
                  }}
                >
                  <span>{customer.displayName}</span>
                  {customer.phone || customer.email ? (
                    <span className="truncate text-xs text-[#8b919a]">{customer.phone || customer.email}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button
        type="button"
        className="mt-2 text-sm font-medium text-[var(--brand-purple)] hover:underline"
        onClick={onAdd}
        data-testid="booking-customer-add"
      >
        + Neue Kundin
      </button>
      <button
        type="button"
        data-testid="booking-customer-walkin"
        className="mt-1 block text-sm text-[#5f7084] hover:underline"
        onClick={onWalkIn}
      >
        Walk-in
      </button>
      {adding ? (
        <label className="mt-3 block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">
            Name *
          </span>
          <input
            value={newName}
            onChange={(event) => onNewName(event.target.value)}
            required
            placeholder="Name"
            data-testid="booking-customer-name"
            className="h-9 w-full rounded-lg border border-[#e1e4ea] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
          />
        </label>
      ) : null}
      {selected ? (
        <div className="mt-4 rounded-lg border border-[#e6e8ee] px-3 py-2" data-testid="booking-customer-selected">
          <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">Ausgewählt</p>
          <p className="text-sm font-medium">{selected.displayName}</p>
        </div>
      ) : null}
      {walkIn ? (
        <p className="mt-4 text-sm text-[#5f7084]">Walk-in wird als gekennzeichnete Kundin gespeichert.</p>
      ) : null}
    </div>
  );
}
