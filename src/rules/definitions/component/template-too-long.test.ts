import { describe, it, expect } from 'vitest';
import { templateTooLongRule } from './template-too-long.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/template-too-long', () => {
  it('detects long template', async () => {
    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: { 'component/template-too-long': { enabled: true, options: { maxLines: 50 } } },
    });

    const file = categorizeFile('violations/long-template.component.html');
    const findings = await templateTooLongRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('component/template-too-long');
    expect(findings[0]!.message).toContain('Template too long');
  });

  it('does not flag short template', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await templateTooLongRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
