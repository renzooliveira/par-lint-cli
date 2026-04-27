import { describe, it, expect } from 'vitest';
import { commentedOutCodeRule } from './commented-out-code.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('hygiene/commented-out-code', () => {
  it('flags commented-out code blocks', async () => {
    const file = categorizeFile('violations/hygiene/commented-out-code.service.ts');
    const findings = await commentedOutCodeRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('hygiene/commented-out-code');
  });

  it('passes normal comments', async () => {
    const file = categorizeFile('valid/hygiene/normal-comments.service.ts');
    const findings = await commentedOutCodeRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
