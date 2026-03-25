# Spec Research: 02-android-hud-layout

## Problem Context

The Android widget has four rendering issues:

1. **Small widget is cramped**: Shows hours + pace badge (currently correct) but needs font weight fix and verification no earnings/remaining is shown.
2. **MediumWidget priority logic is misaligned**: Has FR7 "urgency mode" (isManager + urgency high/critical + pendingCount) but the spec now requires a cleaner 3-priority model: P1 (any manager + pending > 0), P2 (behind/critical pace), P3 (default). The current FR7 urgency mode is a subset of P1 with an extra urgency requirement — should activate for ALL managers with pending items, not only when urgency is also high/critical.
3. **Progress bars too thin + label issues**: `blProgressBar` SVG track is 8px internally but the label reads "BrainLift" correctly. Need to verify "AI Usage" label (not "AI") in all mode renderings and confirm minimum 8px track height.
4. **Font weight not explicit**: `TextWidget` elements rendering hero numbers don't specify `fontWeight: '700'`. Android falls back to Roboto Regular.

The "weird circles" issue does NOT apply to Android — `buildMeshSvg` uses a single `<rect fill="url(#linearGradient)"/>` with no circular shapes. `GlassPanel` uses a `FlexWidget` with borderRadius — no overlap artifacts.

---

## Exploration Findings

### Current Android SmallWidget (lines ~320–380, android/HourglassWidget.tsx)

```jsx
function SmallWidget({ data }) {
  return (
    <FlexWidget style={{ ...flex, backgroundColor: '#0D0C14' }}>
      <SvgWidget svg={buildMeshSvg(data.urgency, data.paceBadge)} ... />
      {/* hours hero */}
      <TextWidget text={data.hoursDisplay} style={{ fontWeight: '700', fontSize: 32 }} />
      {/* pace badge if present */}
      {badgeLabel(data.paceBadge) && <TextWidget text={badgeLabel(data.paceBadge)} ... />}
      {/* stale + manager pending */}
    </FlexWidget>
  );
}
```

`fontWeight: '700'` is already set on the hero in SmallWidget. No earnings shown. Assessment: SmallWidget is already correct; only verify label "AI" doesn't appear here.

### Current MediumWidget Priority Logic (lines ~385–550)

Four modes evaluated in order:

1. **Urgency Mode (FR7)**: `isManager && (urgency === 'high' || urgency === 'critical') && pendingCount > 0`
   → Shows deadline countdown hero + approval items list

2. **Action Mode**: `approvalItems.length > 0 || myRequests.length > 0` (non-urgency)
   → Shows compact hours + action items

3. **Pace Mode (P2, 04-cockpit-hud)**: `!actionMode && !isUrgencyMode && (paceBadge === 'behind' || paceBadge === 'critical')`
   → Shows ⚠ pace label + hours hero + hoursRemaining

4. **Hours Mode (default)**: standard
   → Dual glass panels + badge + today/AI% + BrainLift bar + bar chart

**Problem**: Urgency Mode and Action Mode are two separate cases that both handle approvals but with different triggers. The user's spec says P1 = any manager + pendingCount > 0, not just when urgency is also high/critical. The fix: merge Urgency Mode and Action Mode into a single P1 check: `isManager && pendingCount > 0`.

### Current Progress Bar (blProgressBar)

```javascript
export function blProgressBar(brainliftHours, targetHours, width) {
  const fillPct = Math.min((brainliftHours / targetHours) * 100, 100);
  const fillWidth = (fillPct / 100) * (width - 4);
  return (
    `<svg width="${width}" height="8" ...>` +
    `<rect ... height="8" rx="4" fill="#2A2A3A"/>` +  // track height = 8px ✓
    `<rect ... height="8" rx="4" fill="${...}"/>` +    // fill
    `</svg>`
  );
}
```

Track height is already 8px. But the label next to it reads "BrainLift: X.Xh / 5h" — that is correct. However, the "AI" metric text label in MediumWidget Hours Mode may read just "AI:" — needs to be "AI Usage:".

### buildMeshSvg (verified no circles)

```javascript
export function buildMeshSvg(urgency, paceBadge) {
  const stateColor = meshStateColor(urgency, paceBadge);
  return (
    `<svg ...>` +
    `<defs><linearGradient id="bg" ...>` +
    `<stop offset="0%" stop-color="#0D0C14"/>` +
    `<stop offset="50%" stop-color="${stateColor}" stop-opacity="0.15"/>` +
    `<stop offset="100%" stop-color="#0D0C14"/>` +
    `</linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#bg)"/>` +  // single rect, no circles
    `</svg>`
  );
}
```

No circles. No changes needed here.

### buildBarChartSvg (verified)

Returns `<rect>` bars with `<text>` day labels. No circles. Track height is bar height, not the 8px progress bar concern.

### Android Technical Constraints

- **FlexWidget / TextWidget / ImageWidget / SvgWidget only** — no `<View>`, `<Text>` from React Native
- **react-native-android-widget primitives**: `style` objects with snake_case-adjacent field names
- **No CSS grid / flex gaps**: use explicit margin/padding on children
- **SVG via SvgWidget**: pass SVG string. `<Circle>`, `<Rect>`, `<Ellipse>` all valid in SVG strings (not as React components)
- **No Skia / Reanimated / Expo SDK components**

### AI% Label Location

In MediumWidget Hours Mode, the "AI" label appears as part of the footer row:
```jsx
<TextWidget text={`AI: ${data.aiPct}`} style={...} />
```
This must change to `"AI Usage: {data.aiPct}"`.

In the Pace Mode footer:
```jsx
<TextWidget text={`${data.today}  ${data.weekDeltaEarnings}`} />
```
No AI% shown in Pace Mode — correct.

### Today Delta Fix

In Hours Mode footer row, the "Today" value shows `data.today` (raw hours). Should show `data.todayDelta` with fallback to `data.today`:

```javascript
var todayLabel = data.todayDelta ? data.todayDelta : data.today;
// renders as: "Today: +0.5h" or "Today: 1.5h" (fallback)
```

---

## Key Decisions

### Decision 1: Merge Urgency Mode + Action Mode into single P1

**Before:**
```javascript
var isUrgencyMode = props.isManager && (props.urgency === 'high' || props.urgency === 'critical') && props.pendingCount > 0;
var isActionMode = props.approvalItems.length > 0 || props.myRequests.length > 0;
```

**After:**
```javascript
function getPriority(data) {
  if (data.isManager && data.pendingCount > 0) return 'approvals';  // P1
  if (data.paceBadge === 'critical' || data.paceBadge === 'behind') return 'deficit'; // P2
  return 'default'; // P3
}
```

P1 activates for ALL managers with pending items, not just when urgency is also high/critical. This matches the iOS spec and the user's requirement.

Note: `myRequests` (contributor view) is separate — contributors never see P1. For contributors with rejected/pending requests, P3 default is shown (no special mode; the small badge in the footer handles this).

### Decision 2: P1 Approvals layout (Android Medium)

```
Background: #1C1400 (gold-tinted — actionBg from bridge)
Header:     "⚠ {pendingCount} PENDING" in critical/warning accent
Items:      up to 2 WidgetApprovalItem cards:
              {name}  {hours}  [{MANUAL|OT} badge]
Footer:     today's hours + deadline
```

This consolidates the old Urgency Mode and Action Mode (manager path) into one layout.

### Decision 3: P2 Deficit layout (keep 04-cockpit-hud logic, adjust trigger)

The existing Pace Mode (04-cockpit-hud) is already correct for P2 layout. The only change: remove the `!actionMode && !isUrgencyMode` guards since we're unifying the priority logic.

### Decision 4: P3 Today Delta

Change `AI: ${data.aiPct}` → `AI Usage: ${data.aiPct}` in Hours Mode footer.
Change `Today: ${data.today}` → `Today: ${data.todayDelta || data.today}` in Hours Mode footer.

### Decision 5: Font weight already set in SmallWidget

`fontWeight: '700'` is already on SmallWidget hero and most TextWidget elements. Audit MediumWidget Hours Mode — if hero TextWidget for hours/earnings is missing `fontWeight: '700'`, add it.

---

## Interface Contracts

### `getPriority(data: WidgetData): 'approvals' | 'deficit' | 'default'`

```typescript
// Input:
//   data.isManager: boolean ← WidgetData.isManager
//   data.pendingCount: number ← WidgetData.pendingCount
//   data.paceBadge: string ← WidgetData.paceBadge
// Output:
//   'approvals' if isManager && pendingCount > 0    (P1)
//   'deficit'   if paceBadge === 'critical' | 'behind' (P2)
//   'default'   otherwise                             (P3)
//
// Note: contributor with myRequests falls through to P3 (no special mode)
```

### Updated `MediumWidget`

```typescript
// Priority switch replaces isUrgencyMode/isActionMode/isPaceMode variables:
// P1 → approvals layout (merged urgency+action manager path)
// P2 → deficit layout (same as existing Pace Mode but without guard conditions)
// P3 → hours mode layout with:
//        - "AI Usage: {aiPct}" (not "AI: {aiPct}")
//        - todayDelta fallback: "Today: {todayDelta || today}"
```

### `blProgressBar` (no change to function)

Track height is already 8px. No changes needed to the function itself.

---

## Test Plan

### FR1: getPriority helper

**Signature:** `getPriority(data: WidgetData): 'approvals' | 'deficit' | 'default'`

**Happy Path:**
- [ ] isManager=true, pendingCount=2 → 'approvals'
- [ ] isManager=false, paceBadge='critical' → 'deficit'
- [ ] isManager=false, paceBadge='behind' → 'deficit'
- [ ] isManager=false, paceBadge='on_track' → 'default'

**Edge Cases:**
- [ ] isManager=true, pendingCount=0, paceBadge='critical' → 'deficit' (P1 needs pending > 0)
- [ ] isManager=true, urgency='critical', pendingCount=0 → 'deficit' (old urgency mode no longer applies without pending)
- [ ] paceBadge='crushed_it' → 'default'
- [ ] contributor (isManager=false) with myRequests → 'default' (not P1)

### FR2: MediumWidget P1 renders approvals

- [ ] Priority='approvals': renders pendingCount text
- [ ] Priority='approvals': renders approvalItems[0].name, approvalItems[0].hours
- [ ] Priority='approvals': does NOT render earnings text
- [ ] Priority='approvals': background tint matches actionBg or warning color

### FR3: MediumWidget P2 is unchanged Pace Mode

- [ ] Priority='deficit': renders hoursDisplay prominently
- [ ] Priority='deficit': renders hoursRemaining
- [ ] Priority='deficit': does NOT render AI usage text
- [ ] Priority='deficit': does NOT render bar chart SVG

### FR4: MediumWidget P3 label fixes

- [ ] Priority='default': "AI Usage:" label present (not "AI:")
- [ ] Priority='default': todayDelta shown when non-empty
- [ ] Priority='default': falls back to today when todayDelta is ""

### FR5: blProgressBar height (regression)

- [ ] blProgressBar SVG string contains `height="8"` on track rect
- [ ] blProgressBar SVG string contains `height="8"` on fill rect
- [ ] Fill width capped at (width - 4) for 100% brainlift

---

## Files to Reference

### Primary
- `src/widgets/android/HourglassWidget.tsx` — full file to modify
- `src/widgets/types.ts` — WidgetData, WidgetApprovalItem types
- `src/__tests__/widgets/android/HourglassWidget.test.tsx` — existing Android widget test patterns

### Patterns
- `src/widgets/ios/HourglassWidget.tsx` — iOS P1/P2/P3 priority logic (spec 01) — cross-reference
- `src/widgets/bridge.ts` — deriveActionBg() for P1 background tint color

### Design tokens (04-cockpit-hud desaturated palette)
- `PACE_COLORS`: luxuryGold `#CEA435`, successGreen `#4ADE80`, warnAmber `#FCD34D`, desatCoral `#F87171`
- P1 background: `#1C1400` (existing actionBg for manager approvals)
- P2 background tint: no change (existing Pace Mode bg)
