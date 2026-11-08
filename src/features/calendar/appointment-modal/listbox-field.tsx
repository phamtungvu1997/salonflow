"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type ListboxOption = { id: string; label: string; hint?: string; disabled?: boolean };

export function ListboxField({
  label,
  required,
  valueLabel,
  placeholder,
  options,
  open,
  onOpenChange,
  onSelect,
  testId,
  searchable,
}: {
  label: string;
  required?: boolean;
  valueLabel?: string;
  placeholder: string;
  options: ListboxOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  testId: string;
  searchable?: boolean;
}) {
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = options.filter((option) =>
    option.label.toLocaleLowerCase("de").includes(query.trim().toLocaleLowerCase("de")),
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const rect = open ? buttonRef.current?.getBoundingClientRect() : null;

  function choose(index: number) {
    const option = filtered[index];
    if (!option || option.disabled) return;
    onSelect(option.id);
    onOpenChange(false);
    buttonRef.current?.focus();
  }

  return (
    <div className="min-w-0">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">
        {label}
        {required ? " *" : ""}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[#e1e4ea] bg-white px-3 text-left text-sm hover:border-[#c5cad3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        data-testid={testId}
        onClick={() => onOpenChange(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenChange(true);
          }
        }}
      >
        <span className={cn("truncate", !valueLabel && "text-[#98a0aa]")}>{valueLabel || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#8b919a] motion-safe:transition-transform motion-safe:duration-150", open && "rotate-180")} />
      </button>
      {open && rect ? (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          data-testid={`${testId}-list`}
          className="z-50 max-h-64 overflow-auto rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg"
          style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width }}
        >
          {searchable ? (
            <div className="px-2 pb-1">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder="Suchen"
                aria-label={`${label} suchen`}
                className="h-8 w-full rounded-md border border-[#e1e4ea] px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((index) => Math.max(index - 1, 0));
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    choose(active);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenChange(false);
                    buttonRef.current?.focus();
                  }
                }}
              />
            </div>
          ) : null}
          {filtered.length === 0 ? <p className="px-3 py-2 text-sm text-[#8b919a]">Keine Treffer.</p> : null}
          {filtered.map((option, index) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.label === valueLabel}
              disabled={option.disabled}
              className={cn(
                "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-[#f4f5f7] focus-visible:bg-[#f4f5f7] focus-visible:outline-none disabled:cursor-not-allowed disabled:text-[#b0b6be]",
                index === active && "bg-[#f4f5f7]",
              )}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              <span className="truncate">{option.label}</span>
              {option.hint ? <span className="ml-2 shrink-0 text-xs text-[#8b919a]">{option.hint}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
