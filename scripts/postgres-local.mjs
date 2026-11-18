import EmbeddedPostgres from "embedded-postgres";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const port = Number(process.env.PGPORT ?? 54329);
const databaseDir = path.join(process.cwd(), ".pgdata");
const user = "postgres";
const password = "password";
const database = "salonflow";

export function databaseUrl(dbName = database) {
  return `postgres://${user}:${password}@127.0.0.1:${port}/${dbName}`;
}

async function canConnect(dbName) {
  const sql = postgres(databaseUrl(dbName), { max: 1, connect_timeout: 2 });
  try {
    await sql.unsafe("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: 1 }).catch(() => undefined);
  }
}

export async function startLocalPostgres() {
  if (await canConnect(database)) {
    process.env.DATABASE_URL = databaseUrl();
    return null;
  }
  if (await canConnect("postgres")) {
    const admin = postgres(databaseUrl("postgres"), { max: 1 });
    const existing = await admin`SELECT 1 FROM pg_database WHERE datname = ${database}`;
    if (existing.length === 0) {
      await admin.unsafe(`CREATE DATABASE ${database}`);
    }
    await admin.end();
    process.env.DATABASE_URL = databaseUrl();
    return null;
  }

  await mkdir(databaseDir, { recursive: true });
  const pg = new EmbeddedPostgres({
    databaseDir,
    port,
    user,
    password,
    persistent: true,
    autoRehydrateSymlinks: true,
  });
  const clusterReady = await canConnect("postgres");
  if (!clusterReady) {
    try {
      await pg.initialise();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/not empty|already/i.test(message)) throw error;
    }
    await pg.start();
  }
  const admin = postgres(databaseUrl("postgres"), { max: 1 });
  const existing = await admin`SELECT 1 FROM pg_database WHERE datname = ${database}`;
  if (existing.length === 0) {
    await admin.unsafe(`CREATE DATABASE ${database}`);
  }
  await admin.end();
  process.env.DATABASE_URL = databaseUrl();
  return pg;
}
