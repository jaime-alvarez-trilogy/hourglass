# Implementation Checklist

Spec: `04-ai-hero-arc`
Feature: `hero-glass-system`

---

## Phase 4.0: Test Foundation

### FR6: arcPath pure utility function
- [ ] Test: `arcPath(90, 90, 80, 135, 135)` returns string starting with "M" (degenerate case, no crash)
- [ ] Test: `arcPath(90, 90, 80, 135, 405)` returns valid full 270° arc path string
- [ ] Test: `arcPath(90, 90, 80, 135, 270)` returns valid 135° (50%) arc path string
- [ ] Test: large arc flag = 1 when sweep > 180°
- [ ] Test: large arc flag = 0 when sweep ≤ 180°
- [ ] Test: returned string always starts with "M"

### FR1: AIArcHero component — arc gauge + bold AI% center
- [ ] Test: renders `testID="ai-arc-hero"` without crash for aiPct=0, 50, 100
- [ ] Test: bold AI% number rendered as center text (e.g. "75%")
- [ ] Test: "AI USAGE" label rendered
- [ ] Test: arc fill uses `ambientColor` prop as stroke
- [ ] Test: delta badge rendered when `deltaPercent !== null`
- [ ] Test: delta badge NOT rendered when `deltaPercent === null`
- [ ] Test: delta badge color is success when `deltaPercent > 0`
- [ ] Test: delta badge color is critical when `deltaPercent < 0`
- [ ] Test: delta badge color is textSecondary when `deltaPercent === 0`
- [ ] Test: component source does not import `AIRingChart`
- [ ] Test: `AI_TARGET_PCT === 75` exported constant

### FR2: BrainLift secondary metric
- [ ] Test: renders `{brainliftHours.toFixed(1)}h / 5h` text
- [ ] Test: ProgressBar rendered with colorClass="bg-violet"
- [ ] Test: brainliftHours=0 — renders "0.0h / 5h", progress=0 (no crash)
- [ ] Test: brainliftHours=5 — renders "5.0h / 5h", progress=1
- [ ] Test: brainliftHours=7.3 — renders "7.3h / 5h", progress clamped at 1

### FR3: Ambient signal contract (existing getAmbientColor)
- [ ] Test: `getAmbientColor({ type: 'aiPct', pct: 80 })` returns colors.violet
- [ ] Test: `getAmbientColor({ type: 'aiPct', pct: 65 })` returns colors.cyan
- [ ] Test: `getAmbientColor({ type: 'aiPct', pct: 50 })` returns colors.warning
- [ ] Test: `getAmbientColor({ type: 'aiPct', pct: 75 })` returns colors.violet (at-boundary)
- [ ] Test: `getAmbientColor({ type: 'aiPct', pct: 60 })` returns colors.cyan (at-boundary)
- [ ] Test: `getAmbientColor({ type: 'aiPct', pct: 0 })` returns colors.warning

### FR4 + FR5: AI screen wiring (ai.test.tsx)
- [ ] Test: `AmbientBackground` is rendered in AI screen
- [ ] Test: `AmbientBackground` receives `color` derived from `getAmbientColor({ type: 'aiPct', ... })`
- [ ] Test: `AIArcHero` is rendered in place of old ring hero
- [ ] Test: `AIRingChart` is NOT rendered in the hero section
- [ ] Test: separate BrainLift card is NOT rendered as standalone card

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 4.1: Implementation

### FR6: arcPath pure utility function
- [ ] Implement `arcPath(cx, cy, r, startAngleDeg, endAngleDeg): string` in `AIArcHero.tsx`
- [ ] Handle degenerate case: `startAngleDeg === endAngleDeg` returns `M x y`
- [ ] Correct large arc flag: 1 if sweep > 180°, else 0
- [ ] Always clockwise sweep (sweep-flag = 1)
- [ ] Export `arcPath` from `AIArcHero.tsx`

### FR1: AIArcHero component — arc gauge + bold AI% center
- [ ] Create `hourglassws/src/components/AIArcHero.tsx`
- [ ] Export `AI_TARGET_PCT = 75` and `BRAINLIFT_TARGET_HOURS = 5`
- [ ] Render track arc (270°, `colors.border`, strokeWidth 6, strokeLinecap="round")
- [ ] Render fill arc (animated via `AnimatedPath` + `useAnimatedProps`)
- [ ] `fillEndAngle` useSharedValue, animated with `withSpring(springPremium)` on aiPct change
- [ ] Centered bold AI% number overlay (fontSize 40, `colors.textPrimary`)
- [ ] "AI USAGE" label below number (fontSize 12, `colors.textMuted`, uppercase)
- [ ] Delta badge: top-right of arc area, `testID="delta-badge"`, conditional on `deltaPercent !== null`
- [ ] Correct delta badge color: success/critical/textSecondary
- [ ] Default `size = 180`; arc geometry uses `cx = cy = size/2`, `r = size/2 - strokeWidth/2 - 2`
- [ ] Wrapped in `Card` component

### FR2: BrainLift secondary metric
- [ ] Render "BRAINLIFT" label below arc
- [ ] Render `{brainliftHours.toFixed(1)}h / {BRAINLIFT_TARGET_HOURS}h` text
- [ ] Render `ProgressBar` with `progress={Math.min(1, brainliftHours / BRAINLIFT_TARGET_HOURS)}`, `colorClass="bg-violet"`, `height={5}`

### FR4: Wire AmbientBackground to AI screen
- [ ] Import `AmbientBackground`, `getAmbientColor` in `ai.tsx`
- [ ] Compute `ambientColor = getAmbientColor({ type: 'aiPct', pct: Math.round(heroAIPct) })`
- [ ] Wrap `FadeInScreen + ScrollView` in outer `View style={{ flex: 1 }}`
- [ ] Render `<AmbientBackground color={ambientColor} />` before `FadeInScreen` (behind ScrollView)

### FR5: Replace AIRingChart hero with AIArcHero
- [ ] Remove `AIRingChart` import from `ai.tsx`
- [ ] Remove `RING_SIZE = 160` constant
- [ ] Remove `Card + AIRingChart` hero block (including MetricValue overlay and delta badge)
- [ ] Remove separate BrainLift `Card` block
- [ ] Remove `BRAINLIFT_TARGET = 5` constant (now in AIArcHero)
- [ ] Add `AIArcHero` import
- [ ] Render `<AIArcHero aiPct={Math.round(heroAIPct)} brainliftHours={brainliftHours} deltaPercent={delta} ambientColor={ambientColor} />` wrapped in `Animated.View style={getEntryStyle(0)}`
- [ ] Add skeleton path: `<SkeletonLoader width={180} height={180} rounded />` when `showSkeleton`
- [ ] Update `useStaggeredEntry({ count: 5 })` (was 6)
- [ ] Verify remaining cards have correct entry style indices

---

## Phase 4.2: Review (MANDATORY)

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
- [ ] Commit fixes: `fix(04-ai-hero-arc): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(04-ai-hero-arc): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns (SVG arc, springPremium, Card wrapper)

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-16**: Spec created. Research confirmed: `getAmbientColor` aiPct mapping already exists in AmbientBackground.tsx (01-ambient-layer). `react-native-svg` + `AnimatedPath` via `useAnimatedProps` is the recommended arc animation approach.
