# Spec Research: Backfill Relocation

**Date:** 2026-03-16
**Author:** @trilogy
**Spec:** `03-backfill-relocation`

---

## Problem Context

`useHistoryBackfill` is currently called from `overview.tsx` (Overview tab). This has two problems:

1. **Tab lifecycle coupling**: Backfill only runs if the user visits the Overview tab. If the user goes Home → AI, backfill never starts. The `hasRun` ref prevents duplicate runs but also means backfill is silently skipped if `overview.tsx` never mounts.

2. **Return value consumption**: `overview.tsx` uses `useHistoryBackfill()` return value (`WeeklySnapshot[] | null`) to pass `backfillSnapshots` into `useOverviewData`. This creates a direct dependency: `useOverviewData` must accept the snapshots as a parameter OR read them from AsyncStorage.

**Goal**: Move `useHistoryBackfill` to `_layout.tsx` so it runs exactly once per session regardless of which tabs are visited. Make it fire-and-forget (no return value consumed). Callers that need fresh backfill data read from AsyncStorage via `useWeeklyHistory`.

---

## Exploration Findings

### Existing Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| Hooks in `_layout.tsx` | `_layout.tsx` already calls `NoiseOverlay` component | Layout is the right place for session-level effects |
| Fire-and-forget hooks | N/A currently | New pattern — hook runs a side effect, return value ignored |
| `useWeeklyHistory` reads AsyncStorage | `ai.tsx`, `useOverviewData` | Any fresh backfill data is available to all hooks on next AsyncStorage read |

### Key Files

| File | Relevance |
|------|-----------|
| `hourglassws/app/(tabs)/_layout.tsx` | Destination for `useHistoryBackfill` call |
| `hourglassws/app/(tabs)/overview.tsx` | Current location — remove the hook call |
| `hourglassws/src/hooks/useHistoryBackfill.ts` | Modify to not require return value consumption |
| `hourglassws/src/hooks/useOverviewData.ts` | Remove `backfillSnapshots` dependency |

### Current Data Flow (to be changed)

```
overview.tsx
  └── const backfillSnapshots = useHistoryBackfill()  // returns WeeklySnapshot[] | null
        └── passed to useOverviewData(window, backfillSnapshots)
              └── used as: snapshots.length > storedSnapshots.length ? snapshots : storedSnapshots
```

### New Data Flow (after spec)

```
_layout.tsx
  └── useHistoryBackfill()  // fire-and-forget: return value not consumed
        └── writes to AsyncStorage (weekly_history_v2) silently

overview.tsx
  └── useOverviewData(window)  // no backfillSnapshots param
        └── useWeeklyHistory()  // reads AsyncStorage — gets backfilled data on next render
```

The slight latency trade-off: backfill data in `useOverviewData` is available after AsyncStorage writes complete AND `useWeeklyHistory` re-reads. This is acceptable — the user rarely visits Overview immediately after a backfill event (backfill starts t+25s after app open).

### Integration Points

- `useHistoryBackfill` writes to `weekly_history_v2` in AsyncStorage — no change to write path
- `useWeeklyHistory` reads from `weekly_history_v2` — no change needed
- `useOverviewData` currently accepts an optional `backfillSnapshots` parameter — remove it
- `overview.tsx` passes `backfillSnapshots` to `useOverviewData` — remove that wiring

---

## Key Decisions

### Decision 1: Return Value Strategy

**Options considered:**
1. **Keep return value, pass down via Context** — `_layout.tsx` calls the hook, puts result in React Context, `overview.tsx` and `ai.tsx` consume from context.
2. **Fire-and-forget: ignore return value** — Hook writes to AsyncStorage; callers read from AsyncStorage via `useWeeklyHistory`. No context, no props.
3. **Keep return value in `_layout.tsx` state** — Store in `_layout.tsx` state, pass to screens via React Navigation params.

**Chosen:** Option 2 — fire-and-forget, no return value.

**Rationale:** The return value was only an optimization to avoid a second AsyncStorage read after backfill. Since backfill runs at t+25s (user is already looking at content), a slight delay between AsyncStorage write and next `useWeeklyHistory` read is imperceptible. Context and Navigation params add architectural complexity for negligible benefit.

### Decision 2: `useHistoryBackfill` API Change

**Options considered:**
1. Change return type to `void` (breaking change, simpler)
2. Keep `WeeklySnapshot[] | null` return type but callers choose to ignore it (backward compatible)

**Chosen:** Option 2 — keep return type, callers simply don't use it. TypeScript `void` assignment is allowed (`const _ = useHistoryBackfill()` or just `useHistoryBackfill()`).

**Rationale:** Less churn on the hook internals. The function still returns what it always did; the change is purely in call sites (stop consuming the return value). If we want to clean up the type in the future, that's a separate refactor.

---

## Interface Contracts

### useHistoryBackfill (unchanged internally)

```typescript
// Return type unchanged — callers now ignore the return value
export function useHistoryBackfill(): WeeklySnapshot[] | null
// ← src: reads + writes AsyncStorage weekly_history_v2
// ← src: reads credentials from loadCredentials()
// ← src: calls apiGet for work diaries (up to 2 weeks × 7 days = 14 calls)
```

### useOverviewData (signature change)

```typescript
// Before:
export function useOverviewData(
  window?: number,
  backfillSnapshots?: WeeklySnapshot[] | null  // ← remove this parameter
): OverviewData

// After:
export function useOverviewData(window?: number): OverviewData
// ← reads useWeeklyHistory() from AsyncStorage for past weeks
// ← reads useHoursData() + useAIData() for current week
```

### _layout.tsx addition

```typescript
// Added to TabLayout component body:
useHistoryBackfill(); // fire-and-forget — runs once per session, writes to AsyncStorage
```

### overview.tsx change

```typescript
// Before:
const backfillSnapshots = useHistoryBackfill();
const overviewData = useOverviewData(12, backfillSnapshots);

// After:
// (useHistoryBackfill call removed)
const overviewData = useOverviewData(12);
```

### Function Contracts

| Function | Signature | Responsibility | Change |
|----------|-----------|----------------|--------|
| `useHistoryBackfill` | `() => WeeklySnapshot[] \| null` | Background AI% backfill, writes AsyncStorage | call site only |
| `useOverviewData` | `(window?: number) => OverviewData` | Composes overview metrics from hooks | remove param |

---

## Test Plan

### useHistoryBackfill relocation

**Happy Path:**
- `_layout.tsx` renders without crash with `useHistoryBackfill()` added
- `hasRun` ref prevents multiple backfill runs across re-renders of `_layout.tsx`
- `overview.tsx` renders correctly without calling `useHistoryBackfill`
- `useOverviewData` returns correct data when called without `backfillSnapshots`

**Source-Level Checks:**
- `_layout.tsx` imports and calls `useHistoryBackfill()`
- `overview.tsx` does NOT import or call `useHistoryBackfill`
- `useOverviewData` signature does not include `backfillSnapshots` parameter
- `useOverviewData` reads `snapshots` from `useWeeklyHistory()` only (no `backfillSnapshots` conditional)

**Edge Cases:**
- First app launch (no weekly_history_v2 in AsyncStorage): backfill finds no gaps (empty history), runs anyway, finds zero weeks with aiPct=0 that need backfill, exits silently
- User visits Overview before t+25s backfill fires: `useWeeklyHistory` shows current AsyncStorage state (no backfill yet) — sparklines show available data, update automatically when backfill completes and AsyncStorage changes
- Multiple `_layout.tsx` remounts (unlikely but possible): `hasRun` ref in `useHistoryBackfill` prevents duplicate runs

**Mocks Needed:**
- `loadCredentials`: mock returning null (no credentials) or valid credentials
- `getAuthToken`: mock returning a token string
- `apiGet`: mock returning empty arrays (no diary data)
- `loadWeeklyHistory` / `saveWeeklyHistory`: mock AsyncStorage reads/writes

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `hourglassws/app/(tabs)/_layout.tsx` | modify | Add `useHistoryBackfill()` call (fire-and-forget) |
| `hourglassws/app/(tabs)/overview.tsx` | modify | Remove `useHistoryBackfill()` call and `backfillSnapshots` wiring |
| `hourglassws/src/hooks/useOverviewData.ts` | modify | Remove `backfillSnapshots` parameter; rely on `useWeeklyHistory` |

---

## Edge Cases to Handle

1. **`overview.tsx` already mounting before `_layout.tsx` backfill starts** — This is fine. `_layout.tsx` mounts first (it's the parent), so backfill starts before any tab screen mounts.
2. **Backfill writes AsyncStorage after `useWeeklyHistory` has already read** — `useWeeklyHistory` reads once on mount. Overview/AI tab won't see backfilled data until re-render triggered by another state change (or user pulls to refresh). This is acceptable — the delay is imperceptible.
3. **`useHistoryBackfill` in `_layout.tsx` and React strict mode (double mount)** — `hasRun` ref prevents duplicate runs even if `_layout.tsx` mounts twice in strict mode.

---

## Open Questions

None remaining.
