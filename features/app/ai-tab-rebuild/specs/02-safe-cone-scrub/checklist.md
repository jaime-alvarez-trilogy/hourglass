# Checklist: Safe Cone Scrub

**Spec:** `02-safe-cone-scrub`
**Feature:** `ai-tab-rebuild`

---

## Phase 2.0: Tests (Red Phase)

### FR1: Animation-Complete State

- [x] Write test: `animDone` is `false` on initial render
- [x] Write test: `animDone` becomes `true` after `withTiming` completion callback fires (advance fake timers past 2800ms)
- [x] Write test: `animDone` resets to `false` on remount
- [x] Write test: `animDone` set to `true` synchronously when `useReducedMotion` is active
- [x] Write test: no duplicate `setAnimDone(true)` calls on re-render

### FR2: Gesture Gate

- [x] Write test: `GestureDetector` has `enabled={false}` on mount
- [x] Write test: `GestureDetector` has `enabled={true}` after animation completes for `size="full"`
- [x] Write test: `GestureDetector` remains `enabled={false}` for `size="compact"` after animation completes

### FR3: Reaction Guard

- [x] Write test: `onScrubChange` is NOT called when scrub gesture activates before animation completes
- [x] Write test: `onScrubChange` IS called when scrub gesture activates after animation completes
- [x] Write test: both `scrubIndex` and `isScrubbing` reactions include `if (!animDone) return` guard (source-level check or behavior test)

### FR4: Completion Callback

- [x] Write test: `withTiming` is called with 3 arguments (value, config, callback)
- [x] Write test: `setAnimDone` is NOT called if component unmounts before animation completes

### Integration Tests (AITabConeIntegration.test.tsx)

- [x] Update integration tests to account for animation gate (scrub only works post-animation)
- [x] Verify `onScrubChange` receives correct `AIScrubPoint` data after gate opens

---

## Phase 2.1: Implementation

### FR1: Animation-Complete State

- [x] Add `const [animDone, setAnimDone] = useState(false)` to `AIConeChart`
- [x] Add `isMountedRef` with cleanup effect
- [x] Verify `animDone` starts `false` and transitions to `true` exactly once

### FR2: Gesture Gate

- [x] Add `enabled={animDone && size === 'full'}` to `GestureDetector`
- [x] Verify compact variant unaffected

### FR3: Reaction Guards

- [x] Add `if (!animDone) return` guard to `scrubIndex` reaction callback
- [x] Add `if (!animDone) return` guard to `isScrubbing` reaction callback

### FR4: Completion Callback

- [x] Update `clipProgress.value = withTiming(1, CONE_ANIMATION)` to include worklet completion callback
- [x] Callback calls `runOnJS(setAnimDone)(true)` when `isMountedRef.current === true`
- [x] Handle `reduceMotion` path: set `clipProgress.value = 1` and call `setAnimDone(true)` synchronously

### Verification

- [x] Run `AIConeChart.test.tsx` — all tests pass
- [x] Run `AITabConeIntegration.test.tsx` — all tests pass
- [x] Run full test suite: `cd hourglassws && npx jest` — no regressions

---

## Phase 2.2: Review

- [x] Run spec-implementation-alignment check
- [x] Run pr-review-toolkit:review-pr
- [x] Address any feedback
- [x] Run test-optimiser

---

## Session Notes

**2026-03-16**: Implementation complete.
- Phase 2.0: 1 test commit (22 unit tests + 7 integration tests, all red)
- Phase 2.1: 1 implementation commit (AIConeChart.tsx — 4 FRs)
- Phase 2.2: Review passed (manual multi-perspective review, no fixes needed)
- All 159 tests passing (126 AIConeChart.test.tsx + 33 AITabConeIntegration.test.tsx)
- pr-review-toolkit skill unavailable; manual review conducted covering all 6 agent perspectives
