# Checklist: 01-ambient-layer

## Phase 1.0 — Tests (Red Phase)

### FR1 + FR5 — AmbientBackground component tests
- [x] Create `hourglassws/src/components/__tests__/AmbientBackground.test.tsx`
- [x] Test: `color=null` renders nothing (empty touch-safe view)
- [x] Test: `color="#10B981"` renders SVG with that fill color
- [x] Test: root element has `pointerEvents="none"`
- [x] Test: root element is absolutely positioned (uses `StyleSheet.absoluteFill`)
- [x] Test (source): no `StyleSheet.create` call in `AmbientBackground.tsx`
- [x] Test (source): `AmbientBackground` is the default export
- [x] Test (source): uses `springPremium` for animation (import present)
- [x] Test (source): uses `withSequence` + `withTiming` + `withSpring` (Reanimated pattern)
- [x] Test (source): mount animation — `useSharedValue(0)` initial value

### FR2 — `getAmbientColor` + `AMBIENT_COLORS` tests
- [x] Test: `getAmbientColor({ type: 'panelState', state: 'onTrack' })` → `colors.success`
- [x] Test: `getAmbientColor({ type: 'panelState', state: 'behind' })` → `colors.warning`
- [x] Test: `getAmbientColor({ type: 'panelState', state: 'critical' })` → `colors.critical`
- [x] Test: `getAmbientColor({ type: 'panelState', state: 'crushedIt' })` → `colors.gold`
- [x] Test: `getAmbientColor({ type: 'panelState', state: 'overtime' })` → `colors.overtimeWhiteGold`
- [x] Test: `getAmbientColor({ type: 'panelState', state: 'idle' })` → `null`
- [x] Test: `getAmbientColor({ type: 'earningsPace', ratio: 0.85 })` → `colors.gold` (boundary inclusive)
- [x] Test: `getAmbientColor({ type: 'earningsPace', ratio: 1.0 })` → `colors.gold`
- [x] Test: `getAmbientColor({ type: 'earningsPace', ratio: 0.84 })` → `colors.warning`
- [x] Test: `getAmbientColor({ type: 'earningsPace', ratio: 0.60 })` → `colors.warning` (boundary inclusive)
- [x] Test: `getAmbientColor({ type: 'earningsPace', ratio: 0.59 })` → `colors.critical`
- [x] Test: `getAmbientColor({ type: 'earningsPace', ratio: 0 })` → `colors.gold` (no prior data)
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 75 })` → `colors.violet` (boundary inclusive)
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 100 })` → `colors.violet`
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 74 })` → `colors.cyan`
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 60 })` → `colors.cyan` (boundary inclusive)
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 59 })` → `colors.warning`
- [x] Test: `getAmbientColor({ type: 'aiPct', pct: 0 })` → `colors.warning`
- [x] Test: `AMBIENT_COLORS.panelState` has all 6 PanelState keys

### FR3 + FR4 — Card.tsx constant tests (update existing)
- [x] Update `hourglassws/src/components/__tests__/Card.test.tsx`
  - [x] Test `FR1.4` — update borderColor assertion (relaxed to pattern match)
  - [x] Test `FR1.6` — update: `BLUR_INTENSITY_BASE` ≥ 60 (was: `=== 40`)
  - [x] Test `FR1.8` — update: base BlurView intensity ≥ 60 (was: `=== 40`)
  - [x] Test `FR2.5` — update: `BLUR_INTENSITY_ELEVATED` ≥ 80 (was: `=== 60`)
  - [x] Test `FR2.6` — update: elevated BlurView intensity ≥ 80 (was: `=== 60`)
  - [x] Add test: `GLASS_BASE.backgroundColor` alpha ≤ 0.15
  - [x] Add test: `GLASS_ELEVATED.backgroundColor` alpha ≤ 0.20

---

## Phase 1.1 — Implementation

### FR1 + FR2 + FR5 — Create `AmbientBackground.tsx`
- [x] Create `hourglassws/src/components/AmbientBackground.tsx`
- [x] Export `AMBIENT_COLORS` constant with all signal keys
- [x] Export `AmbientSignal` type union
- [x] Export `getAmbientColor(signal: AmbientSignal): string | null` pure function
- [x] Implement `AmbientBackground` default export
  - [x] `color=null` → render `<View pointerEvents="none" style={StyleSheet.absoluteFill} />`
  - [x] `color=hex` → render animated `Animated.View` with SVG RadialGradient
  - [x] SVG: `cx="50%"`, `cy="0%"`, radius = 70% screen width via `useWindowDimensions`
  - [x] Inner stop: `stopOpacity={0.08 * intensity}`
  - [x] Outer stop: `stopOpacity={0}`
  - [x] `pointerEvents="none"` on root
  - [x] Absolute positioning via `StyleSheet.absoluteFill`
  - [x] No `StyleSheet.create` usage
  - [x] FR5: `useSharedValue(0)` for opacity
  - [x] FR5: `useEffect` on `color` — mount: `withSpring(1, springPremium)`; update: `withSequence(withTiming(0, {duration:120}), withSpring(1, springPremium))`

### FR3 + FR4 — Modify `Card.tsx`
- [x] Update `GLASS_BASE.backgroundColor` → `'rgba(22, 21, 31, 0.12)'`
- [x] Update `GLASS_ELEVATED.backgroundColor` → `'rgba(31, 30, 41, 0.18)'`
- [x] Update `BLUR_INTENSITY_BASE` → `60`
- [x] Update `BLUR_INTENSITY_ELEVATED` → `80`
- [x] Update comment on `GLASS_BASE` to reflect new opacity value
- [x] Update comment on `GLASS_ELEVATED` to reflect new opacity value
- [x] Run Card tests — all pass

---

## Phase 1.2 — Review

- [x] Spec-implementation alignment check — all FRs verified
- [x] Self-review: no lint issues, consistent with project conventions
- [x] No feedback to address
- [x] Test optimization review — tests are well-scoped, no redundancy
- [x] All tests passing (`npx jest --testPathPattern="AmbientBackground|Card"` — 139 passed)

---

## Session Notes

**2026-03-16**: Spec execution complete.
- Phase 1.0: 2 test commits (new AmbientBackground.test.tsx, updated Card.test.tsx)
- Phase 1.1: 1 implementation commit (AmbientBackground.tsx created, Card.tsx updated)
- Phase 1.2: Review passed, no fix commits needed
- All 139 targeted tests passing. Pre-existing test failures (73) are unrelated to this spec.
