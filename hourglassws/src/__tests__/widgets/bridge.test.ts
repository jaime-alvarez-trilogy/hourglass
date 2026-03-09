/**
 * FR1, FR2, FR3: Widget Data Bridge tests
 * Tests for src/widgets/bridge.ts: updateWidgetData, buildTimelineEntries, readWidgetData
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-widgets — iOS-only native module (virtual so it doesn't need to exist on disk)
jest.mock('expo-widgets', () => ({}), { virtual: true });

// Mock Platform so bridge runs Android path (no iOS-only modules needed)
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

// Import the module under test — static import so CJS/Jest works correctly
import {
  updateWidgetData,
  buildTimelineEntries,
  readWidgetData,
} from '../../widgets/bridge';

import type { HoursData } from '../../lib/hours';
import type { AIWeekData } from '../../lib/ai';
import type { CrossoverConfig } from '../../types/config';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DEADLINE = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).getTime(); // 5 days from now

function makeHoursData(overrides: Partial<HoursData> = {}): HoursData {
  return {
    total: 32.5,
    average: 6.5,
    today: 6.2,
    daily: [
      { date: '2026-03-09', hours: 6.1, isToday: false },
      { date: '2026-03-10', hours: 6.2, isToday: true },
    ],
    weeklyEarnings: 1300,
    todayEarnings: 248,
    hoursRemaining: 7.5,
    overtimeHours: 0,
    timeRemaining: DEADLINE - Date.now(),
    deadline: new Date(DEADLINE),
    ...overrides,
  };
}

function makeAIData(overrides: Partial<AIWeekData> = {}): AIWeekData {
  return {
    aiPctLow: 71,
    aiPctHigh: 75,
    brainliftHours: 3.2,
    totalSlots: 200,
    taggedSlots: 180,
    workdaysElapsed: 2,
    dailyBreakdown: [],
    ...overrides,
  };
}

function makeConfig(overrides: Partial<CrossoverConfig> = {}): CrossoverConfig {
  return {
    userId: '2362707',
    fullName: 'Test User',
    managerId: '2372227',
    primaryTeamId: '4584',
    teams: [],
    hourlyRate: 40,
    weeklyLimit: 40,
    useQA: false,
    isManager: false,
    assignmentId: '79996',
    lastRoleCheck: '2026-03-10T00:00:00.000Z',
    debugMode: false,
    setupComplete: true,
    setupDate: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

// Helper: get the widget_data value written to AsyncStorage
function getWrittenWidgetData(): Record<string, unknown> | null {
  const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
  const call = calls.find(([key]: [string]) => key === 'widget_data');
  if (!call) return null;
  return JSON.parse(call[1]);
}

// ─── FR1: updateWidgetData ─────────────────────────────────────────────────────

describe('updateWidgetData (FR1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls AsyncStorage.setItem with widget_data key', async () => {
    await updateWidgetData(makeHoursData(), makeAIData(), 0, makeConfig());
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('widget_data', expect.any(String));
  });

  it('formats hours as string with 1 decimal', async () => {
    await updateWidgetData(makeHoursData({ total: 8 }), makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.hours).toBe('8.0');
    expect(data.hoursDisplay).toBe('8.0h');
  });

  it('formats earnings $1300 as $1,300', async () => {
    await updateWidgetData(makeHoursData({ weeklyEarnings: 1300 }), makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.earnings).toBe('$1,300');
  });

  it('formats earnings under $1000 without comma', async () => {
    await updateWidgetData(makeHoursData({ weeklyEarnings: 800 }), makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.earnings).toBe('$800');
  });

  it('sets pendingCount to 0 for contributors (isManager false)', async () => {
    const config = makeConfig({ isManager: false });
    await updateWidgetData(makeHoursData(), makeAIData(), 5, config);
    const data = getWrittenWidgetData()!;
    expect(data.pendingCount).toBe(0);
  });

  it('passes pendingCount through for managers', async () => {
    const config = makeConfig({ isManager: true });
    await updateWidgetData(makeHoursData(), makeAIData(), 3, config);
    const data = getWrittenWidgetData()!;
    expect(data.pendingCount).toBe(3);
    expect(data.isManager).toBe(true);
  });

  it('sets cachedAt to current timestamp', async () => {
    const before = Date.now();
    await updateWidgetData(makeHoursData(), makeAIData(), 0, makeConfig());
    const after = Date.now();
    const data = getWrittenWidgetData()!;
    expect(Number(data.cachedAt)).toBeGreaterThanOrEqual(before);
    expect(Number(data.cachedAt)).toBeLessThanOrEqual(after);
  });

  it('sets urgency to none when >12h from deadline', async () => {
    const hoursData = makeHoursData({
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await updateWidgetData(hoursData, makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.urgency).toBe('none');
  });

  it('sets urgency to expired when deadline is in the past', async () => {
    const hoursData = makeHoursData({
      deadline: new Date(Date.now() - 1000),
    });
    await updateWidgetData(hoursData, makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.urgency).toBe('expired');
  });

  it('sets aiPct to N/A when aiData is null', async () => {
    await updateWidgetData(makeHoursData(), null, 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.aiPct).toBe('N/A');
  });

  it('sets brainlift to 0.0h when aiData is null', async () => {
    await updateWidgetData(makeHoursData(), null, 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.brainlift).toBe('0.0h');
  });

  it('formats aiPct as range string when aiData provided', async () => {
    const aiData = makeAIData({ aiPctLow: 71, aiPctHigh: 75 });
    await updateWidgetData(makeHoursData(), aiData, 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.aiPct).toMatch(/71%/);
    expect(data.aiPct).toMatch(/75%/);
  });

  it('formats brainlift hours with 1 decimal', async () => {
    const aiData = makeAIData({ brainliftHours: 3.2 });
    await updateWidgetData(makeHoursData(), aiData, 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.brainlift).toBe('3.2h');
  });

  it('shows hoursRemaining as "Xh left" when not in overtime', async () => {
    const hoursData = makeHoursData({ hoursRemaining: 7.5, overtimeHours: 0 });
    await updateWidgetData(hoursData, makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.hoursRemaining).toMatch(/7\.5h left/);
  });

  it('shows hoursRemaining as "Xh OT" when in overtime', async () => {
    const hoursData = makeHoursData({ hoursRemaining: 0, overtimeHours: 2.5 });
    await updateWidgetData(hoursData, makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(data.hoursRemaining).toMatch(/2\.5h OT/);
  });

  it('stores earningsRaw as number', async () => {
    await updateWidgetData(makeHoursData({ weeklyEarnings: 1300 }), makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(typeof data.earningsRaw).toBe('number');
    expect(data.earningsRaw).toBe(1300);
  });

  it('stores deadline as unix timestamp number', async () => {
    const deadline = new Date(DEADLINE);
    await updateWidgetData(makeHoursData({ deadline }), makeAIData(), 0, makeConfig());
    const data = getWrittenWidgetData()!;
    expect(typeof data.deadline).toBe('number');
    expect(data.deadline).toBe(deadline.getTime());
  });
});

// ─── FR2: buildTimelineEntries ─────────────────────────────────────────────────

describe('buildTimelineEntries (FR2)', () => {
  function makeBaseData() {
    return {
      hours: '32.5',
      hoursDisplay: '32.5h',
      earnings: '$1,300',
      earningsRaw: 1300,
      today: '6.2h',
      hoursRemaining: '7.5h left',
      aiPct: '71%\u201375%',
      brainlift: '3.2h',
      deadline: Date.now() + 6 * 60 * 60 * 1000, // 6h from now
      urgency: 'high' as const,
      pendingCount: 0,
      isManager: false,
      cachedAt: Date.now(),
      useQA: false,
    };
  }

  it('returns exactly 60 entries by default', () => {
    const entries = buildTimelineEntries(makeBaseData());
    expect(entries).toHaveLength(60);
  });

  it('returns exactly count entries when count specified', () => {
    expect(buildTimelineEntries(makeBaseData(), 10)).toHaveLength(10);
    expect(buildTimelineEntries(makeBaseData(), 1)).toHaveLength(1);
  });

  it('first entry date is >= now', () => {
    const before = Date.now();
    const entries = buildTimelineEntries(makeBaseData(), 5);
    expect(entries[0].date.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('each subsequent entry is 15 minutes after previous by default', () => {
    const entries = buildTimelineEntries(makeBaseData(), 5);
    const interval = 15 * 60 * 1000;
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].date.getTime() - entries[i - 1].date.getTime()).toBe(interval);
    }
  });

  it('each subsequent entry respects custom intervalMinutes', () => {
    const entries = buildTimelineEntries(makeBaseData(), 4, 30);
    const interval = 30 * 60 * 1000;
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].date.getTime() - entries[i - 1].date.getTime()).toBe(interval);
    }
  });

  it('non-time-dependent fields are identical across all entries', () => {
    const entries = buildTimelineEntries(makeBaseData(), 5);
    const first = entries[0].props;
    for (const entry of entries) {
      expect(entry.props.hours).toBe(first.hours);
      expect(entry.props.earnings).toBe(first.earnings);
      expect(entry.props.aiPct).toBe(first.aiPct);
      expect(entry.props.brainlift).toBe(first.brainlift);
      expect(entry.props.earningsRaw).toBe(first.earningsRaw);
      expect(entry.props.isManager).toBe(first.isManager);
    }
  });

  it('urgency field updates as entries advance past deadline', () => {
    // Deadline 1 minute from now — entries at 15min intervals
    const base = { ...makeBaseData(), deadline: Date.now() + 60 * 1000 };
    const entries = buildTimelineEntries(base, 5, 15);
    // Entry 1+ are all 15min past the 1min deadline → 'expired'
    expect(entries[1].props.urgency).toBe('expired');
    expect(entries[4].props.urgency).toBe('expired');
  });

  it('early entries before deadline have non-expired urgency', () => {
    // Deadline 24h from now → entry 0 is well within range
    const base = { ...makeBaseData(), deadline: Date.now() + 24 * 60 * 60 * 1000 };
    const entries = buildTimelineEntries(base, 3, 15);
    expect(entries[0].props.urgency).not.toBe('expired');
  });

  it('each entry has a date property as a Date object', () => {
    const entries = buildTimelineEntries(makeBaseData(), 3);
    for (const entry of entries) {
      expect(entry.date).toBeInstanceOf(Date);
    }
  });
});

// ─── FR3: readWidgetData ──────────────────────────────────────────────────────

describe('readWidgetData (FR3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when key is absent', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await expect(readWidgetData()).resolves.toBeNull();
  });

  it('reads from AsyncStorage key widget_data', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await readWidgetData();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('widget_data');
  });

  it('returns parsed WidgetData when JSON is valid', async () => {
    const data = {
      hours: '32.5',
      hoursDisplay: '32.5h',
      earnings: '$1,300',
      earningsRaw: 1300,
      today: '6.2h',
      hoursRemaining: '7.5h left',
      aiPct: '71%\u201375%',
      brainlift: '3.2h',
      deadline: DEADLINE,
      urgency: 'none',
      pendingCount: 0,
      isManager: false,
      cachedAt: Date.now(),
      useQA: false,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(data));
    const result = await readWidgetData();
    expect(result).not.toBeNull();
    expect(result!.hours).toBe('32.5');
    expect(result!.earnings).toBe('$1,300');
    expect(result!.pendingCount).toBe(0);
  });

  it('returns null for malformed JSON without throwing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{ bad json }}}');
    await expect(readWidgetData()).resolves.toBeNull();
  });

  it('returns null when AsyncStorage.getItem rejects without throwing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));
    await expect(readWidgetData()).resolves.toBeNull();
  });
});
