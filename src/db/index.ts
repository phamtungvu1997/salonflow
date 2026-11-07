import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Database client factory. Requires DATABASE_URL.
 * Not used by M01/M02 UI; reserved for M04+ server modules.
 */
export function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create a database client");
  }
  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
export { schema };
