import { spawn } from "node:child_process";
import { databaseUrl, startLocalPostgres } from "./postgres-local.mjs";

await startLocalPostgres();
process.env.DATABASE_URL = databaseUrl();
const child = spawn("npx vitest run --config vitest.integration.config.ts", {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
const code = await new Promise((resolve) => child.on("exit", resolve));
process.exit(code ?? 1);
