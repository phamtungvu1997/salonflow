import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const salons = pgTable("salons", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  timeZone: text("time_zone").notNull().default("Europe/Berlin"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
