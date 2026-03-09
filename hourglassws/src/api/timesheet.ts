// FR2: fetchTimesheet — Crossover timesheet API with 3-strategy fallback
//
// Strategy 1: full params (date, managerId, period, teamId, userId)
// Strategy 2: no teamId (date, managerId, period, userId)
// Strategy 3: minimal (date, period, userId)
//
// Returns the first non-empty array response.

import { apiGet } from './client';
import { getWeekStartDate } from '../lib/hours';
import type { TimesheetResponse } from '../lib/hours';
import type { CrossoverConfig } from '../types/config';

export async function fetchTimesheet(
  config: CrossoverConfig,
  token: string
): Promise<TimesheetResponse | null> {
  // Use UTC-safe Monday date for the payments-API-compatible week boundary
  const date = getWeekStartDate(true);

  const baseParams = {
    date,
    period: 'WEEK',
    userId: config.userId,
  };

  // Strategy 1: full params
  const strategy1 = await apiGet<TimesheetResponse[]>(
    '/api/timetracking/timesheets',
    {
      ...baseParams,
      managerId: config.managerId,
      teamId: config.primaryTeamId,
    },
    token,
    config.useQA
  );

  if (Array.isArray(strategy1) && strategy1.length > 0) {
    return strategy1[0];
  }

  // Strategy 2: without teamId
  const strategy2 = await apiGet<TimesheetResponse[]>(
    '/api/timetracking/timesheets',
    {
      ...baseParams,
      managerId: config.managerId,
    },
    token,
    config.useQA
  );

  if (Array.isArray(strategy2) && strategy2.length > 0) {
    return strategy2[0];
  }

  // Strategy 3: minimal — date + period + userId only
  const strategy3 = await apiGet<TimesheetResponse[]>(
    '/api/timetracking/timesheets',
    baseParams,
    token,
    config.useQA
  );

  if (Array.isArray(strategy3) && strategy3.length > 0) {
    return strategy3[0];
  }

  return null;
}
