import { describe, it, expect } from 'vitest';
import { deprecatedOutputDecoratorRule } from './deprecated-output-decorator.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/deprecated-output-decorator', () => {
  it('detects @Output() decorator usage', async () => {
    const file = categorizeFile('violations/deprecated-output.component.ts');
    const findings = await deprecatedOutputDecoratorRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.rule_id).toBe('component/deprecated-output-decorator');
    expect(findings[0]!.message).toContain('output()');
  });

  it('does not flag clean component', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await deprecatedOutputDecoratorRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
