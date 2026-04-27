import { describe, it, expect } from 'vitest';
import { exhaustiveSwitchRule } from './exhaustive-switch.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('typescript/exhaustive-switch', () => {
  it('detects default with return value', async () => {
    const file = categorizeFile('violations/typescript/non-exhaustive-switch.service.ts');
    const findings = await exhaustiveSwitchRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('assertNever');
  });

  it('does not flag exhaustive switch with assertNever', async () => {
    const file = categorizeFile('valid/typescript/exhaustive-switch.service.ts');
    const findings = await exhaustiveSwitchRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
