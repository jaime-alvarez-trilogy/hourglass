// FR5: Auth API — profile fetch, ID extraction, config assembly

import { getAuthToken, apiGet } from './client';
import { getApiBase } from '../store/config';
import type { CrossoverConfig } from '../types/config';

// --- Internal types ---

interface DetailResponse {
  fullName: string;
  avatarTypes: string[];
  assignment: {
    id: number;
    salary: number;
    weeklyLimit?: number;
    team: { id: number; name: string };
    manager: { id: number };
    selection?: {
      marketplaceMember?: {
        application?: { candidate?: { id: number } };
      };
    };
  };
  userAvatars?: Array<{ avatarType: string; id: number }>;
}

// --- Public API ---

/** Fetch the current user's identity detail. Re-used by useRoleRefresh. */
export async function getProfileDetail(
  token: string,
  useQA: boolean,
): Promise<DetailResponse> {
  return apiGet<DetailResponse>(
    '/api/identity/users/current/detail',
    {},
    token,
    useQA,
  );
}

/** Format a Date as YYYY-MM-DD in local time (NOT toISOString — avoids UTC shift). */
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Extract all CrossoverConfig fields from the detail response. */
function extractConfigFromDetail(
  detail: DetailResponse,
  useQA: boolean,
): Omit<CrossoverConfig, 'setupComplete' | 'setupDate'> {
  const candidateAvatar = detail.userAvatars?.find(
    (a) => a.avatarType === 'CANDIDATE',
  );
  const nestedCandidateId =
    detail.assignment.selection?.marketplaceMember?.application?.candidate?.id;
  const userId = String(candidateAvatar?.id ?? nestedCandidateId ?? 0);

  return {
    userId,
    fullName: detail.fullName,
    managerId: String(detail.assignment.manager.id),
    primaryTeamId: String(detail.assignment.team.id),
    assignmentId: String(detail.assignment.id),
    hourlyRate: detail.assignment.salary ?? 0,
    weeklyLimit: detail.assignment.weeklyLimit ?? 40,
    isManager: detail.avatarTypes.includes('MANAGER'),
    teams: [
      {
        id: String(detail.assignment.team.id),
        name: detail.assignment.team.name,
        company: '',
      },
    ],
    useQA,
    lastRoleCheck: new Date().toISOString(),
    debugMode: false,
  };
}

/**
 * Full onboarding pipeline: token → detail → payments → assembled config.
 * Returns a CrossoverConfig with setupComplete: false.
 * Caller sets setupComplete: true after persisting credentials.
 */
export async function fetchAndBuildConfig(
  username: string,
  password: string,
  useQA: boolean,
): Promise<CrossoverConfig> {
  // Step 1: Auth
  const token = await getAuthToken(username, password, useQA);

  // Step 2: Profile detail
  const detail = await getProfileDetail(token, useQA);
  const partial = extractConfigFromDetail(detail, useQA);

  // Step 3: Payment history for hourly rate (try/catch — failure is non-fatal)
  let hourlyRate = partial.hourlyRate;
  if (!hourlyRate) {
    try {
      const to = localDateStr(new Date());
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 3);
      const from = localDateStr(fromDate);
      const payments = await apiGet<Array<{ amount: number; paidHours: number }>>(
        '/api/v3/users/current/payments',
        { from, to },
        token,
        useQA,
      );
      if (Array.isArray(payments)) {
        for (const p of payments) {
          if (p.paidHours > 0) {
            hourlyRate = Math.round(p.amount / p.paidHours);
            break;
          }
        }
      }
      // If still 0 after iterating, hourlyRate = 0 → setup screen shown
    } catch {
      hourlyRate = 0;
    }
  }

  const now = new Date().toISOString();
  return {
    ...partial,
    hourlyRate,
    setupComplete: false,
    setupDate: now,
  };
}
