# Spec Research: 01-ambient-layer

## Problem Context

`BlurView` cards are visually inert because they sample a near-black background. The fix requires giving them a colored field to sample. This spec creates the shared infrastructure that all three screen specs (02/03/04) depend on: a full-screen ambient gradient component and a Card opacity update.

## Scope

**FR1** — `AmbientBackground` component
**FR2** — `AMBIENT_COLORS` mapping (pure function, no hook needed)
**FR3** — `Card.tsx` opacity reduction to 0.12/0.18 (base/elevated)
**FR4** — `BlurView` intensity increase to 60/80 (more frost at lower opacity)
**FR5** — Reanimated color interpolation in `AmbientBackground`

## Exploration Findings

### Current Card state
`Card.tsx` exports:
- `GLASS_BASE.backgroundColor = 'rgba(22, 21, 31, 0.25)'` (after recent reduction)
- `GLASS_ELEVATED.backgroundColor = 'rgba(31, 30, 41, 0.35)'`
- `BLUR_INTENSITY_BASE = 40`, `BLUR_INTENSITY_ELEVATED = 60`
- `BlurView` wrapped in `<View pointerEvents="none">` → already touch-safe

### PanelGradient state
`PanelGradient.tsx` already has a `BLUR_INTENSITY_PANEL = 30` BlurView. It uses `colorMap` to map `PanelState` → gradient inner stop color. The same color can be reused as the ambient color.

### Color mapping (from `PanelGradient.tsx`)
```typescript
const colorMap: Record<PanelState, string | null> = {
  onTrack:   colors.success,
  behind:    colors.warning,
  critical:  colors.critical,
  crushedIt: colors.gold,
  overtime:  colors.overtimeWhiteGold,
  idle:      null,  // no gradient
};
```
Ambient mapping is identical — reuse this logic.

### Reanimated interpolation
`reanimated-presets.ts` exports `springPremium` (emotional transitions). Ambient color changes are significant state signals — use `springPremium` + `interpolateColor` from Reanimated.

### No existing AmbientBackground
No prior implementation exists. New file: `src/components/AmbientBackground.tsx`.

## Key Decisions

1. **Pure component, not a hook** — `AmbientBackground` accepts `color: string | null` as a prop. Screens compute the color themselves (keeps component dumb and testable).

2. **RadialGradient via react-native-svg** — Already used in `PanelGradient`. Consistent approach. Center at top-center of screen, radius 70% of screen width.

3. **Opacity 8% on the gradient stop** — The ambient layer must be subtle enough not to overpower content but colorful enough to give BlurView something to sample. 8% opacity on the center stop, fading to transparent.

4. **Card opacity 0.12/0.18** — At these values, the BlurView's frosted tint is the dominant visual signal. The dark surface color becomes a subtle tint rather than a mask.

5. **Intensity 60/80** — Higher intensity = more pronounced frost effect. Needed to compensate for the lower background opacity.

6. **Animated via useSharedValue + interpolateColor** — Color transitions between states use `springPremium` for emotional weight.

## Interface Contracts

```typescript
// AmbientBackground.tsx
interface AmbientBackgroundProps {
  color: string | null;    // hex color — null = no gradient (idle state)
  intensity?: number;       // gradient opacity multiplier 0–1, default 1.0
}

export default function AmbientBackground(props: AmbientBackgroundProps): JSX.Element

// Ambient color mapping (pure function, exported from AmbientBackground.tsx)
export type AmbientSignal =
  | { type: 'panelState'; state: PanelState }
  | { type: 'earningsPace'; ratio: number }  // ratio = currentPeriod / priorPeriod avg
  | { type: 'aiPct'; pct: number };

export function getAmbientColor(signal: AmbientSignal): string | null

// AMBIENT_COLORS constant (exported for tests)
export const AMBIENT_COLORS: {
  panelState: Record<PanelState, string | null>;
  earningsPaceStrong: string;   // gold
  earningsPaceBehind: string;   // warning
  earningsPaceCritical: string; // critical
  aiAtTarget: string;           // violet
  aiApproaching: string;        // cyan
  aiBelow: string;              // warning
}
```

### Source Tracing

| Field/Prop | Source |
|-----------|--------|
| `color` prop | Passed from parent screen; computed via `getAmbientColor()` |
| `getAmbientColor({ type: 'panelState', state })` | `colors.ts` values, mapped identically to `PanelGradient.colorMap` |
| `getAmbientColor({ type: 'earningsPace', ratio })` | Computed in 03-overview-hero; ratio = earnings[last] / avg(earnings[0..n-2]) |
| `getAmbientColor({ type: 'aiPct', pct })` | `aiData.aiPctLow` from `useAIData()` (conservative bound) |

## Test Plan

### `getAmbientColor`
**Signature:** `(signal: AmbientSignal) => string | null`

**PanelState cases:**
- [ ] onTrack → `colors.success`
- [ ] behind → `colors.warning`
- [ ] critical → `colors.critical`
- [ ] crushedIt → `colors.gold`
- [ ] overtime → `colors.overtimeWhiteGold`
- [ ] idle → `null`

**EarningsPace cases:**
- [ ] ratio ≥ 0.85 → `colors.gold`
- [ ] ratio 0.60–0.84 → `colors.warning`
- [ ] ratio < 0.60 → `colors.critical`
- [ ] ratio = 0 (no prior data) → `colors.gold` (no comparison = assume strong)

**AIPct cases:**
- [ ] pct ≥ 75 → `colors.violet`
- [ ] pct 60–74 → `colors.cyan`
- [ ] pct < 60 → `colors.warning`

### `AmbientBackground` component
- [ ] Renders `null`-safe: `color=null` renders nothing (idle state)
- [ ] Renders svg with correct fill when color is provided
- [ ] `pointerEvents="none"` on root element (must not intercept touches)
- [ ] Absolutely positioned covering full screen
- [ ] Source does not use `StyleSheet.create` (consistent with project convention)

### `Card.tsx` constants
- [ ] `GLASS_BASE.backgroundColor` opacity ≤ 0.15
- [ ] `GLASS_ELEVATED.backgroundColor` opacity ≤ 0.20
- [ ] `BLUR_INTENSITY_BASE` ≥ 60
- [ ] `BLUR_INTENSITY_ELEVATED` ≥ 80

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/AmbientBackground.tsx` | **Create** |
| `src/components/__tests__/AmbientBackground.test.tsx` | **Create** |
| `src/components/Card.tsx` | **Modify** — opacity + intensity |

## Files to Reference

- `src/components/PanelGradient.tsx` — colorMap pattern, SVG radial gradient implementation
- `src/lib/colors.ts` — all color values
- `src/lib/panelState.ts` — PanelState type
- `src/lib/reanimated-presets.ts` — springPremium preset
- `src/components/Card.tsx` — current constants to update
