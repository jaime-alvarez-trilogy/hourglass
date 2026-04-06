## Option A

CODE score: 6/10
- **NativeWind v4**: Uses arbitrary value syntax (e.g., `bg-[#16151F]/90`, `text-[#E0E0E0]`) which violates the "no hardcoded hex" rule; inline style objects for `fontVariant` break the "className only" constraint.
- **Reanimated v4**: Excellent implementation with `useSharedValue`, `withSpring`, and proper worklet functions (`runOnJS`); haptic threshold crossing logic is sophisticated.
- **TypeScript**: Strong typing with explicit interfaces and proper callback memoization; could use stricter null checks for `item.cost`.

UX score: 7/10
- **Visual hierarchy**: Clear distinction between header, body, and actions; good use of border-t white/5 for glass depth.
- **Animation feel**: The width-based reveal of swipe backgrounds (growing from 0 to match `translateX`) is the only implementation that truly prevents color bleed while revealing progressively; snappy spring presets feel premium.
- **Typography**: Inconsistent—mixes arbitrary hex colors (`#E0E0E0`) with semantic tokens, breaking dark mode consistency.

Better: 
1. **Architecturally correct swipe reveal**: Uses animated `width` on action containers to match translation exactly, ensuring indicators appear only where the card has vacated (zero bleed-through).
2. **Threshold-based haptics**: Implements `hasCrossedRight/Left` shared values to trigger haptics only once per threshold crossing, preventing vibration spam.

Worse: 
1. **Hardcoded color pollution**: Heavy use of hex values in className (`border-[#2F2E41]`, `text-[#A0A0A0]`) and icon props (`color="#0D0C14"`) violates the NativeWind-only dark glass aesthetic.
2. **Missing dismissal animation**: Card collapses height immediately without animating off-screen first, creating a jarring snap effect before the callback fires.

Improvement: Replace all arbitrary hex values with semantic design system tokens (e.g., `text-textPrimary` instead of `text-[#E0E0E0]`) and add an off-screen translation animation before the height collapse.

---

## Option B

CODE score: 4/10
- **NativeWind v4**: Uses `styled()` HOC pattern which is legacy NativeWind v2 style; v4 prefers direct className; hardcoded hex colors (`#10B981`, `#F85149`) throughout.
- **Reanimated v4**: Proper gesture setup, but imports presets from external file without showing contents; uses `Extrapolation` correctly.
- **TypeScript**: Good discriminated union for `OvertimeApprovalItem`, but over-engineered with Skia dependencies that add massive bundle overhead.

UX score: 5/10
- **Visual hierarchy**: The Skia glass effect looks premium but the swipe indicators are full-width static backgrounds with opacity fades, not revealed progressively.
- **Animation feel**: 30% screen width threshold is too large for comfortable one-handed use; the opacity-based reveal feels like a wash-over rather than an uncovering.
- **Dark glass aesthetic**: Compromised by the static half-screen red/green backgrounds always sitting behind the card; uses base64 noise texture which is unnecessary bloat.

Better: 
1. **True glass morphism**: Only implementation using Skia `BackdropFilter` with `rgba(22,21,31,0.6)` for authentic glass refraction.
2. **Border gradient animation**: Dynamic border color interpolation based on swipe direction provides clear affordance.

Worse: 
1. **Static swipe backgrounds**: Uses `w-1/2` static containers with opacity animation, violating the "revealed as card moves" requirement—the colors are always present behind the card.
2. **Massive over-engineering**: Skia, MaskedView, and Base64 noise texture add significant bundle size and complexity for a simple glass effect achievable with `backdrop-blur` and borders.

Improvement: Remove Skia and MaskedView; replace with standard NativeWind `backdrop-blur-xl bg-surface/60` and change swipe indicators to width-based animation tied to `translateX`.

---

## Option C

CODE score: 3/10
- **NativeWind v4**: Uses semantic classes correctly (e.g., `bg-success`, `textPrimary`), but violates "className only" with inline `style={{ fontVariant: ['tabular-nums'] }}`.
- **Reanimated v4**: Basic setup but missing critical dismissal animation—card snaps back to center before callback fires, breaking the swipe paradigm.
- **TypeScript**: Basic interfaces; missing `OvertimeApprovalItem` discrimination; callbacks don't pass `approvalId` to parents despite it being in the type.

UX score: 4/10
- **Visual hierarchy**: Flat layout with minimal depth; description text lacks truncation limits.
- **Animation feel**: Broken dismissal UX—card returns to center then disappears; no haptic feedback.
- **Swipe indicators**: Static full-width flex containers (`flex-1 bg-success`) are always rendered behind the card, causing constant color bleed risk.

Better: 
1. **Clean abstraction**: Properly delegates to `GlassCard` and `AnimatedPressable` components, showing good separation of concerns.
2. **Semantic color usage**: Consistent use of `bg-violet`, `bg-warning` without hardcoded hex values.

Worse: 
1. **No dismiss animation**: Calls `onApprove/onReject` immediately on threshold cross without animating the card off-screen, making the interaction feel broken.
2. **Static background bleed**: Left/right action backgrounds are always 50% width behind the card (opacity 100%), violating the progressive reveal requirement.

Improvement: Implement off-screen dismissal animation using `withSpring` to translate X to full screen width before calling callbacks, and animate background widths from 0 instead of using static flex containers.

---

## Option D

CODE score: 6/10
- **NativeWind v4**: Uses `twMerge` for dynamic classes correctly; violates rule with hardcoded hex in `Ionicons` props (`#10B981`, `#F85149`) and inline style objects for `fontFamily`.
- **Reanimated v4**: Excellent use of `interpolate` for rotation and progress tracking; proper `activeOffsetX` to prevent scroll hijacking.
- **TypeScript**: Well-typed with proper interface exports; good use of `React.FC` with explicit Props.

UX score: 6/10
- **Visual hierarchy**: Good information density with proper badge placement; divider line helps separate content from actions.
- **Animation feel**: The `rotateZ` interpolation adds nice tactile resistance; however, swipe indicators are always half-width behind the card.
- **Typography**: Hardcoded `fontFamily: 'SpaceGrotesk_700Bold'` breaks the NativeWind utility system.

Better: 
1. **Tactile rotation**: Only implementation adding subtle rotation based on translation (`rotateZ: ${translateX.value * 0.0012}rad`), enhancing the physical feel.
2. **Accessibility**: Includes `accessibilityLabel`, `accessibilityRole`, and `renderToHardwareTextureAndroid` for performance.

Worse: 
1. **Fixed-width indicators**: `SwipeIndicator` uses `left-0 right-1/2` (and vice versa), meaning half the card always has a colored background behind it, revealed via opacity rather than card movement.
2. **Hardcoded icon colors**: Ionicons use raw hex strings instead of semantic color props from the theme.

Improvement: Replace the half-width static indicators with width-animated views that grow from 0 to `translateX`, and move font family definitions to the Tailwind config.

---

## Option E

CODE score: 5/10
- **NativeWind v4**: Uses semantic classes well, but hardcoded hex in `LinearGradient` (`colors={['#A78BFA', 'transparent']}`) violates the constraint; inline styles for `backgroundColor` in nested Views.
- **Reanimated v4**: Good use of `useReducedMotion` for accessibility; velocity-based dismissal logic is robust; `interpolateColor` ready for border shifts but not fully utilized.
- **TypeScript**: Good type guards (`isOvertime`) and union types; helper functions for formatting are clean.

UX score: 6/10
- **Visual hierarchy**: Clear data layout with hours/cost baseline alignment; good use of `tabular-nums`.
- **Animation feel**: Small floating indicators (w-14 h-14) fade in rather than full backgrounds revealing; the "swipe hint" text helps discoverability but looks cluttered.
- **Dark glass**: Proper `rgba(22, 21, 31, 0.95)` base, but gradient border uses hardcoded violet.

Better: 
1. **Accessibility**: Only implementation checking `useReducedMotion` to respect user preferences; includes velocity-based dismissal (500px/s threshold) for faster interactions.
2. **Semantic formatting**: Clean helper functions for hours/cost formatting with proper TypeScript guards.

Worse: 
1. **Floating indicators**: Indicators are small centered icons (`w-14 h-14`) with opacity fade, not full-height background colors revealed behind the card.
2. **Hardcoded gradient**: Border gradient uses raw hex `#A78BFA` instead of `border-violet` or semantic gradient tokens.

Improvement: Replace the small floating indicators with full-height background layers that animate `width` from 0 to match swipe distance, and configure the gradient colors in NativeWind theme or use `border-violet/50`.

---

## Option F

CODE score: 4/10
- **NativeWind v4**: Good semantic color usage (`bg-success`, `text-textPrimary`), but uses `Dimensions.get('window')` instead of `useWindowDimensions` hook (breaks on rotation).
- **Reanimated v4**: Proper gesture setup with `context` for continuity; missing haptics in gesture lifecycle.
- **TypeScript**: Basic interfaces; missing discriminated union for overtime cost; callback types don't match other implementations (no ID passed).

UX score: 5/10
- **Visual hierarchy**: Solid layout with proper border separation between content and buttons.
- **Animation feel**: Opacity-based reveal on static full-width backgrounds; card lacks rotation or scale feedback during swipe.
- **Swipe indicators**: Uses `flex-1` static containers for both sides, meaning the entire card area is always covered by both colors (opacity changes only).

Better: 
1. **Semantic purity**: Consistently uses design system tokens (`bg-surface`, `border-violet/30`) without hardcoded hex values.
2. **Button styling**: Accessible fallback buttons with proper `active:opacity-70` states.

Worse: 
1. **Static backgrounds**: Both approve and reject backgrounds are `flex-1` (50% width each) always rendered behind the card, revealed only via opacity interpolation—this causes color bleeding and violates the progressive reveal requirement.
2. **Dimensions API**: Uses `Dimensions.get('window')` which doesn't update on orientation changes; should use `useWindowDimensions` hook.

Improvement: Replace `Dimensions` with `useWindowDimensions`, and animate the `width` of the background Views from 0 to `Math.abs(translateX)` instead of using full-width containers with opacity.

---

## Option G

CODE score: 2/10
- **NativeWind v4**: Uses semantic classes, but `tabular-nums` in className requires custom config (not standard Tailwind); otherwise clean.
- **Reanimated v4**: Broken haptics import (`useHapticFeedback` doesn't exist in expo-haptics); missing dismissal animation (only springs to 200px, not off-screen).
- **TypeScript**: Incomplete cost logic (no type guard); missing `item.approvalId` in callbacks despite being in interface.

UX score: 3/10
- **Visual hierarchy**: Minimal and cramped; missing description truncation; category badge placement is awkward (below description).
- **Animation feel**: Card stops at 200px instead of flying off-screen; no opacity fade during dismissal feels sticky.
- **Swipe indicators**: Static 50/50 flex split always behind card (`flex-1 bg-destructive` and `flex-1 bg-success`).

Better: 
1. **Simplicity**: Easy to read and understand the gesture logic; uncluttered layout.
2. **Semantic structure**: Uses `GlassCard` abstraction and semantic color tokens correctly.

Worse: 
1. **Broken haptics**: Imports non-existent `useHapticFeedback` hook; will crash or fail silently.
2. **Incomplete dismissal**: Springs to fixed 200px instead of screen width, leaving the card hanging partially off-screen; no height collapse animation.

Improvement: Fix haptics to use `Haptics.impactAsync` directly from `expo-haptics`, and animate `translateX` to full screen width plus padding before calling `onApprove/onReject`.
