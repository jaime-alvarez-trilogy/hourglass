# 02-animated-mesh — Animated Skia Mesh Background

**Status:** Draft
**Created:** 2026-03-19
**Last Updated:** 2026-03-19
**Owner:** @trilogy

---

## Overview

### What Is Being Built

`AnimatedMeshBackground` is a new full-screen Skia canvas component that replaces the static SVG `AmbientBackground`. Instead of a single fixed radial gradient, it renders three orbiting `RadialGradient` nodes on a Skia `Canvas`, each driven by a Reanimated `SharedValue<number>` (`time`) that advances 0→1 over 20 seconds and repeats indefinitely.

The three nodes use out-of-phase sine/cosine orbital math — computed entirely in `useDerivedValue` worklets on the UI thread — producing an undulating auroral mesh of luminous color intersections. `BlendMode.Screen` compounds overlapping gradient halos into neon-glow intersections with zero JS-thread allocation per frame.

### How It Works

**Animation driver:** A single `time` SharedValue ticks from 0→1 over 20 000 ms via `withRepeat(withTiming(1, { duration: 20000 }), -1, false)`. All three node centers are derived positions via `useDerivedValue(() => ...)`, keeping every trig computation on the UI thread.

**Node layout:**
- **Node A (Violet, #A78BFA):** orbits around screen center-top (cy_base = 30% height), amplitude ±30% width / ±20% height, phase 0°
- **Node B (Cyan, #00C2FF):** orbits around screen center-bottom (cy_base = 60% height), phase 120° (2π/3)
- **Node C (Status-driven):** orbits around screen center (cy_base = 50% height), amplitude ±25% width / ±15% height, phase 240° (4π/3); color resolves from `panelState`/`earningsPace`/`aiPct` props via `getAmbientColor()`

**Gradient per node:** Each node is a `<Circle r={w*0.7}>` containing a `<RadialGradient>` with inner stop at 0.12 alpha and outer stop transparent, rendered with `BlendMode.Screen`.

**Base layer:** A `<Rect>` fills the full canvas with the brand background color `#0D0C14` (eggplant), ensuring the canvas itself is always opaque without relying on a background View.

**Backward compatibility:** The existing `AmbientBackground.tsx` is updated to re-export `AnimatedMeshBackground` as its default, mapping the old `{ color, intensity }` prop interface to the new `{ panelState, earningsPace, aiPct }` interface. No import changes are required in `app/(tabs)/_layout.tsx`.

---

## Out of Scope

1. **SKSL fragment shaders** — **Descoped.** Raw GPU shader approach was evaluated and rejected in favor of declarative Skia gradients for long-term maintainability. No SKSL in this or any subsequent spec.

2. **BackdropFilter / GlassCard blur** — **Deferred to [03-glass-surfaces](../03-glass-surfaces/spec-research.md).** The animated mesh canvas is the source layer behind glass cards. Glass blur effects live in each GlassCard's own Skia Canvas, not here.

3. **Noise overlay** — **Descoped.** `NoiseOverlay.tsx` remains as-is. The animated mesh provides sufficient visual texture. Noise overlay removal or consolidation is not in scope for this spec.

4. **4th gradient node** — **Descoped.** Spec-research confirmed 3 nodes is sufficient for the auroral effect. A 4th node is an over-engineering risk on mid-range Android devices.

5. **Changing animation period per panelState** — **Descoped.** The 20-second period is constant regardless of status. Urgency escalation (if ever needed) is deferred to a future spec.

6. **Particle or noise-based mesh** — **Descoped.** Declarative Skia RadialGradient approach chosen. Noise math would require SKSL (excluded above).

7. **Direct API calls from AnimatedMeshBackground** — **Descoped.** This component is purely presentational. Data is passed via props from parent screens; the component has no awareness of API state.

8. **Removing react-native-svg dependency** — **Descoped.** The `AmbientBackground` compat wrapper continues to import SVG. Full SVG removal requires all call sites migrated (out of scope here).

9. **Lock screen / widget rendering** — **Descoped.** Skia canvas is not supported in iOS widget extensions. The Scriptable/Expo widget path is a separate concern.

10. **Android hardware texture optimization for Glass** — **Deferred to [03-glass-surfaces](../03-glass-surfaces/spec-research.md).** `renderToHardwareTextureAndroid` on the Glass canvas is a 03 concern. The mesh canvas uses `pointerEvents="none"` and absolute fill; hardware layer hints belong with the compositor (Glass).

---

## Functional Requirements

---

### FR1 — AnimatedMeshBackground Component

Create `hourglassws/src/components/AnimatedMeshBackground.tsx`.

The component renders a full-screen Skia `Canvas` (absolutely positioned, `pointerEvents="none"`) with:
- A base `<Rect>` filled with the brand eggplant color `#0D0C14`
- Three `<Circle>` shapes, each containing a `<RadialGradient>` with `BlendMode.Screen`

The canvas dimensions are derived from `useWindowDimensions()`. The component accepts `AnimatedMeshBackgroundProps` and returns a JSX element (never null).

**Props interface:**
```typescript
interface AnimatedMeshBackgroundProps {
  panelState?: PanelState | null;
  earningsPace?: number | null;  // 0–1 ratio
  aiPct?: number | null;          // 0–100
}
```

**Success Criteria:**
- Component renders without error when all props are omitted
- Component renders without error when `panelState="onTrack"` is passed
- Component renders without error when `panelState=null` is passed
- Canvas element uses `StyleSheet.absoluteFill` (or equivalent `style` with `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0`)
- Canvas element has `pointerEvents="none"` so it never intercepts touch events
- Exported as named export `AnimatedMeshBackground` AND as default export

---

### FR2 — Reanimated Animation Driver (UI Thread)

The component drives animation via a single `time` SharedValue:

```typescript
const time = useSharedValue(0);
useEffect(() => {
  time.value = withRepeat(withTiming(1, { duration: 20000 }), -1, false);
}, []);
```

Three node centers are computed as `useDerivedValue` callbacks:

```typescript
// Node A: Violet, phase 0
const nodeACenter = useDerivedValue(() => ({
  x: w * 0.5 + w * 0.30 * Math.sin(time.value * Math.PI * 2),
  y: h * 0.3 + h * 0.20 * Math.cos(time.value * Math.PI * 2),
}));

// Node B: Cyan, phase 2π/3
const nodeBCenter = useDerivedValue(() => ({
  x: w * 0.5 + w * 0.30 * Math.sin(time.value * Math.PI * 2 + (2 * Math.PI) / 3),
  y: h * 0.6 + h * 0.20 * Math.cos(time.value * Math.PI * 2 + (2 * Math.PI) / 3),
}));

// Node C: Status-driven, phase 4π/3
const nodeCCenter = useDerivedValue(() => ({
  x: w * 0.5 + w * 0.25 * Math.sin(time.value * Math.PI * 2 + (4 * Math.PI) / 3),
  y: h * 0.5 + h * 0.15 * Math.cos(time.value * Math.PI * 2 + (4 * Math.PI) / 3),
}));
```

All position math runs exclusively on the UI thread. No JS thread allocation occurs per animation frame.

**Success Criteria:**
- `time` SharedValue is initialized to `0`
- `withTiming` is called with `duration: 20000`
- `withRepeat` is called with `-1` (infinite) and `false` (no reverse)
- `useDerivedValue` is used for all three node center computations
- At `time=0`: nodeA.x = `w * 0.5` (sin(0)=0), nodeA.y = `h * 0.3 + h * 0.20 * 1 = h * 0.50` (cos(0)=1)
- At `time=0.5`: nodeA.y = `h * 0.3 + h * 0.20 * cos(π) = h * 0.3 - h * 0.20 = h * 0.10`
- Phase difference between nodeA and nodeB = 2π/3; between nodeA and nodeC = 4π/3

---

### FR3 — Status-Driven Node C Color

Node C's gradient color changes based on the resolved panelState/earningsPace/aiPct signal.

Color resolution logic (in priority order):
1. If `panelState` is provided and not null → resolve via `AMBIENT_COLORS.panelState[panelState]`
2. Else if `earningsPace` is provided and not null → resolve via `getAmbientColor({ type: 'earningsPace', ratio: earningsPace })`
3. Else if `aiPct` is provided and not null → resolve via `getAmbientColor({ type: 'aiPct', pct: aiPct })`
4. Else → idle: use the eggplant background color `#0D0C14` (node C blends into base, effectively invisible)

The resolved color is used as Node C's inner gradient stop (at 0.12 alpha). When status is idle, Node C is invisible rather than absent (always renders 3 circles; no conditional rendering).

**Success Criteria:**
- `panelState="onTrack"` → Node C inner stop color contains `#10B981` (success green)
- `panelState="crushedIt"` → Node C inner stop color contains `#E8C97A` (gold)
- `panelState="critical"` → Node C inner stop color contains `#F43F5E` (critical red)
- `panelState="behind"` → Node C inner stop color contains `#F59E0B` (warning amber)
- `panelState="idle"` or all props null → Node C color is `#0D0C14` (invisible)
- `earningsPace=0.9` (strong) → Node C contains `#E8C97A`
- `aiPct=80` (at target) → Node C contains `#A78BFA` (violet)
- Color resolution does not cause per-frame re-renders (color is a plain JS value, not a SharedValue)

---

### FR4 — Gradient Node Visual Spec

Each of the three gradient nodes follows this Skia structure:

```tsx
<Circle cx={nodeCenter.value.x} cy={nodeCenter.value.y} r={w * 0.7}>
  <RadialGradient
    c={vec(nodeCenter.value.x, nodeCenter.value.y)}
    r={w * 0.7}
    colors={[`rgba(R,G,B,0.12)`, 'transparent']}
  />
  <Paint blendMode="screen" />
</Circle>
```

Base layer (bottom of Canvas z-order):
```tsx
<Rect x={0} y={0} width={w} height={h} color="#0D0C14" />
```

Node radii: each node's circle radius = `screenWidth * 0.7`.

**Success Criteria:**
- Source imports `Canvas`, `Circle`, `Rect`, `RadialGradient` from `@shopify/react-native-skia`
- Source imports `vec` from `@shopify/react-native-skia`
- Each node's inner gradient stop alpha is 0.12
- Base `<Rect>` is rendered before node circles (lowest z-order)
- Node A inner stop color is `#A78BFA` (violet) at 0.12 alpha
- Node B inner stop color is `#00C2FF` (cyan) at 0.12 alpha
- Source references `BlendMode` or `blendMode="screen"` (Skia blend mode for Screen)

---

### FR5 — AmbientBackground Backward Compatibility

Update `hourglassws/src/components/AmbientBackground.tsx`:

The file is **deprecated** but retained for backward compatibility. The `AMBIENT_COLORS`, `getAmbientColor`, and `AmbientSignal` named exports are preserved unchanged (other screens import them).

The default export becomes `AnimatedMeshBackground` (via re-export). The old `{ color, intensity }` prop interface is accepted without TypeScript errors by having `AmbientBackground` be a thin wrapper or direct re-export.

Preferred approach:
```typescript
// @deprecated — use AnimatedMeshBackground directly
export { default } from './AnimatedMeshBackground';
// Named exports preserved:
export { AMBIENT_COLORS, getAmbientColor } from './AmbientBackground.legacy';
// ... or keep them inline
```

Simpler approach (acceptable): Keep all named exports inline in `AmbientBackground.tsx` and change only the default export to delegate to `AnimatedMeshBackground`.

**Success Criteria:**
- `import AmbientBackground from '@/src/components/AmbientBackground'` still resolves at runtime
- Rendering `<AmbientBackground color="#10B981" />` does not throw
- `AMBIENT_COLORS`, `getAmbientColor`, `AmbientSignal` named exports are preserved
- Source file contains `@deprecated` annotation or equivalent comment
- `app/(tabs)/_layout.tsx` requires NO changes

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/components/AmbientBackground.tsx` | Current implementation to deprecate; source of `AMBIENT_COLORS`, `getAmbientColor`, `AmbientSignal` exports |
| `hourglassws/src/lib/colors.ts` | Color constants (`colors.violet`, `colors.cyan`, `colors.background`) |
| `hourglassws/src/lib/panelState.ts` | `PanelState` type re-export |
| `hourglassws/src/components/WeeklyBarChart.tsx` | Reference: Skia Canvas + Reanimated animation pattern |
| `hourglassws/src/components/TrendSparkline.tsx` | Reference: `useDerivedValue` usage pattern |
| `hourglassws/app/(tabs)/_layout.tsx` | Mounting location — must require NO changes |
| `hourglassws/src/components/__tests__/AmbientBackground.test.tsx` | Existing tests — must continue to pass |

---

### Files to Create

| File | Description |
|------|-------------|
| `hourglassws/src/components/AnimatedMeshBackground.tsx` | New animated mesh component (primary deliverable) |
| `hourglassws/src/components/__tests__/AnimatedMeshBackground.test.tsx` | Tests for FR1–FR5 |

---

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/src/components/AmbientBackground.tsx` | Deprecate: re-export default from AnimatedMeshBackground; preserve all named exports |

---

### Data Flow

```
app/(tabs)/_layout.tsx
  └── <AmbientBackground /> (no prop changes)
        └── re-exports → AnimatedMeshBackground (no props → idle Node C)

AnimatedMeshBackground
  ├── useWindowDimensions() → { width: w, height: h }
  ├── useSharedValue(0) → time
  ├── useEffect → time.value = withRepeat(withTiming(1, {dur:20000}), -1, false)
  ├── useDerivedValue → nodeACenter { x, y }
  ├── useDerivedValue → nodeBCenter { x, y }
  ├── useDerivedValue → nodeCCenter { x, y }
  ├── resolveNodeCColor(panelState, earningsPace, aiPct) → hex string
  └── <Canvas style={absoluteFill} pointerEvents="none">
        ├── <Rect color="#0D0C14" />           [base layer]
        ├── <Circle ...nodeA> BlendMode.Screen violet 0.12
        ├── <Circle ...nodeB> BlendMode.Screen cyan 0.12
        └── <Circle ...nodeC> BlendMode.Screen statusColor 0.12
```

---

### Hex-to-rgba Helper

Node C's color is a hex string. A small inline helper converts hex + alpha:

```typescript
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
```

Nodes A and B use constant colors so their rgba strings can be hardcoded as constants:
- Node A: `'rgba(167,139,250,0.12)'` (violet #A78BFA)
- Node B: `'rgba(0,194,255,0.12)'` (cyan #00C2FF)

---

### Node C Color Resolution

```typescript
function resolveNodeCColor(
  panelState?: PanelState | null,
  earningsPace?: number | null,
  aiPct?: number | null,
): string {
  if (panelState != null) {
    return AMBIENT_COLORS.panelState[panelState] ?? colors.background;
  }
  if (earningsPace != null) {
    return getAmbientColor({ type: 'earningsPace', ratio: earningsPace }) ?? colors.background;
  }
  if (aiPct != null) {
    return getAmbientColor({ type: 'aiPct', pct: aiPct }) ?? colors.background;
  }
  return colors.background; // idle: #0D0C14 (invisible against base layer)
}
```

---

### Edge Cases

| Scenario | Handling |
|----------|----------|
| `panelState="idle"` | `AMBIENT_COLORS.panelState.idle` returns `null` → fallback to `colors.background` → Node C invisible |
| All props null/undefined | `resolveNodeCColor` returns `colors.background` → Node C invisible |
| Screen width = 0 | `useWindowDimensions` returns actual device dimensions on initial mount; Canvas with w=0 renders nothing — acceptable |
| Hot reload / Fast Refresh | `useSharedValue` re-initializes; animation restarts — acceptable |
| `earningsPace` and `panelState` both provided | `panelState` takes priority (checked first) |
| `panelState.idle` null return | `??` fallback to `colors.background` prevents passing `null` to Skia |

---

### Performance Constraints

- **Zero JS-thread work per frame.** All sine/cosine math is inside `useDerivedValue` — executes on the Reanimated UI thread.
- **Single `time` SharedValue.** All three node positions derive from one value; Skia subscribes once.
- **No opacity animation on the Canvas.** `style.opacity < 1.0` on a Skia Canvas can cause rendering pipeline glitches. Canvas always at full opacity.
- **No `StyleSheet.create`.** Inline `StyleSheet.absoluteFill` constant is used (consistent with project convention).
- **Node C color change.** When `panelState` prop changes, React re-renders and passes a new `colors` array to Node C's `RadialGradient`. This is a prop change, not per-frame animation.

---

### Mock Strategy for Tests

```typescript
// @shopify/react-native-skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: any) => children ?? null,
  Rect: () => null,
  Circle: ({ children }: any) => children ?? null,
  RadialGradient: () => null,
  Paint: () => null,
  vec: (x: number, y: number) => ({ x, y }),
  BlendMode: { Screen: 'screen' },
  StyleSheet: { absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } },
}));

// react-native-reanimated — standard __mocks__ auto-mock (already in project)
// useSharedValue(v) → { value: v }
// useDerivedValue(fn) → { value: fn() }
// withRepeat, withTiming → pass-through (no-op in test env)
```

Source analysis (reading the file directly) is used for testing animation internals where runtime behavior cannot be observed via renderer.
