"use client";

import { useEffect, useState } from "react";

import { api } from "@/features/booking/api";
import {
  ActiveCustomerFilter,
  CustomerRecord,
} from "@/features/customers/customer-types";

export function useCustomersDirectory(salonId: string) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [segments, setSegments] = useState({ firstVisitCount: 0, lapsingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveCustomerFilter[]>([]);
  const [tab, setTab] = useState<"list" | "groups">("list");
  const [groupSegment, setGroupSegment] = useState<"first_visit" | "lapsing">("first_visit");
  const [message, setMessage] = useState<string | null>(null);

  async function reload(
    nextQuery = query,
    nextFilters = activeFilters,
    nextTab = tab,
    nextSegment = groupSegment,
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ salonId });
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      for (const f of nextFilters) {
        params.set(f.paramKey, f.paramValue);
      }
      if (nextTab === "groups") {
        params.set("segment", nextSegment);
      }
      const body = await api<{
        customers: CustomerRecord[];
        totalCount: number;
        segments: { firstVisitCount: number; lapsingCount: number };
      }>(`/api/customers?${params}`);
      setCustomers(body.customers);
      setTotalCount(body.totalCount ?? body.customers.length);
      if (body.segments) {
        setSegments(body.segments);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Kundenliste konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void reload(query, activeFilters, tab, groupSegment);
    }, 120);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, query, activeFilters, tab, groupSegment]);

  function addFilter(filter: ActiveCustomerFilter) {
    setActiveFilters((prev) => {
      const withoutSameParam = prev.filter((item) => item.paramKey !== filter.paramKey);
      return [...withoutSameParam, filter];
    });
  }

  function removeFilter(paramKey: string) {
    setActiveFilters((prev) => prev.filter((item) => item.paramKey !== paramKey));
  }

  function clearFilters() {
    setActiveFilters([]);
  }

  async function archiveCustomer(customer: CustomerRecord) {
    await api(`/api/customers/${customer.id}?salonId=${encodeURIComponent(salonId)}`, {
      method: "DELETE",
    });
    setMessage(`Kundin „${customer.displayName}“ wurde archiviert.`);
    await reload(query, activeFilters, tab, groupSegment);
  }

  return {
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
  };
}
