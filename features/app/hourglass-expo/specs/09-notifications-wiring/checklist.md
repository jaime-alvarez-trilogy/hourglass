# Checklist: 09-notifications-wiring

## Phase 1.0 — Tests (write failing tests first)

### FR1: setNotificationHandler at module scope
- [x] test: `Notifications.setNotificationHandler` is called with `shouldShowAlert: true`
- [x] test: `Notifications.setNotificationHandler` is called with `shouldPlaySound: true`
- [x] test: `Notifications.setNotificationHandler` is called with `shouldSetBadge: false`
- [x] test: handler call happens at module load (not inside a component render)

### FR2: registerPushToken on setup complete
- [x] test: `registerPushToken` called when `config.setupComplete` transitions to `true`
- [x] test: `registerPushToken` NOT called when `config` is null
- [x] test: `registerPushToken` NOT called when `config.setupComplete` is `false`
- [x] test: `registerPushToken` called at most once per mount (re-render guard)
- [x] test: `registerPushToken` throws → error swallowed, no crash

### FR3: registerBackgroundPushHandler on mount
- [x] test: `registerBackgroundPushHandler` called on component mount
- [x] test: subscription `.remove()` called on unmount

### FR4: unregisterPushToken on logout
- [x] test: `unregisterPushToken` called before `clearAll` in sign-out action
- [x] test: `clearAll` still called if `unregisterPushToken` throws
- [x] test: `router.replace('/(auth)/welcome')` still called after both

## Phase 1.1 — Implementation

### FR1
- [x] impl: import `* as Notifications from 'expo-notifications'` in `app/_layout.tsx`
- [x] impl: add `Notifications.setNotificationHandler(...)` at module scope in `app/_layout.tsx`

### FR2
- [x] impl: import `registerPushToken` from `@/src/lib/pushToken` in `app/_layout.tsx`
- [x] impl: add `hasRegisteredToken = useRef(false)` inside `RootLayout`
- [x] impl: add `useEffect` watching `config?.setupComplete` to call `registerPushToken().catch(() => {})`

### FR3
- [x] impl: import `registerBackgroundPushHandler` from `@/src/notifications/handler` in `app/_layout.tsx`
- [x] impl: add `pushSubscription = useRef<Notifications.Subscription | null>(null)` inside `RootLayout`
- [x] impl: add `useEffect([], ...)` to call `registerBackgroundPushHandler()` and store subscription
- [x] impl: cleanup function calls `pushSubscription.current?.remove()`

### FR4
- [x] impl: import `unregisterPushToken` from `@/src/lib/pushToken` in `app/modal.tsx`
- [x] impl: prepend `await unregisterPushToken().catch(() => {})` before `await clearAll()` in `handleSignOut`

## Phase 1.2 — Review

- [x] Run spec-implementation-alignment: verify all FR success criteria met — PASS
- [x] Run pr-review-toolkit:review-pr: address inline feedback — no issues found
- [x] Run test-optimiser: remove redundant tests, verify coverage is sufficient — no redundancy
- [x] Verify all tests pass: 19/19 tests pass (3584/3584 full suite)
- [x] Commit documentation: checklist.md + FEATURE.md changelog updated

## Session Notes

**2026-04-05**: Spec execution complete.
- Phase 1.0: 2 test commits (layout-notifications FR1-FR3, modal-signout FR4)
- Phase 1.1: 1 implementation commit (FR1-FR4 all in same commit)
- Phase 1.2: Review passed, 0 fix commits
- Test iteration: FR1 mock ordering fixed (module-level require); FR4 trigger fixed (renderer.root.findAll vs JSON tree); CSS moduleNameMapper added to jest.config.js
- All 19 new tests passing, 3584/3584 full suite passing
