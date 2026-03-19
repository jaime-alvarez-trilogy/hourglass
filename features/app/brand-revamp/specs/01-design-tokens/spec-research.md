# Spec Research: 01-design-tokens

**Feature:** brand-revamp
**Spec:** 01-design-tokens
**Complexity:** S

---

## Problem Context

The Hourglass app uses Inter for all text roles, producing a generic appearance for a data-heavy technical dashboard. The brand guidelines v2.0 mandate a three-font system: Space Grotesk for hero metrics and headings (geometric, brutalist, tech-forward), Space Mono for data tables and timestamps (monospaced column alignment), and Inter for body copy and labels (high legibility neutral). Additionally, all text colors must be desaturated — pure white (#FFFFFF) on dark backgrounds triggers "halation" (visual bleed), reducing legibility and premium perception. Text colors must shift to #E0E0E0 / #A0A0A0 / #757575.

Both `@expo-google-fonts/space-grotesk` and `@expo-google-fonts/space-mono` are already installed in package.json but not loaded or used in the design system.

---

## Exploration Findings

### Current font loading (`app/_layout.tsx`)
```typescript
const [fontsLoaded] = useFonts({
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
});
```

### Current tailwind font tokens (`tailwind.config.js`)
```javascript
fontFamily: {
  'display': ['Inter_700Bold'],
  'display-bold': ['Inter_700Bold'],
  'display-extrabold': ['Inter_800ExtraBold'],
  'display-medium': ['Inter_500Medium'],
  'display-semibold': ['Inter_600SemiBold'],
  'sans': ['Inter_400Regular'],
  'sans-medium': ['Inter_500Medium'],
  'sans-semibold': ['Inter_600SemiBold'],
  'sans-bold': ['Inter_700Bold'],
  'body': ['Inter_400Regular'],
  'body-light': ['Inter_300Light'],
  'body-medium': ['Inter_500Medium'],
}
```

### Current text color tokens (`tailwind.config.js`)
```javascript
textPrimary:   '#FFFFFF'   // pure white — causes halation
textSecondary: '#8B949E'   // slightly blue-grey
textMuted:     '#484F58'   // dark grey
```

### Current text color in `src/lib/colors.ts`
```typescript
textPrimary:   '#FFFFFF',
textSecondary: '#8B949E',
textMuted:     '#484F58',
```

### Components using font-display-* (affect hero metric rendering)
- `MetricValue.tsx` — `font-display-extrabold` → must become SpaceGrotesk_700Bold
- `OverviewHeroCard.tsx` — `font-display-bold text-3xl` for period totals
- `SectionLabel.tsx` — `font-sans-semibold` → stays Inter (body/label role)

### Components using `font-mono` (new, needed for data tables)
- Daily breakdown rows in `ai.tsx` (hours, AI%, date columns) → font-mono-medium
- Approval card item data rows in `approvals.tsx` → font-mono
- Timestamp strings in `MetricValue.tsx` sub-label → font-mono

### tabular-nums application
`MetricValue.tsx` already applies `-0.5` letterSpacing. Must update to `fontVariant: ['tabular-nums']` (React Native style property) and `letterSpacing: -0.02 * fontSize` at display sizes.

### Installed but unused font packages
- `@expo-google-fonts/space-grotesk` — SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold
- `@expo-google-fonts/space-mono` — SpaceMono_400Regular, SpaceMono_700Bold
- `@expo-google-fonts/plus-jakarta-sans` — already unused, leave as-is

---

## Key Decisions

1. **Font role mapping**: `font-display-*` → SpaceGrotesk, new `font-mono-*` → SpaceMono, `font-sans-*` and `font-body-*` → Inter (unchanged). This preserves all existing class usages for Inter while upgrading display to SpaceGrotesk.

2. **Text colors**: Update only the three mutable text tokens. All semantic accent colors (gold, cyan, violet, success, warning, critical) remain unchanged — they are already correct per the spec.

3. **tabular-nums**: Add `fontVariant: ['tabular-nums']` to the MetricValue component style, which renders hero numbers. Not applied globally — only for numeric display contexts.

4. **Letter spacing**: MetricValue hero numbers get `letterSpacing: -0.02 * fontSize` (computable from className size). Current `-0.5px` is close enough at default size — update to the spec formula.

5. **Font weights**: Drop hero metric weight from 800 (ExtraBold) to 700 (Bold) per the optical weight reduction rule — light-emitting screens render text optically heavier than print.

6. **Flash of Unstyled Text (FOUT) prevention**: `_layout.tsx` already uses `SplashScreen.preventAutoHideAsync()` + holds until `fontsLoaded`. Adding SpaceGrotesk and SpaceMono to the `useFonts` call maintains this guarantee.

---

## Interface Contracts

### Updated Tailwind font token map

```typescript
// tailwind.config.js — fontFamily section
fontFamily: {
  // SpaceGrotesk — hero metrics, headings, section titles
  'display':           ['SpaceGrotesk_700Bold'],
  'display-bold':      ['SpaceGrotesk_700Bold'],
  'display-extrabold': ['SpaceGrotesk_700Bold'],   // weight reduced per optical rule
  'display-medium':    ['SpaceGrotesk_500Medium'],
  'display-semibold':  ['SpaceGrotesk_600SemiBold'],

  // SpaceMono — data tables, timestamps, numeric columns
  'mono':              ['SpaceMono_400Regular'],
  'mono-bold':         ['SpaceMono_700Bold'],

  // Inter — body copy, labels, metadata (unchanged names, unchanged behaviour)
  'sans':              ['Inter_400Regular'],
  'sans-medium':       ['Inter_500Medium'],
  'sans-semibold':     ['Inter_600SemiBold'],
  'sans-bold':         ['Inter_700Bold'],
  'body':              ['Inter_400Regular'],
  'body-light':        ['Inter_300Light'],
  'body-medium':       ['Inter_500Medium'],
}
```

### Updated text color tokens

```typescript
// tailwind.config.js — colors section (changes only)
textPrimary:   '#E0E0E0',   // was #FFFFFF — desaturated, eliminates halation
textSecondary: '#A0A0A0',   // was #8B949E — simplified neutral grey
textMuted:     '#757575',   // was #484F58 — slightly lighter for legibility
```

```typescript
// src/lib/colors.ts (mirror of tailwind)
textPrimary:   '#E0E0E0',
textSecondary: '#A0A0A0',
textMuted:     '#757575',
```

### Updated MetricValue.tsx style

```typescript
// Additional styles on the hero number Text node:
fontVariant: ['tabular-nums'],
letterSpacing: -fontSize * 0.02,   // computed from prop/className size
// fontFamily: SpaceGrotesk_700Bold (via font-display class)
```

### Font loading in `app/_layout.tsx`

```typescript
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';

const [fontsLoaded] = useFonts({
  Inter_300Light, Inter_400Regular, Inter_500Medium,
  Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  SpaceMono_400Regular, SpaceMono_700Bold,
});
```

---

## Test Plan

### `tailwindFontTokens`
**Purpose:** Verify font family tokens resolve to correct font names

- [ ] `font-display` className maps to `SpaceGrotesk_700Bold` fontFamily
- [ ] `font-display-medium` maps to `SpaceGrotesk_500Medium`
- [ ] `font-mono` maps to `SpaceMono_400Regular`
- [ ] `font-mono-bold` maps to `SpaceMono_700Bold`
- [ ] `font-sans` still maps to `Inter_400Regular` (no regression)
- [ ] `font-body-light` still maps to `Inter_300Light` (no regression)

### `textColorTokens`
**Purpose:** Verify desaturated text color values

- [ ] `colors.textPrimary === '#E0E0E0'`
- [ ] `colors.textSecondary === '#A0A0A0'`
- [ ] `colors.textMuted === '#757575'`
- [ ] `colors.gold === '#E8C97A'` (unchanged, accent colors not touched)
- [ ] tailwind.config.js and colors.ts values match for all three text tokens

### `metricValueTypography`
**Purpose:** Verify MetricValue applies tabular-nums and correct letter spacing

- [ ] MetricValue renders with `fontVariant: ['tabular-nums']`
- [ ] MetricValue renders with negative letterSpacing
- [ ] MetricValue uses SpaceGrotesk font family (font-display class)
- [ ] MetricValue renders without crashing when fontsLoaded=false (fallback)

### `fontLoading`
**Purpose:** Verify FOUT prevention still works with new fonts

- [ ] useFonts() call includes SpaceGrotesk_700Bold
- [ ] useFonts() call includes SpaceMono_400Regular
- [ ] SplashScreen is kept visible until fontsLoaded=true
- [ ] No font names are duplicated in the useFonts call

---

## Files to Reference

- `hourglassws/tailwind.config.js` — current font family and color token definitions
- `hourglassws/src/lib/colors.ts` — Skia color constants (must stay in sync)
- `hourglassws/app/_layout.tsx` — font loading and splash screen logic
- `hourglassws/src/components/MetricValue.tsx` — primary hero metric component
- `hourglassws/src/components/SectionLabel.tsx` — label component (should stay Inter)
- `hourglassws/src/components/OverviewHeroCard.tsx` — uses font-display for period totals
- `hourglassws/package.json` — confirms @expo-google-fonts/space-grotesk and /space-mono are installed
