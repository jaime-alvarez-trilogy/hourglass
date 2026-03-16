# Spec Research — 02-dark-glass

## Problem Context

Both gauntlet runs identified "zero dark glass depth" as a critical gap. Run-002 scored dark glass at 2.5/10. The brand guidelines describe a three-tier layered depth system using backdrop blur + noise texture + semi-transparent surfaces. `expo-blur` is already installed (`~15.0.8`) but `BlurView` is never used. Cards use flat `bg-surface` (#16151F) with no blur, no translucency, no glass effect.

Run-002 synthesis: "Noise texture (3-5%) + expo-blur on cards = dark glass foundation"
BRAND_GUIDELINES.md: "backdrop-filter: blur(16px), background: hsla(248, 15%, 10%, 0.75), border: 1px solid rgba(255,255,255,0.06)"

## Exploration Findings

### Current Card implementation

**File:** `src/components/Card.tsx`
```tsx
// Current (simplified):
<View className={`bg-surface rounded-2xl border border-border p-5 ${className}`}>
  {children}
</View>
```
Plain flat surface. No blur. Border uses `colors.border` (#2F2E41) — opaque.

### expo-blur BlurView API
```tsx
import { BlurView } from 'expo-blur';
// <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
// intensity: 0–100 (higher = more blur)
// tint: "dark" | "light" | "default" | "prominent"
```
BlurView must be absolutely positioned behind content. Requires wrapping the card in a `View` with `overflow: hidden` and `borderRadius` applied to the wrapper (not the BlurView).

### NoiseOverlay
**File:** `src/components/NoiseOverlay.tsx` — already exists, opacity 0.04. Applied once at root `_layout.tsx` level. Does NOT need to be duplicated per card — root-level is correct per brand guidelines ("Applied once at root screen level only").

### Affected surfaces per brand guidelines
- **Card (base):** `BlurView intensity={40}`, semi-transparent bg `rgba(22, 21, 31, 0.75)`, border `rgba(255,255,255,0.06)`
- **Card (elevated):** `BlurView intensity={60}`, slightly brighter bg `rgba(31, 30, 41, 0.80)`, same border
- **PanelGradient (hero panel):** Already has coloured glow via iOS shadow. Add `BlurView intensity={30}` for glass base layer.

### Important: BlurView on Android
`expo-blur` BlurView on Android has historically been unreliable. Per Expo docs (SDK 54+), it now uses RenderEffect API on Android 12+ (API 31+). For older Android, it renders a dark overlay fallback. This is acceptable — the glass effect degrades gracefully.

### Border colour change
The current `border-border` (#2F2E41, opaque) will be replaced with an inline `borderColor: 'rgba(255,255,255,0.06)'` (the brand-spec 1px highlight). This requires using `style` prop alongside NativeWind `className` on the Card wrapper.

## Key Decisions

1. **BlurView wraps card content**: The Card component wraps children in a `View` (outer, handles borderRadius + overflow) → `BlurView` (absolutely fills outer) → `View` (inner, handles padding/content). This is the standard React Native pattern.
2. **bg-surface becomes semi-transparent**: The inner content view gets `backgroundColor: 'rgba(22, 21, 31, 0.75)'` instead of the opaque `bg-surface` class. This exposes the blur behind it.
3. **Border via style, not className**: NativeWind opacity modifiers on borders (`border-white/6`) may not work as expected — use `style={{ borderColor: 'rgba(255,255,255,0.06)' }}` directly.
4. **Elevated variant**: Higher intensity (60) + slightly brighter semi-transparent bg.
5. **No per-card NoiseOverlay**: The root-level overlay at `_layout.tsx` is sufficient.
6. **PanelGradient glass base**: The hero panel gets `intensity={30}` (lighter than cards, since the gradient provides most of the visual weight).

## Interface Contracts

### Updated `Card` component props
```typescript
interface CardProps {
  elevated?: boolean;      // Higher blur intensity + brighter bg (unchanged prop, new visual)
  glass?: boolean;         // Opt-out: false = render flat (useful for modal overlays that already have blur)
  className?: string;
  style?: ViewStyle;       // Pass-through to outer wrapper
  children: React.ReactNode;
}
```
**Source:** Existing `Card.tsx` + new `glass` opt-out prop

### Glass style constants (in Card.tsx)
```typescript
const GLASS_BASE = {
  backgroundColor: 'rgba(22, 21, 31, 0.75)',    // surface at 75% opacity
  borderColor: 'rgba(255, 255, 255, 0.06)',
  borderWidth: 1,
};
const GLASS_ELEVATED = {
  backgroundColor: 'rgba(31, 30, 41, 0.80)',    // surfaceElevated at 80% opacity
  borderColor: 'rgba(255, 255, 255, 0.06)',
  borderWidth: 1,
};
const BLUR_INTENSITY_BASE = 40;
const BLUR_INTENSITY_ELEVATED = 60;
```
**Source:** BRAND_GUIDELINES.md glass spec + expo-blur API

## Test Plan

### Card renders BlurView
**Happy Path:**
- [ ] Card renders a `BlurView` child
- [ ] BlurView has `intensity={40}` in base variant
- [ ] BlurView has `intensity={60}` in elevated variant
- [ ] Outer wrapper has `overflow: "hidden"` and `borderRadius: 16`

**Edge Cases:**
- [ ] `glass={false}` renders flat surface without BlurView
- [ ] className prop still applied to outer wrapper

### Glass style constants
- [ ] `GLASS_BASE.backgroundColor` is semi-transparent (contains `rgba`)
- [ ] `GLASS_ELEVATED.backgroundColor` is semi-transparent (contains `rgba`)
- [ ] Both have `borderColor: 'rgba(255, 255, 255, 0.06)'`

### PanelGradient glass base
- [ ] PanelGradient renders BlurView with `intensity={30}`

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Card.tsx` | Add BlurView, semi-transparent bg, updated border, `glass` prop |
| `src/components/PanelGradient.tsx` | Add BlurView base layer at intensity 30 |

## Files to Reference

- `BRAND_GUIDELINES.md` — "Surface & Depth — Dark Glass System" section
- `src/lib/colors.ts` — surface, surfaceElevated hex values for rgba derivation
- Expo docs: `expo-blur` BlurView API
