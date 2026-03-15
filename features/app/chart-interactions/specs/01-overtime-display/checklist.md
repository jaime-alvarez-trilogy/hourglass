# Implementation Checklist

Spec: `01-overtime-display`
Feature: `chart-interactions`

---

## Phase 1.0: Test Foundation

### FR1: Add `overtime` PanelState
- [ ] Write test: `computePanelState(41, 40, 3)` returns `'overtime'`
- [ ] Write test: `computePanelState(40, 40, 5)` returns `'crushedIt'` (not overtime)
- [ ] Write test: `computePanelState(40.01, 40, 3)` returns `'overtime'` (strict >)
- [ ] Write test: `computePanelState(39.9, 40, 3)` returns a non-overtime state
- [ ] Write test: `computePanelState(0, 0, 0)` returns `'idle'` (zero-limit guard unchanged)
- [ ] Write test: `computePanelState(0, 40, 0)` returns `'idle'` (no hours, no days)
- [ ] Write test: `computePanelState(100, 40, 5)` returns `'overtime'` (large overtime value)

### FR2: WeeklyBarChart overtime bar coloring
- [ ] Write test: bar pushing cumulative total beyond `weeklyLimit` uses `#FFF8E7` color
- [ ] Write test: bars within cumulative limit use existing colors (gold/success/muted)
- [ ] Write test: without `weeklyLimit` prop, all bar colors unchanged from current behavior
- [ ] Write test: when all hours exceed limit, all non-future bars use `#FFF8E7`
- [ ] Write test: bar at exactly `weeklyLimit` (cumulative = limit, not over) is NOT white-gold
- [ ] Write test: future bars always use `colors.textMuted` regardless of `weeklyLimit`

### FR3: PanelGradient overtime entry
- [ ] Write test: `PanelGradient` renders without crash when `state='overtime'`
- [ ] Write test: `PANEL_GRADIENTS['overtime']` has a `colors` array containing `#FFF8E759`

### FR4: Home tab overtime hero display
- [ ] Write test: when `panelState === 'overtime'`, hero shows `overtimeHours` value, not `total`
- [ ] Write test: when `panelState === 'overtime'`, unit displayed is "h OT"
- [ ] Write test: when `panelState === 'overtime'`, sub-label is "overtime this week"
- [ ] Write test: when `panelState === 'overtime'`, the today/avg/remaining row is NOT rendered
- [ ] Write test: when `panelState !== 'overtime'`, hero shows `total` hours with "h" unit
- [ ] Write test: when `panelState !== 'overtime'`, sub-metrics row IS rendered

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Add `overtime` PanelState
- [ ] Add `'overtime'` to `PanelState` type union in `src/lib/reanimated-presets.ts`
- [ ] Add `if (hours > weeklyLimit) return 'overtime'` before `crushedIt` check in `computePanelState()` in `src/lib/panelState.ts`
- [ ] Verify `computePanelState` JSDoc comment updated to mention `overtime` state

### FR2: WeeklyBarChart overtime bar coloring
- [ ] Add `weeklyLimit?: number` to `WeeklyBarChartProps` interface
- [ ] Add `OVERTIME_WHITE_GOLD = '#FFF8E7'` constant
- [ ] Implement running-total accumulation before the `data.map()` render loop
- [ ] Insert overtime color check: `runningTotal > weeklyLimit → OVERTIME_WHITE_GOLD`
- [ ] Verify future bars still use `colors.textMuted` (not affected by limit check)

### FR3: PanelGradient overtime entry
- [ ] Add `overtime` key to `PANEL_GRADIENTS` with `colors: ['#FFF8E759', 'transparent']`
- [ ] Verify TypeScript compile error is resolved (Record<PanelState> now complete)

### FR4: Home tab overtime hero display
- [ ] Add `overtime: 'OVERTIME'` to `STATE_LABELS` in `index.tsx`
- [ ] Add `overtime: 'text-[#FFF8E7]'` to `STATE_COLORS` in `index.tsx`
- [ ] Add conditional block: when `panelState === 'overtime'` → show `overtimeHours` with "h OT" unit
- [ ] Replace sub-label with "overtime this week" in overtime branch
- [ ] Hide today/avg/remaining sub-metrics row in overtime branch
- [ ] Pass `weeklyLimit={weeklyLimit}` prop to `WeeklyBarChart`
- [ ] Verify TypeScript compiles with no errors across all modified files

---

## Phase 1.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory for every change.

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
- [ ] Commit fixes: `fix(01-overtime-display): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(01-overtime-display): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-15**: Spec created. 4 FRs identified. FR1 (type + logic) → FR2 (bar chart) + FR3 (gradient) are independent. FR4 (home tab) depends on FR1, FR2, FR3.
