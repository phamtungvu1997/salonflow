# SPEC-004: PostgreSQL schema foundation (M04)

**Owner:** backend-engineer  
**Status:** Schema + SQL shipped (apply against Postgres when available)  
**Depends on:** M01  

## In scope

- Drizzle schema for salons, staff, users/roles, services catalog, appointments skeleton, resources
- Versioned SQL migration (forward) with documented rollback
- No live booking engine yet (M07+)
- Synthetic-compatible IDs/types for future seed

## Out of scope

- Auth sessions (M05)
- GiST exclusion constraint enforcement tests under concurrency (M07)
- Import mappings (M15)

## Acceptance

- `src/db/schema` compiles under TypeScript
- SQL migration present under `src/db/migrations`
- README documents how to apply when Postgres is available
