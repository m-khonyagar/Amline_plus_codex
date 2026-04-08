# Repository Boundaries

## Canonical areas
- `backend/`: application API and worker code
- `frontend/`: web application
- `scripts/`: local developer tooling

## Rules
- New runtime code should stay in backend or frontend, not at the repository root.
- Generated artifacts should not be committed.
- If a new major product area appears, split it into a separate repository instead of expanding this root arbitrarily.
