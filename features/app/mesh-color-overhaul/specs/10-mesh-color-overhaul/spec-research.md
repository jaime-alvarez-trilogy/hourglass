# Spec Research: 10-mesh-color-overhaul

## Problem Context

Four visual quality fixes identified from device testing:
1. Mesh RadialGradient radius `w * 0.7` terminates within the viewport — creates localized blobs, not ambient wash.
2. `PANEL_STATE_COLORS` uses saturated semantic tokens that vibrate on dark surfaces; idle state is invisible.
3. `AIArcHero` SweepGradient is static (`['#00C2FF', '#A78BFA', '#FF00FF']`), ignores actual AI performance tier.
4. `TrendSparkline` `domainPadding` is `{ left: 0, right: 10 }` — left edge glow clips.

---

## Exploration Findings

### FR1 — Mesh Radius Expansion

**File:** `src/components/AnimatedMeshBackground.tsx`

**Current state (line 172):**
```ts
const nodeRadius = w * 0.7;
```
All 3 nodes share this radius. The gradient goes from colored at center to transparent at `w * 0.7`. On a 390pt iPhone screen, this is ~273pt — still well within the viewport height, so gradient edges are visible inside the screen.

**Fix:** Increase to `w * 1.2`. At 390pt wide, radius = 468pt. All gradient falloffs will extend beyond the screen edges in every direction. Screen blend of overlapping transparent tails creates soft ambient color rather than hard blob edges.

```ts
const nodeRadius = w * 1.2;
```

**Note:** Node orbital radii (the movement paths) are NOT changing — only the visual gradient radius. Nodes still orbit within `±w*0.30` / `±h*0.20` of center.

---

### FR2 — State Color Palette

**File:** `src/components/AnimatedMeshBackground.tsx`

**Current `PANEL_STATE_COLORS` (lines 40–48):**
```ts
{
  onTrack:     colors.success,           // #10B981
  behind:      colors.warning,           // #F59E0B
  critical:    colors.critical,          // #F43F5E
  crushedIt:   colors.gold,              // #E8C97A
  aheadOfPace: colors.gold,              // #E8C97A
  overtime:    colors.overtimeWhiteGold, // #FFF8E7
  idle:        null,                     // invisible — background bleeds through
}
```

**Target palette (dark-mode-safe, desaturated):**
```ts
{
  idle:        '#556B8E',  // Dusty Blue — visible ambient for week-start
  critical:    '#F87171',  // Desaturated Coral
  behind:      '#FCD34D',  // Warning Amber (softer than #F59E0B)
  onTrack:     '#4ADE80',  // Success Green (softer than #10B981)
  aheadOfPace: '#4ADE80',  // same as onTrack
  crushedIt:   '#C89F5D',  // Champagne Gold
  overtime:    '#CEA435',  // Luxurious Gold
}
```

**Color opacity:** Node C inner stop uses `hexToRgba(hex, 0.22)`. This stays at 0.22 — the new desaturated hues will be subtler by nature, so no opacity change needed.

**New color tokens to add to `src/lib/colors.ts`:**
```ts
dustyBlue:      '#556B8E',  // Idle mesh ambient
desatCoral:     '#F87171',  // Critical mesh state
warnAmber:      '#FCD34D',  // Behind-pace mesh state
successGreen:   '#4ADE80',  // On-track mesh state
champagneGold:  '#C89F5D',  // Crushed-it mesh state
luxuryGold:     '#CEA435',  // Overtime mesh state
infoBlue:       '#60A5FA',  // AI Leader tier
```

**idle handling change:** `PANEL_STATE_COLORS.idle` changes from `null` to `'#556B8E'`. The fallback in `resolveNodeCColor` is `colors.background` — idle now returns `#556B8E` before reaching that fallback. No logic change needed in `resolveNodeCColor` itself.

---

### FR3 — Extract AI Tier Utility

**Current state:** `classifyAIPct` is defined locally in `app/(tabs)/ai.tsx` (line 50):
```ts
function classifyAIPct(avg: number): AITier {
  if (avg >= 75) return { label: 'AI Leader',           color: colors.cyan };    // #00C2FF
  if (avg >= 50) return { label: 'Consistent Progress', color: colors.success }; // #10B981
  if (avg >= 30) return { label: 'Building Momentum',   color: colors.warning }; // #F59E0B
  return             { label: 'Getting Started',        color: colors.textMuted }; // #A0A0A0
}
```

**Problem:** `AIArcHero` needs tier color but can't import from a screen file. `classifyAIPct` must live in a shared lib.

**Target file:** `src/lib/aiTier.ts` (new)

**Updated colors:**
```ts
export interface AITier {
  label: string;
  color: string;
}

export function classifyAIPct(avg: number): AITier {
  if (avg >= 75) return { label: 'AI Leader',           color: colors.infoBlue };      // #60A5FA
  if (avg >= 50) return { label: 'Consistent Progress', color: colors.successGreen };  // #4ADE80
  if (avg >= 30) return { label: 'Building Momentum',   color: colors.warnAmber };     // #FCD34D
  return             { label: 'Getting Started',        color: colors.textMuted };      // #A0A0A0
}
```

**ai.tsx change:** Remove local `classifyAIPct` + `AITier`, import from `@/src/lib/aiTier`.

**Note:** The TrendSparkline in ai.tsx already receives `color={tier.color}` (line 294). Once `classifyAIPct` returns the new tokens, the sparkline glow color updates automatically — no further change to ai.tsx or TrendSparkline needed.

---

### FR4 — AIArcHero Tier-Aware Arc Color

**File:** `src/components/AIArcHero.tsx`

**Current state (lines 52, 178–183):**
```ts
const GRADIENT_COLORS = ['#00C2FF', '#A78BFA', '#FF00FF'] as const;
// ...
<SweepGradient
  c={{ x: cx, y: cy }}
  colors={[...GRADIENT_COLORS]}
  start={START_ANGLE}
  end={START_ANGLE + SWEEP}
/>
```
The gradient maps cyan → violet → magenta across the full 270° sweep regardless of `aiPct`.

**Fix approach:**
1. Import `classifyAIPct` from `@/src/lib/aiTier`
2. Derive `tierColor` from `aiPct` at render time:
   ```ts
   const tierColor = classifyAIPct(aiPct).color;
   ```
3. Replace static gradient with a two-stop single-color gradient:
   ```tsx
   <SweepGradient
     c={{ x: cx, y: cy }}
     colors={[tierColor, tierColor]}
     start={START_ANGLE}
     end={START_ANGLE + SWEEP}
   />
   ```
   Using `[tierColor, tierColor]` renders a solid-color arc — the tier color fills the entire stroke.

**Why not solid `color` paint?**
`<Path color="white">` is needed to keep paint alpha = 1 so the `<SweepGradient>` shader renders correctly. Setting `color={tierColor}` directly on `<Path>` would work for solid color but loses the ability to later add a two-tone gradient if needed. The `[tierColor, tierColor]` approach keeps the architecture extensible.

**Track arc**: Track arc (`color="rgba(255,255,255,0.08)"`) is unchanged — remains neutral.

**GRADIENT_COLORS constant:** Remove (no longer used). The constant was the only reference point for the three static colors.

---

### FR5 — TrendSparkline Left domainPadding

**File:** `src/components/TrendSparkline.tsx`

**Current state (line 238):**
```ts
domainPadding={{ left: 0, right: 10 }}
```

**Fix:**
```ts
domainPadding={{ left: 10, right: 10 }}
```

The first data point's `BlurMask blur={8}` glow currently clips at the left canvas edge (0 padding). Adding `left: 10` gives the same headroom as the right side.

**Note:** Top/bottom glow headroom is handled separately via `padTop`/`padBottom` in the domain calculation (lines 189–192), not via `domainPadding`. VNX's `domainPadding` applies additional inset to the data domain on top of the domain range — adding top/bottom there would double-pad and compress bars too much.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mesh radius | `w * 1.2` | Puts gradient falloffs 20% beyond both screen edges; nodes still overlap near center for Screen blends |
| Node A/B colors | Keep violet + cyan | Changing constant nodes risks breaking the Screen-blend auroral intersection effect; only Node C changes |
| idle color | `#556B8E` (single node) | Simpler than splitting across Nodes A+B; Dusty Blue reads as "calm, early week" |
| Multi-color states (crushedIt, overtime) | Single accent on Node C | Screen blend with constant Node A (violet) and Node B (cyan) already creates complex hue mixing; second accent unnecessary |
| classifyAIPct location | `src/lib/aiTier.ts` | Can't import screen files from components; shared lib is the correct layer |
| Arc gradient approach | `[tierColor, tierColor]` | Solid-color arc via 2-stop identical gradient; consistent with existing SweepGradient architecture; extensible |
| New color tokens | Add to `colors.ts` | Central token registry prevents magic hex strings scattered across files |

---

## Interface Contracts

### `src/lib/aiTier.ts` (new)
```ts
export interface AITier {
  label: string;
  color: string;
}

/**
 * Classifies an AI usage percentage into a performance tier.
 * Returns tier label and the associated UI accent color.
 *
 * @param avg - rolling average AI% (0–100)
 */
export function classifyAIPct(avg: number): AITier
// Sources: avg ← aiPct prop (from useAIData hook, API: work diary slots)
```

### `src/lib/colors.ts` (extended)
```ts
// New tokens added:
dustyBlue:     '#556B8E'  // ← new constant
desatCoral:    '#F87171'  // ← new constant
warnAmber:     '#FCD34D'  // ← new constant
successGreen:  '#4ADE80'  // ← new constant
champagneGold: '#C89F5D'  // ← new constant
luxuryGold:    '#CEA435'  // ← new constant
infoBlue:      '#60A5FA'  // ← new constant
```

### `AnimatedMeshBackground.tsx` (modified)
```ts
// nodeRadius: w * 0.7 → w * 1.2
// PANEL_STATE_COLORS: 7 entries updated (see FR2 table above)
// idle entry changes from null → '#556B8E'
// External prop API UNCHANGED: { panelState?, earningsPace?, aiPct? }
```

### `AIArcHero.tsx` (modified)
```ts
// GRADIENT_COLORS constant removed
// tierColor = classifyAIPct(aiPct).color derived at render time
// SweepGradient colors: static 3-stop → [tierColor, tierColor]
// External prop API UNCHANGED: { aiPct, brainliftHours, deltaPercent, ambientColor, size? }
```

### `TrendSparkline.tsx` (modified)
```ts
// domainPadding: { left: 0, right: 10 } → { left: 10, right: 10 }
// External prop API UNCHANGED
```

---

## Test Plan

### FR1 — Mesh Radius
- [ ] `nodeRadius` value is `w * 1.2` (not `w * 0.7`)
- [ ] `hexToRgba` still produces valid rgba string (unchanged function)

### FR2 — State Color Palette
**Contracts:** `resolveNodeCColor(panelState, ...)` returns new hex values.

- [ ] `resolveNodeCColor('idle')` → `'#556B8E'` (was null/background)
- [ ] `resolveNodeCColor('critical')` → `'#F87171'`
- [ ] `resolveNodeCColor('behind')` → `'#FCD34D'`
- [ ] `resolveNodeCColor('onTrack')` → `'#4ADE80'`
- [ ] `resolveNodeCColor('aheadOfPace')` → `'#4ADE80'`
- [ ] `resolveNodeCColor('crushedIt')` → `'#C89F5D'`
- [ ] `resolveNodeCColor('overtime')` → `'#CEA435'`
- [ ] `resolveNodeCColor(null, null, null)` → `colors.background` (idle fallback unchanged)

### FR3 — AI Tier Utility
**Contracts:** `classifyAIPct(avg)` returns correct label + color.

- [ ] `classifyAIPct(75)` → `{ label: 'AI Leader', color: '#60A5FA' }`
- [ ] `classifyAIPct(74)` → `{ label: 'Consistent Progress', color: '#4ADE80' }`
- [ ] `classifyAIPct(50)` → `{ label: 'Consistent Progress', color: '#4ADE80' }`
- [ ] `classifyAIPct(49)` → `{ label: 'Building Momentum', color: '#FCD34D' }`
- [ ] `classifyAIPct(30)` → `{ label: 'Building Momentum', color: '#FCD34D' }`
- [ ] `classifyAIPct(29)` → `{ label: 'Getting Started', color: '#A0A0A0' }`
- [ ] `classifyAIPct(0)` → `{ label: 'Getting Started', color: '#A0A0A0' }`

### FR4 — AIArcHero Tier Color
- [ ] `GRADIENT_COLORS` constant removed from AIArcHero
- [ ] `classifyAIPct` imported from `@/src/lib/aiTier`
- [ ] `SweepGradient colors` prop is `[tierColor, tierColor]` (two identical stops)
- [ ] When `aiPct=80`, arc renders with `colors=['#60A5FA', '#60A5FA']`
- [ ] When `aiPct=20`, arc renders with `colors=['#A0A0A0', '#A0A0A0']`

### FR5 — TrendSparkline domainPadding
- [ ] `domainPadding` is `{ left: 10, right: 10 }` (not `{ left: 0, right: 10 }`)

---

## Files to Reference

- `src/components/AnimatedMeshBackground.tsx` — FR1 + FR2 (nodeRadius, PANEL_STATE_COLORS)
- `src/lib/colors.ts` — FR2 new tokens
- `src/lib/aiTier.ts` — FR3 (new file)
- `app/(tabs)/ai.tsx` — FR3 migration (remove local classifyAIPct, import from aiTier)
- `src/components/AIArcHero.tsx` — FR4 (tier-aware SweepGradient)
- `src/components/TrendSparkline.tsx` — FR5 (domainPadding)
- `src/components/__tests__/AnimatedMeshBackground.test.tsx` — existing tests to extend
