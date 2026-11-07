import postgres from "postgres";

export type Db = postgres.Sql | postgres.TransactionSql;

const globalForSql = globalThis as unknown as { salonflowSql?: postgres.Sql };

export function getSql(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL fehlt. Lokale Datenbank mit npm run db:prepare starten.");
  }
  if (!globalForSql.salonflowSql) {
    globalForSql.salonflowSql = postgres(url, { max: 10 });
  }
  return globalForSql.salonflowSql;
}
