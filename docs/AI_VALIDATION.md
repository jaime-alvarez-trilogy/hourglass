# AI% Formula Validation Log

Tracks our calculated AI% against Crossover's official weekly reports to verify accuracy.

## Confirmed Formula

**`(slots with ai_usage OR second_brain) / (total slots - untagged slots)`**

- Week boundary: **Mon-Sun** (matches Crossover timesheet cycle)
- Widget implements this in `countDiaryTags()` + `aggregateAICache()`
- BrainLift: `second_brain slots × 10min / 60`

## Validation Data (4 weeks, Mon-Sun boundaries)

| Week (Mon-Sun) | Slots | Untagged | ai\|sb | Tagged | Calc AI% | Report AI% | Delta | Calc BL | Report BL | Delta |
|----------------|-------|----------|--------|--------|----------|------------|-------|---------|-----------|-------|
| **Jan 12-18** | 235 | 43 (18%) | 153 | 192 | 79.7% | **81%** | **-1.3%** | 4.3h | 4.7h | -0.4h |
| **Jan 19-25** | 236 | 54 (23%) | 129 | 182 | 70.9% | **70%** | **+0.9%** | 1.0h | 0.8h | +0.2h |
| **Jan 26-Feb 1** | 257 | 32 (12%) | 190 | 225 | 84.4% | **84%** | **+0.4%** | 5.7h | — | — |
| **Feb 2-8** | 260 | 23 (9%) | 165 | 237 | 69.6% | **70%** | **-0.4%** | 4.7h | 4.7h | 0.0h |

### Accuracy Summary

- **AI% max error: 1.3%** (average: 0.75%)
- **BrainLift max error: 0.4h** (average: 0.2h)
- Report appears to round AI% to nearest integer
- The ±2% display range in the widget fully covers the real error margin

## Formulas Rejected

| Formula | Why rejected |
|---------|-------------|
| `ai_usage / tagged` (A) | Underestimates by 2-3% when second_brain slots lack ai_usage tag |
| `(ai_usage + second_brain) / total` (B) | Breaks when untagged ratio is high (Jan 19-25: -15.5% off) |
| `(ai_usage + second_brain) / tagged` (C) | Double-counts slots with both tags, overshoots by 3-13% |

## Week Boundaries Rejected

| Boundary | Why rejected |
|----------|-------------|
| Mon-Fri | Misses weekend work slots; Jan 12-18 was off by -5.5% |
| Sun-Sat | Jan 18-24 BrainLift off by 2.4h; inconsistent across weeks |

## How to Add a New Week

1. When you get the weekly report email, note the AI% and BrainLift hours
2. Run: `node tools/test-ai-validate-monsun.js` (update the weeks array if needed)
3. Add a row to the validation table above
4. Check that delta stays within ±2% for AI% and ±0.5h for BL

## Tag Reference

Common tag combinations on slots:
- `ai_usage + not_second_brain` — Using AI, not BrainLift (~53%)
- `not_second_brain` (alone) — Not using AI, not BrainLift (~28%)
- `ai_usage + second_brain` — AI during BrainLift (~8%)
- `second_brain` (alone) — BrainLift without AI tag (~3%)
- No tags — Untagged (~9-23% depending on week)
