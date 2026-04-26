import { describe, it, expect } from 'vitest';
import { nonButtonAsButtonRule } from './non-button-as-button.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('a11y/non-button-as-button', () => {
  it('detects non-button elements with click handlers', async () => {
    const file = categorizeFile('violations/missing-a11y.component.html');
    const findings = await nonButtonAsButtonRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('a11y/non-button-as-button');
    expect(findings[0]!.message).toContain('non-interactive element');
  });

  it('does not flag button elements', async () => {
    const file = categorizeFile('valid/clean.component.html');
    const findings = await nonButtonAsButtonRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
