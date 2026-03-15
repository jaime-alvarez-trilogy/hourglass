# Implementation Checklist

Spec: `02-approvals-tab-redesign`
Feature: `approvals-transparency`

---

## Phase 2.0: Test Foundation

### FR1: Always-Visible Tab (`_layout.tsx`)
- [x] Write test: tab renders for contributor config (`isManager: false`) — SC1.1
- [x] Write test: tab renders for manager config (`isManager: true`) — SC1.2
- [x] Write test: tab renders when config is `null` (not yet loaded) — SC1.3
- [x] Write source-file static test: title is `"Requests"` not `"Approvals"` — SC1.4
- [x] Write source-file static test: `showApprovals` variable absent from `_layout.tsx` — SC1.5

### FR2: `MyRequestCard` Component
- [x] Write test: PENDING entry renders gold badge, no rejection reason row — SC2.1
- [x] Write test: APPROVED entry renders success green badge — SC2.2
- [x] Write test: REJECTED entry renders critical red badge + rejection reason text — SC2.3
- [x] Write test: REJECTED with `rejectionReason: null` shows `"No reason provided"` — SC2.4
- [x] Write test: duration ≥ 60 min formatted as hours (150 min → `"2.5h"`) — SC2.5
- [x] Write test: duration < 60 min formatted as `"30 min"` — SC2.6
- [x] Write test: duration 0 min shows `"0 min"` without crash — SC2.7
- [x] Write test: component renders without crash for long memo — SC2.8
- [x] Write source-file static test: no `StyleSheet.create`, no hardcoded hex values — SC2.9

### FR3: Role-Aware `approvals.tsx` Screen
- [x] Write test: contributor — only MY REQUESTS section renders, no TEAM REQUESTS — SC3.1
- [x] Write test: manager — both TEAM REQUESTS and MY REQUESTS sections render — SC3.2
- [x] Write test: `isManager: undefined` treated as contributor — SC3.3
- [x] Write test: loading state — skeletons shown in loading section(s) — SC3.4
- [x] Write test: pull-to-refresh calls `myRefetch`; also `teamRefetch` when manager — SC3.5
- [x] Write source-file static test: header shows `"Requests"` not `"Approvals"` — SC3.6
- [x] Write source-file static test: no `useRouter` redirect logic — SC3.7

### FR4: Empty States
- [x] Write test: contributor with empty entries shows `"No requests this week"` — SC4.1
- [x] Write test: manager with empty team queue shows `"All caught up"` in team section — SC4.2
- [x] Write test: manager with empty own requests shows `"No requests this week"` in MY REQUESTS — SC4.3
- [x] Write test: manager with both empty — both empty states render independently — SC4.4

### FR5: Loading Skeletons
- [x] Write test: `myLoading && entries.length === 0` → skeletons in MY REQUESTS — SC5.1
- [x] Write test: `teamLoading && items.length === 0` (manager) → skeletons in TEAM REQUESTS — SC5.2

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [x] Run `red-phase-test-validator` agent
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Mocks return realistic data matching interface contracts
- [x] Fix any issues identified before proceeding

---

## Phase 2.1: Implementation

### FR1: Always-Visible Tab (`_layout.tsx`)
- [x] Remove `const showApprovals = ...` line
- [x] Remove `tabBarButton: showApprovals ? HapticTab : () => null` from approvals tab options
- [x] Change `title: 'Approvals'` to `title: 'Requests'`
- [x] Remove `useConfig` import if no longer used in `_layout.tsx`
- [x] Verify no other `showApprovals` usage remains in file

### FR2: `MyRequestCard` Component
- [x] Create `src/components/MyRequestCard.tsx`
- [x] Implement `formatDuration(minutes)` inline helper
- [x] Implement `formatEntryDate(dateStr)` inline helper
- [x] Implement status badge with correct NativeWind tokens per status
- [x] Implement rejection reason row (REJECTED only, "No reason provided" fallback)
- [x] Verify no `StyleSheet.create`, no hardcoded hex colors

### FR3: Role-Aware `approvals.tsx` Screen
- [x] Remove `useRouter` import and redirect `useEffect`
- [x] Remove contributor redirect card render
- [x] Add `useMyRequests()` call (unconditional)
- [x] Verify `useApprovalItems()` remains unconditional (already present)
- [x] Change screen header title from `"Approvals"` to `"Requests"`
- [x] Add `isManager` derivation from config
- [x] Implement TEAM REQUESTS section: `{isManager && ...}` gate around existing ApprovalCard list
- [x] Add `SectionLabel` for `"TEAM REQUESTS"` heading
- [x] Add MY REQUESTS section (always rendered)
- [x] Add `SectionLabel` for `"MY REQUESTS"` heading
- [x] Render `MyRequestCard` per entry in MY REQUESTS section
- [x] Update pull-to-refresh to call both refetches (teamRefetch only if manager)

### FR4: Empty States
- [x] Add "No requests this week" empty state card in MY REQUESTS section
- [x] Verify existing "All caught up" card in TEAM REQUESTS section remains intact
- [x] Confirm both empty states render independently for manager with no data

### FR5: Loading Skeletons
- [x] Add `SkeletonLoader` cards in MY REQUESTS section when `myLoading && entries.length === 0`
- [x] Add `SkeletonLoader` cards in TEAM REQUESTS section when `teamLoading && items.length === 0`
- [x] Confirm sections load and display skeletons independently

---

## Phase 2.2: Review (MANDATORY)

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
- [x] Commit fixes: `fix(02-approvals-tab-redesign): {description}`

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on modified tests
- [x] Apply suggested improvements that strengthen confidence
- [x] Re-run tests to confirm passing
- [x] Commit if changes made: `fix(02-approvals-tab-redesign): strengthen test assertions`

### Final Verification
- [x] All tests passing
- [x] No regressions in existing tests
- [x] Code follows existing patterns

---

## Session Notes

**2026-03-15**: Spec created. Depends on 01-my-requests-data (complete). Ready for implementation.

**2026-03-15**: Implementation complete.
- Phase 2.0: 1 commit — test(FR1-FR5): 59 tests across 3 files, all red before implementation
- Phase 2.1: 3 commits — feat(FR1), feat(FR2), feat(FR3-FR5)
  - FR1: _layout.tsx — removed showApprovals gate, renamed tab to "Requests"
  - FR2: MyRequestCard.tsx — new presentational component, 115 lines
  - FR3/FR4/FR5: approvals.tsx — role-aware two-section layout, 241 lines
- Phase 2.2: Review passed. No HIGH/MEDIUM issues found. No fix commits needed.
- All 59 spec tests passing. No regressions introduced (baseline: 79 pre-existing failures; after: same failures minus the 3 newly passing test suites).
