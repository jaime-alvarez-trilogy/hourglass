# Spec Research: 10-scheduled-notifications

## Problem Context

Contributors need to be reminded of their Thursday hours deadline with live numbers
("3.5h to go — deadline tonight"), and both contributors and managers benefit from a
Monday morning summary of last week's performance ("Last week: $2,400 · 40h · 82% AI").

These are pure local notifications — no server, no push. The app schedules them using
`expo-notifications` whenever it opens, so the content stays fresh with the latest data.

## Exploration Findings

### Data Sources

**For Thursday deadline reminder:**

`src/lib/hours.ts` exports:
```typescript
// computeDeadlineCountdown() — pure function, no args
export function computeDeadlineCountdown(): DeadlineCountdown {
  // returns { msRemaining, label, urgency }
  // urgency: 'none' | 'warning' | 'critical' | 'expired'
}

export interface DeadlineCountdown {
  msRemaining: number;
  label: string;   // "2d 14h left" | "23h 45m left" | "45m left"
  urgency: 'none' | 'warning' | 'critical';
}
```

`hoursData.hoursRemaining` — from `useHoursData()` hook or via widget data AsyncStorage.
`config.weeklyLimit` — from `useConfig()`.

**For Monday summary:**

`src/lib/weeklyHistory.ts` exports:
```typescript
export async function loadWeeklyHistory(): Promise<WeeklySnapshot[]>

export interface WeeklySnapshot {
  weekStart: string;     // YYYY-MM-DD (Monday)
  hours: number;
  earnings: number;
  aiPct: number;         // 0 if unknown
  brainliftHours: number;
  overtime?: number;
}
```

Last week = `snapshots[snapshots.length - 2]` (second-to-last; last entry is current week).
If `snapshots.length < 2`, skip scheduling the summary.

### Scheduling Approach

`expo-notifications` `scheduleNotificationAsync` with a `CalendarTriggerInput`:

```typescript
// Thursday 6pm local time
await Notifications.scheduleNotificationAsync({
  content: { title: '...', body: '...' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    weekday: 5,   // 1=Sun, 2=Mon, ..., 5=Thu, 6=Fri, 7=Sat
    hour: 18,
    minute: 0,
    repeats: false,  // reschedule each week on app open
  },
});
```

Note: `weekday` in Expo's CalendarTrigger uses iOS convention: 1=Sunday ... 7=Saturday.
Thursday = 5. Do NOT use `repeats: true` — we need to cancel and reschedule with fresh
data each week.

**Monday 9am:**
```typescript
trigger: {
  type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
  weekday: 2,  // Monday
  hour: 9,
  minute: 0,
  repeats: false,
}
```

### Cancellation Strategy

Use notification identifiers to cancel before rescheduling:

```typescript
const THURSDAY_NOTIF_ID_KEY = 'notif_thursday_id';
const MONDAY_NOTIF_ID_KEY = 'notif_monday_id';

// Cancel existing before scheduling new:
const existingId = await AsyncStorage.getItem(THURSDAY_NOTIF_ID_KEY);
if (existingId) await Notifications.cancelScheduledNotificationAsync(existingId);

// Schedule and save new ID:
const id = await Notifications.scheduleNotificationAsync({ ... });
await AsyncStorage.setItem(THURSDAY_NOTIF_ID_KEY, id);
```

### When to Reschedule

The hook is called from `_layout.tsx` whenever config is ready and the app is in foreground.
Use `AppState` to re-trigger on foreground transitions:

```typescript
useEffect(() => {
  const sub = AppState.addEventListener('change', state => {
    if (state === 'active') scheduleAll();
  });
  return () => sub.remove();
}, []);
```

Also run once on mount (initial schedule).

### Permission Handling

`registerPushToken()` (spec 09) calls `requestPermissionsAsync()` which covers both push
AND local notification permissions — same permission on iOS. The scheduled notifications
hook should check `granted` status before scheduling but NOT request again:

```typescript
const { granted } = await Notifications.getPermissionsAsync();  // NOT request
if (!granted) return;
```

If spec 09 hasn't run yet (fresh install, first open before login), permissions may not be
granted yet. The hook silently skips scheduling. After login (spec 09 runs `requestPermissionsAsync`),
the hook will reschedule on next foreground transition.

## Key Decisions

1. **No API call in hook**: Use `loadWeeklyHistory()` (AsyncStorage) for Monday summary and
   `computeDeadlineCountdown()` (pure function) for Thursday timing. No live Crossover API
   call needed — cached data is sufficient for notification scheduling.

2. **`hoursRemaining` source**: Read from the last widget bridge write
   (`AsyncStorage 'widget_data'`) rather than calling the live API. This data is written
   every time the app opens or a background refresh runs — fresh enough for notifications.

3. **`repeats: false`**: Reschedule on each app open rather than using `repeats: true`.
   Gives us fresh data in the notification body every week.

4. **Only schedule if past Monday**: Don't schedule a Thursday notification on Friday or
   Saturday (deadline already passed this week). Check current day before scheduling.

5. **Skip if insufficient history**: Monday summary requires at least 2 snapshots in history
   (current + at least one past week). Skip if not enough data.

6. **Contributor-only for Thursday**: Schedule Thursday reminder for all users (contributors
   and managers both have a weekly hours target). Manager-only vs contributor distinction
   not needed here.

## Interface Contracts

### FR1: useScheduledNotifications hook

```typescript
// src/hooks/useScheduledNotifications.ts

export function useScheduledNotifications(
  config: CrossoverConfig | null,
): void
```

- Takes `config` to access `weeklyLimit` and `setupComplete`
- Returns nothing — side-effect only hook
- Called from `_layout.tsx` after config loads
- Does nothing if `config` is null or `!config.setupComplete`

**Source**: `config` ← `useConfig()` ← AsyncStorage `'crossover_config'`

### FR2: Thursday 6pm deadline reminder

```typescript
async function scheduleThursdayReminder(
  hoursRemaining: number,
  weeklyLimit: number,
): Promise<void>
```

- Reads existing notif ID from AsyncStorage, cancels it
- Checks current UTC weekday ≤ 4 (Mon=1 through Thu=4) — skips on Fri/Sat (deadline already passed)
- Schedules `weekday: 5, hour: 18, minute: 0`
- Notification content:
  - Title: `"Hours Deadline Tonight"`
  - Body: `hoursRemaining > 0 ? "${hoursRemaining.toFixed(1)}h to go" : "You've hit your ${weeklyLimit}h target 🎯"`
- Saves new notif ID to AsyncStorage

**Source fields**:
- `hoursRemaining` ← AsyncStorage `'widget_data'` → `hoursData.hoursRemaining`
- `weeklyLimit` ← `config.weeklyLimit`
- `computeDeadlineCountdown()` ← `src/lib/hours.ts`

### FR3: Monday 9am weekly summary

```typescript
async function scheduleMondaySummary(): Promise<void>
```

- Loads `loadWeeklyHistory()` from AsyncStorage
- Takes `snapshots[snapshots.length - 2]` as last week
- Skips if `snapshots.length < 2` or `lastWeek.hours === 0`
- Reads existing notif ID, cancels it
- Schedules `weekday: 2, hour: 9, minute: 0`
- Notification content:
  - Title: `"Last Week Summary"`
  - Body: `"$${Math.round(lastWeek.earnings).toLocaleString()} · ${lastWeek.hours.toFixed(1)}h${lastWeek.aiPct > 0 ? ` · ${lastWeek.aiPct}% AI` : ''}"`
- Saves new notif ID

**Source fields**:
- `lastWeek.*` ← `loadWeeklyHistory()` ← AsyncStorage `'weekly_history_v2'`

### FR4: AppState foreground trigger + mount trigger

```typescript
// Inside useScheduledNotifications:
useEffect(() => {
  if (!config?.setupComplete) return;

  scheduleAll();  // run on mount

  const sub = AppState.addEventListener('change', state => {
    if (state === 'active') scheduleAll();
  });
  return () => sub.remove();
}, [config?.setupComplete]);
```

**`scheduleAll()`** orchestrates:
1. Check permissions via `getPermissionsAsync()` — skip if not granted
2. Read widget data from AsyncStorage for `hoursRemaining`
3. Call `scheduleThursdayReminder(hoursRemaining, config.weeklyLimit)`
4. Call `scheduleMondaySummary()`
5. All errors caught and silently ignored

## Test Plan

### FR1: useScheduledNotifications

**Happy path:**
- [ ] Does nothing when `config` is null
- [ ] Does nothing when `config.setupComplete` is false
- [ ] Calls `scheduleAll` on mount when config ready
- [ ] Attaches AppState listener

**Edge cases:**
- [ ] Unmounts cleanly — AppState listener removed

**Mocks**: mock `AppState`, mock `scheduleThursdayReminder`, mock `scheduleMondaySummary`

### FR2: scheduleThursdayReminder

**Happy path:**
- [ ] Cancels existing notification before scheduling new one
- [ ] Schedules with `weekday: 5, hour: 18, minute: 0`
- [ ] Body includes `hoursRemaining` when > 0
- [ ] Body shows target-hit message when `hoursRemaining <= 0`
- [ ] Saves new notification ID to AsyncStorage

**Edge cases:**
- [ ] No existing ID in AsyncStorage → skip cancel, proceed to schedule
- [ ] Current UTC weekday is Friday (5) or Saturday (6) → skip scheduling (deadline already passed)
- [ ] `Notifications.scheduleNotificationAsync` throws → error swallowed

**Mocks**: mock `Notifications`, mock `AsyncStorage`, mock `computeDeadlineCountdown`

### FR3: scheduleMondaySummary

**Happy path:**
- [ ] Loads weekly history, takes second-to-last snapshot
- [ ] Cancels existing notification, schedules new one
- [ ] Body includes earnings, hours, aiPct when > 0
- [ ] Body omits AI% when aiPct === 0
- [ ] Saves new notification ID

**Edge cases:**
- [ ] `snapshots.length < 2` → skips scheduling
- [ ] `lastWeek.hours === 0` → skips scheduling
- [ ] Notification scheduling throws → error swallowed

**Mocks**: mock `loadWeeklyHistory`, mock `Notifications`, mock `AsyncStorage`

### FR4: AppState trigger

**Happy path:**
- [ ] `scheduleAll` called when AppState transitions to `'active'`
- [ ] `scheduleAll` NOT called for `'background'` or `'inactive'` transitions
- [ ] Initial `scheduleAll` called on mount

**Mocks**: mock `AppState.addEventListener`, spy on `scheduleAll`

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/hooks/useScheduledNotifications.ts` | New — full hook |
| `app/_layout.tsx` | Wire `useScheduledNotifications(config)` |
| `src/hooks/__tests__/useScheduledNotifications.test.ts` | New — FR1–FR4 tests |

## Files to Reference

- `src/lib/hours.ts` — `computeDeadlineCountdown`, `DeadlineCountdown` type
- `src/lib/weeklyHistory.ts` — `loadWeeklyHistory`, `WeeklySnapshot` type
- `src/store/config.ts` — AsyncStorage key constants
- `app/_layout.tsx` — integration point (read before editing)
- `src/hooks/useRoleRefresh.ts` — pattern for a hook with AppState listener
- `src/__tests__/notifications/handler.test.ts` — mock patterns for `expo-notifications`
