# Implementation Checklist

Spec: `04-victory-charts`
Feature: `brand-revamp`

---

## Phase 1.0: Test Foundation

### FR1: chartData utility (`src/lib/chartData.ts`)
- [ ] Write `chartData.test.ts` — `toBarData` returns correct color for todayIndex
- [ ] Write `chartData.test.ts` — `toBarData` returns `colors.success` for past indices (< todayIndex)
- [ ] Write `chartData.test.ts` — `toBarData` returns `colors.textMuted` for future indices (> todayIndex)
- [ ] Write `chartData.test.ts` — `toBarData([1..7], 3, '#10B981')` returns 7 elements with correct all-index colors
- [ ] Write `chartData.test.ts` — `toLineData([1,2,3])` returns `[{x:0,y:1},{x:1,y:2},{x:2,y:3}]`
- [ ] Write `chartData.test.ts` — `toLineData([])` returns `[]` (no crash)
- [ ] Write `chartData.test.ts` — `toBarData([], 0, '#fff')` returns `[]` (no crash)
- [ ] Write `chartData.test.ts` — `BarDatum` shape: `{ day: number; value: number; color: string }`
- [ ] Write `chartData.test.ts` — `LineDatum` shape: `{ x: number; y: number }`

### FR2: WeeklyBarChart VNX migration
- [ ] Write `WeeklyBarChartVNX.test.tsx` — source imports `CartesianChart` and `Bar` from `victory-native`
- [ ] Write `WeeklyBarChartVNX.test.tsx` — source passes `toBarData` output as `data` to `CartesianChart`
- [ ] Write `WeeklyBarChartVNX.test.tsx` — `CartesianChart` uses `xKey="day"` and `yKeys=["value"]`
- [ ] Write `WeeklyBarChartVNX.test.tsx` — each bar `LinearGradient` start color matches bar's color
- [ ] Write `WeeklyBarChartVNX.test.tsx` — overtime coloring (`weeklyLimit`) preserved (`OVERTIME_WHITE_GOLD`)
- [ ] Write `WeeklyBarChartVNX.test.tsx` — today bar uses `todayColor`, future bars use `textMuted`
- [ ] Write `WeeklyBarChartVNX.test.tsx` — `clipProgress` + `timingChartFill` entry animation preserved
- [ ] Write `WeeklyBarChartVNX.test.tsx` — renders without crash for `data=[]` and `width=0`
- [ ] Write `WeeklyBarChartVNX.test.tsx` — `WeeklyBarChartProps` interface unchanged (all existing props present)
- [ ] Write `WeeklyBarChartVNX.test.tsx` — watermark label preserved at opacity ≤ 0.10

### FR3: TrendSparkline VNX migration
- [ ] Write `TrendSparklineVNX.test.tsx` — source imports `CartesianChart`, `Line`, `Area`, `useChartPressState` from `victory-native`
- [ ] Write `TrendSparklineVNX.test.tsx` — source passes `toLineData` output as `data` to `CartesianChart`
- [ ] Write `TrendSparklineVNX.test.tsx` — `Line` has `BlurMaskFilter` child (blur ≥ 6)
- [ ] Write `TrendSparklineVNX.test.tsx` — `Area` has `LinearGradient` fill
- [ ] Write `TrendSparklineVNX.test.tsx` — `useChartPressState` is used (not `useScrubGesture`)
- [ ] Write `TrendSparklineVNX.test.tsx` — `onScrubChange` called with index when `isActive=true`
- [ ] Write `TrendSparklineVNX.test.tsx` — `onScrubChange` called with `null` when `isActive` becomes false
- [ ] Write `TrendSparklineVNX.test.tsx` — `externalCursorIndex !== null` renders cursor overlay via `renderOutside`
- [ ] Write `TrendSparklineVNX.test.tsx` — `externalCursorIndex=null` hides cursor overlay
- [ ] Write `TrendSparklineVNX.test.tsx` — cursor x-position formula correct
- [ ] Write `TrendSparklineVNX.test.tsx` — renders without crash for `data=[]` and `width=0`
- [ ] Write `TrendSparklineVNX.test.tsx` — `TrendSparklineProps` interface unchanged (all existing props present)

### FR4: AIArcHero Skia rebuild
- [ ] Write `AIArcHeroSkia.test.tsx` — source imports from `@shopify/react-native-skia`, NOT `react-native-svg`
- [ ] Write `AIArcHeroSkia.test.tsx` — source renders Skia `Canvas` and `Path`
- [ ] Write `AIArcHeroSkia.test.tsx` — source has `SweepGradient` with colors `['#00C2FF', '#A78BFA', '#FF00FF']`
- [ ] Write `AIArcHeroSkia.test.tsx` — `sweepProgress = useSharedValue(0)` initializes at 0
- [ ] Write `AIArcHeroSkia.test.tsx` — `withSpring` used in animation (not `withTiming`)
- [ ] Write `AIArcHeroSkia.test.tsx` — `AI_TARGET_PCT`, `BRAINLIFT_TARGET_HOURS`, `arcPath` remain exported
- [ ] Write `AIArcHeroSkia.test.tsx` — center text shows `{aiPct}%` and "AI USAGE" label
- [ ] Write `AIArcHeroSkia.test.tsx` — delta badge shows when `deltaPercent !== null`
- [ ] Write `AIArcHeroSkia.test.tsx` — renders without crash for `aiPct=0`, `aiPct=75`, `aiPct=100`
- [ ] Write `AIArcHeroSkia.test.tsx` — `size` prop controls canvas dimensions (default 180)

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### Pre-step: Install victory-native
- [ ] Run `cd hourglassws && npm install victory-native@^41.0.0`
- [ ] Verify `package.json` has `"victory-native": "^41.x.x"`

### FR1: chartData utility
- [ ] Create `hourglassws/src/lib/chartData.ts`
- [ ] Implement `BarDatum` type: `{ day: number; value: number; color: string }`
- [ ] Implement `LineDatum` type: `{ x: number; y: number }`
- [ ] Implement `toBarData(values, todayIndex, todayColor)` with correct past/today/future color logic
- [ ] Implement `toLineData(values)` mapping index to x, value to y
- [ ] Verify all FR1 tests pass

### FR2: WeeklyBarChart VNX migration
- [ ] Add `import { CartesianChart, Bar } from 'victory-native'` to `WeeklyBarChart.tsx`
- [ ] Add `import { toBarData } from '@/src/lib/chartData'`
- [ ] Add `LinearGradient` from `@shopify/react-native-skia` if not already imported
- [ ] Pre-compute per-bar colors (overtime, today, past, future) before calling `toBarData`
- [ ] Replace bespoke `Rect` bar drawing with `CartesianChart` + `Bar` + `LinearGradient`
- [ ] Configure `Bar` with `roundedCorners={{ topLeft: 4, topRight: 4 }}`
- [ ] Preserve `clipProgress` / `Animated.View` clip animation pattern
- [ ] Preserve overtime coloring logic (`OVERTIME_WHITE_GOLD`, `runningTotal`, `weeklyLimit`)
- [ ] Preserve watermark label rendering with opacity ≤ 0.10
- [ ] Verify all FR2 tests pass; verify existing WeeklyBarChart tests still pass

### FR3: TrendSparkline VNX migration
- [ ] Add `import { CartesianChart, Line, Area, useChartPressState } from 'victory-native'`
- [ ] Add `import { toLineData } from '@/src/lib/chartData'`
- [ ] Remove `import { useScrubGesture }` and `import { buildScrubCursor }`
- [ ] Replace `useScrubGesture` with `useChartPressState({ x: 0, y: { y: 0 } })`
- [ ] Replace bespoke `Path` bezier with `CartesianChart` + `Line` + `BlurMaskFilter` + `Area` + `LinearGradient`
- [ ] Implement `renderOutside` cursor overlay for `externalCursorIndex`
- [ ] Implement `useAnimatedReaction` → `runOnJS(onScrubChange)` for scrub callbacks
- [ ] Preserve `showGuide` / `capLabel` / `targetValue` guide line behavior
- [ ] Preserve entry animation (clipProgress or VNX equivalent)
- [ ] Verify all FR3 tests pass; verify existing TrendSparkline tests still pass

### FR4: AIArcHero Skia rebuild
- [ ] Remove `import Svg, { Path } from 'react-native-svg'`
- [ ] Add `import { Canvas, Path, SweepGradient, ... } from '@shopify/react-native-skia'`
- [ ] Add `import { withSpring } from 'react-native-reanimated'`
- [ ] Replace `dashOffset = useSharedValue(arcLength)` with `sweepProgress = useSharedValue(0)`
- [ ] Build full arc as Skia Path in render scope (from `arcPath` utility, via `Skia.Path.MakeFromSVGString`)
- [ ] Implement `trimmedPath = useDerivedValue(() => { const p = fullPath.copy(); p.trim(0, sweepProgress.value, false); return p; })`
- [ ] Implement `useEffect([aiPct]): sweepProgress.value = withSpring(aiPct/100, { mass:1, stiffness:80, damping:12 })`
- [ ] Render `Canvas` with track arc (`Path`, full 270°, `colors.border` stroke)
- [ ] Render `Canvas` with fill arc (`Path`, trimmedPath, `SweepGradient` paint)
- [ ] Preserve center text, delta badge, BrainLift section (unchanged)
- [ ] Preserve exported constants: `AI_TARGET_PCT`, `BRAINLIFT_TARGET_HOURS`, `arcPath`
- [ ] Verify all FR4 tests pass; verify existing AIArcHero tests pass (or update assertions for Skia)

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
- [ ] Commit fixes: `fix(04-victory-charts): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(04-victory-charts): strengthen test assertions`

### Final Verification
- [ ] All tests passing (including existing WeeklyBarChart, TrendSparkline, AIArcHero suites)
- [ ] No regressions in existing tests (especially 07-overview-sync related tests)
- [ ] `victory-native` installed and resolving correctly
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-19**: Spec created. Dependency: 01-design-tokens complete. FR1 must land before FR2/FR3. FR4 is independent.
