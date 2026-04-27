import { describe, it, expect } from 'vitest';
import { elseAfterReturnRule } from './else-after-return.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('hygiene/else-after-return', () => {
  it('detects else after return', async () => {
    const file = categorizeFile('violations/hygiene/else-after-return.service.ts');
    const findings = await elseAfterReturnRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.message).toContain('else');
  });

  it('does not flag early return pattern', async () => {
    const file = categorizeFile('valid/hygiene/early-return.service.ts');
    const findings = await elseAfterReturnRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
