import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { databaseUrl, startLocalPostgres } from "./postgres-local.mjs";

await startLocalPostgres();
const sql = postgres(databaseUrl(), { max: 1 });
await sql.unsafe(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);
const dir = path.join(process.cwd(), "src", "db", "migrations");
const files = (await readdir(dir))
  .filter((name) => name.endsWith(".sql") && !name.endsWith("_down.sql"))
  .sort();
for (const filename of files) {
  const applied = await sql`SELECT 1 FROM schema_migrations WHERE filename = ${filename}`;
  if (applied.length > 0) continue;
  const body = await readFile(path.join(dir, filename), "utf8");
  await sql.unsafe(body);
  await sql`INSERT INTO schema_migrations (filename) VALUES (${filename})`;
  console.log(`applied ${filename}`);
}
await sql.end();
console.log(databaseUrl());
