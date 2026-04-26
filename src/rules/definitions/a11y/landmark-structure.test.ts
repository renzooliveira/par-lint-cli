import { describe, it, expect } from 'vitest';
import { landmarkStructureRule } from './landmark-structure.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('a11y/landmark-structure', () => {
  it('flags page without landmark elements', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/no-landmarks.page.html');
    const findings = await landmarkStructureRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('a11y/landmark-structure');
    expect(findings[0]!.severity).toBe('warning');
  });

  it('passes when page has landmarks', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/with-landmarks.page.html');
    const findings = await landmarkStructureRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
