# 04-ai-hero-arc

**Status:** Draft
**Created:** 2026-03-16
**Last Updated:** 2026-03-16
**Owner:** @trilogy

---

## Overview

This spec replaces the AI screen's two-ring gauge hero with a single bold arc gauge — `AIArcHero` — and wires the `AmbientBackground` component (from `01-ambient-layer`) to the AI screen.

**What is being built:**

1. `AIArcHero` component (`src/components/AIArcHero.tsx`) — a self-contained hero card showing:
   - A sweeping 270° arc gauge centered on a bold AI% number
   - "AI USAGE" label below the number
   - Week-over-week delta badge (top-right of arc area)
   - BrainLift secondary metric inline below the arc (`X.Xh / 5h`)
   - Arc fill color = `ambientColor` prop (violet/cyan/warning per AI% tier)
   - Animated arc fill via `useSharedValue` + `withSpring(springPremium)` on the end angle

2. `arcPath` utility (exported from `AIArcHero.tsx`) — pure SVG path string generator for arc segments. Used for both the track (270° background) and fill (proportional) arcs.

3. AI screen wiring (`app/(tabs)/ai.tsx`):
   - `AmbientBackground` rendered outside `ScrollView` (absolute, full-screen)
   - `ambientColor` computed via `getAmbientColor({ type: 'aiPct', pct: heroAIPct })`
   - `AIArcHero` replaces the `Card + AIRingChart` block AND the separate BrainLift `Card`
   - `AIRingChart` no longer rendered in the hero position

**How it works:**

The arc is drawn using `react-native-svg` `Path` elements with `strokeLinecap="round"`. The `arcPath` function converts `(cx, cy, r, startAngleDeg, endAngleDeg)` into an SVG path `d=` string using the arc flag convention. Two paths are rendered: a dim track (full 270°) and a colored fill (proportional to AI%).

The fill arc's end angle is a `useSharedValue` that animates from the start angle to the computed target angle on mount and on `aiPct` change, using `withSpring(springPremium)` for a premium feel. `AnimatedPath` is created via `Animated.createAnimatedComponent(Path)` and driven by `useAnimatedProps`.

The arc diameter defaults to 180dp — larger than the previous 160dp ring — giving more visual presence.

---

## Out of Scope

1. **`AIRingChart` component deletion** — **Deferred to future cleanup spec.** The component file (`src/components/AIRingChart.tsx`) is not deleted in this spec; it is simply no longer rendered in the hero position on the AI screen. Deletion is deferred until all consumers have been audited.

2. **AI screen cards below the hero** — **Descoped.** The Prime Radiant card (`AIConeChart`), Daily Breakdown card, 12-Week Trajectory card, and Legend card are unchanged by this spec.

3. **Skeleton loader for `AIArcHero`** — **Descoped.** The existing `showSkeleton` guard in `ai.tsx` is sufficient; `AIArcHero` will not render when `showSkeleton` is true (replaced by `SkeletonLoader` in the skeleton path).

4. **BrainLift dot-progress (`●●●●○`)** — **Descoped.** The BrainLift secondary uses the existing `ProgressBar` component (simpler, tested, consistent with rest of app).

5. **Requests tab ambient wiring** — **Descoped.** Per FEATURE.md "Out of Scope," Requests hero redesign is deferred to a future spec.

6. **Home and Overview ambient wiring** — **Deferred to `02-home-hero-ambient` and `03-overview-hero`.** Those specs own their respective screens.

---

## Functional Requirements

### FR1 — `AIArcHero` component: arc gauge + bold AI% center

Create `src/components/AIArcHero.tsx` with a self-contained arc gauge hero card.

**Interface:**
```typescript
interface AIArcHeroProps {
  aiPct: number;               // 0–100, displayed as bold center number
  brainliftHours: number;      // displayed as secondary "X.Xh / 5h"
  deltaPercent: number | null; // week-over-week, null if no prior data
  ambientColor: string;        // arc fill stroke color (violet/cyan/warning)
  size?: number;               // arc diameter in dp, default 180
}
export default function AIArcHero(props: AIArcHeroProps): JSX.Element
```

**Arc geometry:**
- Track arc: 270° sweep, starts at 135° (bottom-left), ends at 405° (bottom-right)
- Fill arc: 135° → 135° + (aiPct/100 × 270°), animated with springPremium
- Center: bold `{aiPct}%` number in `colors.textPrimary`, font size 40sp
- Below number: `"AI USAGE"` label in `colors.textMuted`, font size 12sp, uppercase
- Track stroke: `colors.border`, strokeWidth 6, strokeLinecap="round"
- Fill stroke: `ambientColor` prop, strokeWidth 6, strokeLinecap="round"

**Exported constants:**
```typescript
export const AI_TARGET_PCT = 75;
export const BRAINLIFT_TARGET_HOURS = 5;
```

**Success Criteria:**
- Renders without crash for `aiPct` 0–100
- Bold AI% number is visible and centered within the arc
- "AI USAGE" label renders below the number
- Track arc spans full 270° in `colors.border`
- Fill arc uses `ambientColor` prop as stroke color
- Fill arc length is proportional to `aiPct / 100`
- Default size is 180dp when `size` prop is omitted
- Component does not import `AIRingChart`

---

### FR2 — BrainLift secondary metric

Render a BrainLift progress row inside `AIArcHero` below the arc SVG.

**Layout:**
```
BRAINLIFT
4.2h / 5h
[████████░░]  (ProgressBar, violet, 5dp height)
```

- Label: `"BRAINLIFT"` in small uppercase muted text (11sp, `colors.textMuted`, letterSpacing 1)
- Metric: `{brainliftHours.toFixed(1)}h / {BRAINLIFT_TARGET_HOURS}h` in `colors.textSecondary`
- Progress bar: `ProgressBar` component with `progress={Math.min(1, brainliftHours / BRAINLIFT_TARGET_HOURS)}`, `colorClass="bg-violet"`, `height={5}`

**Success Criteria:**
- Renders `{brainliftHours.toFixed(1)}h / 5h` text
- `ProgressBar` renders with violet color
- Progress clamped to 0–1 (no overflow above 100%)
- When `brainliftHours = 0`, progress bar renders at 0% (no crash)
- When `brainliftHours = 5`, progress bar renders at 100%
- When `brainliftHours > 5` (e.g. 7.3), progress bar renders at 100%, text shows actual hours

---

### FR3 — Ambient signal: aiPct → color mapping (confirm existing contract)

The `getAmbientColor({ type: 'aiPct', pct })` function from `01-ambient-layer` implements:

| pct range | color |
|-----------|-------|
| pct ≥ 75 | `colors.violet` (`#A78BFA`) |
| 60 ≤ pct < 75 | `colors.cyan` (`#00C2FF`) |
| pct < 60 | `colors.warning` (`#F59E0B`) |

No new code for this FR — it confirms the contract honored by FR4's wiring.

**Success Criteria:**
- `getAmbientColor({ type: 'aiPct', pct: 80 })` returns `colors.violet`
- `getAmbientColor({ type: 'aiPct', pct: 65 })` returns `colors.cyan`
- `getAmbientColor({ type: 'aiPct', pct: 50 })` returns `colors.warning`
- `getAmbientColor({ type: 'aiPct', pct: 75 })` returns `colors.violet` (boundary)
- `getAmbientColor({ type: 'aiPct', pct: 60 })` returns `colors.cyan` (boundary)
- `getAmbientColor({ type: 'aiPct', pct: 0 })` returns `colors.warning`

---

### FR4 — Wire `AmbientBackground` to AI screen

Modify `app/(tabs)/ai.tsx` to render `AmbientBackground` as the full-screen ambient layer.

**Structural pattern:**
```tsx
<View style={{ flex: 1 }}>
  <AmbientBackground color={ambientColor} />
  <FadeInScreen>
    <ScrollView ...>
      ...
    </ScrollView>
  </FadeInScreen>
</View>
```

Where:
```typescript
const ambientColor = getAmbientColor({ type: 'aiPct', pct: Math.round(heroAIPct) });
```

**Success Criteria:**
- `AmbientBackground` is rendered in `ai.tsx`
- `AmbientBackground` receives `color={ambientColor}` from `getAmbientColor({ type: 'aiPct', ... })`
- `AmbientBackground` is rendered outside (before/behind) the `ScrollView`
- `ScrollView` still fills the screen (flex: 1 semantics preserved)

---

### FR5 — Replace `AIRingChart` hero with `AIArcHero`

Modify `app/(tabs)/ai.tsx` to replace the two-card hero (AI ring + BrainLift) with `AIArcHero`.

**`AIArcHero` call site:**
```tsx
<AIArcHero
  aiPct={Math.round(heroAIPct)}
  brainliftHours={brainliftHours}
  deltaPercent={delta}
  ambientColor={ambientColor}
/>
```

**Remove from ai.tsx:**
- `AIRingChart` import
- `const RING_SIZE = 160`
- `Card + AIRingChart` hero block
- Separate BrainLift `Card` block
- `const BRAINLIFT_TARGET = 5` (now inside AIArcHero)

**Skeleton path:** `<SkeletonLoader width={180} height={180} rounded />` in place of `AIArcHero`

**Entry style index update:** `useStaggeredEntry({ count: 5 })` (was 6)

**Success Criteria:**
- `AIRingChart` is not rendered anywhere in the hero section of `ai.tsx`
- `AIArcHero` is rendered with `aiPct`, `brainliftHours`, `deltaPercent`, `ambientColor` props
- Separate BrainLift `Card` is removed
- `heroAIPct` scrub override still functions (passed as `aiPct` prop)
- Skeleton path shows `SkeletonLoader` in place of `AIArcHero`

---

### FR6 — `arcPath` pure utility function

Export from `AIArcHero.tsx`:

```typescript
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string
```

**Algorithm:**
```
startRad = startAngleDeg × (π / 180)
endRad   = endAngleDeg   × (π / 180)
x1 = cx + r × cos(startRad),  y1 = cy + r × sin(startRad)
x2 = cx + r × cos(endRad),    y2 = cy + r × sin(endRad)
sweepAngle = endAngleDeg - startAngleDeg
largeArcFlag = sweepAngle > 180 ? 1 : 0
if (startAngleDeg === endAngleDeg) return `M ${x1} ${y1}`
return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`
```

**Success Criteria:**
- Returns a string starting with `"M"` for all valid inputs
- `arcPath(90, 90, 80, 135, 135)` returns zero-length path (no crash, starts with "M")
- `arcPath(90, 90, 80, 135, 405)` produces valid full 270° arc path
- `arcPath(90, 90, 80, 135, 270)` produces valid 135° (50%) arc path
- Large arc flag is 1 when sweep > 180°, 0 otherwise

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/components/AmbientBackground.tsx` | `getAmbientColor`, `AMBIENT_COLORS` — aiPct mapping already implemented |
| `hourglassws/src/components/PanelGradient.tsx` | SVG RadialGradient + springPremium animation pattern |
| `hourglassws/app/(tabs)/ai.tsx` | Full AI screen to be modified |
| `hourglassws/src/hooks/useAIData.ts` | `aiPctLow`, `aiPctHigh`, `brainliftHours`, `previousWeekPercent` |
| `hourglassws/src/lib/colors.ts` | `colors.violet`, `colors.cyan`, `colors.warning`, `colors.border`, `colors.textPrimary` |
| `hourglassws/src/lib/reanimated-presets.ts` | `springPremium` for arc fill animation |
| `hourglassws/src/components/ProgressBar.tsx` | BrainLift progress row |
| `hourglassws/src/components/SkeletonLoader.tsx` | Skeleton state |
| `hourglassws/src/components/Card.tsx` | Outer card wrapper for AIArcHero |

### Files to Create

| File | Content |
|------|---------|
| `hourglassws/src/components/AIArcHero.tsx` | Component + `arcPath` + exported constants |
| `hourglassws/src/components/__tests__/AIArcHero.test.tsx` | Unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/app/(tabs)/ai.tsx` | Ambient wiring + hero replacement |
| `hourglassws/app/(tabs)/__tests__/ai.test.tsx` | Add wiring assertions |

---

### Data Flow

```
useAIData()
  ├─ aiPctLow + aiPctHigh → heroAIPct (midpoint, or scrubPoint override)
  ├─ brainliftHours
  └─ previousWeekPercent → delta

heroAIPct → getAmbientColor({ type: 'aiPct', pct: Math.round(heroAIPct) })
  ├─ ≥ 75 → colors.violet
  ├─ 60–74 → colors.cyan
  └─ < 60 → colors.warning
  = ambientColor

ambientColor → AmbientBackground (Layer 1)
ambientColor → AIArcHero.ambientColor (arc fill stroke — Layer 2)
```

---

### Arc Animation

Use `Animated.createAnimatedComponent(Path)` from `react-native-svg`:

```typescript
import Animated, { useSharedValue, withSpring, useAnimatedProps } from 'react-native-reanimated';
import { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// In component:
const fillEndAngle = useSharedValue(START_ANGLE);

useEffect(() => {
  fillEndAngle.value = withSpring(START_ANGLE + (aiPct / 100) * SWEEP, springPremium);
}, [aiPct]);

const animatedFillProps = useAnimatedProps(() => ({
  d: arcPath(cx, cy, r, START_ANGLE, fillEndAngle.value),
}));

<AnimatedPath animatedProps={animatedFillProps} stroke={ambientColor} ... />
```

**Fallback note:** If `useAnimatedProps` on SVG Path is incompatible with the project's RN-SVG version, implement as a static render (no animation) and document with a `// NOTE: animation deferred` comment.

---

### Arc Math Constants

```
START_ANGLE = 135°   (7 o'clock position)
SWEEP = 270°
END_TRACK = 405°     (5 o'clock position = START + SWEEP)

For aiPct 0–100:
  fillEndAngle = 135 + (aiPct / 100) × 270
```

---

### Edge Cases

| Case | Handling |
|------|---------|
| `aiPct = 0` | Degenerate path `M x y` — no visible fill, no crash |
| `aiPct = 100` | Fill arc = full 270° track |
| `brainliftHours > 5` | `Math.min(1, hours/5)` clamp on progress; text shows actual hours |
| `deltaPercent = null` | No badge rendered |
| `deltaPercent = 0` | Badge shows "+0.0%" in `textSecondary` |
| Rapid scrub changes | `useEffect([aiPct])` re-triggers spring; Reanimated handles interruption |
| `showSkeleton = true` | `SkeletonLoader` shown in place of `AIArcHero` |
