import { describe, it, expect } from 'vitest';
import { deprecatedInputDecoratorRule } from './deprecated-input-decorator.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/deprecated-input-decorator', () => {
  it('detects @Input() decorator usage', async () => {
    const file = categorizeFile('violations/deprecated-input.component.ts');
    const findings = await deprecatedInputDecoratorRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.rule_id).toBe('component/deprecated-input-decorator');
    expect(findings[0]!.message).toContain('input() signal');
  });

  it('does not flag clean component using inject()', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await deprecatedInputDecoratorRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
