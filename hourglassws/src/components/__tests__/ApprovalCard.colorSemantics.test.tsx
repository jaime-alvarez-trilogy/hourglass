// Tests: ApprovalCard colour semantics (01-color-semantics)
// FR1: Manual badge uses violet, not gold
// FR2: Approve button uses violet, not success
//
// Strategy: source-level assertions via fs.readFileSync
// This avoids NativeWind rendering complexity in Jest.

import * as fs from 'fs';
import * as path from 'path';

const HOURGLASSWS_ROOT = path.resolve(__dirname, '../../..');
const APPROVAL_CARD_FILE = path.join(HOURGLASSWS_ROOT, 'src', 'components', 'ApprovalCard.tsx');

let source: string;

beforeAll(() => {
  source = fs.readFileSync(APPROVAL_CARD_FILE, 'utf-8');
});

// ─── FR1: Manual badge colour ─────────────────────────────────────────────────

describe('ApprovalCard — FR1 (01-color-semantics): Manual badge colour', () => {
  it('Manual badge container does NOT use bg-gold/20', () => {
    expect(source).not.toContain('bg-gold/20');
  });

  it('Manual badge text does NOT use text-gold', () => {
    expect(source).not.toContain('text-gold');
  });

  it('Manual badge container uses bg-violet/20', () => {
    expect(source).toContain('bg-violet/20');
  });

  it('Manual badge text uses text-violet', () => {
    expect(source).toContain('text-violet');
  });
});

// ─── FR2: Approve button colour ───────────────────────────────────────────────

describe('ApprovalCard — FR2 (01-color-semantics): Approve button colour', () => {
  it('Approve button container does NOT use bg-success/20', () => {
    // bg-success/20 must not appear anywhere in the file
    expect(source).not.toContain('bg-success/20');
  });

  it('Approve button text does NOT use text-success on the approve action', () => {
    // The approve button text class should not be text-success
    // (bg-success/20 removal above covers the container; this checks the text class)
    expect(source).not.toMatch(/Approve[\s\S]{0,200}text-success/);
  });

  it('Approve button container uses bg-violet/20 (shared with Manual badge)', () => {
    // bg-violet/20 must appear (used by both Manual badge and Approve button)
    expect(source).toContain('bg-violet/20');
  });

  it('Reject button still uses bg-destructive/20 (unchanged)', () => {
    expect(source).toContain('bg-destructive/20');
  });

  it('Reject button still uses text-destructive (unchanged)', () => {
    expect(source).toContain('text-destructive');
  });
});
