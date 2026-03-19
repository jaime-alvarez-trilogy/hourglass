# Implementation Checklist

Spec: `06-native-tabs`
Feature: `brand-revamp`

---

## Phase 1.0: Test Foundation

### FR1: Feature flag in app.json
- [ ] Write test: `app.json` expo.extra contains `ENABLE_NATIVE_TABS: true` (SC1.1)
- [ ] Write test: `app.json` expo.extra contains `ENABLE_SHARED_ELEMENT_TRANSITIONS: true` (SC1.2)
- [ ] Write test: existing `router` and `eas` keys inside extra are preserved unchanged (SC1.3)

### FR2: Feature flag read in _layout.tsx
- [ ] Write test: `Constants` is imported from `expo-constants` in source (SC2.4)
- [ ] Write test: when `ENABLE_NATIVE_TABS=true`, layout renders `NativeTabs` navigator (SC2.1)
- [ ] Write test: when `ENABLE_NATIVE_TABS=false`, layout renders legacy `Tabs` navigator (SC2.2)
- [ ] Write test: when flag is absent from Constants, layout defaults to false / legacy Tabs (SC2.3)

### FR3: TAB_SCREENS shared constant
- [ ] Write test: source declares `TAB_SCREENS` constant (SC3.1)
- [ ] Write test: all four visible tabs present — index, overview, ai, approvals (SC3.1)
- [ ] Write test: explore entry has `href: null` (SC3.2)
- [ ] Write test: each visible tab has correct icon name (SC3.4)
- [ ] Write test: tab titles are Home, Overview, AI, Requests (SC3.5)

### FR4: NativeTabs navigator render path
- [ ] Write test: `unstable_NativeTabs` imported from `expo-router/unstable-native-tabs` (SC4.1)
- [ ] Write test: active tint color is `colors.violet` (SC4.2)
- [ ] Write test: inactive tint color is `colors.textMuted` (SC4.3)
- [ ] Write test: source does NOT use `tabBarStyle` on the NativeTabs path (SC4.4)
- [ ] Write test: approvals tab receives `tabBarBadge` equal to item count when > 0 (SC4.5)
- [ ] Write test: approvals tab badge is `undefined` when item count is 0 (SC4.6)
- [ ] Write test: explore tab options include `href: null` in rendered output (SC4.7)

### FR5: Legacy Tabs fallback path
- [ ] Write test: source does NOT import `HapticTab` (SC5.3)
- [ ] Write test: source does NOT contain `tabBarButton: HapticTab` (SC5.2)
- [ ] Write test: `tabBarStyle` is present in the legacy Tabs screenOptions section of source (SC5.4)

### FR6: AmbientBackground / NoiseOverlay layout unchanged
- [ ] Write test: `<NoiseOverlay />` appears after navigator close tag in source (SC6.1)
- [ ] Write test: outer `View` with `flex: 1` still wraps navigator (SC6.2)
- [ ] Write test: all six hooks remain imported and called in source (SC6.3)

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Feature flag in app.json
- [ ] Add `"ENABLE_NATIVE_TABS": true` to `hourglassws/app.json` expo.extra
- [ ] Add `"ENABLE_SHARED_ELEMENT_TRANSITIONS": true` to `hourglassws/app.json` expo.extra
- [ ] Verify existing `router` and `eas` keys are preserved

### FR2: Feature flag read in _layout.tsx
- [ ] Add `import Constants from 'expo-constants';` to `_layout.tsx`
- [ ] Add `const USE_NATIVE_TABS = Constants.expoConfig?.extra?.ENABLE_NATIVE_TABS ?? false;` at module level

### FR3: TAB_SCREENS shared constant
- [ ] Define `TAB_SCREENS` constant array with all 5 entries (4 visible + explore hidden)
- [ ] Include `name`, `title`, `icon` for each visible tab
- [ ] Include `href: null` on the explore entry
- [ ] Annotate with `as const`

### FR4: NativeTabs navigator render path
- [ ] Add `import { unstable_NativeTabs as NativeTabs } from 'expo-router/unstable-native-tabs';`
- [ ] Implement NativeTabs render branch with `tabBarActiveTintColor: colors.violet` and `tabBarInactiveTintColor: colors.textMuted`
- [ ] Map `TAB_SCREENS` to `NativeTabs.Screen` elements
- [ ] Wire `tabBarBadge: items.length > 0 ? items.length : undefined` on approvals screen
- [ ] Ensure NO `tabBarStyle` or `tabBarBackground` in NativeTabs screenOptions

### FR5: Legacy Tabs fallback path
- [ ] Remove `import { HapticTab } from '@/components/haptic-tab';` from `_layout.tsx`
- [ ] Remove `tabBarButton: HapticTab` from Tabs screenOptions
- [ ] Preserve `tabBarStyle` in legacy Tabs screenOptions
- [ ] Map `TAB_SCREENS` to `Tabs.Screen` elements in legacy path

### FR6: AmbientBackground / NoiseOverlay layout unchanged
- [ ] Preserve outer `<View style={{ flex: 1 }}>` wrapper
- [ ] Ensure `<NoiseOverlay />` placement is after navigator close tag
- [ ] Confirm all six hooks remain imported and called: `useHistoryBackfill`, `useHoursData`, `useAIData`, `useApprovalItems`, `useConfig`, `useWidgetSync`

---

## Phase 1.2: Review (MANDATORY)

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
- [ ] Commit fixes: `fix(06-native-tabs): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(06-native-tabs): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests (`tabs-layout.test.tsx`, `layout.test.tsx`)
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-19**: Spec created. Research confirmed: NativeTabs from `expo-router/unstable-native-tabs`, no new dependencies needed, HapticTab deprecated (file kept), existing test for `<Tabs` in source will still pass as legacy path remains in source.
