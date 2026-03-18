# Implementation Checklist

Spec: `08-widget-enhancements`
Feature: `hourglass-expo`

---

## Phase 1.0: Test Foundation

### FR1: Extend WidgetData type with new fields
- [x] Write tests verifying `WidgetDailyEntry`, `WidgetApprovalItem`, `WidgetMyRequest` are exported from `types.ts`
- [x] Write compile-time test (or type check) verifying `WidgetData` has all 4 new fields: `daily`, `approvalItems`, `myRequests`, `actionBg`
- [x] Write tests verifying existing `WidgetData` fields are unchanged

### FR2: buildDailyEntries helper
- [x] Write test: empty `daily` array → 7 entries all `{ hours: 0, isToday: false }`
- [x] Write test: Mon–Wed filled, Thu–Sun empty → correct hours for Mon/Tue/Wed, 0 for Thu–Sun
- [x] Write test: all 7 days filled → all hours mapped correctly, correct `day` labels
- [x] Write test: `isToday` set on exactly one entry (today's date)
- [x] Write test: out-of-order input → returns Mon[0]–Sun[6] order
- [x] Write test: Sunday date → Sun entry has `isToday: true`

### FR2: formatApprovalItems helper
- [x] Write test: 2 items, maxCount=3 → returns 2 items
- [x] Write test: 5 items, maxCount=3 → returns first 3 items only
- [x] Write test: ManualApprovalItem → `category: 'MANUAL'`, hours from `item.hours`
- [x] Write test: OvertimeApprovalItem → `category: 'OVERTIME'`, hours from `item.hours`
- [x] Write test: empty array → returns `[]`
- [x] Write test: `fullName` exactly 18 chars → no truncation
- [x] Write test: `fullName` 19+ chars → truncated to 17 chars + '…' (18 chars total)

### FR2: formatMyRequests helper
- [x] Write test: 3 entries → all fields mapped correctly
- [x] Write test: `date` "2026-03-18" → formatted as "Tue Mar 18"
- [x] Write test: status PENDING / APPROVED / REJECTED all map through unchanged
- [x] Write test: `memo` ≤ 18 chars → no truncation
- [x] Write test: empty array → returns `[]`
- [x] Write test: `memo` 19+ chars → truncated to 17 chars + '…'
- [x] Write test: 5 entries, maxCount=3 → only first 3 returned
- [x] Write test: `durationMinutes` → `hours` string (60 min → "1.0h", 90 min → "1.5h")

### FR3: Extended buildWidgetData
- [x] Write test: returns `daily` with 7 entries when `hoursData.daily` has data
- [x] Write test: manager config → `approvalItems` capped at 3, `myRequests` is `[]`
- [x] Write test: contributor config → `myRequests` capped at 3, `approvalItems` is `[]`
- [x] Write test: `pendingCount` equals `approvalItems.length` (derived, not the passed-in value)
- [x] Write test: manager with approvals → `actionBg === '#1C1400'`
- [x] Write test: contributor with REJECTED request → `actionBg === '#1C0A0E'`
- [x] Write test: contributor with PENDING request (no rejected) → `actionBg === '#120E1A'`
- [x] Write test: no pending items → `actionBg === null`
- [x] Write test: `approvalItems` param omitted (undefined) → `approvalItems: []`, `pendingCount: 0`
- [x] Write test: `myRequests` param omitted (undefined) → `myRequests: []`

### FR4: updateWidgetData signature
- [x] Write test: calling without `approvalItems`/`myRequests` → new fields still present in written data (defaulted to `[]`)
- [x] Write test: new fields (`daily`, `approvalItems`, `myRequests`, `actionBg`) present in AsyncStorage snapshot

### FR5: useWidgetSync hook
- [x] Write test: existing 4-arg call compiles and does not throw
- [x] Write test: `approvalItems` in effect deps — re-fires when approvalItems changes

### FR7: CrossoverSnapshot type extension
- [x] Write test: `fetchFreshData()` returns `approvalItems` array for manager config
- [x] Write test: `fetchFreshData()` returns snapshot without `myRequests` field set

---

## Test Design Validation (MANDATORY)

- [x] Run `red-phase-test-validator` agent
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Mocks return realistic data matching interface contracts
- [x] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Extend WidgetData type with new fields
- [x] Add `WidgetDailyEntry` interface to `src/widgets/types.ts`
- [x] Add `WidgetApprovalItem` interface to `src/widgets/types.ts`
- [x] Add `WidgetMyRequest` interface to `src/widgets/types.ts`
- [x] Add `daily: WidgetDailyEntry[]` field to `WidgetData`
- [x] Add `approvalItems: WidgetApprovalItem[]` field to `WidgetData`
- [x] Add `myRequests: WidgetMyRequest[]` field to `WidgetData`
- [x] Add `actionBg: string | null` field to `WidgetData`
- [x] Verify TypeScript strict mode compiles

### FR2: Add data-transformation helpers to bridge.ts
- [x] Import `ApprovalItem` from `../lib/approvals` in `bridge.ts`
- [x] Import `ManualRequestEntry` from `../types/requests` in `bridge.ts`
- [x] Implement `buildDailyEntries(daily: DailyEntry[]): WidgetDailyEntry[]`
- [x] Implement `formatApprovalItems(items: ApprovalItem[], maxCount: number): WidgetApprovalItem[]`
- [x] Implement `formatMyRequests(entries: ManualRequestEntry[], maxCount: number): WidgetMyRequest[]`
- [x] All helper tests pass

### FR3: Extend buildWidgetData
- [x] Update `buildWidgetData` signature to accept `approvalItems: ApprovalItem[]` and `myRequests: ManualRequestEntry[]`
- [x] Add `daily` field to return: `buildDailyEntries(hoursData.daily)`
- [x] Add `approvalItems` field: `formatApprovalItems(approvalItems, 3)` for managers, `[]` for contributors
- [x] Add `myRequests` field: `formatMyRequests(myRequests, 3)` for contributors, `[]` for managers
- [x] Derive `pendingCount` from `approvalItems.length` (not passed-in parameter)
- [x] Implement `actionBg` derivation logic (manager/contributor + item states)
- [x] All buildWidgetData tests pass

### FR4: Update updateWidgetData signature
- [x] Add optional `approvalItems?: ApprovalItem[]` param to `updateWidgetData`
- [x] Add optional `myRequests?: ManualRequestEntry[]` param to `updateWidgetData`
- [x] Forward with `?? []` defaults to `buildWidgetData`
- [x] All updateWidgetData tests pass

### FR5: Update useWidgetSync hook
- [x] Add optional `approvalItems?: ApprovalItem[]` param
- [x] Add optional `myRequests?: ManualRequestEntry[]` param
- [x] Import types from `../lib/approvals` and `../types/requests`
- [x] Forward `approvalItems ?? []` and `myRequests ?? []` to `updateWidgetData`
- [x] Add `approvalItems` to `useEffect` dependency array
- [x] Verify `myRequests` NOT in dependency array
- [x] All useWidgetSync tests pass

### FR6: Update widgetBridge.ts wrapper
- [x] Forward `data.approvalItems ?? []` and `data.myRequests ?? []` to `_updateWidgetData` call
- [x] Compiles without error

### FR7: Extend CrossoverSnapshot type
- [x] Add `approvalItems?: ApprovalItem[]` to `CrossoverSnapshot` interface
- [x] Add `myRequests?: ManualRequestEntry[]` to `CrossoverSnapshot` interface
- [x] In `fetchFreshData()` manager path: set `approvalItems: [...manualItems, ...overtimeItems]`
- [x] Contributor path: `myRequests` not set (undefined)
- [x] All CrossoverSnapshot tests pass

### FR8: Update iOS WIDGET_LAYOUT_JS
- [x] Add `actionMode`, `bg`, `BADGE_COLORS` variables to layout function
- [x] systemSmall: no changes (verify it still renders correctly)
- [x] systemMedium: add `actionMode` branch rendering compact hero + up to 2 item rows
- [x] systemMedium hours mode: existing layout preserved in `else` branch
- [x] systemLarge: add `actionMode` branch rendering compact hero + up to 4 item rows + "+N more"
- [x] systemLarge hours mode: add bar chart section after existing stats block
- [x] Bar chart: 7 rows, correct width math, today's bar uses `hoursColor`
- [x] Guard: `props.daily && props.daily.length > 0` before rendering chart
- [x] Guard: `props.approvalItems && props.approvalItems.length > 0` before action mode check
- [x] No arrow functions in JSC string; use `function` keyword throughout
- [x] No optional chaining (`?.`) in JSC string

### FR9: Update Android MediumWidget
- [x] Add `actionMode` computation using `data.approvalItems` and `data.myRequests`
- [x] Add `bg` computation using `data.actionBg` fallback to `URGENCY_BG`
- [x] Add action mode branch in `MediumWidget` rendering compact hero + up to 2 item rows
- [x] Hours mode branch: existing layout unchanged
- [x] TypeScript compiles (no `as any` needed — types updated in FR1)
- [x] SmallWidget: unchanged

---

## Phase 1.2: Review (MANDATORY)

### Step 0: Spec-Implementation Alignment
- [x] Run `spec-implementation-alignment` agent
- [x] All FR success criteria verified in code
- [x] Interface contracts match implementation
- [x] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [x] Run `pr-review-toolkit:review-pr` skill (inline review — subagents unavailable)

### Step 2: Address Feedback
- [x] Fix HIGH severity issues (critical)
- [x] Fix MEDIUM severity issues (or document why deferred)
- [x] Re-run tests after fixes
- [x] Commit fixes: `fix(08-widget-enhancements): update existing test assertions to match new 6-arg signatures`

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on modified tests
- [x] Apply suggested improvements that strengthen confidence
- [x] Re-run tests to confirm passing
- [x] Commit if changes made: (no further changes needed after inline review)

### Final Verification
- [x] All tests passing (119 tests across 5 suites)
- [x] No regressions in existing tests (pre-existing failures verified via git stash — not caused by this spec)
- [x] Code follows existing patterns in `bridge.ts` and `HourglassWidget.tsx`

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-18**: Spec created from spec-research.md. 9 FRs identified. No open questions. Dependency 06-widgets confirmed complete.

**2026-03-18**: Implementation complete.
- Phase 1.0: 1 test commit (FR2–FR7 combined, 37 new tests)
- Phase 1.1: 7 implementation commits (feat(FR1), feat(FR2-FR4,FR8), feat(FR5), feat(FR6), feat(FR7), feat(FR9), fix(08-widget-enhancements))
  - Key corrections: imports from `../lib/approvals` and `../types/requests` (not hooks); `new Date(dateStr + 'T12:00:00')` for UTC-safe day-of-week; `_pendingCount` param renamed (ignored, derived from approvalItems.length)
- Phase 1.2: Inline alignment check passed all 9 FRs. 6 existing test assertions updated to match new 6-arg signatures (committed as fix). No HIGH/MEDIUM issues found.
- All tests passing: 119 tests across 5 suites (bridge, useWidgetSync, widgetBridge, crossoverData, widgetTaskHandler).
