# Checklist: 02-home-hero-ambient

## Phase 2.0 — Tests (Red Phase)

### FR1 — Wire AmbientBackground to Home screen (index.test.tsx)

- [ ] `FR1.T1` — Add test: source imports `AmbientBackground` from `@/src/components/AmbientBackground`
- [ ] `FR1.T2` — Add test: source imports `getAmbientColor` from `@/src/components/AmbientBackground`
- [ ] `FR1.T3` — Add test: source renders `<AmbientBackground` in JSX
- [ ] `FR1.T4` — Add test: `AmbientBackground` appears before `ScrollView` in JSX (position check via source string index)
- [ ] `FR1.T5` — Add test: `getAmbientColor` is called with `type: 'panelState'` signal
- [ ] `FR1.T6` — Add test: `getAmbientColor` receives `panelState` as the state argument
- [ ] `FR1.T7` — Verify existing test `SC3.1` still passes: no StyleSheet import in index.tsx
- [ ] `FR1.T8` — Verify existing test `SC3.2` still passes: no hardcoded hex color strings in index.tsx

### FR2 — Expand PanelGradient radial gradient (PanelGradient.test.tsx)

- [ ] `FR2.T1` — Add test: source has `stopOpacity={0.50}` (inner stop opacity expanded)
- [ ] `FR2.T2` — Verify existing test `FR1.9` still passes: source has `r="70%"`
- [ ] `FR2.T3` — Verify existing test `FR1.7` still passes: source has `cx="50%"`
- [ ] `FR2.T4` — Verify existing test `FR1.8` still passes: source has `cy="30%"`
- [ ] `FR2.T5` — Verify existing `PANEL_GRADIENT_COLORS` export tests still pass (FR1.12–FR1.18)
- [ ] `FR2.T6` — Verify existing `getGlowStyle` export tests still pass (FR2.1–FR2.14)
- [ ] `FR2.T7` — Verify existing `BLUR_INTENSITY_PANEL === 30` test still passes (FR4.1)

### FR3 — Smooth ambient color transitions (source-level)

- [ ] `FR3.T1` — Add test: `index.tsx` source does NOT import `springPremium` (animation is internal to AmbientBackground)
- [ ] `FR3.T2` — Add test: `getAmbientColor` returns `null` for `panelState === 'idle'` (pure function test, can use imported getAmbientColor directly)

## Phase 2.1 — Implementation

### FR1 — Wire AmbientBackground to Home screen

- [ ] `FR1.I1` — Add import: `import AmbientBackground, { getAmbientColor } from '@/src/components/AmbientBackground'` to `index.tsx`
- [ ] `FR1.I2` — Add `<AmbientBackground color={getAmbientColor({ type: 'panelState', state: panelState })} />` before `<ScrollView>` inside `<SafeAreaView>`
- [ ] `FR1.I3` — Verify no StyleSheet import added, no hardcoded hex strings added
- [ ] `FR1.I4` — Run `FR1.T1`–`FR1.T8` tests: all pass

### FR2 — Expand PanelGradient radial gradient

- [ ] `FR2.I1` — Update `PanelGradient.tsx` inner stop: change `stopOpacity={0.35}` to `stopOpacity={0.50}`
- [ ] `FR2.I2` — Verify no other lines changed (diff should be exactly 1 line)
- [ ] `FR2.I3` — Run `FR2.T1`–`FR2.T7` tests: all pass

### FR3 — Integration verification

- [ ] `FR3.I1` — Run full test suite for `index.test.tsx`: all existing tests pass
- [ ] `FR3.I2` — Run full test suite for `PanelGradient.test.tsx`: all existing tests pass
- [ ] `FR3.I3` — Run `FR3.T1`–`FR3.T2` tests: all pass

## Phase 2.2 — Review

- [ ] Run `spec-implementation-alignment` agent to verify implementation matches spec
- [ ] Run `pr-review-toolkit:review-pr` to review the diff
- [ ] Address any feedback from review agents
- [ ] Run `test-optimiser` to verify test quality and coverage

## Notes

- FR3 has no implementation work — it validates inherited behavior from `01-ambient-layer`
- `AmbientBackground` is `pointerEvents="none"` internally — no changes needed to make it non-interactive
- The only change to `PanelGradient.tsx` is a single `stopOpacity` value change; all exports and API remain identical
- Source-level static analysis is the correct test strategy for NativeWind v4 className props
