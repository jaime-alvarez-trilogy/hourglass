// useWeeklyHistory — 06-overview-history FR2
// Read-only hook: loads persisted weekly snapshots from AsyncStorage on mount.
// Does not include the current in-progress week.
// Consumer (07-overview-sync) combines this with live useAIData/useHoursData for current week.

import { useState, useEffect } from 'react';
import { loadWeeklyHistory } from '../lib/weeklyHistory';
import type { WeeklySnapshot } from '../lib/weeklyHistory';

export interface UseWeeklyHistoryResult {
  /** Persisted history (up to 12 weeks). Empty on first-ever launch. */
  snapshots: WeeklySnapshot[];
  /** True until AsyncStorage read resolves. */
  isLoading: boolean;
}

export function useWeeklyHistory(): UseWeeklyHistoryResult {
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWeeklyHistory()
      .then(data => {
        setSnapshots(data);
        setIsLoading(false);
      })
      .catch(() => {
        // Silent failure — AsyncStorage unavailable
        setSnapshots([]);
        setIsLoading(false);
      });
  }, []);

  return { snapshots, isLoading };
}
