import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileCache } from './cache.js';
import type { Finding } from '../types/finding.js';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { readFile, writeFile } from 'node:fs/promises';

const mockedRead = vi.mocked(readFile);
const mockedWrite = vi.mocked(writeFile);

function fakeFinding(file: string): Finding {
  return {
    finding_id: 'f1',
    rule_id: 'test/rule',
    rule_version: '1.0',
    file,
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

describe('FileCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for uncached file', async () => {
    mockedRead.mockRejectedValue(new Error('ENOENT'));
    const cache = new FileCache('/fake/.par-lint/cache.json');
    await cache.load();

    const result = cache.lookup('src/app.ts', 'abc123');
    expect(result).toBeNull();
  });

  it('returns cached findings when hash matches', async () => {
    const cached = {
      version: '1.0',
      entries: {
        'src/app.ts': {
          hash: 'abc123',
          findings: [fakeFinding('src/app.ts')],
        },
      },
    };
    mockedRead.mockResolvedValue(JSON.stringify(cached) as any);

    const cache = new FileCache('/fake/.par-lint/cache.json');
    await cache.load();

    const result = cache.lookup('src/app.ts', 'abc123');
    expect(result).toHaveLength(1);
    expect(result?.[0]?.file).toBe('src/app.ts');
  });

  it('returns null when hash differs', async () => {
    const cached = {
      version: '1.0',
      entries: {
        'src/app.ts': {
          hash: 'old-hash',
          findings: [fakeFinding('src/app.ts')],
        },
      },
    };
    mockedRead.mockResolvedValue(JSON.stringify(cached) as any);

    const cache = new FileCache('/fake/.par-lint/cache.json');
    await cache.load();

    const result = cache.lookup('src/app.ts', 'new-hash');
    expect(result).toBeNull();
  });

  it('stores and retrieves findings', async () => {
    mockedRead.mockRejectedValue(new Error('ENOENT'));
    const cache = new FileCache('/fake/.par-lint/cache.json');
    await cache.load();

    cache.store('src/app.ts', 'hash1', [fakeFinding('src/app.ts')]);

    const result = cache.lookup('src/app.ts', 'hash1');
    expect(result).toHaveLength(1);
  });

  it('save writes JSON to disk', async () => {
    mockedRead.mockRejectedValue(new Error('ENOENT'));
    const cache = new FileCache('/fake/.par-lint/cache.json');
    await cache.load();

    cache.store('src/app.ts', 'h1', []);
    await cache.save();

    expect(mockedWrite).toHaveBeenCalledOnce();
    const written = JSON.parse(mockedWrite.mock.calls[0]![1] as string);
    expect(written.entries['src/app.ts'].hash).toBe('h1');
  });

  it('invalidates cache when rules version changes', async () => {
    const cached = {
      version: 'old-rules-version',
      entries: {
        'src/app.ts': {
          hash: 'abc123',
          findings: [fakeFinding('src/app.ts')],
        },
      },
    };
    mockedRead.mockResolvedValue(JSON.stringify(cached) as any);

    const cache = new FileCache('/fake/.par-lint/cache.json', 'new-rules-version');
    await cache.load();

    const result = cache.lookup('src/app.ts', 'abc123');
    expect(result).toBeNull();
  });
});
