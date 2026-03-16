# Spec Research: 04-ai-hero-arc

## Problem Context

The AI screen's current hero is a two-ring gauge (`AIRingChart`) with a color scheme the user is not happy with. It is visually complex without clear hierarchy. This spec replaces it with a single bold `AI%` number + sweeping arc gauge, with BrainLift hours as a secondary metric. The hero drives the ambient layer color, tying the screen's glass feel to AI performance.

## Scope

**FR1** — `AIArcHero` component: bold AI% number centered within a sweeping arc
**FR2** — BrainLift hours secondary metric below the arc
**FR3** — Ambient signal: violet ≥75%, cyan 60–74%, warning <60%
**FR4** — Wire `AmbientBackground` to AI screen
**FR5** — Remove `AIRingChart` from AI screen; replace with `AIArcHero`

## Exploration Findings

### Current AI screen hero (`app/(tabs)/ai.tsx`)
```tsx
<Card>
  <AIRingChart />           ← two rings (outer=AI%, inner=BrainLift%)
  <MetricValue>{heroAIPct}%</MetricValue>  ← overlaid absolutely
  <DeltaBadge />            ← week-over-week delta
  <Text>75% target</Text>
</Card>
<Card>
  <MetricValue>{brainliftHours}h</MetricValue>
  <ProgressBar violet />
</Card>
```

### AIRingChart
Skia-based two-ring circular visualization. The user finds the color scheme unsatisfying. The component will be retired from the hero position (it may remain elsewhere or be deleted).

### Available data
From `useAIData()`:
- `data.aiPctLow` — conservative AI% (used for display)
- `data.aiPctHigh` — optimistic AI%
- `data.brainliftHours` — current week BrainLift hours
- `previousWeekPercent` — prior week AI% for delta

The `heroAIPct` already computed in ai.tsx:
```typescript
const heroAIPct = scrubPoint ? Math.round(scrubPoint.pctY * 100) : Math.round(((data?.aiPctLow ?? 0) + (data?.aiPctHigh ?? 0)) / 2);
```

### Arc design
A single circular arc (Skia `Arc` path or `react-native-svg` Path):
- Track arc: full 270° sweep (135°→405°), `colors.border` color, thin (strokeWidth 3)
- Fill arc: `0°→(pct/100 * 270°)`, animated, color = ambient color (violet/cyan/warning)
- Center: bold `{pct}%` number (large, `colors.textPrimary`)
- Below number: small "AI USAGE" label
- Arc diameter: ~180px (larger than current 160px rings, more presence)

### BrainLift secondary
Below the arc:
```
BrainLift: 4.2h / 5h ●●●●○  (5 dot progress, violet)
```
Simple, scannable. Not a separate card — integrated below the arc in the same hero card.

### Delta badge
Keep the week-over-week delta badge. Position it to the top-right of the arc. Color: green if positive, critical if negative.

### react-native-svg vs Skia
Current `AIRingChart` uses Skia. New `AIArcHero` should use Skia for consistency with the rest of the chart components. Arc drawn as a Path using `processTransform2d` + arc calculation.

Actually, simpler: use `react-native-svg` which is already installed and used in `PanelGradient`. An SVG `Path` with `strokeLinecap="round"` produces a cleaner arc than Skia for this use case.

## Key Decisions

1. **Single arc, not dual rings** — AI% is the primary signal. BrainLift moves to a text secondary below. Simpler, more readable, larger number.

2. **Arc color = ambient color** — The arc stroke color matches the ambient field color. This creates visual unity: the arc IS the source of the ambient glow in the background.

3. **react-native-svg for the arc** — Already installed, used in PanelGradient. SVG paths with strokeLinecap="round" produce the cleanest arc appearance.

4. **270° sweep arc** — Standard gauge convention. Starts at bottom-left, sweeps clockwise to bottom-right. The "empty" portion at the bottom creates a natural break.

5. **Animated fill arc** — `useSharedValue` + `withSpring(springPremium)` on the arc endAngle. On mount and data change, arc sweeps in from 0.

6. **AIRingChart retired from hero position** — Component may still exist in codebase but is not rendered on the AI screen. The Prime Radiant / AIConeChart cards below remain unchanged.

7. **No separate BrainLift card** — The two-card hero (AI ring + BrainLift separately) collapses into one unified `AIArcHero`. This frees vertical space and reinforces hierarchy.

## Interface Contracts

```typescript
// New component: src/components/AIArcHero.tsx
interface AIArcHeroProps {
  aiPct: number;             // 0–100, displayed as bold center number
  brainliftHours: number;    // displayed as secondary "X.Xh / 5h"
  deltaPercent: number | null; // week-over-week, null if no prior data
  ambientColor: string;      // arc stroke color (violet/cyan/warning)
  size?: number;             // arc diameter in dp, default 180
}
export default function AIArcHero(props: AIArcHeroProps): JSX.Element

// Arc math utilities (pure, exported for tests):
export function arcPath(
  cx: number, cy: number, r: number,
  startAngleDeg: number, endAngleDeg: number
): string  // returns SVG path d= string

export const AI_TARGET_PCT = 75;
export const BRAINLIFT_TARGET_HOURS = 5;

// ai.tsx changes:
// - Import AIArcHero, AmbientBackground, getAmbientColor
// - Remove Card+AIRingChart block + separate BrainLift card
// - Render AIArcHero with aiPct=heroAIPct, brainliftHours, deltaPercent, ambientColor
// - Render AmbientBackground outside ScrollView
// - ambientColor = getAmbientColor({ type: 'aiPct', pct: heroAIPct })
```

### Source Tracing

| Field | Source |
|-------|--------|
| `aiPct` | `heroAIPct` already in ai.tsx (midpoint of aiPctLow/aiPctHigh, or scrubPoint) |
| `brainliftHours` | `data?.brainliftHours ?? 0` from `useAIData()` |
| `deltaPercent` | `previousWeekPercent` from `useAIData()` |
| `ambientColor` | `getAmbientColor({ type: 'aiPct', pct: heroAIPct })` from AmbientBackground (01-ambient-layer) |

## Test Plan

### `arcPath`
**Signature:** `(cx, cy, r, startAngleDeg, endAngleDeg) => string`
- [ ] Returns a string starting with "M" (valid SVG path)
- [ ] `arcPath(90, 90, 80, 135, 135)` → zero-length path (degenerate case, no crash)
- [ ] `arcPath(90, 90, 80, 135, 405)` → full 270° arc (track arc)
- [ ] `arcPath(90, 90, 80, 135, 270)` → 50% fill (135° out of 270°)

### `AIArcHero`
- [ ] Renders AI% as bold center number
- [ ] Renders "AI USAGE" label below number
- [ ] Renders BrainLift secondary: `{brainliftHours}h / 5h`
- [ ] Renders delta badge when `deltaPercent` is not null
- [ ] Delta badge is success color when `deltaPercent > 0`
- [ ] Delta badge is critical color when `deltaPercent < 0`
- [ ] Arc fill uses `ambientColor` for stroke
- [ ] Source does not import `AIRingChart`
- [ ] `AI_TARGET_PCT = 75` used for track arc full-scale reference

### AI screen ambient wiring
- [ ] `AmbientBackground` rendered outside ScrollView in ai.tsx
- [ ] `getAmbientColor({ type: 'aiPct', pct: heroAIPct })` passed to `AmbientBackground`
- [ ] `AIArcHero` rendered in place of old ring+BrainLift card pair
- [ ] Source does not render `AIRingChart` in hero position

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/AIArcHero.tsx` | **Create** |
| `src/components/__tests__/AIArcHero.test.tsx` | **Create** |
| `app/(tabs)/ai.tsx` | **Modify** — replace hero, add ambient |
| `app/(tabs)/__tests__/ai.test.tsx` | **Modify** — add wiring assertions |

## Files to Reference

- `app/(tabs)/ai.tsx` — full current structure, heroAIPct computation
- `src/components/AIRingChart.tsx` — what's being replaced (do not copy its patterns)
- `src/hooks/useAIData.ts` — data interface
- `src/components/AmbientBackground.tsx` — from 01-ambient-layer (blocked by)
- `src/components/PanelGradient.tsx` — SVG arc pattern reference
- `src/lib/colors.ts` — violet, cyan, warning
- `src/lib/reanimated-presets.ts` — springPremium for arc animation
