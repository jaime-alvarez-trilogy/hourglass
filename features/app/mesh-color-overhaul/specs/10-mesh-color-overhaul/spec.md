# 10-mesh-color-overhaul

**Status:** Draft
**Created:** 2026-03-23
**Last Updated:** 2026-03-23
**Owner:** @trilogy

---

## Overview

**What is being built:**

Four targeted visual quality fixes to the mesh background system, AI arc hero, and trend sparkline components in the Hourglass app. All fixes are surgical — no architectural changes, no data layer changes, no API changes.

**The four fixes:**

1. **FR1 — Mesh Radius Expansion**: The `AnimatedMeshBackground` `RadialGradient` nodes currently use `w * 0.7` as radius, causing gradient falloffs to terminate visibly inside the viewport and produce isolated light blobs. The radius increases to `w * 1.2` so all gradient tails extend beyond every screen edge, producing a seamless atmospheric color wash through Screen blending.

2. **FR2 — State Color Palette**: `PANEL_STATE_COLORS` currently maps to fully-saturated semantic tokens (`#10B981`, `#F59E0B`, etc.) that vibrate visually on dark surfaces. The idle state is `null` (invisible). Replaced with a curated set of desaturated, dark-mode-safe hex values, including a visible Dusty Blue for idle. New color tokens are added to `src/lib/colors.ts` as the single source of truth.

3. **FR3 — Extract AI Tier Utility**: `classifyAIPct` currently lives in `app/(tabs)/ai.tsx` and cannot be imported by components. It is extracted into a new shared library `src/lib/aiTier.ts`. The `ai.tsx` screen imports from the new location. Updated color references use the new desaturated tokens from FR2.

4. **FR4 — AIArcHero Tier-Aware Arc Color**: `AIArcHero` currently uses a static 3-stop `SweepGradient` (`cyan → violet → magenta`) regardless of AI performance. The static constant is removed; the arc now derives its color from `classifyAIPct(aiPct).color` via a two-stop identical-stop gradient (`[tierColor, tierColor]`), rendering a solid tier-matched arc.

5. **FR5 — TrendSparkline Left domainPadding**: `domainPadding={{ left: 0, right: 10 }}` clips the glow of the first data point at the left canvas edge. Changed to `{ left: 10, right: 10 }` for symmetric headroom.

**How it works together:**

FRs 1 and 2 improve the mesh background across all tabs. FR3 creates the shared utility needed by FR4. FR4 uses FR3's `classifyAIPct` to drive the arc color. FR5 is fully independent. The external prop APIs of all modified components remain unchanged.

---

## Out of Scope

1. **Changing the base canvas background color (`#0D0C14`)**
   — **Descoped:** The dark canvas background is established design system canon from the hero-glass-system feature. Not part of this overhaul.

2. **Modifying Node A (violet) or Node B (cyan) constant colors**
   — **Descoped:** These two constant nodes form the base Screen-blend auroral intersection. Changing them would break the established mesh aesthetic. Only Node C's dynamic color is updated.

3. **Any data layer or API changes**
   — **Descoped:** All changes are purely visual/presentational. No hooks, queries, or API contracts are modified.

4. **Adding animation to the tier arc color transition**
   — **Descoped:** The arc color is derived at render time from the current `aiPct` prop. Animated transitions between tiers are a separate enhancement not part of this spec.

5. **Changing TrendSparkline top/bottom domain padding**
   — **Descoped:** Top/bottom glow headroom is handled by `padTop`/`padBottom` in the domain calculation (lines 189–192 of TrendSparkline.tsx). Adding `domainPadding` top/bottom would double-pad and compress the chart. Only horizontal padding is in scope.

6. **Updating WeeklyBarChart or other chart components**
   — **Descoped:** These were addressed in `09-chart-visual-fixes`. Only TrendSparkline's left padding is touched here.

---

## Functional Requirements

### FR1 — Mesh Radius Expansion

**Summary:** Increase `AnimatedMeshBackground` RadialGradient node radius from `w * 0.7` to `w * 1.2`.

**Success Criteria:**
- `nodeRadius` constant (or equivalent) evaluates to `w * 1.2`
- At 390pt screen width: radius = 468pt (extends ~39pt beyond each side of a 390pt viewport)
- Node orbital movement paths (`±w*0.30`, `±h*0.20`) are NOT changed
- `hexToRgba` call at inner stop uses unchanged opacity (0.22 for Node C, existing values for A/B)
- All three nodes (A, B, C) use the same expanded radius

---

### FR2 — State Color Palette

**Summary:** Replace saturated `PANEL_STATE_COLORS` entries with desaturated dark-mode-safe values. Add new color tokens to `src/lib/colors.ts`. Make idle visible.

**New color tokens (added to `src/lib/colors.ts`):**
```
dustyBlue:      '#556B8E'
desatCoral:     '#F87171'
warnAmber:      '#FCD34D'
successGreen:   '#4ADE80'
champagneGold:  '#C89F5D'
luxuryGold:     '#CEA435'
infoBlue:       '#60A5FA'
```

**Updated `PANEL_STATE_COLORS` mapping:**
```
idle:        '#556B8E'  (was: null)
critical:    '#F87171'  (was: colors.critical / #F43F5E)
behind:      '#FCD34D'  (was: colors.warning / #F59E0B)
onTrack:     '#4ADE80'  (was: colors.success / #10B981)
aheadOfPace: '#4ADE80'  (was: colors.gold / #E8C97A)
crushedIt:   '#C89F5D'  (was: colors.gold / #E8C97A)
overtime:    '#CEA435'  (was: colors.overtimeWhiteGold / #FFF8E7)
```

**Success Criteria:**
- `colors.ts` exports all 7 new tokens at the specified hex values
- `PANEL_STATE_COLORS.idle` is `'#556B8E'` (not `null`)
- `resolveNodeCColor('idle', ...)` returns `'#556B8E'`
- `resolveNodeCColor('critical', ...)` returns `'#F87171'`
- `resolveNodeCColor('behind', ...)` returns `'#FCD34D'`
- `resolveNodeCColor('onTrack', ...)` returns `'#4ADE80'`
- `resolveNodeCColor('aheadOfPace', ...)` returns `'#4ADE80'`
- `resolveNodeCColor('crushedIt', ...)` returns `'#C89F5D'`
- `resolveNodeCColor('overtime', ...)` returns `'#CEA435'`
- `resolveNodeCColor(null, null, null)` returns `colors.background` (the null/unknown fallback path is unchanged)
- Node C inner stop opacity remains 0.22

---

### FR3 — Extract AI Tier Utility

**Summary:** Move `classifyAIPct` and `AITier` interface from `app/(tabs)/ai.tsx` into a new shared library `src/lib/aiTier.ts`. Update `ai.tsx` to import from the new location.

**New file `src/lib/aiTier.ts`:**
```ts
export interface AITier {
  label: string;
  color: string;
}

export function classifyAIPct(avg: number): AITier
```

**Tier thresholds and return values:**

| avg | label | color |
|-----|-------|-------|
| >= 75 | 'AI Leader' | '#60A5FA' (colors.infoBlue) |
| >= 50 | 'Consistent Progress' | '#4ADE80' (colors.successGreen) |
| >= 30 | 'Building Momentum' | '#FCD34D' (colors.warnAmber) |
| < 30 | 'Getting Started' | '#A0A0A0' (colors.textMuted) |

**Success Criteria:**
- `src/lib/aiTier.ts` exists and exports `AITier` and `classifyAIPct`
- `classifyAIPct(75)` → `{ label: 'AI Leader', color: '#60A5FA' }`
- `classifyAIPct(74)` → `{ label: 'Consistent Progress', color: '#4ADE80' }`
- `classifyAIPct(50)` → `{ label: 'Consistent Progress', color: '#4ADE80' }`
- `classifyAIPct(49)` → `{ label: 'Building Momentum', color: '#FCD34D' }`
- `classifyAIPct(30)` → `{ label: 'Building Momentum', color: '#FCD34D' }`
- `classifyAIPct(29)` → `{ label: 'Getting Started', color: '#A0A0A0' }`
- `classifyAIPct(0)` → `{ label: 'Getting Started', color: '#A0A0A0' }`
- `app/(tabs)/ai.tsx` no longer defines local `classifyAIPct` or `AITier`
- `app/(tabs)/ai.tsx` imports `classifyAIPct` (and optionally `AITier`) from `@/src/lib/aiTier`
- TypeScript compilation succeeds (no type errors in ai.tsx after migration)

---

### FR4 — AIArcHero Tier-Aware Arc Color

**Summary:** Replace the static `GRADIENT_COLORS` constant in `AIArcHero.tsx` with a tier-derived color from `classifyAIPct`. The `SweepGradient` uses `[tierColor, tierColor]` for a solid-color arc that matches the actual AI performance tier.

**Success Criteria:**
- `GRADIENT_COLORS` constant is removed from `AIArcHero.tsx`
- `classifyAIPct` is imported from `@/src/lib/aiTier`
- `tierColor` is derived as `classifyAIPct(aiPct).color` at render time
- `SweepGradient colors` prop is `[tierColor, tierColor]`
- When `aiPct=80`: `SweepGradient colors` renders as `['#60A5FA', '#60A5FA']`
- When `aiPct=55`: `SweepGradient colors` renders as `['#4ADE80', '#4ADE80']`
- When `aiPct=35`: `SweepGradient colors` renders as `['#FCD34D', '#FCD34D']`
- When `aiPct=20`: `SweepGradient colors` renders as `['#A0A0A0', '#A0A0A0']`
- Track arc (`color="rgba(255,255,255,0.08)"`) is unchanged
- External prop API unchanged: `{ aiPct, brainliftHours, deltaPercent, ambientColor, size? }`

---

### FR5 — TrendSparkline Left domainPadding

**Summary:** Add `left: 10` to `domainPadding` in `TrendSparkline.tsx` so the first data point glow has symmetric headroom.

**Success Criteria:**
- `domainPadding` is `{ left: 10, right: 10 }` (was `{ left: 0, right: 10 }`)
- `padTop` and `padBottom` domain calculation is NOT modified
- External prop API unchanged

---

## Technical Design

### Files to Reference

- `hourglassws/src/components/AnimatedMeshBackground.tsx` — FR1 (nodeRadius) + FR2 (PANEL_STATE_COLORS, resolveNodeCColor)
- `hourglassws/src/lib/colors.ts` — FR2 (new token additions)
- `hourglassws/app/(tabs)/ai.tsx` — FR3 (remove local classifyAIPct, add import)
- `hourglassws/src/components/AIArcHero.tsx` — FR4 (remove GRADIENT_COLORS, add tierColor)
- `hourglassws/src/components/TrendSparkline.tsx` — FR5 (domainPadding)
- `hourglassws/src/components/__tests__/AnimatedMeshBackground.test.tsx` — existing tests to extend

### Files to Create

- `hourglassws/src/lib/aiTier.ts` — FR3 (new shared utility)
- `hourglassws/src/lib/__tests__/aiTier.test.ts` — FR3 tests (new)

### Files to Modify

| File | FR | Change |
|------|----|--------|
| `src/components/AnimatedMeshBackground.tsx` | FR1 | `nodeRadius`: `w * 0.7` → `w * 1.2` |
| `src/components/AnimatedMeshBackground.tsx` | FR2 | `PANEL_STATE_COLORS`: replace 7 entries; idle: null → '#556B8E' |
| `src/lib/colors.ts` | FR2 | Add 7 new tokens |
| `src/lib/aiTier.ts` | FR3 | Create new file with AITier + classifyAIPct |
| `app/(tabs)/ai.tsx` | FR3 | Remove local classifyAIPct/AITier; add import |
| `src/components/AIArcHero.tsx` | FR4 | Remove GRADIENT_COLORS; add tierColor derivation; update SweepGradient |
| `src/components/TrendSparkline.tsx` | FR5 | domainPadding left: 0 → 10 |

### FR Dependencies

| FR | Depends On | Wave |
|----|------------|------|
| FR1 | — | 1 |
| FR2 | — | 1 |
| FR5 | — | 1 |
| FR3 | FR2 (uses new color tokens) | 2 |
| FR4 | FR3 (imports classifyAIPct) | 3 |

### Data Flow

**FR1 + FR2 (mesh background):**
```
panelState prop → PANEL_STATE_COLORS lookup → resolveNodeCColor() → Node C inner stop hex
nodeRadius (constant) → RadialGradient r prop on all 3 nodes
```

**FR3 (aiTier utility):**
```
src/lib/aiTier.ts exports classifyAIPct
  ← imported by app/(tabs)/ai.tsx (screen)
  ← imported by src/components/AIArcHero.tsx (component)
```

**FR4 (arc color):**
```
aiPct prop → classifyAIPct(aiPct) → .color → tierColor
tierColor → SweepGradient colors={[tierColor, tierColor]}
```

**FR5 (sparkline padding):**
```
Static change: domainPadding.left 0 → 10
No data flow change
```

### Implementation Notes

**FR1 — nodeRadius:**
Change the single constant assignment. All three nodes share the same `nodeRadius` value. No other logic changes.

**FR2 — PANEL_STATE_COLORS:**
Replace the object literal entries. The `resolveNodeCColor` function logic does NOT change — it already performs a lookup into `PANEL_STATE_COLORS` and falls back to `colors.background` for null/unknown. Since idle is now `'#556B8E'` instead of `null`, it will naturally return the dusty blue color without any logic changes.

For `colors.ts`: append the 7 new tokens to the existing `colors` object. Maintain alphabetical or grouping conventions already in the file.

**FR3 — aiTier.ts:**
```ts
import { colors } from './colors';

export interface AITier {
  label: string;
  color: string;
}

export function classifyAIPct(avg: number): AITier {
  if (avg >= 75) return { label: 'AI Leader',           color: colors.infoBlue };
  if (avg >= 50) return { label: 'Consistent Progress', color: colors.successGreen };
  if (avg >= 30) return { label: 'Building Momentum',   color: colors.warnAmber };
  return             { label: 'Getting Started',        color: colors.textMuted };
}
```

In `ai.tsx`: remove the local `AITier` interface and `classifyAIPct` function; add `import { classifyAIPct, AITier } from '@/src/lib/aiTier'`. The rest of `ai.tsx` is unchanged.

**FR4 — AIArcHero:**
Remove the `GRADIENT_COLORS` const. Add: `const tierColor = classifyAIPct(aiPct).color;` inside the component render. Update `<SweepGradient colors={[tierColor, tierColor]} ...>`.

**FR5 — TrendSparkline:**
One-line change: `domainPadding={{ left: 0, right: 10 }}` → `domainPadding={{ left: 10, right: 10 }}`.

### Edge Cases

1. **`resolveNodeCColor(null, null, null)`** — With `idle` no longer `null` in `PANEL_STATE_COLORS`, the only way to reach the `colors.background` fallback is if `panelState` is `null`/`undefined` or not a key in the map. This behavior is preserved.

2. **`classifyAIPct(0)`** — The final `return` (no condition) handles 0 and any negative value gracefully, returning 'Getting Started'.

3. **`classifyAIPct` boundary values** — Thresholds are `>=75`, `>=50`, `>=30`. Values at exact boundaries fall into the higher tier. This matches the existing behavior in ai.tsx.

4. **Two-stop identical SweepGradient** — Using `[tierColor, tierColor]` is a valid Skia SweepGradient call. It produces a uniform color across the entire sweep angle range.

5. **TypeScript types** — `AITier` interface must be exported from `aiTier.ts` so `ai.tsx` can continue using it as a type annotation. Both named exports required.
