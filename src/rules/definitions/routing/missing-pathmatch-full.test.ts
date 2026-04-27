import { describe, it, expect } from 'vitest';
import { missingPathmatchFullRule } from './missing-pathmatch-full.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('routing/missing-pathMatch-full', () => {
  it('detects redirectTo without pathMatch', async () => {
    const file = categorizeFile('violations/routing/missing-pathmatch.routes.ts');
    const findings = await missingPathmatchFullRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag correct pathMatch usage', async () => {
    const file = categorizeFile('valid/routing/correct-pathmatch.routes.ts');
    const findings = await missingPathmatchFullRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
