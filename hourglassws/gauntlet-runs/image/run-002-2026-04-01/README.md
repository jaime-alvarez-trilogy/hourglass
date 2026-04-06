# Gauntlet Run #002 — 2026-04-01

**Screen:** iOS home screen widget (Small/Medium/Large) — premium dark glass aesthetic matching the app
**Output:** `src/widgets/ios/HourglassWidget.tsx`
**Models:** Gemini 3.1 Pro, Gemini 2.5 Pro, GPT-4.1-mini, GPT-4.1, Claude Opus 4.6, Kimi K2.5, Qwen2.5 VL

## Score Summary (blind critique, 7 critics)

| Rank | Model (Real) | Gauntlet Label | Approx Total |
|------|-------------|----------------|--------------|
| 🥇 | GPT-4.1 | A (shuffled) | ~124.5 |
| 🥈 | Claude Opus 4.6 | F (shuffled) | ~117.5 |
| 🥉 | Gemini 2.5 Pro | E (shuffled) | ~99 |
| 4 | Kimi K2.5 | B (shuffled) | ~97 |
| 5 | Gemini 3.1 Pro | C (shuffled) | ~91 |
| 6 | GPT-4.1-mini | G (shuffled) | ~84 |
| 7 | Qwen2.5 VL | D (shuffled) | ~59 |

**Synthesiser:** Gemini 2.5 Pro

## Files

| File | Description |
|------|-------------|
| `round1-A-gemini-3.1-pro.tsx` | Gemini 3.1 Pro proposal |
| `round1-B-gemini-2.5-pro.tsx` | Gemini 2.5 Pro proposal |
| `round1-C-gpt-4.1-mini.tsx` | GPT-4.1-mini proposal |
| `round1-D-gpt-4.1.tsx` | GPT-4.1 proposal |
| `round1-E-claude-opus-4.6.tsx` | Claude Opus 4.6 proposal |
| `round1-F-kimi-k2.5.tsx` | Kimi K2.5 proposal |
| `round1-G-qwen2.5-vl.tsx` | Qwen2.5 VL proposal |
| `round2-critique-*.md` | 7 blind cross-critiques |
| `round3-synthesis.tsx` | Raw Gemini 2.5 Pro synthesis output |
| `round3-final-widget.tsx` | Final widget after manual prop fixes |
| `round5-brand-evolution.md` | Brand evolution analysis |
| `brand-guidelines-snapshot.md` | Brand guidelines at time of this run |

## Key Insights from This Run

- **Critics unanimously agreed**: ambient glow circles should be positioned via VStack/HStack layout (not absolute offset) — the existing `Circle`+`blur` pattern is correct
- **Winning pattern**: semantic border colors per glass card (gold border on earnings, cyan on AI, violet on BrainLift) significantly elevates scan-ability
- **Synthesiser chose**: Multi-card Large layout (from Kimi K2.5) + TypeScript rigor (from Gemini 2.5 Pro) + glass card component with parameterized border color (from Claude Opus)
- **Top brand suggestion**: Replace opaque `#2F2E41` borders with `#FFFFFF1A` (10% white) — "instantly makes the entire UI feel 50% more premium" — already applied in final widget
