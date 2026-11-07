import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { salons } from "./salons";
import { staff } from "./staff";

export const serviceCategories = pgTable("service_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
});

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => serviceCategories.id),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonServices = pgTable(
  "salon_services",
  {
    salonId: text("salon_id")
      .notNull()
      .references(() => salons.id),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
    durationMinutes: integer("duration_minutes").notNull(),
    priceCents: integer("price_cents").notNull(),
    active: boolean("active").notNull().default(true),
  },
  (table) => [primaryKey({ columns: [table.salonId, table.serviceId] })],
);

export const staffServices = pgTable(
  "staff_services",
  {
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
  },
  (table) => [primaryKey({ columns: [table.staffId, table.serviceId] })],
);
