import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL is not set, skipping remote migrate");
  process.exit(0);
}

const sql = postgres(url, { max: 1 });
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
const [{ count }] = await sql`SELECT count(*)::int AS count FROM salons`;
await sql.end();

if (count === 0) {
  process.env.REMOTE_DATABASE = "1";
  for (const script of ["scripts/seed.mjs", "scripts/seed-demo.mjs"]) {
    const code = await new Promise((resolve) => {
      const child = spawn(process.execPath, [script], { stdio: "inherit", env: process.env });
      child.on("exit", (exitCode) => resolve(exitCode ?? 1));
    });
    if (code !== 0) process.exit(code);
  }
}
