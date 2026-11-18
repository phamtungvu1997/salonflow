import { z } from "zod";

import { createAppointment } from "@/server/booking";
import type { Db } from "@/server/db";
import { BookingError } from "@/server/time";

import { loadSalonCatalog, queryInternalAvailability } from "./availability";
import type { AvailableSlotOption, CatalogService, CatalogStaff } from "./types";

export const searchServicesInput = z.object({
  salonId: z.string().min(1),
  query: z.string().trim().max(80).optional(),
});

export const listEligibleEmployeesInput = z.object({
  salonId: z.string().min(1),
  serviceId: z.string().min(1),
});

export const queryRealAvailabilityInput = z.object({
  salonId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  staffId: z.string().min(1).nullable().optional(),
});

export const createBookingInput = z.object({
  salonId: z.string().min(1),
  staffId: z.string().min(1),
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  idempotencyKey: z.string().min(8).max(80),
  notes: z.string().trim().max(2000).optional(),
});

export async function searchServices(
  sql: Db,
  raw: z.infer<typeof searchServicesInput>,
): Promise<CatalogService[]> {
  const input = searchServicesInput.parse(raw);
  const { services } = await loadSalonCatalog(sql, input.salonId);
  const q = input.query?.toLowerCase().trim();
  if (!q) return services;
  return services.filter((sv) => sv.name.toLowerCase().includes(q));
}

export async function listEligibleEmployees(
  sql: Db,
  raw: z.infer<typeof listEligibleEmployeesInput>,
): Promise<CatalogStaff[]> {
  const input = listEligibleEmployeesInput.parse(raw);
  const { services, staff } = await loadSalonCatalog(sql, input.salonId);
  const service = services.find((sv) => sv.id === input.serviceId);
  if (!service) {
    throw new BookingError(422, "service_not_found", "Leistung nicht gefunden.");
  }
  return staff.filter((st) => service.eligibleStaffIds.includes(st.id));
}

export async function queryRealAvailability(
  sql: Db,
  raw: z.infer<typeof queryRealAvailabilityInput>,
): Promise<{
  date: string;
  durationMinutes: number;
  slots: AvailableSlotOption[];
  service: CatalogService;
  staff: CatalogStaff[];
}> {
  const input = queryRealAvailabilityInput.parse(raw);
  return queryInternalAvailability(sql, {
    salonId: input.salonId,
    serviceId: input.serviceId,
    date: input.date,
    staffId: input.staffId,
  });
}

export async function createBooking(
  sql: Db,
  actorUserId: string,
  raw: z.infer<typeof createBookingInput>,
): Promise<{ appointmentId: string; reused: boolean }> {
  const input = createBookingInput.parse(raw);

  // Revalidate the slot immediately before write.
  const availability = await queryInternalAvailability(sql, {
    salonId: input.salonId,
    serviceId: input.serviceId,
    date: input.date,
    staffId: input.staffId,
  });
  const slot = availability.slots.find((s) => s.start === input.start);
  if (!slot || !slot.availableStaffIds.includes(input.staffId)) {
    throw new BookingError(
      409,
      "slot_unavailable",
      "Dieser Termin ist nicht mehr verfügbar. Bitte wählen Sie eine andere Zeit.",
    );
  }

  return createAppointment(sql, actorUserId, {
    salonId: input.salonId,
    staffId: input.staffId,
    customerId: input.customerId,
    serviceId: input.serviceId,
    date: input.date,
    start: input.start,
    notes: input.notes ?? "Gebucht über Kundendialog",
    idempotencyKey: input.idempotencyKey,
  });
}
