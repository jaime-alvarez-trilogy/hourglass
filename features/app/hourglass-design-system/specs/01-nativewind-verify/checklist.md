# Implementation Checklist

Spec: `01-nativewind-verify`
Feature: `hourglass-design-system`

---

## Phase 1.0: Test Foundation

### FR1: NativeWindSmoke component created
- [ ] Write snapshot/render test confirming `NativeWindSmoke` mounts without error
- [ ] Write test asserting `className` props are present on all rendered elements (no `style` props)
- [ ] Write test asserting correct className values: `bg-background`, `bg-surface`, `text-gold`, `text-textSecondary`, `bg-cyan`, `rounded-2xl`, `border-border`, `font-display`, `font-sans`
- [ ] Write test asserting text content "42.5" and "Hours This Week" are rendered
- [ ] Write test confirming no `StyleSheet.create()` is called (static analysis check or import audit)

### FR2: Smoke component mounted on home screen and verified
- [ ] Write test confirming `NativeWindSmoke` is imported in `app/(tabs)/index.tsx`
- [ ] Write test confirming `<NativeWindSmoke />` appears in the rendered output of `index.tsx`

### FR3: Verification result documented
- [ ] Write test/assertion confirming the `NATIVEWIND_VERIFIED` comment exists in `NativeWindSmoke.tsx`
- [ ] Write test confirming `MEMORY.md` contains `NATIVEWIND_VERIFIED` entry

---

## Test Design Validation (MANDATORY)

**Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: NativeWindSmoke component created
- [ ] Create `hourglassws/src/components/NativeWindSmoke.tsx`
- [ ] Implement component with full-screen `bg-background` container View
- [ ] Add inner card View with `bg-surface rounded-2xl p-5 border border-border`
- [ ] Add hero Text "42.5" with `text-gold font-display text-3xl`
- [ ] Add label Text "Hours This Week" with `text-textSecondary font-sans text-sm`
- [ ] Add cyan accent dot View with `bg-cyan w-3 h-3 rounded-full mt-2`
- [ ] Export component as default, typed `(): JSX.Element`
- [ ] Add comment block marking it as temporary smoke-test component
- [ ] Verify: zero `style={{}}` props, zero `StyleSheet.create()` calls

### FR2: Smoke component mounted on home screen and verified
- [ ] Import `NativeWindSmoke` in `hourglassws/app/(tabs)/index.tsx`
- [ ] Render `<NativeWindSmoke />` in the component output
- [ ] Run `npx expo start --clear` in `hourglassws/`
- [ ] Open app in Expo Go — confirm dark background (#0A0A0F) renders (not white)
- [ ] Confirm "42.5" appears in gold (#E8C97A)
- [ ] Confirm inner card has visibly rounded corners
- [ ] Confirm no Metro "Unknown class" or "NativeWind not found" warnings in terminal
- [ ] Confirm no runtime JS error overlay in Expo Go

### FR3: Verification result documented
- [ ] Add `// NATIVEWIND_VERIFIED: 2026-03-14 — className renders correctly in Expo Go` comment to top of `NativeWindSmoke.tsx`
- [ ] Add Expo SDK version line: `// Expo SDK 54, react-native 0.81.5, nativewind ^4.2.2`
- [ ] Update `memory/MEMORY.md` with `NATIVEWIND_VERIFIED=true` entry including date and SDK version
- [ ] If verification failed: document failure mode and fix applied in comment before marking verified

---

## Phase 1.2: Review (MANDATORY)

**DO NOT skip this phase.** All four steps are mandatory for every change.

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
- [ ] Commit fixes: `fix(01-nativewind-verify): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(01-nativewind-verify): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-14**: Spec created. NativeWind configuration confirmed correct per codebase exploration (metro.config.js, tailwind.config.js, babel.config.js, global.css, _layout.tsx). No ambiguities. Ready for implementation.
