import { describe, it, expect } from 'vitest';
import { subscribeInServiceRule } from './subscribe-in-service.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('rxjs/subscribe-in-service', () => {
  it('detects .subscribe() in @Injectable service', async () => {
    const file = categorizeFile('violations/rxjs/subscribe-in-service.service.ts');
    const findings = await subscribeInServiceRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('subscribe');
  });

  it('does not flag service returning Observable', async () => {
    const file = categorizeFile('valid/rxjs/service-returns-observable.service.ts');
    const findings = await subscribeInServiceRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
