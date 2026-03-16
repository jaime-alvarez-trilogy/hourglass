# 01-color-semantics — Brand Colour Semantic Fixes

**Status:** Draft
**Created:** 2026-03-16
**Last Updated:** 2026-03-16
**Owner:** @trilogy

---

## Overview

### What Is Being Built

Five targeted colour-semantic fixes across four files in the Hourglass Expo app. Each fix corrects a brand token being applied to the wrong semantic context — a class of violation identified across two UX Gauntlet video runs (run-001 2026-03-15, run-002 2026-03-16).

The brand token contract is strict:
- **gold** — money/earnings values only
- **violet** — interactive accents (buttons, toggles, category labels)
- **success / warning / critical** — on-track / behind / urgent status only
- **destructive** — irreversible operations only

### Violations Being Fixed

| # | File | Element | Current (Wrong) | Correct |
|---|------|---------|-----------------|---------|
| V1 | `src/components/ApprovalCard.tsx` | "Manual" type badge | `gold` | `violet` |
| V2 | `src/components/ApprovalCard.tsx` | Approve action button | `success` | `violet` |
| V3 | `app/(tabs)/overview.tsx` | Weekly hours snapshot value | fixed `success` | computed status colour |
| V4 | `app/modal.tsx` | Settings `<Switch>` active track | system blue (unbranded) | `violet` |
| V5 | `app/(tabs)/ai.tsx` | "Building Momentum" tier | `gold` | `warning` |

### How It Works

- **V1–V2 (ApprovalCard):** Pure className substitution. No logic change.
- **V3 (Overview):** Inline colour computation based on `hours / weeklyLimit` ratio at render time.
  - ≥ 85% → `colors.success`, 60–84% → `colors.warning`, < 60% → `colors.critical`
  - When `weeklyLimit = 0`, return `colors.success` (no target configured)
  - When `hours > weeklyLimit`, clamp to `colors.success` (overtime is on-track)
- **V4 (Settings Switch):** Add `trackColor` and `thumbColor` props to both `<Switch>` elements.
- **V5 (AI tab):** Swap `colors.gold` → `colors.warning` in the tier colour lookup.

No new components, hooks, or data fetches are introduced. All changes are purely presentational.

---

## Out of Scope

1. **Auth screen colour usage** — Descoped: Auth screens (setup, credentials, welcome) intentionally use gold for CTAs per brand guidelines. No changes to auth flows.

2. **Any other colour tokens not in the five violations** — Descoped: This spec addresses only the five violations identified in run-001 and run-002. Additional colour audits belong in a separate spec.

3. **Dark-glass / BlurView wiring** — Deferred to 02-dark-glass: Translucent card backgrounds and blur effects are a separate spec with independent scope.

4. **Motion / AnimatedPressable wiring** — Deferred to 03-motion-universality: Press-feedback and stagger animations are tracked separately.

5. **Chart line weight and glow** — Deferred to 04-chart-polish: TrendSparkline stroke and WeeklyBarChart polish are handled in 04-chart-polish.

6. **Dynamic theme switching** — Descoped: The app currently uses a fixed dark theme. Light-mode colour semantics are out of scope.

7. **Approval card Reject button** — Descoped: The Reject button currently uses `destructive/20 text-destructive`, which is correct per brand guidelines. No change needed.

---

## Functional Requirements

### FR1 — ApprovalCard Manual Badge: gold → violet

Fix the "Manual" type badge in `ApprovalCard.tsx` to use `violet` instead of `gold`.

**Success Criteria:**
- The Manual badge container uses `bg-violet/20` (not `bg-gold/20`)
- The Manual badge text uses `text-violet` (not `text-gold`)
- The source file does NOT contain `bg-gold` anywhere in the badge context
- Visual appearance: purple/indigo tint badge, matching the interactive accent brand token

---

### FR2 — ApprovalCard Approve Button: success → violet

Fix the Approve action button in `ApprovalCard.tsx` to use `violet` instead of `success`.

**Success Criteria:**
- The Approve button container uses `bg-violet/20` (not `bg-success/20`)
- The Approve button text uses `text-violet` (not `text-success`)
- The Reject button remains unchanged at `bg-destructive/20 text-destructive`
- The source file does NOT contain `bg-success/20` in the Approve button context

---

### FR3 — Overview Snapshot Hours: fixed success → computed status colour

Replace the hardcoded `colors.success` colour on the weekly hours snapshot value with a computed status colour based on the ratio of actual hours to the configured weekly limit.

**Success Criteria:**
- A helper function `computeSnapshotHoursColor(hours: number, weeklyLimit: number): string` is defined
- `hours / weeklyLimit >= 0.85` → returns `colors.success`
- `hours / weeklyLimit >= 0.60 && < 0.85` → returns `colors.warning`
- `hours / weeklyLimit < 0.60` → returns `colors.critical`
- `weeklyLimit === 0` → returns `colors.success` (no target configured)
- `hours > weeklyLimit` → returns `colors.success` (overtime is on-track)
- The weekly hours `<Text>` in the overview snapshot panel uses this computed value instead of `colors.success`

---

### FR4 — Settings Switch: add violet trackColor

Add branded `trackColor` and `thumbColor` props to both `<Switch>` elements in `app/modal.tsx`.

**Success Criteria:**
- Both `<Switch>` elements have `trackColor={{ false: colors.border, true: colors.violet }}`
- Both `<Switch>` elements have `thumbColor={colors.textPrimary}`
- The `colors` object is imported from `src/lib/colors.ts` in `modal.tsx`
- No system-default blue is used for the active switch state

---

### FR5 — AI Tab "Building Momentum" Tier: gold → warning

Fix the "Building Momentum" performance tier in `app/(tabs)/ai.tsx` to use `colors.warning` instead of `colors.gold`.

**Success Criteria:**
- The "Building Momentum" tier returns `colors.warning` (not `colors.gold`)
- No other tier colours are changed
- The source does NOT contain `colors.gold` in the tier colour lookup for "Building Momentum"

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/lib/colors.ts` | Brand hex values: `gold`, `violet`, `success`, `warning`, `critical`, `border`, `textPrimary` |
| `hourglassws/BRAND_GUIDELINES.md` | Colour semantic rules |
| `hourglassws/gauntlet-runs/video/run-002-2026-03-16/synthesis.md` | Specific violation callouts |

### Files to Modify

| File | FR | Change Description |
|------|----|--------------------|
| `hourglassws/src/components/ApprovalCard.tsx` | FR1, FR2 | Manual badge: `bg-gold/20 text-gold` → `bg-violet/20 text-violet`; Approve button: `bg-success/20 text-success` → `bg-violet/20 text-violet` |
| `hourglassws/app/(tabs)/overview.tsx` | FR3 | Add `computeSnapshotHoursColor` helper; replace `colors.success` with computed colour on the weekly hours `<Text>` |
| `hourglassws/app/modal.tsx` | FR4 | Add `trackColor` and `thumbColor` to both `<Switch>` elements; import `colors` if not already imported |
| `hourglassws/app/(tabs)/ai.tsx` | FR5 | Change `colors.gold` → `colors.warning` for the "Building Momentum" tier |

### Data Flow

**FR1, FR2 (ApprovalCard):** No data flow change. Pure className string substitution.

**FR3 (Overview):**
```
weekSnapshot.hours (number) + config.weeklyLimit (number)
         ↓
computeSnapshotHoursColor(hours, weeklyLimit)
         ↓
returns colors.success | colors.warning | colors.critical
         ↓
<Text style={{ color: computed }}>
```

The helper should be defined at module level (or as a local const above the component) in `overview.tsx`. It does not need to be exported — it is only used within this file.

**FR4 (Settings Switch):**
```
colors.violet (brand token)
colors.border (brand token)
colors.textPrimary (brand token)
         ↓
<Switch trackColor={{ false: colors.border, true: colors.violet }}
        thumbColor={colors.textPrimary} />
```

`colors` import: check whether `modal.tsx` already imports from `src/lib/colors.ts`. If not, add the import.

**FR5 (AI tab):**
```ts
// Before
if (avg >= 30) return { label: 'Building Momentum', color: colors.gold };
// After
if (avg >= 30) return { label: 'Building Momentum', color: colors.warning };
```

### Edge Cases

| Case | Behaviour |
|------|-----------|
| `weeklyLimit = 0` in FR3 | Return `colors.success` (guard against divide-by-zero; no target = not behind) |
| `hours > weeklyLimit` in FR3 | Ratio > 1.0; clamp to `colors.success` (working overtime counts as on-track) |
| `hours = 0, weeklyLimit = 0` in FR3 | Both zero → `colors.success` (same guard) |
| Multiple `<Switch>` in modal.tsx | Apply `trackColor`/`thumbColor` to ALL `<Switch>` elements (confirmed 2 at lines 91 and 105) |

### Test File Locations

| File | FRs Covered |
|------|-------------|
| `hourglassws/src/components/__tests__/ApprovalCard.colorSemantics.test.tsx` | FR1, FR2 |
| `hourglassws/src/lib/__tests__/computeSnapshotHoursColor.test.ts` | FR3 |
| `hourglassws/app/__tests__/modal.colorSemantics.test.tsx` | FR4 |
| `hourglassws/app/(tabs)/__tests__/ai.colorSemantics.test.ts` | FR5 |

Source-level tests (FR1, FR2, FR4, FR5) use `fs.readFileSync` to assert that the source strings contain or do not contain specific class/prop patterns. This avoids needing to render components with NativeWind in a Jest environment.

FR3 tests are pure unit tests of the helper function with no rendering required.
