# Spec Research: 03-scrub-engine

**Feature:** chart-interactions
**Spec:** 03-scrub-engine
**Complexity:** M

---

## Problem Context

Three downstream specs (04-ai-scrub, 05-earnings-scrub, 07-overview-sync) all need the same gesture interaction: drag a finger across a chart to scrub through data. This spec builds the reusable engine once so downstream specs can snap it in with minimal code.

---

## Exploration Findings

### Gesture library available
`react-native-gesture-handler` is already installed (used in ApprovalCard via PanResponder, and presumably via Expo Router). The modern API is `Gesture.Pan()` from `react-native-gesture-handler` + `GestureDetector` wrapper.

### Reanimated version
`react-native-reanimated` v3 is used throughout (SharedValue, useSharedValue, useAnimatedReaction, runOnJS). The scrub engine will use the same patterns.

### Existing SharedValue bridge pattern
AIConeChart and all chart components already bridge Reanimated → React via:
```typescript
useAnimatedReaction(
  () => sharedVal.value,
  (val) => runOnJS(setReactState)(val),
);
```
This is the approved pattern. The scrub engine will use the same bridge for `onScrubChange` callbacks.

### Skia Canvas + Gesture interaction
Charts render via `@shopify/react-native-skia` Canvas. The canvas is a regular View, so wrapping it in `GestureDetector` works. The scrub cursor renders as additional Skia Path/Circle elements inside the same Canvas. This avoids any layout layer complications.

### Chart coordinate system
All charts use a `toPixel(point)` mapping function of the form:
- `x = padding + (value / maxX) * (width - 2*padding)`
- `y = height - padding - (value / maxY) * (height - 2*padding)`

The scrub engine needs access to these pixel positions to draw the cursor correctly and snap to the nearest data point.

---

## Key Decisions

**Decision 1: Hook vs. component**
→ `useScrubGesture` hook returns `{ scrubIndex, isScrubbing, gesture }`. Each chart component:
1. Calls `useScrubGesture({ pixelXs, width })`
2. Wraps Canvas in `<GestureDetector gesture={gesture}>`
3. Renders cursor paths using `scrubIndex` and `isScrubbing` SharedValues

**Decision 2: Snap to nearest X**
→ The hook receives `pixelXs: number[]` — the X pixel positions of each data point. On pan, the gesture X position is compared to all pixelXs to find the nearest index. This is done on the UI thread via a worklet.

```typescript
function nearestIndex(x: number, pixelXs: number[]): number {
  'worklet';
  let best = 0;
  let bestDist = Math.abs(x - pixelXs[0]);
  for (let i = 1; i < pixelXs.length; i++) {
    const d = Math.abs(x - pixelXs[i]);
    if (d < bestDist) { best = i; bestDist = d; }
  }
  return best;
}
```

**Decision 3: scrubIndex = -1 when not scrubbing**
→ When `isScrubbing.value === false`, `scrubIndex.value === -1`. Charts guard cursor render on `isScrubbing`. This avoids rendering a cursor at index 0 on first mount.

**Decision 4: Cursor visual**
→ A `ScrubCursorPaths` helper function (not a component — pure function returning Skia path strings) used inside Canvas:
```typescript
function buildScrubCursorPaths(
  scrubX: number,     // pixel X of snapped point
  scrubY: number,     // pixel Y of snapped point
  height: number,
  padding: number,
): { linePath: string; dotRadius: number; dotX: number; dotY: number }
```

The cursor is: a vertical line from (scrubX, padding) to (scrubX, height-padding) + a filled dot at the snapped data point. Color: `colors.textMuted` / 0.6 opacity for line; data series color for dot.

**Decision 5: `onScrubChange` callback bridging**
→ Each chart accepts `onScrubChange?: (index: number | null) => void`. Inside the chart, a `useAnimatedReaction` bridges `scrubIndex` → `runOnJS(onScrubChange)(index === -1 ? null : index)`. The parent screen uses this to update a hero value via `useState`.

**Decision 6: Activation threshold**
→ Pan gesture activates on `minDistance: 5` to avoid triggering on taps. On gesture end, `scrubIndex` resets to -1.

---

## Interface Contracts

```typescript
// src/hooks/useScrubGesture.ts
function useScrubGesture(options: {
  pixelXs: number[];       // X pixel position of each data point (length N)
  enabled?: boolean;       // default true — set false on compact charts
}): {
  scrubIndex: SharedValue<number>;     // -1 = not scrubbing; 0..N-1 = active
  isScrubbing: SharedValue<boolean>;
  gesture: GestureType;               // attach to GestureDetector
}

// src/components/ScrubCursorPaths.ts  (pure utility, not a component)
interface ScrubCursorResult {
  linePath: SkPath;        // Vertical line path (use Skia Path.Make())
  dotX: number;
  dotY: number;
  dotRadius: number;
}

function buildScrubCursor(
  scrubX: number,
  scrubY: number,
  chartHeight: number,
  topPadding: number,
): ScrubCursorResult

// Each chart using scrub: new optional props
interface ScrubProps {
  onScrubChange?: (index: number | null) => void;
  // scrubEnabled defaults to true for full-size charts, false for compact
}
```

### Source Tracing

| Field | Source |
|-------|--------|
| `pixelXs` | Computed inside chart from data points (chart-specific toPixel function) |
| `gesture` | Created by `useScrubGesture`, attached via `GestureDetector` |
| `scrubIndex` | SharedValue updated on UI thread via `onUpdate` worklet |
| `onScrubChange` callback | Parent screen state setter (e.g. `setScrubIndex`) |

---

## Test Plan

### `useScrubGesture` hook

**Happy Path:**
- [ ] Returns `{ scrubIndex, isScrubbing, gesture }` with correct types
- [ ] `scrubIndex.value` starts at -1
- [ ] `isScrubbing.value` starts at false

**Edge Cases:**
- [ ] `pixelXs = []` → scrubIndex remains -1, no crash
- [ ] `pixelXs = [50]` → single point always snaps to index 0 when scrubbing
- [ ] `enabled = false` → gesture does not activate (verify via gesture state)

### `nearestIndex` worklet

**Happy Path:**
- [ ] `nearestIndex(0, [0, 100, 200])` → 0
- [ ] `nearestIndex(90, [0, 100, 200])` → 1 (closer to 100)
- [ ] `nearestIndex(200, [0, 100, 200])` → 2

**Edge Cases:**
- [ ] `nearestIndex(50, [0, 100])` → 0 or 1 (equidistant, either acceptable)
- [ ] `nearestIndex(300, [0, 100, 200])` → 2 (beyond last, clamps to last)

### `buildScrubCursor`

**Happy Path:**
- [ ] Returns a line path and valid dot coordinates
- [ ] Line x-coordinates match scrubX
- [ ] Dot centered at (scrubX, scrubY)

**Edge Cases:**
- [ ] `scrubX = 0` → no crash, line at left edge
- [ ] `scrubX = width` → no crash, line at right edge

---

## Files to Reference

- `src/components/AIConeChart.tsx` — Skia Canvas structure, SharedValue bridge pattern, existing path building
- `src/components/WeeklyBarChart.tsx` — coordinate system, toPixel pattern
- `src/components/TrendSparkline.tsx` — coordinate system, toPixel pattern
- `src/lib/reanimated-presets.ts` — animation presets to use (timingInstant for cursor snap)
- `src/lib/colors.ts` — cursor color (textMuted)
- `node_modules/react-native-gesture-handler` — Gesture.Pan() API
