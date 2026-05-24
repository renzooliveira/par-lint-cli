import { describe, it, expect, vi } from 'vitest';
import { noRelativeParentBeyondTwoRule } from './no-relative-parent-beyond-two.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn((p: string) => p.includes('tsconfig.json')),
    readFileSync: vi.fn((p: string) => {
      if (p.includes('tsconfig.json'))
        return '{ "compilerOptions": { "paths": { "@app/*": ["src/app/*"] } } }';
      return actual.readFileSync(p, 'utf-8');
    }),
  };
});

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('imports/no-relative-parent-beyond-two', () => {
  it('flags imports with 3+ ../', async () => {
    const file = categorizeFile('violations/imports/deep-relative.service.ts');
    const findings = await noRelativeParentBeyondTwoRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('imports/no-relative-parent-beyond-two');
  });

  it('passes imports with <=2 ../', async () => {
    const file = categorizeFile('valid/imports/shallow-relative.service.ts');
    const findings = await noRelativeParentBeyondTwoRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips entirely when project has no path aliases', async () => {
    const { existsSync } = await import('node:fs');
    vi.mocked(existsSync).mockReturnValueOnce(false);
    const file = categorizeFile('violations/imports/deep-relative.service.ts');
    const findings = await noRelativeParentBeyondTwoRule.run(file, config, '/no-tsconfig');

    expect(findings).toHaveLength(0);
  });
});
