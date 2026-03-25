# Spec Research: 01-ios-hud-layout

## Problem Context

The iOS widget has five rendering issues against the user's requirements:

1. **Small widget is cramped**: Shows hours + earnings + hoursRemaining + pace badge — too many data points for 150×150pt. Fix: hero hours number + pace badge only.
2. **No priority modes**: All three sizes render the same layout regardless of urgency or pending approvals. Fix: P1 (approvals), P2 (deficit), P3 (default) conditional layouts.
3. **Font falls back to system default**: Hero numbers don't specify `design: 'monospaced'` or `weight: 'heavy'`. Fix: explicit font attributes on all metric text.
4. **"Today" row repeats hoursRemaining**: When `todayDelta` is derived from remaining hours it shows the same number under two different labels. Fix: show `todayDelta` as "±X.Xh vs avg".
5. **Large bottom clips**: Progress bars (`AI Usage`, BrainLift) at the bottom of Large are cut off by OS. Fix: increase bottom padding from 16pt to 28pt; minimum 8pt bar height; label fixes ("AI Usage", "Limit").

---

## Exploration Findings

### Current SmallWidget (lines 115–162, ios/HourglassWidget.tsx)

```jsx
function SmallWidget({ props }) {
  return (
    <ZStack>
      <Rectangle fill="#0D0C14" />
      <Rectangle fill={tint} />
      <VStack padding={12}>
        <Text font={{ size: 28, weight: 'bold' }} foregroundStyle={accent}>
          {props.hoursDisplay}       // hours total ✓
        </Text>
        <Spacer />
        {PACE_LABELS[props.paceBadge] && (
          <Text font={{ size: 12 }} foregroundStyle={accent}>
            {PACE_LABELS[props.paceBadge]}  // pace badge ✓
          </Text>
        )}
        {isStale && <Text>Cached: ...</Text>}
        {props.isManager && props.pendingCount > 0 && (
          <Text font={{ size: 11 }} foregroundStyle="#FF3B30">
            {props.pendingCount} pending   // pendingCount badge ✓
          </Text>
        )}
      </VStack>
    </ZStack>
  );
}
```

**Assessment**: SmallWidget is already close to correct — it does NOT show earnings or hoursRemaining. It shows hours, pace badge, stale, and manager pending badge. The only issue is the font spec (no `design: 'monospaced'`).

### Current MediumWidget (lines 167–232)

Shows: two glass cards (hours + earned) + today/AI% bottom row + stale + manager badge.

**No priority logic** — same layout always. Should have P1 (approvals focus), P2 (deficit), P3 (default with todayDelta).

The "Today: {props.today}" in the bottom row uses raw hours for today, not `todayDelta`. This is the repetition issue.

### Current LargeWidget (lines 238–320)

Shows: hero row (glass cards) + bar chart + stats (today/todayDelta, AI%/BrainLift) + manager badge + stale.

`padding={16}` on outer VStack — the OS clips ~12pt from the bottom edge, hiding the last progress bar.

Progress bars: not present in the current Large iOS widget — only the bar chart and text stats rows are shown. The "AI Usage" bar mentioned by user refers to future work OR Android's `blProgressBar`. iOS Large currently uses plain Text for AI% and BrainLift.

**Assessment**: iOS Large doesn't actually have visible progress bars — it shows "AI usage: {aiPct}" as a Text row. So the "too thin bars" complaint likely applies more to Android. For iOS, the fix is:
- Add bottom padding (28pt) to prevent clipping
- Keep AI% and BrainLift as text rows (no progress bar SVG in iOS widget)
- Label them "AI Usage" and "BrainLift" (current labels look fine)

### Available iOS Primitives Confirmed

From `@expo/ui/swift-ui` type definitions:
- `VStack`, `HStack`, `ZStack`, `Spacer`, `Group`
- `Text`, `Rectangle`, `RoundedRectangle`, `Ellipse`, `Capsule`, `Circle`
- `GlassEffectContainer`, `AccessoryWidgetBackground`
- `Gauge`, `ProgressView`

**No `LinearGradient` component** — confirmed not in the type definitions. Current two-Rectangle approach is the correct pattern.

**`Gauge` and `ProgressView` are available** — could be used for AI% arc or progress if desired, but current spec stays with text rows.

### iOS Technical Constraints

**ES5 syntax**: The expo-widgets plugin compiles TSX to a JS string evaluated in a JSContext. Current codebase uses TypeScript with `const`, `let`, arrow functions — and tests pass. This means the current compilation pipeline handles this correctly. No ES5 rewrite needed. If the compiled output causes issues, use `var`/`function` as fallback.

**No LinearGradient**: Use `.foregroundStyle({ type: 'linearGradient', ... })` modifier or the current two-Rectangle ZStack (already used). Never import `LinearGradient` from expo-linear-gradient in the widget file.

### WidgetData Fields Available (confirmed from types.ts)

All fields needed exist:
- `hoursDisplay`: "18.5h" ← hours total for hero
- `earnings`: "$925" ← earnings for P3
- `today`: "1.5h" ← today's raw hours
- `todayDelta`: "+0.5h" or "-1.2h" or "" ← delta vs daily average
- `hoursRemaining`: "21.5h left" or "0.5h OT" ← hours remaining to 40h
- `aiPct`: "72%" ← AI usage
- `brainlift`: "3.5h" ← BrainLift hours
- `paceBadge`: 'on_track' | 'behind' | 'critical' | 'crushed_it' | 'none'
- `urgency`: 'none' | 'low' | 'high' | 'critical' | 'expired'
- `isManager`: boolean
- `pendingCount`: number (0 for contributors)
- `approvalItems`: WidgetApprovalItem[] (max 3, empty for contributors)
- `weekDeltaEarnings`: "+$84" or "-$136" or ""
- `daily`: WidgetDailyEntry[] (7 entries Mon–Sun)

---

## Key Decisions

### Decision 1: Priority helper function

Compute priority mode once at the top of each widget component:

```typescript
function getPriority(props: WidgetData): 'approvals' | 'deficit' | 'default' {
  if (props.isManager && props.pendingCount > 0) return 'approvals';
  if (props.paceBadge === 'critical' || props.paceBadge === 'behind') return 'deficit';
  return 'default';
}
```

Called from both Medium and Large. Small always shows the same layout (no priority branching — just hero number).

### Decision 2: SmallWidget font only (no layout change)

SmallWidget already shows only hours + pace badge + manager pending + stale. The only needed change is font: `{ size: 28, weight: 'heavy', design: 'monospaced' }` on the hero number.

### Decision 3: P1 Approvals layout (Medium + Large)

When `priority === 'approvals'`:
```
[accent] PENDING APPROVALS header
{pendingCount} items requiring action
── separator ──
[for each approvalItem (max 2 on Medium, max 3 on Large)]:
  {name}    {hours}  [{MANUAL|OT} badge]
```
Background tint uses `'#FF6B0020'` (high/critical orange) to signal urgency.

No earnings card, no AI%, no bar chart.

### Decision 4: P2 Deficit layout (Medium + Large)

When `priority === 'deficit'`:
```
⚠ {PACE_LABELS[paceBadge]} header (critical red or warning amber)
[big] {hoursDisplay}h this week
[sub] {hoursRemaining} to reach 40h
──
today: {today}  |  {weekDeltaEarnings}
```
Stripped to essentials. No earnings card, no AI%, no BrainLift, no bar chart on Large.

### Decision 5: P3 Default layout (unchanged structure, fix Today row)

When `priority === 'default'` (existing layout):
- Medium: two glass cards (hours + earned) + bottom row shows `todayDelta` instead of `today`
- Large: hero row + bar chart + stats (use `todayDelta` in Today row)

The label changes from `"Today: {props.today}"` to `"Today: {props.todayDelta || props.today}"` — falls back to raw `today` if delta is empty (Monday / no average).

### Decision 6: Large bottom padding

Change `<VStack padding={16}>` to `<VStack padding={{ top: 16, leading: 16, trailing: 16, bottom: 28 }}>`.

Rationale: OS clips ~12pt from the bottom of Large widgets. 28pt ensures the last text row clears the safe zone.

### Decision 7: iOS does not have SVG progress bars

iOS Large currently shows AI% and BrainLift as plain `Text` rows, not progress bars. No `blProgressBar` SVG is used on iOS. The "minimum 8pt track height" and "AI Usage/Limit labels" fixes apply to Android (spec 02). For iOS, label "AI usage:" stays as-is — it's already a text label, not a bar.

---

## Interface Contracts

All data comes from existing `WidgetData` fields. No new types.

### `getPriority(props: WidgetData): 'approvals' | 'deficit' | 'default'`

```typescript
// Returns the priority mode for Medium/Large widgets
// Inputs:
//   props.isManager: boolean ← WidgetData.isManager
//   props.pendingCount: number ← WidgetData.pendingCount
//   props.paceBadge: string ← WidgetData.paceBadge
// Output:
//   'approvals' if isManager && pendingCount > 0
//   'deficit'   if paceBadge === 'critical' || paceBadge === 'behind'
//   'default'   otherwise
```

### Updated `SmallWidget`

```typescript
// Only change: hero number font
// Before: font={{ size: 28, weight: 'bold' }}
// After:  font={{ size: 28, weight: 'heavy', design: 'monospaced' }}
```

### Updated `MediumWidget`

```typescript
// Priority branching:
// P1: approvals layout — pendingCount, up to 2 approvalItems
// P2: deficit layout — hoursDisplay + hoursRemaining, weekDeltaEarnings
// P3: default layout — glass cards (hours + earned) + todayDelta row
//
// Today row fix:
// Before: "Today: {props.today}"
// After:  "Today: {props.todayDelta || props.today}"
//
// Hero font: weight: 'heavy', design: 'monospaced'
```

### Updated `LargeWidget`

```typescript
// Priority branching:
// P1: approvals layout — pendingCount, up to 3 approvalItems
// P2: deficit layout — hoursDisplay + hoursRemaining (stripped)
// P3: default layout — hero row + bar chart + todayDelta row
//
// Bottom padding: { top: 16, leading: 16, trailing: 16, bottom: 28 }
// Hero font: weight: 'heavy', design: 'monospaced'
```

---

## Test Plan

### FR1: getPriority helper

**Signature:** `getPriority(props: WidgetData): 'approvals' | 'deficit' | 'default'`

**Happy Path:**
- [ ] isManager=true, pendingCount=3 → 'approvals'
- [ ] isManager=false, paceBadge='critical' → 'deficit'
- [ ] isManager=false, paceBadge='behind' → 'deficit'
- [ ] isManager=false, paceBadge='on_track' → 'default'
- [ ] isManager=true, pendingCount=0, paceBadge='behind' → 'deficit'

**Edge Cases:**
- [ ] isManager=true, pendingCount=0, paceBadge='on_track' → 'default' (P1 only triggers if pending > 0)
- [ ] paceBadge='crushed_it' → 'default'
- [ ] paceBadge='none' → 'default'

### FR2: SmallWidget font

- [ ] Hero `Text` has `weight: 'heavy'` (not 'bold')
- [ ] Hero `Text` has `design: 'monospaced'`

### FR3: MediumWidget priority layouts

**P1 (approvals):**
- [ ] Contains pendingCount text
- [ ] Contains approval item names from approvalItems[0], [1]
- [ ] Does NOT contain earnings card
- [ ] Background tint is orange (high urgency)

**P2 (deficit):**
- [ ] Contains hoursDisplay text
- [ ] Contains hoursRemaining text
- [ ] Does NOT contain earnings card
- [ ] Does NOT contain AI% text

**P3 (default):**
- [ ] Contains two ZStack glass cards (hours + earned)
- [ ] Bottom row contains todayDelta text (when non-empty)
- [ ] Falls back to raw today hours when todayDelta is ""

### FR4: LargeWidget priority layouts + padding

- [ ] P1 layout shows up to 3 approvalItems
- [ ] P2 layout shows hoursRemaining, no bar chart
- [ ] P3 layout shows bar chart
- [ ] Outer VStack bottom padding = 28 (or equivalent padding object)

### FR5: Today row uses todayDelta

- [ ] MediumWidget P3: today row shows todayDelta when it is non-empty
- [ ] MediumWidget P3: today row shows props.today when todayDelta is ""
- [ ] LargeWidget P3: same fallback logic

---

## Files to Reference

### Primary
- `src/widgets/ios/HourglassWidget.tsx` — full file to modify
- `src/widgets/types.ts` — WidgetData, WidgetApprovalItem types
- `src/__tests__/widgets/widgetVisualIos.test.ts` — existing iOS widget test patterns

### Patterns
- `src/widgets/android/HourglassWidget.tsx` — Android P1/P2/P3 priority logic (FR7 urgency mode) as reference for how to structure conditional rendering
- `src/widgets/bridge.ts` — computeTodayDelta() logic (line ~180) for test fixture understanding

### Design tokens
- URGENCY_ACCENT: `{ none: '#00FF88', low: '#F5C842', high: '#FF6B00', critical: '#FF2D55', expired: '#6B6B6B' }`
- Desaturated palette (04-cockpit-hud): critical `#F87171`, behind `#FCD34D`, on_track `#4ADE80`, crushed_it `#CEA435`
- Card: CARD_BG `#1F1E2C`, CARD_BORDER `#2F2E41`
