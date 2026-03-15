# 02-cone-chart: AIConeChart Skia Component

**Status:** Draft
**Created:** 2026-03-15
**Last Updated:** 2026-03-15
**Owner:** @trilogy

---

## Overview

### What Is Being Built

`AIConeChart` is a Skia canvas component that renders the Prime Radiant visualization — an animated chart showing a contributor's AI% trajectory (past) and possibility cone (future). It ships in two variants:

- `full` — used on the AI tab, full height (~240px), with X/Y axis labels
- `compact` — used on the home tab card, condensed height (~100px), no axis labels

### How It Works

The chart receives a `ConeData` object (computed upstream by `computeAICone()`) and `width`/`height` dimensions from the parent's `onLayout` measurement. It renders five visual layers:

1. **Actual line** — a smooth path tracing historical AI% from (0,0) to `(currentHours, currentAIPct)`. Animates left-to-right via path clip (`end` prop) over 1800ms using `timingChartFill`.
2. **Possibility cone** — a closed filled path from `upperBound` + `lowerBound` points. Semi-transparent `colors.cyan` fill at 15% opacity. Fades in simultaneously with the line draw.
3. **75% target line** — a horizontal dashed reference line at `targetPct` (always 75). Styled as `colors.warning` at 50% opacity.
4. **Current position dot** — a `colors.cyan` dot at the junction of actual line and cone. Fades in when line draw reaches it (progress ≈ 0.6), then pulses once.
5. **Axis labels** (`full` only) — hour markers on X (0, 10, 20, 30, 40) and percentage markers on Y (0%, 50%, 75%, 100%) drawn as Skia `Text` elements.

### Animation Model

```
progress: SharedValue<number>  0 → 1 via timingChartFill (1800ms, expo ease-out)

Actual line:    Path end = min(progress / 0.6, 1)    ← draws 0→1 in first 60% of anim
Cone opacity:   progress                              ← fades in over full duration
Dot opacity:    clamp((progress - 0.6) / 0.4, 0, 1)  ← appears at 60%, full at 100%
Dot pulse:      withTiming sequence after dot appears (once, 200ms up + 200ms down)
```

When `useReducedMotion()` is true, `progress` is set to `1` immediately with no animation.

### Coordinate System

```
toPixel(hoursX, pctY, dims, weeklyLimit, padding) → { x, y }

X: hoursX ∈ [0, weeklyLimit]  →  [paddingLeft, width - paddingRight]
Y: pctY   ∈ [0, 100]          →  [height - paddingBottom, paddingTop]  (inverted)
```

Padding values differ by size variant:
- `full`:    `{ top: 16, right: 16, bottom: 28, left: 36 }` (space for axis labels)
- `compact`: `{ top: 8,  right: 8,  bottom: 8,  left: 8  }` (minimal)

### Dependency

Depends on `src/lib/aiCone.ts` (spec `01-cone-math`) for the `ConeData` and `ConePoint` types. No data fetching — caller is responsible for computing `ConeData` before passing to this component.

---

## Out of Scope

1. **Data fetching / computeAICone() call** — **Deferred to [03-ai-tab-integration](../../03-ai-tab-integration/spec-research.md):** The chart receives pre-computed `ConeData`. Wiring `useAIData()` + `useConfig()` into the AI tab and home tab is handled in spec `03-ai-tab-integration`.

2. **Integration into AI tab (`app/(tabs)/ai.tsx`)** — **Deferred to [03-ai-tab-integration](../../03-ai-tab-integration/spec-research.md):** Screen-level placement, scroll layout, and data binding are out of scope for this component spec.

3. **Integration into home tab (`app/(tabs)/index.tsx`)** — **Deferred to [03-ai-tab-integration](../../03-ai-tab-integration/spec-research.md):** Same as above for the compact card placement.

4. **Tap/interaction on the compact card** — **Descoped:** The compact variant is view-only per the feature spec. Navigation to the AI tab on tap is a future enhancement.

5. **Historical week-over-week trends** — **Descoped:** Not part of this feature. This chart shows the current week only.

6. **Goal setting / custom target percentage** — **Descoped:** Target is hardcoded at 75% per `ConeData.targetPct`. User-configurable targets are a future feature.

7. **Notifications when trajectory falls below 75%** — **Descoped:** Separate notifications feature. This component is display-only.

8. **Dark/light theme switching** — **Descoped:** App is dark-only. All colors sourced from `colors.ts` which defines dark tokens only.

9. **`useFocusKey()` re-animation** — **Descoped:** The parent screen is responsible for key-mounting the chart to trigger re-animation. This spec only covers the chart's own mount animation.

---

## Functional Requirements

### FR1: Types and Props Contract

Define the public interface for `AIConeChart`.

**Success Criteria:**

- `AIConeChartProps` interface exported from `src/components/AIConeChart.tsx`:
  ```typescript
  export interface AIConeChartProps {
    data: ConeData;              // from computeAICone() — caller computes
    width: number;               // canvas width (from parent onLayout)
    height: number;              // canvas height (from parent onLayout)
    size?: 'full' | 'compact';  // 'full' shows axis labels; default: 'full'
  }
  ```
- `AIConeChart` is the default export
- Component returns `null` when `width === 0` or `height === 0`
- `size` defaults to `'full'` when omitted

---

### FR2: toPixel Coordinate Helper

Internal function that maps data-space coordinates to canvas pixel coordinates.

**Success Criteria:**

- `toPixel(hoursX, pctY, dims, weeklyLimit, padding)` returns `{ x: number, y: number }`
- X mapping: `hoursX = 0` → `paddingLeft`; `hoursX = weeklyLimit` → `width - paddingRight`
- Y mapping: `pctY = 0` → `height - paddingBottom` (bottom); `pctY = 100` → `paddingTop` (top) — Y axis is inverted
- `weeklyLimit <= 0` does not cause division by zero (guard returns center point)
- Not exported (internal to component)

---

### FR3: buildActualPath

Constructs the Skia path for the historical AI% trajectory line.

**Success Criteria:**

- Signature: `buildActualPath(points: ConePoint[], toPixelFn: ToPixelFn): SkPath`
- With 2+ points: path starts at pixel coords for `points[0]` and visits each subsequent point via line segments
- With 1 point: returns a path with a single `moveTo` (degenerate — no lines drawn)
- With 0 points: returns an empty path without throwing
- Exported as named export

---

### FR4: buildConePath

Constructs the closed Skia path for the possibility cone fill area.

**Success Criteria:**

- Signature: `buildConePath(upper: ConePoint[], lower: ConePoint[], toPixelFn: ToPixelFn): SkPath`
- With non-empty upper and lower: path traces upper left-to-right, then lower right-to-left, then closes — forming a closed polygon
- Resulting path is closed (ends with `.close()`)
- With empty upper or lower: returns empty path without throwing
- With single-point arrays: returns a degenerate closed path at one pixel point
- Exported as named export

---

### FR5: buildTargetLinePath

Constructs the horizontal dashed reference line at the target percentage.

**Success Criteria:**

- Signature: `buildTargetLinePath(targetPct: number, weeklyLimit: number, toPixelFn: ToPixelFn): SkPath`
- Line spans from `hoursX = 0` to `hoursX = weeklyLimit` at Y position for `pctY = targetPct`
- Returns a 2-point line path (M + L)
- Exported as named export

---

### FR6: Chart Rendering — Layers

The component renders all visual layers in a Skia `Canvas`.

**Success Criteria:**

- Renders inside `<Canvas style={{ width, height }}>` with return `null` guard for zero dimensions
- Layer order (bottom to top): cone fill → cone boundary strokes → target line → actual line → current dot → axis labels
- **Cone fill:** `buildConePath` result, `style="fill"`, `colors.cyan` at 15% opacity (`opacity * animState.coneOpacity`)
- **Cone boundary strokes:** upper and lower edge paths, `style="stroke"`, `strokeWidth={1}`, `colors.cyan` at 30% opacity
- **Target line:** `buildTargetLinePath` result, `style="stroke"`, `strokeWidth={1}`, `colors.warning` at 50% opacity, dash intervals `[6, 4]`
- **Actual line:** `buildActualPath` result, `style="stroke"`, `strokeWidth={2}`, `strokeCap="round"`, `colors.cyan`, `end={animState.lineEnd}`
- **Current dot:** `<Circle>` at pixel of `(data.currentHours, data.currentAIPct)`, radius `dotRadius`, `colors.cyan`, `opacity={animState.dotOpacity}`

---

### FR7: Animation

Animate the chart on mount using a progress SharedValue bridge.

**Success Criteria:**

- `progress` SharedValue: initializes at 0, animates to 1 via `withTiming(1, timingChartFill)` on mount
- When `useReducedMotion()` returns true: `progress.value = 1` directly (no timing)
- Animation state bridged to React state via `useAnimatedReaction` + `runOnJS` (avoids Skia/Fabric SharedValue prop crash)
- `animState`: `{ lineEnd: number; coneOpacity: number; dotOpacity: number }` computed from progress:
  - `lineEnd = Math.min(progress / 0.6, 1)`
  - `coneOpacity = progress`
  - `dotOpacity = Math.min(Math.max((progress - 0.6) / 0.4, 0), 1)`
- Dot pulse: once `dotOpacity >= 1`, animate dot radius `4 → 7 → 4` via two sequential `withTiming` calls (200ms each), only once (ref guard)

---

### FR8: Axis Labels (full variant only)

Render axis tick labels when `size === 'full'`.

**Success Criteria:**

- When `size === 'full'`: Skia `Text` elements rendered for tick labels
- X-axis labels: hours `[0, 10, 20, 30, 40]` — only ticks where `tick <= weeklyLimit` are rendered
- Y-axis labels: `['0%', '50%', '75%', '100%']` at Y pixels for `[0, 50, 75, 100]`
- Font: `matchFont({ fontFamily: 'System', fontSize: 10 })`, color `colors.textMuted`
- Only rendered if `font` is non-null (Skia `matchFont` may return null on first render)
- When `size === 'compact'`: no axis labels rendered

---

## Technical Design

### Files to Reference

| File | Reason |
|------|--------|
| `src/components/TrendSparkline.tsx` | Path clip animation pattern (`end={clipProgress}`) |
| `src/components/WeeklyBarChart.tsx` | `useAnimatedReaction` + `runOnJS` bridge for Skia/Fabric compat |
| `src/components/AIRingChart.tsx` | Staggered animation sequence with refs |
| `src/lib/reanimated-presets.ts` | `timingChartFill` (1800ms expo ease-out) |
| `src/lib/colors.ts` | Color tokens — never hardcode hex |
| `src/lib/aiCone.ts` | `ConeData`, `ConePoint` types |

### Files to Create

| File | Action | Contents |
|------|--------|----------|
| `src/components/AIConeChart.tsx` | **create** | Full component + 3 exported path builder functions + `toPixel` internal helper |
| `src/components/__tests__/AIConeChart.test.ts` | **create** | Unit tests for path builders + render tests for `AIConeChart` |

### Component Internal Structure

```typescript
// Exports
export interface AIConeChartProps { data, width, height, size? }
export function buildActualPath(points: ConePoint[], toPixelFn: ToPixelFn): SkPath
export function buildConePath(upper: ConePoint[], lower: ConePoint[], toPixelFn: ToPixelFn): SkPath
export function buildTargetLinePath(targetPct: number, weeklyLimit: number, toPixelFn: ToPixelFn): SkPath
export default function AIConeChart(props: AIConeChartProps): JSX.Element | null

// Internal
type Padding = { top: number; right: number; bottom: number; left: number }
type ToPixelFn = (hoursX: number, pctY: number) => { x: number; y: number }
const PADDING_FULL: Padding = { top: 16, right: 16, bottom: 28, left: 36 }
const PADDING_COMPACT: Padding = { top: 8, right: 8, bottom: 8, left: 8 }
function toPixel(hoursX, pctY, dims, weeklyLimit, padding): { x, y }  // not exported
```

### Animation Bridge Pattern

Following `WeeklyBarChart` exactly to avoid Skia + Fabric SharedValue prop crash:

```typescript
const [animState, setAnimState] = useState({ lineEnd: 0, coneOpacity: 0, dotOpacity: 0 });
const progress = useSharedValue(0);
const reducedMotion = useReducedMotion();

useEffect(() => {
  if (reducedMotion) {
    progress.value = 1;
  } else {
    progress.value = withTiming(1, timingChartFill);
  }
}, []);

useAnimatedReaction(
  () => progress.value,
  (v) => {
    const lineEnd = Math.min(v / 0.6, 1);
    const coneOpacity = v;
    const dotOpacity = Math.min(Math.max((v - 0.6) / 0.4, 0), 1);
    runOnJS(setAnimState)({ lineEnd, coneOpacity, dotOpacity });
  },
);
```

All Skia props receive static React state values, not SharedValues directly.

### Path Memoization

```typescript
const { actualPath, conePath, targetPath, toPixelFn, dotPixel } = useMemo(() => {
  const padding = size === 'full' ? PADDING_FULL : PADDING_COMPACT;
  const toPixelFn: ToPixelFn = (hx, py) =>
    toPixel(hx, py, { width, height }, data.weeklyLimit, padding);
  return {
    actualPath: buildActualPath(data.actualPoints, toPixelFn),
    conePath: buildConePath(data.upperBound, data.lowerBound, toPixelFn),
    targetPath: buildTargetLinePath(data.targetPct, data.weeklyLimit, toPixelFn),
    toPixelFn,
    dotPixel: toPixelFn(data.currentHours, data.currentAIPct),
  };
}, [data, width, height, size]);
```

### Skia Font Handling

```typescript
const font = matchFont({ fontFamily: 'System', fontSize: 10 });
// Always guard: only render Text if font is non-null
{size === 'full' && font && Y_TICKS.map(({ label, pct }) => (
  <Text key={label} x={2} y={toPixelFn(0, pct).y + 4} text={label} font={font} color={colors.textMuted} />
))}
```

### Data Flow

```
Parent (AI tab / home tab)
  │  data: ConeData (pre-computed by computeAICone)
  │  width, height (from onLayout)
  │  size: 'full' | 'compact'
  ▼
AIConeChart
  ├─ useMemo: build paths, compute dotPixel
  ├─ useSharedValue → withTiming → useAnimatedReaction → setAnimState (React state)
  └─ Canvas
       ├─ Path (cone fill, opacity=coneOpacity * 0.15)
       ├─ Path (upper boundary stroke, opacity=coneOpacity * 0.30)
       ├─ Path (lower boundary stroke, opacity=coneOpacity * 0.30)
       ├─ Path (target line dashed)
       ├─ Path (actual line, end=lineEnd)
       ├─ Circle (dot, opacity=dotOpacity, r=dotRadius)
       └─ Text × N (full mode only)
```

### Edge Cases

| Case | Handling |
|------|----------|
| `width === 0` or `height === 0` | Return `null` immediately (before any Canvas or paths) |
| `useReducedMotion() === true` | `progress.value = 1` directly, skip `withTiming` |
| `actualPoints.length === 1` | `buildActualPath` returns moveTo-only path; no line drawn but no crash |
| `upperBound = []` (week complete) | `buildConePath` returns empty path; cone not visible; OK |
| `weeklyLimit <= 0` | `toPixel` guard returns paddingLeft/center; chart renders without crash |
| `upper === lower` (cone converged) | Closed path collapses to a line; fill invisible but no crash |
| `data` prop changes | `useMemo` recomputes all paths; parent key-mounts for re-animation |
