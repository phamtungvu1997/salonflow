import { writeFile } from "node:fs/promises";
import { databaseUrl, startLocalPostgres } from "./postgres-local.mjs";

export default async function globalSetup() {
  await startLocalPostgres();
  const url = databaseUrl();
  process.env.DATABASE_URL = url;
  await writeFile(".env.local", `DATABASE_URL=${url}\n`, "utf8");
  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    const migrate = spawn("node scripts/migrate.mjs", { shell: true, stdio: "inherit" });
    migrate.on("exit", (code) => (code === 0 ? resolve(null) : reject(new Error("migrate failed"))));
  });
  await new Promise((resolve, reject) => {
    const seed = spawn("node scripts/seed.mjs", { shell: true, stdio: "inherit" });
    seed.on("exit", (code) => (code === 0 ? resolve(null) : reject(new Error("seed failed"))));
  });
}
