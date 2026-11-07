import { pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { salons } from "./salons";
import { staff } from "./staff";

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "manager",
  "receptionist",
  "technician",
]);

/** Login identity — distinct from bookable staff. */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSalonRoles = pgTable(
  "user_salon_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    salonId: text("salon_id")
      .notNull()
      .references(() => salons.id),
    role: userRoleEnum("role").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.salonId, table.role] })],
);

export const staffUserLinks = pgTable("staff_user_links", {
  staffId: text("staff_id")
    .notNull()
    .references(() => staff.id)
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
});
