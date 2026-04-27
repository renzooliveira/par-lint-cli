import { describe, it, expect } from 'vitest';
import { letReassignmentRule } from './let-reassignment.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('fp/let-reassignment', () => {
  it('detects let with reassignment', async () => {
    const file = categorizeFile('violations/fp/let-reassignment.service.ts');
    const findings = await letReassignmentRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.message).toContain('const');
  });

  it('does not flag const usage', async () => {
    const file = categorizeFile('valid/fp/const-usage.service.ts');
    const findings = await letReassignmentRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
