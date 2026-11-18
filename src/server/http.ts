import { BookingError } from "@/server/time";

export function apiError(error: unknown) {
  if (error instanceof BookingError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Interner Fehler" }, { status: 500 });
}
