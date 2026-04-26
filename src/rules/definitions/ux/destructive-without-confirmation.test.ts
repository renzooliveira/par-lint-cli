import { describe, it, expect } from 'vitest';
import { destructiveWithoutConfirmationRule } from './destructive-without-confirmation.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('ux/destructive-without-confirmation', () => {
  it('detects delete/remove/destroy without confirmation', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/destructive-no-confirm.component.ts');
    const findings = await destructiveWithoutConfirmationRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('ux/destructive-without-confirmation');
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag clean component', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await destructiveWithoutConfirmationRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
