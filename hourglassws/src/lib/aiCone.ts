// 01-cone-math: AI Possibility Cone math
// Pure functions — no React, no AsyncStorage, no API calls.

import type { DailyTagData } from './ai';

// ─── FR1: Types ───────────────────────────────────────────────────────────────

export interface ConePoint {
  hoursX: number; // X-axis position in hours (0 → weeklyLimit)
  pctY: number;   // Y-axis AI percentage (0 → 100)
}

export interface ConeData {
  // Historical trajectory (solid line, left of current position)
  actualPoints: ConePoint[];   // starts at (0,0), one point per day elapsed

  // Forward-looking cone (filled area, right of current position)
  upperBound: ConePoint[];     // best-case: all remaining slots tagged as AI
  lowerBound: ConePoint[];     // worst-case: all remaining slots tagged but not AI

  // Derived scalars for chart rendering
  currentHours: number;        // hours logged so far this week
  currentAIPct: number;        // AI% at this moment
  weeklyLimit: number;         // max hours from config
  targetPct: number;           // always 75
  isTargetAchievable: boolean; // whether upper bound final pctY >= 75
}

// ─── FR2: computeActualPoints ─────────────────────────────────────────────────

/**
 * Builds the historical AI% trajectory from per-day cumulative data.
 *
 * Always starts at (0, 0) to anchor the line to week start.
 * Each subsequent point represents cumulative AI% after that day's slots
 * are added. Math is done in slots; X-axis converted to hours at output.
 */
export function computeActualPoints(dailyBreakdown: DailyTagData[]): ConePoint[] {
  const points: ConePoint[] = [{ hoursX: 0, pctY: 0 }];

  let cumulativeTotal = 0;
  let cumulativeAi = 0;
  let cumulativeNoTags = 0;

  for (const entry of dailyBreakdown) {
    // Skip null/undefined entries
    if (!entry) continue;

    cumulativeTotal += entry.total;
    cumulativeAi += entry.aiUsage;
    cumulativeNoTags += entry.noTags;

    const taggedSlots = cumulativeTotal - cumulativeNoTags;
    const aiPct = taggedSlots > 0 ? (cumulativeAi / taggedSlots) * 100 : 0;
    const hoursX = cumulativeTotal * 10 / 60;

    points.push({ hoursX, pctY: aiPct });
  }

  return points;
}

// ─── FR3: computeCone ────────────────────────────────────────────────────────

/**
 * Builds the forward-looking possibility cone from the current position.
 *
 * Returns two 2-point arrays:
 *  upper: current position → best case at weeklyLimit (all remaining = AI)
 *  lower: current position → worst case at weeklyLimit (no more AI tagged)
 *
 * Returns empty arrays if weeklyLimit <= 0 or week is already complete.
 */
export function computeCone(
  currentHours: number,
  currentAIPct: number,
  aiSlots: number,
  taggedSlots: number,
  weeklyLimit: number,
): { upper: ConePoint[]; lower: ConePoint[] } {
  // Guard: no meaningful limit or week already complete
  if (weeklyLimit <= 0 || currentHours >= weeklyLimit) {
    return { upper: [], lower: [] };
  }

  const slotsRemaining = (weeklyLimit - currentHours) * 6; // 6 slots per hour
  const denominator = taggedSlots + slotsRemaining;

  let upperFinal: number;
  let lowerFinal: number;

  if (denominator === 0) {
    // No slots at all — full cone open
    upperFinal = 100;
    lowerFinal = 0;
  } else {
    upperFinal = Math.min(100, Math.max(0, ((aiSlots + slotsRemaining) / denominator) * 100));
    lowerFinal = Math.min(100, Math.max(0, (aiSlots / denominator) * 100));
  }

  const upperEnd: ConePoint = { hoursX: weeklyLimit, pctY: upperFinal };
  const lowerEnd: ConePoint = { hoursX: weeklyLimit, pctY: lowerFinal };

  return {
    upper: [{ hoursX: currentHours, pctY: currentAIPct }, upperEnd],
    lower: [{ hoursX: currentHours, pctY: currentAIPct }, lowerEnd],
  };
}

// ─── FR4: computeAICone ───────────────────────────────────────────────────────

/**
 * Orchestrates computeActualPoints and computeCone into a full ConeData object.
 *
 * The primary entry point for chart components. Accepts the daily breakdown
 * from useAIData() and the weekly hours limit from config.
 */
export function computeAICone(
  dailyBreakdown: DailyTagData[],
  weeklyLimit: number,
): ConeData {
  // Aggregate cumulative totals
  let totalSlots = 0;
  let aiSlots = 0;
  let noTagSlots = 0;

  for (const entry of dailyBreakdown) {
    if (!entry) continue;
    totalSlots += entry.total;
    aiSlots += entry.aiUsage;
    noTagSlots += entry.noTags;
  }

  const taggedSlots = totalSlots - noTagSlots;
  const currentHours = totalSlots * 10 / 60;
  const currentAIPct = taggedSlots > 0 ? (aiSlots / taggedSlots) * 100 : 0;

  // Build actual trajectory and cone
  const actualPoints = computeActualPoints(dailyBreakdown);
  const { upper, lower } = computeCone(currentHours, currentAIPct, aiSlots, taggedSlots, weeklyLimit);

  // Determine if 75% target is achievable
  let isTargetAchievable: boolean;
  if (upper.length > 0) {
    isTargetAchievable = upper[upper.length - 1].pctY >= 75;
  } else {
    // Cone is empty (week complete, overtime, or no limit)
    isTargetAchievable = currentAIPct >= 75;
  }

  return {
    actualPoints,
    upperBound: upper,
    lowerBound: lower,
    currentHours,
    currentAIPct,
    weeklyLimit,
    targetPct: 75,
    isTargetAchievable,
  };
}
