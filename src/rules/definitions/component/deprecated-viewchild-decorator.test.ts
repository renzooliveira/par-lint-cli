import { describe, it, expect } from 'vitest';
import { deprecatedViewchildDecoratorRule } from './deprecated-viewchild-decorator.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/deprecated-viewchild-decorator', () => {
  it('detects @ViewChild decorator', async () => {
    const file = categorizeFile('violations/component/deprecated-viewchild.component.ts');
    const findings = await deprecatedViewchildDecoratorRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('viewChild()');
  });

  it('does not flag clean component', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await deprecatedViewchildDecoratorRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
