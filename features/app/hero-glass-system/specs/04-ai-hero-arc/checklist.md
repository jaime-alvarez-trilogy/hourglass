# Implementation Checklist

Spec: `04-ai-hero-arc`
Feature: `hero-glass-system`

---

## Phase 4.0: Test Foundation

### FR6: arcPath pure utility function
- [x] Test: `arcPath(90, 90, 80, 135, 135)` returns string starting with "M" (degenerate case, no crash)
- [x] Test: `arcPath(90, 90, 80, 135, 405)` returns valid full 270° arc path string
- [x] Test: `arcPath(90, 90, 80, 135, 270)` returns valid 135° (50%) arc path string
- [x] Test: large arc flag = 1 when sweep > 180°
- [x] Test: large arc flag = 0 when sweep ≤ 180°
- [x] Test: returned string always starts with "M"

### FR1: AIArcHero component — arc gauge + bold AI% center
- [x] Test: renders without crash for aiPct=0, 50, 100
- [x] Test: bold AI% number rendered as center text (e.g. "75%")
- [x] Test: "AI USAGE" label rendered
- [x] Test: delta badge rendered when `deltaPercent !== null`
- [x] Test: delta badge NOT rendered when `deltaPercent === null`
- [x] Test: delta badge color is success when `deltaPercent > 0`
- [x] Test: delta badge color is critical when `deltaPercent < 0`
- [x] Test: delta badge color is textSecondary when `deltaPercent === 0`
- [x] Test: component source does not import `AIRingChart`
- [x] Test: `AI_TARGET_PCT === 75` exported constant

### FR2: BrainLift secondary metric
- [x] Test: renders `{brainliftHours.toFixed(1)}h / 5h` text
- [x] Test: ProgressBar rendered with colorClass="bg-violet"
- [x] Test: brainliftHours=0 — renders "0.0h / 5h", progress=0 (no crash)
- [x] Test: brainliftHours=5 — renders "5.0h / 5h", progress=1
- [x] Test: brainliftHours=7.3 — renders "7.3h / 5h", progress clamped at 1

### FR3: Ambient signal contract (existing getAmbientColor)
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 80 })` returns colors.violet
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 65 })` returns colors.cyan
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 50 })` returns colors.warning
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 75 })` returns colors.violet (at-boundary)
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 60 })` returns colors.cyan (at-boundary)
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 0 })` returns colors.warning

### FR4 + FR5: AI screen wiring (ai.test.tsx)
- [x] Test: `AmbientBackground` is rendered in AI screen
- [x] Test: `AmbientBackground` receives `color` derived from `getAmbientColor({ type: 'aiPct', ... })`
- [x] Test: `AIArcHero` is rendered in place of old ring hero
- [x] Test: `AIRingChart` is NOT rendered in the hero section
- [x] Test: separate BrainLift card is NOT rendered as standalone card

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [x] Run `red-phase-test-validator` agent
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Mocks return realistic data matching interface contracts
- [x] Fix any issues identified before proceeding

---

## Phase 4.1: Implementation

### FR6: arcPath pure utility function
- [x] Implement `arcPath(cx, cy, r, startAngleDeg, endAngleDeg): string` in `AIArcHero.tsx`
- [x] Handle degenerate case: `startAngleDeg === endAngleDeg` returns `M x y`
- [x] Correct large arc flag: 1 if sweep > 180°, else 0
- [x] Always clockwise sweep (sweep-flag = 1)
- [x] Export `arcPath` from `AIArcHero.tsx`

### FR1: AIArcHero component — arc gauge + bold AI% center
- [x] Create `hourglassws/src/components/AIArcHero.tsx`
- [x] Export `AI_TARGET_PCT = 75` and `BRAINLIFT_TARGET_HOURS = 5`
- [x] Render track arc (270°, `colors.border`, strokeWidth 6, strokeLinecap="round")
- [x] Render fill arc (animated via `AnimatedPath` + `useAnimatedProps`)
- [x] `fillEndAngle` useSharedValue, animated with `withSpring(springPremium)` on aiPct change
- [x] Centered bold AI% number overlay (fontSize 40, `colors.textPrimary`)
- [x] "AI USAGE" label below number (fontSize 12, `colors.textMuted`, uppercase)
- [x] Delta badge: `testID="delta-badge"`, conditional on `deltaPercent !== null`
- [x] Correct delta badge color: success/critical/textSecondary
- [x] Default `size = 180`; arc geometry uses `cx = cy = size/2`, `r = size/2 - strokeWidth/2 - 2`
- [x] Wrapped in `Card` component

### FR2: BrainLift secondary metric
- [x] Render "BRAINLIFT" label below arc
- [x] Render `{brainliftHours.toFixed(1)}h / {BRAINLIFT_TARGET_HOURS}h` text
- [x] Render `ProgressBar` with `progress={Math.min(1, brainliftHours / BRAINLIFT_TARGET_HOURS)}`, `colorClass="bg-violet"`, `height={5}`

### FR4: Wire AmbientBackground to AI screen
- [x] Import `AmbientBackground`, `getAmbientColor` in `ai.tsx`
- [x] Compute `ambientColor = getAmbientColor({ type: 'aiPct', pct: Math.round(heroAIPct) })`
- [x] Wrap `FadeInScreen + ScrollView` in outer `View style={{ flex: 1 }}`
- [x] Render `<AmbientBackground color={ambientColor} />` before `FadeInScreen` (behind ScrollView)

### FR5: Replace AIRingChart hero with AIArcHero
- [x] Remove `AIRingChart` import from `ai.tsx`
- [x] Remove `RING_SIZE = 160` constant
- [x] Remove `Card + AIRingChart` hero block (including MetricValue overlay and delta badge)
- [x] Remove separate BrainLift `Card` block
- [x] Remove `BRAINLIFT_TARGET = 5` constant (now in AIArcHero)
- [x] Add `AIArcHero` import
- [x] Render `<AIArcHero aiPct={Math.round(heroAIPct)} brainliftHours={brainliftHours} deltaPercent={delta} ambientColor={ambientColor} />` wrapped in `Animated.View style={getEntryStyle(0)}`
- [x] Add skeleton path: `<SkeletonLoader width={180} height={180} rounded />` when `showSkeleton`
- [x] Update `useStaggeredEntry({ count: 5 })` (was 6)
- [x] Verify remaining cards have correct entry style indices

---

## Phase 4.2: Review (MANDATORY)

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
- [x] Commit fixes: `fix(04-ai-hero-arc): simplify delta badge color logic`

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on modified tests
- [x] Apply suggested improvements that strengthen confidence
- [x] Re-run tests to confirm passing
- [x] Commit if changes made: (no changes needed — tests already strong)

### Final Verification
- [x] All tests passing
- [x] No regressions in existing tests
- [x] Code follows existing patterns (SVG arc, springPremium, Card wrapper)

---

## Session Notes

**2026-03-16**: Spec created. Research confirmed: `getAmbientColor` aiPct mapping already exists in AmbientBackground.tsx (01-ambient-layer). `react-native-svg` + `AnimatedPath` via `useAnimatedProps` is the recommended arc animation approach.

**2026-03-16**: Implementation complete.
- Phase 4.0: 1 test commit (test(FR1-FR6): 41 AIArcHero tests + ai.test.tsx wiring tests)
- Phase 4.1: 2 implementation commits (feat(FR1-FR3,FR6): AIArcHero component, feat(FR4-FR5): AI screen wiring)
- Phase 4.2: 1 fix commit (fix: simplify delta badge color logic)
- All tests passing. Full suite: 79 failures (all pre-existing; 0 new regressions, 15 pre-existing fixed)
- AITab.test.tsx updated to reflect new AIArcHero architecture (50/50 passing)
