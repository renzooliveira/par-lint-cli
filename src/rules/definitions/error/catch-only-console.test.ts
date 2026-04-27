import { describe, it, expect } from 'vitest';
import { catchOnlyConsoleRule } from './catch-only-console.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('error/catch-only-console', () => {
  it('flags catch with only console.error/log', async () => {
    const file = categorizeFile('violations/error/catch-only-console.service.ts');
    const findings = await catchOnlyConsoleRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('error/catch-only-console');
  });

  it('passes catch with real handling', async () => {
    const file = categorizeFile('valid/error/handled-catch.service.ts');
    const findings = await catchOnlyConsoleRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
