# Checklist: 02-Typography

## Phase 1.0 — Tests (Red Phase)

### FR1: Font aliases map to Inter
- [ ] Write test: `tailwind.config.js` `font-display` alias resolves to `Inter_700Bold` (not SpaceGrotesk)
- [ ] Write test: `tailwind.config.js` `font-body` alias resolves to `Inter_400Regular` (not PlusJakartaSans)
- [ ] Write test: `tailwind.config.js` `font-sans` alias still resolves to Inter (unchanged)
- [ ] Write test: `tailwind.config.js` contains no `SpaceGrotesk` or `PlusJakartaSans` strings
- [ ] Write test: `tailwind.config.js` `font-display-extrabold` alias resolves to `Inter_800ExtraBold`

### FR2: Font loading updated
- [ ] Write test: `app/_layout.tsx` does not import `@expo-google-fonts/space-grotesk`
- [ ] Write test: `app/_layout.tsx` does not import `@expo-google-fonts/plus-jakarta-sans`
- [ ] Write test: `app/_layout.tsx` `useFonts` call includes `Inter_800ExtraBold`
- [ ] Write test: `app/_layout.tsx` `useFonts` call does not include `SpaceGrotesk_` or `PlusJakartaSans_` variants

### FR3: Class violations fixed
- [ ] Write test: grep codebase — zero occurrences of `text-error` className
- [ ] Write test: grep codebase — zero occurrences of `text-textTertiary` className

### FR4: tabular-nums added
- [ ] Write test: `app/(tabs)/index.tsx` SubMetric value Text has `fontVariant: ['tabular-nums']`
- [ ] Write test: `src/components/ApprovalCard.tsx` hours Text has `fontVariant: ['tabular-nums']`
- [ ] Write test: `src/components/ApprovalCard.tsx` cost Text has `fontVariant: ['tabular-nums']`
- [ ] Write test: `src/components/MyRequestCard.tsx` duration Text has `fontVariant: ['tabular-nums']`
- [ ] Write test: `app/(tabs)/ai.tsx` BrainLift sub-target Text has `fontVariant: ['tabular-nums']`

---

## Phase 1.1 — Implementation

### FR1: Font aliases remapped to Inter
- [ ] Update `tailwind.config.js`: remap `font-display` group aliases to Inter weights
- [ ] Update `tailwind.config.js`: remap `font-body` group aliases to Inter weights
- [ ] Add `font-display-extrabold` alias pointing to `Inter_800ExtraBold`
- [ ] Verify no SpaceGrotesk/PlusJakartaSans strings remain in tailwind.config.js

### FR2: Font loading updated to Inter-only
- [ ] Remove `@expo-google-fonts/space-grotesk` import from `app/_layout.tsx`
- [ ] Remove `@expo-google-fonts/plus-jakarta-sans` import from `app/_layout.tsx`
- [ ] Update `useFonts` call to load Inter 300–800 (including `Inter_800ExtraBold`)
- [ ] Confirm app startup does not hang (loading gate still works)

### FR3: Class violations fixed
- [ ] Replace `text-error` with `text-critical` in `app/(tabs)/ai.tsx` (~line 256)
- [ ] Replace all 6 `text-textTertiary` with `text-textMuted` in `app/(tabs)/ai.tsx` (~lines 280, 350, 351, 352, 442, 449)

### FR4: Tabular-nums added
- [ ] Add `style={{ fontVariant: ['tabular-nums'] }}` to SubMetric value Text in `app/(tabs)/index.tsx`
- [ ] Add `style={{ fontVariant: ['tabular-nums'] }}` to hours Text in `src/components/ApprovalCard.tsx`
- [ ] Add `style={{ fontVariant: ['tabular-nums'] }}` to cost Text in `src/components/ApprovalCard.tsx`
- [ ] Add `style={{ fontVariant: ['tabular-nums'] }}` to duration Text in `src/components/MyRequestCard.tsx`
- [ ] Add `style={{ fontVariant: ['tabular-nums'] }}` to BrainLift sub-target Text in `app/(tabs)/ai.tsx`

---

## Phase 1.2 — Review

- [ ] Run spec-implementation-alignment check
- [ ] Run pr-review-toolkit:review-pr
- [ ] Address any review feedback
- [ ] Run test-optimiser
- [ ] All tests passing (run full suite)
- [ ] Update checklist.md: mark all tasks complete
- [ ] Update FEATURE.md changelog
