# Implementation Checklist

Spec: `06-overview-history`
Feature: `chart-interactions`

---

## Phase 1.0: Test Foundation

### FR1: WeeklySnapshot type and weeklyHistory.ts pure functions

- [x] Write test: `mergeWeeklySnapshot` — new weekStart appended to empty history with defaults for missing fields
- [x] Write test: `mergeWeeklySnapshot` — new weekStart appended to non-empty history
- [x] Write test: `mergeWeeklySnapshot` — existing weekStart merges only provided fields (other fields unchanged)
- [x] Write test: `mergeWeeklySnapshot` — existing weekStart second write wins for written fields
- [x] Write test: `mergeWeeklySnapshot` — history trimmed to 12 when 13 entries exist (oldest removed)
- [x] Write test: `mergeWeeklySnapshot` — result sorted ascending by weekStart
- [x] Write test: `mergeWeeklySnapshot` — does not mutate input array
- [x] Write test: `loadWeeklyHistory` — save then load returns same data
- [x] Write test: `loadWeeklyHistory` — empty AsyncStorage returns `[]`
- [x] Write test: `loadWeeklyHistory` — corrupted AsyncStorage value returns `[]` gracefully
- [x] Write test: `loadWeeklyHistory` — non-array JSON value returns `[]`
- [x] Write test: `saveWeeklyHistory` — writes and is readable via load
- [x] Write test: `WEEKLY_HISTORY_KEY` and `WEEKLY_HISTORY_MAX` are exported with correct values

### FR2: useWeeklyHistory hook

- [x] Write test: returns `{ snapshots: [], isLoading: true }` on first render (before AsyncStorage resolves)
- [x] Write test: returns `isLoading: false` and populated `snapshots` after AsyncStorage resolves
- [x] Write test: returns `{ snapshots: [], isLoading: false }` on first-ever launch (no persisted data)
- [x] Write test: returns `{ snapshots: [], isLoading: false }` if AsyncStorage throws (silent failure)

### FR3: useEarningsHistory writes weekly_history_v2

- [x] Write test: after successful payment fetch, `weekly_history_v2` is written with `{ weekStart, earnings, hours }` for each week
- [x] Write test: failure to write `weekly_history_v2` does not affect `trend` return value
- [x] Write test: existing `earnings_history_v1` write is unchanged

### FR4: useAIData flushes AI snapshot on Monday

- [x] Write test: on Monday with `taggedSlots > 0`, `weekly_history_v2` written with `{ weekStart: prevWeekStart, aiPct, brainliftHours }`
- [x] Write test: `prevWeekStart` is correctly the Monday 7 days before current Monday
- [x] Write test: on non-Monday, no flush to `weekly_history_v2`
- [x] Write test: on Monday with `taggedSlots === 0`, no flush to `weekly_history_v2`
- [x] Write test: flush failure is silent (does not affect `data` return value)

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [x] Run `red-phase-test-validator` agent
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Mocks return realistic data matching interface contracts
- [x] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: WeeklySnapshot type and weeklyHistory.ts pure functions

- [x] Create `hourglassws/src/lib/weeklyHistory.ts`
- [x] Define and export `WeeklySnapshot` interface with fields: `weekStart`, `hours`, `earnings`, `aiPct`, `brainliftHours`
- [x] Export `WEEKLY_HISTORY_KEY = 'weekly_history_v2'` and `WEEKLY_HISTORY_MAX = 12`
- [x] Implement `mergeWeeklySnapshot(history, partial)` per algorithm in spec
- [x] Implement `loadWeeklyHistory()` — reads AsyncStorage, returns `[]` on any error
- [x] Implement `saveWeeklyHistory(snapshots)` — writes to AsyncStorage, propagates errors
- [x] Confirm `Payment` type has `paidHours` field; add it if missing

### FR2: useWeeklyHistory hook

- [x] Create `hourglassws/src/hooks/useWeeklyHistory.ts`
- [x] Initialize state: `snapshots: []`, `isLoading: true`
- [x] On mount, call `loadWeeklyHistory()`, set `snapshots` and `isLoading: false`
- [x] Catch AsyncStorage errors: set `snapshots: []`, `isLoading: false`
- [x] Return `{ snapshots, isLoading }`

### FR3: Extend useEarningsHistory to write weekly_history_v2

- [x] Modify `hourglassws/src/hooks/useEarningsHistory.ts`
- [x] In the `useEffect` that processes `payments`, also build `hoursMap` keyed by `periodStartDate`
- [x] After saving `earnings_history_v1`, load `weekly_history_v2`, merge weeks, save
- [x] Wrap `weekly_history_v2` write in try/catch (silent failure)

### FR4: Extend useAIData to flush AI snapshot on Monday

- [x] Modify `hourglassws/src/hooks/useAIData.ts`
- [x] In the `isMonday && freshData.taggedSlots > 0` block, compute `prevWeekStart` (currentMonday - 7 days)
- [x] Load `weekly_history_v2`, call `mergeWeeklySnapshot` with AI snapshot, save
- [x] Wrap in try/catch (silent failure)

---

## Phase 1.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [x] Run `spec-implementation-alignment` agent
- [x] All FR success criteria verified in code
- [x] Interface contracts match implementation
- [x] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [x] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [x] Fix HIGH severity issues (critical)
- [x] Fix MEDIUM severity issues (or document why deferred)
- [x] Re-run tests after fixes
- [x] Commit fixes: `fix(06-overview-history): {description}`

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on modified tests
- [x] Apply suggested improvements that strengthen confidence
- [x] Re-run tests to confirm passing
- [x] Commit if changes made: `fix(06-overview-history): strengthen test assertions`

### Final Verification
- [x] All tests passing
- [x] No regressions in existing tests
- [x] Code follows existing patterns (`useEarningsHistory` / `useAIData` patterns)

---

## Session Notes

**2026-03-15**: Spec and checklist created. Ready for implementation.

**2026-03-15**: Implementation complete.
- Phase 1.0: 2 test commits (FR1-FR4 tests, 58 tests total)
- Phase 1.1: 4 implementation commits (feat(FR1), feat(FR2), feat(FR3), feat(FR4))
- Phase 1.2: Review passed — no issues found, no fix commits needed
- All 58 new tests passing. No regressions in previously passing tests.
- Payment.paidHours field confirmed already present in src/lib/payments.ts.
