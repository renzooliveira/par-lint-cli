import { describe, it, expect } from 'vitest';
import { methodCallInTemplateRule } from './method-call-in-template.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('template/method-call-in-template', () => {
  it('detects method calls in interpolations', async () => {
    const file = categorizeFile('violations/template/method-call.component.html');
    const findings = await methodCallInTemplateRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.message).toContain('pipe or computed signal');
  });

  it('does not flag signal reads or pipes', async () => {
    const file = categorizeFile('valid/template/signal-read.component.html');
    const findings = await methodCallInTemplateRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
