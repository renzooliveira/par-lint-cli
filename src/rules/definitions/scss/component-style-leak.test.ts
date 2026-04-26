import { describe, it, expect } from 'vitest';
import { componentStyleLeakRule } from './component-style-leak.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('scss/component-style-leak', () => {
  it('detects ::ng-deep in component SCSS', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/style-leak.component.scss');
    const findings = await componentStyleLeakRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('scss/component-style-leak');
    expect(findings[0]!.message).toContain('ng-deep');
  });

  it('does not flag clean SCSS', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.scss');
    const findings = await componentStyleLeakRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
