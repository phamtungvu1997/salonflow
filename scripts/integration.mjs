import { spawn } from "node:child_process";
import { databaseUrl, startLocalPostgres } from "./postgres-local.mjs";

await startLocalPostgres();
process.env.DATABASE_URL = databaseUrl();

async function run(command) {
  const child = spawn(command, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  const code = await new Promise((resolve) => child.on("exit", resolve));
  if ((code ?? 1) !== 0) {
    process.exit(code ?? 1);
  }
}

// Fresh CI clusters have no schema; local .pgdata may already be migrated.
await run("node scripts/migrate.mjs");
await run("node scripts/seed.mjs");
await run("npx vitest run --config vitest.integration.config.ts");
