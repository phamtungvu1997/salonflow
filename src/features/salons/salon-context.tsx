"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SalonOption = { id: string; name: string; city: string };

type SalonContextValue = {
  salons: SalonOption[];
  activeSalon: SalonOption | null;
  setActiveSalonId: (id: string) => void;
  ready: boolean;
};

const SalonContext = createContext<SalonContextValue | null>(null);

export function SalonProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [salons, setSalons] = useState<SalonOption[]>([]);
  const [activeSalonId, setActiveSalonId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/salons")
      .then(async (response) => {
        if (!response.ok) return [];
        const body = (await response.json()) as { salons: SalonOption[] };
        return body.salons;
      })
      .then((next) => {
        if (cancelled) return;
        setSalons(next);
        setActiveSalonId((current) => current ?? next[0]?.id ?? null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const value = useMemo<SalonContextValue>(() => {
    const activeSalon = salons.find((salon) => salon.id === activeSalonId) ?? salons[0] ?? null;
    return { salons, activeSalon, setActiveSalonId, ready };
  }, [salons, activeSalonId, ready]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  const ctx = useContext(SalonContext);
  if (!ctx) throw new Error("useSalon must be used within SalonProvider");
  return ctx;
}
