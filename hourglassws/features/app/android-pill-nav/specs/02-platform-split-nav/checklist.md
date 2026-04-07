# Checklist: 02-platform-split-nav

## Phase 2.0 — Tests (Red Phase)

### FR1 — Platform Split Logic
- [ ] test(FR1): verify `_layout.tsx` does NOT use `USE_NATIVE_TABS` / `ENABLE_NATIVE_TABS` as branch condition (SC1.1)
- [ ] test(FR1): verify `Platform.OS === 'ios'` (or `!== 'android'`) used as branch (SC1.2)
- [ ] test(FR1): verify NativeTabs path present for iOS branch (SC1.3)
- [ ] test(FR1): verify `<Tabs>` + `tabBar` prop present for Android branch (SC1.4)

### FR2 — FloatingPillTabBar Wiring
- [ ] test(FR2): verify `FloatingPillTabBar` imported from `@/src/components/FloatingPillTabBar` (SC2.1)
- [ ] test(FR2): verify `tabBar` prop present on Android `<Tabs>` referencing `FloatingPillTabBar` (SC2.2)
- [ ] test(FR2): verify `tintColor={colors.violet}` passed to FloatingPillTabBar (SC2.3)
- [ ] test(FR2): verify `inactiveTintColor={colors.textMuted}` passed to FloatingPillTabBar (SC2.4)
- [ ] test(FR2): verify `badgeCounts` passed to FloatingPillTabBar (SC2.5)

### FR3 — Screen Content Padding
- [ ] test(FR3): verify `PILL_BOTTOM_OFFSET` constant defined and `>= 100` (SC3.1)
- [ ] test(FR3): verify `contentStyle` includes `paddingBottom` in Android screenOptions (SC3.2)
- [ ] test(FR3): verify `tabBarStyle: { display: 'none' }` in Android screenOptions (SC3.3)
- [ ] test(FR3): verify `headerShown: false` in Android screenOptions (SC3.4)

### FR4 — iOS Path Unchanged
- [ ] test(FR4): verify NativeTabs receives `tintColor={colors.violet}` (SC4.1)
- [ ] test(FR4): verify NativeTabs receives `iconColor` with default/selected values (SC4.2)
- [ ] test(FR4): verify NativeTabs receives `blurEffect="systemUltraThinMaterialDark"` (SC4.3)
- [ ] test(FR4): verify NativeTabs receives `backgroundColor` prop (SC4.4)
- [ ] test(FR4): verify NativeTabs receives `shadowColor="transparent"` (SC4.5)
- [ ] test(FR4): verify `<NoiseOverlay />` still rendered (SC4.6)
- [ ] test(FR4): verify `approvalBadge` / `NativeTabs.Trigger.Badge` still wired (SC4.7)

### FR5 — Test Updates
- [ ] test(FR5): add new `02-platform-split-nav` describe block to `native-tabs.test.tsx` (SC5.1-SC5.6)
- [ ] test(FR5): remove/update prior FR1 `ENABLE_NATIVE_TABS` test in `native-tabs.test.tsx` (SC5.7)
- [ ] test(FR5): confirm `layout.test.tsx` needs no changes (SC5.9)

---

## Phase 2.1 — Implementation

### FR1 — Platform Split Logic
- [ ] feat(FR1): remove `Constants` import and `USE_NATIVE_TABS` constant from `_layout.tsx`
- [ ] feat(FR1): add `const isIOS = Platform.OS === 'ios'` in `TabLayout` component body
- [ ] feat(FR1): replace `if (USE_NATIVE_TABS)` branch with `if (isIOS)` branch

### FR2 — FloatingPillTabBar Wiring
- [ ] feat(FR2): import `FloatingPillTabBar` from `@/src/components/FloatingPillTabBar`
- [ ] feat(FR2): wire `tabBar` prop on Android `<Tabs>` with `tintColor`, `inactiveTintColor`, `badgeCounts`
- [ ] feat(FR2): use `TAB_SCREENS.map(...)` to drive Android `<Tabs>` screens (same as legacy path)

### FR3 — Screen Content Padding
- [ ] feat(FR3): add `PILL_BOTTOM_OFFSET = 112` module-level constant
- [ ] feat(FR3): add `contentStyle: { paddingBottom: PILL_BOTTOM_OFFSET }` to Android `screenOptions`
- [ ] feat(FR3): add `tabBarStyle: { display: 'none' }` to Android `screenOptions`

### FR4 — iOS Path Unchanged
- [ ] feat(FR4): verify iOS `NativeTabs` path is unmodified after refactor
- [ ] feat(FR4): ensure `<NoiseOverlay />` present in Android path

### FR5 — Test Updates
- [ ] feat(FR5): run full test suite after changes — all existing tests must pass

---

## Phase 2.2 — Review

- [ ] spec-implementation-alignment: verify `_layout.tsx` matches all FR success criteria
- [ ] pr-review-toolkit:review-pr: full PR review pass
- [ ] Address any review feedback
- [ ] test-optimiser: review test quality in `native-tabs.test.tsx`

---

## Session Notes

_Added when spec execution completes._
