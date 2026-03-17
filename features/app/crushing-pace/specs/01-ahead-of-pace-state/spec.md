# 01-ahead-of-pace-state

**Status:** Draft
**Created:** 2026-03-17
**Last Updated:** 2026-03-17
**Owner:** @trilogy

---

## Overview

### What Is Being Built

A new `PanelState` value — `"aheadOfPace"` — that fires when a user is logging hours significantly faster than their weekly target requires. When `pacingRatio ≥ 1.5` (150% of the hours expected at the current point in the week), the This Week panel badge displays **"CRUSHING IT"** in gold instead of the generic "ON TRACK".

### Why It Exists

The existing pacing states reward completion (`crushedIt` at exactly 40h, `overtime` beyond 40h) but provide no positive signal mid-week. A user who logs 13h on Monday morning has already done 163% of their expected Monday pace — the current "ON TRACK" label undersells that achievement. The `aheadOfPace` state closes this gap.

### How It Works

`computePanelState(hoursWorked, weeklyLimit, daysElapsed)` already computes `pacingRatio = hoursWorked / ((daysElapsed / 5) * weeklyLimit)`. A single new guard is inserted in the priority chain — after the `crushedIt` / `overtime` guards that check absolute goal completion, and before the `onTrack` guard:

```
if (pacingRatio >= PACING_CRUSHING_THRESHOLD) return 'aheadOfPace';  // 1.5
if (pacingRatio >= PACING_ON_TRACK_THRESHOLD) return 'onTrack';       // 0.85
```

The new state propagates through all downstream maps — labels, colors, gradients, ambient background — all using `colors.gold` for visual cohesion with `crushedIt`.

### Scope Summary

- 2 logic files: type union expanded, constant added, priority chain updated
- 1 screen file: 3 `Record<PanelState, T>` maps each gain one entry
- 2 component files: `PanelGradient` (2 maps + switch), `AmbientBackground` (1 map) each gain one entry
- 3 test files: new test cases added, existing assertions updated
- No new color tokens; no new components; no new screens

---

## Out of Scope

1. **Animations specific to `aheadOfPace`** — **Descoped.** The state uses static gold styling identical to `crushedIt`. Motion design is a separate concern not requested for this feature.

2. **Changing `crushedIt` or `overtime` behavior** — **Descoped.** Those states are complete-goal states and their thresholds, labels, and colors remain unchanged.

3. **New color tokens** — **Descoped.** `colors.gold` (#E8C97A) already exists and is reused throughout. No new tokens are required.

4. **AI tab, Overview tab, or Approvals tab changes** — **Descoped.** The `PanelState` type is only consumed by the This Week (index) tab, `PanelGradient`, and `AmbientBackground`. Other tabs are unaffected.

5. **Visual redesign of the panel** — **Descoped.** Layout, sizing, and animation of the panel are unchanged. Only the state label, color, gradient, and ambient color differ for the new state.

6. **Badge interaction or deep-link** — **Descoped.** The badge is a display-only component; no tap handler or navigation is added.

---

## Functional Requirements

### FR1: `computePanelState` returns `'aheadOfPace'` at ≥150% pace

**Description:** Extend `computePanelState` to detect when a user is pacing at 150%+ of expected hours for the current weekday position, and return the new `'aheadOfPace'` state.

**Changes:**
- Export `PACING_CRUSHING_THRESHOLD = 1.5` constant from `panelState.ts`
- Insert guard `if (pacingRatio >= PACING_CRUSHING_THRESHOLD) return 'aheadOfPace'` after the `expectedHours === 0` guard and before the `onTrack` guard
- Expand `PanelState` union in `reanimated-presets.ts` to include `"aheadOfPace"`

**Success Criteria:**
- `computePanelState(12, 40, 1.0)` returns `'aheadOfPace'` (Mon EOD: 12h / 8h expected = 150%)
- `computePanelState(24, 40, 2.0)` returns `'aheadOfPace'` (Tue EOD: 24h / 16h expected = 150%)
- `computePanelState(20, 40, 1.667)` returns `'aheadOfPace'` (ratio exactly 1.5)
- `pacingRatio = 1.5` exactly returns `'aheadOfPace'`
- `pacingRatio = 1.499` returns `'onTrack'` (just below threshold — no state change)
- `pacingRatio = 2.0` returns `'aheadOfPace'` (well above threshold)
- `computePanelState(45, 40, 1.0)` returns `'overtime'` (overtime guard fires first)
- `computePanelState(40, 40, 1.0)` returns `'crushedIt'` (crushedIt guard fires first)
- `computePanelState(0, 40, 0.5)` returns `'idle'` (days < 1 + no hours guard fires)
- `PACING_CRUSHING_THRESHOLD` is exported from `panelState.ts` and equals `1.5`
- All existing `onTrack`, `behind`, `critical`, `crushedIt`, `idle`, `overtime` test cases continue to pass

---

### FR2: All state maps include `'aheadOfPace'`

**Description:** Every `Record<PanelState, T>` map in the codebase must gain an `'aheadOfPace'` entry. TypeScript will enforce this exhaustively once the type union is expanded. All new entries use gold colors for visual cohesion with `crushedIt`.

**Changes in `app/(tabs)/index.tsx`:**
- `STATE_LABELS['aheadOfPace'] = 'CRUSHING IT'`
- `STATE_COLORS['aheadOfPace'] = 'text-gold'`
- `TODAY_BAR_COLORS['aheadOfPace'] = colors.gold`

**Changes in `src/components/PanelGradient.tsx`:**
- `PANEL_GRADIENT_COLORS['aheadOfPace'] = { inner: '#E8C97A', outer: 'transparent' }`
- `PANEL_GRADIENTS['aheadOfPace'] = { colors: ['#E8C97A59', 'transparent'], ... }` (same alpha as `crushedIt`)
- `getGlowStyle` switch: `'aheadOfPace'` → `{ shadowColor: '#E8C97A', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 4 } }`

**Changes in `src/components/AmbientBackground.tsx`:**
- `AMBIENT_COLORS.panelState['aheadOfPace'] = colors.gold`

**Success Criteria:**
- `STATE_LABELS['aheadOfPace'] === 'CRUSHING IT'`
- `STATE_COLORS['aheadOfPace'] === 'text-gold'`
- `TODAY_BAR_COLORS['aheadOfPace'] === colors.gold`
- `PANEL_GRADIENT_COLORS['aheadOfPace']` is non-null with `inner` and `outer` properties
- `PANEL_GRADIENTS['aheadOfPace'].colors` is an array of length 2
- `getGlowStyle('aheadOfPace')` returns an object with `shadowColor === '#E8C97A'`
- `PanelGradient` renders without error when `state="aheadOfPace"`
- `AMBIENT_COLORS.panelState['aheadOfPace']` is non-null (equals `colors.gold`)
- `getAmbientColor({ type: 'panelState', state: 'aheadOfPace' })` returns a non-null string
- `Object.keys(AMBIENT_COLORS.panelState).length === 7` (was 6)
- `Object.keys(AMBIENT_COLORS.panelState)` contains `'aheadOfPace'`
- No TypeScript errors in any modified file (`tsc --noEmit` passes)

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/lib/reanimated-presets.ts` (line 170) | `PanelState` union type definition |
| `hourglassws/src/lib/panelState.ts` | `computePanelState`, `PACING_ON_TRACK_THRESHOLD`, `PACING_BEHIND_THRESHOLD` |
| `hourglassws/src/lib/__tests__/panelState.test.ts` | Existing test structure to extend |
| `hourglassws/app/(tabs)/index.tsx` (lines 52–79) | `STATE_LABELS`, `STATE_COLORS`, `TODAY_BAR_COLORS` maps |
| `hourglassws/src/components/PanelGradient.tsx` (lines 42–108) | `PANEL_GRADIENT_COLORS`, `PANEL_GRADIENTS`, `getGlowStyle` |
| `hourglassws/src/components/AmbientBackground.tsx` (lines 38–58) | `AMBIENT_COLORS.panelState` |
| `hourglassws/src/components/__tests__/PanelGradient.test.tsx` (lines 65, 234) | `allStates` arrays |
| `hourglassws/src/components/__tests__/AmbientBackground.test.tsx` (lines 148–249) | state loop tests, length assertion |

### Files to Modify

**1. `hourglassws/src/lib/reanimated-presets.ts`**

Line 170 — expand union:
```typescript
// Before:
export type PanelState = "onTrack" | "behind" | "critical" | "crushedIt" | "idle" | "overtime";

// After:
export type PanelState = "onTrack" | "behind" | "critical" | "crushedIt" | "idle" | "overtime" | "aheadOfPace";
```

**2. `hourglassws/src/lib/panelState.ts`**

After `PACING_BEHIND_THRESHOLD`, add:
```typescript
/** Fraction of expected pace considered "crushing it" (≥150% of pace). */
export const PACING_CRUSHING_THRESHOLD = 1.5;
```

Update JSDoc comment on `computePanelState` (panel states count 6 → 7).

Insert guard after `if (expectedHours === 0) return 'onTrack'` and before the `onTrack` guard:
```typescript
const pacingRatio = hours / expectedHours;

if (pacingRatio >= PACING_CRUSHING_THRESHOLD) return 'aheadOfPace';   // ← NEW
if (pacingRatio >= PACING_ON_TRACK_THRESHOLD) return 'onTrack';
if (pacingRatio >= PACING_BEHIND_THRESHOLD) return 'behind';
return 'critical';
```

**3. `hourglassws/app/(tabs)/index.tsx`**

Three `Record<PanelState, T>` maps each gain one entry:
```typescript
STATE_LABELS:      aheadOfPace: 'CRUSHING IT'
STATE_COLORS:      aheadOfPace: 'text-gold'
TODAY_BAR_COLORS:  aheadOfPace: colors.gold
```

**4. `hourglassws/src/components/PanelGradient.tsx`**

`PANEL_GRADIENT_COLORS` (after `crushedIt`):
```typescript
aheadOfPace: { inner: '#E8C97A', outer: 'transparent' },
```

`PANEL_GRADIENTS` (after `crushedIt`):
```typescript
aheadOfPace: { colors: ['#E8C97A59', 'transparent'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
```

`getGlowStyle` switch (add before `default`):
```typescript
case 'aheadOfPace':
  return { shadowColor: '#E8C97A', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset };
```

Note: `shadowOffset` is declared as `{ width: 0, height: 4 }` at the top of the iOS branch. The `aheadOfPace` case reuses the same offset as `crushedIt` and `overtime`.

**5. `hourglassws/src/components/AmbientBackground.tsx`**

`AMBIENT_COLORS.panelState` (after `crushedIt`):
```typescript
aheadOfPace: colors.gold,  // #E8C97A — gold, same family as crushedIt
```

### Files to Modify (Tests)

**6. `hourglassws/src/lib/__tests__/panelState.test.ts`**

Add a describe block for `aheadOfPace` containing all FR1 success criteria cases. Verify `PACING_CRUSHING_THRESHOLD` is exported and equals 1.5.

**7. `hourglassws/src/components/__tests__/PanelGradient.test.tsx`**

Two `allStates` arrays (lines 65 and 234) each need `'aheadOfPace'` appended. Add a specific test asserting glow style properties for `aheadOfPace`.

**8. `hourglassws/src/components/__tests__/AmbientBackground.test.tsx`**

Add `'aheadOfPace'` to the state loop (lines 148–249). Update the `Object.keys(AMBIENT_COLORS.panelState).length` assertion from `6` to `7`.

### Data Flow

```
computePanelState(hoursWorked, weeklyLimit, daysElapsed)
         │
         │  pacingRatio = hours / expectedHours
         │  pacingRatio ≥ 1.5 → returns 'aheadOfPace'
         ▼
    PanelState (now 7 values)
         │
         ├──▶ STATE_LABELS['aheadOfPace']     → 'CRUSHING IT'  (badge text)
         ├──▶ STATE_COLORS['aheadOfPace']     → 'text-gold'    (NativeWind class)
         ├──▶ TODAY_BAR_COLORS['aheadOfPace'] → colors.gold    (WeeklyBarChart)
         ├──▶ PANEL_GRADIENT_COLORS           → gold inner/outer
         ├──▶ PANEL_GRADIENTS                 → '#E8C97A59' colors array
         ├──▶ getGlowStyle                    → gold shadow
         └──▶ AMBIENT_COLORS.panelState       → colors.gold    (AmbientBackground)
```

### Edge Cases

**Exact threshold boundary:** `pacingRatio = 1.5` exactly triggers `aheadOfPace`. The guard uses `>=`.

**`expectedHours === 0` guard fires first:** If `daysElapsed = 0` with hours logged, `expectedHours` is 0 and we return `onTrack` before computing `pacingRatio`. This prevents division-by-zero and means `aheadOfPace` is unreachable in that narrow edge case — which is the existing intended behavior.

**`crushedIt` / `overtime` precedence:** The new guard is placed after the absolute-completion guards. A user who has hit the weekly limit will see `crushedIt` or `overtime` regardless of pacing ratio.

**TypeScript exhaustiveness:** All `Record<PanelState, T>` maps will produce a TypeScript error at the point of the map declaration if `aheadOfPace` is missing. Add `aheadOfPace` to the type first; the compiler will surface any missed maps.

**`getGlowStyle` switch:** The existing `default: return {}` covers the idle case and any future states. The new `aheadOfPace` case is inserted before `default` so it is handled explicitly.
