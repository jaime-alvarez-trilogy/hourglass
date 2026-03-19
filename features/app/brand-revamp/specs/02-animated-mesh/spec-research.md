# Spec Research: 02-animated-mesh

**Feature:** brand-revamp
**Spec:** 02-animated-mesh
**Complexity:** M

---

## Problem Context

The current `AmbientBackground` component is a static SVG RadialGradient at 0.08 opacity that changes color based on panelState. It provides a subtle accent glow but doesn't create the "living technical environment" called for in brand guidelines v2.0. The spec mandates an animated mesh background where 3–4 radial color nodes orbit continuously via physics-driven sine waves, creating an undulating auroral effect beneath the glass card surfaces.

The SKSL shader approach (raw GPU fragment shaders) was considered but the declarative Skia gradient approach is chosen for long-term maintainability, as it achieves visually equivalent results with simpler code.

---

## Exploration Findings

### Current `AmbientBackground.tsx`

```typescript
// Full-screen SVG RadialGradient, absolutely positioned
// - Uses react-native-svg with a Defs/RadialGradient inside Svg
// - cx=50%, cy=0%, r=70% (top-center origin)
// - Center color: panelState-driven (green/amber/rose/violet/gold/cyan/null)
// - Center opacity: 0.08
// - Outer stop: transparent
// - Animated color transitions via Reanimated springPremium
// - Rendered once at (tabs)/_layout.tsx level, behind all tab content
```

### Current mounting location
`app/(tabs)/_layout.tsx` renders `<AmbientBackground />` behind the tab content with `position: absolute, inset: 0`.

### Why Skia over SVG for the new mesh

The existing `AmbientBackground` uses `react-native-svg` which communicates through the bridge for each SVG element. The new animated mesh will update 3 nodes every animation frame — this must run on the UI thread via Reanimated worklets. `@shopify/react-native-skia` is already installed and used for charts. Skia canvas operations run on the UI thread with zero bridge crossing.

### Skia declarative gradient API (already in use for charts)
- `<Canvas>` — required wrapper for all Skia drawing
- `<Circle>` or `<Rect>` with `<RadialGradient>` child — fills shape with gradient
- `BlendMode.Screen` — luminous overlap (lighter at intersection, creates auroral glow)
- `useSharedValue` + `withRepeat(withTiming(...))` — drives animation frame by frame on UI thread
- `useDerivedValue` — computes node positions from time SharedValue without JS thread

### Performance constraints
- Skia canvas redraws every time a SharedValue changes — must use `useDerivedValue` to keep all position math on the UI thread
- `renderToHardwareTextureAndroid={true}` on the Canvas container for Android
- Canvas should not use `style.opacity` below 1.0 (rendering pipeline glitch risk)
- Background canvas cannot host BackdropFilter for the card blurs — those live in each GlassCard's own Skia Canvas (spec 03)

### Status-aware color tinting
The current AmbientBackground responds to `panelState`. The new mesh should maintain this: node C's color transitions based on panelState (success/warning/critical/gold/idle). Nodes A and B are always violet and cyan (brand constants).

### Animation math (3 nodes, out-of-phase sine waves)
```
// Node A (Violet, #A78BFA):
cx_A = screenW * 0.5 + screenW * 0.3 * sin(time * 2π)
cy_A = screenH * 0.3 + screenH * 0.2 * cos(time * 2π)

// Node B (Cyan, #00C2FF):  phase offset = 2π/3 (120°)
cx_B = screenW * 0.5 + screenW * 0.3 * sin(time * 2π + 2π/3)
cy_B = screenH * 0.6 + screenH * 0.2 * cos(time * 2π + 2π/3)

// Node C (Status color):   phase offset = 4π/3 (240°)
cx_C = screenW * 0.5 + screenW * 0.25 * sin(time * 2π + 4π/3)
cy_C = screenH * 0.5 + screenH * 0.15 * cos(time * 2π + 4π/3)
```
Period: ~20 seconds (time 0→1 over 20000ms, repeat). Slow orbital drift, not frantic movement.

---

## Key Decisions

1. **Declarative Skia gradients** over SKSL shaders — chosen for maintainability. Three RadialGradient nodes with BlendMode.Screen produce auroral glow without manual noise math.

2. **3 nodes** — Node A=Violet (constant), Node B=Cyan (constant), Node C=status-driven. This keeps the brand accent colors always present while letting the status signal through.

3. **Animation period 20s** — slow enough to feel organic, not distracting. Reanimated `withRepeat(withTiming(1, { duration: 20000 }), -1, false)` drives the single `time` SharedValue. All positions derived via `useDerivedValue`.

4. **Gradient opacity** — each node's inner stop color at 0.12 alpha (up from current 0.08), outer stop transparent. BlendMode.Screen compounds overlaps to ~0.24–0.30 at intersections. Subtle but clearly visible beneath glass cards.

5. **Backward-compatible `AmbientBackground` wrapper** — export the new component as `AnimatedMeshBackground`. Update `AmbientBackground` to re-export `AnimatedMeshBackground` so no import changes needed in tab layout.

6. **panelState prop interface** — same as current `AmbientBackground`: accepts `{ panelState, earningsPace, aiPct }` and maps to Node C color via the existing `getAmbientColor()` utility. No API changes for calling screens.

---

## Interface Contracts

### `AnimatedMeshBackground` component

```typescript
// src/components/AnimatedMeshBackground.tsx

interface AnimatedMeshBackgroundProps {
  panelState?: PanelState | null;     // ← existing type from src/lib/panelState.ts
  earningsPace?: number | null;       // ← 0-1 ratio for behind/on-track/crushed
  aiPct?: number | null;              // ← 0-100 for AI signal
}

// Returns: AbsoluteFullScreen View wrapping a Skia Canvas with 3 animated RadialGradient nodes
// Performance: all animation math runs in Reanimated worklets (UI thread)
// No JS-thread allocation per frame
```

### Animation SharedValues

```typescript
const time = useSharedValue(0);   // 0→1 over 20s, repeats forever (UI thread)
// All positions are useDerivedValue(() => ...) — zero JS thread usage

const nodeACenter = useDerivedValue(() => ({
  x: screenW * 0.5 + screenW * 0.30 * Math.sin(time.value * Math.PI * 2),
  y: screenH * 0.3 + screenH * 0.20 * Math.cos(time.value * Math.PI * 2),
}));
const nodeBCenter = useDerivedValue(() => ({ ... }));
const nodeCCenter = useDerivedValue(() => ({ ... }));
```

### Skia Canvas structure

```tsx
<Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
  {/* Base layer: deep eggplant fill */}
  <Rect x={0} y={0} width={w} height={h}>
    <RadialGradient c={vec(w/2, h/2)} r={Math.max(w,h)}
      colors={['#0D0C14', '#0D0C14']} />
  </Rect>

  {/* Node A: Violet orbital */}
  <Circle cx={nodeACenter.value.x} cy={nodeACenter.value.y} r={w * 0.7}>
    <RadialGradient c={...} r={w * 0.7}
      colors={['rgba(167,139,250,0.12)', 'transparent']}
      mode={TileMode.Clamp} />
    <BlendMode mode="screen" />
  </Circle>

  {/* Node B: Cyan orbital */}
  {/* Node C: Status-driven orbital */}
</Canvas>
```

---

## Test Plan

### `animatedMeshBackground`
**Signature:** `<AnimatedMeshBackground panelState="onTrack" />`

**Happy path:**
- [ ] Component renders without error when panelState=null
- [ ] Component renders without error when panelState="onTrack"
- [ ] Canvas is positioned absolutely and fills parent

**Animation state:**
- [ ] time SharedValue starts at 0
- [ ] time SharedValue advances (mock withRepeat → verify withTiming called with duration=20000)
- [ ] nodeACenter derives from time (test derivation formula output for time=0 and time=0.5)
- [ ] nodeBCenter has phase offset 2π/3 relative to nodeA
- [ ] nodeCCenter has phase offset 4π/3 relative to nodeA

**Status-driven color:**
- [ ] panelState="onTrack" → Node C color contains success green (#10B981)
- [ ] panelState="crushedIt" → Node C color contains gold (#E8C97A)
- [ ] panelState="critical" → Node C color contains critical red (#F43F5E)
- [ ] panelState=null → Node C color is deep eggplant or transparent (idle state)

**Backward compatibility:**
- [ ] `AmbientBackground` import still works (re-exports `AnimatedMeshBackground`)
- [ ] Same prop interface as current AmbientBackground

**Mocks needed:**
- `@shopify/react-native-skia`: Canvas, Circle, Rect, RadialGradient — already mocked in test setup
- `react-native-reanimated`: useSharedValue, useDerivedValue, withRepeat, withTiming

---

## Files to Reference

- `hourglassws/src/components/AmbientBackground.tsx` — current implementation to replace
- `hourglassws/app/(tabs)/_layout.tsx` — where AmbientBackground is mounted (no changes needed)
- `hourglassws/src/lib/colors.ts` — color constants for node colors
- `hourglassws/src/lib/panelState.ts` — PanelState type and getAmbientColor utility
- `hourglassws/src/components/WeeklyBarChart.tsx` — reference for Skia Canvas + animation pattern
- `hourglassws/src/components/TrendSparkline.tsx` — reference for useDerivedValue usage
