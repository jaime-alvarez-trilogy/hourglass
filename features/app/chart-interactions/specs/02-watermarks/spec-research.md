# Spec Research: 02-watermarks

**Feature:** chart-interactions
**Spec:** 02-watermarks
**Complexity:** S

---

## Problem Context

Charts lack contextual text anchors. You see a bar chart but don't know if "38.5h" is good or bad without counting. The AI cone shows lines with no explanation. The earnings sparkline has a ceiling ($2,000 cap) but nothing marks it.

The goal is **faint, non-intrusive context** — numbers and labels that live in the chart space without cluttering it.

---

## Exploration Findings

### WeeklyBarChart gap
`app/(tabs)/index.tsx` renders:
```jsx
<Text>This Week</Text>        ← section header
<WeeklyBarChart ... />        ← chart at 120px height
```
The gap between the header and the bar chart's top edge is empty. A large faint number (`38.5h`) overlaid on the chart body is the right location — like a studio monitor showing level.

### AIConeChart legend gap
The full-size AIConeChart (240px, AI tab) shows:
- A bright trajectory line (HOLO_GLOW/HOLO_CORE)
- An amber 75% target line
- A dashed indigo projected line
- A cone fill

None of these are labeled. When NOT scrubbing, a small legend row below the chart bottom edge should show 3 items: `● AI%` (cyan dot), `— 75% target` (amber dash), `⋯ projected` (indigo dots).

The compact AIConeChart (home tab, 100px) is too small for a legend.

### TrendSparkline cap
`useEarningsHistory` returns 12-week earnings. The sparkline can receive `maxValue` and `showGuide`. Adding a `capLabel?: string` prop would render a faint text label at the right edge of the guide line.

### Existing Skia text pattern
AIConeChart already uses Skia `matchFont` + `<Text>` elements for axis labels. This pattern works. However, for the legend below the chart (outside Skia Canvas), it's simpler to use a React Native `View` row with `Text` elements below the Canvas.

---

## Key Decisions

**Decision 1: Watermark position**
→ The watermark lives inside the WeeklyBarChart Skia Canvas. A single Skia `<Text>` element centered horizontally, vertically centered in the chart, at low opacity (0.07). Font size 52sp (large enough to read, small enough to be background texture). Shows `hoursData.total` formatted as `"38.5h"`.

WeeklyBarChart needs a new `watermarkLabel?: string` prop. The home tab passes `String(hoursData.total.toFixed(1)) + 'h'`.

**Decision 2: AIConeChart legend placement**
→ NOT inside the Skia Canvas. React Native `View` row rendered below the Canvas in the AIConeChart component (when `size === 'full'`). Three items: colored square/line + label text. Compact (`size === 'compact'`) gets no legend.

Legend items:
```
● AI%          (cyan #00D4FF dot, or HOLO_GLOW from chart)
─ 75% target   (amber #FCD34D dash)
⋯ projected    (indigo #818CF8 dots)
```

This approach is simpler than in-canvas text and doesn't require font loading.

**Decision 3: TrendSparkline cap label**
→ New `capLabel?: string` prop. When `showGuide && capLabel`, render a small Skia `<Text>` at the right edge of the guide line, right-aligned, opacity 0.35. Font size 10sp.

**Decision 4: Legend visibility when scrubbing (deferred)**
→ This spec does NOT add scrub interaction. When 04-ai-scrub is implemented, the legend can be conditionally hidden during scrub. For now the legend is always visible on full-size chart.

---

## Interface Contracts

```typescript
// WeeklyBarChart — new prop
interface WeeklyBarChartProps {
  // existing: data, maxHours, width, height
  watermarkLabel?: string;    // e.g. "38.5h" — faint Skia Text centered on chart
}

// AIConeChart — no new props
// Legend View is internal to AIConeChart, shown when size === 'full'
// Legend color constants already defined in AIConeChart.tsx:
//   HOLO_GLOW '#38BDF8', AMBER_CORE '#FCD34D', PROJ_COLOR '#818CF8'

// TrendSparkline — new prop
interface TrendSparklineProps {
  // existing: data, width, height, color, strokeWidth, maxValue, showGuide
  capLabel?: string;          // e.g. "$2,000" — rendered at right edge of guide line
}

// app/(tabs)/index.tsx — passes watermarkLabel
// <WeeklyBarChart watermarkLabel={`${hoursData.total.toFixed(1)}h`} ... />

// app/(tabs)/index.tsx — passes capLabel to earnings sparkline
// <TrendSparkline ... showGuide maxValue={weeklyEarnings * 1.5} capLabel="cap" />
// or just show the actual cap value from config.hourlyRate * weeklyLimit
```

### Source Tracing

| Field | Source |
|-------|--------|
| `watermarkLabel` value | `useHoursData().data.total.toFixed(1) + 'h'` |
| Legend colors | Constants in `AIConeChart.tsx` (HOLO_GLOW, AMBER_CORE, PROJ_COLOR) |
| `capLabel` value | `'$' + (config.hourlyRate * config.weeklyLimit).toLocaleString()` |
| `maxValue` for guide | Passed from home tab (e.g. `config.hourlyRate * config.weeklyLimit`) |

---

## Test Plan

### WeeklyBarChart watermark

**Happy Path:**
- [ ] When `watermarkLabel="38.5h"` provided → source contains watermark text render
- [ ] Watermark opacity ≤ 0.10 (faint, not intrusive)
- [ ] Center position: hoursX ≈ width/2, hoursY ≈ height/2

**Edge Cases:**
- [ ] `watermarkLabel` undefined → no watermark rendered (no crash)
- [ ] Empty string → no watermark

### AIConeChart legend

**Happy Path:**
- [ ] When `size="full"` → legend row rendered in source (View with 3 items)
- [ ] Legend contains AI% label, 75% target label, projected label
- [ ] Correct colors referenced (HOLO_GLOW, AMBER_CORE, PROJ_COLOR)

**Edge Cases:**
- [ ] When `size="compact"` → no legend rendered

### TrendSparkline cap label

**Happy Path:**
- [ ] When `showGuide && capLabel` provided → Skia Text element in source
- [ ] Opacity ≤ 0.40 (faint)
- [ ] Right-edge positioning (x ≈ width - padding)

**Edge Cases:**
- [ ] `capLabel` without `showGuide` → no cap label (guide line must be shown)
- [ ] `capLabel` undefined → no crash, no label

---

## Files to Reference

- `src/components/WeeklyBarChart.tsx` — Skia Text usage, chart dimensions
- `src/components/AIConeChart.tsx` — existing color constants, size prop, full vs compact layout
- `src/components/TrendSparkline.tsx` — showGuide line rendering, Skia Text for axis
- `app/(tabs)/index.tsx` — where watermarkLabel value comes from
- `src/lib/colors.ts` — color palette reference
