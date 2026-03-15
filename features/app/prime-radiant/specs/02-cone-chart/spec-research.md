# Spec Research: Cone Chart Component

**Date:** 2026-03-15
**Author:** @trilogy
**Spec:** `02-cone-chart`

---

## Problem Context

Build the `AIConeChart` Skia component that renders the Prime Radiant visualization: an animated chart with the actual AI% trajectory line on the left and a narrowing possibility cone on the right. Supports both a `full` variant (AI tab) and a `compact` variant (home tab card).

Depends on `01-cone-math` for the `ConeData` type and computed data.

---

## Exploration Findings

### Existing Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| Skia Path drawing (lines) | `TrendSparkline.tsx` | Catmull-Rom bezier path, animated via `withTiming` + path clip |
| Skia Path drawing (arcs) | `AIRingChart.tsx` | SVG arc path, `useAnimatedReaction` + `runOnJS` for state bridge |
| Animation: SharedValue → React state | `WeeklyBarChart.tsx`, `AIRingChart.tsx` | `useAnimatedReaction` → `runOnJS(setReactState)` to avoid Skia/Fabric prop issue |
| `timingChartFill` preset | All Skia charts | 1800ms, Expo ease-out — standard for data fill animations |
| `useReducedMotion` | Not yet used but pattern is in brand guidelines | Skip to end state if user prefers reduced motion |
| Layout measurement | All Skia charts | `<View onLayout={e => setDims(e.nativeEvent.layout)}>` before rendering Skia canvas |
| `colors` import | All Skia charts | `import { colors } from '@/src/lib/colors'` — never hardcode hex |

### Key Files

| File | Relevance |
|------|-----------|
| `src/components/TrendSparkline.tsx` | Best reference: animated line path with left-to-right clip animation |
| `src/components/WeeklyBarChart.tsx` | SharedValue → React state bridge pattern, bar fill animation |
| `src/components/AIRingChart.tsx` | Arc path construction, staggered animation |
| `src/lib/reanimated-presets.ts` | `timingChartFill` (1800ms), `timingSmooth` (400ms) |
| `src/lib/colors.ts` | All color tokens |
| `src/lib/aiCone.ts` | `ConeData` input type (from spec 01) |

### Integration Points

- Input: `ConeData` from `computeAICone()` — caller is responsible for computing
- Dimensions: measured via `onLayout` pattern (caller provides container, chart fills it)
- `size` prop: `"full"` (AI tab, ~240px tall) vs `"compact"` (home tab, ~100px tall)
- `full` variant shows axis labels; `compact` variant omits them
- Animation: `useFocusKey()` pattern — remounts chart on tab re-focus to re-animate

---

## Key Decisions

### Decision 1: Cone Fill Implementation

The cone is a filled area between two curves (upper + lower bound).

**Options considered:**
1. Two separate Path strokes (upper line + lower line) with no fill — clean, no fill complexity
2. Single closed Path (upper curve forward + lower curve backward) with semi-transparent fill — shows the "possibility space" visually
3. Two filled paths from center line — more complex, no benefit

**Chosen:** Option 2 — single closed path with semi-transparent fill + two thin boundary strokes.

**Rationale:** The filled area communicates "this is the space of outcomes" better than two lines. Semi-transparent fill (e.g., `colors.cyan` at 15% opacity) preserves the premium dark aesthetic. Upper and lower boundary strokes (same color, low opacity) define the edges.

### Decision 2: Actual Line Animation Strategy

**Options considered:**
1. Path with `end` property clipped by shared value (TrendSparkline pattern) — clean path clip
2. Build path progressively in React state — rerenders during animation (less smooth)
3. SVG path via `withTiming` on the path end parameter — same as option 1

**Chosen:** Option 1 — path clip animation, identical to `TrendSparkline` pattern.

**Rationale:** Proven in the codebase, smooth 60fps via UI thread, no React re-renders during animation.

### Decision 3: Axis Labels in Full vs Compact

**Options considered:**
1. Always show axis labels, just scale them smaller in compact mode
2. Hide all labels in compact mode, show only in full mode
3. Show only the target line label (75%) in compact, full labels in full

**Chosen:** Option 2 — no axis labels in compact, all labels in full.

**Rationale:** Compact card is ~100px tall — axis labels would crowd the chart. The cone shape itself communicates the story without needing labels at that size.

### Decision 4: Target Line Styling

**Options considered:**
1. Solid colored line (too dominant, competes with data)
2. Dashed line, subdued color
3. Very subtle solid line, same color as border

**Chosen:** Dashed line in `colors.warning` at ~50% opacity.

**Rationale:** 75% is a target/goal — warning color (gold-ish) feels appropriate. Dashed = reference/guideline, not a hard boundary. Subdued enough not to compete with the cone.

---

## Interface Contracts

### Types

```typescript
// src/components/AIConeChart.tsx

export interface AIConeChartProps {
  data: ConeData;              // from computeAICone() — caller computes
  width: number;               // canvas width (from onLayout)
  height: number;              // canvas height (from onLayout)
  size?: 'full' | 'compact';  // 'full' shows axis labels, default: 'full'
}
```

### Internal coordinate system

```typescript
// Maps data space to pixel space
// x: hoursX (0 → weeklyLimit) → (paddingLeft → width - paddingRight)
// y: pctY (0 → 100) → (height - paddingBottom → paddingTop)   [inverted: 0% at bottom]
function toPixel(
  hoursX: number,
  pctY: number,
  dims: { width: number; height: number },
  weeklyLimit: number,
  padding: { top: number; right: number; bottom: number; left: number }
): { x: number; y: number }
```

### Animation shape

```
progress: SharedValue<number>  0 → 1 over timingChartFill (1800ms)

Phase 1 (progress 0→0.6): Actual line draws from (0,0) to (currentHours, currentAIPct)
Phase 2 (progress 0→1):   Cone fades in from opacity 0→1 simultaneously

Current position dot: fades in at progress=0.6, then pulses once
```

### Function Contracts

| Function | Signature | Responsibility | Dependencies |
|----------|-----------|----------------|--------------|
| `AIConeChart` | `(props: AIConeChartProps) => JSX.Element \| null` | Full Skia chart component | `ConeData`, Skia, Reanimated |
| `buildActualPath` | `(points: ConePoint[], toPixel: fn) => SkPath` | Constructs SVG path for the actual trajectory line | `@shopify/react-native-skia` Path |
| `buildConePath` | `(upper: ConePoint[], lower: ConePoint[], toPixel: fn) => SkPath` | Closed path for cone fill (upper forward + lower backward) | `@shopify/react-native-skia` Path |
| `buildTargetLinePath` | `(targetPct: number, weeklyLimit: number, toPixel: fn) => SkPath` | Horizontal dashed line at 75% | `@shopify/react-native-skia` |

---

## Test Plan

### `AIConeChart` (render tests)

**Signature:** `(props: AIConeChartProps) => JSX.Element | null`

**Happy Path:**
- Renders without crashing with valid `ConeData` and non-zero dimensions
- Returns `null` when `width === 0` or `height === 0` (matches TrendSparkline pattern)
- `full` size renders with axis labels present
- `compact` size renders without axis labels

**Edge Cases:**
- Monday morning (actualPoints has only 1 point at origin): renders minimal line, full open cone
- Week complete (cone collapsed): no visible cone fill, just actual line to week end
- `isTargetAchievable === false`: 75% target line still drawn, no special error state

**Mocks Needed:**
- `ConeData` fixtures via `computeAICone` with mock `DailyTagData`
- Skia canvas: use `@shopify/react-native-skia`'s test utilities or snapshot tests

### `buildActualPath`

**Happy Path:**
- 3 points → smooth connected path
- Always starts at pixel coordinates corresponding to (0,0) data point

**Edge Cases:**
- Single point (only origin): returns a point path (no lines)
- All points at same Y: horizontal line

### `buildConePath`

**Happy Path:**
- Returns closed path: upper curve left-to-right, then lower curve right-to-left
- Path starts and ends at current position point

**Edge Cases:**
- Empty upper/lower arrays: returns empty path without crashing
- Single-point cone (week complete): degenerate closed path at one pixel

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/AIConeChart.tsx` | create | Full Skia component: actual line + cone fill + target line + axis labels + animation |

---

## Edge Cases to Handle

1. **Zero dimensions** — return `null` if width or height is 0 (same as TrendSparkline)
2. **Reduced motion** — `useReducedMotion()` → set `progress` to 1 immediately, skip animation
3. **Very short week** — weeklyLimit < 10h: scale X-axis accordingly, don't hardcode tick values
4. **Cone upper = lower** (week complete) — filled path collapses to a line, no fill visible; OK
5. **Data updates** — chart should re-animate when `data` reference changes (key prop from parent)

---

## Open Questions

None remaining.
