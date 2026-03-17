# Checklist: Safe Cone Scrub

**Spec:** `02-safe-cone-scrub`
**Feature:** `ai-tab-rebuild`

---

## Phase 2.0: Tests (Red Phase)

### FR1: Animation-Complete State

- [ ] Write test: `animDone` is `false` on initial render
- [ ] Write test: `animDone` becomes `true` after `withTiming` completion callback fires (advance fake timers past 2800ms)
- [ ] Write test: `animDone` resets to `false` on remount
- [ ] Write test: `animDone` set to `true` synchronously when `useReducedMotion` is active
- [ ] Write test: no duplicate `setAnimDone(true)` calls on re-render

### FR2: Gesture Gate

- [ ] Write test: `GestureDetector` has `enabled={false}` on mount
- [ ] Write test: `GestureDetector` has `enabled={true}` after animation completes for `size="full"`
- [ ] Write test: `GestureDetector` remains `enabled={false}` for `size="compact"` after animation completes

### FR3: Reaction Guard

- [ ] Write test: `onScrubChange` is NOT called when scrub gesture activates before animation completes
- [ ] Write test: `onScrubChange` IS called when scrub gesture activates after animation completes
- [ ] Write test: both `scrubIndex` and `isScrubbing` reactions include `if (!animDone) return` guard (source-level check or behavior test)

### FR4: Completion Callback

- [ ] Write test: `withTiming` is called with 3 arguments (value, config, callback)
- [ ] Write test: `setAnimDone` is NOT called if component unmounts before animation completes

### Integration Tests (AITabConeIntegration.test.tsx)

- [ ] Update integration tests to account for animation gate (scrub only works post-animation)
- [ ] Verify `onScrubChange` receives correct `AIScrubPoint` data after gate opens

---

## Phase 2.1: Implementation

### FR1: Animation-Complete State

- [ ] Add `const [animDone, setAnimDone] = useState(false)` to `AIConeChart`
- [ ] Add `isMountedRef` with cleanup effect
- [ ] Verify `animDone` starts `false` and transitions to `true` exactly once

### FR2: Gesture Gate

- [ ] Add `enabled={animDone && size === 'full'}` to `GestureDetector`
- [ ] Verify compact variant unaffected

### FR3: Reaction Guards

- [ ] Add `if (!animDone) return` guard to `scrubIndex` reaction callback
- [ ] Add `if (!animDone) return` guard to `isScrubbing` reaction callback

### FR4: Completion Callback

- [ ] Update `clipProgress.value = withTiming(1, CONE_ANIMATION)` to include worklet completion callback
- [ ] Callback calls `runOnJS(setAnimDone)(true)` when `isMountedRef.current === true`
- [ ] Handle `reduceMotion` path: set `clipProgress.value = 1` and call `setAnimDone(true)` synchronously

### Verification

- [ ] Run `AIConeChart.test.tsx` — all tests pass
- [ ] Run `AITabConeIntegration.test.tsx` — all tests pass
- [ ] Run full test suite: `cd hourglassws && npx jest` — no regressions

---

## Phase 2.2: Review

- [ ] Run spec-implementation-alignment check
- [ ] Run pr-review-toolkit:review-pr
- [ ] Address any feedback
- [ ] Run test-optimiser

---

## Session Notes

<!-- Populated after execution -->
