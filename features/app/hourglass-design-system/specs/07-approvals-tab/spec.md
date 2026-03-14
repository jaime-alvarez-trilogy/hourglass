# 07-approvals-tab

**Status:** Draft
**Created:** 2026-03-14
**Last Updated:** 2026-03-14
**Owner:** @trilogy

---

## Overview

### What Is Being Built

This spec migrates the Approvals tab (`app/(tabs)/approvals.tsx`) and its two supporting
components (`ApprovalCard`, `RejectionSheet`) from `StyleSheet.create()` + hardcoded hex
to the Hourglass design system: NativeWind v4 className tokens, the `Card` base component,
`SkeletonLoader`, and design tokens from `tailwind.config.js`.

The screen is manager-only. Contributors are immediately redirected to the hours tab.
Three screen states must be handled:

1. **Loading** — SkeletonLoader placeholder cards during data fetch
2. **Empty** — "All clear" Card with affirming copy
3. **Items** — FlatList of swipeable `ApprovalCard` rows + "Approve All" button

### Gesture Architecture Decision

`ApprovalCard` uses `PanResponder` + core `Animated` API for swipe-to-approve/reject
gestures. This is **intentionally kept** — migrating to Reanimated Gesture API requires
react-native-gesture-handler wrappers and is out of scope for a styling migration spec.
All _visual_ styling (colors, radii, backgrounds, typography) is migrated to NativeWind
className. A comment in the source file marks the gesture exception.

### Contributor Redirect

When `config.isManager === false`, the screen renders a dark glass empty state with a
"This screen is for managers" message instead of a blank flash. The role guard
`useEffect` still redirects via `router.replace('/(tabs)')`.

### Components Updated

| Component | Change |
|-----------|--------|
| `app/(tabs)/approvals.tsx` | Remove StyleSheet; NativeWind layout; Card/SkeletonLoader integration |
| `src/components/ApprovalCard.tsx` | Keep PanResponder; replace all StyleSheet styles with className |
| `src/components/RejectionSheet.tsx` | Dark glass aesthetic; NativeWind className throughout |

No new hooks. No new API calls. `useApprovalItems()` is unchanged.

---

## Out of Scope

1. **Reanimated Gesture API migration** — Descoped. Migrating `PanResponder` to
   `react-native-gesture-handler` Gesture API requires wrapping the screen in
   `GestureHandlerRootView` and rewriting gesture logic. This is a correctness-risk
   refactor, not a styling change. Out of scope for this spec.

2. **New approval item types** — Descoped. Only `MANUAL` and `OVERTIME` categories
   exist in the API. No new categories are introduced here.

3. **Offline / optimistic state persistence** — Descoped. The existing optimistic
   update logic in `useApprovalItems` is unchanged. Persistent offline queue is a
   separate product concern.

4. **Haptic feedback on swipe** — Descoped. Not part of the design system migration.

5. **Animated swipe hint arrows / labels** — Descoped. Text hint labels on the swipe
   background are a product UX decision beyond the scope of a token migration. The
   colour signal (green/red) is sufficient.

6. **Pull-to-refresh animation styling** — Descoped. `RefreshControl` tint color is
   updated to the success token hex value but the component is not replaced.

7. **useApprovalItems hook changes** — Descoped. Hook is used as-is. No API
   changes, no new query keys, no state changes.

---

## Functional Requirements

### FR1: Approvals Screen — NativeWind Layout

Rebuild `app/(tabs)/approvals.tsx` using design tokens and base components.

**Changes:**
- Remove all `StyleSheet.create()` and hardcoded hex
- Wrap screen in `className="flex-1 bg-background"`
- Header: `className="flex-row items-center justify-between px-4 pt-14 pb-3 bg-surface border-b border-border"`
- Header title: `className="text-textPrimary text-xl font-display-bold"`
- Count badge: `className="bg-violet/20 rounded-full px-2 py-0.5"` with `className="text-violet text-xs font-sans-bold"`
- "Approve All" Pressable: `className="bg-success rounded-xl px-4 py-2"` text `className="text-white font-sans-semibold text-sm"`
- Loading: disabled state `className="bg-success/50"`
- Error banner: `className="flex-row items-center bg-critical/10 px-4 py-2.5 gap-3"`, text `className="text-critical text-sm flex-1"`, retry `className="text-violet font-sans-semibold text-sm"`
- `RefreshControl` tintColor set to `"#10B981"` (success token hex)

**Success Criteria:**
- [ ] No `StyleSheet.create()` in approvals.tsx
- [ ] No hardcoded hex values in approvals.tsx
- [ ] Screen background is `bg-background` (dark)
- [ ] Header uses `bg-surface` with `border-border` separator
- [ ] Count badge visible and styled with violet tokens when items.length > 0
- [ ] "Approve All" button uses `bg-success` styling
- [ ] Error banner uses `bg-critical/10` and `text-critical`

---

### FR2: ApprovalCard — Visual Migration, Gestures Retained

Update `src/components/ApprovalCard.tsx` to use NativeWind className for all visual
styles while keeping `PanResponder` + `Animated` gesture mechanics intact.

**Changes:**
- Add comment: `// Gesture: PanResponder retained — Reanimated gesture migration is out of scope`
- Container `View`: `className="relative mx-4 my-1.5 rounded-2xl overflow-hidden"`
- Approve background `View`: `className="absolute top-0 bottom-0 left-0 w-1/2 bg-success rounded-l-2xl"`
- Reject background `View`: `className="absolute top-0 bottom-0 right-0 w-1/2 bg-destructive rounded-r-2xl"`
- `Animated.View`: `className="bg-surface rounded-2xl p-3.5"` + `style={{ transform: [{ translateX }] }}` only
- Name text: `className="flex-1 text-textPrimary text-base font-sans-semibold"`
- Hours text: `className="text-textSecondary text-sm mr-2 min-w-[36px]"`
- Description text: `className="flex-1 text-textSecondary text-sm"`
- Approve button: `className="flex-1 py-1.5 rounded-xl bg-success/20 items-center"`
- Approve button text: `className="text-success text-sm font-sans-medium"`
- Reject button: `className="flex-1 py-1.5 rounded-xl bg-destructive/20 items-center"`
- Reject button text: `className="text-destructive text-sm font-sans-medium"`

**Success Criteria:**
- [ ] No `StyleSheet.create()` in ApprovalCard.tsx
- [ ] No hardcoded hex values in ApprovalCard.tsx
- [ ] `PanResponder` and `Animated` gesture code unchanged
- [ ] Comment `// Gesture: PanResponder retained` present in source
- [ ] Approve swipe background uses `bg-success`
- [ ] Reject swipe background uses `bg-destructive`
- [ ] `Animated.View` retains `style={{ transform: [{ translateX }] }}` for gesture

---

### FR3: RejectionSheet — Dark Glass Aesthetic

Update `src/components/RejectionSheet.tsx` to dark glass design system aesthetic.

**Changes:**
- Backdrop `TouchableOpacity`: `className="flex-1"` + `style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}`
- Sheet `View`: `className="bg-surfaceElevated rounded-t-3xl p-5 pb-9 border-t border-border"`
- Title: `className="text-textPrimary text-lg font-sans-semibold mb-4"`
- `TextInput`: `className="border border-border rounded-xl p-3 text-textPrimary text-base bg-surface min-h-[80px] mb-4"` + `placeholderTextColor="#484F58"`
- Cancel button: `className="flex-1 py-3 rounded-xl bg-surface items-center border border-border"`
- Cancel text: `className="text-textSecondary text-base font-sans-medium"`
- Confirm button (enabled): `className="flex-[2] py-3 rounded-xl bg-destructive items-center"`
- Confirm button (disabled): `className="flex-[2] py-3 rounded-xl bg-destructive/40 items-center"`
- Confirm text: `className="text-white text-base font-sans-semibold"`

**Allowed exceptions to no-hex rule:**
- `style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}` for backdrop (rgba, not hex)
- `placeholderTextColor="#484F58"` (React Native prop, not a style; no NativeWind equivalent)

**Success Criteria:**
- [ ] No `StyleSheet.create()` in RejectionSheet.tsx
- [ ] No hardcoded hex values in RejectionSheet.tsx (except noted exceptions)
- [ ] Sheet background uses `bg-surfaceElevated`
- [ ] Sheet top border uses `border-t border-border`
- [ ] TextInput border uses `border-border` and background `bg-surface`
- [ ] Confirm button uses `bg-destructive`
- [ ] Disabled confirm uses `bg-destructive/40`

---

### FR4: Empty State — Manager "All Clear" and Contributor Redirect

Two distinct empty states styled with design tokens.

**Manager empty (0 pending items):**
- Centered `View`: `className="flex-1 items-center justify-center p-8"`
- `Card` component wrapping content: `className="items-center w-full"`
- Checkmark: `Text className="text-5xl text-success mb-3"` content `"✓"`
- Title: `Text className="text-textPrimary text-xl font-sans-semibold mb-1.5"` — `"All caught up"`
- Subtitle: `Text className="text-textSecondary text-sm text-center"` — `"No pending approvals"`

**Contributor redirect state:**
- `View className="flex-1 items-center justify-center p-8 bg-background"`
- `Card elevated className="items-center gap-3 w-full"`
- Icon placeholder: `Text className="text-4xl text-textMuted"` — `"👤"`
- Message: `Text className="text-textSecondary text-base text-center font-body"` — `"This screen is for managers"`

**Success Criteria:**
- [ ] Manager empty state renders "All caught up" title text
- [ ] Manager empty state uses `Card` component as wrapper
- [ ] Contributor state renders "This screen is for managers" message
- [ ] No hardcoded hex in either empty state
- [ ] Both states use `bg-background` as outer container

---

### FR5: Loading State — SkeletonLoader Cards

Replace the full-screen `ActivityIndicator` loading state with SkeletonLoader placeholder
cards matching the card list layout.

**Condition:** `isLoading === true` AND `items.length === 0` (initial fetch only).
When refreshing with existing items visible, show items + RefreshControl; do not replace
visible content with skeletons.

**Changes:**
- Loading branch renders 3 `SkeletonLoader` components in `View className="px-4 pt-3 gap-3"`
- Each: `<SkeletonLoader className="h-24 rounded-2xl" />`
- Remove `ActivityIndicator` import if it becomes unused (keep if still used in approveAll spinner)

**Success Criteria:**
- [ ] Initial load (`isLoading && items.length === 0`) renders exactly 3 SkeletonLoader cards
- [ ] Each SkeletonLoader has `h-24 rounded-2xl` classes applied
- [ ] Existing items shown during refresh (skeletons only for initial load)
- [ ] No `ActivityIndicator` used for the initial loading state

---

### FR6: Type Badges — Gold (Manual) and Warning (Overtime) Pills

Add category-specific pill badges to the header row of each `ApprovalCard`.

**Manual time badge:**
```tsx
<View className="bg-gold/20 rounded-full px-2 py-0.5">
  <Text className="text-gold text-xs font-sans-medium">Manual</Text>
</View>
```

**Overtime badge:**
```tsx
<View className="bg-warning/20 rounded-full px-2 py-0.5">
  <Text className="text-warning text-xs font-sans-medium">Overtime</Text>
</View>
```

**Overtime cost display** (replaces old cost rendering):
```tsx
<Text className="text-success text-sm font-sans-semibold">
  ${(item as OvertimeApprovalItem).cost.toFixed(2)}
</Text>
```

Use `item.category === 'MANUAL'` as the discriminant (not `item.type`).

**Success Criteria:**
- [ ] MANUAL items show gold pill badge with text "Manual"
- [ ] OVERTIME items show warning pill badge with text "Overtime"
- [ ] Gold badge uses `bg-gold/20` background and `text-gold` text
- [ ] Warning badge uses `bg-warning/20` background and `text-warning` text
- [ ] Overtime cards display cost value with `text-success` styling
- [ ] `item.category` (not `item.type`) used as discriminant

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/app/(tabs)/approvals.tsx` | Screen to migrate (FR1, FR4, FR5) |
| `hourglassws/src/components/ApprovalCard.tsx` | Gesture component to migrate (FR2, FR6) |
| `hourglassws/src/components/RejectionSheet.tsx` | Bottom sheet to migrate (FR3) |
| `hourglassws/src/hooks/useApprovalItems.ts` | Hook — read-only, no changes |
| `hourglassws/src/lib/approvals.ts` | Type definitions — read-only, no changes |
| `hourglassws/src/components/Card.tsx` | Base component to use in FR4 empty state |
| `hourglassws/src/components/SkeletonLoader.tsx` | Loading placeholder for FR5 |
| `hourglassws/tailwind.config.js` | Token reference: success, destructive, warning, gold, violet, critical |
| `hourglassws/BRAND_GUIDELINES.md` | Visual identity rules |

### Files to Modify

| File | FRs | Changes |
|------|-----|---------|
| `hourglassws/app/(tabs)/approvals.tsx` | FR1, FR4, FR5 | Remove StyleSheet; NativeWind layout; skeletons; empty states |
| `hourglassws/src/components/ApprovalCard.tsx` | FR2, FR6 | Keep PanResponder; NativeWind styles; add category badges |
| `hourglassws/src/components/RejectionSheet.tsx` | FR3 | Dark glass aesthetic; NativeWind throughout |

### Files to Create

| File | Purpose |
|------|---------|
| `hourglassws/src/components/__tests__/ApprovalCard.test.tsx` | Tests for FR2, FR6 |
| `hourglassws/src/components/__tests__/RejectionSheet.test.tsx` | Tests for FR3 |
| `hourglassws/app/(tabs)/__tests__/approvals.test.tsx` | Tests for FR1, FR4, FR5 |

### Type System Notes

`ApprovalItem` is a discriminated union — use `category` as the discriminant:

```typescript
type ApprovalItem = ManualApprovalItem | OvertimeApprovalItem
// Discriminant: item.category === 'MANUAL' | 'OVERTIME'
// NOT item.type — that field is 'WEB' | 'MOBILE' on ManualApprovalItem only
```

### Animated.View Style Composition

`Animated.View` takes both `className` (visual tokens) and `style` (gesture transform):

```tsx
<Animated.View
  className="bg-surface rounded-2xl p-3.5"
  style={{ transform: [{ translateX }] }}
  {...panResponder.panHandlers}
>
```

The `style` prop is only for animated values. All static visual styles go in `className`.

### RejectionSheet Overlay

`RejectionSheet` is absolute-positioned `KeyboardAvoidingView` — not a `Modal`.
Backdrop rgba must use `style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}` inline — this
is the only intentional exception to the no-hex rule.

`TextInput.placeholderTextColor` must use the textMuted hex value `#484F58` directly
(it is a React Native prop, not a style class).

### Edge Cases

| Case | Handling |
|------|---------|
| `items.length > 0` while `isLoading` (refresh) | Show items + RefreshControl spinner, NOT skeletons |
| `config` null on mount | Contributor empty state briefly renders; useEffect fires on config load |
| `rejectTarget` cleared during sheet interaction | `handleConfirmReject` guards with `if (!rejectTarget)` |
| `approveAll` on empty list | Resolves immediately via `Promise.allSettled([])`, safe |
| Swipe + tap button race | Hook deduplicates via optimistic state filter |

### Data Flow

```
useApprovalItems()
  ├── items: ApprovalItem[]        → FlatList / empty state / skeletons
  ├── isLoading: boolean           → skeleton vs content switch
  ├── error: string | null         → error banner
  ├── approveItem(item)            → called from ApprovalCard onApprove
  ├── rejectItem(item, reason)     → called from RejectionSheet onConfirm
  └── approveAll()                 → called from "Approve All" button

ApprovalCard
  ├── PanResponder → translateX.setValue() on drag
  ├── onPanResponderRelease → spring to ±300 → call onApprove/onReject
  └── visual classes: bg-surface, bg-success (left bg), bg-destructive (right bg)

RejectionSheet
  ├── visible={rejectTarget !== null}
  ├── onConfirm(reason) → handleConfirmReject → rejectItem(target, reason)
  └── onCancel → setRejectTarget(null)
```

### Test Infrastructure

**Mocks needed:**

```typescript
// useApprovalItems — configurable per test
jest.mock('@/src/hooks/useApprovalItems', () => ({
  useApprovalItems: jest.fn(),
}))

// expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}))

// useConfig
jest.mock('@/src/hooks/useConfig', () => ({
  useConfig: jest.fn(() => ({ config: { isManager: true } })),
}))

// Card — passthrough (render children)
jest.mock('@/src/components/Card', () => {
  const { View } = require('react-native')
  return { default: ({ children, ...props }) => <View {...props}>{children}</View> }
})

// SkeletonLoader — testID for assertions
jest.mock('@/src/components/SkeletonLoader', () => {
  const { View } = require('react-native')
  return { default: (props) => <View testID="skeleton-loader" {...props} /> }
})
```

**NativeWind test note:** className transforms to hashed IDs in Jest — do NOT assert
`className` prop values in rendered output. Use `testID` and text content for structural
assertions. For className correctness, use static source-file string analysis.
