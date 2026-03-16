# Checklist: 01-design-tokens

**Spec:** [spec.md](spec.md)
**Feature:** brand-polish

---

## Phase 1.0 — Tests (Red Phase)

Write failing tests before any implementation. All tests must be red before Phase 1.1 begins.

### FR1: colors.ts updated
- [ ] Test: `colors.background === '#0D0C14'`
- [ ] Test: `colors.surface === '#16151F'`
- [ ] Test: `colors.surfaceElevated === '#1F1E29'`
- [ ] Test: `colors.border === '#2F2E41'`
- [ ] Test: `colors.goldBright === '#FFDF89'` (new key exists)
- [ ] Test: `colors.cyan === '#00C2FF'`
- [ ] Test: `colors.gold === '#E8C97A'` (unchanged)
- [ ] Test: `colors.violet === '#A78BFA'` (unchanged)
- [ ] Test: `colors.success === '#10B981'` (unchanged)

### FR2: tailwind.config.js synced
- [ ] Test: `tailwindConfig.theme.extend.colors.background === '#0D0C14'`
- [ ] Test: `tailwindConfig.theme.extend.colors.surface === '#16151F'`
- [ ] Test: `tailwindConfig.theme.extend.colors.surfaceElevated === '#1F1E29'`
- [ ] Test: `tailwindConfig.theme.extend.colors.border === '#2F2E41'`
- [ ] Test: `tailwindConfig.theme.extend.colors.goldBright === '#FFDF89'`
- [ ] Test: `tailwindConfig.theme.extend.colors.cyan === '#00C2FF'`

### FR3: Switch toggles fixed
- [ ] Test: `modal.tsx` source does not contain `trackColor={{ false: '#2A2A3D', true: '#E8C97A' }}`
- [ ] Test: `modal.tsx` source contains `colors.violet` for switch true state
- [ ] Test: `modal.tsx` source contains `colors.border` for switch false state

### FR4: Modal background tokenized
- [ ] Test: `modal.tsx` source does not contain `'#0D1117'`
- [ ] Test: `modal.tsx` source contains `colors.background` in StyleSheet

---

## Phase 1.1 — Implementation (Green Phase)

Make the failing tests pass. Implement minimum code required.

### FR1: Update colors.ts
- [ ] Update `background` to `#0D0C14`
- [ ] Update `surface` to `#16151F`
- [ ] Update `surfaceElevated` to `#1F1E29`
- [ ] Update `border` to `#2F2E41`
- [ ] Add `goldBright: '#FFDF89'`
- [ ] Update `cyan` to `#00C2FF`
- [ ] Verify all other tokens unchanged
- [ ] Commit: `test(FR1): add colors.ts value tests`
- [ ] Run FR1 tests — all pass

### FR2: Update tailwind.config.js
- [ ] Update `background` to `#0D0C14`
- [ ] Update `surface` to `#16151F`
- [ ] Update `surfaceElevated` to `#1F1E29`
- [ ] Update `border` to `#2F2E41`
- [ ] Add `goldBright: '#FFDF89'`
- [ ] Update `cyan` to `#00C2FF`
- [ ] Commit: `feat(FR1): update colors.ts to v1.1 palette`
- [ ] Run FR2 tests — all pass

### FR3: Fix Switch trackColors in modal.tsx
- [ ] Add `import { colors } from '@/src/lib/colors'` to modal.tsx
- [ ] Replace `trackColor={{ false: '#2A2A3D', true: '#E8C97A' }}` (line ~81) with `trackColor={{ false: colors.border, true: colors.violet }}`
- [ ] Replace `trackColor={{ false: '#2A2A3D', true: '#E8C97A' }}` (line ~95) with `trackColor={{ false: colors.border, true: colors.violet }}`
- [ ] Commit: `feat(FR2): sync tailwind.config.js with v1.1 palette`
- [ ] Run FR3 tests — all pass

### FR4: Tokenize modal.tsx background
- [ ] Replace `backgroundColor: '#0D1117'` (line ~115) with `backgroundColor: colors.background`
- [ ] Verify `colors` import is present (added in FR3 step)
- [ ] Commit: `feat(FR3): fix Switch trackColor from gold to violet in modal`
- [ ] Commit: `feat(FR4): tokenize modal background color`
- [ ] Run all tests — all pass

---

## Phase 1.2 — Review

Sequential gates — do not parallelize.

- [ ] Run `spec-implementation-alignment` agent to verify implementation matches spec
- [ ] Run `pr-review-toolkit:review-pr` skill
- [ ] Address any feedback from review
- [ ] Run `test-optimiser` agent to review test quality
- [ ] Final test run — all tests passing
- [ ] Update this checklist with session notes

---

## Session Notes

_To be filled in after execution._
