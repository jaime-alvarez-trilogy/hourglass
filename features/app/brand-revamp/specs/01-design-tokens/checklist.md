# Implementation Checklist

Spec: `01-design-tokens`
Feature: `brand-revamp`

---

## Phase 1.0: Test Foundation

### FR1: Tailwind Font Token Migration
- [x] Write tests asserting `theme.extend.fontFamily['display']` equals `['SpaceGrotesk_700Bold']`
- [x] Write tests asserting `theme.extend.fontFamily['display-bold']` equals `['SpaceGrotesk_700Bold']`
- [x] Write tests asserting `theme.extend.fontFamily['display-extrabold']` equals `['SpaceGrotesk_700Bold']`
- [x] Write tests asserting `theme.extend.fontFamily['display-medium']` equals `['SpaceGrotesk_500Medium']`
- [x] Write tests asserting `theme.extend.fontFamily['display-semibold']` equals `['SpaceGrotesk_600SemiBold']`
- [x] Write tests asserting `theme.extend.fontFamily['mono']` equals `['SpaceMono_400Regular']`
- [x] Write tests asserting `theme.extend.fontFamily['mono-bold']` equals `['SpaceMono_700Bold']`
- [x] Write tests asserting all Inter `sans-*` and `body-*` tokens remain unchanged
- [x] Write test asserting no Inter font name appears in any `display-*` entry

### FR2: Text Color Token Desaturation
- [x] Write tests asserting `tailwind.config.js` `colors.textPrimary === '#E0E0E0'`
- [x] Write tests asserting `tailwind.config.js` `colors.textSecondary === '#A0A0A0'`
- [x] Write tests asserting `tailwind.config.js` `colors.textMuted === '#757575'`
- [x] Write tests asserting `colors.ts` `colors.textPrimary === '#E0E0E0'`
- [x] Write tests asserting `colors.ts` `colors.textSecondary === '#A0A0A0'`
- [x] Write tests asserting `colors.ts` `colors.textMuted === '#757575'`
- [x] Write test asserting `colors.gold === '#E8C97A'` (accent unchanged)
- [x] Write test asserting tailwind and colors.ts values match for all three text tokens

### FR3: Font Loading in _layout.tsx
- [x] Write test verifying `SpaceGrotesk_400Regular` through `SpaceGrotesk_700Bold` are present in useFonts keys
- [x] Write test verifying `SpaceMono_400Regular` and `SpaceMono_700Bold` are present in useFonts keys
- [x] Write test verifying all existing Inter variants remain in useFonts (no regressions)
- [x] Write test verifying no font name appears twice in useFonts call
- [x] Write test verifying `SplashScreen.preventAutoHideAsync` is called

### FR4: MetricValue Letter Spacing Formula
- [x] Write test asserting rendered `Text` node has `fontVariant` containing `'tabular-nums'`
- [x] Write test asserting rendered `Text` node has negative `letterSpacing` for default `text-4xl` sizeClass (approx -0.72)
- [x] Write test asserting rendered `Text` node has letterSpacing approx -0.96 for `text-5xl` sizeClass
- [x] Write test asserting rendered `Text` node retains `font-display-extrabold` className
- [x] Write test asserting MetricValue renders without crashing with default props
- [x] Write test asserting unknown sizeClass falls back to -0.72 (36px default)

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [x] Run `red-phase-test-validator` agent
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Mocks return realistic data matching interface contracts
- [x] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Tailwind Font Token Migration
- [x] Update `tailwind.config.js` `fontFamily['display']` to `['SpaceGrotesk_700Bold']`
- [x] Update `tailwind.config.js` `fontFamily['display-bold']` to `['SpaceGrotesk_700Bold']`
- [x] Update `tailwind.config.js` `fontFamily['display-extrabold']` to `['SpaceGrotesk_700Bold']`
- [x] Update `tailwind.config.js` `fontFamily['display-medium']` to `['SpaceGrotesk_500Medium']`
- [x] Update `tailwind.config.js` `fontFamily['display-semibold']` to `['SpaceGrotesk_600SemiBold']`
- [x] Add `tailwind.config.js` `fontFamily['mono']` as `['SpaceMono_400Regular']`
- [x] Add `tailwind.config.js` `fontFamily['mono-bold']` as `['SpaceMono_700Bold']`
- [x] Verify Inter `sans-*` and `body-*` tokens are untouched

### FR2: Text Color Token Desaturation
- [x] Update `tailwind.config.js` `colors.textPrimary` to `'#E0E0E0'`
- [x] Update `tailwind.config.js` `colors.textSecondary` to `'#A0A0A0'`
- [x] Update `tailwind.config.js` `colors.textMuted` to `'#757575'`
- [x] Update `src/lib/colors.ts` `textPrimary` to `'#E0E0E0'`
- [x] Update `src/lib/colors.ts` `textSecondary` to `'#A0A0A0'`
- [x] Update `src/lib/colors.ts` `textMuted` to `'#757575'`

### FR3: Font Loading in _layout.tsx
- [x] Add imports for `SpaceGrotesk_400Regular`, `SpaceGrotesk_500Medium`, `SpaceGrotesk_600SemiBold`, `SpaceGrotesk_700Bold` from `@expo-google-fonts/space-grotesk`
- [x] Add imports for `SpaceMono_400Regular`, `SpaceMono_700Bold` from `@expo-google-fonts/space-mono`
- [x] Add all six new font variants to `useFonts({...})` call
- [x] Verify Inter variants remain in `useFonts({...})` call

### FR4: MetricValue Letter Spacing Formula
- [x] Add `TAILWIND_FONT_SIZES` map (xs through 7xl) to `MetricValue.tsx`
- [x] Derive `fontSize` from `sizeClass` prop using the map (fallback 36 for unknown)
- [x] Replace fixed `letterSpacing: -0.5` with `letterSpacing: -fontSize * 0.02`
- [x] Verify `fontVariant: ['tabular-nums']` remains in style
- [x] Verify `font-display-extrabold` className remains on `Text` node

---

## Phase 1.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [x] Run `spec-implementation-alignment` agent
- [x] All FR success criteria verified in code
- [x] Interface contracts match implementation
- [x] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [x] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [x] Fix HIGH severity issues (critical)
- [x] Fix MEDIUM severity issues (or document why deferred)
- [x] Re-run tests after fixes
- [x] Commit fixes: `fix(01-design-tokens): update stale header comments and add mono-medium token`

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on modified tests
- [x] Apply suggested improvements that strengthen confidence
- [x] Re-run tests to confirm passing
- [x] Commit if changes made: N/A — tests already strong, no rewrites needed

### Final Verification
- [x] All tests passing
- [x] No regressions in existing tests
- [x] Code follows existing patterns

---

## Session Notes

**2026-03-19**: Spec and checklist created. FR1–FR4 defined. All packages confirmed installed. No blockers.

**2026-03-19**: Implementation complete.
- Note: `@expo-google-fonts/space-mono` was not in package.json (spec-research listed it as installed but it wasn't). Installed during Phase 1.0.
- Phase 1.0: 1 test commit (all 4 FRs in single file), 1 fix commit (SC4.2 regex)
- Phase 1.1: 3 implementation commits (FR1+FR2 together, FR3, FR4)
- Phase 1.2: Review found 2 issues fixed in 1 commit (stale header + mono-medium token). Test-optimiser: no changes needed.
- All 53 tests passing.
