# Safe Cone Scrub

**Status:** Draft
**Created:** 2026-03-16
**Last Updated:** 2026-03-16
**Owner:** @trilogy

---

## Overview

### What Is Being Built

`02-safe-cone-scrub` adds an **animation-completion gate** to `AIConeChart.tsx` that prevents the scrub gesture and its `useAnimatedReaction` callbacks from firing during the 2800ms clip animation window.

### Why

`AIConeChart` mounts with a `clipProgress` animation running immediately (0→1 over 2800ms). During this window:
1. The pan gesture handler is live and could receive spurious system events
2. The two `useAnimatedReaction` hooks (`scrubIndex`, `isScrubbing`) are unconditionally active — any worklet-to-JS bridge call (`runOnJS`) during this window adds microtask pressure to the already memory-pressured mount phase

### How

A single `animDone` boolean state is introduced:

1. **`withTiming` completion callback** — the existing `clipProgress.value = withTiming(1, CONE_ANIMATION)` gains a 3rd argument: a worklet callback that calls `runOnJS(setAnimDone)(true)`. This fires exactly once when the animation completes (or immediately if `useReducedMotion` is active).

2. **Gesture gate** — `GestureDetector` gains `enabled={animDone && size === 'full'}`. Pan events are physically blocked during the animation window.

3. **Reaction guard** — Both `useAnimatedReaction` callbacks check `if (!animDone) return` as a belt-and-suspenders defense. If any system event somehow triggers the reactions before `animDone` is set, the `runOnJS` bridge call is skipped.

### Scope

- Modifies `AIConeChart.tsx` only (no prop API changes)
- Updates `AIConeChart.test.tsx` and `AITabConeIntegration.test.tsx` to cover the new gate behavior
- No changes to `useScrubGesture`, `ai.tsx`, or any other file

---

## Out of Scope

1. **Replacing `useAnimatedReaction` with a different pattern** — Descoped. The goal is gating, not rewriting. The existing reaction hooks are correct; only their activation timing needs guarding.

2. **Modifying `useScrubGesture`** — Descoped. The hook correctly manages `scrubIndex` and `isScrubbing`; the problem is in the consumer (`AIConeChart`), not the producer.

3. **Compact variant scrub support** — Descoped. `size="compact"` (home tab) has no `onScrubChange` and no gesture intentionally. The `enabled={animDone && size === 'full'}` guard preserves this behavior without change.

4. **`ScrubReactionBridge` child component pattern** — Descoped. The research evaluated mounting reactions in a child component (Option 1 in Decision 2) and chose the simpler `if (!animDone) return` guard approach instead.

5. **Animation duration changes** — Descoped. The 2800ms `CONE_ANIMATION` constant is unchanged. This spec only gates behavior relative to that existing duration.

6. **AIArcHero animation safety** — Deferred to `01-safe-arc-hero`. That spec addresses the primary crash source (per-frame path string generation). This spec addresses the secondary scrub gating concern.

7. **`useHistoryBackfill` relocation** — Deferred to `03-backfill-relocation`.

8. **`ai.tsx` data-gated rendering** — Deferred to `04-ai-tab-screen`.

---

## Functional Requirements

### FR1: Animation-Complete State

`AIConeChart` must track whether the clip animation has finished via an `animDone` boolean state (default `false`).

**Success Criteria:**
- `animDone` starts as `false` on mount
- `animDone` becomes `true` exactly once after the clip animation completes
- `animDone` resets to `false` on remount (e.g. when `ai.tsx` remounts via `key` prop change)
- When `useReducedMotion` is active, `animDone` is set to `true` synchronously (no 2800ms wait)
- No duplicate `setAnimDone(true)` calls on re-render

### FR2: Gesture Gate

The `GestureDetector` must be disabled during the animation window.

**Success Criteria:**
- On mount, `GestureDetector` has `enabled={false}` (gesture physically blocked)
- After animation completes (`animDone = true`), `GestureDetector` has `enabled={true}` for `size="full"` charts
- For `size="compact"` charts, `GestureDetector` remains `enabled={false}` regardless of `animDone`
- The `enabled` prop expression is `animDone && size === 'full'` (or logically equivalent)

### FR3: Reaction Guard

Both `useAnimatedReaction` callbacks must include a guard that skips the `runOnJS` bridge call when `animDone` is `false`.

**Success Criteria:**
- `scrubIndex` reaction callback: `if (!animDone) return` guard present before any `runOnJS` call
- `isScrubbing` reaction callback: `if (!animDone) return` guard present before any `runOnJS` call
- Guard is checked on the worklet thread (inside the reaction callback, not in the result handler)
- `onScrubChange` is NOT called during the animation window even if `scrubIndex` changes
- `onScrubChange` IS called after `animDone = true` when scrub gesture activates

### FR4: Completion Callback

The `withTiming` call for `clipProgress` must include a completion callback that sets `animDone`.

**Success Criteria:**
- `clipProgress.value = withTiming(1, CONE_ANIMATION, callback)` where callback calls `runOnJS(setAnimDone)(true)`
- Callback fires exactly once per animation lifecycle
- If component unmounts before animation completes, callback does not call `setAnimDone` on unmounted component (guarded via `isMounted` ref or equivalent)

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/components/AIConeChart.tsx` | File to modify |
| `hourglassws/src/hooks/useScrubGesture.ts` | Read-only reference — provides `scrubIndex`, `isScrubbing` |
| `hourglassws/src/components/__tests__/AIConeChart.test.tsx` | Tests to update |
| `hourglassws/src/components/__tests__/AITabConeIntegration.test.tsx` | Integration tests to update |

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/src/components/AIConeChart.tsx` | Add `animDone` state, gate gesture + reactions, update `withTiming` call |
| `hourglassws/src/components/__tests__/AIConeChart.test.tsx` | Add tests for animation gate behavior |
| `hourglassws/src/components/__tests__/AITabConeIntegration.test.tsx` | Update for scrub-gating structure |

### Implementation Design

#### New State

```typescript
const [animDone, setAnimDone] = useState(false);
const isMountedRef = useRef(true);

useEffect(() => {
  return () => { isMountedRef.current = false; };
}, []);
```

#### Updated Clip Animation (FR4)

```typescript
useEffect(() => {
  if (reduceMotion) {
    clipProgress.value = 1;
    setAnimDone(true);
    return;
  }
  clipProgress.value = withTiming(
    1,
    CONE_ANIMATION,
    () => {
      'worklet';
      if (isMountedRef.current) {
        runOnJS(setAnimDone)(true);
      }
    }
  );
}, []);
```

Note: The `withTiming` 3rd argument (callback) runs on the UI thread as a worklet. `runOnJS(setAnimDone)(true)` bridges to the JS thread. The `isMountedRef` check prevents the setState call on an unmounted component.

#### Gesture Gate (FR2)

```tsx
<GestureDetector gesture={gesture} enabled={animDone && size === 'full'}>
  {/* Canvas */}
</GestureDetector>
```

#### Reaction Guards (FR3)

```typescript
useAnimatedReaction(
  () => scrubIndex.value,
  (index) => {
    if (!animDone) return;
    runOnJS(handleScrubIndex)(index);
  },
);

useAnimatedReaction(
  () => isScrubbing.value,
  (active) => {
    if (!animDone) return;
    runOnJS(handleIsScrubbing)(active);
  },
);
```

### Data Flow

```
mount
  └── clipProgress starts at 0
  └── animDone = false
  └── GestureDetector.enabled = false
  └── reactions registered (but guarded)
        │
        ▼ (2800ms withTiming)
  └── withTiming completion callback fires
  └── runOnJS(setAnimDone)(true)
  └── animDone = true
  └── GestureDetector.enabled = true (if size === 'full')
  └── reactions now pass guard → runOnJS bridge active
        │
        ▼ (user pan gesture)
  └── scrubIndex changes → reaction fires → handleScrubIndex → onScrubChange
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| `size="compact"` | `enabled={animDone && false}` → never enabled; reactions guard still applies |
| Unmount before 2800ms | `isMountedRef.current = false`; completion callback skips `setAnimDone` |
| `useReducedMotion=true` | `setAnimDone(true)` called synchronously; no 2800ms wait |
| `key` prop remount | `animDone` resets to `false`; fresh animation + gate cycle |
| `scrubIndex` changes before `animDone` | Reaction guard fires, `runOnJS` skipped, `onScrubChange` NOT called |

### Test Strategy

#### Unit Tests (AIConeChart.test.tsx)

1. **Gate disabled on mount** — render chart, assert `GestureDetector` prop `enabled={false}`
2. **Gate enabled after animation** — advance timers past 2800ms, assert `enabled={true}` (full size)
3. **Compact always disabled** — render with `size="compact"`, advance timers, assert `enabled={false}`
4. **`onScrubChange` not called during animation** — trigger scrub before 2800ms, assert not called
5. **`onScrubChange` called after animation** — trigger scrub after 2800ms, assert called
6. **`reduceMotion` instant enable** — mock `useReducedMotion=true`, assert `enabled={true}` immediately

#### Integration Tests (AITabConeIntegration.test.tsx)

- Confirm scrub gating doesn't break normal post-animation scrub flow
- Confirm `onScrubChange` receives correct `AIScrubPoint` data after gate opens

### Mocks Required

| Mock | Location | Notes |
|------|----------|-------|
| `react-native-reanimated` | jest preset | Already configured; `withTiming` callback must be invokable in tests |
| `@shopify/react-native-skia` | `__mocks__/@shopify/react-native-skia.ts` | Already exists |
| `react-native-gesture-handler` | jest setup | GestureDetector mock needed |
| `@/src/hooks/useScrubGesture` | inline mock | Return stable SharedValues |
