# Spec Research: 08-dark-glass-polish

## Problem Context

Four targeted visual fixes to fully align the Hourglass app with the Dark Liquid Glass paradigm. All changes are in-place edits to existing components — no new files required.

## Exploration Findings

### FR1: Bento Grid (overview.tsx)

**Current state** (`overview.tsx` lines 287–359):
- 4 `ChartSection` instances wrapped in `Animated.View`, stacked vertically with `gap: 12`
- Each ChartSection renders a full-width `Card` with label, hero value, subtitle, sparkline
- The `ChartSection` component uses `onLayout` to measure its own width → passed to TrendSparkline

**How the bento fix works**:
- Earnings (index 0) stays full-width — no change needed
- Hours (index 1) + AI% (index 2) are wrapped in a `flex-row` container
- Each gets `flex: 1` so they split the row evenly
- BrainLift (index 3) stays full-width
- `onLayout` in ChartSection automatically measures the narrower width → TrendSparkline adapts

**Key file**: `hourglassws/app/(tabs)/overview.tsx` lines 306–341

### FR2: Progress Ring Gradient (AIArcHero.tsx)

**Root cause** (`AIArcHero.tsx` lines 169–180):
```tsx
<Path
  path={trimmedPath}
  style="stroke"
  strokeWidth={STROKE_WIDTH}
  strokeCap="round"
  color="transparent"    // ← BUG: alpha=0 zeroes paint alpha → gradient invisible
>
  <SweepGradient
    c={{ x: cx, y: cy }}
    colors={[...GRADIENT_COLORS]}
  />
</Path>
```

In react-native-skia, the `color` prop on a `<Path>` sets the paint's base alpha. When a shader child (SweepGradient) is added, the shader provides per-pixel color but Skia still applies the paint's alpha as a multiplier. `color="transparent"` → alpha=0 → `0 × shader_rgba = invisible`.

**Fix**: Change `color="transparent"` → `color="white"` (alpha=1.0). The SweepGradient shader then renders at full opacity using its own gradient colors.

**Key file**: `hourglassws/src/components/AIArcHero.tsx` line 173

### FR3: DailyAIRow Elevation (DailyAIRow.tsx)

**Current state** (`DailyAIRow.tsx`):
- Each row is a plain `View` with NativeWind className + border-b divider
- No background, no rounded corners, no spatial separation

**Architecture constraint**:
- Rows are rendered inside a `Card` (GlassCard → BackdropFilter)
- Nesting BackdropFilter within BackdropFilter causes GPU overload → SIGKILL on mobile
- Decision: Use semi-transparent solid fill + Skia inner shadow (no BackdropFilter)

**Visual approach** (per design decision):
```
View (row wrapper):
  backgroundColor: 'rgba(255,255,255,0.05)'   // subtle surface lift
  borderRadius: 8
  borderWidth: 1
  borderColor: 'rgba(255,255,255,0.10)'        // 1px subtle border
  marginVertical: 2
  overflow: 'hidden'

  Canvas (inner shadow, absoluteFill, pointerEvents="none"):
    RoundedRect + LinearGradient:
      stops: [rgba(0,0,0,0.4) at y=0, transparent by y=12px]
      // top dark inset shadows the row edge

  View (content, padding: 8 horizontal):
    existing text/columns
```

This achieves: "floating secondary z-layer" appearance without any BackdropFilter cost.

**Key file**: `hourglassws/src/components/DailyAIRow.tsx`

### FR4: Mesh Signal Wiring + Opacity (AnimatedMeshBackground.tsx + screens)

**Root cause** (`AmbientBackground.tsx` default export):
```tsx
export default function AmbientBackground({ color: _color, intensity: _intensity }) {
  // color prop explicitly ignored (_color prefix)
  return React.createElement(AnimatedMeshBackgroundComponent, {});
  // No props passed → Node C is always idle (#0D0C14 = invisible)
}
```

**AnimatedMeshBackground signal props**:
```tsx
interface AnimatedMeshBackgroundProps {
  panelState?: PanelState | null;
  earningsPace?: number | null;  // 0–1 ratio
  aiPct?: number | null;          // 0–100
}
```

**Fix plan**:
1. `overview.tsx`: Replace `<AmbientBackground color={ambientColor} />` with `<AnimatedMeshBackground earningsPace={earningsPace} />` (earningsPace is already computed at line 175)
2. `ai.tsx`: Replace with `<AnimatedMeshBackground aiPct={Math.round(heroAIPct)} />`
3. `AnimatedMeshBackground.tsx`: Increase node inner opacity 0.15 → 0.22

**Import change**: Both screens need to import `AnimatedMeshBackground` (already in `@/src/components/AnimatedMeshBackground`) and remove/keep `AmbientBackground` import only for `getAmbientColor`.

**Node C color resolution** (from `AnimatedMeshBackground.tsx`):
- Overview with `earningsPace`: gold (≥0.85), warning (0.60–0.84), critical (<0.60)
- AI tab with `aiPct`: violet (≥75), cyan (60–74), warning (<60)

**Key files**:
- `hourglassws/src/components/AnimatedMeshBackground.tsx` lines 76–83 (opacity constants)
- `hourglassws/app/(tabs)/overview.tsx` line 229
- `hourglassws/app/(tabs)/ai.tsx` line 191

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Wrap Hours+AI% in flex-row (not CSS grid) | React Native doesn't have CSS grid; flex-row with flex:1 achieves the split cleanly |
| `color="white"` not `color="#FFFFFF00ff"` | White is clearest intent — "full opacity, let gradient provide color" |
| No BackdropFilter in DailyAIRow | Nesting blur causes SIGKILL; semi-transparent solid + Skia inner shadow achieves same visual |
| Import AnimatedMeshBackground directly in screens | Avoids the deprecated AmbientBackground wrapper that discards signal props |
| Keep AmbientBackground import for getAmbientColor | getAmbientColor is still used for ambientColor computation in both screens |
| Opacity 0.15 → 0.22 | More visible behind glass (0.22 stays below 0.25 threshold where bloom feels distracting) |

## Interface Contracts

### FR1: ChartSection in bento row

No interface changes. `ChartSection` keeps its existing props. The bento layout is a pure JSX change in `OverviewScreen`:

```tsx
// New JSX shape (replace lines 306–341):
{/* Earnings — full width */}
<Animated.View style={getEntryStyle(0)}>
  <ChartSection label="WEEKLY EARNINGS" ... />
</Animated.View>

{/* Hours + AI% — side-by-side row */}
<Animated.View style={[getEntryStyle(1), { flexDirection: 'row', gap: 8 }]}>
  <View style={{ flex: 1 }}>
    <ChartSection label="WEEKLY HOURS" ... />
  </View>
  <View style={{ flex: 1 }}>
    <ChartSection label="AI USAGE %" ... />
  </View>
</Animated.View>

{/* BrainLift — full width */}
<Animated.View style={getEntryStyle(2)}>
  <ChartSection label="BRAINLIFT HOURS" ... />
</Animated.View>
```

Note: stagger indexes change — Hours+AI% share index 1, BrainLift becomes index 2. Update `useStaggeredEntry({ count: 3 })`.

### FR2: AIArcHero fill path

```diff
-  color="transparent"
+  color="white"
```

Source: `AIArcHero.tsx` line 173.

### FR3: DailyAIRow wrapper

New `GlassRowWrapper` inline style constants:
```tsx
// New constants in DailyAIRow.tsx
const ROW_BG = 'rgba(255,255,255,0.05)';        // ← subtle surface lift
const ROW_BORDER = 'rgba(255,255,255,0.10)';     // ← 1px border
const ROW_SHADOW_TOP = 'rgba(0,0,0,0.40)';       // ← Skia inner shadow top
const ROW_RADIUS = 8;

// Updated JSX:
<View style={{
  backgroundColor: ROW_BG,
  borderRadius: ROW_RADIUS,
  borderWidth: 1,
  borderColor: ROW_BORDER,
  marginVertical: 2,
  overflow: 'hidden',
}}>
  <Canvas style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
    <RoundedRect x={0} y={0} width={dims.w} height={dims.h} r={ROW_RADIUS}>
      <SkiaLinearGradient
        start={vec(0, 0)}
        end={vec(0, 12)}
        colors={[ROW_SHADOW_TOP, 'transparent']}
      />
    </RoundedRect>
  </Canvas>
  {/* existing row content */}
</View>
```

DailyAIRow needs `onLayout` to measure `dims` for the Canvas — same pattern as GlassCard.

### FR4: AnimatedMeshBackground opacity constants

```diff
- const NODE_A_INNER = 'rgba(167,139,250,0.15)';
+ const NODE_A_INNER = 'rgba(167,139,250,0.22)';

- const NODE_B_INNER = 'rgba(0,194,255,0.15)';
+ const NODE_B_INNER = 'rgba(0,194,255,0.22)';
```

Node C opacity is built dynamically via `hexToRgba(nodeCHex, 0.15)`:
```diff
- const nodeCColors: [string, string] = [hexToRgba(nodeCHex, 0.15), 'transparent'];
+ const nodeCColors: [string, string] = [hexToRgba(nodeCHex, 0.22), 'transparent'];
```

Screen wiring in `overview.tsx`:
```diff
- import AmbientBackground, { getAmbientColor } from '@/src/components/AmbientBackground';
+ import AmbientBackground, { getAmbientColor } from '@/src/components/AmbientBackground';
+ import AnimatedMeshBackground from '@/src/components/AnimatedMeshBackground';

- <AmbientBackground color={ambientColor} />
+ <AnimatedMeshBackground earningsPace={earningsPace} />
```

Screen wiring in `ai.tsx`:
```diff
- import AmbientBackground, { getAmbientColor } from '@/src/components/AmbientBackground';
+ import AmbientBackground, { getAmbientColor } from '@/src/components/AmbientBackground';
+ import AnimatedMeshBackground from '@/src/components/AnimatedMeshBackground';

- <AmbientBackground color={ambientColor} />
+ <AnimatedMeshBackground aiPct={Math.round(heroAIPct)} />
```

`getAmbientColor` import is kept because both screens still use it to compute `ambientColor` for AIArcHero.

## Test Plan

### FR1: Bento Grid

**Files affected**: `overview.tsx` (no test file for this screen)
- No existing snapshot tests to update
- Manual verification: Hours and AI% cards appear side-by-side at ~50% width each

### FR2: Progress Ring Gradient

**File**: `AIArcHero.tsx`
**Existing tests**: `hourglassws/src/components/__tests__/` — check if AIArcHero tests exist

**Tests to verify/update**:
- [ ] Render test: component renders without error with `color="white"` fill path
- [ ] Visual: fill arc receives SweepGradient child (existing test logic unchanged)

### FR3: DailyAIRow Elevation

**File**: `DailyAIRow.tsx`
**Tests to verify**:
- [ ] Snapshot test (if exists): update to reflect new wrapper View structure
- [ ] Row still renders date label, AI%, BrainLift columns correctly
- [ ] Canvas is rendered when dims are measured (onLayout test)
- [ ] `isToday` styling still applies (bg-surface conditional)

### FR4: Mesh Signal Wiring

**File**: `AnimatedMeshBackground.tsx`
**Existing tests**: `AnimatedMeshBackground.test.tsx` exists

**Tests to verify**:
- [ ] `resolveNodeCColor` with `earningsPace=0.9` returns gold
- [ ] `resolveNodeCColor` with `aiPct=80` returns violet
- [ ] `hexToRgba` with alpha=0.22 renders correctly
- [ ] Snapshot/render tests update for new opacity constants

## Files to Reference

- `hourglassws/src/components/AnimatedMeshBackground.tsx` — Node opacity constants, resolveNodeCColor
- `hourglassws/src/components/AIArcHero.tsx` — fill path color fix
- `hourglassws/src/components/DailyAIRow.tsx` — row elevation implementation
- `hourglassws/src/components/GlassCard.tsx` — reference for inner shadow pattern (copy the canvas approach)
- `hourglassws/app/(tabs)/overview.tsx` — bento layout + mesh wiring
- `hourglassws/app/(tabs)/ai.tsx` — mesh signal wiring
- `hourglassws/src/components/__tests__/AnimatedMeshBackground.test.tsx` — existing tests to validate
