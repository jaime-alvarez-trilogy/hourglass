# Implementation Checklist

Spec: `07-approvals-tab`
Feature: `hourglass-design-system`

---

## Phase 1.0: Test Foundation

### FR1: Approvals Screen — NativeWind Layout
- [ ] Write test: screen renders with `bg-background` outer container (source-file className check)
- [ ] Write test: header renders "Approvals" title text
- [ ] Write test: count badge visible when items.length > 0
- [ ] Write test: count badge hidden when items.length === 0
- [ ] Write test: "Approve All" button rendered when items.length > 0
- [ ] Write test: "Approve All" button calls `approveAll()` on press
- [ ] Write test: "Approve All" button absent when items.length === 0
- [ ] Write test: error banner renders with error message text when error is non-null
- [ ] Write test: retry button in error banner calls `refetch()`
- [ ] Write test: no `StyleSheet.create` in approvals.tsx source (static analysis)
- [ ] Write test: no hardcoded hex colors in approvals.tsx source (static analysis)

### FR2: ApprovalCard — Visual Migration, Gestures Retained
- [ ] Write test: renders employee name text
- [ ] Write test: renders hours value text
- [ ] Write test: renders description text
- [ ] Write test: Approve button present and calls `onApprove` on press
- [ ] Write test: Reject button present and calls `onReject` on press
- [ ] Write test: no `StyleSheet.create` in ApprovalCard.tsx source (static analysis)
- [ ] Write test: no hardcoded hex values in ApprovalCard.tsx source (static analysis)
- [ ] Write test: gesture comment `// Gesture: PanResponder retained` present in source

### FR3: RejectionSheet — Dark Glass Aesthetic
- [ ] Write test: not rendered when `visible=false`
- [ ] Write test: rendered when `visible=true`
- [ ] Write test: TextInput accepts rejection reason text
- [ ] Write test: Confirm button calls `onConfirm(reason)` with entered text
- [ ] Write test: Confirm button disabled when reason is empty string
- [ ] Write test: Cancel button calls `onCancel()`
- [ ] Write test: no `StyleSheet.create` in RejectionSheet.tsx source (static analysis)
- [ ] Write test: no hardcoded hex in RejectionSheet.tsx source (except allowed exceptions)

### FR4: Empty State — Manager "All Clear" and Contributor Redirect
- [ ] Write test: manager empty state renders "All caught up" title
- [ ] Write test: manager empty state renders "No pending approvals" subtitle
- [ ] Write test: contributor state renders "This screen is for managers" text
- [ ] Write test: contributor state triggers `router.replace('/(tabs)')` via useEffect

### FR5: Loading State — SkeletonLoader Cards
- [ ] Write test: `isLoading=true` with `items=[]` renders exactly 3 skeleton-loader elements
- [ ] Write test: `isLoading=true` with existing `items` shows items, not skeletons
- [ ] Write test: no `ActivityIndicator` in loading state (source-file check or rendered output)

### FR6: Type Badges — Gold (Manual) and Warning (Overtime) Pills
- [ ] Write test: MANUAL item renders badge text "Manual"
- [ ] Write test: OVERTIME item renders badge text "Overtime"
- [ ] Write test: no "Manual" badge on OVERTIME item
- [ ] Write test: OVERTIME item renders cost value (e.g. "$12.50")
- [ ] Write test: no `StyleSheet` badge styling in ApprovalCard source (covered by FR2 test)

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching `ApprovalItem` discriminated union
- [ ] Static source-file analysis tests read actual file content (not rendered output)
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Approvals Screen — NativeWind Layout
- [ ] Remove `StyleSheet.create()` and all style references from approvals.tsx
- [ ] Apply `className="flex-1 bg-background"` to root View
- [ ] Migrate header to NativeWind: `bg-surface border-b border-border px-4 pt-14 pb-3`
- [ ] Migrate title to `text-textPrimary text-xl font-display-bold`
- [ ] Migrate count badge to `bg-violet/20 rounded-full` with `text-violet text-xs font-sans-bold`
- [ ] Migrate "Approve All" Pressable to `bg-success rounded-xl px-4 py-2`
- [ ] Migrate error banner to `bg-critical/10` with `text-critical`
- [ ] Set `RefreshControl tintColor="#10B981"`
- [ ] Verify all tests pass

### FR2: ApprovalCard — Visual Migration, Gestures Retained
- [ ] Add `// Gesture: PanResponder retained — Reanimated gesture migration is out of scope` comment
- [ ] Remove `StyleSheet.create()` from ApprovalCard.tsx
- [ ] Apply `className="relative mx-4 my-1.5 rounded-2xl overflow-hidden"` to container
- [ ] Apply `className="absolute top-0 bottom-0 left-0 w-1/2 bg-success rounded-l-2xl"` to approve bg
- [ ] Apply `className="absolute top-0 bottom-0 right-0 w-1/2 bg-destructive rounded-r-2xl"` to reject bg
- [ ] Apply `className="bg-surface rounded-2xl p-3.5"` to `Animated.View` (keep `style={{ transform }}`)
- [ ] Apply NativeWind className to name, hours, description texts
- [ ] Apply `bg-success/20` and `text-success` to approve button
- [ ] Apply `bg-destructive/20` and `text-destructive` to reject button
- [ ] Verify all tests pass

### FR3: RejectionSheet — Dark Glass Aesthetic
- [ ] Remove `StyleSheet.create()` from RejectionSheet.tsx
- [ ] Apply `className="bg-surfaceElevated rounded-t-3xl p-5 pb-9 border-t border-border"` to sheet
- [ ] Apply `className="text-textPrimary text-lg font-sans-semibold mb-4"` to title
- [ ] Apply `className="border border-border rounded-xl p-3 text-textPrimary text-base bg-surface min-h-[80px] mb-4"` to TextInput
- [ ] Set `placeholderTextColor="#484F58"` on TextInput
- [ ] Apply NativeWind className to cancel and confirm buttons
- [ ] Use conditional className for enabled/disabled confirm state
- [ ] Verify all tests pass

### FR4: Empty State — Manager "All Clear" and Contributor Redirect
- [ ] Replace `ActivityIndicator` empty state with `Card`-wrapped "All caught up" view
- [ ] Add ✓ icon with `className="text-5xl text-success mb-3"`
- [ ] Add "All caught up" title with `className="text-textPrimary text-xl font-sans-semibold mb-1.5"`
- [ ] Add "No pending approvals" subtitle with `className="text-textSecondary text-sm text-center"`
- [ ] Add contributor redirect state with `Card elevated` and message text
- [ ] Verify all tests pass

### FR5: Loading State — SkeletonLoader Cards
- [ ] Import `SkeletonLoader` from `@/src/components/SkeletonLoader`
- [ ] Replace `ActivityIndicator` loading branch with 3x `SkeletonLoader` inside padded View
- [ ] Each SkeletonLoader: `className="h-24 rounded-2xl"`
- [ ] Preserve items + RefreshControl during refresh (condition: `isLoading && items.length === 0`)
- [ ] Remove `ActivityIndicator` import if unused (check approveAll spinner still works)
- [ ] Verify all tests pass

### FR6: Type Badges — Gold (Manual) and Warning (Overtime) Pills
- [ ] Add gold pill badge in ApprovalCard header row for `category === 'MANUAL'`
- [ ] Add warning pill badge in ApprovalCard header row for `category === 'OVERTIME'`
- [ ] Gold pill: `bg-gold/20 rounded-full px-2 py-0.5` + `text-gold text-xs font-sans-medium`
- [ ] Warning pill: `bg-warning/20 rounded-full px-2 py-0.5` + `text-warning text-xs font-sans-medium`
- [ ] Add cost display for OVERTIME: `text-success text-sm font-sans-semibold`
- [ ] Confirm `item.category` (not `item.type`) used as discriminant
- [ ] Verify all tests pass

---

## Phase 1.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation
- [ ] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(07-approvals-tab): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(07-approvals-tab): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] No `StyleSheet.create()` in any of the 3 modified files
- [ ] No hardcoded hex (except documented exceptions in RejectionSheet)
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-14**: Spec created. 6 FRs: screen migration (FR1), ApprovalCard visual migration with PanResponder retained (FR2), RejectionSheet dark glass (FR3), empty states (FR4), skeleton loaders (FR5), type badges (FR6). Key exception: backdrop rgba and placeholderTextColor in RejectionSheet may use literal values.
