# Implementation Checklist

Spec: `03-backfill-relocation`
Feature: `ai-tab-rebuild`

---

## Phase 1.0: Test Foundation

### FR1: Add `useHistoryBackfill` to `_layout.tsx`
- [ ] Write source-level test: `_layout.tsx` imports `useHistoryBackfill` from `@/src/hooks/useHistoryBackfill`
- [ ] Write source-level test: `_layout.tsx` calls `useHistoryBackfill()` in `TabLayout` body (without assignment)
- [ ] Write source-level test: the call appears before the `return` statement

### FR2: Remove `useHistoryBackfill` from `overview.tsx`
- [ ] Write source-level test: `overview.tsx` does NOT import `useHistoryBackfill`
- [ ] Write source-level test: `overview.tsx` does NOT call `useHistoryBackfill()`
- [ ] Write source-level test: `overview.tsx` calls `useOverviewData` with one argument (no `backfillSnapshots`)
- [ ] Write source-level test: `backfillSnapshots` variable is not declared or referenced in `overview.tsx`

### FR3: Remove `backfillSnapshots` parameter from `useOverviewData`
- [ ] Write source-level test: `useOverviewData` function signature has no `backfillSnapshots` parameter
- [ ] Write source-level test: `useOverviewData` body has no `backfillSnapshots` identifier
- [ ] Write source-level test: `useOverviewData` body has no `?? storedSnapshots` conditional (the backfill fallback)
- [ ] Write source-level test: `useMemo` dependency array does not include `backfillSnapshots`
- [ ] Confirm existing `useOverviewData.test.ts` tests are included in the run (no changes needed to that file)

All source-level tests go in: `hourglassws/src/hooks/__tests__/useHistoryBackfillRelocation.test.ts`

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (source-level regex/string checks, not just "file exists")
- [ ] Test file location is correct (`src/hooks/__tests__/useHistoryBackfillRelocation.test.ts`)
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Add `useHistoryBackfill` to `_layout.tsx`
- [ ] Add import: `import { useHistoryBackfill } from '@/src/hooks/useHistoryBackfill';`
- [ ] Add call in `TabLayout` body before `return`: `useHistoryBackfill();`
- [ ] Verify no TypeScript errors in `_layout.tsx`

### FR2: Remove `useHistoryBackfill` from `overview.tsx`
- [ ] Remove import: `import { useHistoryBackfill } from '@/src/hooks/useHistoryBackfill';`
- [ ] Remove declaration: `const backfillSnapshots = useHistoryBackfill();`
- [ ] Update call site: `useOverviewData(window, backfillSnapshots)` → `useOverviewData(window)`
- [ ] Verify no `backfillSnapshots` references remain in `overview.tsx`
- [ ] Verify no TypeScript errors in `overview.tsx`

### FR3: Remove `backfillSnapshots` parameter from `useOverviewData`
- [ ] Remove `backfillSnapshots?: WeeklySnapshot[] | null` from function signature
- [ ] Remove `const snapshots = backfillSnapshots ?? storedSnapshots;` line
- [ ] Rename destructured `storedSnapshots` to `snapshots` in `useWeeklyHistory()` destructure
- [ ] Remove `backfillSnapshots` from `useMemo` dependency array
- [ ] Remove JSDoc comment referencing `backfillSnapshots` parameter
- [ ] Verify no TypeScript errors in `useOverviewData.ts`
- [ ] Run existing `useOverviewData.test.ts` — all tests must pass

---

## Phase 1.2: Review (MANDATORY)

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation
- [ ] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(03-backfill-relocation): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on `useHistoryBackfillRelocation.test.ts`
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(03-backfill-relocation): strengthen test assertions`

### Final Verification
- [ ] All tests passing (new + existing `useOverviewData.test.ts`)
- [ ] No regressions in existing tests
- [ ] TypeScript compiles without errors in modified files

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-16**: Spec created. 3 FRs, all call-site changes. No hook internals modified.
