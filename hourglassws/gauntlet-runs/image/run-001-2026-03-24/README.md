# Gauntlet Run #001 — 2026-03-24

**Screen:** Manager approval card (dark glass swipeable, manual/overtime)
**Output:** src/components/ApprovalCard.tsx
**Models:** Gemini 3.1 Pro, Gemini 2.5 Pro, GPT-4o, GPT-4.1, Claude Opus 4.6, Kimi K2.5, Mistral Large

## Score Summary

| Option | Model | Avg CODE | Avg UX | Total |
|--------|-------|----------|--------|-------|
| 🥇 A | Gemini 3.1 Pro | 8.3 | 8.4 | **16.7** |
| 🥈 E | Claude Opus 4.6 | 7.7 | 7.6 | 15.3 |
| 🥉 D | GPT-4.1 | 7.7 | 7.3 | 15.0 |
| B | Gemini 2.5 Pro | 5.9 | 6.4 | 12.3 |
| F | Kimi K2.5 | 6.1 | 6.0 | 12.1 |
| C | GPT-4o | 4.4 | 4.0 | 8.4 |
| G | Mistral Large | 4.0 | 3.7 | 7.7 |

🏅 Winner: Option A (Gemini 3.1 Pro)

## Files

| File | Description |
|------|-------------|
| `round1-A-gemini-3.1-pro.tsx` | Generation from Gemini 3.1 Pro |
| `round1-B-gemini-2.5-pro.tsx` | Generation from Gemini 2.5 Pro |
| `round1-C-gpt-4o.tsx` | Generation from GPT-4o |
| `round1-D-gpt-4.1.tsx` | Generation from GPT-4.1 |
| `round1-E-claude-opus-4.6.tsx` | Generation from Claude Opus 4.6 |
| `round1-F-kimi-k2.5.tsx` | Generation from Kimi K2.5 |
| `round1-G-mistral-large.tsx` | Generation from Mistral Large |
| `round2-critique-*.md` | 7 blind cross-critiques |
| `round3-synthesis.tsx` | Synthesised component (Gemini 2.5 Pro) |
| `round4-validation.md` | Design system compliance report |
| `brand-guidelines-snapshot.md` | Brand guidelines active at time of run |

## Key Insights

- **Consensus on the core bug fix:** Width-animated swipe backgrounds (not opacity-animated) are the only correct solution to prevent color bleed through the dark glass surface
- **A's standout:** Width-matched swipe reveal was the feature every critic praised; E added velocity dismiss + card rotation + reduced motion for the most accessible and polished UX
- **C and G failed:** Both had fundamental swipe-bleed issues and minimal glass aesthetics; G additionally had a nonexistent `useHapticFeedback` import that would crash at runtime
- **Final component synthesises:** A's swipe reveal technique + E's velocity/rotation/reducedMotion + D's SwipeIndicator abstraction pattern, with all TypeScript/import errors fixed
