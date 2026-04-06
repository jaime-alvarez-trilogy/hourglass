# Spec Research: 09-notifications-wiring

## Problem Context

The notification infrastructure is fully built and tested but completely unwired from the
app lifecycle. `registerPushToken()`, `registerBackgroundPushHandler()`, and
`unregisterPushToken()` are never called from the app entry point or logout flow, meaning:

- The Railway ping server never receives device tokens → never sends silent pushes to this device
- The background handler is never registered → silent pushes arrive and are silently dropped
- Foreground notification display is undefined → `setNotificationHandler` never called
- Device tokens accumulate as stale entries on the server after logout

This spec wires those four calls into the correct lifecycle points.

## Exploration Findings

### Existing Infrastructure (all confirmed correct, no changes needed)

**`src/lib/pushToken.ts`**
- `registerPushToken()`: requests permission → `getExpoPushTokenAsync({ projectId })` → POST `/register` → stores in AsyncStorage key `'push_token'`
- `unregisterPushToken()`: reads from AsyncStorage → POST `/unregister` → removes from AsyncStorage; idempotent on missing token
- `projectId` sourced from `Constants.expoConfig?.extra?.eas?.projectId`
- Ping server URL: hardcoded `https://hourglass-ping.railway.app` (fallback from `EXPO_PUBLIC_PING_SERVER_URL`)

**`src/notifications/handler.ts`**
- `registerBackgroundPushHandler()`: calls `Notifications.addNotificationReceivedListener(handleBackgroundPush)` → returns `Subscription`
- `handleBackgroundPush()`: filters for `data.type === 'bg_refresh'` → `fetchFreshData()` → `updateWidgetData()` → approval count diff → `scheduleLocalNotification(count)`
- Fully self-contained, all imports resolve, tests pass

**Railway server** (`https://hourglass-ping.railway.app`)
- Live and responding
- Every 15 min: fetches all tokens → sends `{ to, data: { type: 'bg_refresh' }, _contentAvailable: true }` batches via Expo Push API

### Integration Points

**`app/_layout.tsx`** — where wiring must go
- `useConfig()` returns `{ config, isLoading }` — `config.setupComplete` is the login signal
- Auth redirect: `useEffect` on `[isLoading, config, segments, router]` redirects to `/(auth)/welcome` when not logged in
- Currently has no notification-related code

**`app/modal.tsx`** — logout location
- `handleSignOut()` calls `clearAll()` then `queryClient.setQueryData(['config'], null)` then `router.replace('/(auth)/welcome')`
- `clearAll()` in `src/store/config.ts` removes AsyncStorage config key + SecureStore credentials
- **`unregisterPushToken()` must be called BEFORE `clearAll()`** — once credentials are gone, the stored push token key is still accessible but we want to clean up server-side first

### setNotificationHandler Placement

`Notifications.setNotificationHandler` must be called at module scope (outside any component)
at the app entry file — expo-notifications docs require it to be set before any notification
can be received. Placing it at the top of `app/_layout.tsx` (outside the component) is the
correct pattern.

## Key Decisions

1. **Permission request**: handled inside `registerPushToken()` already — no separate permission
   prompt needed. If user denies, `registerPushToken` returns silently.

2. **Registration timing**: call `registerPushToken()` in a `useEffect` that fires when
   `config?.setupComplete === true`. Guard with a `useRef` so it only runs once per session
   (not on every re-render).

3. **Subscription cleanup**: `registerBackgroundPushHandler()` returns a `Subscription`.
   Store in a `useRef`, call `.remove()` in the `useEffect` cleanup function.

4. **Logout ordering**: `unregisterPushToken()` → then `clearAll()`. The push token key in
   AsyncStorage is independent of the config/credentials keys cleared by `clearAll()`.

5. **Error isolation**: both `registerPushToken` and `unregisterPushToken` are fire-and-forget.
   Wrap in `.catch(() => {})` so network failures never block the app launch or logout flow.

## Interface Contracts

### FR1: setNotificationHandler at module scope

```typescript
// At top of app/_layout.tsx, outside any component:
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

**Source**: `expo-notifications` docs — must be module-level, called before first notification received.

### FR2: registerPushToken on setup complete

```typescript
// Inside RootLayout component:
const hasRegisteredToken = useRef(false);

useEffect(() => {
  if (!config?.setupComplete || hasRegisteredToken.current) return;
  hasRegisteredToken.current = true;
  registerPushToken().catch(() => {});
}, [config?.setupComplete]);
```

**Source**: `config.setupComplete` ← `useConfig()` ← AsyncStorage `'crossover_config'`

### FR3: registerBackgroundPushHandler on mount

```typescript
// Inside RootLayout component:
const pushSubscription = useRef<Notifications.Subscription | null>(null);

useEffect(() => {
  pushSubscription.current = registerBackgroundPushHandler();
  return () => {
    pushSubscription.current?.remove();
  };
}, []);
```

**Source**: `registerBackgroundPushHandler()` ← `src/notifications/handler.ts`

### FR4: unregisterPushToken on logout

```typescript
// In handleSignOut() in app/modal.tsx, before clearAll():
onPress: async () => {
  await unregisterPushToken().catch(() => {});
  await clearAll();
  queryClient.setQueryData(['config'], null);
  router.replace('/(auth)/welcome');
}
```

**Source**: `unregisterPushToken()` ← `src/lib/pushToken.ts`

## Test Plan

### FR1: setNotificationHandler
**Signature**: `Notifications.setNotificationHandler(handler)` — side effect, module scope

- [ ] Handler config: `shouldShowAlert: true`, `shouldPlaySound: true`, `shouldSetBadge: false`
- [ ] Called at module scope (outside component) in `_layout.tsx`

**Mocks**: `expo-notifications` mock — verify `setNotificationHandler` called with correct config

### FR2: registerPushToken on setup complete

**Happy path:**
- [ ] Called once when `config.setupComplete` transitions to `true`
- [ ] Not called again on re-render
- [ ] Not called when `config.setupComplete` is `false`
- [ ] Not called when `config` is null

**Edge cases:**
- [ ] `registerPushToken` throws → error swallowed, no crash
- [ ] Called again after re-mount → `hasRegisteredToken` ref prevents double-call

**Mocks**: mock `registerPushToken` from `src/lib/pushToken`

### FR3: registerBackgroundPushHandler on mount

**Happy path:**
- [ ] `registerBackgroundPushHandler()` called on mount
- [ ] Subscription `.remove()` called on unmount

**Mocks**: mock `registerBackgroundPushHandler` returning `{ remove: jest.fn() }`

### FR4: unregisterPushToken on logout

**Happy path:**
- [ ] `unregisterPushToken()` called before `clearAll()` in `handleSignOut`
- [ ] `clearAll()` still called if `unregisterPushToken` throws
- [ ] Navigation to `/(auth)/welcome` still happens

**Edge cases:**
- [ ] Network failure in `unregisterPushToken` → swallowed, logout completes normally

**Mocks**: mock `unregisterPushToken`, `clearAll`, `router.replace`

## Files to Create/Modify

| File | Change |
|------|--------|
| `app/_layout.tsx` | Add `setNotificationHandler`, `registerPushToken` effect, `registerBackgroundPushHandler` effect |
| `app/modal.tsx` | Add `unregisterPushToken` to `handleSignOut` |
| `app/__tests__/layout-notifications.test.tsx` | New — FR1–FR3 tests |
| `app/__tests__/modal-signout.test.tsx` | New or update — FR4 test |

## Files to Reference

- `app/_layout.tsx` — integration target (full file read before editing)
- `app/modal.tsx` — logout integration target (full file read before editing)
- `src/lib/pushToken.ts` — `registerPushToken`, `unregisterPushToken`
- `src/notifications/handler.ts` — `registerBackgroundPushHandler`
- `src/hooks/useConfig.ts` — `config.setupComplete` shape
- `src/__tests__/lib/pushToken.test.ts` — mock patterns to follow
- `src/__tests__/notifications/handler.test.ts` — mock patterns to follow
