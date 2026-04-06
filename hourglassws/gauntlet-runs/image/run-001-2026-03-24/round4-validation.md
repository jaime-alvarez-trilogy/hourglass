# Round 4 — Validation Report

**Component:** src/components/ApprovalCard.tsx

## Checks

| Check | Result |
|-------|--------|
| Named export found | ✅ `export function ApprovalCard` |
| Default export found | ✅ `export default ApprovalCard` |
| StyleSheet.create | ✅ None |
| Hardcoded hex colors | ✅ None (uses `colors.background` from colors.ts) |
| Legacy Animated API | ✅ None |
| PanResponder | ✅ None |
| rounded-sm / rounded-md | ✅ None |
| tabular-nums on numbers | ✅ 2 instances |
| Banned libraries (expo-blur) | ✅ None |
| Gesture library | ✅ `Gesture.Pan()` from react-native-gesture-handler |

## Fixes Applied vs Synthesis
- Removed `import React, from 'react'` syntax error (stray comma)
- Removed `backdrop-blur-xl` (no-op in React Native)
- Replaced `lucide-react-native` (not installed) with `@expo/vector-icons` Ionicons
- Fixed `item.cost` TypeScript error with proper `as OvertimeApprovalItem` cast
- Changed `onApprove(id)` / `onReject(id)` to `onApprove()` / `onReject()` to match existing call sites
- `item.hours` used directly (it's a string like "1.5" from the API)
- Added `colors` import for icon color tokens (eliminates hardcoded hex)
- Removed unused `ManualApprovalItem` import

## Key Design Decisions
- **Swipe bleed fix:** `approveActionStyle` / `rejectActionStyle` animate the `width` property to match `translateX` exactly — color only fills the uncovered area
- **Card rotation:** Subtle ±6° tilt on swipe for physical mass feel
- **Velocity dismiss:** Flick gesture (>800px/s) also triggers dismiss without needing full distance
- **reducedMotion:** Disables rotation and scale animations for accessibility
- **Glass surface:** `bg-surface overflow-hidden border border-border` — solid dark card
