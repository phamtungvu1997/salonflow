import { randomBytes, scryptSync } from "node:crypto";
import postgres from "postgres";
import { databaseUrl, startLocalPostgres } from "./postgres-local.mjs";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

await startLocalPostgres();
const sql = postgres(databaseUrl(), { max: 1 });
const passwordHash = hashPassword(process.env.DEV_SEED_PASSWORD ?? "salonflow-dev");

const salons = [
  ["salon_jeannie", "Jeannie Nagelstudio", "Hamburg"],
  ["salon_juliet", "Juliet – Salon de Beauté", "Hamburg"],
  ["salon_heide", "Heide (geplant)", "Heide"],
];
for (const [id, name, city] of salons) {
  await sql`
    INSERT INTO salons (id, name, city, time_zone)
    VALUES (${id}, ${name}, ${city}, 'Europe/Berlin')
    ON CONFLICT (id) DO NOTHING
  `;
}

const users = [
  ["user_owner", "owner@salonflow.example", "Inhaberin Demo", "owner", ["salon_jeannie", "salon_juliet", "salon_heide"]],
  ["user_jeannie", "empfang.jeannie@salonflow.example", "Empfang Jeannie", "receptionist", ["salon_jeannie"]],
  ["user_juliet", "empfang.juliet@salonflow.example", "Empfang Juliet", "receptionist", ["salon_juliet"]],
];
for (const [id, email, displayName, role, salonIds] of users) {
  await sql`
    INSERT INTO users (id, email, display_name, password_hash)
    VALUES (${id}, ${email}, ${displayName}, ${passwordHash})
    ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  for (const salonId of salonIds) {
    await sql`
      INSERT INTO user_salon_roles (user_id, salon_id, role)
      VALUES (${id}, ${salonId}, ${role}::user_role)
      ON CONFLICT DO NOTHING
    `;
  }
}

await sql.end();
console.log("seeded synthetic salons and users");
