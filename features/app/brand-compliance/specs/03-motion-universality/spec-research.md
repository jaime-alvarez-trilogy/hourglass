# Spec Research — 03-motion-universality

## Problem Context

`AnimatedPressable`, `FadeInScreen`, and `useStaggeredEntry` all exist in the codebase but are not applied everywhere. Three reviewers in run-001 flagged "missing touch feedback" and "app feels dead." The specific gaps:

1. **Settings button** in `index.tsx` uses `TouchableOpacity` — no scale feedback
2. **Retry button** in `approvals.tsx` uses plain `Pressable` — no scale feedback
3. **Tab bar icons** have `HapticTab` (haptic) but no visual scale feedback on press
4. **AI tab** and **Overview tab** screens may not have staggered entry correctly wired (FadeInScreen exists but stagger needs verification)
5. **`Approve All`** button in `approvals.tsx` uses plain `Pressable` — no scale feedback
6. **Refresh control tintColor** uses hardcoded `#10B981` on approvals screen (minor but uses hex not token)

User selected: "Animate card content on tab focus" — so we use FadeInScreen + staggered entry uniformly across all tabs, plus AnimatedPressable on tab icons via HapticTab enhancement.

## Exploration Findings

### Settings button (index.tsx lines 200–205)
```tsx
<TouchableOpacity
  onPress={() => router.push('/modal')}
  testID="settings-button"
>
  <Text className="text-textSecondary text-2xl">⚙️</Text>
</TouchableOpacity>
```
Plain `TouchableOpacity` — iOS default opacity fade, no scale, inconsistent with AnimatedPressable pattern.

### Retry button (approvals.tsx lines 144–147)
```tsx
<Pressable onPress={teamRefetch}>
  <Text className="text-violet font-sans-semibold text-sm">Retry</Text>
</Pressable>
```
Plain `Pressable`.

### Approve All button (approvals.tsx lines 125–137)
```tsx
<Pressable
  className={`rounded-xl px-4 py-2 ...`}
  onPress={handleApproveAll}
  ...
>
```
Plain `Pressable`. Should be `AnimatedPressable`.

### HapticTab (components/haptic-tab.tsx)
Used as `tabBarButton` in `_layout.tsx`. Provides haptic feedback on press. Does NOT currently add visual scale animation.
**Fix:** Wrap the rendered content in an `Animated.View` with scale 1 → 0.90 → 1 on press (tab icons are smaller than full-width buttons, so 0.90 is appropriate).

### AI tab (app/(tabs)/ai.tsx)
Need to verify FadeInScreen and useStaggeredEntry are present.

### Overview tab (app/(tabs)/overview.tsx)
Need to verify FadeInScreen and useStaggeredEntry are present.

### AnimatedPressable API
```typescript
// From src/components/AnimatedPressable.tsx
interface AnimatedPressableProps extends PressableProps {
  scaleValue?: number;  // default 0.96
  className?: string;
  style?: ViewStyle;
  children: ReactNode;
}
```
Drop-in replacement for `Pressable`. For `TouchableOpacity`, replace the import + rename.

## Key Decisions

1. **Settings button → AnimatedPressable**: Drop-in. Remove `TouchableOpacity` import if no longer needed.
2. **Approve All + Retry → AnimatedPressable**: Direct swap.
3. **HapticTab visual scale**: Add `Animated.View` scale 0.90 animation inside HapticTab. Use `timingInstant` (150ms) press-in, `springSnappy` press-out — same pattern as AnimatedPressable.
4. **AI + Overview tabs**: Add `FadeInScreen` wrapper and `useStaggeredEntry` if missing. If already present, no change needed.
5. **Stagger indices on AI tab**: 5 content zones (AI Usage, BrainLift, Prime Radiant, Daily Breakdown, 12-Week Trajectory) → count=5.
6. **Stagger indices on Overview tab**: 4 chart cards → count=4.
7. **RefreshControl tintColor**: Change hardcoded `#10B981` to `colors.success` import.

## Interface Contracts

### HapticTab animation
```typescript
// Internal to HapticTab — adds Reanimated scale on press
// Press in: scale → 0.90 via timingInstant (150ms)
// Press out: scale → 1.0 via springSnappy
// Wraps existing BottomTabBarButtonProps render
```
**Source:** `src/lib/reanimated-presets.ts` (timingInstant, springSnappy)

### Tab screen staggered entry (AI + Overview)
```typescript
// If missing, add:
const { getEntryStyle } = useStaggeredEntry({ count: N })
// Wrap each content zone in:
<Animated.View style={getEntryStyle(index)}>
```
**Source:** `src/hooks/useStaggeredEntry.ts`

## Test Plan

### Settings button → AnimatedPressable
- [ ] Source of `index.tsx` does NOT contain `TouchableOpacity` for settings button
- [ ] Source DOES contain `AnimatedPressable` wrapping the settings gear

### Approve All → AnimatedPressable
- [ ] Source of `approvals.tsx` does NOT contain plain `<Pressable` for Approve All button
- [ ] Source DOES contain `AnimatedPressable` for Approve All

### Retry → AnimatedPressable
- [ ] Source of `approvals.tsx` DOES contain `AnimatedPressable` for Retry button

### HapticTab visual scale
- [ ] Source of `HapticTab` contains `useSharedValue` or Animated scale
- [ ] Source references `timingInstant` or 150ms duration

### AI + Overview staggered entry
- [ ] `ai.tsx` imports and uses `useStaggeredEntry`
- [ ] `ai.tsx` wraps content zones in `Animated.View` with `getEntryStyle`
- [ ] `overview.tsx` imports and uses `useStaggeredEntry`
- [ ] `overview.tsx` wraps chart cards in `Animated.View` with `getEntryStyle`

### FadeInScreen on all tabs
- [ ] `ai.tsx` root is wrapped in `FadeInScreen`
- [ ] `overview.tsx` root is wrapped in `FadeInScreen`

## Files to Modify

| File | Change |
|------|--------|
| `app/(tabs)/index.tsx` | Settings button: TouchableOpacity → AnimatedPressable |
| `app/(tabs)/approvals.tsx` | Approve All + Retry: Pressable → AnimatedPressable; RefreshControl tintColor |
| `components/haptic-tab.tsx` | Add Reanimated scale animation on press |
| `app/(tabs)/ai.tsx` | Add FadeInScreen + useStaggeredEntry if missing |
| `app/(tabs)/overview.tsx` | Add useStaggeredEntry if missing |

## Files to Reference

- `src/components/AnimatedPressable.tsx` — props and pattern
- `src/lib/reanimated-presets.ts` — timingInstant, springSnappy configs
- `src/hooks/useStaggeredEntry.ts` — hook API
- `src/components/FadeInScreen.tsx` — wrapper API
- `gauntlet-runs/video/run-001-2026-03-15/synthesis.md` — "Missing Touch Feedback" section
