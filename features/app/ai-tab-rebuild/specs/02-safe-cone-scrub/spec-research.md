# Spec Research: Safe Cone Scrub

**Date:** 2026-03-16
**Author:** @trilogy
**Spec:** `02-safe-cone-scrub`

---

## Problem Context

`AIConeChart.tsx` contains two `useAnimatedReaction + runOnJS` calls for the scrub gesture cursor. While `useAnimatedReaction` only fires when the tracked value _changes_ (not every frame), there is a risk during mount: when the `GestureDetector` and underlying `useScrubGesture` initialize, the `scrubIndex` SharedValue may transition from its initial state (undefined/null) to -1, firing the reaction at mount time.

More importantly, the clip animation (`clipProgress` 0→1 over 2800ms) runs immediately on mount. During this animation window, the pan gesture handler is live and could receive spurious events from the system. Any `runOnJS` call during the 2800ms animation window adds to the JS thread microtask queue during what is already a memory-pressured moment.

This spec gates the scrub `useAnimatedReaction` calls behind an `animationComplete` state that is set after the 2800ms clip animation finishes. The gesture detector also only becomes active after animation completes.

---

## Exploration Findings

### Existing Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| `useAnimatedReaction` gate | Not yet in codebase | New pattern: only subscribe after a condition is met |
| `withTiming` completion callback | Reanimated docs | `withTiming(1, config, callback)` — 3rd arg is run on JS thread when animation completes |
| State-gated gesture | Various apps | `enabled` prop on `GestureDetector` or pan gesture |
| `animationComplete` flag | WeeklyBarChart comment | Not implemented; mentioned as future optimization |

### Key Files

| File | Relevance |
|------|-----------|
| `src/components/AIConeChart.tsx` | File to modify — contains the two `useAnimatedReaction + runOnJS` calls |
| `src/hooks/useScrubGesture.ts` | Drives scrubIndex; no changes needed here |
| `src/components/__tests__/AIConeChart.test.tsx` | Tests to update for animation-gated behavior |
| `src/components/__tests__/AITabConeIntegration.test.tsx` | Integration tests to update |

### Current Code (AIConeChart.tsx)

```typescript
// Clip animation — fires immediately on mount
useEffect(() => {
  clipProgress.value = withTiming(1, CONE_ANIMATION); // 2800ms
}, []);

// Scrub reactions — currently unconditional at mount
useAnimatedReaction(() => scrubIndex.value, handleScrubIndex);
useAnimatedReaction(() => isScrubbing.value, handleIsScrubbing);
```

### Integration Points

- `AIConeChart` is used in `ai.tsx` with `size="full"` and `onScrubChange` prop
- `AIConeChart` is used in home tab `index.tsx` with `size="compact"` and no `onScrubChange` — compact variant has no scrub gesture (no change needed)
- `scrubIndex` and `isScrubbing` come from `useScrubGesture` — no changes to that hook
- `GestureDetector` wraps the Canvas — can be conditionally enabled

---

## Key Decisions

### Decision 1: Animation Completion Gate Strategy

**Options considered:**
1. **`withTiming` completion callback** — `withTiming(1, CONE_ANIMATION, () => runOnJS(setAnimDone)(true))`. Clean: fires exactly once when animation completes on the UI thread, then bridges to React state.
2. **`useState + setTimeout(2800)`** — Set a JS timer for 2800ms after mount. Simpler but slightly imprecise (JS timer drift) and doesn't account for `useReducedMotion` (instant completion).
3. **`useSharedValue(false)` + `useAnimatedReaction`** — Track animation completion in worklet via `clipProgress.value === 1`. Adds another reaction subscription.

**Chosen:** Option 1 — `withTiming` completion callback with `runOnJS(setAnimDone)(true)`.

**Rationale:** Precise (fires exactly when animation completes), handles `useReducedMotion` naturally (if motion is reduced, `withTiming` completes immediately → callback fires immediately → scrub enabled at once), no timer drift. The `runOnJS` here is acceptable — it fires exactly once (on animation completion), not per-frame.

### Decision 2: How to Disable Reactions Before Animation Completes

**Options considered:**
1. **Conditional rendering of `<ScrubReactionBridge />`** — Wrap the two `useAnimatedReaction` calls in a child component; only mount after `animDone=true`. Clean: reactions literally don't exist during animation.
2. **`if (!animDone) return` inside reaction callbacks** — Reactions are registered but do nothing. Slightly wasteful but simpler.
3. **`enabled` prop on pan gesture** — Prevents gesture events during animation. Doesn't gate the reactions, but prevents the gesture from triggering `scrubIndex` changes.

**Chosen:** Option 3 for gesture, Option 2 for reactions (combined approach).

**Rationale:** The `GestureDetector` has an `enabled` prop that can gate user input. Setting `enabled={animDone}` prevents any pan events during animation. The reactions check `if (!animDone) return` as a belt-and-suspenders guard. This is simpler than a child component approach (avoids hook rule complications) and keeps the code readable.

---

## Interface Contracts

### AIConeChart Props (unchanged)

```typescript
interface AIConeChartProps {
  data: ConeData;
  width: number;
  height: number;
  size?: 'full' | 'compact';
  onScrubChange?: (point: AIScrubPoint | null) => void;
}
// No props change. animDone is internal state only.
```

### Internal Animation Gate Contract

```typescript
// New internal state:
const [animDone, setAnimDone] = useState(false);

// Clip animation with completion callback:
useEffect(() => {
  if (reduceMotion) {
    clipProgress.value = 1;
    setAnimDone(true);
    return;
  }
  clipProgress.value = withTiming(1, CONE_ANIMATION, runOnJS(setAnimDone)(true));
}, []);

// Gesture gate:
// <GestureDetector gesture={gesture} enabled={animDone && size === 'full'}>

// Reaction guard (belt-and-suspenders):
useAnimatedReaction(
  () => scrubIndex.value,
  (index) => {
    if (!animDone) return; // guard: no JS calls during animation window
    runOnJS(handleScrubIndex)(index);
  },
);
```

### AIScrubPoint (unchanged)

```typescript
export interface AIScrubPoint {
  pctY: number;
  hoursX: number;
  upperPct: number;
  lowerPct: number;
}
```

### Function Contracts

| Function | Signature | Responsibility | Notes |
|----------|-----------|----------------|-------|
| `AIConeChart` | `(props) => JSX.Element` | Renders cone with animation-gated scrub | modify |
| `handleScrubIndex` (internal) | `(index: number) => void` | Maps scrub index to AIScrubPoint | unchanged |
| `handleIsScrubbing` (internal) | `(active: boolean) => void` | Emits null on release | unchanged |

---

## Test Plan

### AIConeChart animation gate

**Happy Path:**
- On mount, gesture is disabled (`enabled={false}`)
- After 2800ms, gesture becomes enabled (`enabled={true}` via animDone state)
- `onScrubChange` is not called during animation window (no scrub events possible)
- `onScrubChange` IS called after animation completes when scrub gesture activates

**Edge Cases:**
- `size="compact"`: gesture never enabled (size guard still applies)
- `useReducedMotion=true`: `animDone` set immediately (instant animation completion)
- `data` with empty `hourlyPoints`: scrub has no data points to snap to (existing behavior)

**Animation Completion Callback:**
- `withTiming` callback fires exactly once
- `setAnimDone(true)` called exactly once per mount
- No duplicate calls on re-render

**Source-Level Checks:**
- `useAnimatedReaction` callbacks include `if (!animDone) return` guard
- `GestureDetector` has `enabled={animDone && size === 'full'}` or equivalent
- `withTiming` call includes 3rd argument (completion callback)

**Mocks Needed:**
- `react-native-reanimated`: jest preset (already configured)
- `@shopify/react-native-skia`: existing mock at `__mocks__/@shopify/react-native-skia.ts`
- `react-native-gesture-handler`: mock for GestureDetector
- `@/src/hooks/useScrubGesture`: mock returning stable scrubIndex=-1, isScrubbing=false

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/AIConeChart.tsx` | modify | Add animDone state; gate gesture + reactions |
| `src/components/__tests__/AIConeChart.test.tsx` | modify | Add tests for animation-gated scrub |
| `src/components/__tests__/AITabConeIntegration.test.tsx` | modify | Update integration tests if scrub gating affects structure |

---

## Edge Cases to Handle

1. **Chart unmounts before animation completes** — `withTiming` completion callback fires on unmounted component. Guard: use `isMounted` ref or check in callback before calling `setAnimDone`.
2. **`key` prop remount** — `ai.tsx` uses `key={chartKey}` to remount chart on focus. On remount, `animDone` resets to `false`; animation starts fresh. This is correct behavior.
3. **`size="compact"` on home tab** — The compact variant has no `onScrubChange` and no gesture. `animDone` still tracks animation completion but `enabled` guard is `animDone && size === 'full'` so the compact variant is unaffected.

---

## Open Questions

None remaining.
