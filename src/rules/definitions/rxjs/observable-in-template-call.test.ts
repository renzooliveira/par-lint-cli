import { describe, it, expect } from 'vitest';
import { observableInTemplateCallRule } from './observable-in-template-call.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('rxjs/observable-in-template-call', () => {
  it('flags method() | async in template', async () => {
    const file = categorizeFile('violations/rxjs/observable-in-template.component.html');
    const findings = await observableInTemplateCallRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('rxjs/observable-in-template-call');
  });

  it('passes property$ | async in template', async () => {
    const file = categorizeFile('valid/rxjs/property-async.component.html');
    const findings = await observableInTemplateCallRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
