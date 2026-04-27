import { describe, it, expect } from 'vitest';
import { signalReadAfterAwaitRule } from './signal-read-after-await.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('signals/signal-read-after-await', () => {
  it('flags signal read after await in effect', async () => {
    const file = categorizeFile('violations/signals/signal-read-after-await.component.ts');
    const findings = await signalReadAfterAwaitRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('signals/signal-read-after-await');
  });

  it('passes synchronous signal reads in effect', async () => {
    const file = categorizeFile('valid/signals/signal-read-before-await.component.ts');
    const findings = await signalReadAfterAwaitRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
