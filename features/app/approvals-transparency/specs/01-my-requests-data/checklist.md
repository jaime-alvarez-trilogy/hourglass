# Implementation Checklist

Spec: `01-my-requests-data`
Feature: `approvals-transparency`

---

## Phase 1.0: Test Foundation

### FR1: Types for Manual Request Data
- [x] Write tests verifying `ManualRequestEntry.id` format is `"{date}|{memo}"`
- [x] Write tests verifying `ManualRequestStatus` union type (`PENDING | APPROVED | REJECTED`)
- [x] Write tests verifying `UseMyRequestsResult.error` is constrained to `'auth' | 'network' | null`
- [x] Write type-level tests (compile-time assertions) that TypeScript accepts valid shapes and rejects invalid ones

### FR2: `extractRejectionReason` Utility
- [x] Write test: action with `REJECT_MANUAL_TIME` and non-empty comment → returns comment string
- [x] Write test: no rejection action present → returns `null`
- [x] Write test: empty actions array → returns `null`
- [x] Write test: rejection action with empty string comment → returns `null`
- [x] Write test: multiple actions, only one is rejection → returns rejection comment
- [x] Write test: does not throw for any valid input

### FR3: `groupSlotsIntoEntries` Utility
- [x] Write test: two slots with same memo → one entry with `durationMinutes: 20`
- [x] Write test: three slots with three distinct memos → three entries returned
- [x] Write test: empty slots array → returns `[]`
- [x] Write test: all slots have `autoTracker: true` → returns `[]`
- [x] Write test: slot with `undefined` memo → normalized to `""`, no throw
- [x] Write test: single slot → one entry with `durationMinutes: 10`
- [x] Write test: group with APPROVED + REJECTED slots → entry status is `REJECTED`
- [x] Write test: group with APPROVED + PENDING slots → entry status is `PENDING`
- [x] Write test: entry `id` is `"{date}|{memo}"` composite key

### FR4: `useMyRequests` Hook
- [x] Write test: returns entries sorted by date descending
- [x] Write test: fetches exactly Mon–today date range
- [x] Write test: today is Monday → fetches only 1 day
- [x] Write test: missing `assignmentId` → returns empty entries, no error
- [x] Write test: auth failure (401) → `error: 'auth'`
- [x] Write test: network failure → `error: 'network'`
- [x] Write test: one day fetch fails, others succeed → available days returned, no error thrown
- [x] Write test: no manual entries this week → `entries: []`, `error: null`
- [x] Write test: `refetch` function is callable and triggers re-query

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [x] Run `red-phase-test-validator` agent — performed manual validation
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Mocks return realistic data matching interface contracts
- [x] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Types for Manual Request Data
- [x] Create `src/types/requests.ts`
- [x] Export `ManualRequestStatus` type union
- [x] Export `ManualRequestEntry` interface with all fields
- [x] Export `UseMyRequestsResult` interface with constrained `error` type
- [x] Verify TypeScript compiles without errors

### FR2: `extractRejectionReason` Utility
- [x] Create `src/lib/requestsUtils.ts`
- [x] Implement `extractRejectionReason(actions: SlotAction[]): string | null`
- [x] Import `SlotAction` from `src/types/api.ts`
- [x] Handle empty array, missing action, and empty comment cases

### FR3: `groupSlotsIntoEntries` Utility
- [x] Implement `groupSlotsIntoEntries(slots: WorkDiarySlot[], date: string): ManualRequestEntry[]` in `src/lib/requestsUtils.ts`
- [x] Filter `autoTracker === false` slots
- [x] Group by memo (normalize `undefined` → `""`)
- [x] Compute worst-case status: REJECTED > PENDING > APPROVED
- [x] Call `extractRejectionReason` for REJECTED entries
- [x] Generate composite `id` as `"{date}|{memo}"`

### FR4: `useMyRequests` Hook
- [x] Create `src/hooks/useMyRequests.ts`
- [x] Call `loadConfig()` for `assignmentId`, credentials, `useQA`
- [x] Guard early return when `assignmentId` is missing
- [x] Use `getWeekStartDate()` and build Mon–today date array
- [x] Call `fetchWorkDiary` per date via `Promise.allSettled`
- [x] Apply `groupSlotsIntoEntries` to each fulfilled result
- [x] Flatten, sort by date descending
- [x] Map 401/403 errors to `'auth'`, network errors to `'network'`
- [x] Configure TanStack Query: `queryKey: ['myRequests', assignmentId]`, `staleTime: 60_000`, `enabled: !!assignmentId`
- [x] Export `useMyRequests` from hook file

---

## Phase 1.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [x] Run `spec-implementation-alignment` agent — performed manual alignment check
- [x] All FR success criteria verified in code
- [x] Interface contracts match implementation
- [x] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [x] Manual PR review performed (review toolkit unavailable)

### Step 2: Address Feedback
- [x] Fix HIGH severity issues (critical)
- [x] Fix MEDIUM severity issues (or document why deferred)
- [x] Re-run tests after fixes
- [x] Commit fixes: `fix(01-my-requests-data): map all-day-fail to network error, remove unused import`

### Step 3: Test Quality Optimization
- [x] Manual test review performed
- [x] Tests are specific with exact value assertions
- [x] All 48 tests passing

### Final Verification
- [x] All tests passing (48/48)
- [x] No regressions in existing tests (pre-existing failures confirmed pre-exist)
- [x] Code follows existing patterns (TanStack Query + loadConfig/loadCredentials like useApprovalItems)

---

## Session Notes

**2026-03-15**: Spec created. Research complete — no open questions. 4 FRs defined: types (FR1), extractRejectionReason (FR2), groupSlotsIntoEntries (FR3), useMyRequests hook (FR4). FR2 and FR3 are independent (Wave 1); FR4 depends on FR2+FR3 (Wave 2).

**2026-03-15**: Spec execution complete.
- Phase 1.0: 2 test commits (requestsUtils: 23 tests, useMyRequests: 25 tests)
- Phase 1.1: 2 implementation commits (FR1+FR2+FR3 in types+utils, FR4 hook)
- Phase 1.2: Review complete, 1 fix commit (error handling improvement)
- All 48 tests passing. No regressions introduced.
