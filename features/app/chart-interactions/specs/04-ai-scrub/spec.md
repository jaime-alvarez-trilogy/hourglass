# 04-ai-scrub

**Status:** Draft
**Created:** 2026-03-15
**Last Updated:** 2026-03-15
**Blocked by:** 03-scrub-engine (complete)

---

## Overview

**04-ai-scrub** adds interactive scrub gesture support to the AIConeChart (Prime Radiant) and wires the gesture result to the hero AI% display in `app/(tabs)/ai.tsx`.

### What Is Being Built

When a user places their finger on the full-size AIConeChart and drags left/right, the chart behaves like a time machine:

1. A vertical scrub cursor (vertical line + dot) snaps to the nearest hourly data point
2. The hero AI% number at the top of the AI tab updates live to show the historical AI% at that exact hour
3. The cone (best/worst case projection from that moment) updates to reflect what was possible at that time
4. The legend row below the chart fades out while scrubbing (the live hero number IS the legend during scrub)

When the finger lifts, the cursor disappears, the legend reappears, and the hero value returns to the live AI%.

### How It Works

The implementation builds on the `useScrubGesture` hook and `ScrubCursor` utility from `03-scrub-engine`.

```
GestureDetector (Pan gesture, enabled only for size="full")
  └── Skia Canvas
        ├── [existing chart layers: cone fill, edges, target line, actual line]
        └── ScrubCursor layer (conditional on isScrubbing.value)
              ├── vertical line at hourlyPoints[scrubIndex].x
              └── dot at (scrubX, scrubY)

AIConeChart.onScrubChange callback (bridged via useAnimatedReaction → runOnJS)
  → parent ai.tsx sets scrubPoint state
  → MetricValue hero shows scrubPoint.pctY (or live aiPercent when null)
  → legend fades out via isScrubActive-driven opacity
```

### Scope

- **FR1**: Wire `useScrubGesture` into AIConeChart — compute `pixelXs`, attach gesture, add `onScrubChange` callback prop and `AIScrubPoint` type
- **FR2**: Render `ScrubCursor` inside the Skia Canvas when scrubbing
- **FR3**: Wire `ai.tsx` — hold `scrubPoint` state, update MetricValue hero, fade legend

---

## Out of Scope

1. **Scrubbing the compact (home tab) AIConeChart** — **Descoped:** The compact chart at ~100px is too small for comfortable finger interaction. The `size` prop already distinguishes variants; scrub is disabled when `size !== 'full'`.

2. **Tooltip or popover overlay during scrub** — **Descoped:** The design decision is to drive the existing hero MetricValue rather than add a floating tooltip. The hero IS the tooltip.

3. **Showing new cone animations during scrub** — **Descoped:** The animated intro sweep is separate from scrub. Scrub reads from the pre-computed `hourlyPoints`/`coneSnapshots` arrays that the animation already uses.

4. **BrainLift scrub or ring scrub** — **Deferred to 07-overview-sync:** Synchronized multi-chart scrub is spec 07.

5. **Earnings chart scrub** — **Deferred to 05-earnings-scrub:** TrendSparkline scrub is its own spec with its own hero integration.

6. **Persist scrub position** — **Descoped:** Scrub is ephemeral UI. No AsyncStorage or state persistence.

7. **Accessibility: scrub via VoiceOver/TalkBack** — **Descoped:** Gesture interaction is the mechanism.

8. **AIScrubPoint export from aiCone.ts** — **Descoped:** `AIScrubPoint` is defined and exported from `AIConeChart.tsx` as it is a callback contract interface owned by the chart component.

---

## Functional Requirements

### FR1: AIConeChart Scrub Gesture Integration

Add `onScrubChange` prop to `AIConeChart`, integrate `useScrubGesture`, and bridge scrub index to parent via callback.

**Changes to `src/components/AIConeChart.tsx`:**

```typescript
// New exported interface
export interface AIScrubPoint {
  pctY: number;     // hourlyPoints[i].pctY
  hoursX: number;   // hourlyPoints[i].hoursX
  upperPct: number; // coneSnapshots[i].upperPct
  lowerPct: number; // coneSnapshots[i].lowerPct
}

// Extended AIConeChartProps
interface AIConeChartProps {
  data: ConeData;
  width: number;
  height: number;
  size?: 'full' | 'compact';
  onScrubChange?: (point: AIScrubPoint | null) => void;  // NEW
}
```

**Internal implementation:**

```typescript
// pixelXs computed inside existing useMemo (alongside path arrays)
const pixelXsArr = data.hourlyPoints.map(p => fn(p.hoursX, p.pctY).x);

// useScrubGesture: enabled only for full-size charts
const { scrubIndex, isScrubbing, gesture } = useScrubGesture({
  pixelXs,
  enabled: size === 'full',
});

// Bridge scrubIndex → callback (UI thread → JS thread)
useAnimatedReaction(
  () => scrubIndex.value,
  (idx) => {
    if (idx < 0 || !onScrubChange) return;
    const pt = data.hourlyPoints[idx];
    const snap = data.coneSnapshots[idx];
    if (!pt || !snap) return;
    runOnJS(onScrubChange)({ pctY: pt.pctY, hoursX: pt.hoursX, upperPct: snap.upperPct, lowerPct: snap.lowerPct });
  },
);

// Bridge isScrubbing false → fire null callback
useAnimatedReaction(
  () => isScrubbing.value,
  (scrubbing) => {
    if (!scrubbing && onScrubChange) runOnJS(onScrubChange)(null);
  },
);
```

**Canvas wrapped in GestureDetector:**
```tsx
<GestureDetector gesture={gesture}>
  <Canvas style={{ width, height }}>
    {/* existing layers */}
  </Canvas>
</GestureDetector>
```

**Success Criteria:**

- SC1.1 — `AIConeChartProps` interface includes `onScrubChange?: (point: AIScrubPoint | null) => void`
- SC1.2 — `AIScrubPoint` interface is exported from `AIConeChart.tsx` with `pctY`, `hoursX`, `upperPct`, `lowerPct`
- SC1.3 — When `size="full"` and user drags, `onScrubChange` fires with `AIScrubPoint` data
- SC1.4 — When `size="full"` and user lifts finger, `onScrubChange(null)` fires
- SC1.5 — When `size="compact"`, `onScrubChange` never fires (gesture disabled)
- SC1.6 — When `onScrubChange` not provided, no crash
- SC1.7 — Empty `hourlyPoints`: scrub does nothing, no crash
- SC1.8 — `hourlyPoints.length === 1`: scrub always fires callback with index 0 data
- SC1.9 — Source imports `useScrubGesture` from `@/src/hooks/useScrubGesture`
- SC1.10 — Source wraps Canvas in `GestureDetector` from `react-native-gesture-handler`

---

### FR2: ScrubCursor Rendering in AIConeChart Canvas

While scrubbing, render a vertical cursor line and dot at the snapped data point inside the Skia Canvas.

**Bridged cursor state:**

```typescript
const [isScrubActive, setIsScrubActive] = useState(false);
const [scrubCursor, setScrubCursor] = useState<ScrubCursorResult | null>(null);

useAnimatedReaction(
  () => isScrubbing.value,
  (scrubbing) => { runOnJS(setIsScrubActive)(scrubbing); },
);

useAnimatedReaction(
  () => scrubIndex.value,
  (idx) => {
    if (idx < 0 || idx >= N) return;
    const pt = data.hourlyPoints[idx];
    const snap = data.coneSnapshots[idx];
    if (!pt || !snap) return;
    const { x, y } = toPixelFn(pt.hoursX, pt.pctY);
    const padding = size === 'full' ? PADDING_FULL : PADDING_COMPACT;
    runOnJS(setScrubCursor)(buildScrubCursor(x, y, height, padding.top));
  },
);
```

**Canvas layers (at the end, on top of all existing layers):**
```tsx
{isScrubActive && scrubCursor && (
  <>
    <Path
      path={scrubCursor.linePath}
      color={colors.textMuted}
      opacity={0.5}
      strokeWidth={1}
      style="stroke"
    />
    <Circle
      cx={scrubCursor.dotX}
      cy={scrubCursor.dotY}
      r={scrubCursor.dotRadius}
      color={HOLO_CORE}
    />
  </>
)}
```

**Success Criteria:**

- SC2.1 — Source imports `buildScrubCursor` from `@/src/components/ScrubCursor`
- SC2.2 — When `isScrubActive === true`, a `Path` is rendered with `colors.textMuted` at `opacity={0.5}`
- SC2.3 — When `isScrubActive === true`, a `Circle` is rendered at the snapped dot position
- SC2.4 — When `isScrubActive === false`, cursor layers are not rendered (conditional guard in source)
- SC2.5 — Cursor layers are rendered after (on top of) all other chart path layers
- SC2.6 — `scrubCursor.linePath` is produced by `buildScrubCursor`
- SC2.7 — `size="compact"` chart: no cursor rendered (gesture disabled, `isScrubActive` never true)

---

### FR3: AI Tab Hero Value Sync

`app/(tabs)/ai.tsx` holds `scrubPoint` state. When scrubbing, the hero MetricValue shows `scrubPoint.pctY`. When not scrubbing, it shows the live `aiPercent`. The legend fades out during scrub.

**Changes to `app/(tabs)/ai.tsx`:**

```typescript
import type { AIScrubPoint } from '@/src/components/AIConeChart';

const [scrubPoint, setScrubPoint] = useState<AIScrubPoint | null>(null);

// Hero value: scrub overrides live value
const heroAIPct = scrubPoint !== null ? scrubPoint.pctY : aiPercent;
const isScrubbing = scrubPoint !== null;
```

**AIConeChart receives callback:**
```tsx
<AIConeChart
  key={chartKey}
  data={coneData}
  width={coneDims.width}
  height={240}
  size="full"
  onScrubChange={setScrubPoint}
/>
```

**MetricValue uses hero value with 1 decimal:**
```tsx
<MetricValue
  value={heroAIPct}
  unit="%"
  precision={1}
  colorClass="text-cyan"
  sizeClass="text-4xl"
/>
```

**Legend hide:** Controlled inside `AIConeChart` via `isScrubActive` opacity (0 when scrubbing, 1 when not). No new prop needed.

**Success Criteria:**

- SC3.1 — `ai.tsx` declares `scrubPoint` state of type `AIScrubPoint | null`
- SC3.2 — When `scrubPoint !== null`, MetricValue `value` equals `scrubPoint.pctY`
- SC3.3 — When `scrubPoint === null`, MetricValue `value` equals live `aiPercent`
- SC3.4 — `scrubPoint.pctY = 0` → hero shows `0` (not live value)
- SC3.5 — `scrubPoint.pctY = 100` → hero shows `100`
- SC3.6 — AIConeChart in `ai.tsx` receives `onScrubChange={setScrubPoint}` prop
- SC3.7 — Source: AIConeChart legend has `opacity: isScrubActive ? 0 : 1` (or equivalent)
- SC3.8 — Legend visibility uses `isScrubActive` bridged state, no new prop on `AIConeChartProps`
- SC3.9 — MetricValue `precision` is `1` for the hero display

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `src/components/AIConeChart.tsx` | Primary modification target |
| `src/hooks/useScrubGesture.ts` | From 03-scrub-engine — provides `scrubIndex`, `isScrubbing`, `gesture` |
| `src/components/ScrubCursor.ts` | From 03-scrub-engine — `buildScrubCursor(x, y, height, topPadding)` |
| `src/lib/aiCone.ts` | Types: `ConeData`, `ConePoint`, `ConeSnapshot` |
| `app/(tabs)/ai.tsx` | Secondary modification target |
| `src/lib/colors.ts` | `colors.textMuted` for cursor line color |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/AIConeChart.tsx` | Add `AIScrubPoint` export, extend props, add gesture + cursor + bridge |
| `app/(tabs)/ai.tsx` | Add `scrubPoint` state, hero override, wire `onScrubChange` |

No new files. No changes to `aiCone.ts`, `useScrubGesture.ts`, or `ScrubCursor.ts`.

### Data Flow

```
User drag on AIConeChart (full-size only)
  │
  ▼ Pan gesture (GestureDetector wrapping Canvas)
useScrubGesture.onUpdate
  │  pixelXs = hourlyPoints.map(p => toPixelFn(p.hoursX, p.pctY).x)
  ▼  nearestIndex(e.x, pixelXs) → scrubIndex.value (Reanimated SharedValue)

useAnimatedReaction on scrubIndex.value
  │  idx → hourlyPoints[idx] + coneSnapshots[idx] → AIScrubPoint
  ▼  runOnJS(onScrubChange)(point)  AND  runOnJS(setScrubCursor)(cursor geometry)

ai.tsx: setScrubPoint(point) → scrubPoint state
  ▼
  heroAIPct = scrubPoint !== null ? scrubPoint.pctY : aiPercent
  MetricValue value={heroAIPct}  (count-up animation)
  AIConeChart legend opacity: 0 when isScrubActive

Finger lift:
  onFinalize → scrubIndex=-1, isScrubbing=false
  useAnimatedReaction(isScrubbing) → onScrubChange(null)
  ai.tsx: setScrubPoint(null) → MetricValue back to live aiPercent
  AIConeChart legend opacity: 1
```

### pixelXs Computation

Added to the existing `useMemo` (same deps: `data`, `width`, `height`, `size`):

```typescript
const pixelXsArr = data.hourlyPoints.map(p => fn(p.hoursX, p.pctY).x);
```

### Edge Cases

| Case | Handling |
|------|---------|
| `hourlyPoints` empty | `pixelXs = []`, gesture fires but `scrubIndex` stays -1, no callback fired |
| `hourlyPoints.length === 1` | `nearestIndex` always returns 0, callback fires with index 0 data |
| `onScrubChange` not provided | Guard: `if (onScrubChange)` before every `runOnJS(onScrubChange)` call |
| `size="compact"` | `useScrubGesture({ enabled: false })` — gesture is no-op, cursor never renders |
| `weeklyLimit === 0` | `toPixelFn` guard already handles; pixelXs still computed from existing logic |

### Test Strategy

All tests follow the existing `AIConeChart.test.tsx` pattern:
- Source analysis via `fs.readFileSync` for interface/contract/structural checks
- `react-test-renderer` render tests for crash-safety
- No Reanimated worklet tests (those belong to 03-scrub-engine)
- `ai.tsx` hero logic tested via source analysis of the ternary expression
