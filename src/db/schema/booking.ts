import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { customers } from "./customers";
import { salons } from "./salons";
import { staff } from "./staff";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "booked",
  "confirmed",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  salonId: text("salon_id")
    .notNull()
    .references(() => salons.id),
  customerId: text("customer_id").references(() => customers.id),
  status: appointmentStatusEnum("status").notNull().default("booked"),
  source: text("source").notNull().default("internal"),
  version: integer("version").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentServices = pgTable("appointment_services", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id")
    .notNull()
    .references(() => appointments.id),
  sequence: integer("sequence").notNull(),
  staffId: text("staff_id")
    .notNull()
    .references(() => staff.id),
  titleSnapshot: text("title_snapshot").notNull(),
  durationMinutesSnapshot: integer("duration_minutes_snapshot").notNull(),
  priceCentsSnapshot: integer("price_cents_snapshot").notNull(),
});

/**
 * Exclusive bookable resources. Staff resources are global (cross-salon).
 * Overlap prevention via GiST exclusion is added in SQL migration (M07 completes tests).
 */
export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  resourceType: text("resource_type").notNull(),
  staffId: text("staff_id").references(() => staff.id),
  salonId: text("salon_id").references(() => salons.id),
  active: boolean("active").notNull().default(true),
});

export const resourceAllocations = pgTable(
  "resource_allocations",
  {
    id: text("id").primaryKey(),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id),
    appointmentId: text("appointment_id").references(() => appointments.id),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("resource_allocations_id_uidx").on(table.id),
  ],
);
