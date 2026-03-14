# Implementation Checklist

Spec: `02-panel-state`
Feature: `hourglass-design-system`

---

## Phase 2.0: Test Foundation

### FR1: computePanelState — 5 state outputs
- [ ] Test: Mon morning, 0h worked, daysElapsed=0 → `"idle"`
- [ ] Test: Wed, 20h worked, daysElapsed=2 (pace=16h, ratio=1.25) → `"onTrack"`
- [ ] Test: Thu, 30h worked, daysElapsed=4 (pace=32h, ratio=0.9375) → `"onTrack"`
- [ ] Test: Fri EOD, 40h worked, daysElapsed=5 → `"crushedIt"`
- [ ] Test: Fri, 42h worked (over limit) → `"crushedIt"`
- [ ] Test: Wed, 10h worked, daysElapsed=2 (pace=16h, ratio=0.625) → `"behind"`
- [ ] Test: Wed, 5h worked, daysElapsed=2 (pace=16h, ratio=0.3125) → `"critical"`

### FR2: PACING thresholds as named constants
- [ ] Test: pacingRatio exactly 0.85 → `"onTrack"` (inclusive boundary)
- [ ] Test: pacingRatio 0.84 (just below) → `"behind"`
- [ ] Test: pacingRatio exactly 0.60 → `"behind"` (inclusive boundary)
- [ ] Test: pacingRatio 0.59 (just below) → `"critical"`

### FR3: Edge cases
- [ ] Test: weeklyLimit=0 → `"idle"` (no division by zero)
- [ ] Test: daysElapsed=0, hoursWorked=0 → `"idle"`
- [ ] Test: daysElapsed=0, hoursWorked=5 → `"onTrack"` (early work)
- [ ] Test: daysElapsed=7 (>5) → clamped, `"crushedIt"` with 40h/40 limit
- [ ] Test: hoursWorked=-1 → valid result (treated as 0, returns `"critical"`)

### FR4: Test file setup
- [ ] Create `hourglassws/src/lib/__tests__/panelState.test.ts`
- [ ] Organise tests in `describe` blocks: `'happy path'`, `'edge cases'`, `'threshold boundaries'`
- [ ] Verify tests fail (red phase) before implementation exists

---

## Test Design Validation (MANDATORY)

**Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (exact state string equality, not just truthy)
- [ ] No mocks needed — pure function confirmed
- [ ] Fix any issues identified before proceeding

---

## Phase 2.1: Implementation

### FR1: computePanelState function body
- [ ] Create `hourglassws/src/lib/panelState.ts`
- [ ] Import `PanelState` type from `./reanimated-presets` using `import type`
- [ ] Re-export `PanelState` type from `panelState.ts`
- [ ] Implement priority-ordered state assignment logic (see spec FR1)
- [ ] Run `npx jest panelState` — all tests pass

### FR2: Threshold constants
- [ ] Export `PACING_ON_TRACK_THRESHOLD = 0.85`
- [ ] Export `PACING_BEHIND_THRESHOLD = 0.60`
- [ ] Verify `computePanelState` uses constants internally (no inline 0.85/0.60 literals)

### FR3: Edge case guards
- [ ] Guard: `weeklyLimit <= 0` → early return `"idle"`
- [ ] Guard: `daysElapsed` clamped to `[0, 5]` via `Math.max(0, Math.min(5, daysElapsed))`
- [ ] Guard: `hoursWorked` clamped to `[0, ∞)` via `Math.max(0, hoursWorked)`
- [ ] Verify: `daysElapsed=0, hoursWorked>0` → `"onTrack"` path works correctly

### FR4: Tests passing
- [ ] Run full test suite: `npx jest panelState` from `hourglassws/`
- [ ] All 16 test cases pass (7 happy path + 5 edge + 4 boundary)
- [ ] TypeScript compiles without errors: `npx tsc --noEmit` from `hourglassws/`

---

## Phase 2.2: Review (MANDATORY)

**DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation (signature matches spec-research.md exactly)
- [ ] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(02-panel-state): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on `src/lib/__tests__/panelState.test.ts`
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(02-panel-state): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns (matches `src/lib/hours.ts` style)

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-14**: Spec created. Research complete, coherence check passed, QC passed. Ready for implementation.
