# Checklist: 09-notifications-wiring

## Phase 1.0 — Tests (write failing tests first)

### FR1: setNotificationHandler at module scope
- [ ] test: `Notifications.setNotificationHandler` is called with `shouldShowAlert: true`
- [ ] test: `Notifications.setNotificationHandler` is called with `shouldPlaySound: true`
- [ ] test: `Notifications.setNotificationHandler` is called with `shouldSetBadge: false`
- [ ] test: handler call happens at module load (not inside a component render)

### FR2: registerPushToken on setup complete
- [ ] test: `registerPushToken` called when `config.setupComplete` transitions to `true`
- [ ] test: `registerPushToken` NOT called when `config` is null
- [ ] test: `registerPushToken` NOT called when `config.setupComplete` is `false`
- [ ] test: `registerPushToken` called at most once per mount (re-render guard)
- [ ] test: `registerPushToken` throws → error swallowed, no crash

### FR3: registerBackgroundPushHandler on mount
- [ ] test: `registerBackgroundPushHandler` called on component mount
- [ ] test: subscription `.remove()` called on unmount

### FR4: unregisterPushToken on logout
- [ ] test: `unregisterPushToken` called before `clearAll` in sign-out action
- [ ] test: `clearAll` still called if `unregisterPushToken` throws
- [ ] test: `router.replace('/(auth)/welcome')` still called after both

## Phase 1.1 — Implementation

### FR1
- [ ] impl: import `* as Notifications from 'expo-notifications'` in `app/_layout.tsx`
- [ ] impl: add `Notifications.setNotificationHandler(...)` at module scope in `app/_layout.tsx`

### FR2
- [ ] impl: import `registerPushToken` from `@/src/lib/pushToken` in `app/_layout.tsx`
- [ ] impl: add `hasRegisteredToken = useRef(false)` inside `RootLayout`
- [ ] impl: add `useEffect` watching `config?.setupComplete` to call `registerPushToken().catch(() => {})`

### FR3
- [ ] impl: import `registerBackgroundPushHandler` from `@/src/notifications/handler` in `app/_layout.tsx`
- [ ] impl: add `pushSubscription = useRef<Notifications.Subscription | null>(null)` inside `RootLayout`
- [ ] impl: add `useEffect([], ...)` to call `registerBackgroundPushHandler()` and store subscription
- [ ] impl: cleanup function calls `pushSubscription.current?.remove()`

### FR4
- [ ] impl: import `unregisterPushToken` from `@/src/lib/pushToken` in `app/modal.tsx`
- [ ] impl: prepend `await unregisterPushToken().catch(() => {})` before `await clearAll()` in `handleSignOut`

## Phase 1.2 — Review

- [ ] Run spec-implementation-alignment: verify all FR success criteria met
- [ ] Run pr-review-toolkit:review-pr: address inline feedback
- [ ] Run test-optimiser: remove redundant tests, verify coverage is sufficient
- [ ] Verify all tests pass: `cd hourglassws && npx jest app/__tests__/layout-notifications app/__tests__/modal-signout --no-coverage`
- [ ] Commit documentation: checklist.md + FEATURE.md changelog updated
