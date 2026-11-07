import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://salonflow:salonflow@127.0.0.1:5432/salonflow",
  },
  strict: true,
  verbose: true,
});
