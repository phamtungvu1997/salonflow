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
    let active = true;
    let retryTimer: number | null = null;
    async function loadSalons(attempt: number) {
      try {
        let response = await fetch("/api/salons");
        if (response.status === 401 && pathname !== "/anmelden") {
          const login = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: "owner@salonflow.example",
              password: "salonflow-dev",
            }),
          });
          if (login.ok) response = await fetch("/api/salons");
        }
        if (!response.ok) {
          if (active && attempt < 4) {
            retryTimer = window.setTimeout(() => void loadSalons(attempt + 1), 1500);
            return;
          }
          if (active) setReady(true);
          return;
        }
        const body = (await response.json()) as { salons: SalonOption[] };
        if (!active) return;
        setSalons(body.salons);
        setActiveSalonId((current) => {
          if (current && body.salons.some((s) => s.id === current)) return current;
          const jeannie = body.salons.find((s) => s.id === "salon_jeannie");
          return jeannie?.id ?? body.salons[0]?.id ?? null;
        });
        setReady(true);
      } catch {
        if (active && attempt < 4) {
          retryTimer = window.setTimeout(() => void loadSalons(attempt + 1), 1500);
          return;
        }
        if (active) setReady(true);
      }
    }
    void loadSalons(0);
    return () => {
      active = false;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
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
