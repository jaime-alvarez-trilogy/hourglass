# Implementation Checklist

Spec: `10-mesh-color-overhaul`
Feature: `mesh-color-overhaul`

---

## Phase 1.0: Test Foundation

### FR1: Mesh Radius Expansion
- [ ] Write test: `nodeRadius` evaluates to `w * 1.2` (not `w * 0.7`)
- [ ] Write test: `hexToRgba` still returns valid rgba string (regression — unchanged function)

### FR2: State Color Palette
- [ ] Write test: `resolveNodeCColor('idle', ...)` returns `'#556B8E'`
- [ ] Write test: `resolveNodeCColor('critical', ...)` returns `'#F87171'`
- [ ] Write test: `resolveNodeCColor('behind', ...)` returns `'#FCD34D'`
- [ ] Write test: `resolveNodeCColor('onTrack', ...)` returns `'#4ADE80'`
- [ ] Write test: `resolveNodeCColor('aheadOfPace', ...)` returns `'#4ADE80'`
- [ ] Write test: `resolveNodeCColor('crushedIt', ...)` returns `'#C89F5D'`
- [ ] Write test: `resolveNodeCColor('overtime', ...)` returns `'#CEA435'`
- [ ] Write test: `resolveNodeCColor(null, null, null)` returns `colors.background`

### FR3: AI Tier Utility (new file `src/lib/__tests__/aiTier.test.ts`)
- [ ] Write test: `classifyAIPct(75)` → `{ label: 'AI Leader', color: '#60A5FA' }`
- [ ] Write test: `classifyAIPct(74)` → `{ label: 'Consistent Progress', color: '#4ADE80' }`
- [ ] Write test: `classifyAIPct(50)` → `{ label: 'Consistent Progress', color: '#4ADE80' }`
- [ ] Write test: `classifyAIPct(49)` → `{ label: 'Building Momentum', color: '#FCD34D' }`
- [ ] Write test: `classifyAIPct(30)` → `{ label: 'Building Momentum', color: '#FCD34D' }`
- [ ] Write test: `classifyAIPct(29)` → `{ label: 'Getting Started', color: '#A0A0A0' }`
- [ ] Write test: `classifyAIPct(0)` → `{ label: 'Getting Started', color: '#A0A0A0' }`

### FR4: AIArcHero Tier-Aware Arc Color
- [ ] Write test: `GRADIENT_COLORS` constant is NOT present in AIArcHero source
- [ ] Write test: when `aiPct=80`, `SweepGradient colors` prop is `['#60A5FA', '#60A5FA']`
- [ ] Write test: when `aiPct=20`, `SweepGradient colors` prop is `['#A0A0A0', '#A0A0A0']`

### FR5: TrendSparkline Left domainPadding
- [ ] Write test: `domainPadding` prop is `{ left: 10, right: 10 }` (not `{ left: 0, right: 10 }`)

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

### FR1: Mesh Radius Expansion
- [ ] Change `nodeRadius` from `w * 0.7` to `w * 1.2` in `AnimatedMeshBackground.tsx`
- [ ] Verify orbital movement paths (`±w*0.30`, `±h*0.20`) are unchanged
- [ ] Run FR1 tests — confirm passing

### FR2: State Color Palette
- [ ] Add 7 new color tokens to `src/lib/colors.ts`: `dustyBlue`, `desatCoral`, `warnAmber`, `successGreen`, `champagneGold`, `luxuryGold`, `infoBlue`
- [ ] Update `PANEL_STATE_COLORS` in `AnimatedMeshBackground.tsx` with 7 new hex values
- [ ] Change `idle` entry from `null` to `'#556B8E'`
- [ ] Verify `resolveNodeCColor` function body is unchanged
- [ ] Run FR2 tests — confirm passing

### FR3: Extract AI Tier Utility
- [ ] Create `src/lib/aiTier.ts` with `AITier` interface and `classifyAIPct` function
- [ ] Use new color tokens (`colors.infoBlue`, `colors.successGreen`, `colors.warnAmber`, `colors.textMuted`)
- [ ] Remove local `AITier` interface from `app/(tabs)/ai.tsx`
- [ ] Remove local `classifyAIPct` function from `app/(tabs)/ai.tsx`
- [ ] Add `import { classifyAIPct, AITier } from '@/src/lib/aiTier'` to `app/(tabs)/ai.tsx`
- [ ] Verify TypeScript compilation succeeds (no type errors)
- [ ] Run FR3 tests — confirm passing

### FR4: AIArcHero Tier-Aware Arc Color
- [ ] Remove `GRADIENT_COLORS` constant from `AIArcHero.tsx`
- [ ] Add `import { classifyAIPct } from '@/src/lib/aiTier'` to `AIArcHero.tsx`
- [ ] Add `const tierColor = classifyAIPct(aiPct).color;` inside component render
- [ ] Update `<SweepGradient colors={[tierColor, tierColor]} ...>`
- [ ] Verify track arc (`color="rgba(255,255,255,0.08)"`) is unchanged
- [ ] Run FR4 tests — confirm passing

### FR5: TrendSparkline Left domainPadding
- [ ] Change `domainPadding={{ left: 0, right: 10 }}` to `domainPadding={{ left: 10, right: 10 }}` in `TrendSparkline.tsx`
- [ ] Verify `padTop`/`padBottom` domain calculation is unchanged
- [ ] Run FR5 tests — confirm passing

### Integration
- [ ] Run full test suite — confirm all passing, no regressions

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
- [ ] Commit fixes: `fix(10-mesh-color-overhaul): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(10-mesh-color-overhaul): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-23**: Spec and checklist created.
