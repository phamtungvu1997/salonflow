import postgres from "postgres";
import { databaseUrl, startLocalPostgres } from "./postgres-local.mjs";

const pg = await startLocalPostgres();
const sql = postgres(databaseUrl());
const rows = await sql.unsafe("SELECT version()");
console.log(rows[0].version);
await sql.end();
void pg;
