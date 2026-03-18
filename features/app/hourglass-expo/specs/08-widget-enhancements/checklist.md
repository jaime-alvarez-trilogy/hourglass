# Implementation Checklist

Spec: `08-widget-enhancements`
Feature: `hourglass-expo`

---

## Phase 1.0: Test Foundation

### FR1: Extend WidgetData type with new fields
- [ ] Write tests verifying `WidgetDailyEntry`, `WidgetApprovalItem`, `WidgetMyRequest` are exported from `types.ts`
- [ ] Write compile-time test (or type check) verifying `WidgetData` has all 4 new fields: `daily`, `approvalItems`, `myRequests`, `actionBg`
- [ ] Write tests verifying existing `WidgetData` fields are unchanged

### FR2: buildDailyEntries helper
- [ ] Write test: empty `daily` array → 7 entries all `{ hours: 0, isToday: false }`
- [ ] Write test: Mon–Wed filled, Thu–Sun empty → correct hours for Mon/Tue/Wed, 0 for Thu–Sun
- [ ] Write test: all 7 days filled → all hours mapped correctly, correct `day` labels
- [ ] Write test: `isToday` set on exactly one entry (today's date)
- [ ] Write test: out-of-order input → returns Mon[0]–Sun[6] order
- [ ] Write test: Sunday date → Sun entry has `isToday: true`

### FR2: formatApprovalItems helper
- [ ] Write test: 2 items, maxCount=3 → returns 2 items
- [ ] Write test: 5 items, maxCount=3 → returns first 3 items only
- [ ] Write test: ManualApprovalItem → `category: 'MANUAL'`, hours from `item.hours`
- [ ] Write test: OvertimeApprovalItem → `category: 'OVERTIME'`, hours from `item.hours`
- [ ] Write test: empty array → returns `[]`
- [ ] Write test: `fullName` exactly 18 chars → no truncation
- [ ] Write test: `fullName` 19+ chars → truncated to 17 chars + '…' (18 chars total)

### FR2: formatMyRequests helper
- [ ] Write test: 3 entries → all fields mapped correctly
- [ ] Write test: `date` "2026-03-18" → formatted as "Tue Mar 18"
- [ ] Write test: status PENDING / APPROVED / REJECTED all map through unchanged
- [ ] Write test: `memo` ≤ 18 chars → no truncation
- [ ] Write test: empty array → returns `[]`
- [ ] Write test: `memo` 19+ chars → truncated to 17 chars + '…'
- [ ] Write test: 5 entries, maxCount=3 → only first 3 returned
- [ ] Write test: `durationMinutes` → `hours` string (60 min → "1.0h", 90 min → "1.5h")

### FR3: Extended buildWidgetData
- [ ] Write test: returns `daily` with 7 entries when `hoursData.daily` has data
- [ ] Write test: manager config → `approvalItems` capped at 3, `myRequests` is `[]`
- [ ] Write test: contributor config → `myRequests` capped at 3, `approvalItems` is `[]`
- [ ] Write test: `pendingCount` equals `approvalItems.length` (derived, not the passed-in value)
- [ ] Write test: manager with approvals → `actionBg === '#1C1400'`
- [ ] Write test: contributor with REJECTED request → `actionBg === '#1C0A0E'`
- [ ] Write test: contributor with PENDING request (no rejected) → `actionBg === '#120E1A'`
- [ ] Write test: no pending items → `actionBg === null`
- [ ] Write test: `approvalItems` param omitted (undefined) → `approvalItems: []`, `pendingCount: 0`
- [ ] Write test: `myRequests` param omitted (undefined) → `myRequests: []`

### FR4: updateWidgetData signature
- [ ] Write test: calling without `approvalItems`/`myRequests` → new fields still present in written data (defaulted to `[]`)
- [ ] Write test: new fields (`daily`, `approvalItems`, `myRequests`, `actionBg`) present in AsyncStorage snapshot

### FR5: useWidgetSync hook
- [ ] Write test: existing 4-arg call compiles and does not throw
- [ ] Write test: `approvalItems` in effect deps — re-fires when approvalItems changes

### FR7: CrossoverSnapshot type extension
- [ ] Write test: `fetchFreshData()` returns `approvalItems` array for manager config
- [ ] Write test: `fetchFreshData()` returns snapshot without `myRequests` field set

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Extend WidgetData type with new fields
- [ ] Add `WidgetDailyEntry` interface to `src/widgets/types.ts`
- [ ] Add `WidgetApprovalItem` interface to `src/widgets/types.ts`
- [ ] Add `WidgetMyRequest` interface to `src/widgets/types.ts`
- [ ] Add `daily: WidgetDailyEntry[]` field to `WidgetData`
- [ ] Add `approvalItems: WidgetApprovalItem[]` field to `WidgetData`
- [ ] Add `myRequests: WidgetMyRequest[]` field to `WidgetData`
- [ ] Add `actionBg: string | null` field to `WidgetData`
- [ ] Verify TypeScript strict mode compiles

### FR2: Add data-transformation helpers to bridge.ts
- [ ] Import `ApprovalItem` from `../hooks/useApprovalItems` in `bridge.ts`
- [ ] Import `ManualRequestEntry` from `../hooks/useMyRequests` in `bridge.ts`
- [ ] Implement `buildDailyEntries(daily: DailyEntry[]): WidgetDailyEntry[]`
- [ ] Implement `formatApprovalItems(items: ApprovalItem[], maxCount: number): WidgetApprovalItem[]`
- [ ] Implement `formatMyRequests(entries: ManualRequestEntry[], maxCount: number): WidgetMyRequest[]`
- [ ] All helper tests pass

### FR3: Extend buildWidgetData
- [ ] Update `buildWidgetData` signature to accept `approvalItems: ApprovalItem[]` and `myRequests: ManualRequestEntry[]`
- [ ] Add `daily` field to return: `buildDailyEntries(hoursData.daily)`
- [ ] Add `approvalItems` field: `formatApprovalItems(approvalItems, 3)` for managers, `[]` for contributors
- [ ] Add `myRequests` field: `formatMyRequests(myRequests, 3)` for contributors, `[]` for managers
- [ ] Derive `pendingCount` from `approvalItems.length` (not passed-in parameter)
- [ ] Implement `actionBg` derivation logic (manager/contributor + item states)
- [ ] All buildWidgetData tests pass

### FR4: Update updateWidgetData signature
- [ ] Add optional `approvalItems?: ApprovalItem[]` param to `updateWidgetData`
- [ ] Add optional `myRequests?: ManualRequestEntry[]` param to `updateWidgetData`
- [ ] Forward with `?? []` defaults to `buildWidgetData`
- [ ] All updateWidgetData tests pass

### FR5: Update useWidgetSync hook
- [ ] Add optional `approvalItems?: ApprovalItem[]` param
- [ ] Add optional `myRequests?: ManualRequestEntry[]` param
- [ ] Import types from `./useApprovalItems` and `./useMyRequests`
- [ ] Forward `approvalItems ?? []` and `myRequests ?? []` to `updateWidgetData`
- [ ] Add `approvalItems` to `useEffect` dependency array
- [ ] Verify `myRequests` NOT in dependency array
- [ ] All useWidgetSync tests pass

### FR6: Update widgetBridge.ts wrapper
- [ ] Forward `data.approvalItems ?? []` and `data.myRequests ?? []` to `_updateWidgetData` call
- [ ] Compiles without error

### FR7: Extend CrossoverSnapshot type
- [ ] Add `approvalItems?: ApprovalItem[]` to `CrossoverSnapshot` interface
- [ ] Add `myRequests?: ManualRequestEntry[]` to `CrossoverSnapshot` interface
- [ ] In `fetchFreshData()` manager path: set `approvalItems: [...manualItems, ...overtimeItems]`
- [ ] Contributor path: `myRequests` not set (undefined)
- [ ] All CrossoverSnapshot tests pass

### FR8: Update iOS WIDGET_LAYOUT_JS
- [ ] Add `actionMode`, `bg`, `BADGE_COLORS` variables to layout function
- [ ] systemSmall: no changes (verify it still renders correctly)
- [ ] systemMedium: add `actionMode` branch rendering compact hero + up to 2 item rows
- [ ] systemMedium hours mode: existing layout preserved in `else` branch
- [ ] systemLarge: add `actionMode` branch rendering compact hero + up to 4 item rows + "+N more"
- [ ] systemLarge hours mode: add bar chart section after existing stats block
- [ ] Bar chart: 7 rows, correct width math, today's bar uses `hoursColor`
- [ ] Guard: `props.daily && props.daily.length > 0` before rendering chart
- [ ] Guard: `props.approvalItems && props.approvalItems.length > 0` before action mode check
- [ ] No arrow functions in JSC string; use `function` keyword throughout
- [ ] No optional chaining (`?.`) in JSC string

### FR9: Update Android MediumWidget
- [ ] Add `actionMode` computation using `data.approvalItems` and `data.myRequests`
- [ ] Add `bg` computation using `data.actionBg` fallback to `URGENCY_BG`
- [ ] Add action mode branch in `MediumWidget` rendering compact hero + up to 2 item rows
- [ ] Hours mode branch: existing layout unchanged
- [ ] TypeScript compiles (no `as any` needed — types updated in FR1)
- [ ] SmallWidget: unchanged

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
- [ ] Commit fixes: `fix(08-widget-enhancements): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(08-widget-enhancements): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns in `bridge.ts` and `HourglassWidget.tsx`

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-18**: Spec created from spec-research.md. 9 FRs identified. No open questions. Dependency 06-widgets confirmed complete.
