# PR-opened trigger: independent QA and security review

Trigger: a new/updated draft PR in the private nail-salon-booking repository.

Delegate to independent-reviewer + qa-engineer, and security-reviewer for authentication, privacy, database, access or deployment changes. Review the actual diff and tests rather than trusting PR summary. Execute meaningful checks in an isolated non-production environment.

Comment with: issues that must block merge, test evidence, screenshot/UX regressions, scope creep, migration safety, and any overlooked scheduling collisions. Distinguish verified facts from assumptions. Do not approve, merge or deploy; the owner and GitHub branch rules remain authoritative.
