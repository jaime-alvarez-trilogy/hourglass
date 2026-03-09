# Implementation Checklist

Spec: `04-ai-brainlift`
Feature: `hourglass-expo`

---

## Phase 4.0: Tests

### FR1: WorkDiarySlot Type
- [ ] Write test: `WorkDiarySlot` is exported from `src/types/api.ts` (compile-time, verified via tsc)
- [ ] Write test: `tags` is `string[]` — slot with non-string tag causes type error
- [ ] Write test: `status` union rejects `'UNKNOWN'` at compile time

### FR3: countDiaryTags
- [ ] Write test: given 4 mixed slots (ai_usage, second_brain, empty, both) → `total=4, aiUsage=3, secondBrain=2, noTags=1`
- [ ] Write test: slot with only `ai_usage` → `aiUsage=1, secondBrain=0`
- [ ] Write test: slot with only `second_brain` → `aiUsage=1, secondBrain=1`
- [ ] Write test: slot with BOTH `ai_usage` AND `second_brain` → counted once in `aiUsage`
- [ ] Write test: slot with `tags: ['not_second_brain']` → `aiUsage=0, secondBrain=0, noTags=0`
- [ ] Write test: slot with `tags: ['AI_USAGE']` (uppercase) → `aiUsage=0` (case-sensitive)
- [ ] Write test: slot with `tags: []` → `noTags=1`
- [ ] Write test: empty slots array → all fields zero

### FR4: aggregateAICache
- [ ] Write test: only processes Mon–today; pre-Monday date excluded from aggregation
- [ ] Write test: future date (tomorrow) excluded from aggregation
- [ ] Write test: `taggedSlots = totalSlots - totalNoTags` (not totalSlots)
- [ ] Write test: `brainliftHours` for 30 second_brain slots = `5.0`
- [ ] Write test: `aiPctLow` clamped at 0 when raw value would be negative
- [ ] Write test: `aiPctHigh` clamped at 100 when raw value would exceed 100
- [ ] Write test: empty cache → `{ aiPctLow:0, aiPctHigh:0, brainliftHours:0, totalSlots:0, taggedSlots:0, workdaysElapsed:0, dailyBreakdown:[] }`
- [ ] Write test: `taggedSlots === 0` → no division by zero (aiPct = 0)
- [ ] Write test: `workdaysElapsed` counts only days with `total > 0`
- [ ] Write test: `isToday` is `true` only for today's `DailyTagData` entry
- [ ] Write test: AI% formula: 24 aiUsage / 27 taggedSlots ≈ 88.9% → `aiPctLow=87, aiPctHigh=91`

### FR5: shouldRefetchDay
- [ ] Write test: returns `true` when `cached === undefined`
- [ ] Write test: returns `true` when `cached.total === 0`
- [ ] Write test: returns `true` when `isToday === true`, regardless of cached value
- [ ] Write test: returns `false` when `isToday === false` and `cached.total > 0`
- [ ] Write test: does not throw on `undefined` cached argument

### FR6: fetchWorkDiary
- [ ] Write test: calls `getAuthToken` then `apiGet` with correct path `/api/timetracking/workdiaries`
- [ ] Write test: passes `assignmentId` param (NOT userId)
- [ ] Write test: passes `date` as-is (YYYY-MM-DD format)
- [ ] Write test: returns typed `WorkDiarySlot[]` from mock response
- [ ] Write test: `AuthError` from `getAuthToken` propagates to caller
- [ ] Write test: `AuthError` from `apiGet` propagates to caller

### FR7: AI Cache — AsyncStorage
- [ ] Write test: cache key is exactly `'ai_cache'`
- [ ] Write test: `_lastFetchedAt` is updated after successful fetch batch
- [ ] Write test: entries outside Mon–Sun window are pruned on load
- [ ] Write test: entries inside Mon–Sun window are preserved on prune
- [ ] Write test: cache survives serialize/deserialize round-trip (deep equal)

### FR8: useAIData Hook
- [ ] Write test: returns `{ data: null }` when config is null
- [ ] Write test: `data` is populated from AsyncStorage cache before API calls complete
- [ ] Write test: `error` is `'auth'` when `fetchWorkDiary` throws `AuthError`
- [ ] Write test: `error` is `'network'` when `fetchWorkDiary` throws `NetworkError`
- [ ] Write test: `refetch()` triggers a fresh data load
- [ ] Write test: `lastFetchedAt` reflects `cache._lastFetchedAt`

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 4.1: Implementation

### FR1: WorkDiarySlot Type
- [ ] Add `WorkDiarySlot` interface to `src/types/api.ts`
- [ ] Remove the empty `export {}` stub
- [ ] Verify `tsc --noEmit` passes after addition

### FR2: TagData and AI Types
- [ ] Add `TagData`, `AIWeekData`, `DailyTagData` interfaces to `src/lib/ai.ts`
- [ ] Verify TypeScript rejects `string` assigned to `TagData.total`

### FR3: countDiaryTags
- [ ] Create `src/lib/ai.ts`
- [ ] Implement `countDiaryTags(slots: WorkDiarySlot[]): TagData`
- [ ] Use `tags.includes('second_brain')` (NOT substring match)
- [ ] Union logic: `tags.includes('ai_usage') || tags.includes('second_brain')` for aiUsage
- [ ] Run FR3 tests → all pass

### FR4: aggregateAICache
- [ ] Implement `getMondayOfWeek(today: string): string` helper (local timezone, not UTC)
- [ ] Implement `aggregateAICache(cache: Record<string, TagData>, today: string): AIWeekData`
- [ ] Apply AI% formula with `Math.max(0, ...)` and `Math.min(100, ...)` clamping
- [ ] Build `dailyBreakdown` array with `isToday` computed
- [ ] Run FR4 tests → all pass

### FR5: shouldRefetchDay
- [ ] Implement `shouldRefetchDay(date: string, cached: TagData | undefined, isToday: boolean): boolean`
- [ ] Run FR5 tests → all pass

### FR6: fetchWorkDiary
- [ ] Create `src/api/workDiary.ts`
- [ ] Import `getAuthToken`, `apiGet` from `../api/client`
- [ ] Import `Credentials` from `../types/config`
- [ ] Import `WorkDiarySlot` from `../types/api`
- [ ] Implement `fetchWorkDiary` — no try/catch (errors propagate)
- [ ] Run FR6 tests → all pass

### FR7 + FR8: useAIData Hook
- [ ] Create `src/hooks/useAIData.ts`
- [ ] Implement `pruneToCurrentWeek(raw, today)` helper
- [ ] Load cache from AsyncStorage on mount
- [ ] Immediate `aggregateAICache` call for instant display
- [ ] `shouldRefetchDay` evaluation for each Mon–today
- [ ] `Promise.all` parallel fetches for stale days
- [ ] Merge and save updated cache
- [ ] Error handling: `AuthError` → `error='auth'`, `NetworkError` → `error='network'`
- [ ] `refetch()` implementation
- [ ] Guard: return safe default when `config === null`
- [ ] Run FR7+FR8 tests → all pass

### FR9: AI Screen
- [ ] Create `src/components/AIProgressBar.tsx` — progress bar with optional target line
- [ ] Create `src/components/DailyAIRow.tsx` — daily breakdown row component
- [ ] Create `app/(tabs)/ai.tsx`
- [ ] AI% card with `{aiPctLow}%–{aiPctHigh}%` and progress bar
- [ ] BrainLift card with `{brainliftHours.toFixed(1)}h / 5h` and progress bar
- [ ] Daily breakdown ScrollView with Mon–today rows
- [ ] Legend section
- [ ] Pull-to-refresh (`RefreshControl` calling `refetch()`)
- [ ] Empty state when `data === null`
- [ ] Auth error state with re-login prompt
- [ ] Network error state with retry message

### FR10: Tab Registration
- [ ] Modify `app/(tabs)/_layout.tsx` — add AI tab with icon and label
- [ ] Verify existing tabs (index, explore) still render correctly
- [ ] Verify no TypeScript errors in `_layout.tsx`

### Integration Verification
- [ ] Run full test suite: `npx jest` — all tests pass (no regressions)
- [ ] Run `tsc --noEmit` — zero TypeScript errors
- [ ] Run `npx expo start` and verify AI tab navigates and renders

---

## Phase 4.2: Review (MANDATORY)

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation
- [ ] Fix any HIGH issues before proceeding

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(04-ai-brainlift): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(04-ai-brainlift): strengthen test assertions`

### Step 4: Simulator Smoke Test
- [ ] Run `npx expo start` and launch on iOS Simulator
- [ ] Navigate to AI tab — renders without crash
- [ ] Pull-to-refresh triggers data load
- [ ] AI% and BrainLift cards display (even if showing 0% / 0h without real credentials)

### Final Verification
- [ ] All tests passing (`npx jest`)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No regressions in existing tests (01-foundation, 02-auth-onboarding)

---

## Session Notes

**2026-03-08**: Spec created. 10 FRs covering API layer, business logic (3 pure functions), cache hook, 2 components, screen, and tab registration. Business logic (FR3–FR5) has no React dependencies — fully unit testable with pure Jest. Hook (FR8) uses existing AsyncStorage mock.
