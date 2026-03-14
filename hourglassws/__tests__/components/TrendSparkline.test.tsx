// Tests: src/components/TrendSparkline.tsx (FR3 — animated Skia line chart)
//
// Strategy: static source-file analysis for design constraints,
// runtime render assertions for crash-free behavior and edge cases.
// @shopify/react-native-skia is mocked via __mocks__/@shopify/react-native-skia.ts

import React from 'react';
import { create, act } from 'react-test-renderer';
import * as fs from 'fs';
import * as path from 'path';

const SPARKLINE_FILE = path.resolve(__dirname, '../../src/components/TrendSparkline.tsx');

// ---------------------------------------------------------------------------
// FR3 SC: Source-level assertions
// ---------------------------------------------------------------------------

describe('TrendSparkline — FR3: source constraints', () => {
  it('FR3: src/components/TrendSparkline.tsx exists', () => {
    expect(fs.existsSync(SPARKLINE_FILE)).toBe(true);
  });

  it('FR3: source imports from @/src/lib/colors', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).toMatch(/from ['"]@\/src\/lib\/colors['"]/);
  });

  it('FR3: source imports timingChartFill', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).toContain('timingChartFill');
  });

  it('FR3: source uses withTiming (not withSpring)', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).toContain('withTiming');
    expect(source).not.toContain('withSpring');
  });

  it('FR3: source uses @shopify/react-native-skia Canvas', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).toContain('@shopify/react-native-skia');
    expect(source).toContain('Canvas');
  });

  it('FR3: source uses Path for line rendering', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).toContain('Path');
  });

  it('FR3: source uses Circle for single-point case', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).toContain('Circle');
  });

  it('FR3: source does NOT contain hardcoded hex colors', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{6}\b/);
  });

  it('FR3: source does NOT use StyleSheet.create()', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).not.toContain('StyleSheet.create(');
  });

  it('FR3: default color is colors.gold (source references gold)', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).toContain('gold');
  });

  it('FR3: default strokeWidth is 2', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    expect(source).toMatch(/strokeWidth.*=.*2|=\s*2[,\s)]/);
  });

  it('FR3: Y-axis uses padding/margin (source has padding constant or fraction)', () => {
    const source = fs.readFileSync(SPARKLINE_FILE, 'utf8');
    // Must have some form of top/bottom padding for the Y axis
    expect(source).toMatch(/padding|margin|0\.\d+\s*\*\s*height|height\s*\*\s*0\.\d+/i);
  });
});

// ---------------------------------------------------------------------------
// FR3 SC: Runtime render assertions
// ---------------------------------------------------------------------------

describe('TrendSparkline — FR3: runtime render', () => {
  let TrendSparkline: any;

  beforeAll(() => {
    TrendSparkline = require('../../src/components/TrendSparkline').default;
  });

  it('FR3: module exports a default function', () => {
    expect(TrendSparkline).toBeDefined();
    expect(typeof TrendSparkline).toBe('function');
  });

  it('FR3: renders without crashing with 8 data points', () => {
    expect(() => {
      act(() => {
        create(React.createElement(TrendSparkline, {
          data: [800, 750, 820, 900, 780, 850, 760, 880],
          width: 200,
          height: 60,
        }));
      });
    }).not.toThrow();
  });

  it('FR3: renders without crashing with empty data=[]', () => {
    expect(() => {
      act(() => {
        create(React.createElement(TrendSparkline, {
          data: [],
          width: 200,
          height: 60,
        }));
      });
    }).not.toThrow();
  });

  it('FR3: renders without crashing with single data point', () => {
    expect(() => {
      act(() => {
        create(React.createElement(TrendSparkline, {
          data: [750],
          width: 200,
          height: 60,
        }));
      });
    }).not.toThrow();
  });

  it('FR3: renders without crashing with 2 data points (straight line)', () => {
    expect(() => {
      act(() => {
        create(React.createElement(TrendSparkline, {
          data: [700, 800],
          width: 200,
          height: 60,
        }));
      });
    }).not.toThrow();
  });

  it('FR3: renders without crashing with all-zero data', () => {
    expect(() => {
      act(() => {
        create(React.createElement(TrendSparkline, {
          data: [0, 0, 0, 0],
          width: 200,
          height: 60,
        }));
      });
    }).not.toThrow();
  });

  it('FR3: renders without crashing with explicit color and strokeWidth', () => {
    expect(() => {
      act(() => {
        create(React.createElement(TrendSparkline, {
          data: [800, 750, 820],
          width: 200,
          height: 60,
          color: '#00D4FF',
          strokeWidth: 3,
        }));
      });
    }).not.toThrow();
  });
});
