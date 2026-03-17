# Implementation Checklist

Spec: `03-backfill-relocation`
Feature: `ai-tab-rebuild`

---

## Phase 1.0: Test Foundation

### FR1: Add `useHistoryBackfill` to `_layout.tsx`
- [x] Write source-level test: `_layout.tsx` imports `useHistoryBackfill` from `@/src/hooks/useHistoryBackfill`
- [x] Write source-level test: `_layout.tsx` calls `useHistoryBackfill()` in `TabLayout` body (without assignment)
- [x] Write source-level test: the call appears before the `return` statement

### FR2: Remove `useHistoryBackfill` from `overview.tsx`
- [x] Write source-level test: `overview.tsx` does NOT import `useHistoryBackfill`
- [x] Write source-level test: `overview.tsx` does NOT call `useHistoryBackfill()`
- [x] Write source-level test: `overview.tsx` calls `useOverviewData` with one argument (no `backfillSnapshots`)
- [x] Write source-level test: `backfillSnapshots` variable is not declared or referenced in `overview.tsx`

### FR3: Remove `backfillSnapshots` parameter from `useOverviewData`
- [x] Write source-level test: `useOverviewData` function signature has no `backfillSnapshots` parameter
- [x] Write source-level test: `useOverviewData` body has no `backfillSnapshots` identifier
- [x] Write source-level test: `useOverviewData` body has no `?? storedSnapshots` conditional (the backfill fallback)
- [x] Write source-level test: `useMemo` dependency array does not include `backfillSnapshots`
- [x] Confirm existing `useOverviewData.test.ts` tests are included in the run (no changes needed to that file)

All source-level tests go in: `hourglassws/src/hooks/__tests__/useHistoryBackfillRelocation.test.ts`

---

## Test Design Validation (MANDATORY)

- [x] Run `red-phase-test-validator` agent
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (source-level regex/string checks, not just "file exists")
- [x] Test file location is correct (`src/hooks/__tests__/useHistoryBackfillRelocation.test.ts`)
- [x] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Add `useHistoryBackfill` to `_layout.tsx`
- [x] Add import: `import { useHistoryBackfill } from '@/src/hooks/useHistoryBackfill';`
- [x] Add call in `TabLayout` body before `return`: `useHistoryBackfill();`
- [x] Verify no TypeScript errors in `_layout.tsx`

### FR2: Remove `useHistoryBackfill` from `overview.tsx`
- [x] Remove import: `import { useHistoryBackfill } from '@/src/hooks/useHistoryBackfill';`
- [x] Remove declaration: `const backfillSnapshots = useHistoryBackfill();`
- [x] Update call site: `useOverviewData(window, backfillSnapshots)` → `useOverviewData(window)`
- [x] Verify no `backfillSnapshots` references remain in `overview.tsx`
- [x] Verify no TypeScript errors in `overview.tsx`

### FR3: Remove `backfillSnapshots` parameter from `useOverviewData`
- [x] Remove `backfillSnapshots?: WeeklySnapshot[] | null` from function signature
- [x] Remove `const snapshots = backfillSnapshots ?? storedSnapshots;` line
- [x] Rename destructured `storedSnapshots` to `snapshots` in `useWeeklyHistory()` destructure
- [x] Remove `backfillSnapshots` from `useMemo` dependency array
- [x] Remove JSDoc comment referencing `backfillSnapshots` parameter
- [x] Verify no TypeScript errors in `useOverviewData.ts`
- [x] Run existing `useOverviewData.test.ts` — all tests must pass

---

## Phase 1.2: Review (MANDATORY)

### Step 0: Spec-Implementation Alignment
- [x] Run `spec-implementation-alignment` agent
- [x] All FR success criteria verified in code
- [x] Interface contracts match implementation
- [x] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [x] Run `pr-review-toolkit:review-pr` skill (launched inline 6-dimension review — skill unavailable)

### Step 2: Address Feedback
- [x] Fix HIGH severity issues (critical) — none found
- [x] Fix MEDIUM severity issues (or document why deferred) — none found
- [x] Re-run tests after fixes
- [x] Commit fixes: N/A — no issues found

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on `useHistoryBackfillRelocation.test.ts`
- [x] Apply suggested improvements that strengthen confidence — no changes needed
- [x] Re-run tests to confirm passing
- [x] Commit if changes made: N/A

### Final Verification
- [x] All tests passing (new + existing `useOverviewData.test.ts`)
- [x] No regressions in existing tests
- [x] TypeScript compiles without errors in modified files

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-16**: Spec created. 3 FRs, all call-site changes. No hook internals modified.
**2026-03-16**: Implementation complete.
- Phase 1.0: 1 test commit (13 tests, 12 red / 1 already-passing SC3.4)
- Phase 1.1: 1 implementation commit (3 files: _layout.tsx, overview.tsx, useOverviewData.ts)
- Phase 1.2: Review passed, 0 fix commits. All 46 tests passing (13 new + 33 existing).
