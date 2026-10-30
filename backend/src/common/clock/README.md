# Clock

The single source of the current time for backend business rules (token expiry, CV dates, ...).
Services inject `Clock` and call `now()` instead of `new Date()`, so tests can fix the time.

- **Exports:** `Clock` (injection token and contract), `ClockModule` (global, provides `SystemClock`).
- **In tests:** `Test.createTestingModule(...).overrideProvider(Clock).useValue({ now: () => new Date("...") })`.
- **Used by:** nothing yet; the first date-based rules arrive with authentication (Phase 3).
- **Docs:** [PLAN.md §9 S0.5](../../../../PLAN.md)
