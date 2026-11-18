import type { Db } from "@/server/db";

export type CustomerPreference = {
  serviceId: string | null;
  serviceName: string | null;
  staffId: string | null;
  staffName: string | null;
};

async function ensurePreferenceTable(sql: Db) {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ai_customer_preferences (
      salon_id text NOT NULL,
      customer_id text NOT NULL,
      service_id text,
      service_name text,
      staff_id text,
      staff_name text,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (salon_id, customer_id)
    )
  `);
}

export async function loadCustomerPreference(
  sql: Db,
  salonId: string,
  customerId: string,
): Promise<CustomerPreference | null> {
  await ensurePreferenceTable(sql);
  const rows = await sql<{
    service_id: string | null;
    service_name: string | null;
    staff_id: string | null;
    staff_name: string | null;
  }[]>`
    SELECT service_id, service_name, staff_id, staff_name
    FROM ai_customer_preferences
    WHERE salon_id = ${salonId} AND customer_id = ${customerId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    serviceId: row.service_id,
    serviceName: row.service_name,
    staffId: row.staff_id,
    staffName: row.staff_name,
  };
}

export async function rememberCustomerPreference(
  sql: Db,
  input: {
    salonId: string;
    customerId: string;
    serviceId: string;
    serviceName: string;
    staffId: string;
    staffName: string;
  },
): Promise<void> {
  await ensurePreferenceTable(sql);
  await sql`
    INSERT INTO ai_customer_preferences (
      salon_id, customer_id, service_id, service_name, staff_id, staff_name, updated_at
    )
    VALUES (
      ${input.salonId},
      ${input.customerId},
      ${input.serviceId},
      ${input.serviceName},
      ${input.staffId},
      ${input.staffName},
      now()
    )
    ON CONFLICT (salon_id, customer_id) DO UPDATE SET
      service_id = EXCLUDED.service_id,
      service_name = EXCLUDED.service_name,
      staff_id = EXCLUDED.staff_id,
      staff_name = EXCLUDED.staff_name,
      updated_at = now()
  `;
}

export function preferenceHint(pref: CustomerPreference | null): string | null {
  if (!pref?.serviceName && !pref?.staffName) return null;
  if (pref.serviceName && pref.staffName) {
    return `Zuletzt mochten Sie ${pref.serviceName} bei ${pref.staffName}.`;
  }
  if (pref.serviceName) return `Zuletzt hatten Sie ${pref.serviceName}.`;
  return `Zuletzt waren Sie bei ${pref.staffName}.`;
}
