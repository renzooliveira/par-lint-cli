import { describe, it, expect } from 'vitest';
import { createFinding, createFindingId } from './finding.js';

describe('createFindingId', () => {
  it('produces deterministic hash', () => {
    const id1 = createFindingId('arch/god-file', 'src/app.ts', 10);
    const id2 = createFindingId('arch/god-file', 'src/app.ts', 10);
    expect(id1).toBe(id2);
  });

  it('produces different hash for different inputs', () => {
    const id1 = createFindingId('arch/god-file', 'src/app.ts', 10);
    const id2 = createFindingId('arch/god-file', 'src/app.ts', 20);
    expect(id1).not.toBe(id2);
  });

  it('returns 16-char hex string', () => {
    const id = createFindingId('rule', 'file', 1);
    expect(id).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe('createFinding', () => {
  it('creates finding with defaults', () => {
    const finding = createFinding({
      rule_id: 'arch/god-file',
      file: 'src/app.ts',
      line: 1,
      severity: 'warning',
      message: 'File too large',
      source_principle: 'Single responsibility',
      category: 'arch',
    });

    expect(finding.rule_id).toBe('arch/god-file');
    expect(finding.file).toBe('src/app.ts');
    expect(finding.line).toBe(1);
    expect(finding.severity).toBe('warning');
    expect(finding.confidence).toBe(1.0);
    expect(finding.confidence_band).toBe('confident_positive');
    expect(finding.fix_complexity).toBe('S');
    expect(finding.status).toBe('new');
    expect(finding.rule_version).toBe('1.0.0');
    expect(finding.finding_id).toMatch(/^[a-f0-9]{16}$/);
  });
});
