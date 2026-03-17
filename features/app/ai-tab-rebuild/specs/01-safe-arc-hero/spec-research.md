# Spec Research: Safe Arc Hero

**Date:** 2026-03-16
**Author:** @trilogy
**Spec:** `01-safe-arc-hero`

---

## Problem Context

`AIArcHero.tsx` is the primary crash source for the AI tab. It uses `useAnimatedProps` with `arcPath()` — a function that generates a new SVG path string on **every animation frame** inside the Reanimated worklet runtime. With `withSpring(springPremium)` (damping 18, stiffness 120), the spring settles over ~2 seconds at 60fps = **~120 string allocations per animation** on the Hermes worklet heap.

Simultaneously, `useStaggeredEntry({ count: 5 })` fires 10 springs on the same mount event. The combined worklet heap pressure causes a Jetsam SIGKILL — iOS kills the process before the crash reporter writes (no `.ips` file).

This spec replaces the per-frame path string approach with `strokeDashoffset` animation — animating a single number instead of a full path string.

---

## Exploration Findings

### Existing Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| `useAnimatedProps` number-only | TrendSparkline, WeeklyBarChart | Animate single numeric values; much lower GC pressure than strings |
| `strokeDashoffset` arc fill | Web SVG standard, not yet in codebase | Statically defines the arc path; animates how much of it is "drawn" |
| `withTiming(target, timingChartFill)` | All Skia charts, MetricValue | 1800ms Expo ease-out; deterministic; shorter than springPremium |
| Static SVG path on `<Path d={...}>` | AIConeChart track arc | Pre-computed once in render scope, not per-frame |
| `useAnimatedStyle` for opacity only | AmbientBackground, FadeInScreen | Opacity animation = single number; safe |

### Key Files

| File | Relevance |
|------|-----------|
| `src/components/AIArcHero.tsx` | File to modify — contains the crashing `useAnimatedProps` |
| `src/lib/reanimated-presets.ts` | `timingChartFill` (1800ms Expo ease-out) replaces `springPremium` |
| `src/components/TrendSparkline.tsx` | Reference: `clipProgress` clip animation (number-only, safe) |
| `src/components/WeeklyBarChart.tsx` | Reference: `clipProgress` clip animation (number-only, safe) |

### Current Crash Code (in AIArcHero.tsx)

```typescript
// CURRENT — crashes: arcPath() generates a string on every worklet frame
const fillEndAngle = useSharedValue(START_ANGLE);
useEffect(() => {
  fillEndAngle.value = withSpring(targetAngle, springPremium); // 60fps × 2s = 120 frames
}, [aiPct]);
const animatedFillProps = useAnimatedProps(() => ({
  d: arcPath(cx, cy, r, START_ANGLE, fillEndAngle.value), // ← string allocation per frame
}));
```

### Integration Points

- `AIArcHero` is imported by `ai.tsx` — external API (props) must not change
- `arcPath()` is exported and referenced in existing tests — keep the export but do not call it from worklets
- `ProgressBar` and `Card` dependencies unchanged
- `AnimatedPath = Animated.createAnimatedComponent(Path)` — still needed for `strokeDashoffset`

---

## Key Decisions

### Decision 1: strokeDashoffset vs Skia Canvas

**Options considered:**
1. **`strokeDashoffset` on SVG Path** — Set `strokeDasharray=[arcLength, arcLength]` on a pre-drawn full arc. Animate `strokeDashoffset` from `arcLength` (invisible) to `arcLength * (1 - aiPct/100)` (filled). `useAnimatedProps` only receives a single number per frame.
2. **Skia Canvas `drawArc`** — Use `@shopify/react-native-skia` (already installed) to draw the arc natively. SharedValue drives `sweepAngle` directly; Skia renders on the native thread with zero Hermes heap involvement.
3. **Opacity-only animation** — Keep static SVG arc at target angle, just fade it in. Simplest but loses the "filling" visual that gives AI% a satisfying progress feel.

**Chosen:** Option 1 — `strokeDashoffset` on SVG Path.

**Rationale:**
- Minimal change to AIArcHero structure (stays SVG-based, same component shape)
- `strokeDashoffset` animates a single `number` — GC pressure is trivially low (one double per frame)
- Skia canvas would work too but requires more structural changes and adds another canvas to the AI tab (which already has two: AIConeChart + TrendSparkline)
- Opacity-only loses the interactive fill feel that communicates "AI% as progress"

### Decision 2: withSpring → withTiming

**Options considered:**
1. Keep `withSpring(springPremium)` — spring feel, but longer runtime (2s+) means more frames
2. Use `withTiming(target, timingChartFill)` — 1800ms Expo ease-out, same duration as chart animations, deterministic

**Chosen:** `withTiming(target, timingChartFill)`.

**Rationale:** The spring "premium" feel was the motivation for `springPremium`, but the arc fill is a one-time mount animation (data arrival event), not an ongoing interaction. `timingChartFill` gives a "data settling on truth" feel consistent with WeeklyBarChart and TrendSparkline. It's also 200ms shorter, reducing total frame count.

### Decision 3: arcPath() export preserved

`arcPath()` is exported and tested. The implementation stays unchanged. The only change is where it is called: from JS render scope (once) instead of from the worklet (per frame). Tests importing `arcPath` continue to work unchanged.

---

## Interface Contracts

### AIArcHero Props (unchanged)

```typescript
// Props interface unchanged — no caller changes needed
interface AIArcHeroProps {
  aiPct: number;               // ← src: useAIData().data.aiPctLow/High midpoint
  brainliftHours: number;      // ← src: useAIData().data.brainliftHours
  deltaPercent: number | null; // ← src: computed in ai.tsx from previousWeekPercent
  ambientColor: string;        // ← src: getAmbientColor({ type: 'aiPct', pct })
  size?: number;               // ← default 180
}
```

### Internal Animation Contract (changed)

```typescript
// Before (UNSAFE — per-frame string allocation in worklet):
//   fillEndAngle: SharedValue<number>  — drives arcPath() in worklet
//   animatedFillProps: { d: string }   — new string every frame

// After (SAFE — number only in worklet):
//   fullArcPath: string         — arcPath() called ONCE in render scope (JS thread)
//   arcLength: number           — r * (SWEEP * Math.PI / 180), computed once
//   dashOffset: SharedValue<number>  — animates arcLength → arcLength*(1-aiPct/100)
//   fillProps: { strokeDashoffset: number }  — single number per frame

// strokeDasharray pattern:
//   strokeDasharray={[arcLength, arcLength]}  — gap = arcLength = full arc is "one dash"
//   strokeDashoffset = arcLength              → "dash" shifted to invisible (empty)
//   strokeDashoffset = 0                      → full arc visible
//   strokeDashoffset = arcLength * (1-p/100) → p% of arc visible
```

### arcPath() function (unchanged)

```typescript
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string
// Behavior unchanged. Must NOT be called from worklet scope.
```

### Function Contracts

| Function | Signature | Responsibility | Source |
|----------|-----------|----------------|--------|
| `arcPath` | `(cx,cy,r,start,end) => string` | SVG arc path string — called in render, not worklet | existing |
| `AIArcHero` | `(props: AIArcHeroProps) => JSX.Element` | Renders arc gauge with strokeDashoffset animation | modify |

---

## Test Plan

### AIArcHero component

**Signature:** `AIArcHero({ aiPct, brainliftHours, deltaPercent, ambientColor, size? })`

**Happy Path:**
- Renders without crash with aiPct=0, brainliftHours=0, deltaPercent=null, ambientColor=violet
- Renders without crash with aiPct=65, brainliftHours=3.5, deltaPercent=+8.2, ambientColor=cyan
- aiPct=100 renders without crash (full arc)
- Delta badge shows when deltaPercent !== null
- Delta badge hidden when deltaPercent === null

**Edge Cases:**
- aiPct=0: dashOffset = arcLength (arc invisible) — no crash, renders empty track
- aiPct=100: dashOffset = 0 (full arc) — no crash
- brainliftHours=0: progress bar at 0%
- brainliftHours > BRAINLIFT_TARGET_HOURS (> 5): progress clamped to 100%
- size prop overrides default 180

**Animation Contract (source-level checks):**
- Source does NOT call `arcPath()` inside `useAnimatedProps` worklet
- Source calls `arcPath()` at render scope (outside any `() => ({ ... })` worklet callback)
- `useAnimatedProps` returns `{ strokeDashoffset: dashOffset.value }` — number only
- `withTiming` used (not `withSpring`) for fill animation
- `strokeDasharray` set on the fill Path

**Mocks Needed:**
- `react-native-svg`: `Path`, `Svg`, `AnimatedPath` — mock as passthrough elements
- `react-native-reanimated`: jest preset (already configured)
- `@/src/components/Card`: passthrough
- `@/src/components/ProgressBar`: passthrough

### arcPath() function

**Signature:** `arcPath(cx, cy, r, startAngleDeg, endAngleDeg): string`

**Happy Path:**
- Returns valid SVG arc string for standard inputs (cx=90, cy=90, r=87, start=135, end=405)
- Result starts with "M " and contains " A "

**Edge Cases:**
- startAngleDeg === endAngleDeg → returns "M x y" (no arc, no crash)
- sweepAngle > 180 → largeArcFlag=1
- sweepAngle ≤ 180 → largeArcFlag=0

**Mocks Needed:** None (pure function)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/AIArcHero.tsx` | modify | Replace useAnimatedProps path-string with strokeDashoffset |
| `src/components/__tests__/AIArcHero.test.tsx` | create | Tests for new animation approach + arcPath |

---

## Edge Cases to Handle

1. **aiPct changes after mount** — `useEffect([aiPct])` re-triggers `withTiming` to new target; dashOffset animates from current value (mid-animation if data arrives while first animation runs). `withTiming` cancels previous animation automatically.
2. **aiPct=0 on first render** — dashOffset = arcLength (full gap, invisible). Fill animation plays when real data arrives.
3. **ambientColor changes** — `stroke={ambientColor}` is a regular React prop; color updates on re-render (not animated). Acceptable — color doesn't need per-frame animation.
4. **size prop not 180** — all geometry (cx, cy, r, arcLength, fullArcPath) must be derived from `size`, not hardcoded.

---

## Open Questions

None remaining.
