# Checklist: 04-skia-charts

## Phase 4.0 — Tests (Red Phase)

### FR1: colors.ts
- [x] `test(FR1)`: Write `__tests__/components/colors.test.ts`
  - [x] All tokens present: `background`, `surface`, `surfaceElevated`, `border`, `gold`, `cyan`, `violet`, `success`, `warning`, `critical`, `destructive`, `textPrimary`, `textSecondary`, `textMuted`
  - [x] Values match `tailwind.config.js` hex strings exactly (static file comparison)
  - [x] File has no external imports (source does not contain `import` or `require`)
  - [x] File contains sync warning comment (source contains `tailwind.config.js`)

### FR2: WeeklyBarChart
- [x] `test(FR2)`: Write `__tests__/components/WeeklyBarChart.test.tsx`
  - [x] Renders Canvas without crash (act + create)
  - [x] Source imports from `@/src/lib/colors` (not hardcoded hex)
  - [x] Source imports `timingChartFill` from reanimated-presets
  - [x] Source uses `withDelay` (stagger present)
  - [x] Source uses `withTiming` (not `withSpring`)
  - [x] Source does not contain hardcoded hex strings (`/#[0-9A-Fa-f]{6}/` not matched)
  - [x] `data=[]` does not crash
  - [x] Props `width` and `height` are accepted (TypeScript interface check via import)

### FR3: TrendSparkline
- [x] `test(FR3)`: Write `__tests__/components/TrendSparkline.test.tsx`
  - [x] Renders Canvas without crash
  - [x] Single data point renders without crash
  - [x] Empty `data=[]` renders without crash
  - [x] Source imports from `@/src/lib/colors`
  - [x] Source imports `timingChartFill`
  - [x] Source uses `withTiming` (not `withSpring`)
  - [x] Source does not contain hardcoded hex strings

### FR4: AIRingChart
- [x] `test(FR4)`: Write `__tests__/components/AIRingChart.test.tsx`
  - [x] Renders Canvas without crash with `aiPercent=75, size=120`
  - [x] `aiPercent=0` renders without crash
  - [x] `aiPercent=100` renders without crash
  - [x] `brainliftPercent` provided renders without crash
  - [x] `brainliftPercent` omitted renders without crash
  - [x] Source imports from `@/src/lib/colors`
  - [x] Source imports `timingChartFill`
  - [x] Source uses `withTiming` (not `withSpring`)
  - [x] Source does not contain hardcoded hex strings

### FR5: ProgressBar
- [x] `test(FR5)`: Write `__tests__/components/ProgressBar.test.tsx`
  - [x] Renders without crash
  - [x] `progress=0` renders without crash
  - [x] `progress=1` renders without crash
  - [x] `progress=0.5` renders without crash
  - [x] Source imports `timingChartFill`
  - [x] Source uses `withTiming` (not `withSpring`)
  - [x] Source does not import from `@shopify/react-native-skia` (NativeWind only)
  - [x] `colorClass` prop defaults to `'bg-success'` (source contains `bg-success`)

### Infrastructure
- [x] `test(infra)`: Create `__mocks__/@shopify/react-native-skia.ts` with Canvas/Rect/Path/Circle stubs
- [x] Update `jest.config.js` to add `@shopify/react-native-skia` to `transformIgnorePatterns`
- [x] Run tests — all RED (confirmed 126 tests failing before implementation)

---

## Phase 4.1 — Implementation

### FR1: colors.ts
- [x] `feat(FR1)`: Create `src/lib/colors.ts`
  - [x] All 14 tokens exported with exact hex values from `tailwind.config.js`
  - [x] `as const` assertion on the object
  - [x] Sync warning comment included
  - [x] Run FR1 tests — GREEN (48 passing)

### FR2: WeeklyBarChart
- [x] `feat(FR2)`: Create `src/components/WeeklyBarChart.tsx`
  - [x] Uses `@shopify/react-native-skia` Canvas + Rect
  - [x] Imports colors from `@/src/lib/colors`
  - [x] Imports `timingChartFill` from `@/src/lib/reanimated-presets`
  - [x] 7 bars with staggered `withDelay(Math.min(index * 50, 300), withTiming(...))`
  - [x] Today → `colors.gold`, future → `colors.textMuted`, past → `colors.success`
  - [x] `maxHours` defaults to `Math.max(8, Math.max(...data.map(d => d.hours)))`
  - [x] Empty data guard: no crash on `data=[]`
  - [x] Run FR2 tests — GREEN (16 passing)

### FR3: TrendSparkline
- [x] `feat(FR3)`: Create `src/components/TrendSparkline.tsx`
  - [x] Uses `@shopify/react-native-skia` Canvas + Path (+ Circle for single point)
  - [x] Imports colors from `@/src/lib/colors`
  - [x] Imports `timingChartFill`
  - [x] Bezier smooth curve through data points
  - [x] Y-axis auto-scaled with padding (10% top/bottom margin)
  - [x] Single point → Circle, not Path
  - [x] Empty data guard
  - [x] Line draw animation left-to-right via `end` prop on Path
  - [x] Run FR3 tests — GREEN (19 passing)

### FR4: AIRingChart
- [x] `feat(FR4)`: Create `src/components/AIRingChart.tsx`
  - [x] Uses `@shopify/react-native-skia` Canvas + Path
  - [x] Imports colors from `@/src/lib/colors`
  - [x] Imports `timingChartFill`
  - [x] Outer track ring: `colors.border`, full circle
  - [x] Outer fill arc: `colors.cyan`, sweep = `(aiPercent/100) * 360°`
  - [x] Inner track + fill rendered when `brainliftPercent` provided
  - [x] Inner fill arc: `colors.violet`
  - [x] Both rings animate with `withTiming(..., timingChartFill)` on mount
  - [x] `aiPercent` clamped to [0, 100]
  - [x] Component wrapped in `View` with `position: 'relative'`
  - [x] Run FR4 tests — GREEN (23 passing)

### FR5: ProgressBar
- [x] `feat(FR5)`: Create `src/components/ProgressBar.tsx`
  - [x] NativeWind View-based (no Skia)
  - [x] Outer container: `bg-border rounded-full` track, respects `height` prop
  - [x] Inner fill: Reanimated `Animated.View`, `colorClass` className, animated width
  - [x] `useSharedValue(0)` → `withTiming(progress, timingChartFill)` on prop change
  - [x] `progress` clamped to [0, 1]
  - [x] `colorClass` defaults to `'bg-success'`
  - [x] `height` defaults to `4`
  - [x] Run FR5 tests — GREEN (20 passing)

### Integration
- [x] Run full test suite — 126 new tests GREEN, no regressions introduced by our changes
  (pre-existing failures from other parallel agents unrelated to 04-skia-charts)

---

## Phase 4.2 — Review

- [x] Run spec-implementation-alignment check — PASS (all FR success criteria verified)
- [x] Run PR review — 2 issues found and fixed:
  - [x] TrendSparkline: removed dead `clipWidth` + `useDerivedValue` import
  - [x] ProgressBar: added comment explaining `as any` on percentage width string
- [x] Run test-optimiser — PASS (no changes needed, tests are behavior-focused and specific)

---

## Session Notes

**2026-03-14**: Implementation complete.
- Phase 4.0: 3 test commits (infra + FR1/FR5 + FR2/FR3/FR4), plus 1 infra fix commit (babel env guard)
- Phase 4.1: 5 implementation commits (FR1, FR5, FR2, FR3, FR4)
- Phase 4.2: 1 fix commit (dead code + comment)
- All 126 tests passing. Review complete.
- Notable: parallel agent (03-base-components) added nativewind/babel to babel.config.js with a null plugin entry that crashed jest — fixed with JEST_WORKER_ID env guard.
