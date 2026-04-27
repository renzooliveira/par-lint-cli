import { describe, it, expect } from 'vitest';
import { imperativeLoopRule } from './imperative-loop.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('fp/imperative-loop', () => {
  it('detects for loop with push/accumulate', async () => {
    const file = categorizeFile('violations/fp/imperative-loop.service.ts');
    const findings = await imperativeLoopRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.message).toContain('map()');
  });

  it('does not flag declarative code', async () => {
    const file = categorizeFile('valid/fp/declarative-loop.service.ts');
    const findings = await imperativeLoopRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
