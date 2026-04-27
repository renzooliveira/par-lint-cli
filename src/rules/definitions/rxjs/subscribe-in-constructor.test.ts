import { describe, it, expect } from 'vitest';
import { subscribeInConstructorRule } from './subscribe-in-constructor.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('rxjs/subscribe-in-constructor', () => {
  it('flags .subscribe() in constructor', async () => {
    const file = categorizeFile('violations/rxjs/subscribe-in-constructor.component.ts');
    const findings = await subscribeInConstructorRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('rxjs/subscribe-in-constructor');
  });

  it('passes .subscribe() in ngOnInit', async () => {
    const file = categorizeFile('valid/rxjs/subscribe-in-oninit.component.ts');
    const findings = await subscribeInConstructorRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
