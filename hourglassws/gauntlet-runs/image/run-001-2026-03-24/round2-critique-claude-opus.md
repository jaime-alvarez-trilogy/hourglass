

## Option A
CODE score: 8/10
- Excellent NativeWind v4 className usage throughout with semantic color tokens (bg-success, bg-destructive, text-violet, bg-warning/10); minor violation with hardcoded hex in border-[#2F2E41] and bg-[#16151F]/90
- Strong Reanimated v4 usage: Gesture.Pan() with proper onUpdate/onEnd, shared values for dismiss animation with height collapse, interpolate for opacity reveals, worklet-compatible dismissCard
- TypeScript is clean with explicit interfaces, proper callback typing, and SharedValue usage; the `'worklet'` directive on dismissCard is incorrect since it calls `withSpring`/`withTiming` which are already worklet-compatible but the function itself uses closures over JS callbacks

UX score: 8/10
- Excellent visual hierarchy: display-semibold name, category badge with icon, mono tabular hours, gold cost — clear information scanning order
- The width-matched swipe backgrounds (leftActionStyle/rightActionStyle growing to match translateX) is the smartest solution to the bleed-through problem across all options
- Premium details: inner glass reflection border-t border-white/5, haptic threshold guards that re-trigger, height collapse animation for list removal; swipe hint text is missing though

Better:
1. Width-matched swipe indicator backgrounds that grow precisely with card translation — the only implementation that truly prevents color bleed-through on translucent glass
2. Full dismiss lifecycle with height collapse + marginBottom animation for smooth list reflow, plus haptic threshold guards with re-triggering

Worse:
1. Several hardcoded hex values (#2F2E41, #16151F, #E0E0E0, #A0A0A0, #757575, #0D0C14) violate the "no hardcoded hex" requirement — should use design system tokens
2. The AnimatedPressable wraps Pressable inside Animated.View with flex-1, which can cause layout issues; also the `'worklet'` directive on dismissCard is misplaced

Improvement: Replace all hardcoded hex colors with NativeWind design tokens (e.g., `border-border` instead of `border-[#2F2E41]`, `bg-surface` instead of `bg-[#16151F]/90`, `text-textPrimary` instead of `text-[#E0E0E0]`).

---

## Option B
CODE score: 4/10
- Uses deprecated `styled()` wrapper from NativeWind v2/v3 — NativeWind v4 uses className directly on components without styled(); this is a fundamental API mismatch
- Ambitious Reanimated usage with Gesture.Pan() and Gesture.Tap() for buttons, but references undefined `StyleSheet` in `CardBorder` component (StyleSheet.absoluteFill without importing StyleSheet), and `actionIndicatorStyle` is called as a function inside render which violates hooks rules
- TypeScript has good discriminated union types (OvertimeApprovalItem), but the Skia Canvas hardcodes width/height values and the MaskedView implementation is overly complex for the requirement

UX score: 6/10
- Creative layout with large tabular-nums hours display and category pill — good visual weight distribution
- Skia backdrop blur + noise texture + inner shadow gradients create genuine glass depth, but the fixed `height: 180` style constraint makes content potentially clip
- Swipe backgrounds use full-width halves (w-1/2) with both always visible behind card — green AND red show simultaneously, which is confusing and the colors will bleed through the rgba glass surface

Better:
1. Most sophisticated glass implementation with Skia BackdropFilter, noise texture overlay, and multi-layer inner shadows — closest to true glassmorphism
2. Discriminated union typing for OvertimeApprovalItem with proper type narrowing

Worse:
1. Uses deprecated `styled()` API, references undefined `StyleSheet`, and `actionIndicatorStyle` violates React hooks rules (conditional hook-like call in render)
2. Both approve AND reject backgrounds are always rendered at full width behind the card — they bleed through the translucent glass simultaneously, directly violating requirement #3/#4

Improvement: Remove all `styled()` wrappers, fix the hooks violation by making `actionIndicatorStyle` two separate `useAnimatedStyle` calls, and make swipe backgrounds width-dynamic or fully opaque to prevent bleed-through.

---

## Option C
CODE score: 3/10
- NativeWind className usage is present but incorrect — `textPrimary` and `textSecondary` used as bare classNames without `text-` prefix; relies on external GlassCard and AnimatedPressable without showing implementation
- Minimal Reanimated usage: basic Gesture.Pan() with onUpdate/onEnd, but card snaps back to 0 even after triggering approve/reject (no dismiss animation), and imports springBouncy from external module
- TypeScript interfaces are defined but OvertimeApprovalItem is declared and never used; `item.cost` accessed without type narrowing; Props uses `() => void` losing the approvalId

UX score: 3/10
- Flat visual hierarchy — name and description lack differentiation, no hours prominence, badge is a solid filled pill that's too heavy
- GestureDetector wraps both the background AND the card as siblings which is structurally incorrect — the background View is a sibling inside GestureDetector, not a separate layer behind
- No haptics, no dismiss animation, no rotation, no swipe indicators with icons — feels like a rough prototype; approve/reject buttons use solid bg-success/bg-destructive which is visually aggressive

Better:
1. Most concise implementation — easy to read and understand the core swipe mechanic at a glance
2. Clean separation of concerns by delegating to GlassCard and AnimatedPressable components

Worse:
1. Card snaps back to center even after triggering approve/reject — no dismiss animation, making the swipe feel broken
2. Swipe background structure is wrong (siblings inside GestureDetector rather than layered behind), className errors (textPrimary vs text-textPrimary), and no haptic feedback

Improvement: Add dismiss animation (translateX to ±screenWidth with opacity fade) before calling onApprove/onReject, and fix the layer structure so backgrounds are absolutely positioned behind the card in a parent container.

---

## Option D
CODE score: 7/10
- Good NativeWind className usage with twMerge for conditional classes; relies on external GlassCard and AnimatedPressable but passes reasonable props; some inline `style={{}}` objects with hardcoded colors (#E0E0E0, #A0A0A0, #E8C97A) and fontFamily strings
- Solid Reanimated v4: Gesture.Pan() with activeOffsetX, proper dismiss with withSpring to cardWidth+64, subtle rotateZ tilt on swipe, separate swipeProgress shared value for indicator animations
- TypeScript is decent with typed Props and external ApprovalItem import, but SwipeIndicator takes `Animated.SharedValue<number>` which should be `SharedValue<number>` from reanimated; `onLayout` callback typing uses `any`

UX score: 7/10
- Good visual hierarchy with display-bold name, TypeBadge component, mono hours, and gold cost; divider separates content from actions cleanly
- SwipeIndicator components have nice scale+opacity animation, but they use fixed positioning (left-0 right-1/2) meaning both indicators are always rendered behind the card — potential bleed-through on translucent glass
- Button row has icons + text with proper accessibility labels and roles — best accessibility implementation; the subtle rotateZ tilt adds physicality to the swipe

Better:
1. Best accessibility implementation — buttons have accessibilityLabel, accessibilityRole="button", icons paired with text labels
2. Subtle rotateZ rotation during swipe adds premium physical feel; separate swipeProgress shared value is clean architecture

Worse:
1. Heavy inline `style={{}}` usage with hardcoded hex colors (#E0E0E0, #A0A0A0, #E8C97A) and fontFamily strings — defeats the purpose of NativeWind and violates no-hardcoded-hex rule
2. SwipeIndicator backgrounds are always full-width behind card (left-0 right-1/2) — will bleed through translucent GlassCard surface

Improvement: Remove all inline `style={{}}` color and fontFamily overrides — use NativeWind className equivalents (`text-textPrimary`, `font-display-bold`) and ensure GlassCard has a fully opaque background layer to prevent indicator bleed-through.

---

## Option E
CODE score: 7/10
- NativeWind className usage is good with semantic tokens (text-textPrimary, text-success, bg-warning/15, bg-violet/15); however, the card background uses inline `style={{ backgroundColor: 'rgba(22, 21, 31, 0.95)' }}` and `'rgba(22, 21, 31, 0.60)'` — hardcoded hex violation
- Strong Reanimated v4: Gesture.Pan() with activeOffsetX + failOffsetY, velocity-based dismiss (DISMISS_VELOCITY), rotation interpolation, contextX for gesture continuity, useReducedMotion imported (though unused in animations), Gesture.Tap() for buttons
- Good TypeScript with discriminated union, type guard function `isOvertime()`, proper helper functions, and named exports; `interpolateColor` imported but unused

UX score: 7/10
- Clear visual hierarchy: 2xl bold hours as hero number, gold cost, secondary description, divider, action buttons — good scanning pattern
- Swipe indicators use absolute positioning at left-4/right-4 with scale+opacity animation — elegant reveal, but positioned at card edges not behind the full card width
- The "← swipe to reject · swipe to approve →" hint text is a nice UX touch for discoverability; LinearGradient border wrapper adds premium feel; inner shadow lines (white top, black bottom) create depth; however double-nested backgroundColor creates unnecessary complexity

Better:
1. Velocity-based dismiss detection (DISMISS_VELOCITY = 500) in addition to threshold — most natural-feeling swipe physics, handles quick flicks
2. Type guard function `isOvertime()` is the cleanest TypeScript pattern for discriminated unions; helper functions for formatting keep JSX clean

Worse:
1. Double-nested backgroundColor with hardcoded rgba values (0.95 outer + 0.60 inner) is confusing and violates no-hardcoded-hex; the outer 0.95 opacity makes the inner 0.60 meaningless
2. Swipe indicators are small icons at fixed positions (left-4, right-4) rather than full background reveals — they float awkwardly and don't fill the revealed space behind the card

Improvement: Replace the double-nested rgba backgrounds with a single `className="bg-surface"` or equivalent NativeWind token, and make swipe indicators full-height backgrounds that fill the revealed space rather than small floating elements.

---

## Option F
CODE score: 6/10
- Clean NativeWind className usage with semantic tokens (bg-surface, text-textPrimary, border-border, bg-destructive/10); minimal inline styles — closest to pure className approach
- Basic but correct Reanimated v4: Gesture.Pan() with activeOffsetX, context pattern for gesture continuity, withSpring dismiss, interpolate for indicator opacity/scale; no rotation or height collapse
- TypeScript is minimal but correct; single interface with optional cost, proper callback typing; missing discriminated union pattern for overtime

UX score: 6/10
- Decent visual hierarchy with display-semibold name, category pill, mono hours right-aligned, gold cost below; description has leading-relaxed for readability
- Swipe backgrounds use `absolute inset-0 flex-row` with two flex-1 halves — BOTH approve and reject backgrounds are always visible behind the card, and with `bg-surface` (which may be translucent), colors could bleed through
- Buttons use native Pressable with `active:opacity-70` instead of animated scale — functional but not premium; no haptic on swipe threshold crossing, only on button press; `overflow-hidden` on parent container clips the card during swipe which breaks the dismiss animation

Better:
1. Cleanest NativeWind compliance — fewest inline styles and hardcoded values of any option; `bg-surface` className for card background
2. Context pattern for gesture continuity (`context.value = { x: translateX.value }`) handles interrupted gestures correctly

Worse:
1. `overflow-hidden` on the parent `rounded-2xl` container will clip the card as it translates off-screen — dismiss animation will be invisible
2. Buttons use plain Pressable with active:opacity-70 instead of animated scale — inconsistent with the premium feel; no AnimatedPressable despite being a requirement

Improvement: Remove `overflow-hidden` from the parent container (move it to a separate background wrapper), and replace Pressable buttons with AnimatedPressable using scale animation for consistent premium interaction feel.

---

## Option G
CODE score: 3/10
- NativeWind className usage is present with semantic tokens (text-textPrimary, bg-surfaceElevated, text-gold); delegates to GlassCard and AnimatedPressable externals
- Basic Reanimated v4 Gesture.Pan() but `useHapticFeedback` is not a real expo-haptics export — this will crash at runtime; hapticFeedback called inside onStart worklet without runOnJS wrapper
- TypeScript interfaces are fine but minimal; Props interface is clean; handleApprove/handleReject call `runOnJS(onApprove)()` from JS thread (not worklet) which is incorrect — runOnJS is only needed inside worklets

UX score: 4/10
- Flat visual hierarchy — name and hours on same row without size differentiation, description unstyled, badge is a solid heavy pill at bottom of content (unusual placement)
- Swipe backgrounds have approve/reject sides REVERSED (destructive on left, success on right) — swiping right reveals red and swiping left reveals green, which is the opposite of the requirement
- No swipe indicators (no icons, no text labels on backgrounds), no rotation, no dismiss opacity, card only moves 200px — feels incomplete and confusing; TouchableOpacity imported but unused

Better:
1. Most concise implementation that still delegates to design system components (GlassCard, AnimatedPressable)
2. Clean component structure with minimal state management

Worse:
1. `useHapticFeedback` is not a real expo-haptics API — component will crash on import; haptic call inside worklet without runOnJS
2. Swipe indicator sides are reversed (destructive left, success right) — swiping right to "approve" reveals the red reject background, fundamentally breaking the UX

Improvement: Fix the fatal `useHapticFeedback` import (use `Haptics.impactAsync` with `runOnJS` wrapper), swap the background indicator sides so success is on the left (revealed on right swipe) and destructive is on the right (revealed on left swipe).
