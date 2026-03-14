# 01-nativewind-verify

**Status:** Draft
**Created:** 2026-03-14
**Last Updated:** 2026-03-14
**Owner:** @trilogy

---

## Overview

NativeWind v4 is installed and configured in the Hourglass Expo app (Expo SDK 54, React Native 0.81.5 with New Architecture) but has never been confirmed working in Expo Go. Before any design-system component work begins, this spec verifies the full className-to-native-style pipeline end-to-end.

**What is being built:**

A minimal smoke-test component (`src/components/NativeWindSmoke.tsx`) that renders a small card using only NativeWind `className` props — no `StyleSheet.create()`, no inline styles. The component is temporarily mounted on the home screen so a developer can visually confirm that design tokens (colors, spacing, typography, border radius) render correctly in Expo Go.

**How it works:**

1. `NativeWindSmoke` renders a `View` with `className="bg-background flex-1 items-center justify-center"`, an inner card `View` with `className="bg-surface rounded-2xl p-5 border border-border"`, a `Text` with `className="text-gold font-display text-3xl"` showing "42.5", a `Text` with `className="text-textSecondary font-sans text-sm"` showing "Hours This Week", and a `View` accent dot with `className="bg-cyan w-3 h-3 rounded-full mt-2"`.

2. The component is imported in `app/(tabs)/index.tsx` temporarily and rendered above the existing screen content.

3. A developer runs `npx expo start --clear` and opens the app in Expo Go, observing that:
   - The background is dark (#0A0A0F), not white
   - The number "42.5" appears in gold (#E8C97A)
   - The card has visible rounded corners
   - No Metro warnings about unknown class names appear

4. After visual confirmation, the verification result is documented in a comment at the top of the smoke file and in `MEMORY.md`.

**Scope:** This spec is concerned only with confirming NativeWind works. It does not build production components, migrate existing screens, or handle any runtime logic. It is a prerequisite gate for specs 03 through 08.

---

## Out of Scope

1. **Production component library** — Deferred to 03-base-components. This spec only creates a temporary smoke-test component, not reusable production components.

2. **Migrating existing screens** — Deferred to 05-hours-dashboard, 06-ai-tab, 07-approvals-tab, 08-auth-screens. Existing `StyleSheet.create()` screens are untouched by this spec.

3. **Skia chart components** — Deferred to 04-skia-charts. Chart rendering is a separate concern from NativeWind className verification.

4. **panelState utility** — Deferred to 02-panel-state. Pure logic utility, independent of NativeWind.

5. **cssInterop wrapping for third-party components** — Descoped. The smoke component uses only React Native core primitives (`View`, `Text`) which support `className` natively via NativeWind. cssInterop is needed only when using third-party components (e.g., `SafeAreaView` from `react-native-safe-area-context`) with className — that is the concern of 03-base-components.

6. **Automated visual regression tests** — Descoped. Visual verification at this stage is intentionally manual (human-in-the-loop) since automated screenshot diffing infrastructure is not in place. Acceptance is documented as a comment/MEMORY.md entry, not a CI gate.

7. **Android/device-specific rendering verification** — Descoped. This spec targets Expo Go on iOS simulator. Android NativeWind behavior is verified implicitly as part of future screen rebuild specs.

8. **Dark mode / color scheme switching** — Descoped. All Hourglass screens use a fixed dark palette; no light-mode variant exists. This spec verifies dark tokens only.

---

## Functional Requirements

### FR1: NativeWindSmoke component created

Create `src/components/NativeWindSmoke.tsx` — a minimal component that uses only NativeWind `className` props (no StyleSheet, no inline styles) to render Hourglass design tokens.

**Success Criteria:**

- SC1.1: File exists at `hourglassws/src/components/NativeWindSmoke.tsx`
- SC1.2: Component uses only `className` props — zero `style={{}}` props, zero `StyleSheet.create()` calls
- SC1.3: Renders a full-screen container with `className="bg-background flex-1 items-center justify-center"`
- SC1.4: Renders an inner card with `className="bg-surface rounded-2xl p-5 border border-border"`
- SC1.5: Renders hero text "42.5" with `className="text-gold font-display text-3xl"`
- SC1.6: Renders label "Hours This Week" with `className="text-textSecondary font-sans text-sm"`
- SC1.7: Renders a cyan accent dot with `className="bg-cyan w-3 h-3 rounded-full mt-2"`
- SC1.8: Component is exported as default and typed `(): JSX.Element`
- SC1.9: File includes a comment block explaining it is a temporary smoke-test component

---

### FR2: Smoke component mounted on home screen and verified

The smoke component is temporarily added to `app/(tabs)/index.tsx` so it can be loaded in Expo Go and visually verified.

**Success Criteria:**

- SC2.1: `NativeWindSmoke` is imported and rendered in `app/(tabs)/index.tsx`
- SC2.2: Running `npx expo start --clear` and opening in Expo Go produces no Metro crash
- SC2.3: No "Unknown class" or "NativeWind stylesheet not found" warnings appear in the Metro terminal output
- SC2.4: The rendered component visually shows a dark background (#0A0A0F) — not white or grey
- SC2.5: The number "42.5" appears in gold (#E8C97A)
- SC2.6: The inner card has visibly rounded corners
- SC2.7: No runtime JS errors appear in the Expo Go overlay

---

### FR3: Verification result documented

The outcome of the smoke test (pass or fail + fix applied) is recorded persistently so downstream spec authors know NativeWind is confirmed working.

**Success Criteria:**

- SC3.1: A comment is added to the top of `NativeWindSmoke.tsx` stating the verified date in the format `// NATIVEWIND_VERIFIED: YYYY-MM-DD — className renders correctly in Expo Go`
- SC3.2: `MEMORY.md` (project memory file) is updated with a `NATIVEWIND_VERIFIED=true` entry including the date and Expo SDK version
- SC3.3: If verification fails, the failure mode and fix applied are documented in the comment before re-verifying

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/tailwind.config.js` | Token source — confirms `background`, `surface`, `gold`, `textSecondary`, `cyan`, `border` are defined |
| `hourglassws/metro.config.js` | `withNativeWind` plugin — confirms CSS processing pipeline |
| `hourglassws/global.css` | Tailwind directives — must be imported in `_layout.tsx` |
| `hourglassws/app/_layout.tsx` | Root layout — confirms `import '../global.css'` is present |
| `hourglassws/babel.config.js` | Confirms NO `nativewind/babel` plugin (v4 doesn't need it) |
| `hourglassws/app/(tabs)/index.tsx` | Home screen — temporary mounting point for smoke component |

### Files to Create

| File | Description |
|------|-------------|
| `hourglassws/src/components/NativeWindSmoke.tsx` | New smoke-test component (permanent file, temporary home-screen usage) |

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/app/(tabs)/index.tsx` | Add `import NativeWindSmoke` + render it (temporary; removed after verification) |
| `memory/MEMORY.md` | Add `NATIVEWIND_VERIFIED` entry after successful verification |

### NativeWindSmoke Component Structure

```typescript
// NATIVEWIND_VERIFIED: YYYY-MM-DD — className renders correctly in Expo Go
// Expo SDK 54, react-native 0.81.5, nativewind ^4.2.2
// This is a TEMPORARY smoke-test component. Do NOT use in production screens.

import { View, Text } from 'react-native';

export default function NativeWindSmoke(): JSX.Element {
  return (
    <View className="bg-background flex-1 items-center justify-center">
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-gold font-display text-3xl">42.5</Text>
        <Text className="text-textSecondary font-sans text-sm">Hours This Week</Text>
        <View className="bg-cyan w-3 h-3 rounded-full mt-2" />
      </View>
    </View>
  );
}
```

### Data Flow

```
tailwind.config.js (token definitions)
    ↓ (Metro compile-time, withNativeWind plugin)
global.css → processed stylesheet
    ↓ (runtime, NativeWind JSI bridge)
className="bg-background" → native backgroundColor: '#0A0A0F'
    ↓ (React Native renderer)
Visual output on screen
```

### Token Mapping (Verification Reference)

| className | Token | Expected hex | Verified by |
|-----------|-------|-------------|-------------|
| `bg-background` | `colors.background` | `#0A0A0F` | Dark background (not white) |
| `bg-surface` | `colors.surface` | `#13131A` | Card background |
| `text-gold` | `colors.gold` | `#E8C97A` | Gold number text |
| `text-textSecondary` | `colors.textSecondary` | `#8B949E` | Muted label |
| `bg-cyan` | `colors.cyan` | `#00D4FF` | Accent dot |
| `border-border` | `colors.border` | `#2A2A3D` | Card border |
| `font-display` | `fontFamily.display` | SpaceGrotesk_400Regular | Hero number font |
| `font-sans` | `fontFamily.sans` | Inter_400Regular | Label font |

### Known NativeWind v4 Gotchas (to watch for)

1. **Token case sensitivity**: `bg-background` is kebab-case key matching the tailwind config key. If the config used `backgroundColor` (camelCase), it would NOT work — confirm keys are kebab-compatible.
   - Current config uses `background`, `surface`, `gold` etc. — these produce `bg-background`, `bg-surface`, `text-gold` ✓

2. **Font loading prerequisite**: `font-display` maps to `SpaceGrotesk_400Regular`. This font is loaded via `useFonts` in `_layout.tsx`. If fonts haven't loaded yet, the Text will fall back to system font — this is expected during the loading overlay, not a NativeWind failure.

3. **Metro cache**: After any config change, always run `npx expo start --clear` to force Tailwind reprocessing. Stale cache is the #1 source of "class not applied" bugs.

4. **cssInterop not needed here**: `View` and `Text` are React Native core primitives — NativeWind v4 handles them natively without `cssInterop`. No wrapping needed.

### Edge Cases

- **If background renders white**: NativeWind CSS not being processed — check `withNativeWind` in metro.config.js and `global.css` import in `_layout.tsx`.
- **If "Unknown class" warnings appear**: Token name mismatch — re-check exact key names in tailwind.config.js vs className strings.
- **If Expo Go crashes on load**: Likely a Metro/Babel config issue — run `npx expo start --clear`, check babel.config.js has no `nativewind/babel` plugin.
- **If fonts render as system font**: `useFonts` may not have resolved. Confirm loading check in `_layout.tsx` covers all three font families.

### Verification Procedure

1. Ensure `npx expo start --clear` is used (not a warm restart)
2. Open Expo Go on iOS simulator or physical device
3. Navigate to the home tab
4. Observe: dark background, gold "42.5", grey label, rounded card, cyan dot
5. Check Metro terminal for any warnings
6. If pass: add `NATIVEWIND_VERIFIED` comment to file and update MEMORY.md
7. If fail: document error, apply fix, re-run from step 1
