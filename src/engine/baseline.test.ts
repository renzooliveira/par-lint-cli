import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadBaseline, saveBaseline, filterByBaseline } from './baseline.js';
import type { Finding } from '../types/finding.js';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { readFile, writeFile } from 'node:fs/promises';

const mockedRead = vi.mocked(readFile);
const mockedWrite = vi.mocked(writeFile);

function fakeFinding(id: string, ruleId: string): Finding {
  return {
    finding_id: id,
    rule_id: ruleId,
    rule_version: '1.0',
    file: 'src/app.ts',
    line: 1,
    severity: 'warning',
    confidence: 0.9,
    confidence_band: 'confident_positive',
    fix_complexity: 'S',
    message: 'test',
    evidence_trail: [],
    source_principle: 'test',
    source_realization: '',
    category: 'test',
    status: 'new',
    first_seen: '',
    last_seen: '',
  };
}

describe('baseline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loadBaseline returns empty set when file missing', async () => {
    mockedRead.mockRejectedValue(new Error('ENOENT'));
    const ids = await loadBaseline('/fake/baseline.json');
    expect(ids.size).toBe(0);
  });

  it('loadBaseline reads finding IDs from file', async () => {
    mockedRead.mockResolvedValue(JSON.stringify({
      version: '1.0',
      finding_ids: ['f1', 'f2', 'f3'],
    }) as any);

    const ids = await loadBaseline('/fake/baseline.json');
    expect(ids.size).toBe(3);
    expect(ids.has('f1')).toBe(true);
  });

  it('saveBaseline writes finding IDs', async () => {
    const findings = [fakeFinding('f1', 'rule/a'), fakeFinding('f2', 'rule/b')];
    await saveBaseline('/fake/baseline.json', findings);

    expect(mockedWrite).toHaveBeenCalledOnce();
    const written = JSON.parse(mockedWrite.mock.calls[0]![1] as string);
    expect(written.finding_ids).toEqual(['f1', 'f2']);
  });

  it('filterByBaseline removes baselined findings', () => {
    const findings = [
      fakeFinding('f1', 'rule/a'),
      fakeFinding('f2', 'rule/b'),
      fakeFinding('f3', 'rule/c'),
    ];
    const baseline = new Set(['f1', 'f3']);

    const filtered = filterByBaseline(findings, baseline);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.finding_id).toBe('f2');
  });

  it('filterByBaseline returns all when baseline empty', () => {
    const findings = [fakeFinding('f1', 'rule/a')];
    const filtered = filterByBaseline(findings, new Set());
    expect(filtered).toHaveLength(1);
  });
});
