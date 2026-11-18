import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createUserSchema = z.object({
  salonId: z.string().min(1),
  firstName: z.string().trim().min(1, "Vorname erforderlich.").max(80),
  lastName: z.string().trim().min(1, "Nachname erforderlich.").max(80),
  email: z.string().trim().email("Gültige E-Mail-Adresse erforderlich.").max(160),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein.").max(120),
  role: z.enum(["owner", "manager", "receptionist", "technician"]),
  autoSignOut15Min: z.boolean().optional(),
});

const updateUserRoleSchema = z.object({
  salonId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["owner", "manager", "receptionist", "technician"]),
  displayName: z.string().trim().min(2).max(160).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Ungültiges Benutzerkonto.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Anlegen von Benutzerkonten.");
    }

    const displayName = `${body.firstName} ${body.lastName}`.trim();
    const userId = `user_${crypto.randomUUID()}`;
    const sql = getSql();

    const created = await sql.begin(async (tx) => {
      const [existing] = await tx`
        SELECT id FROM users WHERE LOWER(email) = LOWER(${body.email})
      `;
      const targetUserId = existing ? (existing.id as string) : userId;

      if (!existing) {
        await tx`
          INSERT INTO users (id, email, display_name, status, password_hash)
          VALUES (${targetUserId}, ${body.email.toLowerCase()}, ${displayName}, 'active', ${`dev:${body.password}`})
        `;
      } else {
        await tx`
          UPDATE users
          SET display_name = ${displayName}, status = 'active'
          WHERE id = ${targetUserId}
        `;
      }

      await tx`
        DELETE FROM user_salon_roles
        WHERE user_id = ${targetUserId} AND salon_id = ${body.salonId}
      `;
      await tx`
        INSERT INTO user_salon_roles (user_id, salon_id, role)
        VALUES (${targetUserId}, ${body.salonId}, ${body.role})
      `;

      return {
        id: targetUserId,
        email: body.email.toLowerCase(),
        displayName,
        status: "active",
        role: body.role,
      };
    });

    return Response.json({ userAccount: created }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const parsed = updateUserRoleSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Ungültige Rollenänderung.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zur Rollenänderung.");
    }

    const sql = getSql();
    await sql.begin(async (tx) => {
      if (body.displayName) {
        await tx`
          UPDATE users SET display_name = ${body.displayName} WHERE id = ${body.userId}
        `;
      }
      await tx`
        DELETE FROM user_salon_roles
        WHERE user_id = ${body.userId} AND salon_id = ${body.salonId}
      `;
      await tx`
        INSERT INTO user_salon_roles (user_id, salon_id, role)
        VALUES (${body.userId}, ${body.salonId}, ${body.role})
      `;
    });

    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

const deleteUserSchema = z.object({
  salonId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["owner", "manager", "receptionist", "technician"]),
});

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const parsed = deleteUserSchema.safeParse({
      salonId: url.searchParams.get("salonId"),
      userId: url.searchParams.get("userId"),
      role: url.searchParams.get("role"),
    });
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Salon, Konto und Rolle sind erforderlich.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Löschen von Benutzerkonten.");
    }
    if (body.userId === user.id) {
      throw new BookingError(409, "self_delete", "Das eigene Benutzerkonto kann hier nicht gelöscht werden.");
    }

    const sql = getSql();
    await sql.begin(async (tx) => {
      if (body.role === "owner") {
        const owners = await tx<{ count: number }[]>`
          SELECT COUNT(*)::int AS count
          FROM user_salon_roles
          WHERE salon_id = ${body.salonId} AND role = 'owner'
        `;
        if ((owners[0]?.count ?? 0) <= 1) {
          throw new BookingError(409, "last_owner", "Der letzte Inhaber dieses Salons kann nicht gelöscht werden.");
        }
      }

      await tx`
        DELETE FROM user_salon_roles
        WHERE user_id = ${body.userId} AND salon_id = ${body.salonId} AND role = ${body.role}
      `;

      const remaining = await tx<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM user_salon_roles WHERE user_id = ${body.userId}
      `;
      if ((remaining[0]?.count ?? 0) === 0) {
        await tx`
          UPDATE users SET status = 'inactive' WHERE id = ${body.userId}
        `;
      }
    });

    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
