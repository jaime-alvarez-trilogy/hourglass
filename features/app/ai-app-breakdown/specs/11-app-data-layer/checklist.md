# Implementation Checklist

Spec: `11-app-data-layer`
Feature: `ai-app-breakdown`

---

## Phase 1.0: Test Foundation

### FR1: Extend WorkDiarySlot Type
- [ ] Verify `WorkDiaryEvent` interface compiles with correct field types (`processName: string`, `idle: boolean`, `activity: string`)
- [ ] Verify `WorkDiarySlot.events?: WorkDiaryEvent[]` is optional and does not break existing consumers

### FR2: extractAppBreakdown
- [ ] Test: slots with `ai_usage` tag → apps go into `aiSlots`, not `nonAiSlots`
- [ ] Test: slots with `second_brain` tag → apps go into both `aiSlots` and `brainliftSlots`
- [ ] Test: slots with no AI tag → apps go into `nonAiSlots` only
- [ ] Test: multiple unique apps in one slot → each app gets +1 independently (no double-count)
- [ ] Test: same app in AI and non-AI slots → `aiSlots` and `nonAiSlots` accumulate correctly
- [ ] Test: output sorted by `(aiSlots + nonAiSlots)` descending
- [ ] Test: empty slots array → returns `[]`
- [ ] Test: slot with no `events` field → skipped
- [ ] Test: slot with empty `events` array → skipped
- [ ] Test: event with empty/falsy `processName` → filtered out
- [ ] Test: all slots have no events → returns `[]`

### FR3: mergeAppBreakdown
- [ ] Test: matching `appName` entries → `aiSlots`, `brainliftSlots`, `nonAiSlots` all summed
- [ ] Test: new apps in `additions` not in `existing` → appended
- [ ] Test: output sorted by total slots descending
- [ ] Test: empty `existing` + non-empty `additions` → returns `additions` sorted
- [ ] Test: non-empty `existing` + empty `additions` → returns `existing` sorted
- [ ] Test: both empty → returns `[]`
- [ ] Test: input arrays not mutated

### FR4: loadAppHistory / saveAppHistory
- [ ] Test: `loadAppHistory` — missing key → returns `{}`
- [ ] Test: `loadAppHistory` — valid JSON → returns parsed object
- [ ] Test: `loadAppHistory` — invalid JSON → returns `{}`
- [ ] Test: `loadAppHistory` — AsyncStorage error → returns `{}`
- [ ] Test: `saveAppHistory` — writes JSON to `APP_HISTORY_KEY`
- [ ] Test: `saveAppHistory` — propagates AsyncStorage write errors

### FR5: useAIData Integration
- [ ] Test: after fetch, `AsyncStorage.setItem` called with `ai_app_history` key containing current week breakdown
- [ ] Test: existing week data is merged (not replaced) when key already present

### FR6: useHistoryBackfill Integration
- [ ] Test: after backfill, `ai_app_history[weekMonday]` is populated for each past week processed
- [ ] Test: write failure does not affect `weekly_history_v2` backfill result

### FR7: useAppBreakdown Hook
- [ ] Test: `isReady` is `false` before AsyncStorage resolves
- [ ] Test: `isReady` is `true` after load completes (cache populated)
- [ ] Test: `isReady` is `true` after load completes (cache empty)
- [ ] Test: `currentWeek` returns `cache[currentMonday]` when present
- [ ] Test: `currentWeek` returns `[]` when key absent
- [ ] Test: `aggregated12w` merges all weeks in cache
- [ ] Test: `aggregated12w` returns `[]` on empty cache
- [ ] Test: AsyncStorage load error → `isReady: true`, both arrays empty

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts (slot with events array, processName strings)
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Extend WorkDiarySlot Type
- [ ] Add `WorkDiaryEvent` interface to `hourglassws/src/types/api.ts`
- [ ] Add `events?: WorkDiaryEvent[]` to `WorkDiarySlot` interface

### FR2: extractAppBreakdown
- [ ] Create `hourglassws/src/lib/aiAppBreakdown.ts`
- [ ] Define `AppBreakdownEntry` interface
- [ ] Implement `extractAppBreakdown(slots)` — unique-app-per-slot logic, sorted output
- [ ] Export function and interface

### FR3: mergeAppBreakdown
- [ ] Implement `mergeAppBreakdown(existing, additions)` in `aiAppBreakdown.ts`
- [ ] Map-based merge by `appName`, sum all three fields, sorted output
- [ ] No mutation of input arrays

### FR4: AsyncStorage Helpers
- [ ] Export `APP_HISTORY_KEY = 'ai_app_history'`
- [ ] Export `AppHistoryCache` type
- [ ] Implement `loadAppHistory()` — never throws, returns `{}` on all error paths
- [ ] Implement `saveAppHistory(cache)` — propagates errors

### FR5: useAIData Integration
- [ ] Extend `Promise.all` result shape to include raw `slots` alongside `tagData`
- [ ] After the merge loop, compute weekly breakdown via `extractAppBreakdown` + `mergeAppBreakdown`
- [ ] Fire-and-forget: load, merge, save `ai_app_history[currentMonday]`
- [ ] Verify write failure path is silently caught

### FR6: useHistoryBackfill Integration
- [ ] Add parallel `slotsData: Record<string, WorkDiarySlot[]>` in the weekly loop
- [ ] Populate `slotsData[dates[i]]` for fulfilled results
- [ ] After `saveWeeklyHistory`, fire-and-forget app breakdown write for that week
- [ ] Verify write failure path is silently caught

### FR7: useAppBreakdown Hook
- [ ] Create `hourglassws/src/hooks/useAppBreakdown.ts`
- [ ] Define `AppBreakdownResult` interface
- [ ] Implement `useAppBreakdown()` — load on mount, derive `currentWeek` and `aggregated12w`
- [ ] Graceful degradation: load error → empty arrays, `isReady: true`
- [ ] Compute `currentMonday` in local timezone using `getMondayOfWeek`

---

## Phase 1.2: Review (MANDATORY)

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation (`AppBreakdownEntry`, `AppHistoryCache`, `AppBreakdownResult`)
- [ ] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(11-app-data-layer): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(11-app-data-layer): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests (`ai.test.ts`, `weeklyHistory.test.ts`, `useAIData.test.ts`, `useHistoryBackfill.test.ts`)
- [ ] TypeScript compilation clean (no new errors)
- [ ] Code follows existing patterns (`countDiaryTags` style for pure fn, `loadWeeklyHistory` style for helpers)

---

## Session Notes

<!-- Add notes as you work -->
