# Backfill Relocation

**Status:** Draft
**Created:** 2026-03-16
**Last Updated:** 2026-03-16
**Owner:** @trilogy

---

## Overview

### What

Move the `useHistoryBackfill()` call from `overview.tsx` to `_layout.tsx` so that AI%/BrainLift backfill for past weeks runs exactly once per session regardless of which tabs the user visits.

Remove the `backfillSnapshots` parameter from `useOverviewData` so it reads past-week snapshots exclusively from `useWeeklyHistory` (AsyncStorage), eliminating a direct data dependency between `overview.tsx` and the backfill hook.

### Why

The current coupling has two failure modes:

1. **Skipped backfill**: If the user launches the app and goes Home → AI without visiting the Overview tab, `overview.tsx` never mounts and `useHistoryBackfill` never runs. Past weeks remain without AI% data.

2. **Tight data coupling**: `overview.tsx` consumes the return value of `useHistoryBackfill` (`WeeklySnapshot[] | null`) and forwards it to `useOverviewData` as `backfillSnapshots`. This creates a prop-threading dependency that `overview.tsx` must manage — it acts as a data relay between two hooks that have no logical connection to it.

### How

1. Add `useHistoryBackfill()` (fire-and-forget, return value ignored) to the `TabLayout` component in `_layout.tsx`. The parent layout mounts before any tab screen, guaranteeing backfill always starts at session open.

2. In `overview.tsx`, remove the `useHistoryBackfill()` call and stop passing `backfillSnapshots` to `useOverviewData`.

3. In `useOverviewData`, remove the `backfillSnapshots?: WeeklySnapshot[] | null` parameter. The hook already reads from `useWeeklyHistory()` — when backfill completes and writes to AsyncStorage, `useWeeklyHistory` will reflect the updated data on the next render. No return-value relay needed.

The hook internals of `useHistoryBackfill` are unchanged: it still runs the same backfill logic at t+25s, writes to `weekly_history_v2`, and is guarded by `hasRun` ref to prevent duplicate runs.

### Scope

This spec covers the three call-site changes only. It does not change `useHistoryBackfill` internals, the backfill timing (25s delay), or any other data hooks.

---

## Out of Scope

1. **Changing `useHistoryBackfill` return type to `void`** — **Descoped:** The hook keeps its `WeeklySnapshot[] | null` return type. The change is call-site only: callers stop consuming the return value. Changing the return type is a separate cleanup refactor with no functional impact.

2. **Using React Context to broadcast backfill results** — **Descoped:** Option 1 from Decision 1 in spec-research.md was explicitly rejected. Fire-and-forget with AsyncStorage is the chosen pattern.

3. **React Navigation params for backfill data** — **Descoped:** Option 3 from Decision 1 in spec-research.md was explicitly rejected.

4. **Forcing `useWeeklyHistory` to re-subscribe on AsyncStorage writes** — **Descoped:** The slight latency between backfill writing AsyncStorage and `useWeeklyHistory` re-reading it is acceptable per spec-research.md. Real-time subscription is a future optimization.

5. **Changing backfill timing (25s delay)** — **Descoped:** The 25s delay was set in a prior fix to avoid competing with mount animations. This spec does not revisit that decision.

6. **Modifying `useEarningsHistory` call in `overview.tsx`** — **Descoped:** `overview.tsx` still calls `useEarningsHistory(12)` for earnings/hours history population. That is unrelated to backfill relocation.

7. **Updating `ai.tsx`** — **Descoped:** `ai.tsx` does not call `useHistoryBackfill` and is not touched by this spec. (Handled in spec 04-ai-tab-screen.)

---

## Functional Requirements

### FR1: Add `useHistoryBackfill` to `_layout.tsx`

Add a fire-and-forget call to `useHistoryBackfill()` in the `TabLayout` component body in `hourglassws/app/(tabs)/_layout.tsx`.

**Success Criteria:**

- SC1.1 — `_layout.tsx` imports `useHistoryBackfill` from `@/src/hooks/useHistoryBackfill`
- SC1.2 — `TabLayout` component body calls `useHistoryBackfill()` without assigning the return value
- SC1.3 — The call is present before the `return` statement (runs on every mount of `TabLayout`)
- SC1.4 — `_layout.tsx` continues to render correctly (no crash from adding the hook)
- SC1.5 — The `hasRun` ref inside `useHistoryBackfill` prevents duplicate backfill runs if `_layout.tsx` re-mounts

---

### FR2: Remove `useHistoryBackfill` from `overview.tsx`

Remove the `useHistoryBackfill()` call and all references to `backfillSnapshots` from `hourglassws/app/(tabs)/overview.tsx`.

**Success Criteria:**

- SC2.1 — `overview.tsx` does not import `useHistoryBackfill`
- SC2.2 — `overview.tsx` does not call `useHistoryBackfill()`
- SC2.3 — `overview.tsx` calls `useOverviewData(window)` without a second argument
- SC2.4 — No `backfillSnapshots` variable is declared or referenced in `overview.tsx`
- SC2.5 — `overview.tsx` renders correctly without the hook (no runtime errors)

---

### FR3: Remove `backfillSnapshots` parameter from `useOverviewData`

Update `useOverviewData` in `hourglassws/src/hooks/useOverviewData.ts` to remove the `backfillSnapshots?: WeeklySnapshot[] | null` parameter and the conditional that preferred it over `storedSnapshots`.

**Success Criteria:**

- SC3.1 — `useOverviewData` signature is `(window: 4 | 12) => UseOverviewDataResult` (no second parameter)
- SC3.2 — The function body reads snapshots exclusively from `useWeeklyHistory()` — no `backfillSnapshots` variable
- SC3.3 — The `backfillSnapshots ?? storedSnapshots` conditional is removed; `snapshots` comes directly from `useWeeklyHistory()`
- SC3.4 — The `WeeklySnapshot` type import remains (still used internally by `useWeeklyHistory`)
- SC3.5 — `useMemo` dependency array does not include `backfillSnapshots`
- SC3.6 — Existing `useOverviewData` tests still pass (data composition logic is unchanged)

---

## Technical Design

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/app/(tabs)/_layout.tsx` | Add `useHistoryBackfill()` import and call |
| `hourglassws/app/(tabs)/overview.tsx` | Remove `useHistoryBackfill` import, call, and `backfillSnapshots` wiring |
| `hourglassws/src/hooks/useOverviewData.ts` | Remove `backfillSnapshots` parameter and conditional |

### Files to Reference (No Change)

| File | Why Referenced |
|------|---------------|
| `hourglassws/src/hooks/useHistoryBackfill.ts` | Hook internals unchanged; `hasRun` ref behavior confirmed |
| `hourglassws/src/hooks/useWeeklyHistory.ts` | Already used in `useOverviewData`; reads `weekly_history_v2` |
| `hourglassws/src/hooks/__tests__/useOverviewData.test.ts` | Existing tests must pass after signature change |

### Precise Code Changes

#### `_layout.tsx` — Add hook call

```typescript
// Add import (after existing imports):
import { useHistoryBackfill } from '@/src/hooks/useHistoryBackfill';

// Add in TabLayout body before return:
export default function TabLayout() {
  useHistoryBackfill(); // fire-and-forget — runs once per session, writes AsyncStorage
  return ( ... );
}
```

#### `overview.tsx` — Remove hook and wiring

```typescript
// REMOVE this import:
import { useHistoryBackfill } from '@/src/hooks/useHistoryBackfill';

// REMOVE these two lines:
const backfillSnapshots = useHistoryBackfill();
const { data: overviewData } = useOverviewData(window, backfillSnapshots);

// REPLACE with:
const { data: overviewData } = useOverviewData(window);
```

#### `useOverviewData.ts` — Remove parameter

```typescript
// BEFORE:
export function useOverviewData(
  window: 4 | 12,
  backfillSnapshots?: WeeklySnapshot[] | null,
): UseOverviewDataResult {
  const { snapshots: storedSnapshots, isLoading: historyLoading } = useWeeklyHistory();
  const snapshots = backfillSnapshots ?? storedSnapshots;
  ...
  }, [snapshots, hoursData, aiData, window, backfillSnapshots]);

// AFTER:
export function useOverviewData(
  window: 4 | 12,
): UseOverviewDataResult {
  const { snapshots, isLoading: historyLoading } = useWeeklyHistory();
  ...
  }, [snapshots, hoursData, aiData, window]);
```

Note: The JSDoc comment above `useOverviewData` referencing `backfillSnapshots` should also be removed.

### Data Flow After Change

```
_layout.tsx (mounts first, before any tab screen)
  └── useHistoryBackfill()  ← fire-and-forget
        ├── t+0s: hook starts (hasRun set to true)
        └── t+25s: fetches work diaries, writes to AsyncStorage weekly_history_v2

overview.tsx (mounts when user navigates to Overview tab)
  └── useOverviewData(window)
        └── useWeeklyHistory()
              └── reads weekly_history_v2 from AsyncStorage
                    └── if backfill has completed: includes backfilled AI%
                    └── if backfill pending: shows available data, updates on next render
```

### Edge Cases

1. **`_layout.tsx` mounts before credentials are loaded**: `useHistoryBackfill` checks `config?.assignmentId` inside its `useEffect`. If config is not yet loaded at t+25s, the hook exits early without running backfill. This is pre-existing behavior, unchanged by relocation.

2. **React strict mode double-mount of `_layout.tsx`**: The `hasRun` ref inside `useHistoryBackfill` is per-instance. In strict mode, React unmounts and remounts components once in development. Since `hasRun` lives in a `useRef`, it resets on remount — backfill would run again. This is acceptable: in production (no strict mode), remounts are rare and intentional. The 25s delay ensures the second run (if it happens) still starts after animations settle.

3. **User visits Overview before backfill completes (t < 25s)**: `useWeeklyHistory` reads whatever is currently in AsyncStorage. The overview shows available history; when backfill finishes and writes AsyncStorage, the Overview tab sees the update on next render (e.g., when user pulls to refresh or re-navigates). The perceptible delay is zero because backfill takes 25+ seconds.

4. **`useOverviewData` called with extra argument at existing call sites**: After the signature change, any call `useOverviewData(window, backfillSnapshots)` would be a TypeScript compile error, ensuring no stale callers remain. This is a wanted type-check gate.

### Test File Location

Tests for FR1/FR2 are source-level checks (static analysis of file content). Tests for FR3 are in `hourglassws/src/hooks/__tests__/useOverviewData.test.ts` (existing file — must continue to pass).

New test file: `hourglassws/src/hooks/__tests__/useHistoryBackfillRelocation.test.ts`

This file will contain source-level checks:
- `_layout.tsx` imports and calls `useHistoryBackfill`
- `overview.tsx` does NOT import or call `useHistoryBackfill`
- `useOverviewData` signature has no `backfillSnapshots` parameter
- `useOverviewData` body has no `backfillSnapshots` reference
