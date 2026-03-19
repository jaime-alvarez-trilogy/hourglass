# 04-victory-charts

**Status:** Draft
**Created:** 2026-03-19
**Last Updated:** 2026-03-19
**Owner:** @trilogy

---

## Overview

This spec migrates the Hourglass chart layer from bespoke Skia canvas drawing to **Victory Native XL (VNX) v41+**, while preserving all external component APIs so no calling code changes. A new utility module (`src/lib/chartData.ts`) normalizes raw data arrays into VNX-typed records. `AIArcHero` is rebuilt from SVG to Skia for visual consistency with the new dark-glass aesthetic. `AIConeChart` is intentionally excluded — it is a bespoke holographic visualization that VNX cannot replicate.

### What is being built

1. **`src/lib/chartData.ts`** (new) — Two pure functions: `toBarData()` and `toLineData()`. These convert the raw `number[]` props that callers pass into typed VNX datum objects. All chart components call these internally; no changes propagate upstream.

2. **`WeeklyBarChart.tsx`** (migration) — The current bespoke Skia `Rect` bar drawing is replaced with a VNX `CartesianChart` + `Bar` component. Each bar gets a vertical `LinearGradient` (status color at peak → transparent at base). The `Animated.View` clip animation is preserved via the same `clipProgress` pattern. External prop API (`DailyHours[]`, `width`, `height`, `weeklyLimit`, `todayColor`, `maxHours`, `watermarkLabel`) is **unchanged**.

3. **`TrendSparkline.tsx`** (migration) — The custom cubic bezier `Path` is replaced with VNX `CartesianChart` + `Line` + `Area`. The neon glow is achieved via `BlurMaskFilter` as a child paint of `Line`. The area fill uses `LinearGradient` from brand color (40% opacity) to transparent. The internal scrub gesture is replaced with VNX `useChartPressState`; the `externalCursorIndex` / `onScrubChange` props remain identical, with the external cursor rendered as an overlay via `renderOutside`. External prop API is **unchanged**.

4. **`AIArcHero.tsx`** (rebuild) — The SVG-based arc (`react-native-svg`) is replaced with a Skia `Canvas` + `Path`. The arc stroke paint uses `SweepGradient` (cyan `#00C2FF` → violet `#A78BFA` → magenta `#FF00FF`). The fill animation moves from `strokeDashoffset` (SVG) to `sweepProgress` SharedValue → Skia `Path.trim()`. The external props and exported constants are preserved.

5. **`package.json` + `package-lock.json`** — `victory-native: "^41.0.0"` added. Peer deps are already satisfied.

### How it fits into brand-revamp

This spec (04) depends only on 01-design-tokens. It does not block any other brand-revamp spec and can land independently. The `externalCursorIndex` / `onScrubChange` interface it preserves is consumed by 07-overview-sync (chart-interactions feature, already complete and must stay green).

---

## Out of Scope

1. **AIConeChart VNX migration** — **Descoped.** The Prime Radiant cone is a bespoke holographic visualization (custom Skia paths, 3D cone shape, layered glow). VNX has no equivalent. No action needed.

2. **`useScrubGesture` hook deletion** — **Deferred to a future cleanup spec.** `AIConeChart` still depends on it; removing it is a separate concern.

3. **`ScrubCursor` component deletion** — **Deferred to a future cleanup spec.** Same rationale as `useScrubGesture`.

4. **`react-native-inner-shadow` for WeeklyBarChart cylindrical effect** — **Deferred to 03-glass-surfaces.** That spec adds the `react-native-inner-shadow` package. WeeklyBarChart's cylindrical InnerShadow can be layered on after the package lands. This spec delivers the LinearGradient fill only.

5. **Android widget data flow changes** — **Descoped.** Widget bridge passes raw data values unaffected by chart rendering changes.

6. **Guide line / capLabel typography redesign** — **Descoped.** Guide line and cap label are preserved as-is; no typographic redesign in this spec.

7. **New screens or data model changes** — **Descoped.** Visual/aesthetic migration only.

8. **SKSL fragment shaders** — **Descoped.** Feature-level decision: declarative Skia gradients only.

---

## Functional Requirements

### FR1 — chartData utility (`src/lib/chartData.ts`)

**What:** New pure-function utility module that normalizes raw `number[]` arrays into VNX-typed datum objects. Used internally by `WeeklyBarChart` and `TrendSparkline`; never imported by calling screens.

**Success Criteria:**

- SC1.1 — `toBarData(values: number[], todayIndex: number, todayColor: string): BarDatum[]` exists and is exported
- SC1.2 — `toLineData(values: number[]): LineDatum[]` exists and is exported
- SC1.3 — `BarDatum` is `{ day: number; value: number; color: string }`
- SC1.4 — `LineDatum` is `{ x: number; y: number }`
- SC1.5 — `toBarData` assigns `todayColor` to the element at `todayIndex`
- SC1.6 — `toBarData` assigns `colors.success` (`#10B981`) to elements before `todayIndex` (past days)
- SC1.7 — `toBarData` assigns `colors.textMuted` (`#757575`) to elements after `todayIndex` (future days)
- SC1.8 — `toBarData([1,2,3,4,5,6,7], 3, '#10B981')` returns 7 elements with correct colors at all indices
- SC1.9 — `toLineData([1, 2, 3])` returns `[{x:0,y:1},{x:1,y:2},{x:2,y:3}]`
- SC1.10 — `toLineData([])` returns `[]` (no crash)
- SC1.11 — `toBarData([], 0, '#fff')` returns `[]` (no crash)

---

### FR2 — WeeklyBarChart VNX migration

**What:** Migrate `WeeklyBarChart.tsx` from bespoke Skia `Rect` bars to VNX `CartesianChart` + `Bar`. Preserve the external prop interface exactly. Each bar gets a vertical `LinearGradient` fill (peak color → transparent base). The `Animated.View` clip animation (clipProgress 0→1 on mount) is preserved.

**Success Criteria:**

- SC2.1 — External prop interface `WeeklyBarChartProps` remains identical (fields: `data: DailyHours[]`, `maxHours?`, `width`, `height`, `weeklyLimit?`, `todayColor?`, `watermarkLabel?`)
- SC2.2 — Component imports `CartesianChart` and `Bar` from `victory-native`
- SC2.3 — Component passes the result of `toBarData(...)` as the `data` prop to `CartesianChart`
- SC2.4 — `CartesianChart` uses `xKey="day"` and `yKeys={["value"]}`
- SC2.5 — Each bar's `LinearGradient` uses the bar's color (from `BarDatum.color`) as the start (top) color
- SC2.6 — `LinearGradient` end color is transparent (same hue at 0 opacity or `'transparent'`)
- SC2.7 — Bars have rounded top corners (4px radius)
- SC2.8 — The `clipProgress` SharedValue animates from 0 to 1 on mount via `withTiming(1, timingChartFill)`
- SC2.9 — Overtime coloring (`weeklyLimit`) logic is preserved — bars whose running cumulative total exceeds `weeklyLimit` use `OVERTIME_WHITE_GOLD` (`#FFF8E7`)
- SC2.10 — Today bar uses `todayColor` (default `colors.success`)
- SC2.11 — Future bars use `colors.textMuted`
- SC2.12 — Component renders without crash for `data=[]` or `width=0`
- SC2.13 — Watermark label (`watermarkLabel` prop) is preserved with opacity ≤ 0.10

---

### FR3 — TrendSparkline VNX migration

**What:** Migrate `TrendSparkline.tsx` from bespoke Skia bezier path to VNX `CartesianChart` + `Line` + `Area`. Replace `useScrubGesture` with `useChartPressState`. Preserve the full external prop interface. Neon glow via `BlurMaskFilter` child of `Line`. Area fill via `LinearGradient`. External cursor via `renderOutside`.

**Success Criteria:**

- SC3.1 — External prop interface `TrendSparklineProps` remains identical (fields: `data`, `width`, `height`, `color?`, `strokeWidth?`, `maxValue?`, `showGuide?`, `capLabel?`, `targetValue?`, `onScrubChange?`, `weekLabels?`, `externalCursorIndex?`)
- SC3.2 — Component imports `CartesianChart`, `Line`, `Area`, `useChartPressState` from `victory-native`
- SC3.3 — Component passes `toLineData(data)` output as the `data` prop to `CartesianChart`
- SC3.4 — `CartesianChart` uses `xKey="x"` and `yKeys={["y"]}`
- SC3.5 — `Line` renders with a `BlurMaskFilter` child (neon glow paint, blur ≥ 6)
- SC3.6 — `Area` renders with a `LinearGradient` fill (brand color to transparent)
- SC3.7 — `useChartPressState` is used for gesture handling (replaces `useScrubGesture`)
- SC3.8 — When `isActive` is true, `onScrubChange` is called with the nearest data index
- SC3.9 — When `isActive` becomes false, `onScrubChange` is called with `null`
- SC3.10 — When `externalCursorIndex` is not null, a cursor overlay is rendered via `renderOutside` at the computed x position
- SC3.11 — When `externalCursorIndex` is null, no cursor overlay is rendered
- SC3.12 — Cursor x position: `chartBounds.left + (externalCursorIndex / (data.length - 1)) * chartBounds.width`
- SC3.13 — Component renders without crash for `data=[]` or `width=0`
- SC3.14 — `showGuide` / `capLabel` / `targetValue` guide line behavior is preserved
- SC3.15 — Entry animation (clipProgress or equivalent) is preserved

---

### FR4 — AIArcHero Skia rebuild

**What:** Rebuild `AIArcHero.tsx` from SVG (`react-native-svg`) to Skia (`@shopify/react-native-skia`). Replace flat stroke with `SweepGradient` (cyan → violet → magenta). Replace `strokeDashoffset` animation with `sweepProgress` SharedValue → `Path.trim()`. Preserve all external props and exported constants.

**Success Criteria:**

- SC4.1 — `react-native-svg` import is removed; `@shopify/react-native-skia` is imported instead
- SC4.2 — Component renders a Skia `Canvas` with a `Path` for the arc
- SC4.3 — Arc `Path` has a `SweepGradient` child with colors `['#00C2FF', '#A78BFA', '#FF00FF']`
- SC4.4 — `sweepProgress` SharedValue initializes at 0 on mount
- SC4.5 — On mount, `sweepProgress` animates to `aiPct/100` via `withSpring` (mass=1, stiffness=80, damping=12)
- SC4.6 — On `aiPct` change, animation re-triggers to the new target
- SC4.7 — External prop interface preserved: `aiPct`, `brainliftHours`, `deltaPercent`, `ambientColor`, `size?` (default 180)
- SC4.8 — `AI_TARGET_PCT` and `BRAINLIFT_TARGET_HOURS` constants remain exported
- SC4.9 — `arcPath` function remains exported (backward compat)
- SC4.10 — Center text shows `{aiPct}%` and "AI USAGE" label
- SC4.11 — Delta badge shows when `deltaPercent !== null`
- SC4.12 — BrainLift secondary metric with `ProgressBar` is preserved
- SC4.13 — Component renders without crash for `aiPct=0`, `aiPct=100`, `aiPct=75`
- SC4.14 — `size` prop controls canvas dimensions

---

## Technical Design

### Files to Reference

| File | Role |
|------|------|
| `hourglassws/src/components/WeeklyBarChart.tsx` | Current bespoke Skia bar chart — to be migrated |
| `hourglassws/src/components/TrendSparkline.tsx` | Current bespoke Skia bezier line chart — to be migrated |
| `hourglassws/src/components/AIArcHero.tsx` | Current SVG arc — to be rebuilt as Skia |
| `hourglassws/src/components/AIConeChart.tsx` | Stays custom Skia — reference only |
| `hourglassws/src/hooks/useScrubGesture.ts` | Being replaced by `useChartPressState` in TrendSparkline |
| `hourglassws/src/lib/colors.ts` | Chart color constants |
| `hourglassws/src/lib/reanimated-presets.ts` | `timingChartFill` preset |
| `hourglassws/package.json` | Add `victory-native: "^41.0.0"` |

### Files to Create

| File | What |
|------|------|
| `hourglassws/src/lib/chartData.ts` | `toBarData()` and `toLineData()` normalizers |
| `hourglassws/src/lib/__tests__/chartData.test.ts` | FR1 unit tests |
| `hourglassws/src/components/__tests__/WeeklyBarChartVNX.test.tsx` | FR2 tests |
| `hourglassws/src/components/__tests__/TrendSparklineVNX.test.tsx` | FR3 tests |
| `hourglassws/src/components/__tests__/AIArcHeroSkia.test.tsx` | FR4 tests |

### Files to Modify

| File | Changes |
|------|---------|
| `hourglassws/src/components/WeeklyBarChart.tsx` | Replace Skia Rect bars with VNX CartesianChart + Bar + LinearGradient |
| `hourglassws/src/components/TrendSparkline.tsx` | Replace Skia Path with VNX CartesianChart + Line + Area + useChartPressState |
| `hourglassws/src/components/AIArcHero.tsx` | Replace react-native-svg with Skia Canvas + Path + SweepGradient |
| `hourglassws/package.json` | Add victory-native dependency |
| `hourglassws/package-lock.json` | Updated by npm install |

### Data Flow

#### WeeklyBarChart

```
DailyHours[] props
  → compute runningTotal per bar (for overtime detection)
  → derive todayIndex = data.findIndex(d => d.isToday)
  → derive color per bar (overtime → OVERTIME_WHITE_GOLD, today → todayColor, past → success, future → textMuted)
  → toBarData(values, todayIndex, todayColor) with pre-derived per-bar colors
  → CartesianChart(data=barData, xKey="day", yKeys=["value"])
  → Bar(points, chartBounds, roundedCorners={topLeft:4, topRight:4})
      → LinearGradient(start=[0,0], end=[0,1], colors=[barDatum.color, 'transparent'])
  → Animated.View clip (clipProgress 0→1, timingChartFill)
```

#### TrendSparkline

```
number[] data prop
  → toLineData(data) → LineDatum[] [{x, y}]
  → CartesianChart(data=lineData, xKey="x", yKeys=["y"], gestureLongPressDelay=0)
      renderOutside: externalCursorIndex !== null →
        cursor overlay at x = left + (idx/(n-1)) * width
  → Line(points.y) + BlurMaskFilter(blur=8) child
  → Area(points.y, y0=chartBounds.bottom) + LinearGradient

  useChartPressState({ x: 0, y: { y: 0 } })
  → useAnimatedReaction(isActive, state.x.position) → runOnJS(onScrubChange)
```

#### AIArcHero

```
aiPct prop
  → sweepProgress = useSharedValue(0)
  → useEffect([aiPct]): sweepProgress.value = withSpring(aiPct/100, springConfig)
  → trimmedPath = useDerivedValue(() => {
      const p = fullArcPath.copy();
      p.trim(0, sweepProgress.value, false);
      return p;
    })
  → Canvas → Path(path=trimmedPath) → SweepGradient(['#00C2FF','#A78BFA','#FF00FF'])
  (track arc: full path, no gradient, colors.border stroke)
  (center text, delta badge, BrainLift: unchanged)
```

### Dependency Graph (FR ordering)

```
FR1 (chartData utility) ← must land first
  ├── FR2 (WeeklyBarChart) — imports toBarData
  └── FR3 (TrendSparkline) — imports toLineData
FR4 (AIArcHero) — independent, can land in parallel with FR2/FR3
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| `data=[]` in WeeklyBarChart | Return null |
| `width=0` in WeeklyBarChart | Return null |
| `data=[]` in TrendSparkline | Return null |
| `data=[x]` (single point) in TrendSparkline | Render a dot at center |
| All zeros in TrendSparkline | Flat line at vertical center |
| `aiPct=0` in AIArcHero | sweepProgress → 0 → invisible arc |
| `aiPct=100` in AIArcHero | sweepProgress → 1 → full 270° arc |
| `externalCursorIndex` out-of-range | Clamp to [0, data.length-1] |

### Mock Strategy for Tests

```typescript
// victory-native — inline jest.mock in each test file
jest.mock('victory-native', () => ({
  CartesianChart: ({ children, data }: any) =>
    children?.({ points: { value: [], y: [] }, chartBounds: { left: 0, right: 300, top: 0, bottom: 120, width: 300, height: 120 } }) ?? null,
  Bar: ({ children }: any) => children ?? null,
  Line: ({ children }: any) => children ?? null,
  Area: ({ children }: any) => children ?? null,
  useChartPressState: () => ({
    state: { x: { position: { value: 0 }, value: { value: 0 } }, y: { y: { value: { value: 0 } } } },
    isActive: { value: false },
  }),
}));

// @shopify/react-native-skia — existing __mocks__ in project
// react-native-reanimated — jest-expo preset
// react-native-svg — existing mock in AIArcHero.test.tsx (keep for compat)
```

### Package Installation

```bash
cd hourglassws && npm install victory-native@^41.0.0
```

No metro.config.js changes needed — VNX uses Skia which is already configured. No Babel plugin changes needed.
