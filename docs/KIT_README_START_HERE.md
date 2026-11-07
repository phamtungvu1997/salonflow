# Nail Salon Booking — Cursor Project Starter Kit

**Planning and agent-configuration kit, not a working application.** Created 4 Nov 2026.

## Goal
Build an internal, multi-location salon calendar for Jeannie Nagelstudio and Juliet – Salon de Beauté in Hamburg and a future Heide branch. Match the *workflow and usability* of Salonized with independently written code and original branding. No online payments, POS, invoicing, or inventory in V1.

## Fast setup
1. Create a private GitHub repository: `nail-salon-booking`.
2. Copy **the contents of this folder** into the repository root, preserving `.cursor/agents/` and `.github/`.
3. Do not put real customer names, phone numbers or unredacted Salonized screenshots in Git or an agent's cloud workspace. Place sanitized screenshots in `docs/ui-reference/` only if your business privacy policy permits it.
4. Open the repo in Cursor. Read `AGENTS.md` and `docs/01_PRODUCT_CHARTER.md`.
5. If eligible, create a Cursor **Project** using the private repository in the Agents Window; paste `prompts/CURSOR_PROJECT_COORDINATOR.md`. If Projects is unavailable, use Cursor Agent in Plan mode for the same prompt, then run each issue manually.
6. **First instruction:** inspect the kit, review requirements, propose an implementation plan and create issues; do not code until architecture + UI reference are approved.
7. After plan approval, start `NS-001`, and only then implementation phases. Require PRs and CI checks. The owner must approve merges and production releases.
8. Optionally add scheduled Project subscriptions or Cursor Automations using prompts in `/prompts`. Begin with manual runs before enabling scheduled changes.

## Canonical document order
1. `AGENTS.md`: universal conduct and engineering rules.
2. `docs/01_PRODUCT_CHARTER.md`: current agreed business scope.
3. `docs/02_SALONIZED_FUNCTION_MAP.md`: feature-to-source map and parity decisions.
4. `docs/03_UI_UX_SPEC.md`: screenshot-derived design and interaction spec.
5. `docs/04_ARCHITECTURE_AND_CONTRACTS.md`: module and data contracts.
6. `docs/05_DELIVERY_PLAN.md`: phased tickets and dependencies.
7. `docs/06_QUALITY_AND_RELEASE_GATES.md` and `docs/08_TEST_MATRIX.md`: definition of done and evidence.
8. `docs/BASELINE_BLUEPRINT.md`, `docs/PHASE_A_REFERENCE.md`, `docs/MASTER_PROMPT_REFERENCE.md`: prior reference specifications. If anything conflicts, raise a question / create an ADR rather than silently choosing.

## Do not mistake this kit for completed work
No application code, working prototype, migrations, tests, cloud agent schedule, GitHub integration, or deployed hosting has been created by this kit. CI configuration must be implemented as ticket `NS-002` once stack is approved.

## Official references
- Salonized official docs: https://help.salonized.com/en
- Cursor Projects: https://cursor.com/docs/agent/projects
- Cursor subagents: https://cursor.com/docs/subagents
- Cursor automations: https://cursor.com/docs/cloud-agent/automations
- Cursor rules: https://cursor.com/docs/rules
