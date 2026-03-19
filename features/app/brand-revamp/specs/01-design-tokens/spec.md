# 01-design-tokens

**Status:** Draft
**Created:** 2026-03-19
**Last Updated:** 2026-03-19
**Owner:** @trilogy

---

## Overview

This spec migrates the Hourglass app from a single-font Inter typography system to a three-font design system, and desaturates text colors to eliminate visual halation on dark backgrounds.

**What is being built:**

1. **Font token migration** — `font-display-*` tokens in `tailwind.config.js` point to `SpaceGrotesk` weights instead of Inter. Two new `font-mono` / `font-mono-bold` tokens are added pointing to `SpaceMono`. Inter tokens (`font-sans-*`, `font-body-*`) remain unchanged — no component refactoring needed for body text.

2. **Font loading** — `app/_layout.tsx` adds `SpaceGrotesk_400Regular`, `SpaceGrotesk_500Medium`, `SpaceGrotesk_600SemiBold`, `SpaceGrotesk_700Bold`, `SpaceMono_400Regular`, and `SpaceMono_700Bold` to the existing `useFonts()` call. Both packages are already installed in `package.json` but not yet imported or loaded. FOUT prevention is inherited from the existing `SplashScreen.preventAutoHideAsync()` + `fontsLoaded` guard — no changes needed there.

3. **Text color desaturation** — Three text color tokens are updated in both `tailwind.config.js` and `src/lib/colors.ts`: `textPrimary` `#FFFFFF → #E0E0E0`, `textSecondary` `#8B949E → #A0A0A0`, `textMuted` `#484F58 → #757575`. All semantic accent colors (gold, cyan, violet, success, warning, critical) are unchanged.

4. **MetricValue typography** — The hero number `Text` node already applies `fontVariant: ['tabular-nums']` and `letterSpacing: -0.5`. The font class `font-display-extrabold` stays in place; after this spec's tailwind token update it resolves to `SpaceGrotesk_700Bold` automatically (weight reduced from 800 → 700 per optical weight rule for light-emitting screens). The `letterSpacing` is updated from the fixed `-0.5` to the proportional formula `-fontSize * 0.02` (e.g. `-0.96` at 48px, `-0.72` at 36px). Since MetricValue uses a `sizeClass` prop, the font size must be extracted at render time.

**How it works:** All existing component code using `className="font-display-extrabold"` or `className="font-display-bold"` automatically renders SpaceGrotesk once the tailwind token map is updated — zero component changes needed except MetricValue's letterSpacing formula. Text color classes like `text-textPrimary` automatically pick up the new hex values with no component touches.

---

## Out of Scope

1. **Applying `font-mono-*` classes to data table components** — Deferred to `04-victory-charts` (daily breakdown rows in `ai.tsx`, approval card rows in `approvals.tsx`). The token is defined here; usage is a chart migration concern.

2. **MetricValue sub-label font** — The spec-research notes timestamps in `MetricValue.tsx` sub-label should use `font-mono`. MetricValue currently has no sub-label prop. **Descoped:** MetricValue renders a single value+unit string only. No sub-label exists to migrate.

3. **OverviewHeroCard, SectionLabel refactoring** — These components use `font-display-bold` and `font-sans-semibold` respectively. After token update they automatically resolve to SpaceGrotesk and Inter — no explicit component changes are needed. **Descoped:** Token update is sufficient.

4. **Plus Jakarta Sans removal** — `@expo-google-fonts/plus-jakarta-sans` is installed but unused. Removing it is a separate cleanup concern. **Descoped:** leave as-is per spec-research.md decision.

5. **SKSL shaders / FOUT animation** — Out of scope for the entire brand-revamp feature (see FEATURE.md). **Descoped.**

6. **Letter-spacing updates on non-hero components** — Only MetricValue hero numbers use the `−0.02 * fontSize` proportional formula. Body and label text uses default Inter letter-spacing. **Descoped.**

7. **Dark/light mode theming** — App is dark-mode only. **Descoped.**

---

## Functional Requirements

### FR1 — Tailwind Font Token Migration

Update `tailwind.config.js` `fontFamily` section to map `font-display-*` tokens to SpaceGrotesk weights and add new `font-mono` / `font-mono-bold` tokens for SpaceMono.

**Success Criteria:**

- SC1.1: `theme.extend.fontFamily['display']` equals `['SpaceGrotesk_700Bold']`
- SC1.2: `theme.extend.fontFamily['display-bold']` equals `['SpaceGrotesk_700Bold']`
- SC1.3: `theme.extend.fontFamily['display-extrabold']` equals `['SpaceGrotesk_700Bold']` (weight reduced from 800 → 700 per optical rule)
- SC1.4: `theme.extend.fontFamily['display-medium']` equals `['SpaceGrotesk_500Medium']`
- SC1.5: `theme.extend.fontFamily['display-semibold']` equals `['SpaceGrotesk_600SemiBold']`
- SC1.6: `theme.extend.fontFamily['mono']` equals `['SpaceMono_400Regular']` (new token)
- SC1.7: `theme.extend.fontFamily['mono-bold']` equals `['SpaceMono_700Bold']` (new token)
- SC1.8: All existing Inter tokens (`sans`, `sans-medium`, `sans-semibold`, `sans-bold`, `body`, `body-light`, `body-medium`) remain unchanged
- SC1.9: No Inter font names appear in the `display-*` entries

---

### FR2 — Text Color Token Desaturation

Update `textPrimary`, `textSecondary`, and `textMuted` in both `tailwind.config.js` and `src/lib/colors.ts`. All other color tokens remain unchanged.

**Success Criteria:**

- SC2.1: `tailwind.config.js` `colors.textPrimary` equals `'#E0E0E0'`
- SC2.2: `tailwind.config.js` `colors.textSecondary` equals `'#A0A0A0'`
- SC2.3: `tailwind.config.js` `colors.textMuted` equals `'#757575'`
- SC2.4: `colors.ts` `colors.textPrimary` equals `'#E0E0E0'`
- SC2.5: `colors.ts` `colors.textSecondary` equals `'#A0A0A0'`
- SC2.6: `colors.ts` `colors.textMuted` equals `'#757575'`
- SC2.7: `colors.ts` `colors.gold` equals `'#E8C97A'` (unchanged — accent colors not touched)
- SC2.8: `tailwind.config.js` and `colors.ts` values match for all three text tokens (sync invariant)

---

### FR3 — Font Loading in _layout.tsx

Add SpaceGrotesk and SpaceMono font variants to the `useFonts()` call in `app/_layout.tsx`, preserving FOUT prevention.

**Success Criteria:**

- SC3.1: `SpaceGrotesk_400Regular`, `SpaceGrotesk_500Medium`, `SpaceGrotesk_600SemiBold`, `SpaceGrotesk_700Bold` are imported from `@expo-google-fonts/space-grotesk`
- SC3.2: `SpaceMono_400Regular`, `SpaceMono_700Bold` are imported from `@expo-google-fonts/space-mono`
- SC3.3: All six new font variants are included in the `useFonts({...})` call
- SC3.4: Existing Inter font variants remain in the `useFonts({...})` call (no regressions)
- SC3.5: No font name appears twice in the `useFonts` call
- SC3.6: `SplashScreen.preventAutoHideAsync()` call is still present (FOUT prevention preserved)
- SC3.7: The `isLoading || !fontsLoaded` guard still blocks rendering until fonts resolve

---

### FR4 — MetricValue Letter Spacing Formula

Update `MetricValue.tsx` to use a proportional `letterSpacing: -fontSize * 0.02` formula instead of the fixed `-0.5` value. The `fontVariant: ['tabular-nums']` is already present — verify it remains.

**Success Criteria:**

- SC4.1: The hero number `Text` node has `fontVariant: ['tabular-nums']` in its `style`
- SC4.2: The hero number `Text` node has a negative `letterSpacing` value derived from font size
- SC4.3: At `text-4xl` (36px), letterSpacing is approximately `-0.72` (36 × 0.02)
- SC4.4: At `text-5xl` (48px), letterSpacing is approximately `-0.96` (48 × 0.02)
- SC4.5: The className `font-display-extrabold` remains on the hero number `Text` node
- SC4.6: MetricValue renders without crashing when called with default props
- SC4.7: The size → fontSize mapping is derived from the `sizeClass` prop (e.g. `text-4xl` → 36, `text-5xl` → 48, `text-3xl` → 30)

---

## Technical Design

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/tailwind.config.js` | FR1: remap `display-*` to SpaceGrotesk; add `mono`/`mono-bold`; FR2: update 3 text color values |
| `hourglassws/src/lib/colors.ts` | FR2: update `textPrimary`, `textSecondary`, `textMuted` values |
| `hourglassws/app/_layout.tsx` | FR3: add SpaceGrotesk + SpaceMono imports and useFonts entries |
| `hourglassws/src/components/MetricValue.tsx` | FR4: update letterSpacing formula |

### Files to Reference (read-only)

- `hourglassws/package.json` — confirms `@expo-google-fonts/space-grotesk` and `@expo-google-fonts/space-mono` are installed (no npm install needed)
- `hourglassws/src/components/SectionLabel.tsx` — uses `font-sans-semibold`, should be unchanged post-migration
- `hourglassws/src/components/OverviewHeroCard.tsx` — uses `font-display-bold`, will automatically pick up SpaceGrotesk via token update

### Data Flow

```
tailwind.config.js (source of truth)
  → NativeWind compiles className tokens at Metro startup
  → Components using font-display-* className receive SpaceGrotesk at runtime
  → Components using font-mono* className receive SpaceMono at runtime
  → Components using text-textPrimary/Secondary/Muted receive new hex values

colors.ts (mirror for Skia)
  → Imported by chart components that cannot use NativeWind className
  → Must stay in sync with tailwind.config.js text color values

app/_layout.tsx
  → useFonts() loads all font variants before any screen renders
  → SplashScreen held until isLoading=false (not fontsLoaded — splash controlled by config load)
  → isLoading || !fontsLoaded guard shows spinner during font load
```

### FR4 Implementation Detail: Size → fontSize Mapping

`MetricValue.tsx` receives a `sizeClass` prop (default: `"text-4xl"`). To compute proportional letterSpacing, map Tailwind size class to numeric pixel value:

```typescript
const TAILWIND_FONT_SIZES: Record<string, number> = {
  'text-xs':   12,
  'text-sm':   14,
  'text-base': 16,
  'text-lg':   18,
  'text-xl':   20,
  'text-2xl':  24,
  'text-3xl':  30,
  'text-4xl':  36,  // default
  'text-5xl':  48,
  'text-6xl':  60,
  'text-7xl':  72,
};

// Extract base size class from sizeClass (which may include responsive prefixes)
const baseClass = sizeClass.split(' ').find(c => c.startsWith('text-')) ?? 'text-4xl';
const fontSize = TAILWIND_FONT_SIZES[baseClass] ?? 36;
const letterSpacing = -fontSize * 0.02;
```

This map is local to the component (not exported). Only the size classes actually used in the codebase need to be present, but a reasonable subset covering xs through 7xl ensures forward compatibility.

### Edge Cases

1. **Unknown sizeClass** — If `sizeClass` contains a class not in the map, fallback to 36 (text-4xl default). No crash.
2. **SpaceGrotesk not yet loaded** — React Native falls back to system font for the frame before font loads. The `!fontsLoaded` spinner guard in `_layout.tsx` prevents this from reaching users.
3. **Duplicate font names in useFonts** — React Native / Expo Font throws a warning. The implementation must not add a font variant that's already in the call (all six new entries are new — no collision with Inter variants).
4. **colors.ts and tailwind.config.js drift** — The sync warning comment in `colors.ts` must be respected. Both files are edited in the same FR2 commit to prevent drift.

### Test File Location

```
hourglassws/src/components/__tests__/designTokens.test.ts
```

Single test file covering all four FRs (FR1–FR4). Tests are configuration/snapshot-style — they import the config files directly and assert values. MetricValue tests use React Native Testing Library.

### Test Approach

- **FR1/FR2 tests**: Import `tailwind.config.js` directly (it's a plain CommonJS module). Assert `module.theme.extend.fontFamily` and `module.theme.extend.colors` values. No React render needed.
- **FR2 colors.ts tests**: Import `colors` from `src/lib/colors`. Assert exact hex values.
- **FR3 tests**: Import the layout module and inspect the useFonts call. Since `useFonts` is a hook, test by verifying the font objects imported from `@expo-google-fonts/space-grotesk` and `@expo-google-fonts/space-mono` are present in the module's imports — or by testing the useFonts mock receives the correct keys.
- **FR4 tests**: Render `<MetricValue value={42} sizeClass="text-4xl" />` with RNTL, find the `Text` node, assert `fontVariant` includes `'tabular-nums'` and `letterSpacing` is approximately `-0.72`.

### Dependencies (Already Installed)

```json
"@expo-google-fonts/space-grotesk": "^0.2.2",
"@expo-google-fonts/space-mono": "^0.2.2"
```

No `npm install` required. Verify with `package.json` before implementation.
