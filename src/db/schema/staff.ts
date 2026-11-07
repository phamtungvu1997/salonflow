import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { salons } from "./salons";

export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Bookable assignment of a staff identity to a salon (shifts live elsewhere). */
export const staffSalonAssignments = pgTable("staff_salon_assignments", {
  id: text("id").primaryKey(),
  staffId: text("staff_id")
    .notNull()
    .references(() => staff.id),
  salonId: text("salon_id")
    .notNull()
    .references(() => salons.id),
  active: boolean("active").notNull().default(true),
});
