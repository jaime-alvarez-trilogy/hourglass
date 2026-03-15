# Checklist: 04-ai-scrub

**Spec:** AIConeChart scrub gesture + AI tab hero value sync
**Blocked by:** 03-scrub-engine (complete)

---

## Phase 4.0 — Tests (Red Phase)

Write tests first. All tests must fail before implementation begins.

### FR1: AIConeChart Scrub Gesture Integration

- [ ] SC1.1 — `AIConeChartProps` interface includes `onScrubChange?: (point: AIScrubPoint | null) => void` (source analysis)
- [ ] SC1.2 — `AIScrubPoint` is exported from `AIConeChart.tsx` with `pctY`, `hoursX`, `upperPct`, `lowerPct` fields (source analysis)
- [ ] SC1.3 — `onScrubChange` fires with `AIScrubPoint` when `size="full"` and user drags (render/source test)
- [ ] SC1.4 — `onScrubChange(null)` fires when finger lifts on `size="full"` chart (source analysis)
- [ ] SC1.5 — `size="compact"`: `onScrubChange` never fires (gesture disabled, source analysis)
- [ ] SC1.6 — No crash when `onScrubChange` not provided (render test)
- [ ] SC1.7 — Empty `hourlyPoints`: no crash (render test with MONDAY_CONE_DATA variant)
- [ ] SC1.8 — `hourlyPoints.length === 1`: callback fires with index 0 data (source analysis)
- [ ] SC1.9 — Source imports `useScrubGesture` from `@/src/hooks/useScrubGesture` (source analysis)
- [ ] SC1.10 — Source wraps Canvas in `GestureDetector` from `react-native-gesture-handler` (source analysis)

### FR2: ScrubCursor Rendering

- [ ] SC2.1 — Source imports `buildScrubCursor` from `@/src/components/ScrubCursor` (source analysis)
- [ ] SC2.2 — When `isScrubActive === true`, a `Path` rendered with `colors.textMuted` at `opacity={0.5}` (source analysis)
- [ ] SC2.3 — When `isScrubActive === true`, a `Circle` rendered at snapped dot position (source analysis)
- [ ] SC2.4 — When `isScrubActive === false`, cursor layers not rendered (conditional guard in source)
- [ ] SC2.5 — Cursor layers rendered after all other chart path layers (source position analysis)
- [ ] SC2.6 — `scrubCursor.linePath` produced by `buildScrubCursor` (source analysis)
- [ ] SC2.7 — `size="compact"` chart: no cursor rendered (source analysis)

### FR3: AI Tab Hero Value Sync

- [ ] SC3.1 — `ai.tsx` declares `scrubPoint` state of type `AIScrubPoint | null` (source analysis)
- [ ] SC3.2 — When `scrubPoint !== null`, MetricValue `value` equals `scrubPoint.pctY` (source analysis)
- [ ] SC3.3 — When `scrubPoint === null`, MetricValue `value` equals live `aiPercent` (source analysis)
- [ ] SC3.4 — `scrubPoint.pctY = 0` → hero shows `0` not live value (source analysis of ternary)
- [ ] SC3.5 — `scrubPoint.pctY = 100` → hero shows `100` (source analysis of ternary)
- [ ] SC3.6 — AIConeChart in `ai.tsx` receives `onScrubChange={setScrubPoint}` prop (source analysis)
- [ ] SC3.7 — Legend has `opacity: isScrubActive ? 0 : 1` or equivalent (source analysis)
- [ ] SC3.8 — Legend visibility uses `isScrubActive` bridged state, no new prop on `AIConeChartProps` (source analysis)
- [ ] SC3.9 — MetricValue `precision` is `1` for the AI% hero display (source analysis)

**Commit after completing all Phase 4.0 tests:**
```
test(04-ai-scrub): add scrub gesture and hero sync tests
```

---

## Phase 4.1 — Implementation (Green Phase)

Make all tests pass. No new code beyond what's needed to pass tests.

### FR1: AIConeChart Scrub Gesture Integration

- [ ] Export `AIScrubPoint` interface from `AIConeChart.tsx`
- [ ] Add `onScrubChange?: (point: AIScrubPoint | null) => void` to `AIConeChartProps`
- [ ] Add `pixelXs` computation to existing `useMemo` (map `hourlyPoints` through `toPixelFn`)
- [ ] Call `useScrubGesture({ pixelXs, enabled: size === 'full' })`
- [ ] Add `useAnimatedReaction` on `scrubIndex` → `runOnJS(onScrubChange)(point)`
- [ ] Add `useAnimatedReaction` on `isScrubbing` false → `runOnJS(onScrubChange)(null)`
- [ ] Wrap `Canvas` in `GestureDetector gesture={gesture}`
- [ ] Import `GestureDetector` from `react-native-gesture-handler`
- [ ] Import `useScrubGesture` from `@/src/hooks/useScrubGesture`

**Commit after FR1 tests pass:**
```
feat(FR1): add onScrubChange prop and gesture integration to AIConeChart
```

### FR2: ScrubCursor Rendering

- [ ] Import `buildScrubCursor`, `ScrubCursorResult` from `@/src/components/ScrubCursor`
- [ ] Add `isScrubActive` React state (bridged from `isScrubbing`)
- [ ] Add `scrubCursor` React state (bridged from `scrubIndex` via `buildScrubCursor`)
- [ ] Add `useAnimatedReaction` on `isScrubbing` → `runOnJS(setIsScrubActive)(scrubbing)`
- [ ] Add `useAnimatedReaction` on `scrubIndex` → `runOnJS(setScrubCursor)(buildScrubCursor(...))`
- [ ] Add conditional `<Path>` (cursor line) and `<Circle>` (dot) at end of Canvas, guarded by `isScrubActive && scrubCursor`
- [ ] Add legend `opacity: isScrubActive ? 0 : 1` to the legend row View

**Commit after FR2 tests pass:**
```
feat(FR2): render ScrubCursor inside AIConeChart and fade legend during scrub
```

### FR3: AI Tab Hero Value Sync

- [ ] Import `AIScrubPoint` type from `@/src/components/AIConeChart` in `ai.tsx`
- [ ] Add `scrubPoint` state: `const [scrubPoint, setScrubPoint] = useState<AIScrubPoint | null>(null)`
- [ ] Compute `heroAIPct = scrubPoint !== null ? scrubPoint.pctY : aiPercent`
- [ ] Update `MetricValue` to use `value={heroAIPct}` and `precision={1}`
- [ ] Pass `onScrubChange={setScrubPoint}` to `AIConeChart`

**Commit after FR3 tests pass:**
```
feat(FR3): wire ai.tsx hero MetricValue to AIConeChart scrub callback
```

**Run full test suite after all FRs implemented:**
```bash
cd hourglassws && npx jest src/components/__tests__/AIConeChart.test.tsx --no-coverage
```

---

## Phase 4.2 — Review

- [ ] Run `spec-implementation-alignment` agent to verify implementation matches spec
- [ ] Run `pr-review-toolkit:review-pr` to catch code quality issues
- [ ] Address any review feedback
- [ ] Run `test-optimiser` to check test quality

---

## Files Modified

- `hourglassws/src/components/AIConeChart.tsx`
- `hourglassws/app/(tabs)/ai.tsx`
- `hourglassws/src/components/__tests__/AIConeChart.test.tsx` (new tests appended)
