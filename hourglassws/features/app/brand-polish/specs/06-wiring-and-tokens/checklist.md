# Implementation Checklist

Spec: `06-wiring-and-tokens`
Feature: `brand-polish`

---

## Phase 1.0: Test Foundation

### FR1: NoiseOverlay wiring
- [ ] Write test: TabLayout renders without crashing when NoiseOverlay is included
- [ ] Write test: NoiseOverlay is rendered as child of the wrapper View
- [ ] Write test: The Tabs component still renders all 4 screens normally
- [ ] Write test: pointerEvents="none" — NoiseOverlay does not intercept tab taps

### FR2: Tab bar color tokens
- [ ] Write test: `backgroundColor` uses `colors.surface` value (not hardcoded string)
- [ ] Write test: `borderTopColor` uses `colors.border` value (not hardcoded string)
- [ ] Write test: No `'#13131A'` literal present in source file
- [ ] Write test: No `'#2A2A3D'` literal present in source file

### FR3: Overview toggle color
- [ ] Write test: Active pill text color resolves to `colors.violet` (not `colors.gold`)
- [ ] Write test: Inactive pill text color remains `colors.textMuted`
- [ ] Write test: No `colors.gold` reference in toggle pill Text style expressions (source string check)
- [ ] Write test: Both 4W and 12W toggle instances updated

### FR4: MetricValue typography
- [ ] Write test: Component renders with `font-display-extrabold` class (not `font-display`)
- [ ] Write test: Inline style includes `letterSpacing: -0.5`
- [ ] Write test: `fontVariant: ['tabular-nums']` still present
- [ ] Write test: `colorClass` and `sizeClass` props still applied correctly
- [ ] Write test: No "Space Grotesk" string in MetricValue.tsx source

### FR5: Loading screen tokens
- [ ] Write test: Background color is `colors.background` (not `'#0D1117'`)
- [ ] Write test: ActivityIndicator color is `colors.violet` (not `'#00FF88'`)
- [ ] Write test: No `'#0D1117'` literal present in `_layout.tsx` loading screen
- [ ] Write test: No `'#00FF88'` literal present in `_layout.tsx`

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts (noise.png mock for FR1)
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: NoiseOverlay wiring
- [ ] Add `View` import from `react-native` to `app/(tabs)/_layout.tsx`
- [ ] Add `NoiseOverlay` import from `@/src/components/NoiseOverlay` to `app/(tabs)/_layout.tsx`
- [ ] Wrap `<Tabs>` in `<View style={{ flex: 1 }}>`
- [ ] Place `<NoiseOverlay />` after `<Tabs>` inside that wrapper View
- [ ] Verify all 4 tab screens still render (no layout regression)

### FR2: Tab bar color tokens
- [ ] Add `import { colors } from '@/src/lib/colors'` to `app/(tabs)/_layout.tsx`
- [ ] Replace `backgroundColor: '#13131A'` with `backgroundColor: colors.surface`
- [ ] Replace `borderTopColor: '#2A2A3D'` with `borderTopColor: colors.border`
- [ ] Verify no hardcoded hex values remain for tab bar styling

### FR3: Overview toggle color
- [ ] Replace line 208: `colors.gold` → `colors.violet` (4W active pill)
- [ ] Replace line 220: `colors.gold` → `colors.violet` (12W active pill)
- [ ] Verify line 246 `colors.gold` (earnings display) is NOT changed

### FR4: MetricValue typography
- [ ] Replace comment lines 1–8: "Space Grotesk" → "Inter"
- [ ] Replace `font-display` → `font-display-extrabold` in className (line 65)
- [ ] Add `letterSpacing: -0.5` to inline style object
- [ ] Verify `fontVariant: ['tabular-nums']` still present

### FR5: Root layout loading screen
- [ ] Add `import { colors } from '@/src/lib/colors'` to `app/_layout.tsx`
- [ ] Replace `backgroundColor: '#0D1117'` with `backgroundColor: colors.background`
- [ ] Replace `color="#00FF88"` with `color={colors.violet}` on ActivityIndicator

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
- [ ] Commit fixes: `fix(06-wiring-and-tokens): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(06-wiring-and-tokens): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-16**: Spec created from gauntlet run-002 synthesis. 5 independent FRs, no external blockers.
