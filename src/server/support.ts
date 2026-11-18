import { randomUUID } from "node:crypto";

import type { Db } from "@/server/db";

export type SupportEntry = {
  id: string;
  kind: "idea" | "message";
  title: string;
  body: string;
  createdAt: string;
};

async function ensure(sql: Db) {
  await sql`
    CREATE TABLE IF NOT EXISTS support_entries (
      id text PRIMARY KEY,
      salon_id text NOT NULL,
      kind text NOT NULL,
      title text NOT NULL,
      body text NOT NULL,
      author_user_id text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export async function listSupportEntries(sql: Db, salonId: string): Promise<SupportEntry[]> {
  await ensure(sql);
  const rows = await sql<{ id: string; kind: "idea" | "message"; title: string; body: string; created_at: Date }[]>`
    SELECT id, kind, title, body, created_at
    FROM support_entries
    WHERE salon_id = ${salonId}
    ORDER BY created_at DESC
    LIMIT 40
  `;
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function addSupportEntry(
  sql: Db,
  input: { salonId: string; authorUserId: string; kind: "idea" | "message"; title: string; body: string },
): Promise<SupportEntry[]> {
  await ensure(sql);
  await sql`
    INSERT INTO support_entries (id, salon_id, kind, title, body, author_user_id)
    VALUES (
      ${`sup_${randomUUID()}`},
      ${input.salonId},
      ${input.kind},
      ${input.title},
      ${input.body},
      ${input.authorUserId}
    )
  `;
  return listSupportEntries(sql, input.salonId);
}
