# Spec Research: 02-home-hero-ambient

## Problem Context

The home screen's hero panel (`PanelGradient`) contains its glow tightly within the card. The ambient gradient from 01-ambient-layer needs to be wired here, and the `PanelGradient` needs its containment loosened so the hero color and the background field feel unified — the card's glow and the screen's ambient color are the same signal.

## Scope

**FR1** — Add `AmbientBackground` to home screen, driven by `panelState`
**FR2** — Loosen `PanelGradient` containment: extend gradient radius, reduce inner opacity so glow bleeds naturally into ambient field
**FR3** — Smooth ambient color transitions with `springPremium` (state changes feel intentional)

## Exploration Findings

### Home screen structure (`app/(tabs)/index.tsx`)
```
<FadeInScreen>
  <SafeAreaView>
    <ScrollView>
      <PanelGradient state={panelState}>   ← hero
        <MetricValue .../>
        <StateBadge .../>
        sub-metrics row
      </PanelGradient>
      <Card> WeeklyBarChart </Card>        ← zone 2
      <Card> AIConeChart compact </Card>   ← zone 2.5
      <Card> TrendSparkline earnings </Card> ← zone 3
      <UrgencyBanner />
    </ScrollView>
  </SafeAreaView>
</FadeInScreen>
```

`panelState` is already computed from `useHoursData()` → `computePanelState()`. It's available at the screen level.

### PanelGradient SVG gradient parameters (current)
```tsx
cx="50%" cy="30%" r="50%"  // tight radial gradient
inner stop: stateColor at opacity 0.35
outer stop: transparent
```
The gradient is tight (r=50%) and low intensity (0.35). Loosening to r=70%, opacity 0.50 at inner stop, and making the outer stop fade at a larger radius will create a more expansive hero glow that feels like the source of the ambient field.

### AmbientBackground dependency
`AmbientBackground` from 01-ambient-layer. Wire with:
```tsx
<AmbientBackground color={getAmbientColor({ type: 'panelState', state: panelState })} />
```
Placed as the first child of the root `View` in `TabLayout` or as first child in the screen's root view (outside `ScrollView` so it doesn't scroll).

### Placement in layout
`AmbientBackground` must be placed **outside the ScrollView** (position: absolute, full screen) so it stays fixed while the user scrolls. The cards scroll over the ambient field — this creates the parallax glass effect.

Ideal placement: inside `<SafeAreaView>` as first child (absolute, so it doesn't affect layout), before `<ScrollView>`.

### Animation
`panelState` changes are meaningful events (e.g., flipping from `behind` to `onTrack`). The ambient color transition should use `withSpring(springPremium)` via Reanimated's `interpolateColor` to feel weighty and intentional.

## Key Decisions

1. **AmbientBackground outside ScrollView** — Fixed backdrop, content scrolls over it. This is the key to the parallax glass feel: cards move through the colored field as you scroll.

2. **PanelGradient radius expansion** — `r="50%"` → `r="70%"`, inner opacity `0.35` → `0.50`. Hero becomes more expansive, merging visually with the ambient field.

3. **No change to PanelGradient's SVG structure** — Only gradient parameters change (cx/cy/r and stop opacities). No new props. Zero risk of breaking existing tests.

4. **Animated ambient via Reanimated** — `AmbientBackground` receives a `color` string. The animation happens inside the component (shared value + interpolateColor). Screen just passes the new color synchronously.

## Interface Contracts

```typescript
// Changes to index.tsx
// New: getAmbientColor imported from AmbientBackground
// New: AmbientBackground rendered as fixed backdrop

// PanelGradient — no API changes, only internal SVG parameter changes:
// r: "50%" → "70%"
// inner stop opacity: 0.35 → 0.50

// No new types — panelState is already PanelState from computePanelState()
```

### Source Tracing

| Element | Source |
|---------|--------|
| `panelState` passed to `AmbientBackground` | Existing — `computePanelState(hours, limit, daysElapsed)` already in index.tsx |
| `getAmbientColor` | Imported from `src/components/AmbientBackground` (01-ambient-layer) |
| SVG gradient params | Internal to `PanelGradient.tsx` — no external API change |

## Test Plan

### Home screen ambient wiring
- [ ] `AmbientBackground` is rendered in source of index.tsx
- [ ] `getAmbientColor` is called with `{ type: 'panelState', state: panelState }`
- [ ] `AmbientBackground` is positioned outside ScrollView (not inside it)

### PanelGradient gradient expansion
- [ ] Source uses `r="70%"` (not `r="50%"`)
- [ ] Inner stop opacity is `0.50` (was `0.35`)
- [ ] No change to external PanelGradient props API

### Existing tests
- [ ] All existing PanelGradient tests still pass (no API change)
- [ ] All existing index.tsx tests still pass

## Files to Modify

| File | Action |
|------|--------|
| `app/(tabs)/index.tsx` | **Modify** — add AmbientBackground before ScrollView |
| `src/components/PanelGradient.tsx` | **Modify** — expand SVG radial gradient params |
| `app/(tabs)/__tests__/index.test.tsx` | **Modify** — add ambient wiring assertions |
| `src/components/__tests__/PanelGradient.test.tsx` | **Modify** — update gradient param assertions |

## Files to Reference

- `app/(tabs)/index.tsx` — full screen structure, panelState computation
- `src/components/PanelGradient.tsx` — SVG RadialGradient parameters
- `src/components/AmbientBackground.tsx` — from 01-ambient-layer (blocked by)
- `src/lib/reanimated-presets.ts` — springPremium
