import { describe, it, expect } from 'vitest';
import { deprecatedImportRule } from './deprecated-import.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('scss/deprecated-import', () => {
  it('detects @import usage', async () => {
    const file = categorizeFile('violations/scss/deprecated-import.component.scss');
    const findings = await deprecatedImportRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(3);
    expect(findings[0]!.message).toContain('@use');
  });

  it('does not flag @use/@forward', async () => {
    const file = categorizeFile('valid/scss/use-forward.component.scss');
    const findings = await deprecatedImportRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
