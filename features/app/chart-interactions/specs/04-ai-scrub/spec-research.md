# Spec Research: 04-ai-scrub

**Feature:** chart-interactions
**Spec:** 04-ai-scrub
**Complexity:** M
**Blocked by:** 03-scrub-engine

---

## Problem Context

The AIConeChart shows the AI trajectory cone but you can only see the current/final values — no way to inspect specific points in time. The user wants to put their finger on the chart and see:
- What AI% they were at at that hour of the week
- What the cone (best/worst case) looked like at that moment

The elegant design: when scrubbing, the hero AI% number at the top of the AI tab updates live instead of showing a floating tooltip.

---

## Exploration Findings

### AIConeChart data available for scrub
`ConeData.hourlyPoints` — array of `ConePoint { hoursX, pctY }` for each integer hour + day boundaries. Computed by `computeHourlyPoints()` in aiCone.ts. This is ALREADY computed and stored in ConeData — no new math needed.

`ConeData.coneSnapshots` — parallel array of `ConeSnapshot { upperPct, lowerPct }` at each hourly point. Shows what the cone looked like at that moment in time.

### AI tab hero display (app/(tabs)/ai.tsx)
```jsx
// Current: static hero value
<MetricValue value={data.aiPctLow} />  // or aiPctHigh range display
```
When scrubbing the cone chart below: the hero `MetricValue` should show `hourlyPoints[scrubIndex].pctY`.

### AIConeChart animation already uses hourlyPoints
The existing animation sweeps `frameIndex` from 0 → hourlyPoints.length-1. Scrubbing is conceptually "pausing" the animation at a user-chosen frame — same index space.

### Compact vs full chart
- **Full-size** (AI tab, 240px): scrub enabled. This is the primary interactive chart.
- **Compact** (home tab, 100px): scrub disabled (too small, finger would cover whole chart).

The `size` prop already distinguishes these.

### Legend visibility during scrub
When scrubbing, the legend row (from 02-watermarks) should hide — the hero number IS the legend during scrub. Add `isScrubbing` state to control legend visibility with a fade.

---

## Key Decisions

**Decision 1: onScrubChange API**
→ AIConeChart accepts `onScrubChange?: (point: { pctY: number; upperPct: number; lowerPct: number } | null) => void`. Passes the merged hourlyPoint + coneSnapshot at the scrubbed index. Parent gets everything it needs.

**Decision 2: Hero update approach**
→ AI tab `ai.tsx` holds `scrubPoint` state. When `scrubPoint !== null`, MetricValue shows `scrubPoint.pctY`. When null (finger lifted), MetricValue shows live `data.aiPctHigh` (normal).

MetricValue already has count-up animation — this will smoothly animate to each new value as the user drags. That's the intended effect.

**Decision 3: Show/hide cone during scrub**
→ When scrubbing, the animated cone (the moving forward-looking one) stays visible. The scrub cursor snaps to hourlyPoints — the actual historical line. The cursor shows you exactly where you were at that hour. The cone at that frame shows what was possible at that moment — very cool "time machine" effect.

**Decision 4: Cursor appearance in the cone chart**
→ The scrub cursor (from 03) is a vertical line at the snapped hour's X position, with a dot on the trajectory line. Color: `colors.textMuted` (0.5 opacity) for line. The forward cone is static — only the cursor moves.

**Decision 5: scrubEnabled = size === 'full'**
→ `useScrubGesture` enabled flag tied to `props.size === 'full'`. Compact chart: no gesture.

---

## Interface Contracts

```typescript
// src/components/AIConeChart.tsx — new props
interface AIConeChartProps {
  data: ConeData;
  width: number;
  height: number;
  size?: 'full' | 'compact';
  onScrubChange?: (point: AIScrubPoint | null) => void;  // NEW
}

interface AIScrubPoint {
  pctY: number;        // hourlyPoints[i].pctY — actual AI% at that hour
  hoursX: number;      // hourlyPoints[i].hoursX — hours elapsed
  upperPct: number;    // coneSnapshots[i].upperPct — best case at that moment
  lowerPct: number;    // coneSnapshots[i].lowerPct — worst case at that moment
}

// app/(tabs)/ai.tsx — new state
const [scrubPoint, setScrubPoint] = useState<AIScrubPoint | null>(null);
// Hero value: scrubPoint?.pctY ?? data.aiPctHigh  (rounded to 1 decimal)
// Sub-label when scrubbing: `${scrubPoint.hoursX.toFixed(1)}h in`

// AIConeChart internal: useScrubGesture integration
// pixelXs = hourlyPoints.map(p => toPixelX(p.hoursX))
// useAnimatedReaction on scrubIndex → runOnJS(onScrubChange)(point | null)
```

### Source Tracing

| Field | Source |
|-------|--------|
| `scrubPoint.pctY` | `ConeData.hourlyPoints[i].pctY` |
| `scrubPoint.hoursX` | `ConeData.hourlyPoints[i].hoursX` |
| `scrubPoint.upperPct` | `ConeData.coneSnapshots[i].upperPct` |
| `scrubPoint.lowerPct` | `ConeData.coneSnapshots[i].lowerPct` |
| `pixelXs` for gesture | `hourlyPoints.map(p => toPixelX(p.hoursX))` (computed in useMemo) |
| AI tab hero value | `scrubPoint?.pctY ?? useAIData().data.aiPctHigh` |

---

## Test Plan

### AIConeChart with scrub props

**Happy Path:**
- [ ] `onScrubChange` called with `AIScrubPoint` when finger drags across full-size chart
- [ ] `onScrubChange(null)` called on gesture end
- [ ] `size="compact"` — `onScrubChange` never fires (scrub disabled)

**Edge Cases:**
- [ ] Empty `hourlyPoints` (e.g. no data yet this week) → scrub does nothing, no crash
- [ ] `hourlyPoints.length === 1` → scrub always returns index 0
- [ ] `onScrubChange` not provided → no crash (optional prop)

### AI tab hero update

**Happy Path:**
- [ ] When `scrubPoint !== null` → MetricValue shows `scrubPoint.pctY`
- [ ] When `scrubPoint === null` → MetricValue shows live AI%
- [ ] Source: hero value is `scrubPoint?.pctY ?? data.aiPctHigh`

**Edge Cases:**
- [ ] `scrubPoint.pctY = 0` → hero shows 0 (not live value)
- [ ] `scrubPoint.pctY = 100` → hero shows 100 (valid)

### Legend hide during scrub

- [ ] Source: legend visible when `!isScrubbing`, hidden or faded when `isScrubbing`

---

## Files to Reference

- `src/components/AIConeChart.tsx` — full chart, hourlyPoints usage, animation pattern
- `src/lib/aiCone.ts` — ConeData, ConePoint, ConeSnapshot types
- `app/(tabs)/ai.tsx` — MetricValue hero, data.aiPctHigh/Low, layout
- `src/hooks/useScrubGesture.ts` — built in 03-scrub-engine
- `src/lib/reanimated-presets.ts` — bridge pattern (useAnimatedReaction → runOnJS)
