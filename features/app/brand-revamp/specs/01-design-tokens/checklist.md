# Implementation Checklist

Spec: `01-design-tokens`
Feature: `brand-revamp`

---

## Phase 1.0: Test Foundation

### FR1: Tailwind Font Token Migration
- [ ] Write tests asserting `theme.extend.fontFamily['display']` equals `['SpaceGrotesk_700Bold']`
- [ ] Write tests asserting `theme.extend.fontFamily['display-bold']` equals `['SpaceGrotesk_700Bold']`
- [ ] Write tests asserting `theme.extend.fontFamily['display-extrabold']` equals `['SpaceGrotesk_700Bold']`
- [ ] Write tests asserting `theme.extend.fontFamily['display-medium']` equals `['SpaceGrotesk_500Medium']`
- [ ] Write tests asserting `theme.extend.fontFamily['display-semibold']` equals `['SpaceGrotesk_600SemiBold']`
- [ ] Write tests asserting `theme.extend.fontFamily['mono']` equals `['SpaceMono_400Regular']`
- [ ] Write tests asserting `theme.extend.fontFamily['mono-bold']` equals `['SpaceMono_700Bold']`
- [ ] Write tests asserting all Inter `sans-*` and `body-*` tokens remain unchanged
- [ ] Write test asserting no Inter font name appears in any `display-*` entry

### FR2: Text Color Token Desaturation
- [ ] Write tests asserting `tailwind.config.js` `colors.textPrimary === '#E0E0E0'`
- [ ] Write tests asserting `tailwind.config.js` `colors.textSecondary === '#A0A0A0'`
- [ ] Write tests asserting `tailwind.config.js` `colors.textMuted === '#757575'`
- [ ] Write tests asserting `colors.ts` `colors.textPrimary === '#E0E0E0'`
- [ ] Write tests asserting `colors.ts` `colors.textSecondary === '#A0A0A0'`
- [ ] Write tests asserting `colors.ts` `colors.textMuted === '#757575'`
- [ ] Write test asserting `colors.gold === '#E8C97A'` (accent unchanged)
- [ ] Write test asserting tailwind and colors.ts values match for all three text tokens

### FR3: Font Loading in _layout.tsx
- [ ] Write test verifying `SpaceGrotesk_400Regular` through `SpaceGrotesk_700Bold` are present in useFonts keys
- [ ] Write test verifying `SpaceMono_400Regular` and `SpaceMono_700Bold` are present in useFonts keys
- [ ] Write test verifying all existing Inter variants remain in useFonts (no regressions)
- [ ] Write test verifying no font name appears twice in useFonts call
- [ ] Write test verifying `SplashScreen.preventAutoHideAsync` is called

### FR4: MetricValue Letter Spacing Formula
- [ ] Write test asserting rendered `Text` node has `fontVariant` containing `'tabular-nums'`
- [ ] Write test asserting rendered `Text` node has negative `letterSpacing` for default `text-4xl` sizeClass (approx -0.72)
- [ ] Write test asserting rendered `Text` node has letterSpacing approx -0.96 for `text-5xl` sizeClass
- [ ] Write test asserting rendered `Text` node retains `font-display-extrabold` className
- [ ] Write test asserting MetricValue renders without crashing with default props
- [ ] Write test asserting unknown sizeClass falls back to -0.72 (36px default)

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Tailwind Font Token Migration
- [ ] Update `tailwind.config.js` `fontFamily['display']` to `['SpaceGrotesk_700Bold']`
- [ ] Update `tailwind.config.js` `fontFamily['display-bold']` to `['SpaceGrotesk_700Bold']`
- [ ] Update `tailwind.config.js` `fontFamily['display-extrabold']` to `['SpaceGrotesk_700Bold']`
- [ ] Update `tailwind.config.js` `fontFamily['display-medium']` to `['SpaceGrotesk_500Medium']`
- [ ] Update `tailwind.config.js` `fontFamily['display-semibold']` to `['SpaceGrotesk_600SemiBold']`
- [ ] Add `tailwind.config.js` `fontFamily['mono']` as `['SpaceMono_400Regular']`
- [ ] Add `tailwind.config.js` `fontFamily['mono-bold']` as `['SpaceMono_700Bold']`
- [ ] Verify Inter `sans-*` and `body-*` tokens are untouched

### FR2: Text Color Token Desaturation
- [ ] Update `tailwind.config.js` `colors.textPrimary` to `'#E0E0E0'`
- [ ] Update `tailwind.config.js` `colors.textSecondary` to `'#A0A0A0'`
- [ ] Update `tailwind.config.js` `colors.textMuted` to `'#757575'`
- [ ] Update `src/lib/colors.ts` `textPrimary` to `'#E0E0E0'`
- [ ] Update `src/lib/colors.ts` `textSecondary` to `'#A0A0A0'`
- [ ] Update `src/lib/colors.ts` `textMuted` to `'#757575'`

### FR3: Font Loading in _layout.tsx
- [ ] Add imports for `SpaceGrotesk_400Regular`, `SpaceGrotesk_500Medium`, `SpaceGrotesk_600SemiBold`, `SpaceGrotesk_700Bold` from `@expo-google-fonts/space-grotesk`
- [ ] Add imports for `SpaceMono_400Regular`, `SpaceMono_700Bold` from `@expo-google-fonts/space-mono`
- [ ] Add all six new font variants to `useFonts({...})` call
- [ ] Verify Inter variants remain in `useFonts({...})` call

### FR4: MetricValue Letter Spacing Formula
- [ ] Add `TAILWIND_FONT_SIZES` map (xs through 7xl) to `MetricValue.tsx`
- [ ] Derive `fontSize` from `sizeClass` prop using the map (fallback 36 for unknown)
- [ ] Replace fixed `letterSpacing: -0.5` with `letterSpacing: -fontSize * 0.02`
- [ ] Verify `fontVariant: ['tabular-nums']` remains in style
- [ ] Verify `font-display-extrabold` className remains on `Text` node

---

## Phase 1.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation
- [ ] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(01-design-tokens): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(01-design-tokens): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-19**: Spec and checklist created. FR1–FR4 defined. All packages confirmed installed. No blockers.
