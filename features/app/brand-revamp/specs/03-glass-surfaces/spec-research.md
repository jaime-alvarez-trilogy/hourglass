# Spec Research: 03-glass-surfaces

**Feature:** brand-revamp
**Spec:** 03-glass-surfaces
**Complexity:** L

---

## Problem Context

The current `Card.tsx` uses a flat semi-opaque dark surface (`rgba(22, 21, 31, 0.85)`) with a plain 1px border. BlurView was previously removed from cards due to SIGKILL crashes caused by concurrent UIVisualEffectView framebuffer allocation during Reanimated worklet startup. The brand guidelines v2.0 mandate genuine Skia BackdropFilter glass — which avoids the crash by operating entirely within the Skia rendering pipeline (no UIVisualEffectView). Additionally, gradient borders (masked LinearGradient) and inner shadow simulation complete the physical glass illusion.

---

## Exploration Findings

### Current `Card.tsx`
```typescript
// Pure NativeWind approach
// base: backgroundColor rgba(22,21,31,0.85), border rgba(255,255,255,0.10) 1px
// elevated prop: backgroundColor rgba(31,30,41,0.92)
// glass={false} prop: disables glass treatment
// No Skia canvas, no BlurView

// Why BlurView was removed:
// Each BlurView mounts a UIVisualEffectView that allocates a GPU framebuffer.
// With 3-5 cards per tab + Reanimated initializing C++ worklets simultaneously,
// the concurrent GPU allocation triggers SIGKILL (OOM-kill).
// Skia BackdropFilter doesn't use UIVisualEffectView — stays within the Skia C++ layer.
```

### Current `PanelGradient.tsx`
```typescript
// Already uses BlurView (intensity=30, tint="systemChromeMaterialDark")
// This is ONE BlurView, pre-mounted at root, never remounted → no crash
// Max 3 overlapping glass layers rule: PanelGradient counts as 1 of 3
```

### `@shopify/react-native-skia` BackdropFilter API
```tsx
// Skia BackdropFilter: applies image filters to everything BEHIND the component
// Key: runs in same Skia canvas pipeline as the background mesh (spec 02)
// No UIVisualEffectView = no framebuffer allocation crash
<BackdropFilter filter={<Blur blur={16} />}>
  <RoundedRect x={0} y={0} width={w} height={h} r={16}
    color="rgba(22,21,31,0.6)" />
</BackdropFilter>
```

### Gradient border technique (`@react-native-masked-view/masked-view`)
Standard React Native cannot apply gradient to a border. The masking approach:
1. Render a `LinearGradient` spanning the full card size
2. Wrap in `MaskedView` with a mask that is the outer rounded rect MINUS the inner rounded rect (1.5px inset)
3. Only the 1.5px perimeter shows the gradient — creating a luminous edge

This package is **not currently installed** in package.json.

### Inner shadow (`react-native-inner-shadow`)
Package is **not currently installed**. Uses Skia canvas to paint:
- High-opacity black (`rgba(0,0,0,0.6)`) as inset shadow at top edge
- Low-opacity white (`rgba(255,255,255,0.08)`) highlight at bottom edge
Creates tactile beveled depth.

### Performance constraints (from spec)
- Maximum 3 overlapping glass layers per viewport at any time
- `renderToHardwareTextureAndroid={true}` MANDATORY on Android GlassCard
- Card opacity must stay at 1.0 (sub-1.0 on blur = rendering glitches)
- PanelGradient's existing BlurView counts as 1 layer → at most 2 GlassCards visible simultaneously on the hero screen

### Layout measurement
BackdropFilter must know the exact pixel dimensions of the card to size the Skia canvas correctly. The component needs `onLayout` measuring, same pattern used in WeeklyBarChart.

---

## Key Decisions

1. **New `GlassCard` component** — don't modify `Card.tsx` in-place. Create `GlassCard.tsx` and update `Card.tsx` to delegate to it by default (when `glass={true}`, which is the default). This allows easy rollback and isolated testing.

2. **Skia BackdropFilter blur radius**: 16px (matches spec's `ImageFilter.Blur(16,16)`). Elevated variant uses 20px.

3. **Gradient border color**: Violet (`#A78BFA`) → transparent, at 45° angle. Can accept an optional `borderAccentColor` prop for status-aware borders (green on success hero card, etc.).

4. **PressIn animation**: `useAnimatedStyle` with `useSharedValue` for scale (1→0.97) via spring. The Skia canvas inner shadow opacity is updated via a `useSharedValue` passed to the canvas paint.

5. **Android strategy**: Apply `renderToHardwareTextureAndroid={true}` to the outer View wrapping the Skia canvas. Same BackdropFilter architecture as iOS (no platform branch needed for Android — Skia is cross-platform).

6. **Layer budget enforcement**: `GlassCard` accepts a `layerBudget` prop (default `true`). When false, renders flat surface (legacy Card behavior) for low-end device fallback. Screens that already have PanelGradient should set at most 2 nested GlassCards.

7. **`react-native-inner-shadow` vs manual Skia**: Use `react-native-inner-shadow` library as it provides the Skia-based implementation with the exact inner shadow behavior specified.

---

## Interface Contracts

### New dependencies (to add to package.json)
```json
"@react-native-masked-view/masked-view": "^0.3.2",
"react-native-inner-shadow": "^1.0.0"
```

### `GlassCard` component

```typescript
// src/components/GlassCard.tsx

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;                    // NativeWind passthrough for margin/flex
  padding?: 'md' | 'lg';                // p-5 (20px) | p-6 (24px) — spec mandated
  radius?: 'xl' | '2xl';                // 12px | 16px border radius
  elevated?: boolean;                    // 30px blur, surfaceElevated tint
  borderAccentColor?: string;            // gradient border start color (default: violet)
  pressable?: boolean;                   // enable PressIn scale animation
  onPress?: () => void;
  layerBudget?: boolean;                 // false = render flat (performance fallback)
  style?: ViewStyle;
}

// Returns: MaskedView (gradient border) > Skia Canvas (BackdropFilter + RoundedRect) >
//          InnerShadow > content View
```

### Skia canvas dimensions
```typescript
// Uses onLayout to measure card dimensions in pixels
const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
// Canvas sized to dimensions.w × dimensions.h
```

### PressIn animation contract
```typescript
const scale = useSharedValue(1);
const handlePressIn = () => {
  scale.value = withSpring(0.97, { stiffness: 300, damping: 20 });
};
const handlePressOut = () => {
  scale.value = withSpring(1, { stiffness: 300, damping: 20 });
};
// Applied to outer Animated.View wrapping the entire GlassCard
```

### Updated `Card.tsx` delegation

```typescript
// Card.tsx wraps GlassCard when glass !== false
// glass defaults to true — breaking change: ALL cards get glass by default
// glass={false} renders legacy flat surface (no Skia)
export function Card({ glass = true, ...props }: CardProps) {
  if (!glass) return <FlatCard {...props} />;
  return <GlassCard {...props} />;
}
```

---

## Test Plan

### `glassCardRender`
**Happy path:**
- [ ] GlassCard renders children without error
- [ ] GlassCard renders Skia Canvas with BackdropFilter
- [ ] GlassCard renders MaskedView for gradient border
- [ ] GlassCard renders InnerShadow component

**Props:**
- [ ] `elevated=true` increases blur radius to 20px
- [ ] `borderAccentColor` prop changes gradient start color
- [ ] `layerBudget=false` renders flat surface (no Skia Canvas, no MaskedView)
- [ ] `padding="lg"` applies 24px internal padding
- [ ] `radius="xl"` applies 12px border radius (default is 16px / 2xl)

**PressIn:**
- [ ] `pressable=true` attaches onPressIn/onPressOut handlers
- [ ] onPressIn triggers scale animation (scale.value → 0.97)
- [ ] onPressOut returns scale.value → 1
- [ ] `pressable=false` does not attach gesture handlers

**Android:**
- [ ] `renderToHardwareTextureAndroid={true}` is set on Android (Platform.OS === 'android')

### `cardDelegation`
- [ ] `Card` with default props delegates to GlassCard
- [ ] `Card glass={false}` renders FlatCard (no Skia)
- [ ] `Card elevated={true}` passes elevated prop to GlassCard

### `glassLayerBudget`
- [ ] GlassCard with `layerBudget=false` renders no BackdropFilter
- [ ] Documentation: max 3 glass layers per screen (enforced by caller convention, not runtime)

**Mocks needed:**
- `@shopify/react-native-skia`: BackdropFilter, Blur, Canvas, RoundedRect
- `@react-native-masked-view/masked-view`: MaskedView
- `react-native-inner-shadow`: InnerShadow

---

## Files to Reference

- `hourglassws/src/components/Card.tsx` — current implementation to wrap
- `hourglassws/src/components/PanelGradient.tsx` — existing BlurView usage (1 of 3 layer budget)
- `hourglassws/src/components/WeeklyBarChart.tsx` — reference for Skia canvas + onLayout pattern
- `hourglassws/src/lib/colors.ts` — border accent color constants
- `hourglassws/tailwind.config.js` — border/surface color tokens
- `hourglassws/package.json` — to confirm masked-view and inner-shadow are added
