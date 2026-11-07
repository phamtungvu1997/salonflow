import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { salons } from "./salons";

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  phoneNormalized: text("phone_normalized"),
  email: text("email"),
  homeSalonId: text("home_salon_id").references(() => salons.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
