// Tests: src/components/WeeklyBarChart.tsx (FR2 — animated Skia bar chart)
//
// Strategy: static source-file analysis for design constraints,
// runtime render assertions for crash-free behavior.
// @shopify/react-native-skia is mocked via __mocks__/@shopify/react-native-skia.ts

import React from 'react';
import { create, act } from 'react-test-renderer';
import * as fs from 'fs';
import * as path from 'path';

const WEEKLY_BAR_FILE = path.resolve(__dirname, '../../src/components/WeeklyBarChart.tsx');

const SAMPLE_DATA = [
  { day: 'Mon', hours: 8, isToday: false, isFuture: false },
  { day: 'Tue', hours: 7.5, isToday: false, isFuture: false },
  { day: 'Wed', hours: 8, isToday: true, isFuture: false },
  { day: 'Thu', hours: 0, isToday: false, isFuture: true },
  { day: 'Fri', hours: 0, isToday: false, isFuture: true },
  { day: 'Sat', hours: 0, isToday: false, isFuture: true },
  { day: 'Sun', hours: 0, isToday: false, isFuture: true },
];

// ---------------------------------------------------------------------------
// FR2 SC: Source-level assertions
// ---------------------------------------------------------------------------

describe('WeeklyBarChart — FR2: source constraints', () => {
  it('FR2: src/components/WeeklyBarChart.tsx exists', () => {
    expect(fs.existsSync(WEEKLY_BAR_FILE)).toBe(true);
  });

  it('FR2: source imports from @/src/lib/colors (no hardcoded hex)', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    expect(source).toMatch(/from ['"]@\/src\/lib\/colors['"]/);
  });

  it('FR2: source imports timingChartFill from reanimated-presets', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    expect(source).toContain('timingChartFill');
    expect(source).toMatch(/from ['"]@\/src\/lib\/reanimated-presets['"]/);
  });

  it('FR2: source uses withDelay for stagger animation', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    expect(source).toContain('withDelay');
  });

  it('FR2: source uses withTiming (not withSpring)', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    expect(source).toContain('withTiming');
    expect(source).not.toContain('withSpring');
  });

  it('FR2: source uses @shopify/react-native-skia Canvas', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    expect(source).toContain('@shopify/react-native-skia');
    expect(source).toContain('Canvas');
  });

  it('FR2: source uses Rect for bar rendering', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    expect(source).toContain('Rect');
  });

  it('FR2: source does NOT contain hardcoded hex colors', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{6}\b/);
  });

  it('FR2: source does NOT use StyleSheet.create()', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    expect(source).not.toContain('StyleSheet.create(');
  });

  it('FR2: stagger delay uses Math.min(index * 50, 300) pattern', () => {
    const source = fs.readFileSync(WEEKLY_BAR_FILE, 'utf8');
    // Should contain 50 and 300 as stagger constants
    expect(source).toMatch(/\b50\b/);
    expect(source).toMatch(/\b300\b/);
  });
});

// ---------------------------------------------------------------------------
// FR2 SC: Runtime render assertions
// ---------------------------------------------------------------------------

describe('WeeklyBarChart — FR2: runtime render', () => {
  let WeeklyBarChart: any;

  beforeAll(() => {
    WeeklyBarChart = require('../../src/components/WeeklyBarChart').default;
  });

  it('FR2: module exports a default function', () => {
    expect(WeeklyBarChart).toBeDefined();
    expect(typeof WeeklyBarChart).toBe('function');
  });

  it('FR2: renders without crashing with 7-day data', () => {
    expect(() => {
      act(() => {
        create(React.createElement(WeeklyBarChart, {
          data: SAMPLE_DATA,
          width: 300,
          height: 120,
        }));
      });
    }).not.toThrow();
  });

  it('FR2: renders without crashing with empty data=[]', () => {
    expect(() => {
      act(() => {
        create(React.createElement(WeeklyBarChart, {
          data: [],
          width: 300,
          height: 120,
        }));
      });
    }).not.toThrow();
  });

  it('FR2: renders without crashing with explicit maxHours', () => {
    expect(() => {
      act(() => {
        create(React.createElement(WeeklyBarChart, {
          data: SAMPLE_DATA,
          maxHours: 10,
          width: 300,
          height: 120,
        }));
      });
    }).not.toThrow();
  });

  it('FR2: renders without crashing when all bars are future', () => {
    const futureDays = SAMPLE_DATA.map(d => ({ ...d, isFuture: true, isToday: false, hours: 0 }));
    expect(() => {
      act(() => {
        create(React.createElement(WeeklyBarChart, {
          data: futureDays,
          width: 300,
          height: 120,
        }));
      });
    }).not.toThrow();
  });

  it('FR2: renders without crashing with width=0 (guard case)', () => {
    expect(() => {
      act(() => {
        create(React.createElement(WeeklyBarChart, {
          data: SAMPLE_DATA,
          width: 0,
          height: 120,
        }));
      });
    }).not.toThrow();
  });
});
