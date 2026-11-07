"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  placeholderSalons,
  type PlaceholderSalon,
} from "@/features/fixtures/placeholder-data";

type SalonContextValue = {
  salons: PlaceholderSalon[];
  activeSalon: PlaceholderSalon;
  setActiveSalonId: (id: string) => void;
};

const SalonContext = createContext<SalonContextValue | null>(null);

export function SalonProvider({ children }: { children: ReactNode }) {
  const [activeSalonId, setActiveSalonId] = useState(placeholderSalons[0].id);

  const value = useMemo(() => {
    const activeSalon =
      placeholderSalons.find((salon) => salon.id === activeSalonId) ??
      placeholderSalons[0];
    return {
      salons: placeholderSalons,
      activeSalon,
      setActiveSalonId,
    };
  }, [activeSalonId]);

  return (
    <SalonContext.Provider value={value}>{children}</SalonContext.Provider>
  );
}

export function useSalon() {
  const ctx = useContext(SalonContext);
  if (!ctx) {
    throw new Error("useSalon must be used within SalonProvider");
  }
  return ctx;
}
