import { describe, it, expect } from 'vitest';
import { filesNotColocatedRule } from './files-not-colocated.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/files-not-colocated', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects non-colocated templateUrl and styleUrls', async () => {
    const file = categorizeFile('violations/not-colocated.component.ts');
    const findings = await filesNotColocatedRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('component/files-not-colocated');
    expect(findings[0]!.message).toContain('outside component directory');
  });

  it('passes for colocated files', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await filesNotColocatedRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
