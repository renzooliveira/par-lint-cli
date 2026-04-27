import { describe, it, expect } from 'vitest';
import { specFileMissingRule } from './spec-file-missing.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/spec-file-missing', () => {
  it('flags service file without corresponding spec', async () => {
    const file = categorizeFile('violations/naming/reserved-words.service.ts');
    const findings = await specFileMissingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('naming/spec-file-missing');
    expect(findings[0]!.message).toContain('.spec.ts');
  });

  it('skips spec files themselves', async () => {
    const file = categorizeFile('some-thing.spec.ts');
    const findings = await specFileMissingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips non-testable files', async () => {
    const file = categorizeFile('some-file.model.ts');
    const findings = await specFileMissingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips non-ts files', async () => {
    const file = categorizeFile('styles.scss');
    const findings = await specFileMissingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
