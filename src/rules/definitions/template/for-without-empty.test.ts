import { describe, it, expect } from 'vitest';
import { forWithoutEmptyRule } from './for-without-empty.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('template/for-without-empty', () => {
  it('detects @for without @empty', async () => {
    const file = categorizeFile('violations/template/for-without-empty.component.html');
    const findings = await forWithoutEmptyRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.message).toContain('@empty');
  });

  it('does not flag @for with @empty', async () => {
    const file = categorizeFile('valid/template/for-with-empty.component.html');
    const findings = await forWithoutEmptyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
