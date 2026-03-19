# Checklist: 02-animated-mesh

**Spec:** Animated Skia Mesh Background
**Feature:** brand-revamp
**Status:** Not Started

---

## Phase 1.0 — Tests (Red Phase)

Write all tests before any implementation. Tests must fail initially (red phase).

### FR1 — AnimatedMeshBackground Component

- [ ] `test(FR1)` Write `AnimatedMeshBackground.test.tsx` — FR1.1: renders without error when no props provided
- [ ] `test(FR1)` FR1.2: renders without error when `panelState="onTrack"`
- [ ] `test(FR1)` FR1.3: renders without error when `panelState=null`
- [ ] `test(FR1)` FR1.4: source uses `StyleSheet.absoluteFill` for Canvas positioning
- [ ] `test(FR1)` FR1.5: source has `pointerEvents="none"` on Canvas element
- [ ] `test(FR1)` FR1.6: component is exported as both named and default export

### FR2 — Reanimated Animation Driver

- [ ] `test(FR2)` FR2.1: source uses `useSharedValue(0)` for `time` initialization
- [ ] `test(FR2)` FR2.2: source calls `withTiming` with `duration: 20000`
- [ ] `test(FR2)` FR2.3: source calls `withRepeat` with `-1` (infinite) and `false` (no reverse)
- [ ] `test(FR2)` FR2.4: source uses `useDerivedValue` for all three node center computations
- [ ] `test(FR2)` FR2.5: at time=0 — nodeACenter formula produces x=w*0.5, y=h*0.5 (verify math constants)
- [ ] `test(FR2)` FR2.6: at time=0.5 — nodeACenter.y = h*0.10 (cos(π)=-1 → h*0.3 - h*0.20)
- [ ] `test(FR2)` FR2.7: nodeBCenter has phase offset 2π/3 relative to nodeACenter (verify constant in source)
- [ ] `test(FR2)` FR2.8: nodeCCenter has phase offset 4π/3 relative to nodeACenter (verify constant in source)

### FR3 — Status-Driven Node C Color

- [ ] `test(FR3)` FR3.1: `panelState="onTrack"` → resolveNodeCColor returns string containing `#10B981`
- [ ] `test(FR3)` FR3.2: `panelState="crushedIt"` → returns string containing `#E8C97A`
- [ ] `test(FR3)` FR3.3: `panelState="critical"` → returns string containing `#F43F5E`
- [ ] `test(FR3)` FR3.4: `panelState="behind"` → returns string containing `#F59E0B`
- [ ] `test(FR3)` FR3.5: `panelState="idle"` → returns `#0D0C14` (invisible base)
- [ ] `test(FR3)` FR3.6: all props null → returns `#0D0C14`
- [ ] `test(FR3)` FR3.7: `earningsPace=0.9` (no panelState) → returns string containing `#E8C97A`
- [ ] `test(FR3)` FR3.8: `aiPct=80` (no panelState, no earningsPace) → returns string containing `#A78BFA`
- [ ] `test(FR3)` FR3.9: `panelState` takes priority over `earningsPace` when both provided

### FR4 — Gradient Node Visual Spec

- [ ] `test(FR4)` FR4.1: source imports `Canvas`, `Circle`, `Rect`, `RadialGradient` from `@shopify/react-native-skia`
- [ ] `test(FR4)` FR4.2: source imports `vec` from `@shopify/react-native-skia`
- [ ] `test(FR4)` FR4.3: source contains `0.12` alpha value for inner gradient stops
- [ ] `test(FR4)` FR4.4: Node A constant contains violet hex `A78BFA` (case-insensitive)
- [ ] `test(FR4)` FR4.5: Node B constant contains cyan hex `00C2FF` (case-insensitive)
- [ ] `test(FR4)` FR4.6: source references `screen` blend mode (BlendMode.Screen or blendMode="screen")
- [ ] `test(FR4)` FR4.7: base `<Rect>` appears before Circle nodes in source (lowest z-order)

### FR5 — AmbientBackground Backward Compatibility

- [ ] `test(FR5)` FR5.1: `import AmbientBackground from '@/src/components/AmbientBackground'` resolves at runtime
- [ ] `test(FR5)` FR5.2: rendering `<AmbientBackground color="#10B981" />` does not throw
- [ ] `test(FR5)` FR5.3: `AMBIENT_COLORS` named export still present in `AmbientBackground.tsx`
- [ ] `test(FR5)` FR5.4: `getAmbientColor` named export still present and functional
- [ ] `test(FR5)` FR5.5: `AmbientBackground.tsx` source contains `@deprecated` annotation
- [ ] `test(FR5)` FR5.6: existing `AmbientBackground.test.tsx` test suite still passes (no regressions)

---

## Phase 1.1 — Implementation

Implement each FR to make its tests pass. Commit after each FR.

### FR1 — AnimatedMeshBackground Component

- [ ] `feat(FR1)` Create `hourglassws/src/components/AnimatedMeshBackground.tsx`
- [ ] `feat(FR1)` Add props interface `AnimatedMeshBackgroundProps` with `panelState?`, `earningsPace?`, `aiPct?`
- [ ] `feat(FR1)` Render Skia `Canvas` with `StyleSheet.absoluteFill` and `pointerEvents="none"`
- [ ] `feat(FR1)` Export as both named (`AnimatedMeshBackground`) and default export

### FR2 — Reanimated Animation Driver

- [ ] `feat(FR2)` Add `useSharedValue(0)` for `time`
- [ ] `feat(FR2)` Add `useEffect` to start `withRepeat(withTiming(1, { duration: 20000 }), -1, false)`
- [ ] `feat(FR2)` Add `useDerivedValue` for `nodeACenter` (phase 0, cy_base=0.3h, amplitude 0.30w/0.20h)
- [ ] `feat(FR2)` Add `useDerivedValue` for `nodeBCenter` (phase 2π/3, cy_base=0.6h, amplitude 0.30w/0.20h)
- [ ] `feat(FR2)` Add `useDerivedValue` for `nodeCCenter` (phase 4π/3, cy_base=0.5h, amplitude 0.25w/0.15h)

### FR3 — Status-Driven Node C Color

- [ ] `feat(FR3)` Add `resolveNodeCColor(panelState, earningsPace, aiPct)` helper (pure function)
- [ ] `feat(FR3)` Implement priority: panelState → earningsPace → aiPct → idle (#0D0C14)
- [ ] `feat(FR3)` Handle `AMBIENT_COLORS.panelState[panelState] ?? colors.background` for null-returning states (idle)
- [ ] `feat(FR3)` Add `hexToRgba(hex, alpha)` helper for Node C color string construction

### FR4 — Gradient Node Visual Spec

- [ ] `feat(FR4)` Render base `<Rect x={0} y={0} width={w} height={h} color="#0D0C14" />` as first Canvas child
- [ ] `feat(FR4)` Render Node A: `<Circle>` with violet `RadialGradient` at 0.12 alpha + BlendMode.Screen
- [ ] `feat(FR4)` Render Node B: `<Circle>` with cyan `RadialGradient` at 0.12 alpha + BlendMode.Screen
- [ ] `feat(FR4)` Render Node C: `<Circle>` with status-color `RadialGradient` at 0.12 alpha + BlendMode.Screen
- [ ] `feat(FR4)` Set circle radius = `w * 0.7` for all nodes

### FR5 — AmbientBackground Backward Compatibility

- [ ] `feat(FR5)` Update `AmbientBackground.tsx`: change default export to delegate to `AnimatedMeshBackground`
- [ ] `feat(FR5)` Preserve `AMBIENT_COLORS`, `getAmbientColor`, `AmbientSignal` named exports (inline or imported)
- [ ] `feat(FR5)` Add `@deprecated` JSDoc annotation to the default export
- [ ] `feat(FR5)` Verify `app/(tabs)/_layout.tsx` requires no changes
- [ ] `feat(FR5)` Run existing `AmbientBackground.test.tsx` — all tests pass

---

## Phase 1.2 — Review

Sequential gates. Each must pass before proceeding to the next.

### Step 0: Alignment Check

- [ ] Run `spec-implementation-alignment` agent: validate `AnimatedMeshBackground.tsx` against `spec.md` FR1–FR5 success criteria
- [ ] All FRs implemented and traceable to spec
- [ ] No extra scope added beyond spec (no undocumented features)

### Step 1: PR Review

- [ ] Run `pr-review-toolkit:review-pr` skill
- [ ] Address any TypeScript errors or type safety issues flagged
- [ ] Address any performance concerns flagged
- [ ] Address any code style issues flagged

### Step 2: Address Feedback

- [ ] All review comments resolved or documented with rationale for deferral
- [ ] `fix(02-animated-mesh):` commits for any changes made in this phase

### Step 3: Test Optimization

- [ ] Run `test-optimiser` agent on `AnimatedMeshBackground.test.tsx`
- [ ] Remove any duplicate or redundant assertions
- [ ] Confirm all tests remain meaningful (not trivially passing)

---

## Completion Criteria

- [ ] All Phase 1.0 test tasks marked `[x]` — tests exist and initially failed (red)
- [ ] All Phase 1.1 implementation tasks marked `[x]` — tests pass (green)
- [ ] All Phase 1.2 review tasks marked `[x]`
- [ ] Full test suite passes: `cd hourglassws && npx jest --testPathPattern="AnimatedMeshBackground|AmbientBackground"`
- [ ] `AmbientBackground.test.tsx` still passes (no regressions)
- [ ] `app/(tabs)/_layout.tsx` unchanged (verified)
- [ ] Checklist and FEATURE.md updated

---

## Session Notes

<!-- Added by spec-executor after completion -->
