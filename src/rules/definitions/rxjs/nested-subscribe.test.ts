import { describe, it, expect } from 'vitest';
import { nestedSubscribeRule } from './nested-subscribe.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('rxjs/nested-subscribe', () => {
  it('flags nested .subscribe() calls', async () => {
    const file = categorizeFile('violations/rxjs/nested-subscribe.service.ts');
    const findings = await nestedSubscribeRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('rxjs/nested-subscribe');
  });

  it('passes flat subscribe with operators', async () => {
    const file = categorizeFile('valid/rxjs/flat-subscribe.service.ts');
    const findings = await nestedSubscribeRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
