import { cookies } from "next/headers";

import { getSql } from "./db";
import { hashToken } from "./password";
import { BookingError } from "./time";

export const SESSION_COOKIE = "sf_session";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  salonIds: string[];
  defaultSalonId: string;
  rolesBySalon: Record<string, string>;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sql = getSql();
  const rows = await sql<{ id: string; email: string; display_name: string }[]>`
    SELECT u.id, u.email, u.display_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now() AND u.status = 'active'
  `;
  const user = rows[0];
  if (!user) return null;
  const roles = await sql<{ salon_id: string; role: string }[]>`
    SELECT salon_id, role FROM user_salon_roles WHERE user_id = ${user.id}
  `;
  const rolesBySalon: Record<string, string> = {};
  for (const r of roles) {
    rolesBySalon[r.salon_id] = r.role;
  }
  const salonIds = roles.map((role) => role.salon_id);
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    salonIds,
    defaultSalonId: salonIds[0] ?? "salon_jeannie",
    rolesBySalon,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new BookingError(401, "auth", "Bitte anmelden.");
  return user;
}

export function assertSalon(user: SessionUser, salonId: string) {
  if (!user.salonIds.includes(salonId)) {
    throw new BookingError(403, "forbidden", "Kein Zugriff auf diesen Salon.");
  }
}

export function canManageSalon(user: SessionUser, salonId: string): boolean {
  if (!user.salonIds.includes(salonId)) return false;
  const role = user.rolesBySalon[salonId] ?? "owner";
  return role === "owner" || role === "manager" || role === "receptionist";
}
