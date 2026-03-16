# Spec Research — 01-color-semantics

## Problem Context

Five specific colour violations were identified across two gauntlet runs. Each involves a brand token being applied to the wrong semantic context. The brand rule is strict: **gold = money/earnings only**, **violet = interactive accents**, **success/warning/critical = status only**, **destructive = irreversible operations**.

## Exploration Findings

### Violation 1 — ApprovalCard: Manual badge uses gold

**File:** `src/components/ApprovalCard.tsx` lines 83–84
```tsx
<View className="bg-gold/20 rounded-full px-2 py-0.5 ml-2">
  <Text className="text-gold text-xs font-sans-medium">Manual</Text>
</View>
```
**Why it's wrong:** Gold is exclusively for money/earnings per brand guidelines. A "Manual" type badge is a category label, not a monetary value.
**Fix:** Use `violet/20 text-violet` — violet is the interactive/accent colour for non-monetary UI elements.

### Violation 2 — ApprovalCard: Approve button uses success green

**File:** `src/components/ApprovalCard.tsx` line 116
```tsx
<AnimatedPressable className="flex-1 py-1.5 rounded-xl bg-success/20 items-center" ...>
  <Text className="text-success text-sm font-sans-medium">Approve</Text>
```
**Why it's wrong:** Success green means "on-track status" per brand guidelines. Interactive action buttons should use `violet` (interactive accent). Run-002 synthesis explicitly: "Approve/Reject buttons need violet/red".
**Fix:** Approve → `violet/20 text-violet`. Reject stays `destructive/20 text-destructive` (correct per guidelines: destructive = irreversible operations).

### Violation 3 — Overview snapshot: hours value always success green

**File:** `app/(tabs)/overview.tsx` line 252
```tsx
<Text style={{ color: colors.success, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
```
This is the "Weekly Hours" metric in the week-snapshot panel. It uses a fixed `success` colour regardless of whether the week's hours were actually on-track.
**Why it's wrong:** Run-002: "green on 2.0h weekly (should be critical red)". A week with 2h should not display as green.
**Fix:** Compute a status-aware colour at render time based on hours vs. (weeklyLimit × daysInWeek/5). Use `colors.critical` for < 60% pace, `colors.warning` for 60–84%, `colors.success` for 85%+. Since this is a historical snapshot (not live), use a simple fraction: `hours / weeklyLimit`. ≥ 0.85 → success, 0.60–0.84 → warning, < 0.60 → critical.

### Violation 4 — Settings modal Switch without brand tint

**File:** `app/modal.tsx` (lines 91, 105 — `<Switch>` without `trackColor`)
iOS `Switch` defaults to system blue for the active state. This was seen as a "gold toggle" in run-001 (~2s), suggesting the system default may have appeared as an off-brand colour.
**Fix:** Add `trackColor={{ false: colors.border, true: colors.violet }}` and `thumbColor={colors.textPrimary}` to both Switch components.

### Violation 5 — AI tab: "Building Momentum" tier uses gold

**File:** `app/(tabs)/ai.tsx` line 59
```ts
if (avg >= 30) return { label: 'Building Momentum', color: colors.gold };
```
Gold is money-only. "Building Momentum" is a performance tier label, not a monetary value.
**Fix:** Use `colors.warning` (#F59E0B) — amber is appropriate for "making progress but not yet there", aligning with the brand's "behind-pace" caution semantic.

## Key Decisions

1. **Manual badge colour → violet, not success**: Violet is the brand's interactive/category accent. Manual time is a submission type, not a status.
2. **Approve → violet**: Action buttons use interactive accent. Only Reject/irreversible uses destructive red.
3. **Overview hours colour → computed**: Snapshot panel should reflect the historical truth of each week, not assume everything is positive.
4. **Switch → violet**: All interactive toggles use violet per the interactive accent rule.
5. **Building Momentum → warning**: Amber correctly signals "progressing but below target".

## Interface Contracts

### `computeSnapshotHoursColor(hours: number, weeklyLimit: number): string`
```typescript
// Returns a colors.ts hex value based on hours vs. limit
// hours: actual hours for the week
// weeklyLimit: user's configured weekly target
// Returns: colors.success | colors.warning | colors.critical
```
**Source:** Computed inline from `hours` (Overview snapshot data) and `weeklyLimit` (from config)

### ApprovalCard changes (no new types — className changes only)
- `bg-gold/20 → bg-violet/20`, `text-gold → text-violet` on Manual badge
- `bg-success/20 → bg-violet/20`, `text-success → text-violet` on Approve button

### Settings Switch (no new types — props changes only)
- Add `trackColor`, `thumbColor` to both `<Switch>` elements in `modal.tsx`

## Test Plan

### computeSnapshotHoursColor (inline function or helper)
**Signature:** `(hours: number, weeklyLimit: number) => string`

**Happy Path:**
- [ ] 40h / 40h limit → `colors.success`
- [ ] 34h / 40h limit (85%) → `colors.success`
- [ ] 30h / 40h limit (75%) → `colors.warning`
- [ ] 24h / 40h limit (60%) → `colors.warning`
- [ ] 20h / 40h limit (50%) → `colors.critical`
- [ ] 0h / 40h limit → `colors.critical`

**Edge Cases:**
- [ ] weeklyLimit = 0 → `colors.success` (no target, not behind)
- [ ] hours > weeklyLimit → `colors.success` (overtime counts as on-track)

### ApprovalCard colour assertions (source-level tests)
- [ ] Source does NOT contain `bg-gold` (Manual badge fixed)
- [ ] Source DOES contain `bg-violet/20` for Manual badge
- [ ] Source does NOT contain `bg-success/20` on Approve button
- [ ] Source DOES contain `bg-violet/20` on Approve button
- [ ] Source still contains `bg-destructive/20` on Reject button (unchanged)

### Settings Switch assertions (source-level)
- [ ] Source contains `trackColor` with `colors.violet`

### AI tab tier colours (source-level)
- [ ] Building Momentum uses `colors.warning`, not `colors.gold`

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ApprovalCard.tsx` | Manual badge + Approve button colour |
| `app/(tabs)/overview.tsx` | Hours metric status-aware colour |
| `app/modal.tsx` | Switch trackColor/thumbColor |
| `app/(tabs)/ai.tsx` | Building Momentum tier colour |

## Files to Reference

- `src/lib/colors.ts` — all brand hex values
- `BRAND_GUIDELINES.md` — colour usage rules
- `gauntlet-runs/video/run-002-2026-03-16/synthesis.md` — specific violations
