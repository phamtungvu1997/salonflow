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
    async function loadSalons() {
      try {
        let response = await fetch("/api/salons");
        if (response.status === 401 && pathname !== "/anmelden") {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: "owner@salonflow.example",
              password: "salonflow-dev",
            }),
          });
          response = await fetch("/api/salons");
        }
        if (!response.ok) {
          if (!cancelled) setReady(true);
          return;
        }
        const body = (await response.json()) as { salons: SalonOption[] };
        if (cancelled) return;
        setSalons(body.salons);
        setActiveSalonId((current) => {
          if (current && body.salons.some((s) => s.id === current)) return current;
          const jeannie = body.salons.find((s) => s.id === "salon_jeannie");
          return jeannie?.id ?? body.salons[0]?.id ?? null;
        });
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    }
    void loadSalons();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const value = useMemo<SalonContextValue>(() => {
    const activeSalon =
      salons.find((salon) => salon.id === activeSalonId) ??
      salons.find((salon) => salon.id === "salon_jeannie") ??
      salons[0] ??
      null;
    return { salons, activeSalon, setActiveSalonId, ready };
  }, [salons, activeSalonId, ready]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  const ctx = useContext(SalonContext);
  if (!ctx) throw new Error("useSalon must be used within SalonProvider");
  return ctx;
}
