# 02-home-hero-ambient

**Status:** Draft
**Created:** 2026-03-16
**Last Updated:** 2026-03-16
**Blocked By:** 01-ambient-layer (complete)

---

## Overview

**02-home-hero-ambient** wires the `AmbientBackground` component (built in 01-ambient-layer) into the Home screen and expands the `PanelGradient` hero's radial gradient so the card's glow and the screen's ambient field feel unified.

### What Is Being Built

1. **Home screen ambient wiring** — `AmbientBackground` is rendered as a fixed, full-screen backdrop behind the `ScrollView` on the Home tab. It receives a `color` prop derived from the current `panelState` via `getAmbientColor({ type: 'panelState', state: panelState })`. As `panelState` changes, `AmbientBackground` animates the color transition using its internal `springPremium` Reanimated animation.

2. **PanelGradient gradient expansion** — The SVG `RadialGradient` inside `PanelGradient` is loosened: `r` stays at `"70%"` (already correct from prior spec), and the inner stop opacity is increased from `0.35` to `0.50`. This makes the hero card a stronger focal point that visually merges with the ambient field behind it.

### How It Works

The three-layer stack from the design system becomes live on the Home screen:

```
Layer 1 — AmbientBackground (absolute, full-screen, behind SafeAreaView content)
          color = getAmbientColor({ type: 'panelState', state: panelState })
          fixed: does not scroll with content

Layer 2 — PanelGradient (hero card, zone 1)
          radial gradient: r=70%, inner opacity 0.50
          glow bleeds into ambient field

Layer 3 — Card components (zone 2, 2.5, 3)
          scroll over Layer 1
          BlurView samples ambient field → tinted frost
```

The `AmbientBackground` component handles all animation internally. The screen only needs to compute the signal (`panelState`, already available) and pass the derived `color` string.

### Scope

This spec covers the Home screen only. Overview and AI ambient wiring are handled in specs 03 and 04 respectively.

---

## Out of Scope

1. **Overview tab ambient wiring** — Deferred to `03-overview-hero`. The Overview screen requires a new dual-metric hero card design in addition to ambient wiring; that work is decomposed separately.

2. **AI tab ambient wiring** — Deferred to `04-ai-hero-arc`. The AI screen requires a new arc hero component before ambient can be wired; that work is decomposed separately.

3. **Requests tab ambient wiring** — **Descoped.** No hero redesign planned for Requests tab (explicitly out of scope in FEATURE.md).

4. **PanelGradient new props or API changes** — **Descoped.** Only internal SVG gradient parameters change (inner stop opacity). The external `PanelGradient` API (`state`, `children`, `className`) remains unchanged.

5. **AmbientBackground component implementation** — **Descoped.** `AmbientBackground` was built in `01-ambient-layer`. This spec only wires it into the Home screen.

6. **Card opacity / BlurView intensity changes** — **Descoped.** Card opacity was updated in `01-ambient-layer` (FR3/FR4). No further changes needed here.

7. **Skeleton loader or navigation changes** — **Descoped.** Outside FEATURE.md scope.

8. **TabLayout-level ambient placement** — **Descoped.** `AmbientBackground` is placed inside the screen, not at the tab layout level. Each screen manages its own ambient independently.

---

## Functional Requirements

### FR1 — Wire AmbientBackground to Home screen

Add `AmbientBackground` to `app/(tabs)/index.tsx` as a fixed full-screen backdrop.

**Implementation:**
- Import `AmbientBackground` and `getAmbientColor` from `@/src/components/AmbientBackground`
- Compute `ambientColor` using `getAmbientColor({ type: 'panelState', state: panelState })`
- Render `<AmbientBackground color={ambientColor} />` as an absolutely-positioned element **outside** the `ScrollView` (inside `SafeAreaView`, before `ScrollView`)
- `AmbientBackground` has `pointerEvents="none"` internally — no interaction concerns

**Success Criteria:**
- `AmbientBackground` is imported in `index.tsx`
- `getAmbientColor` is imported in `index.tsx`
- `AmbientBackground` is rendered in the component tree
- `AmbientBackground` appears in the JSX before `<ScrollView>` (not inside it)
- `color` prop is derived from `getAmbientColor({ type: 'panelState', state: panelState })`
- No `StyleSheet` import added to the file (no StyleSheet.create)
- No hardcoded hex color strings added to the file

---

### FR2 — Expand PanelGradient radial gradient

Update the SVG `RadialGradient` inside `PanelGradient` to make the hero glow more expansive.

**Implementation:**
- In `src/components/PanelGradient.tsx`, update the inner `Stop` opacity from `0.35` to `0.50`
- `r="70%"` is already correct — no change needed
- `cx="50%"`, `cy="30%"`, `gradientUnits="objectBoundingBox"` remain unchanged
- No external API changes — `state`, `children`, `className` props are unchanged

**Success Criteria:**
- Source file has inner stop `stopOpacity={0.50}` (not `0.35`)
- Source file still has `r="70%"`
- Source file still has `cx="50%"` and `cy="30%"`
- `PANEL_GRADIENT_COLORS` export is unchanged
- `getGlowStyle` export is unchanged
- `BLUR_INTENSITY_PANEL` export is unchanged
- All existing PanelGradient tests still pass (no API change)

---

### FR3 — Smooth ambient color transitions (inherited behavior)

The ambient color transition animation is handled entirely inside `AmbientBackground` (built in 01-ambient-layer). This FR verifies the integration behaves correctly when `panelState` changes at the screen level.

**Implementation:**
- No code change required — `AmbientBackground` uses `springPremium` internally
- Screen passes new `color` string synchronously when `panelState` changes
- The fade-through-opacity pattern in `AmbientBackground` handles the visual transition

**Success Criteria:**
- `springPremium` import is NOT required in `index.tsx` (animation is internal to `AmbientBackground`)
- `AmbientBackground` receives a color derived from `panelState` (verified via FR1 criteria)
- When `panelState` is `'idle'`, `getAmbientColor` returns `null` → `AmbientBackground` renders an empty view (verified via `AmbientBackground` tests from 01-ambient-layer)

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/app/(tabs)/index.tsx` | Home screen — add AmbientBackground wiring |
| `hourglassws/src/components/PanelGradient.tsx` | Hero panel — expand gradient opacity |
| `hourglassws/src/components/AmbientBackground.tsx` | Built in 01-ambient-layer — import from here |
| `hourglassws/src/lib/panelState.ts` | `PanelState` type and `computePanelState()` |
| `hourglassws/src/lib/reanimated-presets.ts` | `springPremium` (used inside AmbientBackground) |
| `hourglassws/src/lib/colors.ts` | Design tokens |

### Files to Modify

| File | Action | Detail |
|------|--------|--------|
| `hourglassws/app/(tabs)/index.tsx` | **Modify** | Add `AmbientBackground` import + render before `ScrollView` |
| `hourglassws/src/components/PanelGradient.tsx` | **Modify** | Update inner stop `stopOpacity` from `0.35` to `0.50` |

### Test Files to Modify

| File | Action | Detail |
|------|--------|--------|
| `hourglassws/app/(tabs)/__tests__/index.test.tsx` | **Modify** | Add FR1 ambient wiring assertions (source-level) |
| `hourglassws/src/components/__tests__/PanelGradient.test.tsx` | **Modify** | Add FR2 inner stop opacity assertion |

---

### Data Flow

```
panelState (computed from useHoursData + computePanelState)
    │
    ▼
getAmbientColor({ type: 'panelState', state: panelState })
    │  → returns: string | null
    │
    ▼
<AmbientBackground color={ambientColor} />
    │  absolute, pointerEvents="none", outside ScrollView
    │  internal springPremium animation on color change
    │
    ▼
SVG RadialGradient: cx=50% cy=0% r=70% screen-width
  color at 8% opacity center → transparent edge
```

### Placement in JSX

Current structure in `index.tsx`:

```tsx
<FadeInScreen>
  <SafeAreaView className="flex-1 bg-background">
    <ScrollView ...>
      {/* content */}
    </ScrollView>
  </SafeAreaView>
</FadeInScreen>
```

After this spec:

```tsx
<FadeInScreen>
  <SafeAreaView className="flex-1 bg-background">
    {/* FR1: Fixed ambient backdrop — outside ScrollView, does not scroll */}
    <AmbientBackground color={getAmbientColor({ type: 'panelState', state: panelState })} />
    <ScrollView ...>
      {/* content unchanged */}
    </ScrollView>
  </SafeAreaView>
</FadeInScreen>
```

`AmbientBackground` renders `StyleSheet.absoluteFill` internally, so it does not affect the layout of `ScrollView`.

### PanelGradient Change Detail

Only one line changes in `PanelGradient.tsx`:

```tsx
// Before:
<Stop offset="0%" stopColor={gradientColors.inner} stopOpacity={0.35} />

// After:
<Stop offset="0%" stopColor={gradientColors.inner} stopOpacity={0.50} />
```

No other lines change. External API, exports, and component behavior are identical.

### Edge Cases

| Case | Behavior |
|------|---------|
| `panelState === 'idle'` | `getAmbientColor` returns `null` → `AmbientBackground` renders empty `pointerEvents="none"` View — no visual, no crash |
| Loading state (`data === null`) | `panelState` falls back to `computePanelState(0, weeklyLimit, daysElapsed)` — likely `'idle'` — ambient is null, no issue |
| `devOvertimePreview` config flag | `panelState` overridden to `'overtime'` → ambient becomes `colors.overtimeWhiteGold` — working as designed |
| Scroll performance | `AmbientBackground` is outside `ScrollView` with `pointerEvents="none"` — zero interaction overhead |

### Test Strategy

Tests use **source-file static analysis** (not rendered className inspection) per the pattern already established in `index.test.tsx`. NativeWind v4 hashes className at runtime — assertions on className values in rendered trees are unreliable.

**New assertions in `index.test.tsx`:**
- `source.toContain('AmbientBackground')` — import present
- `source.toContain('getAmbientColor')` — function imported
- Source pattern: `AmbientBackground` appears before `ScrollView` in JSX
- `getAmbientColor` called with `{ type: 'panelState'` and `panelState`

**Updated/new assertion in `PanelGradient.test.tsx`:**
- `stopOpacity={0.50}` present in source

**Existing test preservation:**
- All existing `PanelGradient` runtime render tests pass (no API change)
- All existing `index.test.tsx` tests pass (absolutely-positioned element doesn't affect existing testIDs)
