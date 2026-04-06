# 09-notifications-wiring

**Status:** Draft
**Created:** 2026-04-05
**Last Updated:** 2026-04-05
**Owner:** @jalvarez0907

---

## Overview

### What

Wire four notification lifecycle calls into the app entry point and logout flow:

1. `Notifications.setNotificationHandler` — module-scope foreground display config in `app/_layout.tsx`
2. `registerPushToken()` — called once when `config.setupComplete` becomes true in `RootLayout`
3. `registerBackgroundPushHandler()` — subscription registered on mount, cleaned up on unmount in `RootLayout`
4. `unregisterPushToken()` — called before `clearAll()` in `handleSignOut()` in `app/modal.tsx`

### Why

The notification infrastructure (pushToken.ts, handler.ts) was fully built in spec 07-ping-server but never connected to the app lifecycle. Without these four wiring calls:

- The Railway ping server never receives device tokens and cannot send silent pushes to this device
- Background pushes arrive but are silently dropped (no handler registered)
- Foreground notification display is undefined (no handler set)
- Device tokens accumulate as stale entries on the server after logout

### How

The changes are additive — no existing logic is modified, only imports and hook calls added to two existing files.

`app/_layout.tsx`:
- Add `Notifications.setNotificationHandler(...)` at module scope (above the component), configuring foreground display
- Add `useRef<boolean>` guard + `useEffect` watching `config?.setupComplete` to call `registerPushToken()` exactly once per session
- Add `useRef<Notifications.Subscription | null>` + `useEffect` on mount to call `registerBackgroundPushHandler()`, storing the subscription for cleanup

`app/modal.tsx`:
- In `handleSignOut()`, prepend `await unregisterPushToken().catch(() => {})` before the existing `await clearAll()`

All error paths are fire-and-forget (`catch(() => {})`), so network failures never block app launch or logout.

---

## Out of Scope

1. **Notification permission UI** — **Descoped.** `registerPushToken()` already calls `Notifications.requestPermissionsAsync()` internally and returns silently on denial. No separate permission prompt screen is needed.

2. **Custom notification categories or action buttons** — **Descoped.** Notifications are display-only (`shouldShowAlert: true`). Interactive notification actions (e.g. approve directly from notification) are post-launch.

3. **Background fetch beyond silent push** — **Descoped.** iOS background app refresh without push is a separate capability. This spec only handles the silent push → foreground wake path already implemented in handler.ts.

4. **Android notification channels** — **Descoped.** Channel configuration (`setNotificationChannelAsync`) is Android-specific setup outside this spec's scope. expo-notifications uses a default channel unless configured.

5. **Push token rotation** — **Descoped.** Expo push tokens occasionally rotate. Token refresh logic (listening for `addPushTokenListener`) is deferred.

6. **Scheduled local notifications** — **Deferred to 10-scheduled-notifications.** Deadline reminders (Thursday 6pm) and weekly summary (Monday 9am) are handled in the next spec which depends on this one.

7. **Notification preferences/settings UI** — **Descoped.** No user-facing toggle to enable/disable notifications in this spec.

8. **Testing pushToken.ts or handler.ts internals** — **Descoped.** Those units are already tested in `src/__tests__/lib/pushToken.test.ts` and `src/__tests__/notifications/handler.test.ts`. This spec only tests the wiring calls in `_layout.tsx` and `modal.tsx`.

---

## Functional Requirements

### FR1: setNotificationHandler at module scope

At the top of `app/_layout.tsx`, outside any component function, call `Notifications.setNotificationHandler` with a handler that enables foreground notification display.

**Success Criteria:**
- `Notifications.setNotificationHandler` is called exactly once when the module loads (module scope, not inside a component or effect)
- The handler returns `{ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }`
- The call is placed before the `SplashScreen.preventAutoHideAsync()` call or at minimum before any component renders

---

### FR2: registerPushToken on setup complete

Inside `RootLayout`, register a push token exactly once when `config.setupComplete` first becomes true.

**Success Criteria:**
- `registerPushToken()` is called when `config?.setupComplete` transitions to `true`
- `registerPushToken()` is NOT called when `config` is null or `config.setupComplete` is false
- `registerPushToken()` is called at most once per component mount (a `useRef` guard prevents duplicate calls on re-renders)
- Errors from `registerPushToken()` are swallowed with `.catch(() => {})` — no crash, no error display
- The `useRef` guard is initialized to `false` so re-mounting after logout allows re-registration in a new session

---

### FR3: registerBackgroundPushHandler on mount

Inside `RootLayout`, register the background push handler on component mount and clean it up on unmount.

**Success Criteria:**
- `registerBackgroundPushHandler()` is called once on component mount (empty dependency array `[]`)
- The returned `Subscription` is stored in a `useRef`
- On component unmount, `subscription.remove()` is called
- If `registerBackgroundPushHandler()` is called again on re-mount, a new subscription is registered

---

### FR4: unregisterPushToken on logout

In `handleSignOut()` in `app/modal.tsx`, call `unregisterPushToken()` before `clearAll()`.

**Success Criteria:**
- `unregisterPushToken()` is called before `clearAll()` in the destructive sign-out action handler
- `unregisterPushToken()` is awaited (not fire-and-forget at call site)
- Errors from `unregisterPushToken()` are swallowed with `.catch(() => {})` — logout always completes
- `clearAll()` is still called even if `unregisterPushToken()` throws
- Navigation to `/(auth)/welcome` still occurs after both calls

---

## Technical Design

### Files to Reference (do NOT modify)

| File | Purpose |
|------|---------|
| `src/lib/pushToken.ts` | Exports `registerPushToken()` and `unregisterPushToken()` |
| `src/notifications/handler.ts` | Exports `registerBackgroundPushHandler()` returning `Notifications.Subscription` |
| `src/hooks/useConfig.ts` | `useConfig()` hook — returns `{ config, isLoading }` where `config.setupComplete: boolean` |
| `src/__tests__/lib/pushToken.test.ts` | Mock patterns to follow for `registerPushToken` / `unregisterPushToken` |
| `src/__tests__/notifications/handler.test.ts` | Mock patterns to follow for `registerBackgroundPushHandler` |

### Files to Create/Modify

| File | Change |
|------|--------|
| `app/_layout.tsx` | Add `setNotificationHandler` at module scope; add `useRef` guards + `useEffect` hooks for FR2 and FR3 |
| `app/modal.tsx` | Add `unregisterPushToken` import; prepend call in `handleSignOut` before `clearAll()` |
| `app/__tests__/layout-notifications.test.tsx` | New test file — FR1, FR2, FR3 |
| `app/__tests__/modal-signout.test.tsx` | New test file — FR4 (logout ordering) |

### Data Flow

```
App boot
  └─ module load: Notifications.setNotificationHandler(...)   [FR1]
  └─ RootLayout mounts:
       ├─ useEffect([]) → registerBackgroundPushHandler()     [FR3]
       │    └─ stores Subscription in pushSubscription.current
       └─ useEffect([config?.setupComplete]):
            └─ if setupComplete && !hasRegistered → registerPushToken()  [FR2]

User logs out (modal.tsx handleSignOut)
  └─ unregisterPushToken()   [FR4]
  └─ clearAll()
  └─ queryClient.setQueryData(['config'], null)
  └─ router.replace('/(auth)/welcome')

RootLayout unmounts (after logout redirect)
  └─ useEffect cleanup: pushSubscription.current?.remove()  [FR3]
```

### Implementation Details

**FR1 — module scope placement:**

```typescript
// app/_layout.tsx — before SplashScreen.preventAutoHideAsync()
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

**FR2 — registration guard:**

```typescript
const hasRegisteredToken = useRef(false);

useEffect(() => {
  if (!config?.setupComplete || hasRegisteredToken.current) return;
  hasRegisteredToken.current = true;
  registerPushToken().catch(() => {});
}, [config?.setupComplete]);
```

**FR3 — subscription lifecycle:**

```typescript
const pushSubscription = useRef<Notifications.Subscription | null>(null);

useEffect(() => {
  pushSubscription.current = registerBackgroundPushHandler();
  return () => {
    pushSubscription.current?.remove();
  };
}, []);
```

**FR4 — logout ordering:**

```typescript
onPress: async () => {
  await unregisterPushToken().catch(() => {});
  await clearAll();
  queryClient.setQueryData(['config'], null);
  router.replace('/(auth)/welcome');
},
```

### Mock Strategy for Tests

**layout-notifications.test.tsx:**

```typescript
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('@/src/lib/pushToken', () => ({
  registerPushToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/src/notifications/handler', () => ({
  registerBackgroundPushHandler: jest.fn(() => ({ remove: jest.fn() })),
}));
```

**modal-signout.test.tsx:**

```typescript
jest.mock('@/src/lib/pushToken', () => ({
  unregisterPushToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/src/store/config', () => ({
  clearAll: jest.fn().mockResolvedValue(undefined),
  loadCredentials: jest.fn().mockResolvedValue(null),
  saveConfig: jest.fn().mockResolvedValue(undefined),
}));
```

### Edge Cases

| Case | Handling |
|------|---------|
| `registerPushToken` network failure | `.catch(() => {})` swallows — no crash, no toast |
| `unregisterPushToken` network failure | `.catch(() => {})` swallows — logout still completes |
| Component re-renders while `setupComplete` is true | `hasRegisteredToken.current` prevents duplicate `registerPushToken` calls |
| `config` null on mount | `config?.setupComplete` is `undefined` (falsy) — effect skips registration |
| Re-mount after logout | `hasRegisteredToken` ref is fresh on new mount — allows re-registration for new session |
| Rapid mount/unmount | `pushSubscription.current?.remove()` cleanup handles any in-progress subscription |
