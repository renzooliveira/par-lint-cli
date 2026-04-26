import { describe, it, expect } from 'vitest';
import { redundantAriaRule } from './redundant-aria.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('a11y/redundant-aria', () => {
  it('detects redundant role on native elements', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/redundant-aria.component.html');
    const findings = await redundantAriaRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('a11y/redundant-aria');
  });

  it('does not flag clean template', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await redundantAriaRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
