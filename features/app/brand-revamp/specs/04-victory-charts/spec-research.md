# Spec Research: 04-victory-charts

**Feature:** brand-revamp
**Spec:** 04-victory-charts
**Complexity:** L

---

## Problem Context

The current charts are built with custom Skia (WeeklyBarChart, TrendSparkline, AIConeChart, AIArcHero). While technically sound, they render flat, unilluminated graphics that "shatter aesthetic immersion" when embedded in a glassmorphic dark environment. The spec mandates:

1. **WeeklyBarChart** → Victory Native XL `CartesianChart` + custom `Bar` with Skia gradient fill + cylindrical inner shadow
2. **TrendSparkline** → VNX `CartesianChart` + `Line` + `Area` with neon glow paint + gradient area fill; scrub gesture via `useChartPressState`
3. **AIArcHero** → Rebuilt with Skia `Path` + `SweepGradient` (Cyan→Violet→Magenta) + Reanimated spring `strokeEnd` animation
4. **AIConeChart** — stays custom Skia (too specialized for VNX; enhanced with better glow/opacity)

---

## Exploration Findings

### Current `WeeklyBarChart.tsx`
```typescript
// Custom Skia bars via direct path drawing
// - 7 bars, each a RRect (rounded rect) filled with flat color
// - Animation: clipProgress SharedValue clips canvas left-to-right on mount
// - Colors: todayColor (status-driven), past=success, future=textMuted
// - No gradient fill, no inner shadow
// - Props: data (number[]), todayIndex, todayColor, weeklyTarget
// - Returns: fixed-height Skia Canvas
```

### Current `TrendSparkline.tsx`
```typescript
// Custom Skia cubic bezier line chart
// - Line drawn as Skia Path (smooth cubic bezier)
// - Glow: 2 Paint layers (soft blur)
// - Scrub gesture: useScrubGesture hook + ScrubCursor (vertical line + dot)
// - externalCursorIndex prop: syncs cursor across multiple charts (07-overview-sync)
// - onScrubChange callback: emits index to parent screen
// - Props: data, color, externalCursorIndex, onScrubChange, guideLine
// - Animation: clipProgress reveals chart left-to-right on mount
// - Dependent on: useScrubGesture, ScrubCursor (from chart-interactions feature)
```

### Current `AIArcHero.tsx`
```typescript
// SVG-based arc (react-native-svg, NOT Skia)
// - Arc path (270° sweep)
// - Animated via strokeDashoffset (Reanimated → SVG animated props)
// - Bi-color flat stroke (track + progress)
// - No SweepGradient, no spring animation
// NOTE: This is SVG, not Skia — the rebuild is to Skia for consistency
```

### Victory Native XL (v41+) API

**Key components:**
```tsx
// Bar chart
<CartesianChart data={data} xKey="day" yKeys={["value"]}>
  {({ points, chartBounds }) => (
    <Bar points={points.value} chartBounds={chartBounds} roundedCorners={{ topLeft: 4, topRight: 4 }}>
      {/* Skia paint children: gradient fill, inner shadow */}
      <LinearGradient ... />
    </Bar>
  )}
</CartesianChart>

// Line chart with area fill
<CartesianChart data={data} xKey="week" yKeys={["earnings"]}
  gestureLongPressDelay={0}    // enables immediate gesture response
  renderOutside={({ chartBounds }) => <CursorComponent ... />}
>
  {({ points, chartBounds }) => (
    <>
      <Area points={points.earnings} y0={chartBounds.bottom} color="transparent">
        <LinearGradient ... />  {/* gradient fill from brand color to transparent */}
      </Area>
      <Line points={points.earnings} strokeWidth={3}>
        <BlurMaskFilter blur={6} style="solid" />  {/* neon glow */}
      </Line>
    </>
  )}
</CartesianChart>
```

**Gesture/scrub:**
```typescript
// VNX built-in gesture support for cross-hair/cursor
const { state, isActive } = useChartPressState({ x: 0, y: { earnings: 0 } });
// state.x.value.position: SharedValue<number> — pixel position of touch
// state.x.value.value: SharedValue<number> — data value at touch

// To emit onScrubChange (for overview sync):
useAnimatedReaction(
  () => state.x.position,  // SharedValue<number> (0-1 normalized)
  (pos) => {
    if (isActive.value) {
      const idx = Math.round(pos * (data.length - 1));
      runOnJS(onScrubChange)(idx);
    } else {
      runOnJS(onScrubChange)(null);
    }
  }
);
```

**External cursor (externalCursorIndex compat):**
VNX doesn't natively support external cursor positioning. To maintain the multi-chart sync from spec 07-overview-sync, the cursor position needs to be derivable from `externalCursorIndex`:
```typescript
// When externalCursorIndex is not null, render a custom cursor overlay
// positioned at: x = chartBounds.left + (externalCursorIndex / (data.length-1)) * chartBounds.width
// This is rendered via renderOutside prop (outside the chart canvas)
```

### `AIConeChart` decision
The Prime Radiant cone is a bespoke holographic visualization built with:
- Custom Skia paths for the 3D cone shape
- Layered cyan/indigo glow effects
- Scrub gesture via `useScrubGesture` (returns `AIScrubPoint`)

VNX `AreaRange` could replace the line+cone with upper/lower bounds, but would lose the holographic aesthetic that differentiates the app. Decision: **keep AIConeChart custom Skia**, but add enhanced paint effects (stronger BlurMaskFilter on lines, higher-opacity glow layers).

### New package: `victory-native`
```json
// package.json addition:
"victory-native": "^41.0.0"
```
VNX v41+ requires `@shopify/react-native-skia` (already installed 2.4.18) and `react-native-reanimated` (already installed 4.2.1). Peer deps are satisfied.

---

## Key Decisions

1. **VNX for bar + line charts only** — WeeklyBarChart and TrendSparkline migrate to VNX. AIConeChart stays custom Skia. AIArcHero rebuilds to Skia (from SVG).

2. **Preserve `externalCursorIndex` + `onScrubChange` interface** — TrendSparkline props stay identical. Internally, gesture is now `useChartPressState` (VNX) instead of `useScrubGesture`. External cursor rendered as an overlay via `renderOutside`. This is backward-compatible with 07-overview-sync.

3. **WeeklyBarChart aesthetics**: Bars get a vertical `LinearGradient` (neon status-color at peak → `rgba(color, 0)` at base). `Bar` component's rounded top corners remain (4px). `react-native-inner-shadow` provides cylindrical effect inside each bar.

4. **TrendSparkline neon glow**: Two-layer paint: outer `BlurMaskFilter(blur=8)` + inner solid stroke. Area fill: `LinearGradient` from brand color at 0.4 opacity at top to transparent at bottom.

5. **AIArcHero rebuild**: New `Skia <Path>` with `<SweepGradient>` (cyan `#00C2FF` → violet `#A78BFA` → magenta `#FF00FF`). `strokeEnd` driven by `useSharedValue(0)` → `withSpring(targetPct, { mass: 1, stiffness: 80, damping: 12 })` on mount/update. Animates from 0 → current AI%.

6. **Data format for VNX** — VNX `CartesianChart` expects `data: T[]` with typed keys. Charts will receive a normalized data format. No changes to calling code API — the transformation happens inside the component.

---

## Interface Contracts

### `WeeklyBarChart` (migrated to VNX, same external API)

```typescript
interface WeeklyBarChartProps {
  data: number[];           // 7 values (hours per day) — ← existing hook output
  todayIndex: number;       // ← existing
  todayColor: string;       // status-driven color hex — ← existing
  weeklyTarget: number;     // target line Y position — ← existing
  height?: number;          // canvas height (default 120) — ← existing
}

// Internal data shape for VNX:
type BarDatum = { day: number; value: number; color: string };
// Transformed from data[] + todayIndex + todayColor internally
```

### `TrendSparkline` (migrated to VNX, same external API)

```typescript
interface TrendSparklineProps {
  data: number[];                        // ← existing
  color?: string;                        // line/area color hex — ← existing
  guideLine?: number;                    // Y guide line position — ← existing
  externalCursorIndex?: number | null;  // cross-chart sync — ← 07-overview-sync
  onScrubChange?: (index: number | null) => void;  // ← 07-overview-sync
  height?: number;                       // ← existing
}

// Internal VNX state:
// const { state, isActive } = useChartPressState(...)
// External cursor rendered via renderOutside when externalCursorIndex !== null
```

### `AIArcHero` (rebuilt, same external API)

```typescript
interface AIArcHeroProps {
  pct: number;          // 0–100 AI usage % — ← existing
  size?: number;        // canvas size in px (default 120) — ← existing
  color?: string;       // override arc color (default: uses SweepGradient) — ← existing
  animated?: boolean;   // spring animate on mount (default: true) — ← existing
}

// Internal:
// sweepProgress: useSharedValue(0) → withSpring(pct/100)
// path: arc Path (270° sweep), strokeEnd = sweepProgress.value
// paint: SweepGradient(center, [cyan, violet, magenta], [0, 0.5, 1.0])
```

### VNX data normalization (internal utility)

```typescript
// src/lib/chartData.ts (new utility)
function toBarData(values: number[], todayIndex: number, todayColor: string): BarDatum[]
// Maps 7 values to [{day: 0, value: v, color: c}, ...]

function toLineData(values: number[]): LineDatum[]
// Maps values array to [{x: 0, y: v}, {x: 1, y: v}, ...]
```

---

## Test Plan

### `weeklyBarChartVNX`
- [ ] Renders CartesianChart with 7 data points
- [ ] Today's bar uses `todayColor` for gradient start color
- [ ] Past bars use success green gradient
- [ ] Future bars use textMuted gradient
- [ ] Bar gradient fades from full color at top to transparent at bottom
- [ ] WeeklyTarget line renders at correct Y position
- [ ] Animation: clip starts at 0 and progresses to 1 on mount
- [ ] `toBarData()` maps 7 values correctly including todayIndex color

### `trendSparklineVNX`
- [ ] Renders CartesianChart with Line and Area components
- [ ] Line has BlurMaskFilter (glow paint applied)
- [ ] Area has LinearGradient fill (brand color → transparent)
- [ ] useChartPressState is initialized
- [ ] onScrubChange called with correct index when user touches chart
- [ ] onScrubChange called with null when touch ends (isActive=false)
- [ ] externalCursorIndex !== null renders cursor overlay via renderOutside
- [ ] externalCursorIndex=null hides cursor overlay
- [ ] Cursor overlay x-position computed correctly from index and chart bounds

### `aiArcHeroSkia`
- [ ] Renders Skia Canvas with Path
- [ ] Path has SweepGradient paint (cyan → violet → magenta)
- [ ] `sweepProgress` SharedValue starts at 0
- [ ] On mount, sweepProgress animates to `pct/100` via spring
- [ ] `animated=false` skips spring (direct set to target value)
- [ ] `size` prop controls canvas dimensions

### `chartDataNormalization`
- [ ] `toBarData(values, 3, '#10B981')` returns index 3 with color '#10B981'
- [ ] `toBarData(values, 3, color)` returns indices < 3 with success color
- [ ] `toBarData(values, 3, color)` returns indices > 3 with textMuted color
- [ ] `toLineData([1, 2, 3])` returns `[{x:0,y:1},{x:1,y:2},{x:2,y:3}]`

**Mocks needed:**
- `victory-native`: CartesianChart, Bar, Line, Area, useChartPressState
- `@shopify/react-native-skia`: Canvas, Path, SweepGradient, BlurMaskFilter, LinearGradient
- `react-native-reanimated`: useSharedValue, useAnimatedReaction, withSpring

---

## Files to Reference

- `hourglassws/src/components/WeeklyBarChart.tsx` — current implementation to migrate
- `hourglassws/src/components/TrendSparkline.tsx` — current implementation to migrate
- `hourglassws/src/components/AIArcHero.tsx` — current SVG arc to rebuild as Skia
- `hourglassws/src/components/AIConeChart.tsx` — stays custom Skia (reference only)
- `hourglassws/src/hooks/useScrubGesture.ts` — being replaced by VNX useChartPressState
- `hourglassws/src/lib/colors.ts` — chart color constants
- `hourglassws/package.json` — victory-native to be added here
