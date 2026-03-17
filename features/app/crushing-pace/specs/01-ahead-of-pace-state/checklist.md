# Implementation Checklist

Spec: `01-ahead-of-pace-state`
Feature: `crushing-pace`

---

## Phase 1.0: Test Foundation

### FR1: `computePanelState` returns `'aheadOfPace'` at ≥150% pace

- [ ] In `panelState.test.ts`: add test — `computePanelState(12, 40, 1.0)` returns `'aheadOfPace'` (Mon EOD 150%)
- [ ] In `panelState.test.ts`: add test — `computePanelState(24, 40, 2.0)` returns `'aheadOfPace'` (Tue EOD 150%)
- [ ] In `panelState.test.ts`: add test — `computePanelState(20, 40, 1.667)` returns `'aheadOfPace'` (ratio exactly 1.5)
- [ ] In `panelState.test.ts`: add test — `pacingRatio = 1.5` exactly returns `'aheadOfPace'`
- [ ] In `panelState.test.ts`: add test — `pacingRatio = 1.499` returns `'onTrack'` (just below threshold)
- [ ] In `panelState.test.ts`: add test — `pacingRatio = 2.0` returns `'aheadOfPace'` (well above)
- [ ] In `panelState.test.ts`: add test — `computePanelState(45, 40, 1.0)` returns `'overtime'` (priority preserved)
- [ ] In `panelState.test.ts`: add test — `computePanelState(40, 40, 1.0)` returns `'crushedIt'` (priority preserved)
- [ ] In `panelState.test.ts`: add test — `computePanelState(0, 40, 0.5)` returns `'idle'` (idle guard preserved)
- [ ] In `panelState.test.ts`: add test — `PACING_CRUSHING_THRESHOLD` is exported and equals `1.5`

### FR2: All state maps include `'aheadOfPace'`

- [ ] In `PanelGradient.test.tsx`: add `'aheadOfPace'` to both `allStates` arrays (lines 65 and 234)
- [ ] In `PanelGradient.test.tsx`: add test — `getGlowStyle('aheadOfPace')` returns object with `shadowColor === '#E8C97A'`
- [ ] In `PanelGradient.test.tsx`: add test — `PANEL_GRADIENT_COLORS['aheadOfPace']` is non-null with `inner` and `outer`
- [ ] In `PanelGradient.test.tsx`: add test — `PANEL_GRADIENTS['aheadOfPace'].colors` has length 2
- [ ] In `PanelGradient.test.tsx`: add test — `PanelGradient` renders without error when `state="aheadOfPace"`
- [ ] In `AmbientBackground.test.tsx`: add `'aheadOfPace'` to the state loop (lines 148–249)
- [ ] In `AmbientBackground.test.tsx`: update length assertion from `6` to `7`
- [ ] In `AmbientBackground.test.tsx`: add test — `getAmbientColor({ type: 'panelState', state: 'aheadOfPace' })` returns non-null string

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

### FR1: `computePanelState` returns `'aheadOfPace'` at ≥150% pace

- [ ] In `reanimated-presets.ts` line 170: expand `PanelState` union to include `"aheadOfPace"`
- [ ] In `panelState.ts`: export `PACING_CRUSHING_THRESHOLD = 1.5` constant (after `PACING_BEHIND_THRESHOLD`)
- [ ] In `panelState.ts`: update JSDoc (panel states count 6 → 7, add `aheadOfPace` to list)
- [ ] In `panelState.ts`: insert `if (pacingRatio >= PACING_CRUSHING_THRESHOLD) return 'aheadOfPace'` before `onTrack` guard
- [ ] Verify TypeScript catches all missing map entries (compile-time check)

### FR2: All state maps include `'aheadOfPace'`

- [ ] In `app/(tabs)/index.tsx`: add `aheadOfPace: 'CRUSHING IT'` to `STATE_LABELS`
- [ ] In `app/(tabs)/index.tsx`: add `aheadOfPace: 'text-gold'` to `STATE_COLORS`
- [ ] In `app/(tabs)/index.tsx`: add `aheadOfPace: colors.gold` to `TODAY_BAR_COLORS`
- [ ] In `PanelGradient.tsx`: add `aheadOfPace: { inner: '#E8C97A', outer: 'transparent' }` to `PANEL_GRADIENT_COLORS`
- [ ] In `PanelGradient.tsx`: add `aheadOfPace: { colors: ['#E8C97A59', 'transparent'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } }` to `PANEL_GRADIENTS`
- [ ] In `PanelGradient.tsx`: add `case 'aheadOfPace': return { shadowColor: '#E8C97A', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset }` to `getGlowStyle` switch
- [ ] In `AmbientBackground.tsx`: add `aheadOfPace: colors.gold` to `AMBIENT_COLORS.panelState`
- [ ] Run `tsc --noEmit` in `hourglassws/` — zero errors

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
- [ ] Commit fixes: `fix(01-ahead-of-pace-state): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(01-ahead-of-pace-state): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests (`onTrack`, `behind`, `critical`, `crushedIt`, `idle`, `overtime` all still pass)
- [ ] Code follows existing patterns (gold entries mirror crushedIt structure)

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-17**: Spec created. Research identified 9 insertion points across 5 source files + 3 test files. All maps are `Record<PanelState, T>` — TypeScript will enforce exhaustiveness after type expansion. No new color tokens required; `colors.gold` reused throughout.
