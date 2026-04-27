import { describe, it, expect } from 'vitest';
import { noOverflowHandlingRule } from './no-overflow-handling.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('responsive/no-overflow-handling', () => {
  it('flags white-space: nowrap without overflow handling', async () => {
    const file = categorizeFile('violations/responsive/no-overflow.component.scss');
    const findings = await noOverflowHandlingRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('responsive/no-overflow-handling');
  });

  it('passes when overflow is handled', async () => {
    const file = categorizeFile('valid/responsive/overflow-handled.component.scss');
    const findings = await noOverflowHandlingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
