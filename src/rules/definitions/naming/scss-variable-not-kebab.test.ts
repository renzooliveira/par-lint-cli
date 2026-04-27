import { describe, it, expect } from 'vitest';
import { scssVariableNotKebabRule } from './scss-variable-not-kebab.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/scss-variable-not-kebab', () => {
  it('flags non-kebab-case SCSS variables', async () => {
    const file = categorizeFile('violations/naming/bad-scss-vars.component.scss');
    const findings = await scssVariableNotKebabRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('naming/scss-variable-not-kebab');
  });

  it('passes kebab-case SCSS variables', async () => {
    const file = categorizeFile('valid/naming/correct-scss-vars.component.scss');
    const findings = await scssVariableNotKebabRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
