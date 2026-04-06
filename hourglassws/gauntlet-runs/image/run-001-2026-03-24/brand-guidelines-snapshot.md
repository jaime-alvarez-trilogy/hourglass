# Hourglass Brand Guidelines v2.0 — Liquid Glass Spatial UI

## Color Tokens (tailwind.config.js)
background: #0D0C14 (deep eggplant, NOT pure black)
surface: #16151F (default glass card fill)
surfaceElevated: #1F1E29 (modals, bottom sheets)
border: #2F2E41
textPrimary: #E0E0E0 (NEVER #FFFFFF)
textSecondary: #A0A0A0
textMuted: #757575
gold: #E8C97A (earnings/money ONLY)
goldBright: #FFDF89 (Crushed It state only)
cyan: #00C2FF (AI metrics ONLY)
violet: #A78BFA (BrainLift, CTAs, active nav)
success: #10B981 (on-track state)
warning: #F59E0B (behind-pace, caution)
critical: #F43F5E (critical behind-pace)
destructive: #F85149 (irreversible actions: delete, reject)
overtimeWhiteGold: #FFF8E7

## Font Families
font-display / font-display-bold: SpaceGrotesk_700Bold (hero numbers, headings)
font-display-semibold: SpaceGrotesk_600SemiBold
font-mono: SpaceMono_400Regular (data tables, timestamps)
font-sans / font-sans-medium: Inter (UI labels, body)
font-sans-semibold: Inter_600SemiBold
font-sans-bold: Inter_700Bold

## Animation Presets (reanimated-presets.ts)
springSnappy: { damping: 20, stiffness: 300, mass: 0.8 } — immediate feedback
springBouncy: { damping: 14, stiffness: 200, mass: 1 } — cards entering, list items
springPremium: { damping: 18, stiffness: 120, mass: 1.2 } — hero panels, modal sheets
timingChartFill: { duration: 1800, easing: Easing.bezier(0.16, 1, 0.3, 1) }
timingSmooth: { duration: 400, easing: Easing.inOut(Easing.ease) }
timingInstant: { duration: 150, easing: Easing.out(Easing.ease) }

## Glass Card Layer Stack (bottom → top)
1. Animated.View (spring scale wrapper for pressable cards)
2. MaskedView with LinearGradient border (semantic color → transparent at 45°)
3. View (onLayout wrapper — NEVER put onLayout on Canvas)
4. Canvas AbsoluteFill: BackdropFilter(blur=16) + RoundedRect rgba(22,21,31,0.6)
5. NoiseOverlay: white noise PNG at 0.03 opacity / overlay blend
6. Inner shadows: top rgba(0,0,0,0.6) + bottom rgba(255,255,255,0.10) reflected highlight
7. Content View (p-5 padding)

Key card values:
- Border radius: rounded-2xl (16px) — MINIMUM rounded-lg (8px), NEVER rounded-md
- Inner padding: p-5 (standard) or p-6 (hero)
- Border: 1.5px gradient, violet default → destructive for reject, success for approve actions
- Glass fill: rgba(22, 21, 31, 0.60)
- BackdropFilter blur: 16–20px (cards), 30px (elevated)
- BANNED: expo-blur, @react-native-community/blur (caused SIGKILL crashes)
- Android: renderToHardwareTextureAndroid={true} required

## CRITICAL: Animation Bans
- BANNED: Legacy Animated API (Animated.Value, Animated.spring, Animated.timing, PanResponder)
- REQUIRED: Reanimated useSharedValue + worklets for ALL animations
- REQUIRED: react-native-gesture-handler (Gesture API) for swipe/pan gestures
- Button press: scale 1.0 → 0.96 with timingInstant, restore on release

## Typography Rules
- NEVER #FFFFFF text — halation on dark backgrounds
- tabular-nums on ALL numeric displays
- Hero numbers: Space Grotesk 700, tracking -0.02em
- Section labels: Inter Medium 11-12px, uppercase, letterSpacing 0.08em
- Max font weight: 700 (ExtraBold looks too heavy on dark backgrounds)

## Spatial Design
- Screen padding: px-4 (16px)
- Card gap: gap-4 (16px)
- Base grid: 4px — ALL spacing multiples of 4

## Current ApprovalCard Problems (DO NOT repeat these)
1. Uses legacy Animated API (banned §6.6) — useSharedValue required
2. Uses PanResponder (banned) — must use Gesture.Pan() from gesture-handler
3. Green (bg-success) and red (bg-destructive) absolute backgrounds leak through the card surface making text UNREADABLE on device
4. Card content invisible because background color bleeds through

## What to Build: ApprovalCard
A swipeable manager approval card for pending team requests.

Data shown per card:
- fullName: string (team member name)
- hours: number (e.g. 1.5)
- description: string (memo/reason)
- category: 'MANUAL' | 'OVERTIME'
- cost?: number (overtime items only, e.g. $45.00)
- approvalId: string

Interaction:
- Swipe RIGHT → approve (green success indicator on right reveal)
- Swipe LEFT → reject (red destructive indicator on left reveal)  
- Approve/Reject buttons at bottom as accessibility fallback
- Gesture using Gesture.Pan() from react-native-gesture-handler
- Animation using Reanimated useSharedValue + useAnimatedStyle

Visual design:
- Dark glass card — rgba(22,21,31,0.6) surface
- Gradient border: violet → transparent (default)
- When swiping right: reveal green success accent on right edge
- When swiping left: reveal red destructive accent on left edge
- Swipe indicators BEHIND the card, revealed by translateX — NOT bleeding through
- Type badge: "Manual" (violet pill) or "Overtime" (warning/amber pill)
- Hours in font-mono tabular-nums
- springBouncy for snap-back, springSnappy for dismiss

Interface:
interface Props {
  item: ApprovalItem  // from src/lib/approvals.ts
  onApprove: () => void
  onReject: () => void
}

ApprovalItem has: { fullName, hours, description, category: 'MANUAL'|'OVERTIME', approvalId }
OvertimeApprovalItem extends ApprovalItem: { cost: number }

Imports available:
- Gesture, GestureDetector from 'react-native-gesture-handler'
- Animated (Reanimated), useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS from 'react-native-reanimated'
- springBouncy, springSnappy, timingInstant from '@/src/lib/reanimated-presets'
- AnimatedPressable from './AnimatedPressable' (handles press scale animations)
- Card from './Card' OR GlassCard from './GlassCard' for glass surface

DO NOT USE:
- Animated from 'react-native' (legacy, banned)
- PanResponder (banned)
- expo-blur (causes crashes)
- StyleSheet.create (use className NativeWind only)
- Hardcoded hex values (use colors from tailwind config only)
- rounded-md or smaller
