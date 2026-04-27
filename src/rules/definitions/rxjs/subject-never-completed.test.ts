import { describe, it, expect } from 'vitest';
import { subjectNeverCompletedRule } from './subject-never-completed.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('rxjs/subject-never-completed', () => {
  it('detects Subject without .complete()', async () => {
    const file = categorizeFile('violations/rxjs/subject-never-completed.service.ts');
    const findings = await subjectNeverCompletedRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.message).toContain('complete');
  });

  it('does not flag Subject with .complete()', async () => {
    const file = categorizeFile('valid/rxjs/subject-with-complete.service.ts');
    const findings = await subjectNeverCompletedRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
