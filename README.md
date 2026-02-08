# HourGlass — Crossover Widget for iOS

A Scriptable widget that brings your Crossover hours tracking and time approval management to your iOS Home Screen, Lock Screen, and StandBy.

## One-Tap Install

**Requires [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) on your iPhone/iPad.**

[**Install HourGlass**](https://jaime-alvarez-trilogy.github.io/worksmart/) — opens the download page on your phone.

Or manually: copy the contents of `hourglass.js` into a new script in Scriptable.

## Setup

1. Install via the link above — the script appears in Scriptable automatically
2. Run the script — the setup wizard will walk you through:
   - Environment selection (Production / QA)
   - Crossover credentials (stored locally in iOS Keychain — never leaves your device)
   - Automatic team and role detection
3. Add the widget to your Home Screen:
   - Long-press Home Screen → "+" → Scriptable
   - Choose widget size (small, medium, or large)
   - Long-press the widget → Edit Widget → choose "HourGlass" as the script

## What It Does

**For Contributors:**
- Weekly hours worked, daily average, today's hours
- Earnings tracking (weekly total, hourly rate)
- Deadline countdown to weekly hour goal
- Lock Screen / StandBy support

**For Managers (auto-detected):**
- Everything above, plus:
- Pending manual time approvals with one-tap approve/reject
- Pending overtime requests
- Push notifications when new approvals arrive
- Deadline reminders for approaching approval deadlines
- Bulk approve/reject actions

The widget auto-detects your role from the Crossover API and adapts accordingly. Role is refreshed every Monday.

## Auto-Updates

The script checks for updates each time you open it in Scriptable. When a new version is available, you'll be prompted to update with one tap. Widget mode runs without update interruptions.

## Privacy & Security

- Credentials are stored in your **iOS Keychain** — encrypted, on-device only
- No data is sent anywhere except the official Crossover API (`api.crossover.com`)
- The script is open source — inspect every line
- No analytics, no tracking, no third-party services

## Lightweight Alternative

`crossover-widget.js` is a standalone hours-only widget (~900 lines) if you don't need approval management.
