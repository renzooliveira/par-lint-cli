import { describe, it, expect } from 'vitest';
import { redundantLambdaRule } from './redundant-lambda.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('fp/redundant-lambda', () => {
  it('detects (x) => fn(x) pattern', async () => {
    const file = categorizeFile('violations/fp/redundant-lambda.service.ts');
    const findings = await redundantLambdaRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.message).toContain('directly');
  });

  it('does not flag direct references', async () => {
    const file = categorizeFile('valid/fp/direct-reference.service.ts');
    const findings = await redundantLambdaRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
