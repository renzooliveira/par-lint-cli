import { describe, it, expect } from 'vitest';
import { godFileRule } from './god-file.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('arch/god-file', () => {
  it('detects file with too many functions', async () => {
    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: { 'arch/god-file': { enabled: true, options: { maxLines: 10, maxFunctions: 5, maxExports: 5 } } },
    });

    const file = categorizeFile('violations/god-file.service.ts');
    const findings = await godFileRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('arch/god-file');
    expect(findings[0]!.category).toBe('arch');
  });

  it('does not flag clean component', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await godFileRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
